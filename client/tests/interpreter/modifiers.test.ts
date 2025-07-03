import { buildMods } from "../../src/interpreter/interpreter";

import { evaluateModifier } from "../../src/interpreter/interpreter";

import {
  createStore,
  getTestTemplateData,
  createSelections,
  createTemplateContext,
  TestStore,
  TestTemplate,
} from "../utils";

let store = createStore(TestStore.RootStore);

describe("Modifiers", () => {
  beforeEach(() => {
    store = createStore(TestStore.RootStore)!;
  });
  it("Sets the correct value for a redeclared type", () => {
    const { context } = createTemplateContext(
      TestTemplate.ZoneTemplate,
      createSelections(),
    );

    const path = "coiHea";
    const mod = context.mods[path];
    expect(evaluateModifier(mod, context)).toEqual(
      "Buildings.Templates.Components.Coils.None",
    );
  });

  it("Sets the correct value for a choiceModifier value", () => {
    const { context } = createTemplateContext(
      TestTemplate.ZoneTemplate,
      createSelections(),
    );

    const path = "typ";
    const mod = context.mods[path];
    expect(evaluateModifier(mod, context)).toEqual(
      "Buildings.Templates.ZoneEquipment.Types.Configuration.VAVBoxCoolingOnly",
    );
  });

  it("Handles modifier redeclares", () => {
    const allOptions = store.templateStore.getAllOptions();
    const boxReheat = "Buildings.Templates.ZoneEquipment.VAVBoxReheat";
    const testPath = "have_souChiWat";
    const zoneOption = allOptions[boxReheat];
    const mods = buildMods(zoneOption, {}, allOptions);

    const mod = mods[testPath];
    expect(mod).toBeDefined();
    expect(mod?.final).toBeTruthy();
  });

  it("Adds coiCoo.val to modifiers", () => {
    const allOptions = store.templateStore.getAllOptions();
    const { path } = getTestTemplateData(TestTemplate.MultiZoneTemplate);
    const mzOption = allOptions[path];
    const selections = {
      "Buildings.Templates.AirHandlersFans.VAVMultiZone.coiCoo-coiCoo": {
        value: "Buildings.Templates.Components.Coils.WaterBasedCooling",
      },
    };
    const mods = buildMods(mzOption, selections, allOptions);
    const coiCooPath = "coiCoo.typVal";

    expect(coiCooPath in mods).toBeTruthy();
    const coiCooMod = mods[coiCooPath];
    expect(coiCooMod.final).toBeTruthy();
  });
});
