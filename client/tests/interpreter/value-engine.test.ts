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
import { buildModifiers } from "../../src/utils/modifier-helpers";

/*
 * TODO: swap in methods from src/utils/modifier-helpers and expression helpers instead of these
 * local methods
 */

const addToModObject = (
  newMods: { [key: string]: Expression },
  baseInstancePath: string,
  mods: { [key: string]: Expression },
  options: { [key: string]: OptionInterface },
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
      const modOption = options[k];
      if (modOption?.modifiers) {
        addToModObject(newMods, baseInstancePath, mods, options, false);
      }
    }
  });
};

// recursive helper method that traverses options grabbing modifiers
const buildModsHelper = (
  option: OptionInterface,
  baseInstancePath: string,
  mods: { [key: string]: Expression },
  options: { [key: string]: OptionInterface },
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

    if (option.definition) {
      childOptions.map((path) => {
        const childOption = options[path];

        // recursive call
        buildModsHelper(childOption, newBase, mods, options);
      });
    } else {
      // this is a parameter (either replaceable or enum) - grab the type and its modifiers
      // only use the 'type', not child options to fetch modifiers
      const typeOption = options[option.type];
      if (typeOption && typeOption.options) {
        // add modifiers from type option
        if (typeOption.modifiers) {
          addToModObject(typeOption.modifiers, newBase, mods, options);
        }
        typeOption.options.map((path) => {
          const childOption = options[path];

          buildModsHelper(childOption, newBase, mods, options);
        });
      }
    }
  }
};

const buildMods = (
  startOption: OptionInterface,
  options: { [key: string]: OptionInterface },
) => {
  const mods: { [key: string]: Expression } = {};

  buildModsHelper(startOption, "", mods, options);

  return mods;
};

let allOptions: { [key: string]: OptionInterface } = {};
let allTemplates: TemplateInterface[] = [];
let templateOption: OptionInterface | undefined;

describe("package.json loading", () => {
  beforeAll(() => {
    const store = new RootStore();

    allOptions = store.templateStore.getAllOptions();
    allTemplates = store.templateStore.getAllTemplates();
    const template = allTemplates.find(
      (t) =>
        t.modelicaPath === "Buildings.Templates.AirHandlersFans.VAVMultiZone",
    ) as TemplateInterface;
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
