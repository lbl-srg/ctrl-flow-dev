export type SortableByName = Required<{ name: string }>;

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