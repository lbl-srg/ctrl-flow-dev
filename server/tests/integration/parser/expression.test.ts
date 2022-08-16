import { createTestModelicaJson, fullTempDirPath } from "./utils";
import { ModifiersN, getTemplates } from "../../../src/parser/template";
import { loadPackage, getSystemTypes, Template } from "../../../src/parser/";
import { initializeTestModelicaJson } from "./utils";
import * as parser from "../../../src/parser/parser";
const testModelicaFile = "TestPackage.Template.TestTemplate";

const templatePath = "TestPackage.Template.TestTemplate";
let template: Template | undefined;

describe("Expression", () => {
  beforeAll(() => {
    createTestModelicaJson();
    loadPackage(`${fullTempDirPath}/TestPackage`);
    const templates = getTemplates();
    template = templates.find(
      (t) => t.modelicaPath === templatePath,
    ) as Template;
  });

  it("Parses Simple Value Expression", () => {
    const paramPath = "TestPackage.Template.TestTemplate.expression_bool";
    const { options } = (template as Template).getOptions();
    const option = options[paramPath];
    expect(option.value).toBeTruthy();
    //
  });
});

let inputs: {[key: string]: parser.TemplateInput} = {};

function getInputs() {
  const file = parser.getFile(testModelicaFile) as parser.File;
  const template = file.elementList[0] as parser.InputGroup;
  return template.getInputs();
}

describe("Template Input visible/enable expressions", () => {
  beforeAll(() => {
    initializeTestModelicaJson();
    inputs = getInputs();
  });

  it("'enable=false' sets false", () => {
    const falsyPath = 'TestPackage.Template.TestTemplate.test_int';
    const falsyInput = inputs[falsyPath];
  
    expect(falsyInput.visible).toBeFalsy();

    const truthyPath = 'TestPackage.Template.TestTemplate.test_real';
    const truthyInput = inputs[truthyPath];

    // implicit 'true' if no 'enable' is specified
    expect(truthyInput.visible).toBeTruthy();
  });

  it("'final' param sets false", () => {

  });

  it("'outer' prefix sets false", () => {
    // test that 'outer' overrides 'enable=true'
  });

  it("if 'connectorSizing' set false"), () => {

  }
});