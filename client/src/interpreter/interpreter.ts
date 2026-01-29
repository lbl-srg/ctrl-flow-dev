import { ConfigInterface } from "../../src/data/config";
import { TemplateInterface, OptionInterface } from "../../src/data/template";
import { removeEmpty } from "../../src/utils/utils";
import { ConfigValues } from "../utils/modifier-helpers";

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
  redeclare: string; // "" if not a redeclare, otherwise the redeclared type path
  recordBinding?: boolean;
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
  debug = false,
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

  // If the constructed option path doesn't exist, look for the option in the template's
  // child list (which includes inherited options from treeList base classes)
  if (!context.options[curOptionPath]) {
    const rootOption = context.getRootOption();
    const foundOption = rootOption.options?.find((childPath) =>
      childPath.endsWith("." + curInstancePathList[0]),
    );
    if (foundOption) {
      curOptionPath = foundOption;
    }
  }

  if (debug)
    console.log(
      `[_instancePathToOption] START: instancePath=${instancePath}, modifiedPath=${modifiedPath}`,
    );
  if (debug)
    console.log(
      `[_instancePathToOption] initial: curOptionPath=${curOptionPath}, pathSegments=${JSON.stringify(pathSegments)}`,
    );
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
    if (debug)
      console.log(
        `[_instancePathToOption] LOOP: curInstancePathList=${JSON.stringify(curInstancePathList)}, pathSegments=${JSON.stringify(pathSegments)}`,
      );
    // Option swap #1: selections
    // check if there is a selected path that specifies that option at
    // this instance path
    if (context.config?.selections) {
      Object.entries(context.selections).map(([key, value]) => {
        const [, instancePath] = key.split("-");
        // Only string values (Modelica paths) can be used for option lookup
        if (
          instancePath === curInstancePathList.join(".") &&
          typeof value === "string"
        ) {
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
      if (debug)
        console.log(
          `[_instancePathToOption] checking mods for ${curInstancePath}: ${instanceMod ? "FOUND" : "not found"}`,
        );
      // resolve mod if present
      if (instanceMod && instanceMod.redeclare) {
        // For redeclare modifiers, the type is stored directly in the 'redeclare' property
        const potentialOption = context.options[instanceMod.redeclare];
        option = potentialOption ? potentialOption : option;
      }
      // Handle record binding: redirect path resolution to follow the binding
      if (instanceMod && instanceMod.recordBinding) {
        const bindingExpr = instanceMod.expression;
        let bindingPath: string | null = null;
        if (
          bindingExpr?.operator === "none" &&
          typeof bindingExpr.operands[0] === "string"
        ) {
          bindingPath = bindingExpr.operands[0];
        }

        if (bindingPath) {
          const remainingPath = pathSegments.join(".");
          if (remainingPath) {
            // If bindingPath is a Modelica path (e.g., TestRecord.Nested.localRec),
            // we need to convert it to an instance path relative to the current scope.
            // The binding was defined in a class, so we need to find which ancestor
            // instance corresponds to that class and replace the class prefix.
            let resolvedBindingPath = bindingPath;
            if (isModelicaPath(bindingPath)) {
              // Walk up the current instance path to find an ancestor whose type
              // (or inherited type via treeList) matches the class prefix of the binding path.
              // For example: curInstancePath="nesExt.mod.rec", bindingPath="TestRecord.Nested.localRec"
              // - "nesExt" has type "TestRecord.NestedExtended" with treeList including "TestRecord.Nested"
              // - bindingPath starts with "TestRecord.Nested."
              // - So replace "TestRecord.Nested" with "nesExt" -> "nesExt.localRec"
              const instanceSegments = curInstancePath.split(".");

              outerLoop: for (let i = instanceSegments.length; i >= 1; i--) {
                const ancestorInstancePath = instanceSegments
                  .slice(0, i)
                  .join(".");
                const ancestorOptionKey = `${context.template.modelicaPath}.${ancestorInstancePath}`;
                const ancestorOption = context.options[ancestorOptionKey];

                // Check direct type match
                const ancestorType = ancestorOption?.type;
                if (
                  ancestorType &&
                  bindingPath.startsWith(ancestorType + ".")
                ) {
                  const suffix = bindingPath.slice(ancestorType.length + 1);
                  resolvedBindingPath = `${ancestorInstancePath}.${suffix}`;
                  if (debug)
                    console.log(
                      `[_instancePathToOption] resolved binding: ${bindingPath} -> ${resolvedBindingPath} (via ${ancestorInstancePath} of type ${ancestorType})`,
                    );
                  break;
                }

                // Check inherited types via treeList
                const typeOption = ancestorType
                  ? context.options[ancestorType]
                  : null;
                if (typeOption?.treeList) {
                  for (const inheritedType of typeOption.treeList) {
                    if (bindingPath.startsWith(inheritedType + ".")) {
                      const suffix = bindingPath.slice(
                        inheritedType.length + 1,
                      );
                      resolvedBindingPath = `${ancestorInstancePath}.${suffix}`;
                      if (debug)
                        console.log(
                          `[_instancePathToOption] resolved binding: ${bindingPath} -> ${resolvedBindingPath} (via ${ancestorInstancePath} inheriting ${inheritedType})`,
                        );
                      break outerLoop;
                    }
                  }
                }
              }

              // If still a Modelica path, check if it starts with template path
              // or any class in the template's treeList (for bindings to base classes)
              if (isModelicaPath(resolvedBindingPath)) {
                const templatePath = context.template.modelicaPath;
                if (bindingPath.startsWith(templatePath + ".")) {
                  resolvedBindingPath = bindingPath.slice(
                    templatePath.length + 1,
                  );
                } else {
                  // Check if binding path starts with any class in template's treeList
                  const templateOption = context.options[templatePath];
                  if (templateOption?.treeList) {
                    for (const baseClass of templateOption.treeList) {
                      if (bindingPath.startsWith(baseClass + ".")) {
                        resolvedBindingPath = bindingPath.slice(
                          baseClass.length + 1,
                        );
                        if (debug)
                          console.log(
                            `[_instancePathToOption] resolved binding via template treeList: ${bindingPath} -> ${resolvedBindingPath} (base class: ${baseClass})`,
                          );
                        break;
                      }
                    }
                  }
                }
              }
            }

            const redirectedPath = `${resolvedBindingPath}.${remainingPath}`;
            if (debug)
              console.log(
                `[_instancePathToOption] recordBinding redirect: ${curInstancePath}.${remainingPath} -> ${redirectedPath}`,
              );
            const redirectedResult = _instancePathToOption(
              redirectedPath,
              context,
              applyPathMods,
              debug,
            );
            return redirectedResult;
          }
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
      if (debug)
        console.log(
          `[_instancePathToOption] normal lookup: curOptionPath=${curOptionPath}, paramOption.type=${paramOption?.type}`,
        );

      if (!paramOption) {
        if (debug)
          console.log(`[_instancePathToOption] PUNCH-OUT: no paramOption`);
        break; // PUNCH-OUT!
      } else {
        option = context.options[paramOption.type];
        if (option === undefined) {
          if (debug)
            console.log(
              `[_instancePathToOption] PUNCH-OUT: option undefined for type ${paramOption.type}`,
            );
          curOptionPath = null;
          break;
        }
      }
    }

    if (debug)
      console.log(
        `[_instancePathToOption] option=${option?.modelicaPath}, options=${JSON.stringify(option?.options)}`,
      );

    // For short classes, the actual instance is within the options
    // of the aliased type (stored in option.type).
    // (If this type is modified by the user selection, this has already been caught by
    // the selection check above.)
    if (option?.shortExclType) {
      option = context.options[option?.type as string];
    }

    if (pathSegments.length === 0) {
      if (debug)
        console.log(`[_instancePathToOption] early break: pathSegments empty`);
      break;
    }

    const paramName = pathSegments.shift();
    curInstancePathList.push(paramName);

    // use the options child list to get the correct type - inherited types
    // are only correctly referenced through this list
    curOptionPath = option?.options?.find(
      (o) => o.split(".").pop() === paramName,
    ) as string;
    if (debug)
      console.log(
        `[_instancePathToOption] after shift: paramName=${paramName}, curOptionPath=${curOptionPath}`,
      );

    // Check if the current option has a default value binding in the class definition
    // (e.g., `parameter Rec localRec = rec` in Mod).
    // If so, follow the binding to resolve the remaining path segments.
    // Skip this if there's a recordBinding modifier from instantiation (e.g., `Mod mod(rec=localRec)`),
    // which is handled separately and takes precedence.
    if (curOptionPath && pathSegments.length > 0) {
      const curInstancePath = curInstancePathList.join(".");
      const instanceMod = context.mods[curInstancePath];

      if (!instanceMod?.recordBinding) {
        const curOption = context.options[curOptionPath];
        if (curOption?.value && typeof curOption.value !== "string") {
          const valueExpr = curOption.value as Expression;
          if (
            valueExpr.operator === "none" &&
            typeof valueExpr.operands[0] === "string"
          ) {
            const bindingTarget = valueExpr.operands[0];
            // Check if binding target is another record path (not a literal)
            if (isModelicaPath(bindingTarget) || !bindingTarget.includes(".")) {
              const remainingPath = pathSegments.join(".");
              // Resolve the binding in the current scope, then continue with remaining path
              const bindingInstancePath = isModelicaPath(bindingTarget)
                ? bindingTarget.split(".").pop() // Get just the param name
                : bindingTarget;
              const redirectedPath = `${bindingInstancePath}.${remainingPath}`;
              const scopePath = curInstancePath
                .split(".")
                .slice(0, -1)
                .join(".");
              if (debug)
                console.log(
                  `[_instancePathToOption] value binding redirect: ${curInstancePath}.${remainingPath} -> ${scopePath ? scopePath + "." : ""}${redirectedPath}`,
                );
              const redirectedResult = _instancePathToOption(
                scopePath ? `${scopePath}.${redirectedPath}` : redirectedPath,
                context,
                applyPathMods,
                debug,
              );
              return redirectedResult;
            }
          }
        }
      }
    }

    if (pathSegments.length === 0) {
      // bottoming out - set a default path
      if (!curOptionPath) {
        curOptionPath = pathSegments.length === 0 ? option?.modelicaPath : null;
      }
      if (debug)
        console.log(
          `[_instancePathToOption] final break: curOptionPath=${curOptionPath}`,
        );
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
  if (path.startsWith("Modelica") || path.startsWith("Buildings")) {
    return true;
  }
  // Support test packages
  if (
    process.env.NODE_ENV === "test" &&
    (path.startsWith("TestRecord") || path.startsWith("TestPackage"))
  ) {
    return true;
  }
  return false;
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
  debug = false,
): {
  optionPath: string | null;
  instancePath: string;
  outerOptionPath: string | null | undefined;
} {
  const pathList = createPossiblePaths(scope, path);
  if (debug)
    console.log(
      `[resolvePaths] path=${path}, scope=${scope}, pathList=${JSON.stringify(pathList)}`,
    );
  for (const p of pathList) {
    const paths = _instancePathToOption(p, context, true, debug);
    if (debug)
      console.log(`[resolvePaths] tried ${p}: optionPath=${paths.optionPath}`);
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
  | "!"
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
      // Option not found by full type path - this can happen when expressions
      // contain type-based paths but options are keyed by instance paths.
      // E.g., operand = "Buildings.Templates...PartialControllerVAVMultizone.stdVen"
      // We need to find the instance with type "Buildings.Templates...PartialControllerVAVMultizone"
      // and then look up "stdVen" on that instance.
      const pathSegments = operand.split(".");
      const name = pathSegments.pop() as string; // e.g., "stdVen"
      const typePath = pathSegments.join("."); // e.g., "Buildings.Templates...PartialControllerVAVMultizone"

      // Find an instance whose type matches the typePath
      let instanceScope = "";
      for (const optKey of Object.keys(_context.options)) {
        const opt = _context.options[optKey];
        if (opt?.type === typePath && !opt.definition) {
          // Found an instance with matching type - use its name as scope
          instanceScope = opt.modelicaPath.split(".").pop() || "";
          break;
        }
      }

      // If we found a matching instance, use it as scope; otherwise just use the name
      if (instanceScope && !scope) {
        scope = instanceScope;
      }
      operand = name;
    } else if (option?.definition) {
      return operand;
    } else {
      // Option exists but is not a definition - extract the param name
      // and try to infer the scope from the option's parent type
      const name = operand.split(".").pop() as string;
      
      // If no scope provided, try to find an instance with the parent type
      if (!scope) {
        const pathSegments = operand.split(".");
        pathSegments.pop(); // remove the param name
        const typePath = pathSegments.join(".");
        
        // Find an instance whose type matches the typePath (directly or via inheritance)
        for (const optKey of Object.keys(_context.options)) {
          const opt = _context.options[optKey];
          if (!opt || opt.definition) continue;
          
          // Check direct type match
          if (opt.type === typePath) {
            scope = opt.modelicaPath.split(".").pop() || "";
            break;
          }
          
          // Check inherited types via treeList
          const typeOption = opt.type ? _context.options[opt.type] : null;
          if (typeOption?.treeList?.includes(typePath)) {
            scope = opt.modelicaPath.split(".").pop() || "";
            break;
          }
        }
      }
      
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
 *
 * For redeclare modifiers:
 * - 'redeclare' contains the redeclared type path
 * - 'expression' contains the binding value (only if there's an assignment =)
 * If it's a redeclare without a binding, return the redeclare type directly
 */
export const evaluateModifier = (
  mod: Modifier,
  context: ConfigContext,
  instancePath = "",
) => {
  // For redeclare modifiers without a binding, return the redeclare type directly
  if (mod?.redeclare && !mod?.expression) {
    return mod.redeclare;
  }
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
    case "!": {
      if (expression.operands.length !== 1) {
        throw new Error("Invalid number of operands for ! operator");
      }
      const operand = expression.operands[0];
      const resolvedOperand = isExpression(operand)
        ? evaluate(operand, context, scope)
        : resolveToValue(operand, context, scope);
      val = !resolvedOperand;
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
      redeclare: string;
      recordBinding?: boolean;
    };
  },
  baseInstancePath: string,
  fromClassDefinition: boolean,
  mods: {
    [key: string]: Modifier;
  },
  options?: { [key: string]: OptionInterface },
  childOptionPaths?: string[],
  optionModelicaPath?: string, // The modelica path of the option whose modifiers we're processing
) => {
  Object.entries(newMods).forEach(([k, mod]) => {
    // k is a Modelica path like "TestRecord.NestedExtended.localRec.p"
    // We need to convert it to an instance path relative to baseInstancePath.
    //
    // If optionModelicaPath is provided, strip it from k to get the relative instance path.
    // e.g., k = "TestRecord.NestedExtended.localRec.p", optionModelicaPath = "TestRecord.NestedExtended"
    //       -> relativeInstancePath = "localRec.p"
    let relativeInstancePath: string;
    if (optionModelicaPath && k.startsWith(optionModelicaPath + ".")) {
      relativeInstancePath = k.slice(optionModelicaPath.length + 1);
    } else {
      // Fallback: use last segment (original behavior for type-based paths)
      relativeInstancePath = k.split(".").pop() || "";
    }

    // Build the modifier key by appending the relative instance path to the base instance path
    const modKey = [baseInstancePath, relativeInstancePath]
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
  mods: {
    [key: string]: {
      expression: Expression;
      final: boolean;
      redeclare: string;
    };
  },
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
  // For redeclare modifiers, the type is stored directly in the 'redeclare' property
  let newType = null;
  const mod = instancePath in mods ? mods[instancePath] : null;
  if (mod && mod.redeclare) {
    // The redeclare property contains the type path directly
    newType = mod.redeclare;
  }

  // Otherwise use definition type
  // - Replaceable short classes: type = aliased type, value = undefined
  // - Replaceable components: type = declared type, value = undefined or binding
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
      addToModObject(
        oMods,
        newBase,
        option.definition,
        mods,
        options,
        childOptions,
        o.modelicaPath,
      );
    }
  });

  // check for redeclare in selections or use default type
  // to grab the correct modifiers
  if (option.replaceable) {
    // - Replaceable short classes: type = aliased type, value = undefined
    // - Replaceable components: type = declared type, value = undefined or binding
    let redeclaredType: string | null | undefined = option.type;
    if (option.modelicaPath in selectionModelicaPathsCache) {
      const selectionPath = constructSelectionPath(
        option.modelicaPath,
        newBase,
      );
      const selectionValue = selections[selectionPath];
      // Only string values (Modelica paths) can be used for option lookup
      if (typeof selectionValue === "string") {
        redeclaredType = selectionValue;
      }
    }

    if (option.choiceModifiers && redeclaredType) {
      const choiceMods = option.choiceModifiers[redeclaredType];
      if (choiceMods) {
        addToModObject(
          choiceMods,
          newBase,
          option.definition,
          mods,
          options,
          childOptions,
          redeclaredType,
        );
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
      const typeOptionPath = getReplaceableType(
        newBase,
        option,
        mods,
        selections,
        options,
      );
      const typeOption = options[typeOptionPath as string];

      if (typeOption && typeOption.options) {
        // Add modifiers from type option
        if (typeOption.modifiers) {
          addToModObject(
            typeOption.modifiers,
            newBase,
            typeOption.definition,
            mods,
            options,
            typeOption.options,
            typeOption.modelicaPath,
          );
        }

        // Each parent class must also be visited
        // See https://github.com/lbl-srg/ctrl-flow-dev/issues/360
        typeOption.treeList
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
          });

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
      if (option) {
        if (option.definition) {
          this._previousInstancePath = null;
          this.addToCache(path, optionPath, path);
          return path;
        }
        optionPath = path;
      }
    }
    if (!optionPath) {
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
      if (val !== undefined && val !== null) {
        this._previousInstancePath = null;
        this.addToCache(path, optionPath, val);
        return val;
      }
    }

    // return whatever value is present on the original option definition
    const optionScope = instancePath.split(".").slice(0, -1).join(".");
    const option = this.options[optionPath];
    // - For replaceable elements: value is "" if no binding, use type instead
    // - For non-replaceable elements: use value directly
    const optionValue =
      option?.replaceable && !option?.value ? option?.type : option?.value;
    val = evaluate(optionValue, this, optionScope);
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
    // For replaceable components, value is "" if no binding, so we fallback to type
    const type =
      option?.replaceable && value ? (value as string) : option?.["type"];
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
        value !== undefined || option.type === "String";

      if (addToResolvedValues) {
        const selectionPath = constructSelectionPath(optionPath, key);
        evaluatedValues[selectionPath] = value;
      }
    });
    return evaluatedValues;
  }
}
