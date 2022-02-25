/**
 * Templates provide a tree of available options for a given system
 * 
 * This file has helper methods to help what options should be available and
 * submitted based on the user selction
 */

 import { getChangedValues } from "./utils";

 import {
    Configuration,
    System,
    Option,
} from "../store/store";

export type OptionRelation = {parent?: Option | undefined, children?: Option[] | undefined};
export type ConfigFormValues = & {[key: string]: number | string, configName: string} 

/**
 * Makes a map [option id] -> {parent, children} to help with bidirectional traversal
 * of the option tree
 */
const buildOptionMap = (options: Option[]): {[key: number]: OptionRelation} => {
  const optionMap: {[key: number]: OptionRelation} = {};

  options.map(option => {
    const optionRelation = optionMap[option.id] || {};
    const children = option.options?.map(childID => options.find(o => o.id === childID) as Option);
    optionRelation.children = children;

    if (children) {
      children.map(childOption => {
        const childOptionRelation = optionMap[childOption.id] || {};
        childOptionRelation.parent = option;
        optionMap[childOption.id] = childOptionRelation;
      });
    }

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
 * When given a set of new selections from formik, this helper method figures out
 * the full set of currently specified options, trimming no longer relevant selections paths
 * for a given configuration and returns a complete array of all selections after form submission
 * 
 * General algorithm:
 * 
 * Here is an example tree of options:
 * 
 *            A
 *          /   \
 *         B     E
 *        / \   / \
 *       C   D F   G
 * 
 * If a user previously had the selection: 'E', and 'F'
 * 
 * This means we have an initial state of: {'A': 'E', 'E': 'F'} 
 * 
 * The use selects 'B', then 'D'.
 * 
 * We get a change list like this: ['B', 'D']
 * 
 * Use the optionMap to get the parents of 'B' and 'D': parentList: ['A', 'B']
 * NOTE: we may just want to add a 'parent' field in options to avoid the use of a map
 * 
 * For each node in the parent list, add that node to a filter list.
 * Then traverse to each child and also add that to the filter list
 * 
 * A has B and E: ['A', 'B', 'E']
 * B has C and D: ['A', 'B', 'C', 'B', 'D']
 * E has F and G: ['A', 'B', 'C', 'B', 'D', 'F', 'G']
 * 
 * 
 * Next: build up the full list of selections for the config useing the initial set of
 * selections with selection branches pruned combined with the new selections
 * 
 * prunedPreviousSelections = initialSelects.filter(s => filterList has s)
 * fullList = {...previousSelections, newSelections}
 */
export const getSelections = (
  values: ConfigFormValues,
  initValues: ConfigFormValues,
  options: Option[]): Option[] => {
  const optionMap = buildOptionMap(options);
  const { configName, ...confSelections } = values // extract out name
  const changedSelections = getChangedValues(confSelections, initValues) as ConfigFormValues;

  const parentList: Option[] = Object.values(changedSelections)
    .map(sID => optionMap[Number(sID)].parent)
    .filter(o => o) as Option[];

  const selectionsToFilter: string[] = []

  // Traverse down each path of options
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

  // TODO: formik fields need better names. We will have collisions
  // if we just rely on option 'name' as there are bound to be duplicates
  const selectionsToFilterSet = new Set(selectionsToFilter) // remove duplicates

  // get existing selections, filter out removed options
  const selections = Object.entries(values)
    .filter(([key, _]) => selectionsToFilterSet.has(key))
    .map(([_, id]) => options.find(o => o.id === Number(id)))
    .filter(o => o) as Option[];

  // get changed options
  const newSelections = Object.values(changedSelections)
    .map(oID => options.find(o => o.id === Number(oID)))
    .filter(o => o) as Option[];

  // append to get full set of options for the current config
  selections.push(...newSelections);

  return selections;
}