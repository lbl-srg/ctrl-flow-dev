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

export const deduplicate = (arr) => Array.from(new Set(arr).values());

export const sortByName = (a, b) => a.name.localeCompare(b.name);

export const trace = (target) =>
  console.log(JSON.parse(JSON.stringify(target)));
