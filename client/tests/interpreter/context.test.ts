import { ConfigContext } from "../../src/interpreter/interpreter";
import { ConfigInterface, TemplateInterface } from "../../src/data/types";

import { createStore, addNewConfig, TestStore } from "../utils";

describe("Basic Context generation without selections", () => {
  it("Is able to construct a context with test package json", () => {
    const testTemplatePath = "TestPackage.Template.TestTemplate";
    const testStore = createStore(TestStore.TestStore);
    const testTemplate = testStore.getTemplate(testTemplatePath)!;
    const testConfig = addNewConfig(
      "Second Package Config",
      testTemplate,
      {},
      testStore,
    );

    const context = new ConfigContext(
      testTemplate as TemplateInterface,
      testConfig as ConfigInterface,
      testStore.getTemplateNodes(),
    );
  });

  it("Is able to construct a context with primary templates.json", () => {
    const mzTemplatePath = "Buildings.Templates.AirHandlersFans.VAVMultiZone";
    const store = createStore(TestStore.RootStore);
    const mzTemplate = store.getTemplate(mzTemplatePath)!;
    const mzConfig = addNewConfig("VAVMultiZone Config", mzTemplate, {}, store);

    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      store.getTemplateNodes(),
    );
  });
});
