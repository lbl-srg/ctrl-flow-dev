import { createTestModelicaJson, fullTempDirPath } from "./utils";
import {
  loadPackage,
  getSystemTypes,
  Template,
  getOptions,
} from "../../../src/parser/";

import { getTemplates } from "../../../src/parser/template";

const TEMPLATE_PATH = "TestPackage.Template.TestTemplate";
const NESTED_TEMPLATE_PATH =
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
      (t) => t.modelicaPath === TEMPLATE_PATH,
    ) as Template;
    const nestedTemplate = templates.find(
      (t) => t.modelicaPath === NESTED_TEMPLATE_PATH,
    ) as Template;
    const templateSystemTypes = template.getSystemTypes();
    expect(templateSystemTypes.length).toBe(1);
    const nestedTemplateSystemTypes = nestedTemplate.getSystemTypes();
    expect(nestedTemplateSystemTypes.length).toBe(2);
  });

  it("Templates output expected linkage schema for SystemTemplates", () => {
    const expectedTemplateValues = {
      modelicaPath: "TestPackage.Template.TestTemplate",
      optionLength: 25,
      systemTypeLength: 1,
    };

    const templates = getTemplates();
    const template = templates.find(
      (t) => t.modelicaPath === TEMPLATE_PATH,
    ) as Template;

    const systemTemplate = template.getSystemTemplate();
    const { options, scheduleOptions } = getOptions();

    const systemTemplateOptions = options.find(
      (o) => o.modelicaPath === systemTemplate.modelicaPath,
    );
    // this number changes a lot so using greaterThan
    expect(systemTemplateOptions?.options?.length).toBeGreaterThanOrEqual(
      expectedTemplateValues.optionLength,
    );
  });

  it("Templates generate separate schedule options and configuration options", () => {
    const datPath = "TestPackage.Template.Data.TestTemplate.record_parameter";
    const datParamPath = "TestPackage.Template.TestTemplate.dat";
    const templates = getTemplates();

    const { options, scheduleOptions } = getOptions();
    const datScheduleOption = scheduleOptions.find(
      (o) => o.modelicaPath === datPath,
    );
    expect(datScheduleOption).toBeTruthy();

    const template = templates.find(
      (t) => t.modelicaPath === TEMPLATE_PATH,
    ) as Template;

    const templateJson = template.getSystemTemplate();
    const datRoots = templateJson.scheduleOptionPaths
      .map((p) => scheduleOptions.find((o) => o.modelicaPath === p))
      .filter((o) => o !== undefined);
    // check that the 'dat' parameter is still available as a reference
    // const template = options.find( (o) => o.modelicaPath === "TestPackage.Template.TestTemplate");
    expect(datRoots.length).toBeGreaterThan(0);
  });

  it("Schedule option paths are unique from options", () => {
    const templates = getTemplates();
    const template = templates.find(
      (t) => t.modelicaPath === TEMPLATE_PATH,
    ) as Template;

    const { options, scheduleOptions } = template.getOptions();

    Object.keys(options).map((o) => {
      expect(scheduleOptions[o]).toBeUndefined();
    });

    Object.keys(scheduleOptions).map((o) => {
      expect(options[o]).toBeUndefined();
    });
  });

  it("Keeps system types in correct order", () => {
    // The system types should match the directory order
    const templates = getTemplates();

    const nestedTemplate = templates.find(
      (t) => t.modelicaPath === NESTED_TEMPLATE_PATH,
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

  it("Assigns scopeList with child and parent options", () => {
    // Important that scope list is in order!
    const expectedScopeList = [
      "TestPackage.Template.TestTemplate",
      "TestPackage.Interface.ExtendInterface",
      "TestPackage.Interface.NestedExtendInterface",
    ];

    const { options } = getOptions();

    const testTemplate = options.find(
      (o) => o.modelicaPath === "TestPackage.Template.TestTemplate",
    );

    expect(testTemplate?.treeList).toBeTruthy();

    testTemplate?.treeList?.map((t) => {
      const expectedScope = expectedScopeList.shift();
      expect(t).toEqual(expectedScope);
    });
  });

  it("Genereates path modifiers", () => {
    const templates = getTemplates();
    const template = templates.find(
      (t) => t.modelicaPath === TEMPLATE_PATH,
    ) as Template;

    const { pathModifiers } = template.getSystemTemplate();

    expect(pathModifiers).toBeDefined();
    expect("third.selectable_component" in pathModifiers).toBeTruthy();
    expect(pathModifiers["third.selectable_component"]).toEqual(
      "selectable_component",
    );

    // TODO: I'm a little unsure I'm handling instance pathing correct here
    // This test is specifically around inherited 'outer' params. Child options
    // get 'flattened' from inhereted classes, so the outer definition will likely
    // be in the inherited class and then implemented in the child class. Each would
    // have the same 'scope'
    expect("nested_outer_param" in pathModifiers).toBeTruthy();
    expect(pathModifiers["nested_outer_param"]).toEqual("nested_outer_param");
  });
});
