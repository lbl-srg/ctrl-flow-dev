import { ConfigInterface } from "../data/config";
import { splitSelectionKey } from "./names";

/**
 * Merges the values of all configurations into a single object mapping
 * each selection path to the array of distinct values it takes
 */
export function getSequenceData(projectConfigs: ConfigInterface[]) {
  const seqData: { [key: string]: any } = {};

  projectConfigs.forEach((config) => {
    const configData = {
      ...config.evaluatedValues,
      ...config.selections,
      [config.systemPath]: config.templatePath,
    };
    const configKeys = Object.keys(configData);

    configKeys.forEach((key) => {
      if (seqData[key] !== undefined) {
        if (seqData[key].indexOf(configData[key]) === -1) {
          seqData[key].push(configData[key]);
        }
      } else {
        const [modelicaPath] = splitSelectionKey(key);
        if (modelicaPath !== configData[key]) {
          seqData[key] = [configData[key]];
        }
      }
    });
  });

  return seqData;
}

/**
 * Builds the payload sent to the sequence document endpoint
 */
export function buildSequencePayload(
  projectConfigs: ConfigInterface[],
  deleteInfoBox: boolean,
) {
  return { ...getSequenceData(projectConfigs), DEL_INFO_BOX: [deleteInfoBox] };
}
