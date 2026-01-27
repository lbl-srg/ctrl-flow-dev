import { initializeTestModelicaJson } from "./utils";
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
    initializeTestModelicaJson();
    loadPackage('TestPackage');
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
    const element = findElement(path) as parser.LongClass;
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
    const element = findElement(templatePath);
    const inputs = element?.getInputs() as {
      [key: string]: parser.TemplateInput;
    };
    const datInput = inputs[`${templatePath}.dat`];
    const datMods = flattenModifiers(datInput.modifiers);

    expect(
      "TestPackage.Template.Data.TestTemplate.container_selectable_component" in
      datMods,
    ).toBeTruthy();

    const templateInput = inputs[templatePath];
    const templateMods = flattenModifiers(templateInput.modifiers);
    const nestedParamPath = "TestPackage.Interface.NestedExtendInterface.nested_interface_param";
    expect(nestedParamPath in templateMods).toBeTruthy();
  });

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

  it("Creates redeclare modifiers", () => {
    const path = "TestPackage.Template.TestTemplate.redeclare_param_01";
    const modPath = "TestPackage.Component.FourthComponent.replaceable_param";
    const option = tOptions[path];
    const mod = option.modifiers[modPath];

    expect(mod).toBeDefined();
    expect(mod.final).toBeTruthy();
    expect(evaluateExpression(mod.expression)).toEqual('TestPackage.Component.SecondComponent');
  });

  it("Doesn't have a modifier that matches the option path (the 'default mod')", () => {
    const path = "TestPackage.Template.TestTemplate.typ";
    const option = tOptions[path];
    const mod = option.modifiers[path];

    expect(mod).toBeUndefined();
  });
});

describe("Record Binding Modifications", () => {
  beforeAll(() => {
    // Load the TestRecord.json file directly
    const jsonData = require("../../static-data/TestRecord.json");
    new parser.File(jsonData, "TestRecord");
  });

  it("Sets recordBinding=false for redeclare without binding", () => {
    // Mod: extends BaseModel with redeclare Rec rec (no binding)
    const element = findElement("TestRecord.Mod") as parser.LongClass;
    expect(element).toBeDefined();

    const mods = element.mods;
    expect(mods).toBeDefined();
    expect(mods!.length).toBeGreaterThan(0);

    const redeclareMod = mods![0];
    expect(redeclareMod.redeclare).toBe(true);
    expect(redeclareMod.recordBinding).toBe(false);
  });

  it("Sets recordBinding=true for redeclare with binding to record instance", () => {
    // Mod1: extends BaseModel with redeclare Rec rec = localRec
    const element = findElement("TestRecord.Mod1") as parser.LongClass;
    expect(element).toBeDefined();

    const mods = element.mods;
    expect(mods).toBeDefined();
    expect(mods!.length).toBeGreaterThan(0);

    // The redeclare modifier should have both redeclare=true and recordBinding=true
    const redeclareMod = mods![0];
    expect(redeclareMod.redeclare).toBe(true);
    expect(redeclareMod.recordBinding).toBe(true);
  });

  it("Composite instance binding should have recordBinding=true", () => {
    // Mod mod2(localRec=mod1.localRec);
    const element = findElement("TestRecord.mod2") as any;
    expect(element).toBeDefined();

    const localMod = element?.mod?.mods[0];
    expect(localMod.recordBinding).toBe(true);
  });

  it("Includes recordBinding in flattened modifiers", () => {
    const element = findElement("TestRecord.Mod1") as parser.LongClass;
    const flatMods = flattenModifiers(element.mods);

    // The modifier path should match where the redeclare is scoped
    // Since BaseModel is in TestRecord, the path should be TestRecord.BaseModel.rec
    const modPath = "TestRecord.BaseModel.rec";
    expect(flatMods[modPath]).toBeDefined();
    expect(flatMods[modPath].redeclare).toBe(true);
    expect(flatMods[modPath].recordBinding).toBe(true);
  });
});
