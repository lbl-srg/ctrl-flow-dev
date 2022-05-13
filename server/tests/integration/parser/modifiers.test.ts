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
        "TestPackage.Template.TestTemplate.selectable_component.container"
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

    // just check shape
    modifiers.map((m) => {
      expect(m.modelicaPath).toBeDefined();
      expect(m.value).toBeDefined();
    });
  });

  it("Correctly assigns '__extend' modifiers", () => {
    const expectedMods = [
      [
        "TestPackage.Template.TestTemplate.__extend.interface_param",
        '"Updated Value"',
      ]
    ];
  });

  it("Finds modifiers from related classes", () => {
    const expectedMod = [
      [
        "TestPackage.Component.FirstComponent.__extend.container",
        'TestPackage.Types.Container.Hand',
      ],
      [
        "TestPackage.Component.FirstComponent.__extend",
        "First Component Param"
      ]
    ];
  });

  it("Creates modifiers for replaceables", () => {

  })

  it("Finds 'constrainby' modifiers", () => {

  });
});
