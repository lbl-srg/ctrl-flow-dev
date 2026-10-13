/**
 * Golden payloads for the sequence document.
 *
 * Builds the payload sent to the sequence document endpoint for a set of
 * projects, through the same code path as the UI: options are selected in the
 * project details modal and in the configuration panel (display mapping), the
 * project and the configurations are saved (getConfigValuesToSave) and the
 * payload is built (buildSequencePayload).
 *
 * Cases are defined by instance paths and values, not by selection keys, so
 * that they remain valid when the key format changes.
 *
 * The payloads are written to server/scripts/sequence-doc/tests/static/golden,
 * where test_golden.py checks the text of the generated documents.
 * - `UPDATE_GOLDEN=1 npx jest tests/sequence` rewrites the payloads.
 * - Otherwise, the payloads are compared to the stored ones.
 * A change of the payload format changes the payloads but must not change
 * the expected document text.
 */
import * as fs from "fs";
import * as path from "path";
import RootStore from "../../src/data";
import { ConfigInterface } from "../../src/data/config";
import { ProjectInterface } from "../../src/data/project";
import { TemplateInterface } from "../../src/data/template";
import {
  ConfigContext,
  projectContext,
} from "../../src/interpreter/interpreter";
import {
  mapToDisplayOptions,
  FlatConfigOption,
} from "../../src/interpreter/display-option";
import { getConfigValuesToSave } from "../../src/interpreter/config-values";
import { buildSequencePayload } from "../../src/utils/sequence-payload";
import { ConfigValues, storedValue } from "../../src/utils/modifier-helpers";

const GOLDEN_DIR = path.resolve(
  __dirname,
  "../../../server/scripts/sequence-doc/tests/static/golden",
);
const UPDATE = process.env.UPDATE_GOLDEN === "1";

const store = new RootStore();
const allOptions = store.templateStore.getAllOptions();
const allTemplates = store.templateStore.getAllTemplates();

const AHU = "Buildings.Templates.AirHandlersFans.VAVMultiZone";
const CO = "Buildings.Templates.ZoneEquipment.VAVBoxCoolingOnly";
const RH = "Buildings.Templates.ZoneEquipment.VAVBoxReheat";
const COILS = "Buildings.Templates.Components.Coils";

type Values = { [instancePath: string]: string | boolean };
type ConfigCase = { template: string; values?: Values };
type ProjectCase = { name: string; project: Values; configs: ConfigCase[] };

// Project settings, by element of Buildings.Templates.Data.AllSystems
const ASHRAE_IP: Values = {
  stdEne: "Buildings.Controls.OBC.ASHRAE.G36.Types.EnergyStandard.ASHRAE90_1",
  stdVen:
    "Buildings.Controls.OBC.ASHRAE.G36.Types.VentilationStandard.ASHRAE62_1",
  ashCliZon:
    "Buildings.Controls.OBC.ASHRAE.G36.Types.ASHRAEClimateZone.Zone_4A",
  sysUni: "Buildings.Templates.Types.Units.IP",
};
const TITLE24_SI: Values = {
  stdEne:
    "Buildings.Controls.OBC.ASHRAE.G36.Types.EnergyStandard.California_Title_24",
  stdVen:
    "Buildings.Controls.OBC.ASHRAE.G36.Types.VentilationStandard.California_Title_24",
  tit24CliZon:
    "Buildings.Controls.OBC.ASHRAE.G36.Types.Title24ClimateZone.Zone_3",
  sysUni: "Buildings.Templates.Types.Units.SI",
};

// Fixed, so that the payloads do not change with the versions
const META = { ctrlFlow: "golden", libraries: { Buildings: "golden" } };

const flatten = (items: any[], out: FlatConfigOption[] = []) => {
  items.forEach((i) =>
    "groupName" in i ? flatten(i.items, out) : out.push(i),
  );
  return out;
};

const createContext = (template: TemplateInterface, selected: ConfigValues) =>
  new ConfigContext(
    template,
    { selections: selected } as any,
    allOptions,
    selected,
  );

/**
 * Selects each value in turn in the displayed option with the given instance
 * path, as a user would, and saves the values (getConfigValuesToSave)
 */
function select(
  createContext: (selected: ConfigValues) => ConfigContext,
  initial: ConfigValues,
  values: Values,
) {
  let selected = { ...initial };
  Object.entries(values).forEach(([instancePath, value]) => {
    const context = createContext(selected);
    const option = flatten(mapToDisplayOptions(context)).find(
      (o) => o.scope === instancePath,
    );
    if (!option) {
      throw new Error(
        `${instancePath} is not displayed in ${context.template.modelicaPath}`,
      );
    }
    // Value as written by SlideOut and EditDetailsModal
    selected = {
      ...selected,
      [option.selectionKey]: storedValue(
        allOptions[option.modelicaPath],
        value,
      ),
    };
  });
  const context = createContext(selected);
  mapToDisplayOptions(context); // panel rendered before saving
  return getConfigValuesToSave(context, selected);
}

/** Configures the project settings in the project details modal */
function configureProject(name: string, values: Values): ProjectInterface {
  const { selections, evaluatedValues } = select(
    (selected) => projectContext(allOptions, selected),
    {},
    values,
  );
  return {
    id: name,
    projectDetails: {
      name,
      address: "",
      type: "",
      size: 0,
      notes: "",
      selections,
      evaluatedValues,
    },
  };
}

