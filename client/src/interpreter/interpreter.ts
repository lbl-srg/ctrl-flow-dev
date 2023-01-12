import { resolvePath } from "react-router-dom";
import Config, { ConfigInterface } from "../../src/data/config";
import Template, {
  TemplateInterface,
  OptionInterface,
} from "../../src/data/template";
import { Modifiers } from "../../src/utils/modifier-helpers";

/**
 * TODO:
 * - [X] Integrate configuration when building modifiers
 * - [X] Integrate context with mod builder! Needed to correctly evaulate expressions in mod builder!
 * - [ ] integrate choice modifiers with mod builder
 * - [ ] Add a whole lot more tests for expression with context. This is where the bugs are
 * - [ ] integrate scope! what this means: every place we resolve an instance path: pop off the last segment of scope and try again until out of segments
 * - [ ] map option instances to a valid flatoption/flat option group list
 * in an instance path, e.g. try in this order ["my.fancy.path", "my.path", "path"]
 * - (?) partial resolved expressions must be handled (if something gets returned as an expression).
 * An approach:
 * - iterate through mod object and attempt to resolve each one. Store in _resolvedMods, keep track of how many are resolved
 * - getValue: add initial attempt at fetching value from '_resolveMods'
 * - Re-iterate through
 */

export type Literal = boolean | string | number;

export type Expression = {
  operator: string;
  operands: Array<Literal | Expression>;
};

function isExpression(item: any): boolean {
  return !!item?.operator;
}

const allElementsEqual = (arr: any[]) =>
  !!arr.reduce((a: any, b: any) => (Object.is(a, b) ? a : NaN));

const constructSelectionPath = (optionPath: string, instancePath: string) =>
  `${optionPath}-${instancePath}`;

/**
 * Generates all potential paths given another path and a current scope
 *
 * e.g.
 *
 * if scope is a.b
 * and path c.d
 *
 * This function generates: ['a.b.c.d', 'a.c.d', 'c.d']
 *
 */
function createPossiblePaths(scope: string, path: string) {
  const segments = scope.split(".");
  const paths = [];
  while (segments.length > 0) {
    paths.push([segments.join("."), path].filter((p) => p !== "").join("."));
    segments.pop();
  }

  return paths;
}

///////////////// Traversal

/**
 * Update path based on path modifiers
 *
 * e.g. if we have a path mod of 'ctl.secOutRel' -> 'secOutRel'
 *
 * The path 'ctl.secOutRel.typ' become 'secOutRel.typ'
 */
export function applyPathModifiers(
  path: string,
  pathModifiers: { [key: string]: string | undefined } | undefined,
): string {
  if (!pathModifiers) {
    return path;
  }
  const splitScopePath = path.split(".");
  let postFix: string | undefined = "";
  let modifiedPath = path;

  while (splitScopePath.length > 0) {
    const testPath = splitScopePath.join(".");
    if (pathModifiers[testPath]) {
      modifiedPath = `${pathModifiers[testPath]}.${postFix}`;
      break;
    }
    postFix = postFix
      ? `${postFix}.${splitScopePath.pop()}`
      : splitScopePath.pop();
  }

  return modifiedPath;
}

/**
 * Given an instance path and context, knows how to find the original option by
 * applying path modifiers, selections, and modifiers (redeclares)
 *
 * @param instancePath // it is assumed that scope is already applied to this path!
 * @param context
 */
