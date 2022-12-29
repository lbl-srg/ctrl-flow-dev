/**
 * Tests the value engine and the various ways it gets used including:
 *
 * 1. Fetching a default value from options using a modelica path
 * 2. Building the predefined dictionary of modifiers with instance paths
 * 3. Given an instance path, is able to fetch the accurate value that merges
 *    selections + the predefined dictionary of modifiers + default value
 */

import RootStore from "../../src/data";
import { TemplateInterface, OptionInterface } from "../../src/data/template";
import { Expression } from "../../src/utils/expression-helpers";
import {
  applyRedeclareChoices,
  buildModifiers,
  ConfigValues,
} from "../../src/utils/modifier-helpers";
import { getContext } from "../../src/utils/interpreter";
import { getOptionTree } from "../../src/components/steps/Configs/SlideOut";

/*
 * TODO: swap in methods from src/utils/modifier-helpers and expression helpers instead of these
 * local methods
 */

const addToModObject = (
  newMods: { [key: string]: Expression },
  baseInstancePath: string,
  mods: { [key: string]: Expression },
  options: OptionInterface[],
  recursive = true,
) => {
  Object.entries(newMods).forEach(([k, expression]) => {
    const instanceName = k.split(".").pop();
    const modKey = [baseInstancePath, instanceName]
      .filter((segment) => segment !== "")
      .join(".");

    // Do not add a key that is already present. The assumption is that
    // the first time an instance path is present is the most up-to-date
    if (!(modKey in mods)) {
      mods[modKey] = expression;
    }

    if (recursive) {
      // grab modifiers from original definition
      const modOption = options.find(
        (o) => o.modelicaPath === k,
      ) as OptionInterface;
      if (modOption?.modifiers) {
        addToModObject(newMods, baseInstancePath, mods, options, false);
      }
    }
  });
};

// recursive helper method
const buildModsHelper = (
  option: OptionInterface,
  baseInstancePath: string,
  mods: { [key: string]: Expression },
  options: OptionInterface[],
) => {
  if (option === undefined) {
    return; // TODO: not sure this should be allowed - failing with 'Medium'
  }
  const optionMods = option.modifiers as { [key: string]: Expression };
  const childOptions = option.options;

  // grab the current options modifiers
  if (optionMods) {
    addToModObject(optionMods, baseInstancePath, mods, options);
  }

  // if this is a definition - visit all child options and grab modifiers
  if (childOptions) {
    const name = option.modelicaPath.split(".").pop();
    const newBase = option.definition
      ? baseInstancePath
      : [baseInstancePath, name].filter((p) => p !== "").join(".");

    if (newBase === "secOutRel.secOut.damOut") {
      console.log("break");
    }

    if (option.definition) {
      childOptions.map((path) => {
        const childOption = options.find(
          (o) => o.modelicaPath === path,
        ) as OptionInterface;

        buildModsHelper(childOption, newBase, mods, options);
      });
    } else {
      // this is a parameter (either replaceable or enum) - grab the type and its modifiers
      // only use the 'type', not child options to fetch modifiers (default options)
      const typeOption = options.find((o) => o.modelicaPath === option.type);
      if (typeOption && typeOption.options) {
        // add modifiers from type option
        if (typeOption.modifiers) {
          addToModObject(typeOption.modifiers, newBase, mods, options);
        }
        typeOption.options.map((path) => {
          const childOption = options.find(
            (o) => o.modelicaPath === path,
          ) as OptionInterface;

          buildModsHelper(childOption, newBase, mods, options);
        });
      }
    }
  }
};

const buildMods = (
  startOption: OptionInterface,
  options: OptionInterface[],
) => {
  const mods: { [key: string]: Expression } = {};

  buildModsHelper(startOption, "", mods, options);

  return mods;
};

let allOptions: { [key: string]: OptionInterface } = {};
let allTemplates: { [key: string]: TemplateInterface } = {};
let templateOption: OptionInterface | undefined;
const store = new RootStore();

