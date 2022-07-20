import { createTestModelicaJson, fullTempDirPath } from "./utils";
import { ModifiersN, getTemplates } from "../../../src/parser/template";
import { loadPackage, getSystemTypes, Template } from "../../../src/parser/";

const templatePath = "TestPackage.Template.TestTemplate";
let template: Template | undefined;

describe("Expressions", () => {
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
    const option = (template as Template).getOptions()[paramPath];
    expect(option.valueExpression).toBeTruthy();
    //
  });
});
