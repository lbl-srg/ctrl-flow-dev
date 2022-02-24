/**
 * Templates provide a tree of available options for a given system
 * 
 * This file has helper methods to help what options should be available and
 * submitted based on the user selction
 */

 import { getChangedValues } from "./utils";

 import {
    useStore,
    Configuration,
    System,
    Option,
} from "../store/store";

export type OptionRelation = {parent?: Option | undefined, children?: Option[] | undefined};
export type ConfigFormValues = & {[key: string]: number | string, configName: string} 

/**
 * Makes a map [option id] -> {parent, children} to help with bidirectional traversal
 * of the option tree
 * @param options 
 * @returns {[key: number]: OptionRelation}
 */
const buildOptionMap = (options: Option[]): {[key: number]: OptionRelation} => {
  const optionMap: {[key: number]: OptionRelation} = {};

  options.map(option => {
    const optionRelation = optionMap[option.id] || {};
    optionRelation.children = option.options?.map(childID => options.find(o => o.id === childID) as Option);

    // initalize children in map
    optionRelation.children?.map(childOption => {
      const childOptionRelation = optionMap[childOption.id] || {};
      childOptionRelation.parent = option;
      optionMap[childOption.id] = childOptionRelation;
    });
    optionMap[option.id] = optionRelation;
  });

  return optionMap;
}

/**
 * Traverses the tree of current selections for a given config and maps it
 * to a format convenient for formik
 */
export const getInitialFormValues =
    (template: System, config: Configuration, options: Option[]): {[key: number]: number | string} => {
    const initValues: {[key: string]: number | string} = {};
    const selections = config?.selections || [];

    selections.map(s => {
        const parentOption = options.find(o => o.options?.includes(s.id));
        if (parentOption) {
          initValues[parentOption.name] = s.id;
        }
    });

    return initValues;
}

/**
 * When given a set of values from formik, this helper method figures out
 * the full set of currently specified options for a given configuration and
 * updates the store
 */
export const getSelections = (
  values: ConfigFormValues,
  initValues: ConfigFormValues,
  config: Configuration,
  options: Option[]): Option[] => {
  const optionMap = buildOptionMap(options);
  const { configName, ...confSelections } = values // extract out name
  const changedSelections = getChangedValues(confSelections, initValues) as ConfigFormValues;
  const parentList: Option[] = Object.values(changedSelections)
    .map(sID => optionMap[Number(sID)].parent)
    .filter(o => o !== undefined) as Option[];

  const selectionsToFilter: string[] = []

  // build up list of options to remove from selection (by parent name string)
  while (parentList.length > 0) {
    const parent = parentList.pop() as Option;
    if (parent) {
      const children = optionMap[parent.id].children;
      if (children) {
        parentList.push(...children);
      }
    }
    selectionsToFilter.push(parent.name);
  }

  // get existing selections, filter out removed options
  const selections = Object.entries(values)
    .filter(([key, _]) => selectionsToFilter.indexOf(key) < 0)
    .map(([_, id]) => options.find(o => o.id === Number(id)))
    .filter(o => o !== undefined) as Option[];

  // get changed options
  const changedOptions = Object.values(changedSelections)
    .map(oID => options.find(o => o.id === Number(oID)))
    .filter(o => o !== undefined) as Option[];

  // append to get full set of options for the current config
  selections.push(...changedOptions);

  return selections;
}