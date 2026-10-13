import { ConfigContext } from "./interpreter";
import { ConfigValues } from "../utils/modifier-helpers";

/**
 * Computes the values stored in a configuration when it is saved:
 * the selections of displayed options, and the values evaluated by the context.
 * Both only hold the elements of the template: the project settings are saved
 * with the project.
 *
 * Values are lazily evaluated: the context must have been mapped to display
 * options (mapToDisplayOptions) beforehand, as done when the configuration
 * panel is rendered.
 */
export function getConfigValuesToSave(
  context: ConfigContext,
  selectedValues: ConfigValues,
): { selections: ConfigValues; evaluatedValues: ConfigValues } {
  const selections: ConfigValues = {};
  Object.entries(selectedValues).map(([key, value]) => {
    if (context.isValidSelection(key)) {
      selections[key] = value;
    }
  });
  return { selections, evaluatedValues: context.getEvaluatedValues() };
}
