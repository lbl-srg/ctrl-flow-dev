import { OptionInterface } from "../data/template";
import { FlatConfigOption } from "../components/steps/Configs/SlideOut";
import {
  Expression,
  evaluateExpression,
  isExpression,
  resolveValue,
} from "./expression-helpers";

export type Modifiers = {
  [key: string]: Expression;
};

export interface ConfigValues {
  [key: string]: string;
}

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

// recursive helper method
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

export function buildModifiers(
  startOption: OptionInterface,
  baseInstancePath: string,
  baseModifiers: Modifiers,
  options: { [key: string]: OptionInterface },
): Modifiers {
  const modifiers: Modifiers = baseModifiers;

  updateModifiers(startOption, baseInstancePath, modifiers, options);

  return modifiers;
}

/**
 * Update path based on path modifiers
 *
 * e.g. if we have a path mod of 'ctl.secOutRel' -> 'secOutRel'
 *
 * The path 'ctl.secOutRel.typ' become 'secOutRel.typ'
 */
export function applyPathModifiers(
  scopePath: string,
  pathModifiers: Modifiers,
): string {
  const splitScopePath = scopePath.split(".");
  let postFix: string | undefined = "";
  let modifiedPath = scopePath;

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
 * Attempt to resolve a value
 */
export function applyValueModifiers(
  // configOption: FlatConfigOption,
  optionValue: any,
  scope: string,
  selectionPath: string,
  selections: any,
  modifiers: Modifiers,
  pathModifiers: Modifiers,
  allOptions: { [key: string]: OptionInterface },
) {
  let evaluatedValue: any = undefined;

  if (!isExpression(optionValue)) {
    evaluatedValue = resolveValue(
      // configOption?.value,
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

  evaluatedValue = evaluateExpression(
    // configOption?.value,
    optionValue,
    scope,
    selectionPath,
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
  selectionPath: string,
  selections: any,
  modifiers: Modifiers,
  pathModifiers: Modifiers,
  allOptions: { [key: string]: OptionInterface },
): boolean {
  const scopePath = applyPathModifiers(scope, pathModifiers);
  const modifier: any = modifiers[scopePath];
  let enable: Expression | boolean | undefined = option.enable;
  let visible: boolean | undefined = option.visible;

  if (isExpression(option.enable)) {
    enable = evaluateExpression(
      option.enable,
      scope,
      selectionPath,
      selections,
      modifiers,
      pathModifiers,
      allOptions,
    );

    if (isExpression(enable)) {
      enable = false;
    }
  }

  if (modifier?.final !== undefined) {
    visible = option.visible && !modifier.final;
  }

  return !!(visible && enable && option.childOptions?.length);
}

export function getUpdatedModifiers(
  values: ConfigValues,
  templateModifiers: Modifiers,
  allOptions: { [key: string]: OptionInterface },
) {
  const optionKeys: string[] = Object.keys(values);
  // let updatedModifiers: Modifiers = { ...configModifiers };
  let updatedModifiers: Modifiers = { ...templateModifiers };

  optionKeys.forEach((key) => {
    if (values[key] !== null) {
      const [modelicaPath, instancePath] = key.split("-");
      const option = allOptions[modelicaPath] as OptionInterface;

      updatedModifiers = {
        ...updatedModifiers,
        ...buildModifiers(option, instancePath, updatedModifiers, allOptions),
      };
    }
  });

  return updatedModifiers;
}
