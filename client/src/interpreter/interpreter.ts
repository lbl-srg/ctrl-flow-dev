import { resolvePath } from "react-router-dom";
import Config, { ConfigInterface } from "../../src/data/config";
import Template, {
  TemplateInterface,
  OptionInterface,
} from "../../src/data/template";
import { ConfigValues } from "../../src/utils/modifier-helpers";
import { removeEmpty } from "../../src/utils/utils";

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
  paths.push(path); // original path without scope needs to be added as well.. TODO: this can cause dups

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
 *
 *
 * Given an instance path and context, knows how to find the original option by
 * applying path modifiers, selections, and modifiers (redeclares)
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
  let curOptionPath: string | null | undefined = `${
    context.template.modelicaPath
  }.${curInstancePathList[curInstancePathList.length - 1]}`;
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
        const [optionPath, instancePath] = key.split("-");
        if (instancePath === curInstancePathList.join(".")) {
          option = context.options[value];
        }
      });
    }

    // get the original option for reference

    // Option swap #2: redeclare modifiers - NOT WORKING
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
          // the potential option I need to swap
          // option = potentialOption ? potentialOption : option;
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
      // otherwise just attempt to grab the option
      const paramOption = context.options[curOptionPath];
      if (!paramOption) {
        break; // PUNCH-OUT!
      } else {
        option = context.options[paramOption.type];
        if (option === undefined) {
          // console.log(`param type undefined: ${paramOption.type}`);
          curOptionPath = null;
          break;
        }
      }
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
    // } else {
    //   // assume we just want the type of the parameter
    //   value = typeOption.type;
    // }
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
      const comparators = {
        "<": (x: any, y: any) => x < y,
        "<=": (x: any, y: any) => x <= y,
        ">": (x: any, y: any) => x > y,
        ">=": (x: any, y: any) => x >= y,
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
      mods[modKey] = {
        ...mod,
        ...{ ["fromClassDefinition"]: fromClassDefinition },
      };
    }

    // if (false) {
    //   // grab modifiers from original definition
    //   const modOption = options[k];
    //   if (modOption?.modifiers) {
    //     addToModObject(
    //       newMods,
    //       baseInstancePath,
    //       fromClassDefinition,
    //       mods,
    //       options,
    //       false,
    //     );
    //   }
    // }
  });
};

/**
 * The type of a replaceable option can be made either by:
 * - a selection
 * - a redeclare
 *
 * This is a small helper method that checks for either of those instances
 * TODO: this maybe should be replaced by use of instaceToOption method and the
 * use of context
 *
 * @param instancePath
 * @param mods
 * @param config
 */
const getReplaceableType = (
  instancePath: string,
  option: OptionInterface,
  mods: { [key: string]: { expression: Expression; final: boolean } },
  selections: ConfigValues,
) => {
  // check if there is a selection for this option, if so use
  const selectionPath = constructSelectionPath(
    option.modelicaPath,
    instancePath,
  );
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

// recursive helper method that traverses options grabbing modifiers
// TODO: config selections must be integrated to correctly build this list
const buildModsHelper = (
  option: OptionInterface,
  baseInstancePath: string,
  mods: { [key: string]: Modifier },
  options: { [key: string]: OptionInterface },
  selections: ConfigValues,
) => {
  if (option === undefined) {
    return; // PUNCH-OUT! references to 'Medium' fail here
  }

  // fetch all modifiers from up the inheritance hierarchy
  const name = option.modelicaPath.split(".").pop();
  const newBase = option.definition
    ? baseInstancePath
    : [baseInstancePath, name].filter((p) => p !== "").join(".");
  const optionMods: { [key: string]: Modifier } = {};
  const childOptions = option.options;

  const optionsWithModsList: string[] =
    "treeList" in option && option.treeList.length > 0
      ? option.treeList
      : [option.modelicaPath];
  optionsWithModsList.reverse().map((oPath) => {
    const o = options[oPath];
    const oMods = o.modifiers;
    if (oMods) {
      addToModObject(oMods, newBase, option.definition, mods, options);
    }
  });

  // if this is a definition - visit all child options and grab modifiers
  if (childOptions) {
    if (option.definition) {
      childOptions.map((path) => {
        const childOption = options[path];
        buildModsHelper(childOption, newBase, mods, options, selections);
      });
    } else {
      // TODO: use instanceToOption to get replaceable type!
      // getReplaceableType is redundant (or just getValue)
      const typeOptionPath = option.replaceable
        ? getReplaceableType(newBase, option, mods, selections)
        : option.type;

      const typeOption = options[typeOptionPath as string]; // TODO: remove this cast
      if (typeOption && typeOption.options) {
        // add modifiers from type option
        if (typeOption.modifiers) {
          addToModObject(
            typeOption.modifiers,
            newBase,
            typeOption.definition,
            mods,
            options,
          );
        }
        typeOption.options.map((path) => {
          const childOption = options[path];

          buildModsHelper(childOption, newBase, mods, options, selections);
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

  buildModsHelper(startOption, "", mods, options, selections);

  return mods;
};

// Cache for initial template values
const _initModCache: { [key: string]: Modifier } = {};

///////////////// Context Manager
// Option and Instance data baked into the same object in a format
// convenient for mapping to different UI Shapes
export interface OptionInstance {
  value: Literal | null | undefined; // NOT an expression
  display: boolean;
  option: OptionInterface;
  instancePath: string;
  isOuter: boolean;
  type: string;
}
/**
 * Generating context for a given template and config
 */

/**
 * This generates a context that can be queried for values using
 * an instance path, taking into account selections and the exsiting
 * definitions and modifiers for a given template
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
    if (template.modelicaPath in _initModCache) {
      // this.mods = _initModCache[template.modelicaPath];
    } else {
      // calculate intial mods without selections
      this.mods = buildMods(
        this.options[template.modelicaPath],
        selections,
        this.options,
      );
    }
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
      // the annotation __Linkage(enable=false)
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

  /**
   * Instance Path
   * @param path
   * @param scope
   * @returns
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
      option && "replaceable" in option ? (value as string) : option?.type;
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
      return optionInstance; // punch-out, we got what we need
    }

    // if (!option) {
    //   console.log(instancePath);
    // }
    // 'scope' in this case is the current instance path's scope, which
    // is one level up from the parameter.
    // e.g.
    // You have the following definition
    // param c = false;
    // Class A
    //     param b
    //        enable = c === true // 'c' is a reference to a local param c, not the global 'c'
    //     param c = true
    //
    // e = new A()

    // The scope of the expression 'enable = c === true' must be able to first reference
    // what is found inside the scope of e, an instance of class A
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
      ? !!(display && outerOption.visible)
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
    // We may potentially need this to grab more evaluations needed by
    // the document
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
