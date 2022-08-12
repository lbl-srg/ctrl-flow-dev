import * as parser from "../../../src/parser/parser";
import { initializeTestModelicaJson } from "./utils";
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

    const input = dat.getInputs()[expectedPath];

    expect(input.inputs).toBeTruthy();
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

describe("Expected Inputs are extracted", () => {
  beforeAll(() => {
    initializeTestModelicaJson();
  });

  it("Generates Inputs for literal types", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.elementList[0] as parser.InputGroup;

    // get elements that match literal types: Boolean, String, Real, Integer, Enum
    const templateInputs = template.getInputs();
    Object.values(templateInputs).map((o) => {
      if (o.type in parser.MODELICA_LITERALS) {
        expect(o.name).not.toBeFalsy();
        expect(o.modelicaPath).not.toBeFalsy();
      }
    });

    const uninitializedParamPath = `${template.modelicaPath}.test_string_uninitialized`;
    const initializedParamPath = `${template.modelicaPath}.test_string_initialized`;
    const expectedValue = "I'm all set";

    // check that when a parameter has an initial value it is set, when it is not it is null
    const unInitializedInput = templateInputs[uninitializedParamPath];
    expect(unInitializedInput?.value).toBeUndefined();
    const initializedInput = templateInputs[initializedParamPath];
    expect(initializedInput?.value).toEqual(expectedValue);

    // check that other literals are extracted to a good value
    const boolPath = `${template.modelicaPath}.nullable_bool`;
    expect(templateInputs[boolPath]?.value).toBe(false);

    const realNumPath = `${template.modelicaPath}.test_real`;
    expect(templateInputs[realNumPath]?.value).toBe(1);

    const intPath = `${template.modelicaPath}.test_int`;
    expect(templateInputs[intPath]?.value).toBe(2);
  });

  /*
  Literals can also be assigned expressions instead of a value.

  Check that instead of a value, the option has a value expression
  */
  it("Extracts literal value expression", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.elementList[0] as parser.InputGroup;
    const inputs = template.getInputs();
    const input = inputs[
      "TestPackage.Template.TestTemplate.expression_bool"
    ] as parser.TemplateInput;

    expect(input.value).toBeTruthy();
  });

  it("Extracts 'choices'", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.elementList[0] as parser.InputGroup;
    const component = template.elementList.find(
      (e) => e.name === "selectable_component",
    ) as parser.Element;
    const inputs = component.getInputs({}, false);
    expect(Object.keys(inputs).length).toBe(1);
    const [input] = Object.values(inputs);
    expect(input.inputs?.length).toBe(2);
    const [choice1, choice2] = input.inputs as string[];
    expect(choice1).toBe("TestPackage.Component.SecondComponent");
    expect(choice2).toBe("TestPackage.Component.ThirdComponent");
  });

  it("Gets parameter UI info", () => {
    const expectedTab = "Tabby";
    const expectedGroup = "Groupy";
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.elementList[0] as parser.InputGroup;
    const inputs = template.getInputs();
    const input = inputs["TestPackage.Template.TestTemplate.nullable_bool"];
    expect(input?.group).toEqual(expectedGroup);
    expect(input?.tab).toEqual(expectedTab);
    expect(input?.enable).not.toBeFalsy();

    // also test a "constrainedby" component as this impacts where the annotation
    // is placed
    const selectablePath =
      "TestPackage.Template.TestTemplate.selectable_component";
    const selectableGroup = "Selectable Component";
    const selectable = inputs[selectablePath];
    expect(selectable?.group).toEqual(selectableGroup);
  });

  it("Set 'visible' parameter correctly", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.elementList[0] as parser.InputGroup;

    const inputs = template.getInputs();
    const input = inputs["TestPackage.Template.TestTemplate.should_ignore"];

    expect(input.visible).toBeFalsy();
  });

  it("Enums parameter returns the expected inputs", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.elementList[0] as parser.InputGroup;
    const expectedValues = ["Chocolate", "Vanilla", "Strawberry"];
    const parentPath = "TestPackage.Template.TestTemplate.typ";
    const element = template.elementList.find(
      (e) => e.modelicaPath === parentPath,
    ) as parser.Element;
    const inputs = element.getInputs();
    const enumInput = inputs[element.type];
    const parent = inputs[parentPath];

    expect(enumInput?.inputs?.length).toEqual(expectedValues?.length);
    expect(parent.inputs?.length).toEqual(expectedValues?.length);

    enumInput?.inputs?.map((o) => {
      expectedValues.splice(expectedValues.indexOf(o));
    });
    expect(expectedValues.length).toBe(0);

    enumInput?.inputs?.map((o) => {
      const childInput = inputs[o];
      expect(childInput?.visible).toBeFalsy();
    });
  });

  it("Extracts expected InputGroup inputs", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const inputGroup = file.elementList[0] as parser.InputGroup;
    const inputs = inputGroup.getInputs();
    const firstComponentInput =
      inputs["TestPackage.Template.TestTemplate.first"];

    expect(firstComponentInput.inputs?.length).toBe(2);
  });

  it("Extracts expected extend class inputs", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const inputGroup = file.elementList[0] as parser.InputGroup;
    const inputs = inputGroup.getInputs();
    const extendInputs = inputs["TestPackage.Template.TestTemplate.__extend"];
    const [childInput] = extendInputs.inputs as string[];
    const extendTypeInputs = inputs[childInput];
    expect(extendTypeInputs.inputs?.length).toBe(1);
  });

  it("All child inputs have valid input references", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const template = file.elementList[0] as parser.InputGroup;
    const inputs = template.getInputs();

    // debugging structure to track input generation
    // const inputCound: { [key: string]: number } = {};

    Object.values(inputs).map((i) => {
      const childInputs = i.inputs;
      if (childInputs) {
        childInputs.map((input) => {
          expect(input in inputs).toBeTruthy();
          // inputCound[input] = inputCount[input]
          //   ? inputCound[input] + 1
          //   : 1;
          // if (inputCound[input] > 1) {
          //   console.log(`${i.modelicaPath} - ${input}`);
          // }
        });
      }
    });
    // console.log(inputCount);
  });
});
