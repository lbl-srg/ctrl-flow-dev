import { ConfigInterface } from "../../src/data/config";
import { TemplateInterface, OptionInterface } from "../../src/data/template";
import { removeEmpty } from "../../src/utils/utils";
import { ConfigValues } from "../utils/modifier-helpers";
import {
  enclosingName,
  firstIdent,
  isName,
  lastIdent,
  splitName,
  splitSelectionKey,
} from "../utils/names";

export type Literal = boolean | string | number;

export type Expression = {
  operator: string;
  operands: Array<Literal | Expression>;
};

// Predicate return type lets TS narrow: true → Expression, false → Exclude<T, Expression>.
// Since Literal (boolean | string | number) and Expression ({operator, operands}) are disjoint,
// the false branch collapses to Literal with no cast needed at call sites.
function isExpression(item: any): item is Expression {
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
  expression?: Expression | string;
  final: boolean;
  fromClassDefinition: boolean;
  redeclare?: string; // the redeclared type path, undefined if not a redeclare
  recordBinding?: boolean;
  /**
   * The depth of the nested modification path (number of segments).
   * For a modifier key like "fan.eff.per.pressure" where baseInstancePath="fan",
   * the relativeInstancePath is "eff.per.pressure" with depth 3.
   * Used to determine the correct scope when resolving relative binding paths.
   */
  modificationDepth?: number;
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
  const segments = splitName(scope);
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
  const splitScopePath = splitName(path);
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

const ALL_SYSTEMS = "Buildings.Templates.Data.AllSystems";

/**
 * What the resolution functions read from a ConfigContext. buildMods passes
 * the modifiers it is building.
 */
interface ResolutionContext {
  options: { [key: string]: OptionInterface };
  mods: { [key: string]: Modifier };
  /** Selected class by instance path, see `selectedClasses` */
  selectedClasses: { [key: string]: string };
}

/**
 * Selections that may hold a class, by instance path: string values of keys
 * with an instance path. If several keys have the same instance path, the
 * last one wins.
 */
export function selectedClasses(selections: ConfigValues): {
  [key: string]: string;
} {
  const classes: { [key: string]: string } = {};
  Object.entries(selections).forEach(([key, value]) => {
    const [, instancePath] = splitSelectionKey(key);
    if (instancePath !== undefined && typeof value === "string") {
      classes[instancePath] = value;
    }
  });
  return classes;
}

/**
 * Option path of the element `name` declared or inherited in the class
 * `classPath`, or null. The template is handled like any other class.
 */
export function memberOption(
  classPath: string,
  name: string,
  ctx: Pick<ResolutionContext, "options">,
): string | null {
  const optionPath = ctx.options[classPath]?.options?.find(
    (o) => lastIdent(o) === name,
  );
  return optionPath && optionPath in ctx.options ? optionPath : null;
}

/**
 * Class of the element at `path`, declared by `declaredOption`. For a
 * replaceable element, it is the first of:
 * 1. the class selected by the user,
 * 2. the class of a redeclare modification,
 * 3. the declared type.
 * A short class is followed to the class it aliases.
 *
 * The class is not necessarily an option, e.g. for predefined types.
 */
export function effectiveClass(
  path: string,
  declaredOption: OptionInterface,
  ctx: ResolutionContext,
): string {
  const { options } = ctx;
  let classPath: string | undefined;
  if (declaredOption.replaceable) {
    classPath = [ctx.selectedClasses[path], ctx.mods[path]?.redeclare].find(
      (c) => c !== undefined && c in options,
    );
  }
  // The inner declaration of datAll is outside of the template
  if (!classPath && lastIdent(declaredOption.modelicaPath) === "datAll") {
    classPath = ALL_SYSTEMS;
  }
  classPath ??= declaredOption.type;
  while (options[classPath]?.shortExclType) {
    classPath = options[classPath].type;
  }
  return classPath;
}

/**
 * Path of the record bound to the element at `path`, declared by `option`,
 * null if the element is not bound to a record, or false if it is bound to
 * an expression that is not a name, as a record constructor
 * (`rec = Rec(p=1)`). The elements of a bound record are reached through the
 * binding (docs/selection-keys.md, rule 2).
 *
 * The binding is a modifier at the instantiation site (`Mod mod(rec=localRec)`)
 * or the value of the declaration (`Rec localRec = rec`). Modifier bindings
 * take precedence over class-definition bindings.
 */
export function bindingRedirect(
  path: string,
  option: OptionInterface,
  ctx: ResolutionContext,
): string | null | false {
  const mod = ctx.mods[path]?.recordBinding ? ctx.mods[path] : null;
  const binding = mod
    ? mod.expression
    : option.recordBinding
      ? option.value
      : undefined;
  if (binding === undefined || binding === "") {
    return null;
  }
  if (typeof binding !== "string" || !isName(binding)) {
    return false;
  }
  // The binding is relative to the scope of the modifier: modifier bindings
  // use modificationDepth/fromClassDefinition, class-definition bindings are
  // relative to the enclosing instance
  let scope: string;
  if (mod) {
    const depth = mod.modificationDepth || 1;
    scope = enclosingName(path, mod.fromClassDefinition ? depth : depth + 1);
  } else {
    scope = enclosingName(path);
  }
  return scope ? `${scope}.${binding}` : binding;
}

export interface ResolvedInstance {
  /** Option of the declaration of the element */
  optionPath: string;
  /** Class of the element, see `effectiveClass` */
  classPath: string;
  /** Instance path after inner/outer and record binding rewriting */
  resolvedPath: string;
  /** True if the path goes through an outer element, rewritten by inner/outer */
  isOuter: boolean;
  /** Option of the element reached through the outer declaration, if any */
  outerOptionPath: string | null;
}

/**
 * Walks `path` one identifier at a time: `memberOption`, then
 * `bindingRedirect`, then `effectiveClass`. Returns null if an identifier
 * cannot be resolved.
 *
 * Results are cached per context, which is valid because a context is rebuilt
 * whenever a selection changes.
 *
 * @param path instance path, with scope already applied
 * @param applyPathMods false to resolve the outer declaration
 */
export function resolveInstance(
  path: string,
  context: ConfigContext,
  applyPathMods = true,
): ResolvedInstance | null {
  const cache = applyPathMods
    ? context._resolvedInstances
    : context._resolvedOuterInstances;
  if (!(path in cache)) {
    cache[path] = _resolveInstance(path, context, applyPathMods);
  }
  return cache[path];
}

/**
 * Option path of the element `name` of the template, or null. An inner
 * element declared outside of the template, as datAll
 * (docs/selection-keys.md, rule 1), is declared by its outer declaration.
 */
const templateMember = (name: string, context: ConfigContext) => {
  const pathModifiers = context.template.pathModifiers ?? {};
  const outerPath = Object.keys(pathModifiers).find(
    (p) => pathModifiers[p] === name,
  );
  return (
    memberOption(context.template.modelicaPath, name, context) ??
    (outerPath
      ? resolveInstance(outerPath, context, false)?.optionPath
      : null) ??
    null
  );
};

const _resolveInstance = (
  path: string,
  context: ConfigContext,
  applyPathMods: boolean,
): ResolvedInstance | null => {
  const { options } = context;
  const resolvedPath = applyPathMods
    ? applyPathModifiers(path, context.template.pathModifiers)
    : path;
  const isOuter = resolvedPath !== path;

  const [first, ...rest] = splitName(resolvedPath);
  let elementPath = first;
  let optionPath = templateMember(first, context);
  if (!optionPath) {
    return null;
  }
  while (rest.length > 0) {
    const classPath = effectiveClass(elementPath, options[optionPath], context);
    const name = rest.shift() as string;
    elementPath = `${elementPath}.${name}`;
    optionPath = memberOption(classPath, name, context);
    if (!optionPath) {
      return null;
    }
    // Only the elements of a bound record are reached through the binding,
    // not the record itself
    const binding =
      rest.length > 0
        ? bindingRedirect(elementPath, options[optionPath], context)
        : null;
    // The elements of a record bound to an expression cannot be modified,
    // and their values are not known
    if (binding === false) {
      return null;
    }
    if (binding) {
      return resolveInstance(
        [binding, ...rest].join("."),
        context,
        applyPathMods,
      );
    }
  }
  return {
    optionPath,
    classPath: effectiveClass(resolvedPath, options[optionPath], context),
    resolvedPath,
    isOuter,
    outerOptionPath: isOuter
      ? (resolveInstance(path, context, false)?.optionPath ?? null)
      : null,
  };
};

/** Returns true if `name` is a syntactically valid Modelica name.
 * Name = [ `.` ] IDENT { `.` IDENT }, where IDENT may be a quoted identifier
 */
export function isValidModelicaName(name: string): boolean {
  return isName(name);
}

const LOADED_LIBRARIES = ["Modelica", "Buildings"];
const TEST_LIBRARIES =
  process.env.NODE_ENV === "test"
    ? ["TestRecord", "TestPackage", "QuotedPackage"]
    : [];

/**
 * Returns true if `path` is a syntactically valid Modelica name whose root
 * package matches a loaded or test library.
 *
 * TODO (technical debt): `LOADED_LIBRARIES` should come from a configuration
 * file rather than being hard-coded.
 */
function isFullyQualifiedName(
  path: string,
  loadedLibraries = LOADED_LIBRARIES,
  testLibraries = TEST_LIBRARIES,
): boolean {
  if (!isValidModelicaName(path)) {
    return false;
  }
  // Extract root package name (get rid of optional leading `.`)
  const root = firstIdent(path.replace(/^\./, ""));
  return (
    loadedLibraries.some((lib) => root === lib) ||
    testLibraries.some((lib) => root === lib)
  );
}

/**
 * Resolves the provided path using scope to correct
 * instance path, and the original option definition
 *
 * This creates the behavior of popping off scope to check
 * for a variable reference, e.g. `mAirSup_flow_nominal` in scope `dat.damOut`
 * is `dat.mAirSup_flow_nominal`, because `dat.damOut.mAirSup_flow_nominal` is
 * not an element. As in Modelica (MLS 5.3.1), only the first identifier is
 * looked up in the enclosing scopes: if it is found, the rest of the path is
 * resolved in that element only.
 */
export function resolvePaths(
  path: string,
  context: ConfigContext,
  scope = "",
): {
  optionPath: string | null;
  instancePath: string;
  outerOptionPath: string | null | undefined;
  classPath?: string;
  isOuter?: boolean;
} {
  const heads = createPossiblePaths(scope, firstIdent(path));
  for (const [i, p] of createPossiblePaths(scope, path).entries()) {
    const resolution = resolveInstance(p, context);
    if (resolution) {
      return {
        optionPath: resolution.optionPath,
        instancePath: resolution.resolvedPath,
        outerOptionPath: resolution.outerOptionPath,
        classPath: resolution.classPath,
        isOuter: resolution.isOuter,
      };
    }
    if (heads[i] !== p && resolveInstance(heads[i], context)) {
      break;
    }
  }
  return { optionPath: null, instancePath: path, outerOptionPath: null };
}

///////////////// Expression Evaluation
type Comparator = ">" | ">=" | "<" | "<=";
export type OperatorType =
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
 * Resolve a Literal operand to its value.
 * - Numbers and booleans are returned as-is.
 * - Fully qualified Modelica names are returned as-is.
 * - Strings that are not valid Modelica names are JSON-parsed (e.g. `"\"foo\""` → `"foo"`),
 *   falling back to the raw string if parsing fails.
 * - Valid Modelica names that are not fully qualified are looked up via `getValue`;
 *   returned as-is when no context is provided.
 */
export const resolveToValue = (
  operand: Literal,
  context?: ConfigContext,
  scope = "",
): Literal | null | undefined => {
  if (typeof operand !== "string") {
    return operand;
  }

  if (isFullyQualifiedName(operand)) {
    // Fully qualified names are bare comparables: return as-is
    return operand;
  }

  if (!isValidModelicaName(operand)) {
    try {
      const value = JSON.parse(operand); // "\"String literal\"" → "String literal"
      return value;
    } catch {
      return operand; // "Any.Type" unchanged, "{\"String literal\"}" unchanged
    }
  }

  if (!context) {
    return operand;
  }

  const { instancePath, optionPath } = resolvePaths(operand, context, scope);
  const instancePathScope = enclosingName(instancePath);
  // have the actual instance path, check for cached value
  let value = context._getCachedValue(instancePath);
  // if no value, check instance path now that scope should be properly applied
  if (value === undefined || value === null) {
    const fetched = context.getValue(instancePath);
    value = isExpression(fetched) ? undefined : fetched;
  }
  // fallback to the original option
  if ((value === undefined || value === null) && optionPath) {
    const typeOption = context.options[optionPath];
    if (typeOption?.definition) {
      value = typeOption.modelicaPath;
    } else if (typeOption && "value" in typeOption) {
      const potentialExpression = typeOption?.value; // enums
      const evaluated = evaluate(potentialExpression, context, instancePathScope);
      value = isExpression(evaluated) ? undefined : evaluated;
    }
  }

  // A looked-up value may itself be a quoted string literal (e.g. `"\"foo\""` stored in
  // selections). Run it through resolveToValue so the quoting is stripped, the same
  // way it would be for any other literal operand that appears directly in an expression.
  return typeof value === "string"
    ? resolveToValue(value, context, scope)
    : value;
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
  const expressionScope = enclosingName(
    instancePath,
    mod?.fromClassDefinition ? 1 : 2,
  );
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
): Literal | null | Expression | undefined => {
  let val: Literal | null | Expression | undefined = null;

  if (!isExpression(possibleExpression)) {
    return resolveToValue(possibleExpression as Literal, context, scope);
  }

  const expression = possibleExpression as Expression;

  switch (expression.operator) {
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
        isExpression(o)
          ? evaluate(o as Expression, context, scope)
          : resolveToValue(o, context, scope),
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
        isExpression(o)
          ? evaluate(o as Expression, context, scope)
          : resolveToValue(o, context, scope),
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
      expression?: Expression | string;
      final: boolean;
      redeclare?: string;
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
      // Fallback: use last segment
      relativeInstancePath = lastIdent(k);
    }

    // Build the modifier key by appending the relative instance path to the base instance path
    const modKey = [baseInstancePath, relativeInstancePath]
      .filter((segment) => segment !== "")
      .join(".");

    // Calculate the modification depth (number of segments in the nested path)
    // e.g., "eff.per.pressure" has depth 3
    const modificationDepth = relativeInstancePath
      ? splitName(relativeInstancePath).length
      : 0;

    // Do not add a key that is already present. The assumption is that
    // the first time an instance path is present is the most up-to-date
    if (!(modKey in mods)) {
      mods[modKey] = {
        ...mod,
        ...{ ["fromClassDefinition"]: fromClassDefinition },
        ...{ ["modificationDepth"]: modificationDepth },
      };
    } else if (mod.redeclare && !mods[modKey].redeclare) {
      // An outer binding does not override an inner redeclaration
      // (MLS 7.2.4): `ctl(dat=dat.ctl)` in the template and
      // `extends PartialController(redeclare VAVBoxController dat)` in the
      // class of ctl give dat=dat.ctl and the class VAVBoxController
      mods[modKey] = { ...mods[modKey], redeclare: mod.redeclare };
    }
  });
};

