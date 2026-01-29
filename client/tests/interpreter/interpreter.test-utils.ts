import RootStore from "../../src/data";
import { ConfigInterface } from "../../src/data/config";
import { ConfigValues } from "../../src/utils/modifier-helpers";
import { TemplateInterface } from "../../src/data/template";

// Project-level selections used across tests
export const projectSelections = {
  "Buildings.Templates.Data.AllSystems.stdEne":
    "Buildings.Controls.OBC.ASHRAE.G36.Types.EnergyStandard.ASHRAE90_1",
  "Buildings.Templates.Data.AllSystems.stdVen":
    "Buildings.Controls.OBC.ASHRAE.G36.Types.VentilationStandard.California_Title_24",
  "Buildings.Templates.Data.AllSystems.ashCliZon":
    "Buildings.Controls.OBC.ASHRAE.G36.Types.ASHRAEClimateZone.Zone_1B",
};

export const createSelections = (selections: ConfigValues = {}) => {
  return {
    ...projectSelections,
    ...selections,
  };
};

export const addNewConfig = (
  configName: string,
  template: TemplateInterface,
  selections: ConfigValues,
  store: RootStore,
) => {
  store.configStore.add({
    name: configName,
    templatePath: template.modelicaPath,
  });

  const configWithSelections = store.configStore.configs.find(
    (c) => c.name === configName,
  ) as ConfigInterface;

  const selectionsWithProjectSelections = createSelections(selections);

  store.configStore.setSelections(
    configWithSelections.id,
    selectionsWithProjectSelections,
  );

  return configWithSelections;
};
