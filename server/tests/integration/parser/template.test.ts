import { createTestModelicaJson, fullTempDirPath } from "./utils";
import {
  loadPackage,
  getSystemTypes,
  Template,
  getOptions,
} from "../../../src/parser/";

import { getTemplates } from "../../../src/parser/template";

const templatePath = "TestPackage.Template.TestTemplate";
const nestedTemplatePath =
  "TestPackage.NestedTemplate.Subcategory.SecondTemplate";

describe("Template wrapper class functionality", () => {
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

  it("Templates have expected SystemTypes", () => {
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
      optionLength: 22,
      systemTypeLength: 1,
    };

    const templates = getTemplates();
    const template = templates.find(
      (t) => t.modelicaPath === templatePath,
    ) as Template;

    const systemTemplate = template.getSystemTemplate();
    const { options, scheduleOptions } = getOptions();

    const systemTemplateOptions = options.find(
      (o) => o.modelicaPath === systemTemplate.modelicaPath,
    );
    expect(systemTemplateOptions?.options?.length).toBe(
      expectedTemplateValues.optionLength,
    );
  });

  it("Templates generate separate schedule options and configuration options", () => {
    const datPath = "TestPackage.Template.Data.TestTemplate.record_parameter";

    const { scheduleOptions } = getOptions();
    const datScheduleOption = scheduleOptions.find(
      (o) => o.modelicaPath === datPath,
    );
    expect(datScheduleOption).toBeTruthy();
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

  it("Assigns 'definition' attribute as expected", () => {
    const { options } = getOptions();

    const replaceable = options.find(
      (o) =>
        o.modelicaPath ===
        "TestPackage.Template.TestTemplate.selectable_component",
    );
    const literal = options.find(
      (o) =>
        o.modelicaPath === "TestPackage.Template.TestTemplate.nullable_bool",
    );
    const typeDefinition = options.find(
      (o) => o.modelicaPath === "TestPackage.Component.SecondComponent",
    );
    const enumValue = options.find(
      (o) => o.modelicaPath === "TestPackage.Types.Container.Bowl",
    );

    expect(replaceable?.definition).toBeFalsy();
    expect(literal?.definition).toBeFalsy();
    expect(typeDefinition?.definition).toBeTruthy();
    expect(enumValue?.definition).toBeTruthy();
  });
});
