import Config, { ConfigInterface } from "../../src/data/config";
import Template, {
  TemplateInterface,
  OptionInterface,
} from "../../src/data/template";
import { Modifiers } from "../../src/utils/modifier-helpers";

/**
 * TODO:
 * - [X] Integrate configuration when building modifiers
 * - [ ] Integrate context with mod builder! Needed to correctly evaulate expressions in mod builder!
 * - [ ] Add a whole lot more tests for expression with context. This is where the bugs are
 * - (?) partial resolved expressions must be handled (if something gets returned as an expression). I think
 * the approach could be somsething like, have an unresolved expressions count, re-evaluate again after going
 * through all modifiers, selections, etc., if the count changes, re-evaluate again? This seems to indicate the use of
 * a 'resolved' list....
 * - (?) 'scope' concept will likely need to be integrated since mods are <Type>.paramName and not full.instance.path
 * - Integrate redeclare modifier mechanism
 * - Integrate selections
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
  arr.reduce((a: any, b: any) => (Object.is(a, b) ? a : NaN));

const constructSelectionPath = (optionPath: string, instancePath: string) =>
  `${optionPath}-${instancePath}`;

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
export const instancePathToOption = (
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
  }`; // this is what is returned
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
 * Resolve something to its value/type
 */
export const resolveToValue = (
  operand: Literal | Expression,
  context?: ConfigContext,
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
    // check if path is already a valid modelcia path
    let typeOption = _context.options[operand];
    // if not, assume it is an instance path and attempt to map to an option path and get again
    typeOption = !typeOption
      ? _context.options[instancePathToOption(operand, _context)]
      : typeOption;
    // check if present in options, if not just return the string, if so check if option
    // is a definition
    if (typeOption) {
      if (typeOption.definition) {
        value = typeOption.modelicaPath;
      } else {
        const potentialExpression = typeOption.value;
        value = evaluate(potentialExpression, context);
      }
    } else {
      // treat as instance path. If it does not resolve assume its a string
      // this is a bug as someone could put in param of type string that mirrors a valid instance path
      // and this would break
      value = instancePathToOption(operand, _context);
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
) => {
  if (!isExpression(possibleExpression)) {
    return possibleExpression; // already a constant
  }

  const expression = possibleExpression as Expression;

  let val: Literal | null | Expression | undefined = null;

  switch (expression.operator) {
    case "none":
      val = resolveToValue(expression.operands[0] as Literal, context);
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

      const resolvedOperands = expression.operands.map((o) =>
        resolveToValue(o, context),
      );
      val = comparators[expression.operator](
        resolvedOperands[0],
        resolvedOperands[1],
      ) as Literal;

      break;
    case "==":
    case "!=":
      const isEqual = allElementsEqual(expression.operands);
      val = expression.operator.includes("!") ? !isEqual : isEqual;
      break;
    case "||":
      val = expression.operands.reduce(
        (acc, cur) => !!(evaluate(cur, context) || acc),
        false,
      );
      break;
    case "&&":
      val = expression.operands.reduce(
        (acc, cur) => !!(evaluate(cur, context) && acc),
        true,
      );
  }

  if (expression.operator === "none") {
    val = resolveToValue(expression.operands[0] as Literal, context);
  } else if (["<", "<=", ">=", ">"].includes(expression.operator)) {
    const comparators: { [key: string]: (x: any, y: any) => any } = {
      "<": (x: any, y: any) => x < y,
      "<=": (x: any, y: any) => x <= y,
      ">": (x: any, y: any) => x > y,
      ">=": (x: any, y: any) => x >= y,
    };

    const resolvedOperands = expression.operands.map((o) =>
      resolveToValue(o, context),
    );
    val = comparators[expression.operator](
      resolvedOperands[0],
      resolvedOperands[1],
    ) as Literal;
  } else if (["==", "!="].includes(expression.operator)) {
    const isEqual = allElementsEqual(expression.operands);

    val = expression.operator.includes("!") ? !isEqual : isEqual;
  } else if (expression.operator === "||") {
    val = expression.operands.reduce(
      (acc, cur) => !!(evaluate(cur, context) || acc),
      false,
    );
  } else if (expression.operator === "&&") {
    val = expression.operands.reduce(
      (acc, cur) => !!(evaluate(cur, context) && acc),
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

  // grab the current options modifiers
  if (optionMods) {
    addToModObject(optionMods, baseInstancePath, mods, options);
  }

  // if this is a definition - visit all child options and grab modifiers
  if (childOptions) {
    const name = option.modelicaPath.split(".").pop();
    const newBase = option.definition
      ? baseInstancePath
      : [baseInstancePath, name].filter((p) => p !== "").join(".");

    if (option.definition) {
      childOptions.map((path) => {
        const childOption = options[path];
        buildModsHelper(childOption, newBase, mods, options, config);
      });
    } else {
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
   * A value or null is returned when an instance path is provided
   *
   * A null instance path means the value cannot be resolved
   * @param instancePath
   */
  getValue(instancePath: string): Literal | Expression | null | undefined {
    let val = null;
    const optionPath = instancePathToOption(instancePath, this);
    const selectionPath = constructSelectionPath(optionPath, instancePath);
    // check selections
    if (this.config.selections && selectionPath in this.config.selections) {
      return this.config.selections[selectionPath];
    }

    // check modifiers
    val = evaluate(this.mods[instancePath]?.expression);
    if (val) {
      return val;
    }

    val = evaluate(this.options[optionPath].value);

    return evaluate(this.options[optionPath].value);
  }
}
