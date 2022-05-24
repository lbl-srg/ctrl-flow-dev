/**
 * Templates provide a tree of available options for a given system
 *
 * This file has helper methods to help what options should be available and
 * submitted based on the user selction
 */

import { getChangedValues } from "./utils";

/**
 * Traverses the tree of current selections for a given config and maps it
 * to a format convenient for formik
 */
export const getInitialFormValues = (template, config, options) => {
  const initValues = {};
  const selections = config?.selections || [];

  selections.map((s) => {
    if (s.parent) {
      initValues[s.parent.name] = s.option.id;
    }
  });

  return initValues;
};

/**
 * When given a set of new selections from formik, this helper method diffs the initial
 * values with the new to just get changed selections, then converts the ConfigFormValue
 * object to a convenient shape (Selection[])for the store (Selection[])
 */
export const getSelections = (values, initValues, options) => {
  const { configName, ...confSelections } = values; // extract out name
  const newSelectionsFormValues = getChangedValues(confSelections, initValues);

  // build up new selections from changed selections
  const newSelections = Object.entries(newSelectionsFormValues).map(
    ([parentName, optionID]) => {
      return {
        parent: options.find((o) => o.name === parentName),
        option: options.find((o) => o.id === optionID),
      };
    },
  );

  return newSelections;
};
