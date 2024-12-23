import { ConfigInterface } from "../../src/data/config";
import { TemplateInterface, OptionInterface } from "../../src/data/template";
import { removeEmpty } from "../../src/utils/utils";

export type Literal = boolean | string | number;

export interface ConfigValues {
  [key: string]: string;
}

export type Expression = {
  operator: string;
  operands: Array<Literal | Expression>;
};

function isExpression(item: any): boolean {
  return !!item?.operator;
}

const allElementsEqual = (arr: any[]) =>
  !!arr.reduce((a: any, b: any) => (Object.is(a, b) ? a : NaN));

export const constructSelectionPath = (
  optionPath: string,
  instancePath: string,
) => {
  // TODO: datAll params should follow other params in how we write them
  // but it doesn't
  return optionPath.includes("Buildings.Templates.Data.AllSystems")
    ? optionPath
    : `${optionPath}-${instancePath}`;
};

interface Modifier {
  expression: Expression;
  final: boolean;
  fromClassDefinition: boolean;
  redeclare: boolean;
}

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

  // TODO: this can cause duplicates if scope is '' - a check can probably be done before the while loop
  paths.push(path);

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
      modifiedPath = [pathModifiers[testPath], postFix]
        .filter((p) => p !== "")
        .join(".");
      break;
    }
    postFix = postFix
      ? [postFix, splitScopePath.pop()].filter((p) => p === "").join(".")
      : splitScopePath.pop();
  }
  return modifiedPath;
}

/**
 * Given an instance path and context, find the original option by
 * applying inner/outer associations (path modifiers), selections,
 * redeclares (which are stored in modifiers)
 *
 * Keep all traversal logic in here
 *
 * Messy brain method that needs to be refactored
 *
 * @param instancePath // it is assumed that scope is already applied to this path!
 * @param context
 */
const _instancePathToOption = (
  instancePath: string,
  context: ConfigContext,
  applyPathMods = true,
): {
  optionPath: string | null | undefined;
  instancePath: string;
  outerOptionPath: string | null | undefined;
} => {
  const modifiedPath = applyPathMods
    ? applyPathModifiers(instancePath, context.template.pathModifiers)
    : instancePath;
  let outerOptionPath = null;
  if (modifiedPath !== instancePath) {
    const outerPaths = _instancePathToOption(instancePath, context, false);
    outerOptionPath = outerPaths?.optionPath;
  }

  const pathSegments = modifiedPath.split(".");
  const curInstancePathList = [pathSegments.shift()]; // keep track of instance path for modifiers
  let curOptionPath: string | null | undefined =
    `${context.template.modelicaPath}.${curInstancePathList[0]}`;
  if (pathSegments.length === 0) {
    // special case: original type definition should be defined
    const rootOption = context.getRootOption();
    const foundOption = rootOption.options?.find((childPath) =>
      childPath.endsWith(modifiedPath),
    );
    curOptionPath = foundOption ? foundOption : curOptionPath;
  }

  while (curInstancePathList && pathSegments.length > 0) {
    let option: OptionInterface | null = null;
    // Option swap #1: selections
    // check if there is a selected path that specifies that option at
    // this instance path
    if (context.config?.selections) {
      Object.entries(context.selections).map(([key, value]) => {
        const [, instancePath] = key.split("-");
        if (instancePath === curInstancePathList.join(".")) {
          option = context.options[value];
        }
      });
    }

    // get the original option for reference

    // Option swap #2: redeclare modifiers
    // check if there is a modifier for the current instance path
    if (!option) {
      const curInstancePath = curInstancePathList.join(".");
      const instanceMod = context.mods[curInstancePath];
      // resolve mod if present
      if (instanceMod) {
        const resolvedValue = evaluateModifier(
          instanceMod,
          context,
          curInstancePath,
        );
        if (typeof resolvedValue === "string" && instanceMod.redeclare) {
          const potentialOption = context.options[resolvedValue as string];
          option = potentialOption ? potentialOption : option;
        }
      }
    }

    // special 'datAll' case
    if (
      curOptionPath !== undefined &&
      !option &&
      curOptionPath.endsWith("datAll")
    ) {
      option = context.options["Buildings.Templates.Data.AllSystems"];
    }

    // Otherwise - do the normal thing and attempt to find the instance type
    // by looking in options
    if (!option && curOptionPath) {
      const paramOption = context.options[curOptionPath];

      if (!paramOption) {
        break; // PUNCH-OUT!
      } else {
        option = context.options[paramOption.type];
        if (option === undefined) {
          curOptionPath = null;
          break;
        }
      }
    }

    // For short classes, the actual instance is within the options
    // of the type assigned to the short class identifier.
    // (If this type is modified by the user selection, this has already been caught by
    // the selection check above.)
    if (option?.shortExclType) {
      option = context.options[option?.value as string];
    }

    if (pathSegments.length === 0) {
      break;
    }

    const paramName = pathSegments.shift();
    curInstancePathList.push(paramName);

    // use the options child list to get the correct type - inherited types
    // are only correctly referenced through this list
    curOptionPath = option?.options?.find(
      (o) => o.split(".").pop() === paramName,
    ) as string;

    if (pathSegments.length === 0) {
      // bottoming out - set a default path
      if (!curOptionPath) {
        curOptionPath = pathSegments.length === 0 ? option?.modelicaPath : null;
      }
      break;
    }
  }

  return {
    optionPath: curOptionPath,
    instancePath: modifiedPath,
    outerOptionPath,
  };
};