const _instancePathToOption = (
  instancePath: string,
  context: ConfigContext,
): string => {
  // apply path modifiers
  // when traversing at each node check for a redeclare mod/selection mod
  // selection mod trumps redeclare... it should also never happend
  const path = applyPathModifiers(instancePath, context.template.pathModifiers);

  // an example path could be a.b.c.
  // the path is split, and each type is swapped in
  // e.g. AType.b, Btype.c <-- note AType and Btype could be dynamically swapped
  // by selections or redeclare mods! We have to check at each map to an option
  const pathSegments = path.split(".");

  let curInstancePath = [pathSegments.shift()]; // keep track of instance path for modifiers
  let curPath = `${context.template.modelicaPath}.${
    curInstancePath[curInstancePath.length - 1]
  }`;
  while (curInstancePath && pathSegments.length > 0) {
    let option: OptionInterface | null = null;
    // Option swap #1: selections
    // check if there is a selected path that specifies that option at
    // this instance path
    if (context.config?.selections) {
      Object.entries(context.config.selections).map(([key, value]) => {
        const [optionPath, instancePath] = key.split("-");
        if (instancePath === curInstancePath.join(".")) {
          option = context.options[value];
        }
      });
    }

    // Option swap #2: redeclare modifiers
    // check if there is a modifier for the current instance path
    if (!option) {
      const instanceMod = context.mods[curInstancePath.join(".")];
      // resolve mod if present
      if (instanceMod) {
        const resolvedValue = evaluate(instanceMod.expression, context);
        // resolveValue should always be a 'string', but just go ahead and check
        option =
          typeof resolvedValue === "string"
            ? context.options[resolvedValue]
            : option;
      }
    }

    // Otherwise - do the normal thing and attempt to find the instance type
    // by looking in options
    if (!option) {
      // otherwise just attempt to grab nor
      const paramOption = context.options[curPath];
      if (!paramOption) {
        break; // PUNCH-OUT!
      } else {
        option = context.options[paramOption.type];
      }
    }

    const paramName = pathSegments.shift();
    curInstancePath.push(paramName);
    // use the options child list to get the correct type - inherited types
    // are only correctly referenced through this list
    curPath = option.options?.find(
      (o) => o.split(".").pop() === paramName,
    ) as string;
  }

  return curPath;
};

// This is a hack to determine modelica paths
// The backend expands all relative paths every 'option' path should begin with 'Modelica'
// 'Modelica' or 'Buildings' it is a modelica path. Instance paths
// look like 'ctl.have_CO2Sen'
function isModelicaPath(path: string) {
  // pop off each segment of the path from first to last
  // if the segment is a definition, keep going popping
  return path.startsWith("Modelica") || path.startsWith("Buildings");
}

/**
 * Resolves the provided path using scope to correct
 * instance path, and the original option definition
 *
 * @param path
 * @param context
 * @param scope
 * @returns { optionPath: string | null; instancePath: string }
 */
export function resolvePaths(
  path: string,
  context: ConfigContext,
  scope = "",
): { optionPath: string | null; instancePath: string } {
  const pathList = createPossiblePaths(scope, path);
  for (const path of pathList) {
    const val = _instancePathToOption(path, context);
    if (val) {
      return { optionPath: val, instancePath: path };
    }
  }

  return { optionPath: null, instancePath: path };
}

///////////////// Expression Evaluation
type Comparator = ">" | ">=" | "<" | "<=";
export type OperatorType =
  | "none"
  | "=="
  | "!="
  | "&&"
  | "if_elseif"
  | "if"
  | "else_if"
  | "else"
  | Comparator;

/**
 * Resolve something to its value/type, dealing with Literals
 * and expressions
 *
 * If there is a string, it will get fed back to 'getValue'
 */
export const resolveToValue = (
  operand: Literal | Expression,
  context?: ConfigContext,
  scope: string = "",
): Literal | null | undefined | Expression => {
  let value: any = null;

  if (["number", "boolean"].includes(typeof operand)) {
    return evaluate(operand);
  }

  if (typeof operand === "string" && !context) {
    return operand;
  }

  const _context = context as ConfigContext;

  if (typeof operand === "string") {
    if (isModelicaPath(operand)) {
      const option = _context.options[operand];
      if (option.definition) {
        return operand;
      } else {
        // Update the operand with just the param name
        const name = operand.split(".").pop() as string;
        operand = name;
      }
    }
    const { instancePath, optionPath } = resolvePaths(operand, _context, scope);

    // have the actual instance path, check for cached value
    value = _context._getCachedValue(instancePath);
    if ((value === undefined || value === null) && optionPath) {
      const typeOption = _context.options[optionPath];
      if (typeOption?.definition) {
        value = typeOption.modelicaPath;
      } else {
        const potentialExpression = typeOption?.value;
        value = evaluate(potentialExpression, context, scope);
      }
    } else {
      // assume operand is just a string - this is a buggy assumption
      value = operand;
    }
  }

  return value;
};

/**
 * For a given expression, attempts to return the value
 *
 * @param context
 * @param expression
 */
