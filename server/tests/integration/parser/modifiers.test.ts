import { createTestModelicaJson, fullTempDirPath } from "./utils";
import {
  loadPackage,
  getTemplates,
  getSystemTypes,
  Template,
} from "../../../src/parser/";

const templatePath = "TestPackage.Template.TestTemplate";
const nestedPath = "TestPackage.NestedTemplate.Subcategory.SecondTemplate";

describe("Modifications", () => {
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
    const templates = getTemplates();
    const template = templates.find(
      (t) => t.modelicaPath === templatePath,
    ) as Template;

    const modifiers = template.getModifiers();

    expectedMods.map((m) => {
      const [key, value] = m;
      const mod = modifiers.find((modifier) => modifier.modelicaPath);
    });
  });
});
