import * as parser from "../../../src/parser/parser";
import { initializeTestModelicaJson, optionTree } from "./utils";
const testModelicaFile = "TestPackage.Template.TestTemplate";

describe("Basic parser functionality", () => {
  beforeAll(() => {
    initializeTestModelicaJson();
  });

  // afterEach(() => {
  //   // type store needs to be reset to let the parser parser
  //   // the same path multiple times. Typically it will stop once it knows
  //   parser.typeStore._store = new Map();
  // });

  it("Extracts Template modelica path", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const [template, ..._rest] = file.elementList;
    const expectedPath = "TestPackage.Template.TestTemplate";
    expect(template.modelicaPath).toEqual(expectedPath);
  });

  it("Builds up modelica paths for subcomponents", () => {
    const paramName = "dat";

    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.elementList[0] as parser.InputGroup;
    const expectedPath = `${template.modelicaPath}.${paramName}`;
    const element = template.elementList.find(
      (e) => e.modelicaPath === expectedPath,
    );
    expect(element).toBeTruthy();
  });

  it("Generates type instances by for related files", () => {
    const paramName = "dat";

    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.elementList[0] as parser.InputGroup;
    const expectedPath = `${template.modelicaPath}.${paramName}`;

    const dat = template.elementList.find(
      (e) => e.modelicaPath === expectedPath,
    ) as parser.Input;

    const option = dat.getInputs()[expectedPath];

    expect(option.options).toBeTruthy();
  });

  it("Extracts model elements", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.elementList[0] as parser.InputGroup;
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
    initializeTestModelicaJson();
  });

  it("Generates Options for literal types", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.elementList[0] as parser.InputGroup;

    // get elements that match literal types: Boolean, String, Real, Integer, Enum
    const templateOptions = template.getInputs();
    Object.values(templateOptions).map((o) => {
      if (o.type in parser.MODELICA_LITERALS) {
        expect(o.name).not.toBeFalsy();
        expect(o.modelicaPath).not.toBeFalsy();
      }
    });

    const uninitializedParamPath = `${template.modelicaPath}.test_string_uninitialized`;
    const initializedParamPath = `${template.modelicaPath}.test_string_initialized`;
    const expectedValue = "I'm all set";

    // check that when a parameter has an initial value it is set, when it is not it is null
    const unInitializedOption = templateOptions[uninitializedParamPath];
    expect(unInitializedOption?.value).toBeUndefined();
    const initializedOption = templateOptions[initializedParamPath];
    expect(initializedOption?.value).toEqual(expectedValue);

    // check that other literals are extracted to a good value
    const boolPath = `${template.modelicaPath}.nullable_bool`;
    expect(templateOptions[boolPath]?.value).toBe(false);

    const realNumPath = `${template.modelicaPath}.test_real`;
    expect(templateOptions[realNumPath]?.value).toBe(1);

    const intPath = `${template.modelicaPath}.test_int`;
    expect(templateOptions[intPath]?.value).toBe(2);
  });

  /*
  Literals can also be assigned expressions instead of a value.

  Check that instead of a value, the option has a value expression
  */
  it("Extracts literal value expression", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.elementList[0] as parser.InputGroup;
    const options = template.getInputs();
    const option = options[
      "TestPackage.Template.TestTemplate.expression_bool"
    ] as parser.TemplateInput;

    expect(option.value).toBeNull();
    expect(option.valueExpression).toBeTruthy();
  });

  it("Extracts 'choices'", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.elementList[0] as parser.InputGroup;
    const component = template.elementList.find(
      (e) => e.name === "selectable_component",
    ) as parser.Element;
    const options = component.getInputs({}, false);
    expect(Object.keys(options).length).toBe(1);
    const [option] = Object.values(options);
    expect(option.options?.length).toBe(2);
    const [choice1, choice2] = option.options as string[];
    expect(choice1).toBe("TestPackage.Component.SecondComponent");
    expect(choice2).toBe("TestPackage.Component.ThirdComponent");
  });

  it("Gets parameter UI info", () => {
    const expectedTab = "Tabby";
    const expectedGroup = "Groupy";
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.elementList[0] as parser.InputGroup;
    const options = template.getInputs();
    const option = options["TestPackage.Template.TestTemplate.nullable_bool"];
    expect(option?.group).toEqual(expectedGroup);
    expect(option?.tab).toEqual(expectedTab);
    expect(option?.enable).not.toBeFalsy();

    // also test a "constrainedby" component as this impacts where the annotation
    // is placed
    const selectablePath =
      "TestPackage.Template.TestTemplate.selectable_component";
    const selectableGroup = "Selectable Component";
    const selectable = options[selectablePath];
    expect(selectable?.group).toEqual(selectableGroup);
  });

  it("Set 'visible' parameter correctly", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.elementList[0] as parser.InputGroup;

    const options = template.getInputs();
    const option = options["TestPackage.Template.TestTemplate.should_ignore"];

    expect(option.visible).toBeFalsy();
  });

  it("Enums parameter returns the expected options", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.elementList[0] as parser.InputGroup;
    const expectedValues = ["Chocolate", "Vanilla", "Strawberry"];
    const parentPath = "TestPackage.Template.TestTemplate.typ";
    const element = template.elementList.find(
      (e) => e.modelicaPath === parentPath,
    ) as parser.Element;
    const options = element.getInputs();
    const enumOption = options[element.type];
    const parent = options[parentPath];

    expect(enumOption?.options?.length).toEqual(expectedValues?.length); // includes parent option
    expect(parent.options?.length).toEqual(expectedValues?.length);

    enumOption?.options?.map((o) => {
      expectedValues.splice(expectedValues.indexOf(o));
    });
    expect(expectedValues.length).toBe(0);

    enumOption?.options?.map((o) => {
      const childOption = options[o];
      expect(childOption?.visible).toBeFalsy();
    });
  });

  it("Extracts expected InputGroup options", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const inputGroup = file.elementList[0] as parser.InputGroup;
    const options = inputGroup.getInputs();
    const firstComponentOption =
      options["TestPackage.Template.TestTemplate.first"];

    expect(firstComponentOption.options?.length).toBe(2);
  });

  it("Extracts expected extend class options", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const inputGroup = file.elementList[0] as parser.InputGroup;
    const options = inputGroup.getInputs();
    const extendOptions = options["TestPackage.Template.TestTemplate.__extend"];
    const [childOption] = extendOptions.options as string[];
    const extendTypeOptions = options[childOption];
    expect(extendTypeOptions.options?.length).toBe(1);
  });

  it("All child options have valid option references", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.elementList[0] as parser.InputGroup;
    const options = template.getInputs();

    // debugging structure to track option generation
    // const optionCount: { [key: string]: number } = {};

    Object.values(options).map((o) => {
      const childOptions = o.options;
      if (childOptions) {
        childOptions.map((option) => {
          expect(option in options).toBeTruthy();
          // optionCount[option] = optionCount[option]
          //   ? optionCount[option] + 1
          //   : 1;
          // if (optionCount[option] > 1) {
          //   console.log(`${o.modelicaPath} - ${option}`);
          // }
        });
      }
    });
    // console.log(optionCount);
  });
});