// This is a hack to determine modelica paths
// The backend expands all relative paths every 'option' path should begin with 'Modelica'
// 'Modelica' or 'Buildings' it is a modelica path
function isModelicaPath(path: string) {
  return path.startsWith("Modelica") || path.startsWith("Buildings");
}

/**
 * Resolves the provided path using scope to correct
 * instance path, and the original option definition
 *
 * This creates the behavior of popping off scope to check
 * for a variable reference
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
): {
  optionPath: string | null;
  instancePath: string;
  outerOptionPath: string | null | undefined;
} {
  const pathList = createPossiblePaths(scope, path);
  for (const p of pathList) {
    const paths = _instancePathToOption(p, context);
    if (paths.optionPath && paths.instancePath) {
      return {
        optionPath: paths.optionPath,
        instancePath: paths.instancePath,
        outerOptionPath: paths.outerOptionPath,
      };
    }
  }
  return { optionPath: null, instancePath: path, outerOptionPath: null };
}

///////////////// Expression Evaluation
type Comparator = ">" | ">=" | "<" | "<=";
export type OperatorType =
  | "none"
  | "=="
  | "!="
  | "&&"
  | "if_array"
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
  scope = "",
): Literal | null | undefined | Expression => {
  let value: any = null;
  if (["number", "boolean"].includes(typeof operand)) {
    return evaluate(operand);
  }

  if (typeof operand === "string" && !context) {
    return operand;
  }

  const _context = context as ConfigContext;

  if (typeof operand !== "string") return;

  if (isModelicaPath(operand)) {
    const option = _context.options[operand];
    if (option === undefined) {
      // console.log(`undefined path: ${operand}`);
      // TODO: these are modelica paths that should
      // be extracted!
      return operand;
    }
    if (option?.definition) {
      return operand;
    } else {
      // Update the operand with just the param name
      const name = operand.split(".").pop() as string;
      operand = name;
    }
  }

  const { instancePath, optionPath } = resolvePaths(operand, _context, scope);
  const instancePathScope = instancePath.split(".").slice(0, -1).join(".");
  // have the actual instance path, check for cached value
  value = _context._getCachedValue(instancePath);
  // if no value, check instance path now that scope should be properly applied
  value =
    value === undefined || value === null
      ? _context.getValue(instancePath)
      : value;
  // fallback to the original option
  if ((value === undefined || value === null) && optionPath) {
    const typeOption = _context.options[optionPath];
    if (typeOption?.definition) {
      value = typeOption.modelicaPath;
    } else if (typeOption && "value" in typeOption) {
      const potentialExpression = typeOption?.value; // enums
      value = evaluate(potentialExpression, context, instancePathScope);
    }
  }

  return value;
};

/**
 * Inspects the modifier to make sure the appropriate scope
 * is used
 *
 * If the modifier came from a param, scope has to be kicked back
 * by 2, if it was defined on a class, by 1
 */
export const evaluateModifier = (
  mod: Modifier,
  context: ConfigContext,
  instancePath = "",
) => {
  const sliceAmount = mod?.fromClassDefinition ? -1 : -2;
  const expressionScope = instancePath
    .split(".")
    .slice(0, sliceAmount)
    .join(".");
  return evaluate(mod?.expression, context, expressionScope);
};