/**
 * Recursive helper method
 * @returns
 */
const buildModsHelper = (
  option: OptionInterface,
  baseInstancePath: string,
  ctx: ResolutionContext,
  isRootTemplate = false, // true only for the initial template option
) => {
  const { options, mods } = ctx;
  if (option === undefined) {
    return; // PUNCH-OUT! references to 'Medium' fail here
  }

  // fetch all modifiers from up the inheritance hierarchy
  const name = lastIdent(option.modelicaPath);
  const newBase =
    option.definition && !option.shortExclType // short class definitions are treated as instances
      ? baseInstancePath
      : [baseInstancePath, name].filter((p) => p !== "").join(".");
  const childOptions = option.options;

  const optionsWithModsList: string[] =
    option.treeList && option.treeList.length > 0
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

  // grab the modifiers of the choice of the replaceable element
  if (option.replaceable) {
    const redeclaredType = effectiveClass(newBase, option, ctx);
    if (option.choiceModifiers) {
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

  // if this is a long class definition visit all elements and grab modifiers
  if (childOptions) {
    if (option.definition && !option.shortExclType) {
      // Only visit elements of class definitions that are at the root level
      // (i.e., the template itself). Nested class definitions within the template
      // should not have their elements added as root-level instance paths.
      // Those will be handled when actual instances of those classes are visited.
      if (!isRootTemplate) {
        // This is a nested class definition - skip visiting its elements
        // as they would incorrectly be added at the wrong instance path
        return;
      }
      childOptions.map((path) => {
        const childOption = options[path];
        buildModsHelper(
          childOption,
          newBase,
          ctx,
          false, // elements are not the root template
        );
      });
    } else {
      const typeOptionPath = effectiveClass(newBase, option, ctx);
      const typeOption = options[typeOptionPath];

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
          ?.filter((path) => path !== typeOptionPath) // Exclude current class from being visited again
          .map((oPath) => {
            const o = options[oPath];
            buildModsHelper(o, newBase, ctx, false);
          });

        // Further populate `mods` with all options belonging to this class
        typeOption.options.map((path) => {
          const childOption = options[path];

          buildModsHelper(childOption, newBase, ctx, false);
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
  buildModsHelper(
    /* option */ startOption,
    /* baseInstancePath */ "",
    /* ctx */ { options, mods, selectedClasses: selectedClasses(selections) },
    /* isRootTemplate */ true,
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
export class ConfigContext implements ResolutionContext {
  mods: { [key: string]: Modifier } = {};
  selectedClasses: { [key: string]: string };
  _resolvedValues: {
    [key: string]: { value: Literal | null; optionPath: string };
  } = {};
  _resolvedInstances: { [key: string]: ResolvedInstance | null } = {};
  _resolvedOuterInstances: { [key: string]: ResolvedInstance | null } = {};
  _previousInstancePath: string | null = null;

  constructor(
    public template: TemplateInterface,
    public config: ConfigInterface,
    public options: { [key: string]: OptionInterface },
    public selections: ConfigValues = {},
  ) {
    this.selectedClasses = selectedClasses(selections);
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

    if (isFullyQualifiedName(path)) {
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
    const optionScope = enclosingName(instancePath);
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
    const typeOption = this.options[instanceOption?.type as string] || null;
    const okDepth = depth !== null ? depth > 0 : true;
    if (typeOption && !isOuter && okDepth) {
      typeOption.options?.map((o) => {
        const paramName = lastIdent(o);
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
      const paramName = lastIdent(o);
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
    const paths = splitSelectionKey(selectionPath);
    if (paths.length == 2) {
      const [, instancePath] = paths;
      const instance = this.getOptionInstance(instancePath);
      return !!instance?.display;
    } else {
      return true; // AllSystem settings don't have a dash
    }
  }

  /**
   * True if the instance is explicitly disabled by a Dialog(enable=...)
   * annotation that evaluates to false. A disabled instance disables its
   * whole subtree: parameters under it are not user-editable regardless of
   * their own enable annotation. The check operates on the instance tree
   * (not the class definition) since the same class may be reachable through
   * both a disabled and an enabled instance path.
   */
  _isInstanceDisabled(instancePath: string): boolean {
    if (!instancePath) {
      return false;
    }
    const { optionPath } = resolvePaths(instancePath, this);
    const option = optionPath ? this.options[optionPath] : undefined;
    // `enable` is never synthesized to false by the parser: undefined marks a
    // plain composite group, whose children remain live
    if (option?.enable === undefined) {
      return false;
    }
    const scope = enclosingName(instancePath);
    const enable = evaluate(option.enable, this, scope);
    // an unresolvable expression is NOT treated as disabled
    return !isExpression(enable) && !enable;
  }

  _isAncestorDisabled(instancePath: string): boolean {
    const segments = splitName(instancePath);
    for (let i = segments.length - 1; i > 0; i--) {
      if (this._isInstanceDisabled(segments.slice(0, i).join("."))) {
        return true;
      }
    }
    return false;
  }

  /**
   * Returns an OptionInstance for the provided instance path. OptionInstance
   * bakes in useful info related to make it easier to map to a display format
   */
  getOptionInstance(path: string, scope = ""): OptionInstance | undefined {
    const { instancePath, optionPath, classPath, isOuter } = resolvePaths(
      path,
      this,
      scope,
    );
    if (!optionPath || optionPath.startsWith("Modelica")) {
      return;
    }

    let value = this.getValue(instancePath);
    let display = false;

    // option instances do not get expressions assigned
    if (isExpression(value)) {
      value = undefined;
    }
    const option = this.options[optionPath as string];
    const type = (classPath ?? option?.type) as string;
    const castValue = value as Literal | null | undefined;
    const optionInstance = {
      value: castValue,
      display,
      option: option,
      instancePath,
      isOuter: !!isOuter,
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
        ? evaluate(option?.enable, this, enclosingName(instancePath))
        : false;
    display = !isExpression(enable) ? !!enable : display;
    display = isOuter
      ? false // outer elements are always hidden
      : !!(display && option.visible);
    if (display && this._isAncestorDisabled(instancePath)) {
      display = false; // any disabled ancestor hides the whole subtree
    }

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
