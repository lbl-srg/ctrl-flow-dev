import { createTestModelicaJson, fullTempDirPath } from "./utils";
import { getTemplates, Option, flattenModifiers } from "../../../src/parser/template";
import { findElement } from "../../../src/parser/parser";
import { loadPackage, Template} from "../../../src/parser/";
import { evaluateExpression } from "../../../src/parser/expression";
import * as parser from "../../../src/parser/parser";


const templatePath = "TestPackage.Template.TestTemplate";

let tOptions: {[key: string]: Option} = {};

interface ModContext {[key: string]: any};
const isExpression = (obj: any) => ['operands', 'operators'].reduce((acc, k) => acc && (k in obj), false);


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
    const path = `TestPackage.Template.TestTemplate.__extend`;
    const element = findElement(path);
    const inputs = element?.getInputs() as { [key: string]: parser.TemplateInput };
    const input = inputs[path];
    const mod = flattenModifiers(input.modifiers);
    const modPath = `${input.type}.interface_param`;
    expect(evaluateExpression(mod[modPath])).toEqual("Updated Value");
  });

  it("Modifier value is correct for a given option", () => {
    const childPath = `TestPackage.Interface.ExtendInterface.interface_param`;
  
    const element = findElement(childPath);
    const inputs = element?.getInputs() as { [key: string]: parser.TemplateInput };
    const input = inputs[childPath];
    const mod = flattenModifiers(input.modifiers);
    expect(evaluateExpression(mod[childPath])).toEqual("Interface Param");
  });

  // it("Correctly assigns '__extend' modifiers", () => {
  //   const parentPath = "TestPackage.Template.TestTemplate.__extend"
  //   const parentValue = "Updated Value";

  //   const parentOption = tOptions[parentPath];
  //   const childPath = `${parentOption.type}.interface_param`;
  //   const childOption = tOptions[childPath];
  //   const childValue = "Interface Param"

  //   expect(childOption.modifier).toBeTruthy();
  //   expect(parentOption.modifier).toBeTruthy();
    
  //   const parentContext = mapModifierToContext(parentOption.modifier as Mod);
  //   const childContext = mapModifierToContext(childOption.modifier as Mod);
  //   // test that parent context contains all necessary values
  //   expect(parentContext[childPath]).toEqual(parentValue);
  //   expect(childContext[childPath]).toEqual(childValue);
  // });

  // it("Finds modifiers from related classes", () => {
  //   const expectedMods = [
  //     [
  //       "TestPackage.Interface.PartialComponent.container",
  //       "TestPackage.Types.Container.Hand",
  //     ],
  //     [
  //       "TestPackage.Component.FirstComponent.component_param",
  //       "First Component Param",
  //     ],
  //   ];

  //   expectedMods.map((expectedMod) => {
  //     const [path, value] = expectedMod;
  //     const extendMod = modifiers.find((m) => m.modelicaPath === path);
  //     expect(evaluateExpression(extendMod?.value)).toEqual(value);
  //   });
  // });

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

  it("Finds 'constrainby' modifiers", () => {
    
    const expectedMods = [
      [
        "TestPackage.Template.TestTemplate.selectable_component.container",
        "TestPackage.Types.Container.Cone",
      ],
    ];

    expectedMods.map((expectedMod) => {
      const [path, value] = expectedMod;
      // const extendMod = modifiers.find((m) => m.modelicaPath === path);
      // expect(evaluateExpression(extendMod?.value)).toEqual(value);
      // TODO: update expectedMod path to use real path and test that constrain
      // mods are found with the replaceable input
    });
  });
});
