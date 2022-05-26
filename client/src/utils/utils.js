/**
 * Returns changed object values (does NOT do nested comparisons)
 */
export const getChangedValues = (values, initialValues) => {
  return Object.entries(values).reduce((acc, [key, value]) => {
    const hasChanged = initialValues[key] !== value;

    if (hasChanged) {
      acc[key] = value;
    }

    return acc;
  }, {});
};

export const poj = (obj) => JSON.parse(JSON.stringify(obj));
export const deduplicate = (arr) => Array.from(new Set(arr).values());
export const sortByName = (a, b) => a.name.localeCompare(b.name);
