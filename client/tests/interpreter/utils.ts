import RootStore from "../../src/data";
import templateData from "../../src/data/templates.json";
import testTemplateData from "../static-data/test-package-templates.json";

import {
  ConfigInterface,
  ConfigValues,
  TemplateInterface,
} from "../../src/data/types";

import { OperatorType, ConfigContext } from "../../src/interpreter/interpreter";

// initialize global test dependencies
const store = new RootStore(templateData);
const testStore = new RootStore(testTemplateData);
const projectSelections = {
  "Buildings.Templates.Data.AllSystems.stdEne":
    "Buildings.Controls.OBC.ASHRAE.G36.Types.EnergyStandard.ASHRAE90_1",
  "Buildings.Templates.Data.AllSystems.stdVen":
    "Buildings.Controls.OBC.ASHRAE.G36.Types.VentilationStandard.California_Title_24",
  "Buildings.Templates.Data.AllSystems.ashCliZon":
    "Buildings.Controls.OBC.ASHRAE.G36.Types.ASHRAEClimateZone.Zone_1B",
};

const mzTemplatePath = "Buildings.Templates.AirHandlersFans.VAVMultiZone";
const zoneTemplatePath = "Buildings.Templates.ZoneEquipment.VAVBoxCoolingOnly";
const zoneReheatTemplatePath = "Buildings.Templates.ZoneEquipment.VAVBoxReheat";
const allOptions = store.templateStore.getAllOptions();
const allTemplates = store.templateStore.getAllTemplates();

/**
 * Adds boilerplate project level selections
 */
export const createSelections = (selections: ConfigValues = {}) => {
  return {
    ...projectSelections,
    ...selections,
  };
};

/**
 * Spoof creating a config, adding it to the store and returning the new config
 */
export const addNewConfig = (
  configName: string,
  template: TemplateInterface,
  selections: { [key: string]: string },
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

export const buildExpression = (operator: OperatorType, operands: any[]) => {
  return { operator, operands };
};

export const getRootStore = () => store;
export const getTestStore = () => testStore;

export const createStore = () => {
  return new RootStore(templateData);
};

export const createTemplateContext = (
  templatePath: TestTemplate,
  selections: {
    [key: string]: string;
  } = {},
  configName?: string,
) => {
  const store = createStore();
  const { path, configName: _configName } = _testTemplateData[templatePath];
  const template = store.getTemplate(path)!;
  const config = addNewConfig(
    configName || _configName,
    template,
    selections,
    store,
  );
  const context = new ConfigContext(
    template as TemplateInterface,
    config as ConfigInterface,
    allOptions,
    createSelections(selections),
  );

  return { context, template, path };
};

export const getTestTemplateData = (testTemplate: TestTemplate) =>
  _testTemplateData[testTemplate];

export enum TestTemplate {
  MultiZoneTemplate,
  ZoneTemplate,
  ZoneReheat,
}

const _testTemplateData = {
  [TestTemplate.MultiZoneTemplate]: {
    path: mzTemplatePath,
    configName: "VAVMultiZone Config",
  },
  [TestTemplate.ZoneTemplate]: {
    path: zoneTemplatePath,
    configName: "Zone Config",
  },
  [TestTemplate.ZoneReheat]: {
    path: zoneReheatTemplatePath,
    configName: "Zone Reheat Config",
  },
};
