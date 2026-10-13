import { ConfigInterface } from "../data/config";
import { ProjectInterface } from "../data/project";
import { ConfigValues, StoredValue } from "./modifier-helpers";

/** Incremented on any breaking change of the payload */
export const SCHEMA_VERSION = 1;

/** Value of the payload: a value of the stores and the store it comes from */
export interface PayloadValue extends StoredValue {
  origin: "user" | "evaluated";
}

export interface PayloadValues {
  [key: string]: PayloadValue;
}

export interface PayloadMeta {
  /** Version of ctrl-flow */
  ctrlFlow: string;
  /** Versions of the libraries the templates were generated from */
  libraries: { [name: string]: string | undefined };
}

export interface PayloadConfiguration {
  id: string;
  description: string;
  quantity: number;
  systemType: string;
  template: string;
  values: PayloadValues;
}

export interface PayloadProject {
  id: string;
  description: string;
  values: PayloadValues;
  configurations: PayloadConfiguration[];
}

export interface SequencePayload {
  schemaVersion: number;
  meta: PayloadMeta;
  options: { deleteInfoBox: boolean };
  projects: PayloadProject[];
}

/**
 * Values of a project or a configuration: the evaluated values, overridden
 * by the values entered by the user
 */
function payloadValues(
  selections: ConfigValues = {},
  evaluatedValues: ConfigValues = {},
): PayloadValues {
  const values: PayloadValues = {};
  Object.entries(evaluatedValues).forEach(
    ([key, value]) => (values[key] = { ...value, origin: "evaluated" }),
  );
  Object.entries(selections).forEach(
    ([key, value]) => (values[key] = { ...value, origin: "user" }),
  );
  return values;
}

/**
 * Builds the payload sent to the sequence document endpoint, for one project
 * and its configurations (docs/selection-keys.md, "Payload")
 */
export function buildSequencePayload({
  meta,
  deleteInfoBox,
  project,
  configs,
}: {
  meta: PayloadMeta;
  deleteInfoBox: boolean;
  project: ProjectInterface;
  configs: ConfigInterface[];
}): SequencePayload {
  const { name, selections, evaluatedValues } = project.projectDetails;
  return {
    schemaVersion: SCHEMA_VERSION,
    meta,
    options: { deleteInfoBox },
    projects: [
      {
        id: project.id,
        description: name,
        values: payloadValues(selections, evaluatedValues),
        configurations: configs.map((config) => ({
          id: config.id,
          description: config.name ?? "",
          quantity: config.quantity ?? 1,
          systemType: config.systemPath,
          template: config.templatePath,
          values: payloadValues(config.selections, config.evaluatedValues),
        })),
      },
    ],
  };
}
