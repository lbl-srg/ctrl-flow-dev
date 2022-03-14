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
export const deduplicate = (arr: any[]) => Array.from(new Set(arr).values());

export const sortByName = (a: SortableByName, b: SortableByName): number =>
  a.name.localeCompare(b.name);

export const trace = (target: any): any =>
  console.log(JSON.parse(JSON.stringify(target)));