type Comparators = { [key: string]: (x: any, y: any) => any };

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
    case ">=": {
      const comparators: Comparators = {
        "<": (x, y) => x < y,
        "<=": (x, y) => x <= y,
        ">": (x, y) => x > y,
        ">=": (x, y) => x >= y,
      };

      const resolvedOperands = expression.operands.map((o) =>
        resolveToValue(o, context, scope),
      );
      val = comparators[expression.operator](
        resolvedOperands[0],
        resolvedOperands[1],
      ) as Literal;

      break;
    }
    case "==":
    case "!=": {
      const resolvedOperands = expression.operands.map((o) =>
        resolveToValue(o, context, scope),
      );
      const isEqual = allElementsEqual(resolvedOperands);
      val = expression.operator.includes("!") ? !isEqual : isEqual;
      break;
    }
    case "||": {
      val = expression.operands.reduce(
        (acc, cur) => !!(evaluate(cur, context, scope) || acc),
        false,
      );
      break;
    }
    case "&&": {
      val = expression.operands.reduce(
        (acc, cur) => !!(evaluate(cur, context, scope) && acc),
        true,
      );
      break;
    }
    // Currently only have a single case of if_array and the
    // operands length is 1 so we can treat it as if_elseif
    case "if_array":
    case "if_elseif": {
      val = expression.operands
        .map((o) => evaluate(o, context, scope))
        .filter((val) => val !== null)[0];
      break;
    }
    case "if":
    case "else_if": {
      val = evaluate(expression.operands[0], context, scope)
        ? evaluate(expression.operands[1], context, scope)
        : null;
      break;
    }
    case "else": {
      val = evaluate(expression.operands[0], context, scope);
      break;
    }
  }

  return val;
};

///////////////// Modifier helpers

const addToModObject = (
  newMods: {
    [key: string]: {
      expression: Expression;
      final: boolean;
      redeclare: boolean;
    };
  },
  baseInstancePath: string,
  fromClassDefinition: boolean,
  mods: {
    [key: string]: Modifier;
  },
) => {
  Object.entries(newMods).forEach(([k, mod]) => {
    const instanceName = k.split(".").pop();
    const modKey = [baseInstancePath, instanceName]
      .filter((segment) => segment !== "")
      .join(".");

    // Do not add a key that is already present. The assumption is that
    // the first time an instance path is present is the most up-to-date
    if (!(modKey in mods)) {
      mods[modKey] = {
        ...mod,
        ...{ ["fromClassDefinition"]: fromClassDefinition },
      };
    }
  });
};

/**
 * The type of a replaceable option can be made either by:
 * - a selection that directly maps to a redeclare statement for the element instancePath
 * - a selection that maps to another element which contains a redeclare statement for the element
 *   (which will then be found in the mods object)
 *
 * This is a small helper method that checks for either of those cases.
 * For non repleaceable elements, this function returns option.type.
 */
const getReplaceableType = (
  instancePath: string,
  option: OptionInterface,
  mods: { [key: string]: { expression: Expression; final: boolean } },
  selections: ConfigValues,
  options: { [key: string]: OptionInterface },
) => {
  // check if there is a selection for this option, if so use it
  let selectionPath;
  // first check if this is an instance of a replaceable short class
  const typeOption = options[option.type as string];
  if (
    typeOption &&
    typeOption.definition &&
    typeOption.shortExclType &&
    typeOption.replaceable
  ) {
    // for the UI, we don't support lookup of short class definitions within packages
    // so the short class element name is necessarily within the same variable namespace as the instance
    selectionPath = constructSelectionPath(
      typeOption.modelicaPath,
      instancePath.split(".").slice(0, -1).join(".") +
        "." +
        typeOption.type.split(".").pop(),
    );
  } else if (option.replaceable) {
    // for replaceable components, the selection path is directly created from the instance path
    selectionPath = constructSelectionPath(option.modelicaPath, instancePath);
  } else {
    // non replaceable element: the type is fixed, return it
    return option.type;
  }

  const selectionType = selections ? selections[selectionPath] : null;

  if (selectionType) {
    return selectionType;
  }

  // Check if there is a modifier for this option, if so use it:
  let newType = null;
  const redeclaredType = instancePath in mods ? mods[instancePath] : null;
  if (redeclaredType) {
    // not using 'evaluateModifier' as that relies on context
    // This evaluation COULD mess up if operand anything but 'none'
    newType = evaluate(redeclaredType.expression);
  }

  // Otherwise just definition type
  return newType ? newType : option.type;
};

