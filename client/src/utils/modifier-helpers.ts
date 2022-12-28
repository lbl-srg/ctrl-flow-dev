import { OptionInterface } from "../data/template";
import { deepCopy } from "./utils";
import {
  Expression,
  evaluateExpression,
  isExpression,
  resolveSymbol,
} from "./expression-helpers";

export type Modifiers = {
  [key: string]: Expression;
};

export interface ConfigValues {
  [key: string]: string;
}

type PathModifier = { [key: string]: string | undefined };

/**
 * Combines two modifier objects together by recursively going through newModifiers
 *
 * 'baseInstancePath' is used to construct the instance path name
 *
 * @param newModifiers: new modifier object
 * @param baseInstancePath: used to correctly construct the instance path name (providing the appropriate scope)
 * @param modifiers: modifier object getting udpated
 * @param options: full list of options for referencing other types
 * @param recursive: continue traversing down modifier trees
 */
function addToModObject(
  newModifiers: Modifiers,
  baseInstancePath: string,
  modifiers: Modifiers,
  options: { [key: string]: OptionInterface },
  recursive = true,
) {
  Object.entries(newModifiers).forEach(([k, expression]) => {
    const instanceName = k.split(".").pop();
    const modKey = [baseInstancePath, instanceName]
      .filter((segment) => segment !== "")
      .join(".");

    // Do not add a key that is already present. The assumption is that
    // the first time an instance path is present is the most up-to-date
    if (!(modKey in modifiers)) {
      modifiers[modKey] = expression;
    }

    if (recursive) {
      // grab modifiers from original definition
      const modOption = options[k] as OptionInterface;
      if (modOption?.modifiers) {
        addToModObject(
          newModifiers,
          baseInstancePath,
          modifiers,
          options,
          false,
        );
      }
    }
  });
}

/**
 * When given an option, adds that options modifiers to the provided modifier
 * object
 *
 * @param option: option to grab modifiers from
 * @param baseInstancePath: current scope to append to the front of modifier instance paths
 * @param modifiers: modifier object that gets mutated
 * @param options: all option reference
 * @returns
 */
function updateModifiers(
  option: OptionInterface,
  baseInstancePath: string,
  modifiers: Modifiers,
  options: { [key: string]: OptionInterface },
) {
  if (option === undefined) {
    return; // TODO: not sure this should be allowed - failing with 'Medium'
  }
  const optionModifiers = option.modifiers as Modifiers;
  const childOptions = option.options;

  // grab the current options modifiers
  if (optionModifiers) {
    addToModObject(optionModifiers, baseInstancePath, modifiers, options);
  }

  // if this is a definition - visit all child options and grab modifiers
  if (childOptions) {
    const name = option.modelicaPath.split(".").pop();
    const newBase = option.definition
      ? baseInstancePath
      : [baseInstancePath, name].filter((p) => p !== "").join(".");

    if (option.definition) {
      childOptions.map((path) => {
        const childOption = options[path] as OptionInterface;

        updateModifiers(childOption, newBase, modifiers, options);
      });
    } else {
      // this is a parameter (either replaceable or enum) - grab the type and its modifiers
      // only use the 'type', not child options to fetch modifiers (default options)
      const typeOption = options[option.type];
      if (typeOption && typeOption.options) {
        // add modifiers from type option
        if (typeOption.modifiers) {
          addToModObject(typeOption.modifiers, newBase, modifiers, options);
        }
        typeOption.options.map((path) => {
          const childOption = options[path] as OptionInterface;

          updateModifiers(childOption, newBase, modifiers, options);
        });
      }
    }
  }
}

/**
 * Entry method to build the modifier object
 *
 * @param startOption
 * @param baseInstancePath
 * @param baseModifiers
 * @param options
 * @param addProjectMods
 * @returns
 */
export function buildModifiers(
  startOption: OptionInterface,
  baseInstancePath: string,
  baseModifiers: Modifiers,
  options: { [key: string]: OptionInterface },
  addProjectMods = true,
): Modifiers {
  const modifiers: Modifiers = { ...baseModifiers };
  if (addProjectMods) {
    const datAll = options["datAll"]; // project settings
    updateModifiers(datAll, "", modifiers, options);
  }
  updateModifiers(startOption, baseInstancePath, modifiers, options);

  return modifiers;
}

/**
 * Update path based on the provided path modifiers
 *
 * e.g. if we have a path mod of 'ctl.secOutRel' -> 'secOutRel'
 *
 * The path 'ctl.secOutRel.typ' become 'secOutRel.typ'
 */
