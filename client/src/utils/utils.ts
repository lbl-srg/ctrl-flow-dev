export type SortableByName = Required<{ name: string }>;
import {
  FlatConfigOption,
  FlatConfigOptionGroup,
} from "../components/steps/Configs/SlideOut";

/**
 * Returns changed object values (does NOT do nested comparisons)
 */
export const getChangedValues = (
  values: { [key: string]: any },
  initialValues: { [key: string]: any },
) => {
  return Object.entries(values).reduce((acc, [key, value]) => {
    const hasChanged = initialValues[key] !== value;

    if (hasChanged) {
      acc[key] = value;
    }

    return acc;
  }, {} as { [key: string]: any });
};

/**
 *
 */

export const poj = (obj: object) => JSON.parse(JSON.stringify(obj));

export const deduplicate = (arr: []) => Array.from(new Set(arr).values());

export const sortByName = (a: SortableByName, b: SortableByName): number =>
  a.name.localeCompare(b.name);

export const trace = (target: any): any =>
  console.log(JSON.parse(JSON.stringify(target)));

export function removeEmpty(obj: any) {
  return Object.entries(obj)
    .filter(([_, v]) => v != null)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
}

export function deepCopy(obj: any) {
  if (!obj) return obj;
  return JSON.parse(JSON.stringify(obj));
}

type SimpleDisplay = {
  path: string;
  items?: SimpleDisplay[];
  choices?: string[];
};

/**
 * Displays a concise list of options
 * @param displayList
 */
export function extractSimpleDisplayList(
  displayList: (FlatConfigOptionGroup | FlatConfigOption)[],
  print = false,
  tabPrefix = "",
) {
  const simpleList: SimpleDisplay[] = [];
  displayList.map((o) => {
    if ("items" in o) {
      const option = o as FlatConfigOptionGroup;
      const oSimple = { path: o.selectionPath } as SimpleDisplay;
      if (print) {
        console.log(`${tabPrefix}${option.groupName}`);
      }
      oSimple.items = extractSimpleDisplayList(
        option.items,
        print,
        tabPrefix + "\t",
      );
    } else {
      const option = o as FlatConfigOption;
      const oSimple = { path: o.modelicaPath } as SimpleDisplay;
      oSimple.choices = option.choices?.map((c) => c.modelicaPath);
      if (print) {
        console.log(`${tabPrefix}${option.name}`);
      }
    }
  });
  return simpleList;
}
