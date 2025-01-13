import { initializeTestModelicaJson } from "./utils";
import {
  loadPackage,
  getSystemTypes,
  Template,
  getOptions,
} from "../../../src/parser/";

import { getTemplates, getProject } from "../../../src/parser/template";

const TEMPLATE_PATH = "TestPackage.Template.TestTemplate";
const NESTED_TEMPLATE_PATH =
  "TestPackage.NestedTemplate.Subcategory.SecondTemplate";

describe("Template wrapper class functionality", () => {
  beforeAll(() => {
    initializeTestModelicaJson();
    loadPackage('TestPackage');
  });

  it("Extracts two templates and three Template types to be in stores", () => {
    const templates = [...getTemplates()];
    expect(templates.length).toBe(2);

    const systemTypes = [...getSystemTypes()];
    console.log(systemTypes);
    expect(systemTypes.length).toBe(2);
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
    expect(nestedTemplateSystemTypes.length).toBe(1);
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

  it("There should be only one system type for each template", () => {
    // Check that we only add the Modelica class name of the containing package.
    const templates = getTemplates();

    const nestedTemplate = templates.find(
      (t) => t.modelicaPath === NESTED_TEMPLATE_PATH,
    ) as Template;

    const templateJSON = nestedTemplate.getSystemTemplate();
    const expectedOrder = [
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

  it("Generates path modifiers", () => {
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

  it("Finds types associated by redeclares", () => {
    const { options } = getOptions();

    // FifthComponent is only reference through a modifier and not a choices annotation
    // The modifier is in the scope of the template so the referenced type should be
    // found and included in the big list of options
    expect(
      options.find(
        (o) => o.modelicaPath === "TestPackage.Component.FifthComponent",
      ),
    ).toBeDefined();
  });
});

const PROJECT_INSTANCE_NAME = "datAll";

describe("'Project' items are extracted", () => {
  beforeAll(() => {
    initializeTestModelicaJson();
    loadPackage('TestPackage');
  });
  it("Project is populated and all project options are included in options", () => {
    const project = getProject();
    const { options } = getOptions();
    const optionList = [];

    expect(project).toBeDefined();
    expect(project.modelicaPath).toBe(PROJECT_INSTANCE_NAME);
    // recursive helper to collect options
    const optionAccumulator = (path: string) => {
      const option = options.find((o) => o.modelicaPath === path);
      if (option) {
        optionList.push(option);
        option.options
          ?.filter((p) => p !== undefined)
          .map((p) => optionAccumulator(p));
      }
    };

    optionAccumulator(project.modelicaPath);
    // More than 1 means the project option and child options have been found
    expect(optionList.length).toBeGreaterThan(1);
  });

  it("Path modifiers point to correct 'datAll'", () => {
    // check all pathModifiers that end with 'datAll' link to
    // 'datAll'
    const templates = getTemplates();
    const template = templates.find(
      (t) => t.modelicaPath === TEMPLATE_PATH,
    ) as Template;

    const { pathModifiers } = template.getSystemTemplate();

    const datAllList = Object.keys(pathModifiers).filter((path) =>
      path.endsWith(PROJECT_INSTANCE_NAME),
    );
    expect(datAllList.length).toBeGreaterThan(0);

    // expect pathModifiers to include paths to project data
    Object.keys(pathModifiers)
      .filter((path) => path.endsWith(PROJECT_INSTANCE_NAME))
      .forEach((path) => {
        expect(pathModifiers[path]).toEqual(PROJECT_INSTANCE_NAME);
      });
  });
});
