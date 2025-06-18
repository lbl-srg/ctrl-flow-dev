import { ConfigContext } from "../../src/interpreter/interpreter";
import { ConfigInterface, TemplateInterface } from "../../src/data/types";

import { getRootStore, getTestStore, addNewConfig } from "./utils";

const store = getRootStore();
const testStore = getTestStore();
const mzTemplatePath = "Buildings.Templates.AirHandlersFans.VAVMultiZone";
const testTemplatePath = "TestPackage.Template.TestTemplate";

describe("Basic Context generation without selections", () => {
  it("Is able to construct a context with test package json", () => {
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
    const mzTemplate = store.getTemplate(mzTemplatePath)!;
    const mzConfig = addNewConfig("VAVMultiZone Config", mzTemplate, {}, store);

    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      store.getTemplateNodes(),
    );
  });
});