/**
 * Configures a template in the configuration panel, which reads the project
 * settings (SlideOut)
 */
function configure(
  configCase: ConfigCase,
  project: ProjectInterface,
  index: number,
): ConfigInterface {
  const template = allTemplates[configCase.template];
  const { selections, evaluatedValues } = select(
    (selected) => createContext(template, selected),
    project.projectDetails.selections,
    configCase.values ?? {},
  );
  return {
    id: `${project.id}-${index}`,
    projectId: project.id,
    name: `${template.name} ${index}`,
    quantity: 1,
    isLocked: false,
    systemPath: template.systemTypes[0],
    templatePath: template.modelicaPath,
    selections,
    evaluatedValues,
  };
}

const shortName = (value: string | boolean) =>
  typeof value === "boolean" ? `${value}` : value.split(".").pop();

/**
 * One single-configuration project per template with default values, and one
 * per choice of each option displayed by default
 */
function singleChoiceCases(): ProjectCase[] {
  const cases: ProjectCase[] = [];
  [AHU, CO, RH].forEach((templatePath) => {
    const template = allTemplates[templatePath];
    const prefix = templatePath.split(".").pop();
    cases.push({
      name: `${prefix}--default`,
      project: ASHRAE_IP,
      configs: [{ template: templatePath }],
    });
    const project = configureProject("default", ASHRAE_IP);
    flatten(
      mapToDisplayOptions(
        createContext(template, project.projectDetails.selections),
      ),
    ).forEach((o) => {
      const choices: (string | boolean)[] = o.booleanChoices
        ? [true, false]
        : (o.choices ?? []).map((c) => c.modelicaPath);
      choices.forEach((value) => {
        cases.push({
          name: `${prefix}--${o.scope}=${shortName(value)}`,
          project: ASHRAE_IP,
          configs: [{ template: templatePath, values: { [o.scope]: value } }],
        });
      });
    });
  });
  return cases;
}

const MIXED_CASES: ProjectCase[] = [
  {
    name: "mixed--co-rh-default",
    project: ASHRAE_IP,
    configs: [{ template: CO }, { template: RH }],
  },
  {
    // Same parameters configured differently in two templates (#620)
    name: "mixed--co-rh-contrast",
    project: ASHRAE_IP,
    configs: [
      {
        template: CO,
        values: { "ctl.have_occSen": true, "ctl.have_winSen": true },
      },
      {
        template: RH,
        values: { "ctl.have_occSen": false, "ctl.have_CO2Sen": true },
      },
    ],
  },
  {
    // Two configurations of the same template
    name: "mixed--rh-rh",
    project: ASHRAE_IP,
    configs: [
      { template: RH, values: { "ctl.have_CO2Sen": true } },
      {
        template: RH,
        values: {
          coiHea: `${COILS}.ElectricHeating`,
          "ctl.have_CO2Sen": false,
        },
      },
    ],
  },
  {
    name: "mixed--ahu-co-rh",
    project: TITLE24_SI,
    configs: [
      { template: AHU, values: { coiHeaPre: `${COILS}.ElectricHeating` } },
      { template: CO, values: { "ctl.have_occSen": true } },
      { template: RH, values: { coiHea: `${COILS}.ElectricHeating` } },
    ],
  },
  {
    name: "project--title24-si",
    project: TITLE24_SI,
    configs: [{ template: AHU }],
  },
];

const toFileName = (name: string) => name.replace(/[^A-Za-z0-9_.=-]/g, "_");

/** Sorts the values by key, for stable diffs */
const sortValues = (key: string, value: any) =>
  key === "values"
    ? Object.fromEntries(
        Object.entries(value).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
      )
    : value;

describe("Sequence document golden payloads", () => {
  const cases = [...singleChoiceCases(), ...MIXED_CASES];
  const payloads: { [file: string]: string } = {};
  cases.forEach((c) => {
    const project = configureProject(c.name, c.project);
    const configs = c.configs.map((cc, i) => configure(cc, project, i + 1));
    const payload = buildSequencePayload({
      meta: META,
      deleteInfoBox: false,
      project,
      configs,
    });
    payloads[`${toFileName(c.name)}.payload.json`] =
      JSON.stringify(payload, sortValues, 2) + "\n";
  });

  if (UPDATE) {
    it("writes the golden payloads", () => {
      fs.mkdirSync(GOLDEN_DIR, { recursive: true });
      fs.readdirSync(GOLDEN_DIR)
        .filter((f) => f.endsWith(".payload.json") && !(f in payloads))
        .forEach((f) => fs.unlinkSync(path.join(GOLDEN_DIR, f)));
      Object.entries(payloads).forEach(([file, content]) =>
        fs.writeFileSync(path.join(GOLDEN_DIR, file), content),
      );
    });
    return;
  }

  it("generates the stored set of cases", () => {
    const stored = fs
      .readdirSync(GOLDEN_DIR)
      .filter((f) => f.endsWith(".payload.json"))
      .sort();
    expect(Object.keys(payloads).sort()).toEqual(stored);
  });

  it.each(Object.keys(payloads))("%s matches the stored payload", (file) => {
    const stored = fs.readFileSync(path.join(GOLDEN_DIR, file), "utf8");
    expect(JSON.parse(payloads[file])).toEqual(JSON.parse(stored));
  });
});
