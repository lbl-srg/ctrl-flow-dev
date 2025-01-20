import { ModifiersN, getTemplates } from "../../../src/parser/template";
import { loadPackage, Template } from "../../../src/parser/";
import { initializeTestModelicaJson } from "./utils";
import * as parser from "../../../src/parser/parser";
const testModelicaFile = "TestPackage.Template.TestTemplate";

const templatePath = "TestPackage.Template.TestTemplate";
let template: Template | undefined;

describe("Expression", () => {
  beforeAll(() => {
    initializeTestModelicaJson();
    loadPackage('TestPackage');
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
  const template = file.elementList[0] as parser.LongClass;
  return template.getInputs();
}

describe("Template Input visible/enable expressions", () => {
  beforeAll(() => {
    initializeTestModelicaJson();
    inputs = getInputs();
  });

  it("no enable sets true", () => {
    const truthyPath = 'TestPackage.Template.TestTemplate.test_real';
    const truthyInput = inputs[truthyPath];

    // implicit 'true' if no 'enable' is specified
    expect(truthyInput.visible).toBeTruthy();
  });

  it("'final' param sets false", () => {
    const falsyPath = 'TestPackage.Template.TestTemplate.should_ignore';
    const falsyInput = inputs[falsyPath];
    expect(falsyInput.visible).toBeFalsy();
  });

  it("'outer' prefix sets false", () => {
    const falsyPath = 'TestPackage.Component.SecondComponent.inner_outer_param';
    const falsyInput = inputs[falsyPath];
    expect(falsyInput.visible).toBeFalsy();
  });

  it("'connectorSizing' handled correctly", () => {
    const falsyPath = 'TestPackage.Template.TestTemplate.connector_param';
    const falsyInput = inputs[falsyPath];
    expect(falsyInput.visible).toBeFalsy();

    const truthyPath = 'TestPackage.Template.TestTemplate.connector_param_false';
    const truthyInput = inputs[truthyPath];
    expect(truthyInput.visible).toBeTruthy();
  });
});
