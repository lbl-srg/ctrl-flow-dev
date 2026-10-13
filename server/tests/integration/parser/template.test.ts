import { initializeTestModelicaJson } from "./utils";
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
    initializeTestModelicaJson();
    loadPackage('TestPackage');
  });

  it("Extracts two templates and three Template types to be in stores", () => {
    const templates = [...getTemplates()];
    expect(templates.length).toBe(2);

    const systemTypes = [...getSystemTypes()];
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

    console.log(pathModifiers);

    expect(pathModifiers).toBeDefined();
    expect("third.selectable_component" in pathModifiers).toBeTruthy();
    expect(pathModifiers["third.selectable_component"]).toEqual(
      "selectable_component",
    );

    // This test that an outer param is correctly linked to a top-level inner declaration
    expect(
      "selectable_component.inner_outer_param" in pathModifiers,
    ).toBeTruthy();
    expect(pathModifiers["selectable_component.inner_outer_param"]).toEqual(
      "inner_outer_param",
    );
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
  it("Includes the project settings in the options", () => {
    const projectPath = "Buildings.Templates.Data.AllSystems";
    const { options } = getOptions();
    const project = options.find((o) => o.modelicaPath === projectPath);

    expect(project?.options).toContain(`${projectPath}.projectSetting`);
    expect(
      options.find((o) => o.modelicaPath === `${projectPath}.projectSetting`),
    ).toBeDefined();
    // The inner component of the project settings is declared outside of
    // the templates: it is not an option
    expect(
      options.find((o) => o.modelicaPath === PROJECT_INSTANCE_NAME),
    ).toBeUndefined();
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

  it("Replaceable short class definitions are supported", () => {
    const templates = getTemplates();
    const template = templates.find(
      (t) => t.modelicaPath === TEMPLATE_PATH,
    ) as Template;
    const { options } = template.getOptions();
    // Check that the short class instance has the proper type
    expect(options[`${TEMPLATE_PATH}.shortClassInstance`].type).toEqual(
      `${TEMPLATE_PATH}.ShortClass`,
    );
    // Check that the replaceable short class has the expected options
    // (from the choices annotation)
    expect(options[`${TEMPLATE_PATH}.ShortClass`].options).toEqual([
      "TestPackage.Component.FirstComponent",
      "TestPackage.Component.SecondComponent",
    ]);
  });

  it("Gives the kind of class of class definitions", () => {
    const { options } = getOptions();
    const kindOfClass = (path: string) =>
      options.find((o) => o.modelicaPath === path)?.kindOfClass;
    expect(kindOfClass(TEMPLATE_PATH)).toEqual("model");
    // Without `partial`
    expect(kindOfClass("TestPackage.Interface.PartialComponent")).toEqual(
      "model",
    );
    // Replaceable short class: the prefixes repeated in a redeclaration
    expect(kindOfClass(`${TEMPLATE_PATH}.ShortClass`)).toEqual("model");
    expect(kindOfClass("TestPackage.Types.Container")).toEqual("type");
    // Components and enumeration literals are not class definitions
    expect(kindOfClass(`${TEMPLATE_PATH}.shortClassInstance`)).toBeUndefined();
    expect(
      options.find((o) => o.modelicaPath.startsWith("TestPackage.Types.Container."))
        ?.kindOfClass,
    ).toBeUndefined();
  });
});
