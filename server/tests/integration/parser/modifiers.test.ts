import { createTestModelicaJson, fullTempDirPath } from "./utils";
import { ModifiersN } from "../../../src/parser/template";
import {
  loadPackage,
  getTemplates,
  getSystemTypes,
  Template,
} from "../../../src/parser/";

const templatePath = "TestPackage.Template.TestTemplate";

let modifiers: ModifiersN[] = [];

describe("Modifications", () => {
  beforeAll(() => {
    createTestModelicaJson();
    loadPackage(`${fullTempDirPath}/TestPackage`);
    const templates = getTemplates();
    const template = templates.find(
      (t) => t.modelicaPath === templatePath,
    ) as Template;

    modifiers = template.getModifiers();
  });

  it("Template modifiers are all assigned", () => {
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
      ],
    ];
    expectedMods.map((expectedMod) => {
      const [path, value] = expectedMod;
      const extendMod = modifiers.find((m) => m.modelicaPath === path);
      expect(extendMod?.value).toEqual(value);
    });
  });

  it("Finds modifiers from related classes", () => {
    const expectedMods = [
      [
        "TestPackage.Component.FirstComponent.__extend.container",
        "TestPackage.Types.Container.Hand",
      ],
      [
        "TestPackage.Component.FirstComponent.component_param",
        '"First Component Param"',
      ],
    ];

    expectedMods.map((expectedMod) => {
      const [path, value] = expectedMod;
      const extendMod = modifiers.find((m) => m.modelicaPath === path);
      expect(extendMod?.value).toEqual(value);
    });
  });

  it("Creates modifiers for replaceables", () => {
    const expectedMods = [
      [
        "TestPackage.Template.TestTemplate.selectable_component",
        "TestPackage.Component.SecondComponent",
      ],
    ];

    expectedMods.map((expectedMod) => {
      const [path, value] = expectedMod;
      const extendMod = modifiers.find((m) => m.modelicaPath === path);
      expect(extendMod?.value).toEqual(value);
    });
  });

  it("Finds 'constrainby' modifiers", () => {
    const expectedMods = [
      [
        "TestPackage.Template.TestTemplate.selectable_component.container",
        "TestPackage.Types.Container.Cone",
      ],
    ];

    expectedMods.map((expectedMod) => {
      const [path, value] = expectedMod;
      const extendMod = modifiers.find((m) => m.modelicaPath === path);
      expect(extendMod?.value).toEqual(value);
    });
  });
});
