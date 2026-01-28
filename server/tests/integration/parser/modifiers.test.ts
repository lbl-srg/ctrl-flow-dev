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
    // For redeclare modifications: 'redeclare' stores the type, 'expression' is only set if there's a binding (=)
    expect(mod.redeclare).toEqual('TestPackage.Component.SecondComponent');
    expect(mod.expression).toBeUndefined();
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
    
    // Build options similar to Template._extractOptions
    const options: { [key: string]: any } = {};
    Object.entries(inputs).forEach(([key, input]) => {
      const flatMods = flattenModifiers(input.modifiers);
      // Remove self-reference modifier
      delete flatMods[input.modelicaPath];
      options[key] = {
        modelicaPath: input.modelicaPath,
        name: input.name,
        type: input.type,
        modifiers: flatMods,
      };
    });
    
    console.log("TestRecord templates.json equivalent:", JSON.stringify(options, null, 2));
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

  it("Sets recordBinding=true on value binding modifier, not on redeclare", () => {
    // Mod1: extends BaseModel with redeclare Rec rec = localRec
    // This produces two modifiers:
    // 1. redeclare modifier (type change) with recordBinding=false
    // 2. value binding modifier (rec=localRec) with recordBinding=true
    const element = findElement("TestRecord.Mod1") as parser.LongClass;
    expect(element).toBeDefined();

    const mods = element.mods;
    expect(mods).toBeDefined();
    expect(mods!.length).toBeGreaterThan(0);

    // The redeclare modifier should have redeclare=true but recordBinding=false
    const redeclareMod = mods![0];
    expect(redeclareMod.redeclare).toBe(true);
    expect(redeclareMod.recordBinding).toBe(false);

    // The child modifier (value binding) should have recordBinding=true
    expect(redeclareMod.mods.length).toBeGreaterThan(0);
    const bindingMod = redeclareMod.mods[0];
    expect(bindingMod.redeclare).toBe(false);
    expect(bindingMod.recordBinding).toBe(true);
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

    // The redeclare modifier path should have recordBinding=false
    const redeclarePath = "TestRecord.BaseModel.rec";
    expect(flatMods[redeclarePath]).toBeDefined();
    expect(flatMods[redeclarePath].redeclare).toBe(true);
    expect(flatMods[redeclarePath].recordBinding).toBe(false);

    // The value binding modifier path should have recordBinding=true
    const bindingPath = "TestRecord.Mod1.rec";
    expect(flatMods[bindingPath]).toBeDefined();
    expect(flatMods[bindingPath].redeclare).toBe(false);
    expect(flatMods[bindingPath].recordBinding).toBe(true);
  });

  afterAll(() => {
    // Generate options-TestRecord.json for client tests
    // This replicates the logic from Template._mapInputToOption
    const testRecord = findElement("TestRecord") as parser.LongClass;
    const inputs = testRecord.getInputs();

    // Helper to compute treeList (same as template.ts _getTreeList)
    const getTreeList = (option: any): string[] => {
      const treeList: string[] = [option.type];
      option.options?.forEach((o: string) => {
        let treeElement: string;
        if (option.shortExclType) {
          treeElement = o;
        } else {
          treeElement = o.split(".").slice(0, -1).join(".");
        }
        if (!treeList.includes(treeElement)) {
          treeList.push(treeElement);
        }
      });
      return treeList;
    };

    // Build options similar to Template._extractOptions / _mapInputToOption
    const options: { [key: string]: any } = {};
    Object.entries(inputs).forEach(([key, input]) => {
      const flatMods = flattenModifiers(input.modifiers);
      // Remove self-reference modifier
      delete flatMods[input.modelicaPath];

      const isDefinition = parser.isDefinition(input.elementType);
      const shortExclType = input.elementType.endsWith("-short");

      const option: any = {
        modelicaPath: input.modelicaPath,
        name: input.name,
        type: input.type,
        visible: input.visible,
        value: input.value,
        enable: input.enable,
        group: input.group,
        tab: input.tab,
        modifiers: flatMods,
        options: input.inputs, // Child option paths for linking
        definition: isDefinition,
        shortExclType: shortExclType,
        replaceable: input.replaceable || false,
        treeList: [], // Will be computed below
      };

      // Compute treeList for definitions
      if (isDefinition) {
        option.treeList = getTreeList(option);
      }

      // Include choiceModifiers if present
      if (input.choiceModifiers) {
        const flattenedChoiceMods: { [key: string]: any } = {};
        Object.entries(input.choiceModifiers).forEach(([choiceKey, modList]) => {
          flattenedChoiceMods[choiceKey] = flattenModifiers(modList);
        });
        option.choiceModifiers = flattenedChoiceMods;
      }

      options[key] = option;
    });

    // Write to client/tests/data/options-TestRecord.json
    const outputPath = path.resolve(
      __dirname,
      "../../../../client/tests/data/options-TestRecord.json"
    );
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(options, null, 2));
    console.log(`Generated: ${outputPath}`);
  });
});
