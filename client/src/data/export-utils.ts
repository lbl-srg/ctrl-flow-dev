import { ConfigContext } from "../interpreter/interpreter";
import { ConfigInterface, ConfigValues } from "./types";
import { removeEmpty } from "../utils/utils";
import Config from "./config";

type SeqData = Record<string, string[]>;

/**
 * Maps a configurations selections and values from
 * {[key: string]: {value: any}} => {[key: string]: any}
 */
export function mapConfigData<T = unknown>(
  input: Record<string, { value: T }>,
): Record<string, T> {
  const out = {} as Record<string, T>;
  for (const k in input) out[k] = input[k].value;
  return out;
}

/**
 * Flattens a list of mapped configuration data into the
 * Sequence Data format
 */
export function _buildSequenceData(
  mappedConfigList: Array<Record<string, string>>,
): SeqData {
  const work: Record<string, Set<string>> = {};

  for (const cfg of mappedConfigList) {
    for (const [key, value] of Object.entries(cfg)) {
      const [modelicaPath] = key.split("-");
      if (modelicaPath === value) continue; // ignore values where the path matches the value

      (work[key] ??= new Set()).add(value);
    }
  }

  // Convert Sets back to the required string[] shape
  return Object.fromEntries(
    Object.entries(work).map(([k, set]) => [k, Array.from(set)]),
  );
}

/**
 * Unpacks all configurations into a format for sequence data generation
 */
export function buildSequenceData(projectConfigs: ConfigInterface[]) {
  const mappedConfigs = projectConfigs.map((config) =>
    mapConfigData({
      ...config.evaluatedValues,
      ...config.selections,
      [config.systemPath]: { value: config.templatePath },
    }),
  );

  return _buildSequenceData(mappedConfigs);
}