/**
 * Recursive helper method
 * @returns
 */
const buildModsHelper = (
  option: OptionInterface,
  baseInstancePath: string,
  mods: { [key: string]: Modifier },
  options: { [key: string]: OptionInterface },
  selections: ConfigValues,
  selectionModelicaPathsCache: { [key: string]: null }, // cache of just selection Modelica path keys
) => {
  if (option === undefined) {
    return; // PUNCH-OUT! references to 'Medium' fail here
  }

  // fetch all modifiers from up the inheritance hierarchy
  const name = option.modelicaPath.split(".").pop();
  const newBase =
    option.definition && !option.shortExclType // short class definitions are treated as instances
      ? baseInstancePath
      : [baseInstancePath, name].filter((p) => p !== "").join(".");
  const childOptions = option.options;

  const optionsWithModsList: string[] =
    "treeList" in option && option.treeList.length > 0
      ? option.treeList
      : [option.modelicaPath];

  optionsWithModsList.map((oPath) => {
    const o = options[oPath];
    const oMods = o.modifiers;
    if (oMods) {
      addToModObject(oMods, newBase, option.definition, mods);
    }
  });

  // check for redeclare in selections or use default type
  // to grab the correct modifiers
  if (option.replaceable) {
    let redeclaredType = option.value as string | null | undefined;
    if (option.modelicaPath in selectionModelicaPathsCache) {
      const selectionPath = constructSelectionPath(
        option.modelicaPath,
        newBase,
      );
      redeclaredType = selections[selectionPath];
    }

    if (option.choiceModifiers && redeclaredType) {
      const choiceMods = option.choiceModifiers[redeclaredType];
      if (choiceMods) {
        addToModObject(choiceMods, newBase, option.definition, mods);
      }
    }
  }

  // if this is a long class definition visit all child options and grab modifiers
  if (childOptions) {
    if (option.definition && !option.shortExclType) {
      childOptions.map((path) => {
        const childOption = options[path];
        buildModsHelper(
          childOption,
          newBase,
          mods,
          options,
          selections,
          selectionModelicaPathsCache,
        );
      });
    } else {
      // if this is a replaceable element, get the redeclared type
      // (this includes instances of replaceable short classes)
      const typeOptionPath = getReplaceableType(newBase, option, mods, selections, options);
      const typeOption = options[typeOptionPath as string];

      if (typeOption && typeOption.options) {
        // Add modifiers from type option
        if (typeOption.modifiers) {
          addToModObject(
            typeOption.modifiers,
            newBase,
            typeOption.definition,
            mods,
          );
        }

        // Each parent class must also be visited
        // See https://github.com/lbl-srg/ctrl-flow-dev/issues/360
        typeOption
          .treeList
          ?.filter((path) => path !== (typeOptionPath as string)) // Exclude current class from being visited again
          .map((oPath) => {
            const o = options[oPath];
            buildModsHelper(
              o,
              newBase,
              mods,
              options,
              selections,
              selectionModelicaPathsCache,
            );
          })

        // Further populate `mods` with all options belonging to this class
        typeOption.options.map((path) => {
          const childOption = options[path];

          buildModsHelper(
            childOption,
            newBase,
            mods,
            options,
            selections,
            selectionModelicaPathsCache,
          );
        });
      }
    }
  }
};

export const buildMods = (
  startOption: OptionInterface,
  selections: ConfigValues,
  options: { [key: string]: OptionInterface },
) => {
  const mods: { [key: string]: Modifier } = {};
  const selectionModelicaPaths: { [key: string]: null } = {}; // Object.keys(selections)
  Object.keys(selections).map((s) => {
    const [modelicaPath] = s.split("-");
    selectionModelicaPaths[modelicaPath] = null;
  });

  buildModsHelper(
    /* option */ startOption,
    /* baseInstancePath */ "",
    /* mods */ mods,
    /* options */ options,
    /* selections */ selections,
    /* selectionModelicaPathsCache */ selectionModelicaPaths,
  );

  return mods;
};

