import RootStore from "../../src/data";
import { ConfigInterface } from "../../src/data/config";
import { TemplateInterface, OptionInterface } from "../../src/data/template";

import {
  applyPathModifiers,
  OperatorType,
  ConfigContext,
  resolveToValue,
  evaluate,
  resolvePaths,
} from "../../src/interpreter/interpreter";

// initialize global test dependencies
const store = new RootStore();
const mzTemplatePath = "Buildings.Templates.AirHandlersFans.VAVMultiZone";
const zoneTemplatePath = "Buildings.Templates.ZoneEquipment.VAVBoxCoolingOnly";
store.configStore.add({
  name: "VAVMultiZone Config",
  templatePath: mzTemplatePath,
});
store.configStore.add({
  name: "VAV Box Cooling Only",
  templatePath: zoneTemplatePath,
});
const allOptions: { [key: string]: OptionInterface } =
  store.templateStore.getAllOptions();
const allTemplates: { [key: string]: TemplateInterface } =
  store.templateStore.getAllTemplates();
const mzTemplate: TemplateInterface = allTemplates[mzTemplatePath];
const zoneTemplate = allTemplates[zoneTemplatePath];
const mzConfig = store.configStore.configs.find(
  (c) => c.templatePath === mzTemplatePath,
) as ConfigInterface;
const zoneConfig = store.configStore.configs.find(
  (c) => c.templatePath === zoneTemplatePath,
) as ConfigInterface;

const addNewConfig = (
  configName: string,
  template: TemplateInterface,
  selections: { [key: string]: string },
) => {
  store.configStore.add({
    name: configName,
    templatePath: template.modelicaPath,
  });

  const configWithSelections = store.configStore.configs.find(
    (c) => c.name === configName,
  ) as ConfigInterface;

  store.configStore.setSelections(configWithSelections.id, selections);

  return configWithSelections;
};

describe("Path Modifier tests", () => {
  it("Applies a path modifier", () => {
    const pathMods = {
      "lets.modify.this.path": "path",
    };
    const longPath = "lets.modify.this.path.changed";
    const modifiedPath = applyPathModifiers(longPath, pathMods);

    expect(modifiedPath).toBe("path.changed");
  });

  it("Correctly leaves paths along if not in the modifier", () => {
    const pathMods = {
      "test.an.inner.replacement": "inner.replacement",
    };
    const longPath = "test.an.unrelated.path";
    const modifiedPath = applyPathModifiers(longPath, pathMods);

    expect(modifiedPath).toBe(longPath);
  });
});

describe("Basic Context generation without selections", () => {
  it("Is able to construct a context", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
    );
  });
});

const buildExpression = (operator: OperatorType, operands: any[]) => {
  return { operator, operands };
};

const expressionContext = new ConfigContext(
  mzTemplate as TemplateInterface,
  mzConfig as ConfigInterface,
  allOptions,
);

describe("Simple resolveToValue tests (no type resolving/evaluation)", () => {
  it("Handles numbers", () => {
    const expectedValue = 4;
    const value = resolveToValue(4);
    expect(value).toEqual(expectedValue);
  });

  it("Handles strings", () => {
    const expectedValue = "Check it out";
    const value = resolveToValue(expectedValue);
    expect(value).toEqual(expectedValue);
  });

  it("Handles booleans", () => {
    const expectedValue = false;
    const value = resolveToValue(expectedValue);
    expect(value).toEqual(expectedValue);
  });
});

describe("Test set", () => {
  it("Simple expression evaluation without use of context", () => {
    const expectedValue = 1;
    const simpleExpression = buildExpression("none", [expectedValue]);
    const value = evaluate(simpleExpression);
    expect(value).toEqual(expectedValue);
  });

  it("Handles < and <= and > and >=", () => {
    expect(evaluate(buildExpression("<", [5, 4]))).toBeFalsy();
    expect(evaluate(buildExpression("<", [4, 5]))).toBeTruthy();
    expect(evaluate(buildExpression(">", [1, 2]))).toBeFalsy();
    expect(evaluate(buildExpression(">", [2, 1]))).toBeTruthy();
    expect(evaluate(buildExpression(">=", [2, 2]))).toBeTruthy();
    expect(evaluate(buildExpression(">=", [3, 2]))).toBeTruthy();
    expect(evaluate(buildExpression(">=", [1, 2]))).toBeFalsy();
    expect(evaluate(buildExpression("<=", [2, 2]))).toBeTruthy();
    expect(evaluate(buildExpression("<=", [4, 5]))).toBeTruthy();
    expect(evaluate(buildExpression("<=", [5, 4]))).toBeFalsy();
  });

  it("Handles == and !=", () => {
    // TODO: fix casting issues with comparator stuff...
    expect(evaluate(buildExpression("==", [1, 1, 1, 1]))).toBeTruthy();
    expect(evaluate(buildExpression("==", [3]))).toBeTruthy();
    expect(evaluate(buildExpression("==", ["a", "a", "a"]))).toBeTruthy();
    expect(evaluate(buildExpression("==", ["a", "a", "c"]))).toBeFalsy();
    expect(evaluate(buildExpression("!=", [1, 1, 2]))).toBeTruthy();
    expect(evaluate(buildExpression("!=", [1]))).toBeFalsy();
  });

  it("Handles if/else if/else if/else", () => {
    /** TODO */
  });
});

