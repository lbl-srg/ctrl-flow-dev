/**
 * Golden payloads for the sequence document.
 *
 * Builds the payload sent to the sequence document endpoint for a set of
 * projects, through the same code path as the UI: options are selected in the
 * configuration panel (display mapping), the configuration is saved
 * (getConfigValuesToSave) and the payload is built (buildSequencePayload).
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
import { TemplateInterface } from "../../src/data/template";
import { ConfigContext } from "../../src/interpreter/interpreter";
import {
  mapToDisplayOptions,
  FlatConfigOption,
} from "../../src/interpreter/display-option";
import { getConfigValuesToSave } from "../../src/interpreter/config-values";
import { buildSequencePayload } from "../../src/utils/sequence-payload";
import { ConfigValues } from "../../src/utils/modifier-helpers";

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

// Project settings, keyed as saved by EditDetailsModal
const ASHRAE_IP: Values = {
  "Buildings.Templates.Data.AllSystems.stdEne":
    "Buildings.Controls.OBC.ASHRAE.G36.Types.EnergyStandard.ASHRAE90_1",
  "Buildings.Templates.Data.AllSystems.stdVen":
    "Buildings.Controls.OBC.ASHRAE.G36.Types.VentilationStandard.ASHRAE62_1",
  "Buildings.Templates.Data.AllSystems.ashCliZon":
    "Buildings.Controls.OBC.ASHRAE.G36.Types.ASHRAEClimateZone.Zone_4A",
  "Buildings.Templates.Data.AllSystems.sysUni":
    "Buildings.Templates.Types.Units.IP",
};
const TITLE24_SI: Values = {
  "Buildings.Templates.Data.AllSystems.stdEne":
    "Buildings.Controls.OBC.ASHRAE.G36.Types.EnergyStandard.California_Title_24",
  "Buildings.Templates.Data.AllSystems.stdVen":
    "Buildings.Controls.OBC.ASHRAE.G36.Types.VentilationStandard.California_Title_24",
  "Buildings.Templates.Data.AllSystems.tit24CliZon":
    "Buildings.Controls.OBC.ASHRAE.G36.Types.Title24ClimateZone.Zone_3",
  "Buildings.Templates.Data.AllSystems.sysUni":
    "Buildings.Templates.Types.Units.SI",
};

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

const displayedOptions = (
  template: TemplateInterface,
  selected: ConfigValues,
) => flatten(mapToDisplayOptions(createContext(template, selected)));

/**
 * Configures a template as a user would in the configuration panel: each value
 * is selected in turn in the displayed option with the given instance path
 */
function configure(configCase: ConfigCase, project: Values): ConfigInterface {
  const template = allTemplates[configCase.template];
  let selected: ConfigValues = { ...project };
  Object.entries(configCase.values ?? {}).forEach(([instancePath, value]) => {
    const option = displayedOptions(template, selected).find(
      (o) => o.scope === instancePath,
    );
    if (!option) {
      throw new Error(
        `${instancePath} is not displayed in ${template.modelicaPath}`,
      );
    }
    // Selection key as written by SlideOut.updateSelectedConfigOption
    selected = {
      ...selected,
      [`${option.modelicaPath}-${option.scope}`]: value,
    };
  });
  const context = createContext(template, selected);
  mapToDisplayOptions(context); // configuration panel rendered before saving
  const { selections, evaluatedValues } = getConfigValuesToSave(
    context,
    selected,
  );
  return {
    id: "",
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
    displayedOptions(template, { ...ASHRAE_IP }).forEach((o) => {
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

describe("Sequence document golden payloads", () => {
  const cases = [...singleChoiceCases(), ...MIXED_CASES];
  const payloads: { [file: string]: string } = {};
  cases.forEach((c) => {
    const configs = c.configs.map((cc) => configure(cc, c.project));
    const payload = buildSequencePayload(configs, false);
    // Sorted keys for stable diffs
    const sorted = Object.fromEntries(
      Object.entries(payload).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)),
    );
    payloads[`${toFileName(c.name)}.payload.json`] =
      JSON.stringify(sorted, null, 2) + "\n";
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