export const evaluate = (
  possibleExpression: Expression | Literal | null | undefined,
  context?: ConfigContext,
  scope?: string,
) => {
  if (!isExpression(possibleExpression)) {
    return possibleExpression; // already a constant
  }

  const expression = possibleExpression as Expression;

  let val: Literal | null | Expression | undefined = null;

  switch (expression.operator) {
    case "none":
      val = resolveToValue(expression.operands[0] as Literal, context, scope);
      break;
    case "<":
    case "<=":
    case ">":
    case ">=":
      const comparators: { [key: string]: (x: any, y: any) => any } = {
        "<": (x: any, y: any) => x < y,
        "<=": (x: any, y: any) => x <= y,
        ">": (x: any, y: any) => x > y,
        ">=": (x: any, y: any) => x >= y,
      };

      let resolvedOperands = expression.operands.map((o) =>
        resolveToValue(o, context, scope),
      );
      val = comparators[expression.operator](
        resolvedOperands[0],
        resolvedOperands[1],
      ) as Literal;

      break;
    case "==":
    case "!=":
      resolvedOperands = expression.operands.map((o) =>
        resolveToValue(o, context, scope),
      );
      const isEqual = allElementsEqual(resolvedOperands);
      val = expression.operator.includes("!") ? !isEqual : isEqual;
      break;
    case "||":
      val = expression.operands.reduce(
        (acc, cur) => !!(evaluate(cur, context, scope) || acc),
        false,
      );
      break;
    case "&&":
      val = expression.operands.reduce(
        (acc, cur) => !!(evaluate(cur, context, scope) && acc),
        true,
      );
  }

  return val;
};

///////////////// Modifier helpers

const addToModObject = (
  newMods: { [key: string]: { expression: Expression; final: boolean } },
  baseInstancePath: string,
  mods: { [key: string]: { expression: Expression; final: boolean } },
  options: { [key: string]: OptionInterface },
  recursive = true,
) => {
  Object.entries(newMods).forEach(([k, mod]) => {
    const instanceName = k.split(".").pop();
    const modKey = [baseInstancePath, instanceName]
      .filter((segment) => segment !== "")
      .join(".");

    // Do not add a key that is already present. The assumption is that
    // the first time an instance path is present is the most up-to-date
    if (!(modKey in mods)) {
      if (modKey === "ctl.have_CO2Sen") {
        const a = 1;
      }
      mods[modKey] = mod;
    }

    if (recursive) {
      // grab modifiers from original definition
      const modOption = options[k];
      if (modOption?.modifiers) {
        addToModObject(newMods, baseInstancePath, mods, options, false);
      }
    }
  });
};

/**
 * The type of a replaceable option can be made either by:
 * - a selection
 * - a redeclare
 *
 * This is a small helper method that checks for either of those instances
 *
 * @param instancePath
 * @param mods
 * @param config
 */
const getReplaceableType = (
  instancePath: string,
  option: OptionInterface,
  mods: { [key: string]: { expression: Expression; final: boolean } },
  config: ConfigInterface,
) => {
  // check if there is a selection for this option, if so use
  const selectionPath = constructSelectionPath(
    option.modelicaPath,
    instancePath,
  );
  const selectionType = config.selections
    ? config.selections[selectionPath]
    : null;
  // check if there is a modifier for this option, if so use it:
  if (selectionType) {
    return selectionType;
  }

  const redeclaredType = instancePath in mods ? mods[instancePath] : null;
  if (redeclaredType) {
    return evaluate(redeclaredType.expression); // TODO: We need context to correctly evaluate!
  }

  return option.type;
};

