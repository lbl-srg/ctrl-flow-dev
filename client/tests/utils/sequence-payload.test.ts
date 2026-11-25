import { ConfigInterface } from "../../src/data/config";
import { ProjectInterface } from "../../src/data/project";
import {
  buildSequencePayload,
  SCHEMA_VERSION,
} from "../../src/utils/sequence-payload";

const T = "P.Templates.T";
const PROJECT_KEY = "Buildings.Templates.Data.AllSystems-stdEne";

const project: ProjectInterface = {
  id: "p",
  projectDetails: {
    name: "Office",
    address: "",
    type: "",
    size: 0,
    notes: "",
    selections: { [PROJECT_KEY]: { value: "P.Types.Std.A" } },
    evaluatedValues: {},
  },
};

const config: ConfigInterface = {
  id: "c",
  projectId: "p",
  name: "Perimeter",
  quantity: 12,
  isLocked: false,
  systemPath: "P.Templates",
  templatePath: T,
  selections: {
    [`${T}-coi`]: { redeclare: "P.Coils.B" },
    [`${T}-S`]: { redeclare: "P.C", kindOfClass: "model" },
  },
  evaluatedValues: {
    [`${T}-coi`]: { redeclare: "P.Coils.A" },
    [`${T}-coi.typ`]: { value: "P.Types.Coil.B" },
  },
};

describe("Sequence payload", () => {
  const payload = buildSequencePayload({
    meta: { ctrlFlow: "1.0.0", libraries: { Buildings: "14.0.0" } },
    deleteInfoBox: true,
    project,
    configs: [config],
  });

  it("holds the payload-wide attributes and the options", () => {
    expect(payload.schemaVersion).toBe(SCHEMA_VERSION);
    expect(payload.meta).toEqual({
      ctrlFlow: "1.0.0",
      libraries: { Buildings: "14.0.0" },
    });
    expect(payload.options).toEqual({ deleteInfoBox: true });
  });

  it("holds the project and its configurations", () => {
    expect(payload.projects).toEqual([
      {
        id: "p",
        description: "Office",
        values: {
          [PROJECT_KEY]: { value: "P.Types.Std.A", origin: "user" },
        },
        configurations: [
          {
            id: "c",
            description: "Perimeter",
            quantity: 12,
            systemType: "P.Templates",
            template: T,
            values: {
              // The value entered by the user wins
              [`${T}-coi`]: { redeclare: "P.Coils.B", origin: "user" },
              [`${T}-S`]: {
                redeclare: "P.C",
                kindOfClass: "model",
                origin: "user",
              },
              [`${T}-coi.typ`]: {
                value: "P.Types.Coil.B",
                origin: "evaluated",
              },
            },
          },
        ],
      },
    ]);
  });
});
