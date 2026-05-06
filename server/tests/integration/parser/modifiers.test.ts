import { initializeTestModelicaJson } from "./utils";
import {
  getTemplates,
  Option,
  flattenModifiers,
  _mapInputToOption,
} from "../../../src/parser/template";
import { findElement } from "../../../src/parser/parser";
import { loadPackage, Template } from "../../../src/parser/";
import { evaluateExpression } from "../../../src/parser/expression";
import * as parser from "../../../src/parser/parser";
import * as fs from "fs";
import * as path from "path";

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
    loadPackage("TestPackage");
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
    // Modifier paths are now instance-based, not type-based
    const modPath = `${path}.interface_param`;
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

    // Modifier paths are instance-based: templatePath.dat.fieldName
    expect(
      "TestPackage.Template.TestTemplate.dat.container_selectable_component" in
        datMods,
    ).toBeTruthy();

    const templateInput = inputs[templatePath];
    const templateMods = flattenModifiers(templateInput.modifiers);
    // Modifier paths are now instance-based, not type-based
    const nestedParamPath = `${templatePath}.nested_interface_param`;
    expect(nestedParamPath in templateMods).toBeTruthy();
  });

  /**
   * Checks that constrainby modifiers have been applied
   */
  it("Finds 'constrainby' modifiers", () => {
    const path = "TestPackage.Template.TestTemplate.selectable_component";
    // Modifier paths are now instance-based, not type-based
    const modPath = `${path}.container`;
    const expected = "TestPackage.Types.Container.Cone";
    const option = tOptions[path];
    const mods = option.modifiers;

    expect(mods[modPath]).toBeTruthy();
    expect(evaluateExpression(mods[modPath].expression)).toEqual(expected);
  });

  it("Creates redeclare modifiers", () => {
    const path = "TestPackage.Template.TestTemplate.redeclare_param_01";
    // Modifier paths are now instance-based, not type-based
    const modPath = `${path}.replaceable_param`;
    const option = tOptions[path];
    const mod = option.modifiers[modPath];

    expect(mod).toBeDefined();
    expect(mod.final).toBeTruthy();
    // For redeclare modifications: 'redeclare' stores the type, 'expression' is only set if there's a binding (=)
    expect(mod.redeclare).toEqual("TestPackage.Component.SecondComponent");
    expect(mod.expression).toBeUndefined();
  });

  /**
   * Regression test for https://github.com/lbl-srg/ctrl-flow-dev/issues/418
   * Element-level modifiers on a replaceable must be captured alongside
   * constraining-clause modifiers.
   */
  it("Includes element-level modifiers on replaceable (not just constraining-clause mods)", () => {
    const path =
      "TestPackage.Template.TestTemplate.selectable_component_with_element_mods";
    const constrainingModPath = `${path}.container`; // from constraining clause
    const elementModPath = `${path}.icecream`; // from element itself
    const option = tOptions[path];
    const mods = option.modifiers;

    // Constraining-clause modifier should be present
    expect(mods[constrainingModPath]).toBeTruthy();
    expect(
      evaluateExpression(mods[constrainingModPath].expression),
    ).toEqual("TestPackage.Types.Container.Cone");

    // Element-level modifier should be present and take precedence over constraining clause modifiers
    expect(mods[elementModPath]).toBeTruthy();
    expect(
      evaluateExpression(mods[elementModPath].expression),
    ).toEqual("first.icecream");
    expect(mods[elementModPath].final).toBe(true);
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

    // Log full templates.json equivalent for TestRecord
    const testRecord = findElement("TestRecord") as parser.LongClass;
    const inputs = testRecord.getInputs();
  });

  it("Sets recordBinding=false for redeclare without binding", () => {
    // Mod: extends BaseModel with redeclare Rec rec (no binding)
    const element = findElement("TestRecord.Mod") as parser.LongClass;
    expect(element).toBeDefined();

    const mods = element.mods;
    expect(mods).toBeDefined();
    expect(mods!.length).toBeGreaterThan(0);

    const redeclareMod = mods![0];
    expect(redeclareMod.recordBinding).toBe(false);
  });

  it("Sets recordBinding=true on redeclare with value binding", () => {
    // Mod1: extends BaseModel with redeclare Rec rec = localRec
    // redeclare stores the type, and if there's a binding (=),
    // the value is stored on the same modifier with recordBinding=true
    const element = findElement("TestRecord.Mod1") as parser.LongClass;
    expect(element).toBeDefined();

    const mods = element.mods;
    expect(mods).toBeDefined();
    expect(mods!.length).toBeGreaterThan(0);

    // The modifier should have redeclare=type AND recordBinding=true (because there's a binding)
    const redeclareMod = mods![0];
    expect(redeclareMod.redeclare).toBe("TestRecord.Rec");
    expect(redeclareMod.recordBinding).toBe(true);
    expect(redeclareMod.value).toEqual({
      operator: "none",
      operands: ["localRec"],
    });
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

    // redeclare with binding is a single modifier with both
    // redeclare (the type) and expression (the binding), with recordBinding=true
    // Modifier paths are instance-based: Mod1 extends BaseModel, so rec is at Mod1.rec
    const redeclarePath = "TestRecord.Mod1.rec";
    expect(flatMods[redeclarePath]).toBeDefined();
    expect(flatMods[redeclarePath].redeclare).toBe("TestRecord.Rec");
    expect(flatMods[redeclarePath].recordBinding).toBe(true);
    // The expression should contain the binding value
    expect(flatMods[redeclarePath].expression).toEqual({
      operator: "none",
      operands: ["localRec"],
    });
  });

  afterAll(() => {
    // Generate options-TestRecord.json for client tests
    const testRecord = findElement("TestRecord") as parser.LongClass;
    const inputs = testRecord.getInputs();

    const options: { [key: string]: Option } = {};
    Object.entries(inputs).forEach(([key, input]) => {
      options[key] = _mapInputToOption(input);
    });

    // Write to client/tests/data/options-TestRecord.json
    const outputPath = path.resolve(
      __dirname,
      "../../../../client/tests/data/options-TestRecord.json",
    );
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(options, null, 2));
    console.log(`Generated: ${outputPath}`);
  });
});
