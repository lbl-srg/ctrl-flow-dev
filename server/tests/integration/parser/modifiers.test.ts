import { createTestModelicaJson, fullTempDirPath } from "./utils";
import {
  getTemplates,
  Option,
  flattenModifiers,
} from "../../../src/parser/template";
import { findElement } from "../../../src/parser/parser";
import { loadPackage, Template } from "../../../src/parser/";
import { evaluateExpression } from "../../../src/parser/expression";
import * as parser from "../../../src/parser/parser";

const templatePath = "TestPackage.Template.TestTemplate";

let tOptions: { [key: string]: Option } = {};

interface ModContext {
  [key: string]: any;
}
const isExpression = (obj: any) =>
  ["operands", "operators"].reduce((acc, k) => acc && k in obj, false);

describe("Modifications", () => {
  beforeAll(() => {
    createTestModelicaJson();
    loadPackage(`${fullTempDirPath}/TestPackage`);
    const templates = getTemplates();
    const template = templates.find(
      (t) => t.modelicaPath === templatePath,
    ) as Template;

    const { options } = template.getOptions();
    tOptions = options;
  });

  // it("Template modifiers are all assigned", () => {
  //   // just check shape
  //   modifiers.map((m) => {
  //     expect(m.modelicaPath).toBeDefined();
  //     if (!m.value) {
  //       console.log(m);
  //     }
  //     expect(m.value).toBeDefined();
  //   });
  // });

  it("Maps Modifiers to Flattened List of Expressions and Paths", () => {
    const path = `TestPackage.Template.TestTemplate`;
    const element = findElement(path) as parser.InputGroup;
    const inputs = element?.getInputs() as {
      [key: string]: parser.TemplateInput;
    };
    const input = inputs[path];
    const mod = flattenModifiers(input.modifiers);
    const extendElement = element.extendElement;
    const modPath = `${extendElement?.type}.interface_param`;
    expect(evaluateExpression(mod[modPath].expression)).toEqual(
      "Updated Value",
    );
  });

  it("Modifier value is correct for a given option", () => {
    const childPath = `TestPackage.Interface.ExtendInterface.interface_param`;

    const element = findElement(childPath);
    const inputs = element?.getInputs() as {
      [key: string]: parser.TemplateInput;
    };
    const input = inputs[childPath];
    const mod = flattenModifiers(input.modifiers);
    expect(evaluateExpression(mod[childPath].expression)).toEqual(
      "Interface Param",
    );
  });

  it("Modifier paths are correctly expanded", () => {
    const path = "TestPackage.Template.TestTemplate.dat";
    const element = findElement(path);
    const inputs = element?.getInputs() as {
      [key: string]: parser.TemplateInput;
    };
    const input = inputs[path];
    const mods = flattenModifiers(input.modifiers);

    expect(
      "TestPackage.Template.Data.TestTemplate.container_selectable_component" in
        mods,
    ).toBeTruthy();
  });

  // it("Creates modifiers for replaceables", () => {
  //   const expectedMods = [
  //     [
  //       "TestPackage.Template.TestTemplate.selectable_component",
  //       "TestPackage.Component.SecondComponent",
  //     ],
  //   ];

  //   expectedMods.map((expectedMod) => {
  //     const [path, value] = expectedMod;
  //     const extendMod = modifiers.find((m) => m.modelicaPath === path);
  //     expect(extendMod?.value).toEqual(value);
  //   });
  // });

  /**
   * Checks that constrainby modifiers have been applied
   */
  it("Finds 'constrainby' modifiers", () => {
    const path = "TestPackage.Template.TestTemplate.selectable_component";
    const modPath = "TestPackage.Interface.PartialComponent.container";
    const expected = "TestPackage.Types.Container.Cone";
    const option = tOptions[path];
    const mods = option.modifiers;

    expect(mods[modPath]).toBeTruthy();
    expect(evaluateExpression(mods[modPath].expression)).toEqual(expected);
  });
});
