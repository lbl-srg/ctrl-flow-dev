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

function getInputs() {
  const file = parser.getFile(testModelicaFile) as parser.File;
  const template = file.elementList[0] as parser.InputGroup;
  return template.getInputs();
}

describe("Template Input visible/enable expressions", () => {
  beforeAll(() => {
    initializeTestModelicaJson();
  });

  it("'enable=false' sets false", () => {
    const inputs = getInputs();
    
    // test implicit true if 'enable' is not provided

  });

  it("'final' param sets false", () => {
    
  });

  it("'outer' prefix sets false", () => {
    // test that 'outer' overrides 'enable=true'
  });

  it("if 'connectorSizing' set false"), () => {

  }
});