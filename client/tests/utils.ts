import RootStore from "../src/data";
import templateData from "../src/data/templates.json";
import testTemplateData from "./static-data/test-templates.json";

import {
  ConfigInterface,
  ConfigValues,
  TemplateInterface,
} from "../src/data/types";

import { OperatorType, ConfigContext } from "../src/interpreter/interpreter";

// initialize global test dependencies
const projectSelections = {
  "Buildings.Templates.Data.AllSystems.stdEne": {
    value: "Buildings.Controls.OBC.ASHRAE.G36.Types.EnergyStandard.ASHRAE90_1",
  },
  "Buildings.Templates.Data.AllSystems.stdVen": {
    value:
      "Buildings.Controls.OBC.ASHRAE.G36.Types.VentilationStandard.California_Title_24",
  },
  "Buildings.Templates.Data.AllSystems.ashCliZon": {
    value: "Buildings.Controls.OBC.ASHRAE.G36.Types.ASHRAEClimateZone.Zone_1B",
  },
};

const mzTemplatePath = "Buildings.Templates.AirHandlersFans.VAVMultiZone";
const zoneTemplatePath = "Buildings.Templates.ZoneEquipment.VAVBoxCoolingOnly";
const zoneReheatTemplatePath = "Buildings.Templates.ZoneEquipment.VAVBoxReheat";
const testTemplatePath = "TestPackage.Template.TestTemplate";
const secondTestTemplatePath = "SecondTestPackage.Templates.Plants.Chiller";

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

export const buildExpression = (operator: OperatorType, operands: any[]) => {
  return { operator, operands };
};

export const createStore = (testStore: TestStore) => {
  switch (testStore) {
    case TestStore.RootStore:
      return new RootStore(templateData, { persist: false });
    case TestStore.TestStore:
      return new RootStore(testTemplateData, { persist: false });
    default:
      return new RootStore(templateData, { persist: false });
  }
};

/**
 *
 * @param templatePath
 * @param selections
 * @param options
 *     configName?: if provided manually sets the config name
 *     store: use the provided store instead of creating the default store for a given template
 * @returns
 */
export const createTemplateContext = (
  templatePath: TestTemplate,
  selections: ConfigValues = {},
  options?: { configName?: string; store: RootStore },
) => {
  const {
    path,
    configName: _configName,
    testStore,
  } = _testTemplateData[templatePath];

  const store = options?.store || createStore(testStore);
  const allOptions = store.templateStore.getAllOptions();
  const template = store.getTemplate(path)!;
  const config = addNewConfig(
    options?.configName || _configName,
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

  return { context, template, path, store, config };
};

export const getTestTemplateData = (testTemplate: TestTemplate) =>
  _testTemplateData[testTemplate];

export enum TestTemplate {
  MultiZoneTemplate,
  ZoneTemplate,
  ZoneReheat,
  TestTemplate,
  SecondTestTemplate,
}

export enum TestStore {
  RootStore,
  TestStore,
}

const _testTemplateData = {
  [TestTemplate.MultiZoneTemplate]: {
    path: mzTemplatePath,
    configName: "VAVMultiZone Config",
    testStore: TestStore.RootStore,
  },
  [TestTemplate.ZoneTemplate]: {
    path: zoneTemplatePath,
    configName: "Zone Config",
    testStore: TestStore.RootStore,
  },
  [TestTemplate.ZoneReheat]: {
    path: zoneReheatTemplatePath,
    configName: "Zone Reheat Config",
    testStore: TestStore.RootStore,
  },
  [TestTemplate.TestTemplate]: {
    path: testTemplatePath,
    configName: "Test Template Config",
    testStore: TestStore.TestStore,
  },
  [TestTemplate.SecondTestTemplate]: {
    path: secondTestTemplatePath,
    configName: "Second Test Template Config",
    testStore: TestStore.TestStore,
  },
};
