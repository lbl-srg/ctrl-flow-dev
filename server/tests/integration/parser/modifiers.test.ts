import { createTestModelicaJson, fullTempDirPath } from "./utils";
import {
  loadPackage,
  getTemplates,
  getSystemTypes,
} from "../../../src/parser/";

describe("Basic parser functionality", () => {
  beforeAll(() => {
    createTestModelicaJson();
    loadPackage(`${fullTempDirPath}/TestPackage`);
  });

  it("Template parameter modifiers are extracted", () => {
    const expectedMods = [
      [
        "TestPackage.Template.TestTemplate.selectable_component",
        "TestPackage.Component.SecondComponent",
      ],
      [
        "Testpackage.Template.TestTemplate.first.component_param",
        "First Component Template Override",
      ],
      ["TestPackage.Template.TestTemplate.should_ignore", "ignore me"],
    ];
    const [testTemplate, ..._otherTemplates] = getTemplates();

    const modifiers = testTemplate.getModifiers();

    expectedMods.map((m) => {
      const [key, value] = m;
      const mod = modifiers.find((modifier) => modifier.path);
    });
  });
});