///////////////// Context Manager
// OptionInstance is meant to act like an instance of aparticular template Option.
// Instance data baked into the same object in a format convenient for mapping
// to different UI Shapes
export interface OptionInstance {
  value: Literal | null | undefined; // NOT an expression
  display: boolean;
  option: OptionInterface;
  instancePath: string;
  isOuter: boolean;
  type: string;
}

/**
 * Generates a 'context' for a given template configuration so
 * that any value defined for a template can be fetched, and that value
 * correctly takes into account selections and predefined template values/expressions
 * to return the correct value
 *
 * Another name for this could be 'config instance'. I wanted this to behave like
 * an instantiation of a template definition
 *
 * In the same way you might do the following if you had a class:
 *
 * const config = new Config(config)
 * console.log(configContext.someVal); // prints 5
 *
 * You use a config context for the same type of interaction:
 *
 * const context = new ConfigContext(template, config, options, selections);
 * console.log(context.getValue('someVal')); // prints 5
 *
 */
export class ConfigContext {
  mods: { [key: string]: Modifier } = {};
  _resolvedValues: {
    [key: string]: { value: Literal | null; optionPath: string };
  } = {};
  _previousInstancePath: string | null = null;

  constructor(
    public template: TemplateInterface,
    public config: ConfigInterface,
    public options: { [key: string]: OptionInterface },
    public selections: ConfigValues = {},
  ) {
    // calculate initial mods without selections
    this.mods = buildMods(
      this.options[template.modelicaPath],
      selections,
      this.options,
    );
  }

  addToCache(path: string, optionPath: string, val: any) {
    if (!isExpression(val) && val !== undefined && val !== null) {
      this._resolvedValues[path] = { value: val as Literal, optionPath };
    }
  }

  /**
   *
   * Attempts to get a string or variable reference to a value
   *
   * Path can be either:
   *  - a modelica path
   *  - a modifier path that needs to be combined with scope in
   *    some way to form an instance path
   *  - an instance path
   * A value or null is returned when an instance path is provided
   *
   * This method CAN return an expression
   * A null return means the value cannot be resolved
   * @param path
   */
  getValue(path: string, scope = ""): Literal | Expression | null | undefined {
    if (this._previousInstancePath === path) {
      // console.log(`Cycling on path: ${path}`);
      return null; // prevent cycle
    } else {
      this._previousInstancePath = path;
    }
    let val = null;
    let optionPath: string | null = "";
    let instancePath = path;

    if (isModelicaPath(path)) {
      const option = this.options[path];
      if (option.definition) {
        this._previousInstancePath = null;
        this.addToCache(path, optionPath, path);
        return path;
      }
      optionPath = path;
    } else {
      // instance path to original option
      const paths = resolvePaths(path, this, scope);
      optionPath = paths.optionPath;
      instancePath = paths.instancePath;
    }

    if (!optionPath) {
      // Unable to resolve value - likely a param link explicitly broken using
      // the annotation __ctrlFlow(enable=false)
      return null; // PUNCH-OUT! Unable to resolve value
    }

    const selectionPath = constructSelectionPath(optionPath, instancePath);
    // check selections
    if (this.selections && selectionPath in this.selections) {
      this._previousInstancePath = null;
      this.addToCache(path, optionPath, this.selections[selectionPath]);
      return this.selections[selectionPath];
    }

    // Check if a value is on a modifier
    const mod = this.mods[instancePath];
    if (mod) {
      val = evaluateModifier(this.mods[instancePath], this, instancePath);
      if (val) {
        this._previousInstancePath = null;
        this.addToCache(path, optionPath, val);
        return val;
      }
    }

    // return whatever value is present on the original option definition
    const optionScope = instancePath.split(".").slice(0, -1).join(".");
    val = evaluate(this.options[optionPath]?.value, this, optionScope);
    this.addToCache(path, optionPath, val);
    this._previousInstancePath = null;
    return val;
  }