describe("Path resolution", () => {
  it("Maps an instance path to the original option path uneffected by selections, redeclares", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
    );

    const optionPath = resolvePaths("TAirRet.isDifPreSen", context);
    expect(optionPath).toEqual(
      "Buildings.Templates.Components.Interfaces.PartialSensor.isDifPreSen",
    );
  });

  it("Maps an instance path to an option path modified by in template redeclares", () => {
    const context = new ConfigContext(
      zoneTemplate as TemplateInterface,
      zoneConfig as ConfigInterface,
      allOptions,
    );

    const expectedPath =
      "Buildings.Templates.ZoneEquipment.Components.Controls.Interfaces.PartialController.typ";
    const optionPath = resolvePaths("ctl.typ", context);

    // TODO: need a better parameter...
    expect(optionPath).toBe(expectedPath);
  });
  it("Uses scope to find the correct option path", () => {});

  it("Maps an instance path to an option path modified by selections", () => {});
});

describe("resolveToValue tests using context and evaluation", () => {
  it("Handles fanSupBlo.typ", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
    );

    const expectedVal = "Buildings.Templates.Components.Types.Fan.None";
    const value = resolveToValue("fanSupBlo.typ", context);
    expect(value).toEqual(expectedVal);
  });

  it("Gets a value that interacts with a modifier redeclare and choice redeclare", () => {
    const instancePath = "coiHeaPre.val";
    const selections = {
      "Buildings.Templates.Components.Interfaces.PartialValve.val-coiHeaPre.val":
        "Buildings.Templates.Components.Valves.TwoWayModulating",
    };
    const config = addNewConfig(
      "Config to test Choice Modifiers and modifier redeclares",
      mzTemplate,
      selections,
    );
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      config as ConfigInterface,
      allOptions,
    );

    // TODO: this is the 'default' value so it is not testing choicemodifiers well
    const expectedVal =
      "Buildings.Templates.Components.Valves.TwoWayModulating";
    const val = context.getValue(instancePath);
    expect(val).toEqual(expectedVal);
  });
});

describe("Testing context getValue", () => {
  /**
   * This is a test of the simplist values to get, parameters at
   * the root of a template that are assigned a literal. This also tests
   * symbol resolution
   */
  it("Components (parameter that have a typoe of a class/model) that are not replaceables have no value assigned", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
    );

    // TODO: expected behavior for components that are not replaceables?
    // Currently returns an empty string
    const expectedVal = "";
    const val = context.getValue("TAirCoiCooLvg");
    expect(val).toEqual(expectedVal);
  });

  it("Fetches the correct value for a replaceable type without a selection made", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
    );

    const expectedVal = "Buildings.Templates.Components.Fans.None";
    const val = context.getValue("fanSupBlo");

    expect(val).toEqual(expectedVal);
  });

  it("Fetches the correct value for a replaceable type after a selection is made", () => {
    const configName = "VAVMultiZone Config with selections";
    const selections = {
      [`${mzTemplatePath}.fanSupBlo-fanSupBlo`]:
        "Buildings.Templates.Components.Fans.SingleVariable",
    };

    const configWithSelections = addNewConfig(
      configName,
      mzTemplate,
      selections,
    );

    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      configWithSelections as ConfigInterface,
      allOptions,
    );

    const expectedVal = "Buildings.Templates.Components.Fans.SingleVariable";
    const val = context.getValue("fanSupBlo");

    expect(val).toEqual(expectedVal);

    // check that nested types are also updated
    const expectedFanVal =
      "Buildings.Templates.Components.Types.Fan.SingleVariable";
    const fanVal = context.getValue("fanSupBlo.typ");
    expect(fanVal).toEqual(expectedFanVal);
  });

  it("Gets value on a component swapped by redeclare", () => {
    const context = new ConfigContext(
      zoneTemplate as TemplateInterface,
      zoneConfig as ConfigInterface,
      allOptions,
    );
    const expectedVal = "Buildings.Templates.Components.Coils.None";
    expect(context.getValue("coiHea")).toBe(expectedVal);
  });
});

describe("Display Enable is set as expected", () => {
  it("Sets enable correctly on simple parameter (no expression)", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
    );
  });

  it("Sets enable correctly on parameter with expression", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
    );

    const optionInstance = context.getOptionInstance("fanSupBlo");
    expect(optionInstance.display).toBeFalsy();

    const configName = "VAVMultiZone Config with fanSupDra selection";
    const selections = {
      [`${mzTemplatePath}.fanSupDra-fanSupDra`]:
        "Buildings.Templates.Components.Fans.None",
    };
    const configWithSelections = addNewConfig(
      configName,
      mzTemplate,
      selections,
    );

    // make a new context with a selection changing fanSupDra to 'None'
    const newContext = new ConfigContext(
      mzTemplate as TemplateInterface,
      configWithSelections as ConfigInterface,
      allOptions,
    );

    const updatedOptionInstance = newContext.getOptionInstance("fanSupBlo");
    expect(updatedOptionInstance.display).toBeTruthy();
  });

  it("Sets ctl.have_CO2Sen param to true", () => {
    // make a new context with a selection changing fanSupDra to 'None'
    const newContext = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
    );

    // TODO: this test is still failing as it is falling back to the original
    // option expression in Components.Controls.Interfaces.PartialVAVMultiZone
    // I believe operands are not being found because 'scope' is not getting passed
    // into the expression. Getting this expression to work will mean getting
    // scope integrated. This is a good test case!
    const optionInstance = newContext.getOptionInstance("ctl.have_CO2Sen");
    expect(optionInstance.display).toBeTruthy();
  });
});

// describe("Display Option Generation", () => {
//   it("Has the expected numer of initial visible options", () => {
//     const context = new ConfigContext(
//       mzTemplate as TemplateInterface,
//       mzConfig as ConfigInterface,
//       allOptions,
//     );
//   });
// });
