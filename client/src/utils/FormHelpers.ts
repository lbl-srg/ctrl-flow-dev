/**
 * Templates provide a tree of available options for a given system
 *
 * This file has helper methods to help what options should be available and
 * submitted based on the user selction
 */

import { getChangedValues } from "./utils";

import {
  Configuration,
  SystemTemplate,
  Option,
  Selection,
} from "../store/store";

export type OptionRelation = {
  parent?: Option | undefined;
  children?: Option[] | undefined;
};
export type ConfigFormValues = {
  [key: string]: number | string;
  configName: string;
};

/**
 * Traverses the tree of current selections for a given config and maps it
 * to a format convenient for formik
 */
export const getInitialFormValues = (
  template: SystemTemplate,
  config: Configuration,
  options: Option[],
): { [key: number]: number | string } => {
  const initValues: { [key: string]: number | string } = {};
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
export const getSelections = (
  values: ConfigFormValues,
  initValues: { [key: string]: number },
  options: Option[],
): Selection[] => {
  const { configName, ...confSelections } = values; // extract out name
  const newSelectionsFormValues = getChangedValues(
    confSelections,
    initValues,
  ) as ConfigFormValues;

  // build up new selections from changed selections
  const newSelections: Selection[] = Object.entries(
    newSelectionsFormValues,
  ).map(([parentName, optionID]) => {
    return {
      parent: options.find((o) => o.name === parentName),
      option: options.find((o) => o.id === optionID),
    } as Selection;
  });

  return newSelections;
};