export function applyPathModifiers(
  scopePath: string,
  pathModifiers: PathModifier | undefined,
): string {
  const splitScopePath = scopePath.split(".");
  let postFix: string | undefined = "";
  let modifiedPath = scopePath;

  while (splitScopePath.length > 0) {
    const testPath = splitScopePath.join(".");
    if (pathModifiers && pathModifiers[testPath]) {
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
 *
 * @param option
 * @param scope
 * @param selections
 * @param modifiers
 * @param pathModifiers
 * @param allOptions
 * @returns
 */
export function applyOptionModifier(
  option: OptionInterface,
  scope: string,
  selections: ConfigValues,
  modifiers: Modifiers,
  pathModifiers: PathModifier | undefined,
  allOptions: { [key: string]: OptionInterface },
): OptionInterface {
  const modifier = deepCopy(modifiers[scope]);

  if (!isExpression(modifier?.expression)) {
    return option;
  }

  const resolved_expression = evaluateExpression(
    modifier.expression,
    scope,
    "",
    selections,
    modifiers,
    pathModifiers,
    allOptions,
  );

  return allOptions[resolved_expression] || option;
}

/**
 * Attempt to resolve a value
 */
export function applyValueModifiers(
  optionValue: any,
  scope: string,
  selectionPath: string,
  selections: any,
  modifiers: Modifiers,
  pathModifiers: PathModifier,
  allOptions: { [key: string]: OptionInterface },
) {
  let evaluatedValue: any = undefined;

  if (!isExpression(optionValue)) {
    evaluatedValue = resolveSymbol(
      optionValue,
      scope,
      selectionPath,
      selections,
      modifiers,
      pathModifiers,
      allOptions,
    );

    // return evaluatedValue if it has fully resolved otherwise return null
    return evaluatedValue !== "no_value" ? evaluatedValue : null;
  }

  const expression = deepCopy(optionValue);

  evaluatedValue = evaluateExpression(
    expression,
    scope,
    "",
    selections,
    modifiers,
    pathModifiers,
    allOptions,
  );

  // return evaluatedValue if it has fully resolved otherwise return null
  return !isExpression(evaluatedValue) ? evaluatedValue : null;
}

export function applyVisibilityModifiers(
  option: OptionInterface,
  scope: string,
  selections: any,
  modifiers: Modifiers,
  pathModifiers: PathModifier | undefined,
  allOptions: { [key: string]: OptionInterface },
): boolean {
  const scopePath = applyPathModifiers(scope, pathModifiers);
  const modifier: any = modifiers[scopePath];
  let enable: Expression | boolean | undefined = isExpression(option.enable)
    ? deepCopy(option.enable)
    : option.enable;
  let visible: boolean | undefined = option.visible;

  if (isExpression(enable)) {
    enable = evaluateExpression(
      enable,
      scope,
      "",
      selections,
      modifiers,
      pathModifiers,
      allOptions,
    );

    // 'enable' value is still an expression, set to false
    if (isExpression(enable)) {
      enable = false;
    }
  }

  if (modifier?.final !== undefined) {
    visible = option.visible && !modifier.final;
  }

  // !! is to ensure we have a type of bool
  return !!(visible && enable);
}

/**
 * Replaceable components can be swapped by either:
 * - having a selection made by the user
 * - a redeclared modifier
 *
 * Modifiers are collected by traversing the tree of related options, grabbing
 * each visited options modifiers and putting it in the global modifiers object
 *
 * Selections or redeclare modifiers decide which branch to take for the specified
 * node, overwriting any previous modifier values that might have been present
 *
 * e.g.
 *
 *             A         // 'A' is a replaceable component
 *            /  \
 *           B    C __   // 'B' and 'C' are choices
 *          / \    \   \
 *         D=1 E=2  D=3  E=4
 *
 * The default value (what is present in `option.value`) might point to the choice B, which means all of
 * 'B's downstream values for D and E are included ('1' and '2')
 *
 * If 'C' is selected, all of its downstream values need to be in the modifier object,
 * meaing D has a value of '3' and E '4'
 *
 * Also: a redeclare modifier (not included as a user selection) has the same behavior
 */
export function getUpdatedModifiers(
  values: ConfigValues,
  modifiers: Modifiers,
  allOptions: { [key: string]: OptionInterface },
) {
  const optionKeys: string[] = Object.keys(values);
  let updatedModifiers: Modifiers = deepCopy(modifiers);

  optionKeys.forEach((key) => {
    if (values[key] !== null) {
      const [modelicaPath, instancePath] = key.split("-");
      const option = allOptions[modelicaPath] as OptionInterface;

      // Merge and overwrite based on the selected/redeclared option
      updatedModifiers = {
        ...updatedModifiers,
        ...buildModifiers(
          option,
          instancePath,
          updatedModifiers,
          allOptions,
          false,
        ),
      };
    }
  });

  return updatedModifiers;
}
