/**
 * Able to generate the current context of values by interpreting
 * the following sources:
 *
 * - pre-defined values in the template
 * - user selections for the template and project
 */

import { OptionInterface, TemplateInterface } from "../data/template";
import {
  applyOptionModifier,
  applyValueModifiers,
  Modifiers,
  getUpdatedModifiers,
  ConfigValues,
} from "./modifier-helpers";

/**
 * For a given configuration, returns the current context
 * of values
 *
 * value 'keys' have the following format:
 *
 * `${modelicaPath}-${instancePath}`
 *
 * @param template
 * @param configId
 * @returns
 */
export const getContext = (
  template: TemplateInterface,
  configId: string | undefined,
  configStore: any,
  templateStore: any,
  projectStore: any,
) => {
  // get all options for reference
  const allOptions: { [key: string]: OptionInterface } =
    templateStore.getAllOptions();

  const templateModifiers: Modifiers = templateStore.getModifiersForTemplate(
    template?.modelicaPath,
  );

  const projectSelections: ConfigValues = projectStore.getProjectSelections();
  const projectEvaluatedValues: ConfigValues =
    projectStore.getProjectEvaluatedValues();
  const selections: ConfigValues = configStore.getConfigSelections(configId);
  const selectedValues = { ...selections, ...projectSelections };
  const templateOptions: OptionInterface[] =
    templateStore.getOptionsForTemplate(template?.modelicaPath);

  // template defaults + selections. First pass
  const configModifiers: Modifiers = getUpdatedModifiers(
    selectedValues,
    templateModifiers,
    templateStore._options,
  );

  // Resolve expressions
  const evaluatedValues: ConfigValues = {
    ...getEvaluatedValues(
      templateOptions,
      "",
      false,
      selectedValues,
      configModifiers,
      template?.pathModifiers,
      allOptions,
    ),
    ...projectEvaluatedValues,
  };

  const context = getUpdatedModifiers(
    { ...evaluatedValues, ...selectedValues },
    configModifiers,
    templateStore._options,
  );

  return { configModifiers: context, evaluatedValues };
};

//
function getEvaluatedValues(
  options: OptionInterface[],
  scope: string,
  changeScope: boolean,
  selectedValues: any,
  configModifiers: any,
  pathModifiers: any,
  allOptions: any,
): ConfigValues {
  let evaluatedValues: ConfigValues = {};
  let currentScope = scope;

  options.forEach((option) => {
    if (option.modelicaPath.includes(`.dat`)) {
      return;
    }

    // update local scope by appending parameter name if true
    if (changeScope) {
      const instance = option.modelicaPath.split(".").pop() || "";
      currentScope = scope ? `${scope}.${instance}` : instance;
    }

    //
    if (option.replaceable) {
      option = applyOptionModifier(
        option,
        currentScope,
        selectedValues,
        configModifiers,
        pathModifiers,
        allOptions,
      );
    }

    // build selection path
    const selectionPath = `${option.modelicaPath}-${currentScope}`;

    evaluatedValues = {
      ...evaluatedValues,
      [selectionPath]: applyValueModifiers(
        option?.value,
        currentScope,
        selectionPath,
        selectedValues,
        configModifiers,
        pathModifiers,
        allOptions,
      ),
    };

    if (option.childOptions?.length) {
      evaluatedValues = {
        ...evaluatedValues,
        ...getEvaluatedValues(
          option.childOptions,
          currentScope,
          option.definition,
          selectedValues,
          configModifiers,
          pathModifiers,
          allOptions,
        ),
      };
    }
  });

  return evaluatedValues;
}