// recursive helper method that traverses options grabbing modifiers
// TODO: config selections must be integrated to correctly build this list
const buildModsHelper = (
  option: OptionInterface,
  baseInstancePath: string,
  mods: { [key: string]: { expression: Expression; final: boolean } },
  options: { [key: string]: OptionInterface },
  config: ConfigInterface,
) => {
  if (option === undefined) {
    return; // TODO: not sure this should be allowed - failing with 'Medium'
  }
  // always check the config for a selection
  const optionMods = option.modifiers as {
    [key: string]: { expression: Expression; final: boolean };
  };
  const childOptions = option.options;
  if (
    option.modelicaPath ===
    "Buildings.Templates.AirHandlersFans.Components.Controls.G36VAVMultiZone.ctl"
  ) {
    const a = 1;
  }
  const name = option.modelicaPath.split(".").pop();
  const newBase = option.definition
    ? baseInstancePath
    : [baseInstancePath, name].filter((p) => p !== "").join(".");
  // grab the current options modifiers
  if (optionMods) {
    // use updated 'base' path - modifiers are oriented around
    addToModObject(optionMods, newBase, mods, options);
  }

  // if this is a definition - visit all child options and grab modifiers
  if (childOptions) {
    if (option.definition) {
      childOptions.map((path) => {
        const childOption = options[path];
        buildModsHelper(childOption, newBase, mods, options, config);
      });
    } else {
      // TODO: use instanceToOption to get replaceable type!
      // getReplaceableType is redundant (or just getValue)
      const typeOptionPath = option.replaceable
        ? getReplaceableType(newBase, option, mods, config)
        : option.type;

      const typeOption = options[typeOptionPath as string]; // TODO: remove this cast
      if (typeOption && typeOption.options) {
        // add modifiers from type option
        if (typeOption.modifiers) {
          addToModObject(typeOption.modifiers, newBase, mods, options);
        }
        typeOption.options.map((path) => {
          const childOption = options[path];

          buildModsHelper(childOption, newBase, mods, options, config);
        });
      }
    }
  }
};

const buildMods = (
  startOption: OptionInterface,
  config: ConfigInterface,
  options: { [key: string]: OptionInterface },
) => {
  const mods: { [key: string]: { expression: Expression; final: boolean } } =
    {};

  buildModsHelper(startOption, "", mods, options, config);

  return mods;
};

// Cache for initial template values
const _initModCache: { [key: string]: Modifiers } = {};

///////////////// Context Manager
// Format convenient for displaying
interface OptionInstance {
  value: Literal | null | undefined; // NOT an expression
  display: boolean;
}
/**
 * Generating context for a given template and config
 */

/**
 * This generates a context that can be queried for values using
 * an instance path
 *
 * When generating the display option list, we need to be able to resolve:
 * - displayed option's initial value
 * - is the option enabled
 * - is the option visible
 */
export class ConfigContext {
  mods: Modifiers = {};
  _resolvedValues: { [key: string]: Literal | null } = {};

  constructor(
    public template: TemplateInterface,
    public config: ConfigInterface,
    public options: { [key: string]: OptionInterface },
  ) {
    if (template.modelicaPath in _initModCache) {
      this.mods = _initModCache[template.modelicaPath];
    } else {
      // calculate intial mods without selections
      this.mods = buildMods(
        this.options[template.modelicaPath],
        this.config,
        this.options,
      );
      // stash in cache
    }

    // update modifier tree with selections
  }

  /**
   *
   * Attempts to get a string or variable reference to a value
   *
   * When given 'a.b' it should get the instance a, and the value
   * assigned at 'b'
   *
   * TODO: handle interaction with resolved value cache as well
   *
   * path can be either:
   *  - a modelica path
   *  - a modifier path that needs to be combined with scope in
   *    some way to form an instance path
   *  - an instance path
   * A value or null is returned when an instance path is provided
   *
   * This value CAN return an expression
   *
   * A null instance path means the value cannot be resolved
   * @param path
   */
  getValue(path: string, scope = ""): Literal | Expression | null | undefined {
    let val = null;
    let optionPath: string | null = "";
    let instancePath = path;

    if (isModelicaPath(path)) {
      const option = this.options[path];
      if (option.definition) {
        return path;
      }
      optionPath = path;
    } else {
      // instance path to
      const paths = resolvePaths(path, this, scope);
      optionPath = paths.optionPath;
      instancePath = paths.instancePath;
    }

    if (!optionPath) {
      return null; // PUNCH-OUT! TODO:... may not be the correct behavior
    }

    const selectionPath = constructSelectionPath(optionPath, instancePath);
    // check selections
    if (this.config.selections && selectionPath in this.config.selections) {
      return this.config.selections[selectionPath];
    }

    // check modifiers
    // TODO: what if the value is explicitly null? How to distinguish?
    // instancePath can be a modelicaPath
    val = evaluate(this.mods[instancePath]?.expression, this, scope);
    if (val) {
      return val;
    }

    // return whatever value is present on the original option definition
    val = evaluate(this.options[optionPath]?.value, this, scope);

    return val;
  }

  /**
   * This method assumes we have an exact instance path! No path
   * resolving occurs in this method with scope
   */
  _getCachedValue(path: string): Literal | null | undefined {
    return this._resolvedValues[path];
  }

