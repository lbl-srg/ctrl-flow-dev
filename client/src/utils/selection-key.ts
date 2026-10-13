import { isClassName, isName } from "./names";

/**
 * Selection keys (docs/selection-keys.md). This is the only module that
 * builds and parses the keys of the stores (selections, evaluated values).
 *
 * A key is `<rootClass>-<elementPath>`, where `rootClass` is the class to
 * extend (the template, or Buildings.Templates.Data.AllSystems for a project
 * setting) and `elementPath` the resolved path of the element in this class.
 */

/** Class of the project settings (docs/selection-keys.md, rule 1) */
export const ALL_SYSTEMS = "Buildings.Templates.Data.AllSystems";

export function selectionKey(rootClass: string, elementPath: string): string {
  return `${rootClass}-${elementPath}`;
}

/**
 * Root class and element path of a key. `rootClass` has no quoted
 * identifier, so the first "-" is the separator.
 * Throws if the key is invalid (docs/selection-keys.md, "Parsing").
 */
export function parseSelectionKey(key: string): {
  rootClass: string;
  elementPath: string;
} {
  const i = key.indexOf("-");
  const rootClass = key.slice(0, i);
  const elementPath = key.slice(i + 1);
  if (
    i === -1 ||
    !isClassName(rootClass) ||
    !isName(elementPath) ||
    elementPath.startsWith(".")
  ) {
    throw new Error(`Invalid selection key: ${key}`);
  }
  return { rootClass, elementPath };
}
