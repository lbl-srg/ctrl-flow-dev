import { notDeepEqual } from "assert";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import config from "../../../src/config";
import * as parser from "../../../src/parser/parser";

const tempDirPath = "/tmp/test-linkage-widget/";
const testModelicaFile = "TestPackage/Template/TestTemplate";
// const templatePath =
//   "json/tests/static-data/TestModelicaPackage/Template/TestTemplate";
// const fullTemplatePath = path.resolve(tempDirPath, templatePath);

// NOTE: if the test modelica package changes it will need to be
// manually removed to update for tests
function createTestModelicaJson() {
  if (!fs.existsSync(tempDirPath)) {
    fs.mkdirSync(tempDirPath);
    execSync(
      `node ${config.MODELICA_DEPENDENCIES}/modelica-json/app.js -f tests/static-data/TestPackage -o json -d ${tempDirPath}`,
    );
    // TODO: maybe use spawnsync so when a process errors this throws instead of silently failing
  }
}

describe("Basic parser functionality", () => {
  beforeAll(() => {
    createTestModelicaJson();
    parser.setPathPrefix(tempDirPath + "json/tests/static-data/");
  });

  it("Extracts a 'file' object", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const expectedPath = "TestPackage.Template";
    expect(file.modelicaPath).toEqual(expectedPath);
  });

  it("Supports loading with / syntax", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const expectedPath = "TestPackage.Template";
    expect(file.modelicaPath).toEqual(expectedPath);
  });

  it("Extracts Template modelica path", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const [template, ..._rest] = file.entries;
    const expectedPath = "TestPackage.Template.TestTemplate";
    expect(template.modelicaPath).toEqual(expectedPath);
  });

  it("Builds up modelica paths for subcomponents", () => {
    const paramName = "dat";

    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.entries[0] as parser.Model;
    const expectedPath = `${template.modelicaPath}.${paramName}`;

    expect(
      template.elementList.find((e) => e.modelicaPath === expectedPath),
    ).not.toBeFalsy();
  });

  it("Generates type instances by for related files", () => {
    const paramName = "dat";

    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.entries[0] as parser.Model;
    const expectedPath = `${template.modelicaPath}.${paramName}`;

    const dat = template.elementList.find(
      (e) => e.modelicaPath === expectedPath,
    ) as parser.Component;

    const option = dat.getOptions()[0];

    expect(option.options).toBeTruthy();
  });

  it("Extracts model elements", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.entries[0] as parser.Model;
    expect(template.elementList.length).not.toBe(0);
    template.elementList.map((e: parser.Element) =>
      expect(e.modelicaPath).not.toBeFalsy(),
    );
    template.elementList.map((e: parser.Element) =>
      expect(e.name).not.toBeFalsy(),
    );
  });
});

describe("Expected Options are extracted", () => {
  beforeAll(() => {
    createTestModelicaJson();
    parser.setPathPrefix(tempDirPath + "json/tests/static-data/");
  });

  it("Generates Options for literal types", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.entries[0] as parser.Model;

    // get elements that match literal types: Boolean, String, Real, Integer, Enum
    const templateOptions = template.getOptions();
    templateOptions.map((o) => {
      if (o.type in parser.MODELICA_LITERALS) {
        expect(o.name).not.toBeFalsy();
        expect(o.modelicaPath).not.toBeFalsy();
      }
    });

    const uninitializedParamPath = `${template.modelicaPath}.test_string_uninitialized`;
    const initializedParamPath = `${template.modelicaPath}.test_string_initialized`;
    const expectedValue = "I'm all set";

    // check that when a parameter has an initial value it is set, when it is not it is null
    const unInitializedOption = templateOptions.find(
      (o) => o.modelicaPath === uninitializedParamPath,
    );
    expect(unInitializedOption?.value).toBeUndefined();
    const initiazedOption = templateOptions.find(
      (o) => o.modelicaPath === initializedParamPath,
    );
    expect(initiazedOption?.value).toEqual(expectedValue);

    // check that other literals are extracted to a good value
    const boolPath = `${template.modelicaPath}.nullable_bool`;
    expect(
      templateOptions.find((o) => o.modelicaPath === boolPath)?.value,
    ).toBe(false);

    const realNumPath = `${template.modelicaPath}.test_real`;
    expect(
      templateOptions.find((o) => o.modelicaPath === realNumPath)?.value,
    ).toBe(1);

    const intPath = `${template.modelicaPath}.test_int`;
    expect(templateOptions.find((o) => o.modelicaPath === intPath)?.value).toBe(
      2,
    );
  });

  /*
  Literals can also be assigned expressions instead of a value.

  Check that instead of a value, the option has a value expression
  */
  it("Extracts literal value expression", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.entries[0] as parser.Model;
    const options = template.getOptions();
    const option = options.find(
      (o) =>
        o.modelicaPath === "TestPackage.Template.TestTemplate.expression_bool",
    ) as parser.OptionN;

    expect(option.value).toBeNull();
    expect(option.valueExpression).toBeTruthy();
  });

  it("Extracts 'choices'", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.entries[0] as parser.Model;
    const component = template.elementList.find(
      (e) => e.name === "selectable_component",
    ) as parser.Element;
    const options = component.getOptions(false);
    expect(options.length).toBe(1);
    const [option] = options;
    expect(option.options?.length).toBe(2);
    const [choice1, choice2] = option.options as string[];
    expect(choice1).toBe("TestPackage.Component.SecondComponent");
    expect(choice2).toBe("TestPackage.Component.ThirdComponent");
  });

  it("Gets parameter UI info", () => {
    const expectedTab = "Tabby";
    const expectedGroup = "Groupy";
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.entries[0] as parser.Model;
    const options = template.getOptions();
    const option = options.find(
      (o) =>
        o.modelicaPath === "TestPackage.Template.TestTemplate.nullable_bool",
    );
    expect(option?.group).toEqual(expectedGroup);
    expect(option?.tab).toEqual(expectedTab);
    expect(option?.enable).not.toBeFalsy();

    // also test a "constrainedby" component as this impacts where the annotation
    // is placed
    const selectablePath =
      "TestPackage.Template.TestTemplate.selectable_component";
    const selectableGroup = "Selectable Component";
    const selectable = options.find((o) => o.modelicaPath === selectablePath);
    expect(selectable?.group).toEqual(selectableGroup);
  });

  it("Ignore 'final' parameters", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.entries[0] as parser.Model;

    const options = template.getOptions();  
    const option = options.find(
      (o) =>
        o.modelicaPath === "TestPackage.Template.TestTemplate.should_ignore",
    );

    expect(option).toBeUndefined();
  });
});
