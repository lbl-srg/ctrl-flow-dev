import { createTestModelicaJson, fullTempDirPath } from "./utils";
import { ModifiersN, getTemplates } from "../../../src/parser/template";
import { loadPackage, getSystemTypes, Template } from "../../../src/parser/";

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
