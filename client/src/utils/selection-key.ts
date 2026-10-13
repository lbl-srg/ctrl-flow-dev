import { splitSelectionKey } from "./names";

/**
 * Selection keys (docs/selection-keys.md). This is the only module that
 * builds and parses the keys of the stores (selections, evaluated values).
 *
 * A key is `<optionPath>-<instancePath>`, where `optionPath` is the option of
 * the declaration of the element and `instancePath` its resolved instance
 * path. A project setting (Buildings.Templates.Data.AllSystems) is keyed by
 * its option path only.
 */

const ALL_SYSTEMS = "Buildings.Templates.Data.AllSystems";

export function selectionKey(optionPath: string, instancePath: string): string {
  return optionPath.includes(ALL_SYSTEMS)
    ? optionPath
    : `${optionPath}-${instancePath}`;
}

/**
 * Key of a project setting, declared by `optionPath` in
 * Buildings.Templates.Data.AllSystems
 */
export function projectSelectionKey(optionPath: string): string {
  return optionPath;
}

/**
 * Option path and instance path of a key. The instance path is undefined for
 * a project setting.
 */
export function parseSelectionKey(key: string): {
  optionPath: string;
  instancePath?: string;
} {
  const [optionPath, instancePath] = splitSelectionKey(key);
  return { optionPath, instancePath };
}