  _visitChildNodes(instancePath: string, depth: number | null) {
    const instanceOption = this.getOptionInstance(instancePath);
    const option = instanceOption?.option;
    const isOuter = instanceOption?.isOuter ? instanceOption.isOuter : false;
    const typePath = instanceOption?.type || option?.type;
    const typeOption = this.options[typePath as string] || null;
    const okDepth = depth !== null ? depth > 0 : true;
    if (typeOption && !isOuter && okDepth) {
      typeOption.options?.map((o) => {
        const paramName = o.split(".").pop();
        const childInstancePath = [instancePath, paramName]
          .filter((p) => p !== "")
          .join(".");
        const newDepth = depth !== null ? depth - 1 : null;
        if (childInstancePath !== o) {
          this._visitChildNodes(childInstancePath, newDepth);
        }
      });
    }
  }
  /**
   * Visits each available option and attempts to resolve value
   *
   * ConfigContext lazily resolves values, only resolving paths to values
   * when asked. This method will traverse the tree of options associated with
   * the template and request the value, allowing all related template options
   * to resolve.
   */
  visitTemplateNodes(depth: number | null = null) {
    const rootOption = this.getRootOption();

    rootOption.options?.map((o) => {
      const paramName = o.split(".").pop();
      if (paramName) {
        this._visitChildNodes(paramName, depth);
      }
    });
  }
  /**
   * This method assumes we have an exact instance path! No path
   * resolving occurs in this method with scope
   */
  _getCachedValue(path: string): Literal | null | undefined {
    return this._resolvedValues[path]?.value;
  }

  getRootOption() {
    return this.options[this.template.modelicaPath];
  }

  isValidSelection(selectionPath: string) {
    const paths = selectionPath.split("-");
    if (paths.length == 2) {
      const [, instancePath] = paths;
      const instance = this.getOptionInstance(instancePath);
      return !!instance?.display;
    } else {
      return true; // AllSystem settings don't have a dash
    }
  }

  /**
   * Returns an OptionInstance for the provided instance path. OptionInstance
   * bakes in useful info related to make it easier to map to a display format
   */
  getOptionInstance(path: string, scope = ""): OptionInstance | undefined {
    const { instancePath, optionPath, outerOptionPath } = resolvePaths(
      path,
      this,
      scope,
    );
    if (!optionPath || optionPath.startsWith("Modelica")) {
      return;
    }

    const outerOption = outerOptionPath ? this.options[outerOptionPath] : null;

    let value = this.getValue(instancePath);
    let display = false;

    // option instances do not get expressions assigned
    if (isExpression(value)) {
      value = undefined;
    }
    const option = this.options[optionPath as string];
    const type =
      option && "replaceable" in option ? (value as string) : option?.["type"];
    const castValue = value as Literal | null | undefined;
    const optionInstance = {
      value: castValue,
      display,
      option: option,
      instancePath,
      isOuter: !!outerOption,
      type,
    };

    const mod = this.mods[instancePath];
    const final = mod?.final !== undefined ? mod.final : false;

    if (final) {
      return optionInstance; // PUNCH-OUT! we got what we need
    }

    // expressions attached to an option are relative to the options
    // scope only requiring one level to be popped off (slice(0, -1))
    const enable =
      option && "enable" in option
        ? evaluate(
            option?.enable,
            this,
            instancePath.split(".").slice(0, -1).join("."),
          )
        : false;
    display = !isExpression(enable) ? !!enable : display;
    display = outerOption
      ? false // outer elements are always hidden
      : !!(display && option.visible);

    return { ...optionInstance, display };
  }

  getRootInstance() {
    return {
      option: this.options[this.template.modelicaPath],
      display: false,
      value: this.template.modelicaPath,
      instancePath: "",
      isOuter: false,
      type: this.template.modelicaPath,
    };
  }

  /**
   * Maps the cache of values to the selection format
   */
  getEvaluatedValues() {
    const evaluatedValues: { [key: string]: Literal | null | undefined } = {};
    // Values are lazy loaded so only what is needed to display all of a templates options is
    // resolved. If more evaluations are needed by the sequence document call this:
    // this.visitTemplateNodes();
    const resolvedValues = removeEmpty(this._resolvedValues) as {
      [key: string]: { value: Literal | null | undefined; optionPath: string };
    };
    Object.entries(resolvedValues).map(([key, val]) => {
      const { optionPath, value } = val;
      const option = this.options[optionPath];
      const addToResolvedValues =
        value !== "" || (value === "" && option.type === "String");

      if (addToResolvedValues) {
        const selectionPath = constructSelectionPath(optionPath, key);
        evaluatedValues[selectionPath] = value;
      }
    });
    return evaluatedValues;
  }
}