  // outputs an option with 'instance data' baked into the value along
  // with 'display' logic baked in as well
  getOptionInstance(path: string, scope = ""): OptionInstance {
    const { instancePath, optionPath } = resolvePaths(path, this, scope);

    let value = this.getValue(instancePath);
    let display = false;

    // option instances do not get expressions assigned
    if (isExpression(value)) {
      value = undefined;
    }

    const castValue = value as Literal | null | undefined;
    const optionInstance = {
      value: castValue,
      display,
    };

    const mod = this.mods[instancePath];
    const final = mod?.final !== undefined ? mod.final : false;
    if (final) {
      return optionInstance; // punch-out, we got what we need
    }
    const option = this.options[optionPath as string]; // TODO: not sure optionPath should ever be null

    // TODO: I think I'll need to iterate through

    // 'scope' in this case is the current instance path's scope, which
    // is one level up.
    // e.g.
    // You have the following definition
    // Class A
    //     param b
    //        enable = 'c === true'
    //     param c = true
    //
    // To understand the 'enable' expression with a reference to 'c',
    // found at the instance path 'b', we have to pop 'b' off  'c'
    // (instead of attemptint to find 'c' in the scope of 'b')
    const enable = evaluate(
      option.enable,
      this,
      instancePath.split(".").slice(0, -1).join("."),
    );
    display = !isExpression(enable) ? !!enable : display;
    display = !!(display && option.visible);

    return {
      value: castValue,
      display,
    };
  }

  getOptionFinal(instancePath: string, scope = "") {
    // TODO: integrate scope popping!
    const { final } = this.mods[instancePath];
    return final;
  }

  /**
   * Gets the instance path value and 'final' (is it like a const)
   *
   * This method does NOT return an expression for values, just undefined
   * if unresolved
   * @param instancePath
   */
  getValueAndFinal(instancePath: string): {
    value: Literal | null | undefined;
    final: boolean;
  } {
    let value = this.getValue(instancePath);
    if (isExpression(value)) {
      value = undefined;
    }
    const castValue = value as Literal | null | undefined;
    // TODO: check resolved values here
    const { final } = this.mods[instancePath];
    return { value: castValue, final };
  }

  getRootOption() {
    return this.options[this.template.modelicaPath];
  }
}

///////////////// Display Option List Mapper
export interface FlatConfigOptionGroup {
  groupName: string;
  selectionPath: string;
  items: (FlatConfigOptionGroup | FlatConfigOption)[];
}

export interface FlatConfigOption {
  parentModelicaPath: string;
  modelicaPath: string;
  name: string;
  choices?: OptionInterface[];
  booleanChoices?: string[];
  value: any;
  scope: string;
  selectionType: string;
}

export interface FlatConfigOptionChoice {
  modelicaPath: string;
  name: string;
}

function isOptionVisible(
  option: OptionInterface,
  scope: string,
  context: ConfigContext,
) {
  const enable = evaluate(option.enable, context);
  return enable;
}

function _getDisplayOptionsHelper(
  option: OptionInterface,
  scope: string,
  context: ConfigContext,
  groupName: string = "",
): FlatConfigOptionGroup | FlatConfigOption | undefined {
  // does the context have a value for the current instance path?
  const instancePath = [scope, option.modelicaPath.split(".").pop()]
    .filter((p) => p !== "")
    .join(".");

  const { value, final } = context.getValueAndFinal(instancePath);

  // 'dat' params should be separated but just in case, drop out here
  if (option.modelicaPath.includes(`.dat`)) {
    return;
  }
  // if so use that as the value value
  // TODO: need to integrate final
  // is that value final? If so set visible to false
  // Format into the correct 'FlatConfigOpiton' format

  // Next: doing the recursive dive into the next option
  // recursive dive into next option:
  // use context value to find the type
  // Perhaps do something to make the group? Maybe a separate method?
  // go through each option: option.options.map(o => _getDisplayOptionsHelper(o, scope + param, context, param description)
}

// Maps a current context into a list of displayable options
export function getDisplayOptions(context: ConfigContext) {
  let displayOptions: (FlatConfigOptionGroup | FlatConfigOption)[] = [];
  const scope = ""; // keeps track of current scope location

  const rootOption = context.getRootOption();

  return displayOptions;
}
