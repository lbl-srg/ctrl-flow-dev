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

let allOptions: OptionInterface[] = [];
let allTemplates: TemplateInterface[] = [];

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

describe("package.json loading", () => {
  beforeAll(() => {
    const store = new RootStore();

    allOptions = store.templateStore.getAllOptions();
    allTemplates = store.templateStore.getAllTemplates();
  });

  it("Builds the modifier dictionary for a given template", () => {
    const template = allTemplates.find(
      (t) =>
        t.modelicaPath === "Buildings.Templates.AirHandlersFans.VAVMultiZone",
    ) as TemplateInterface;

    const templateOption = allOptions.find(
      (o) => o.modelicaPath === template.modelicaPath,
    ) as OptionInterface;

    const mods = buildMods(templateOption, allOptions);
    expect(mods).toBeTruthy();
  });
});