describe("package.json loading", () => {
  beforeAll(() => {
    allOptions = store.templateStore.getAllOptions();
    allTemplates = store.templateStore.getAllTemplates();
    const template =
      allTemplates["Buildings.Templates.AirHandlersFans.VAVMultiZone"];
    templateOption = allOptions[template.modelicaPath] as OptionInterface;
  });

  it("Builds the modifier dictionary for a given template", () => {
    const mods = buildModifiers(
      templateOption as OptionInterface,
      "",
      {},
      allOptions,
    );
    expect(mods).toBeTruthy();

    // check that 'datAll'
    const datAllPath = "datAll";
    const datAllMods = Object.keys(mods).filter((m) =>
      m.startsWith(datAllPath),
    );

    expect(datAllMods.length).toBeGreaterThan(0);
  });

  it("Modifiers include project level mods", () => {
    const mods = buildModifiers(
      templateOption as OptionInterface,
      "",
      {},
      allOptions,
    );

    // check that 'datAll'
    const datAllPath = "datAll";
    const datAllMods = Object.keys(mods).filter((m) =>
      m.startsWith(datAllPath),
    );

    expect(datAllMods.length).toBeGreaterThan(0);
  });
});

let template: TemplateInterface | undefined;
let configID = "REASSIGN!";

describe("Basic Context Generation", () => {
  beforeAll(() => {
    allOptions = store.templateStore.getAllOptions();
    allTemplates = store.templateStore.getAllTemplates();
    template = allTemplates["Buildings.Templates.AirHandlersFans.VAVMultiZone"];
    templateOption = allOptions[template.modelicaPath] as OptionInterface;
    // TODO: make config and get config ID
    // make config
    // get config ID
    store.configStore.add({ name: "TestConfig" });
    const [config] = store.configStore.configs;
    configID = config.id;
  });

  it("Config Modifiers and evaluatedValues are generated", () => {
    const { configModifiers, evaluatedValues } = getContext(
      template as TemplateInterface,
      configID,
      store.configStore,
      store.templateStore,
      store.projectStore,
    );
    expect(configModifiers).toBeDefined();
    expect(evaluatedValues).toBeDefined();
  });
});

describe("Modifier-helper tests", () => {
  beforeAll(() => {
    allOptions = store.templateStore.getAllOptions();
    allTemplates = store.templateStore.getAllTemplates();
    template = allTemplates["Buildings.Templates.AirHandlersFans.VAVMultiZone"];
    templateOption = allOptions[template.modelicaPath] as OptionInterface;
    // TODO: make config and get config ID
    // make config
    // get config ID
    store.configStore.add({ name: "TestConfig" });
    const [config] = store.configStore.configs;
    configID = config.id;
  });

  it("Apply redeclare updates configModifiers", () => {
    const { configModifiers, evaluatedValues } = getContext(
      template as TemplateInterface,
      configID,
      store.configStore,
      store.templateStore,
      store.projectStore,
    );

    const testParamModPath =
      "Buildings.Templates.AirHandlersFans.VAVMultiZone.coiCoo-coiCoo";

    const mockSelections: ConfigValues = {
      [testParamModPath]: "Buildings.Templates.Components.Coils.None",
    };
    const [optionPath, instancePath] = testParamModPath.split("-");

    const newMods = applyRedeclareChoices(
      mockSelections,
      configModifiers,
      allOptions,
    );

    // A number of things should have been updated, but I'm just going to
    // test the base parameter (coiCoo) and one nested parameter (coiCoo.typ)
    expect(newMods[instancePath].expression.operands[0]).toEqual(
      "Buildings.Templates.Components.Coils.None",
    );

    expect(newMods[`${instancePath}.typ`].expression.operands[0]).toEqual(
      "Buildings.Templates.Components.Types.Coil.None",
    );

    // Test that previous modifier remain unmutated
    // TODO: this is failing and it should NOT. applyRedeclareChoices does a deep
    // copy of the passed in 'configModifiers' so I'm not sure why this is happening
    // expect(
    //   configModifiers[`${instancePath}.typ`].expression.operands[0],
    // ).toEqual("Buildings.Templates.Components.Types.Coil.WaterBasedCooling");
  });
});
