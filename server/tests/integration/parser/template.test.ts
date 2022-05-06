import { createTestModelicaJson, fullTempDirPath } from "./utils";
import {
  loadPackage,
  getTemplates,
  getSystemTypes,
  Template,
} from "../../../src/parser/";

const templatePath = "TestPackage.Template.TestTemplate";
const nestedTemplatePath =
  "TestPackage.NestedTemplate.Subcategory.SecondTemplate";

describe("Basic parser functionality", () => {
  beforeAll(() => {
    createTestModelicaJson();
    loadPackage(`${fullTempDirPath}/TestPackage`);
  });

  it("Extracts two templates and three Template types to be in stores", () => {
    const templates = [...getTemplates()];
    expect(templates.length).toBe(2);

    const systemTypes = [...getSystemTypes()];
    expect(systemTypes.length).toBe(3);
  });

  it("Templates have expected options and SystemTypes", () => {
    // TODO: we cannot rely on order! GREP does not necessarily
    // return things in the order we expect
    const templates = getTemplates();
    const template = templates.find(
      (t) => t.modelicaPath === templatePath,
    ) as Template;
    const nestedTemplate = templates.find(
      (t) => t.modelicaPath === nestedTemplatePath,
    ) as Template;
    const templateSystemTypes = template.getSystemTypes();
    expect(templateSystemTypes.length).toBe(1);
    const nestedTemplateSystemTypes = nestedTemplate.getSystemTypes();
    expect(nestedTemplateSystemTypes.length).toBe(2);
  });

  it("Templates output expected linkage schema for SystemTemplates", () => {
    const expectedTemplateValues = {
      modelicaPath: "TestPackage.Template.TestTemplate",
      optionLength: 34,
      systemTypeLength: 1,
    };

    const expectedNestedTemplateValues = {
      modelicaPath: "TestPackage.NestedTemplate.Subcategory.SecondTemplate",
      optionLength: 2,
      systemTypeLength: 2,
    };

    const templates = getTemplates();
    const template = templates.find(
      (t) => t.modelicaPath === templatePath,
    ) as Template;
    const nestedTemplate = templates.find(
      (t) => t.modelicaPath === nestedTemplatePath,
    ) as Template;

    const systemTemplate = template.getSystemTemplate();
    const nestedSystemTemplate = nestedTemplate.getSystemTemplate();
    expect(systemTemplate.options?.length).toBe(
      expectedTemplateValues.optionLength,
    );
    expect(systemTemplate.modelicaPath).toBe(
      expectedTemplateValues.modelicaPath,
    );
    expect(systemTemplate.systemTypes.length).toBe(
      expectedTemplateValues.systemTypeLength,
    );

    expect(nestedSystemTemplate.options?.length).toBe(
      expectedNestedTemplateValues.optionLength,
    );
    expect(nestedSystemTemplate.modelicaPath).toBe(
      expectedNestedTemplateValues.modelicaPath,
    );
    expect(nestedSystemTemplate.systemTypes.length).toBe(
      expectedNestedTemplateValues.systemTypeLength,
    );
  });

  it("Keeps system types in correct order", () => {
    // The system types should match the directory order
    const templates = getTemplates();

    const nestedTemplate = templates.find(
      (t) => t.modelicaPath === nestedTemplatePath,
    ) as Template;

    const templateJSON = nestedTemplate.getSystemTemplate();
    const expectedOrder = [
      "TestPackage.NestedTemplate",
      "TestPackage.NestedTemplate.Subcategory",
    ];

    expect(templateJSON.systemTypes).toEqual(expectedOrder);
  });
});
