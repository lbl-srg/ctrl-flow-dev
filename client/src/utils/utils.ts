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
