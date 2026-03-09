import RootStore from "../../src/data";
import { ConfigInterface } from "../../src/data/config";
import { ConfigValues } from "../../src/utils/modifier-helpers";
import { TemplateInterface, OptionInterface } from "../../src/data/template";
import { extractSimpleDisplayList } from "../../src/utils/utils";
import {
  FlatConfigOption,
  FlatConfigOptionGroup,
} from "../../src/interpreter/display-option";

import {
  applyPathModifiers,
  buildMods,
  OperatorType,
  ConfigContext,
  resolveToValue,
  evaluate,
  resolvePaths,
  OptionInstance,
  evaluateModifier,
  constructSelectionPath,
} from "../../src/interpreter/interpreter";

import {
  mapToDisplayOptions,
  _formatDisplayOption,
  _formatDisplayGroup,
  _formatDisplayItem,
} from "../../src/interpreter/display-option";

// initialize global test dependencies
const store = new RootStore();
const projectSelections = {
  "Buildings.Templates.Data.AllSystems.stdEne":
    "Buildings.Controls.OBC.ASHRAE.G36.Types.EnergyStandard.ASHRAE90_1",
  "Buildings.Templates.Data.AllSystems.stdVen":
    "Buildings.Controls.OBC.ASHRAE.G36.Types.VentilationStandard.California_Title_24",
  "Buildings.Templates.Data.AllSystems.ashCliZon":
    "Buildings.Controls.OBC.ASHRAE.G36.Types.ASHRAEClimateZone.Zone_1B",
};

const mzTemplatePath = "Buildings.Templates.AirHandlersFans.VAVMultiZone";
const zoneTemplatePath = "Buildings.Templates.ZoneEquipment.VAVBoxCoolingOnly";
const zoneReheatTemplatePath = "Buildings.Templates.ZoneEquipment.VAVBoxReheat";
const allOptions: { [key: string]: OptionInterface } =
  store.templateStore.getAllOptions();
const allTemplates: { [key: string]: TemplateInterface } =
  store.templateStore.getAllTemplates();
const mzTemplate: TemplateInterface = allTemplates[mzTemplatePath];
const zoneTemplate = allTemplates[zoneTemplatePath];
const zoneReheatTemplate = allTemplates[zoneReheatTemplatePath];

const createSelections = (selections: ConfigValues = {}) => {
  return {
    ...projectSelections,
    ...selections,
  };
};

const addNewConfig = (
  configName: string,
  template: TemplateInterface,
  selections: ConfigValues,
) => {
  store.configStore.add({
    name: configName,
    templatePath: template.modelicaPath,
  });

  const configWithSelections = store.configStore.configs.find(
    (c) => c.name === configName,
  ) as ConfigInterface;

  const selectionsWithProjectSelections = createSelections(selections);

  store.configStore.setSelections(
    configWithSelections.id,
    selectionsWithProjectSelections,
  );

  return configWithSelections;
};

const mzConfig = addNewConfig("VAVMultiZone Config", mzTemplate, {});
const zoneConfig = addNewConfig("VAV Box Cooling Only", zoneTemplate, {});
const zoneReheatConfig = addNewConfig("VAV Box Reheat", zoneReheatTemplate, {});

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

describe("Modifiers", () => {
  it("Sets the correct value for a redeclared type", () => {
    const context = new ConfigContext(
      zoneTemplate as TemplateInterface,
      zoneConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );

    const path = "coiHea";
    const mod = context.mods[path];
    expect(evaluateModifier(mod, context)).toEqual(
      "Buildings.Templates.Components.Coils.None",
    );
  });

  it("Sets the correct value for a choiceModifier value", () => {
    const context = new ConfigContext(
      zoneTemplate as TemplateInterface,
      zoneConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );

    const path = "typ";
    const mod = context.mods[path];
    expect(evaluateModifier(mod, context)).toEqual(
      "Buildings.Templates.ZoneEquipment.Types.Configuration.VAVBoxCoolingOnly",
    );
  });

  it("Handles modifier redeclares", () => {
    const boxReheat = "Buildings.Templates.ZoneEquipment.VAVBoxReheat";
    const testPath = "have_souChiWat";
    const zoneOption = allOptions[boxReheat];
    const mods = buildMods(zoneOption, {}, allOptions);

    const mod = mods[testPath];
    expect(mod).toBeDefined();
    expect(mod?.final).toBeTruthy();
  });

  it("Adds coiCoo.val to modifiers", () => {
    const mzOption = allOptions[mzTemplatePath];
    const selections = {
      "Buildings.Templates.AirHandlersFans.VAVMultiZone.coiCoo-coiCoo":
        "Buildings.Templates.Components.Coils.WaterBasedCooling",
    };
    const mods = buildMods(mzOption, selections, allOptions);
    const coiCooPath = "coiCoo.typVal";

    expect(coiCooPath in mods).toBeTruthy();
    const coiCooMod = mods[coiCooPath];
    expect(coiCooMod.final).toBeTruthy();
  });
});

const buildExpression = (operator: OperatorType, operands: any[]) => {
  return { operator, operands };
};

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

  it("Handles !", () => {
    expect(evaluate(buildExpression("!", [true]))).toBeFalsy();
    expect(evaluate(buildExpression("!", [buildExpression(">=", [2, 3])]))).toBeTruthy();
  });

  it("Handles == and !=", () => {
    expect(evaluate(buildExpression("==", [1, 1, 1, 1]))).toBeTruthy();
    expect(evaluate(buildExpression("==", [3]))).toBeTruthy();
    expect(evaluate(buildExpression("==", ["a", "a", "a"]))).toBeTruthy();
    expect(evaluate(buildExpression("==", ["a", "a", "c"]))).toBeFalsy();
    expect(evaluate(buildExpression("!=", [1, 1, 2]))).toBeTruthy();
    expect(evaluate(buildExpression("!=", [1]))).toBeFalsy();
  });

  it("Handles if expression", () => {
    const expressionTrue = buildExpression("==", [1, 1]);
    const expressionFalse = buildExpression("==", [1, 2]);
    const ifValue = "if value returned";
    const elseIfValue = "elseif value returned";
    const elseValue = "else value returned";

    const AllTrueExpression = {
      operator: "if_elseif",
      operands: [
        {
          operator: "if",
          operands: [expressionTrue, ifValue],
        },
        {
          operator: "else_if",
          operands: [expressionTrue, elseIfValue],
        },
        {
          operator: "else",
          operands: [elseValue],
        },
      ],
    };

    const IfTrueExpression = {
      operator: "if_elseif",
      operands: [
        {
          operator: "if",
          operands: [expressionTrue, ifValue],
        },
        {
          operator: "else_if",
          operands: [expressionFalse, elseIfValue],
        },
        {
          operator: "else",
          operands: [elseValue],
        },
      ],
    };

    const ElseIfTrueExpression = {
      operator: "if_elseif",
      operands: [
        {
          operator: "if",
          operands: [expressionFalse, ifValue],
        },
        {
          operator: "else_if",
          operands: [expressionTrue, elseIfValue],
        },
        {
          operator: "else",
          operands: [elseValue],
        },
      ],
    };

    const ElseTrueExpression = {
      operator: "if_elseif",
      operands: [
        {
          operator: "if",
          operands: [expressionFalse, ifValue],
        },
        {
          operator: "else_if",
          operands: [expressionFalse, elseIfValue],
        },
        {
          operator: "else",
          operands: [elseValue],
        },
      ],
    };

    const evaluatedAllTrueValue = evaluate(AllTrueExpression);
    expect(evaluatedAllTrueValue).toEqual(ifValue);
    const evaluatedIfTrueValue = evaluate(IfTrueExpression);
    expect(evaluatedIfTrueValue).toEqual(ifValue);
    const evaluatedElseIfTrueValue = evaluate(ElseIfTrueExpression);
    expect(evaluatedElseIfTrueValue).toEqual(elseIfValue);
    const evaluatedElseTrueValue = evaluate(ElseTrueExpression);
    expect(evaluatedElseTrueValue).toEqual(elseValue);
  });
});

describe("Path resolution", () => {
  it("Maps an instance path to the original option path uneffected by selections, redeclares", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );

    const { optionPath } = resolvePaths("TAirRet.isDifPreSen", context);
    expect(optionPath).toEqual(
      "Buildings.Templates.Components.Interfaces.PartialSensor.isDifPreSen",
    );
  });

  it("Maps an instance path to an option path modified by in template redeclares", () => {
    const context = new ConfigContext(
      zoneTemplate as TemplateInterface,
      zoneConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );

    const expectedPath =
      "Buildings.Templates.ZoneEquipment.Components.Interfaces.PartialController.typ";
    const { optionPath } = resolvePaths("ctl.typ", context);

    // TODO: need a better parameter...
    expect(optionPath).toBe(expectedPath);
  });

  it("Returns the outerOptionPath if present", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );

    const { optionPath, instancePath, outerOptionPath } = resolvePaths(
      "ctl.coiCoo",
      context,
    );
    expect(optionPath).toBe(
      "Buildings.Templates.AirHandlersFans.VAVMultiZone.coiCoo",
    );
    expect(outerOptionPath).toBe(
      "Buildings.Templates.AirHandlersFans.Components.Interfaces.PartialControllerVAVMultizone.coiCoo",
    );

    expect(instancePath).toBe("coiCoo");
  });

  it("Resolves secOutRel.secOut.dat.damOut.m_flow_nominal", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );

    const expression = buildExpression("none", [
      "Buildings.Templates.AirHandlersFans.Components.Interfaces.PartialOutdoorReliefReturnSection.dat",
    ]);
    evaluate(expression);

    const { optionPath } = resolvePaths(
      "secOutRel.secOut.dat.damOut.m_flow_nominal",
      context,
    );

    expect(optionPath).toBeDefined();
  });

  /**
   * 'typ' has a redeclare modifier assigned
   */
  it("Gets typ", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );

    const path = "typ";
    const { optionPath } = resolvePaths(path, context);
    expect(optionPath).toEqual(
      "Buildings.Templates.AirHandlersFans.Interfaces.PartialAirHandler.typ",
    );
  });

  /**
   * Gracefully handles a null reference
   *
   * fanRet has no link to 'dat' as it is marked as
   * __ctrlFlow enable === false
   */
  it("Gracefully handle secOutRel.secRel.fanRet.dat.nFan resolving as null", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
    );

    const { optionPath } = resolvePaths(
      "secOutRel.secRel.fanRet.dat.nFan",
      context,
    );
  });

  it("Handles a 'datAll' path correctly", () => {});
});

describe("resolveToValue tests using context and evaluation", () => {
  it("Handles boolean selections via context", () => {
    let config = addNewConfig(
      "Config with false boolean selection",
      mzTemplate,
      createSelections({
        "Buildings.Templates.AirHandlersFans.VAVMultiZone.have_senPreBui-have_senPreBui": false,
      }),
    );
    let context = new ConfigContext(
      mzTemplate as TemplateInterface,
      config as ConfigInterface,
      allOptions,
      config.selections as ConfigValues,
    );
    expect(resolveToValue("have_senPreBui", context)).toBe(false);
    config = addNewConfig(
      "Config with true boolean selection",
      mzTemplate,
      createSelections({
        "Buildings.Templates.AirHandlersFans.VAVMultiZone.have_senPreBui-have_senPreBui": true,
      }),
    );
    context = new ConfigContext(
      mzTemplate as TemplateInterface,
      config as ConfigInterface,
      allOptions,
      config.selections as ConfigValues,
    );
    expect(resolveToValue("have_senPreBui", context)).toBe(true);
  });

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
    const instancePath = "secOutRel.secRel.fanRet";
    const selections = {
      "Buildings.Templates.AirHandlersFans.Components.ReliefReturnSection.ReturnFan.fanRet-secOutRel.secRel.fanRet":
        "Buildings.Templates.Components.Fans.ArrayVariable",
    };
    const config = addNewConfig(
      "Config to test Choice Modifiers and modifier redeclares",
      mzTemplate,
      createSelections(selections),
    );
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      config as ConfigInterface,
      allOptions,
      config.selections as ConfigValues,
    );

    const expectedVal = "Buildings.Templates.Components.Fans.ArrayVariable";
    const val = context.getValue(instancePath);
    expect(val).toEqual(expectedVal);
  });
});

describe("Testing context getValue", () => {
  it("Components that have a type of a class/model have no value assigned", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
    );

    const val = context.getValue("TAirCoiCooLvg");
    expect(val).toBeUndefined();
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
      selections,
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

  it("Gets ctl.typFanSup", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
    );

    const path = "ctl.typFanSup";
    const optionInstance = context.getOptionInstance(path);
  });

  it("Evaluates the expression at mod secOutRel.secOut.dat", () => {
    const context = new ConfigContext(
      zoneTemplate as TemplateInterface,
      zoneConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );
    const evaluatedValues = context.getEvaluatedValues();
    expect("coiHea" in evaluatedValues);
  });
});

/**
 * This is a test of the ctl.haveCO2Sen enable expression
 *
 * The expression is broken into its separate tests for each operand as
 * well as components of each operand
 */
describe("ctl.have_CO2Sen enable expression", () => {
  it("First operand", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
    );

    const ctlTypeValue = context.getValue("typ", "ctl");
    expect(ctlTypeValue).toEqual(
      "Buildings.Templates.AirHandlersFans.Types.Controller.G36VAVMultiZone",
    );

    const firstOperand = {
      operator: "==",
      operands: [
        "Buildings.Templates.AirHandlersFans.Components.Interfaces.PartialController.typ",
        "Buildings.Templates.AirHandlersFans.Types.Controller.G36VAVMultiZone",
      ],
    };

    const firstVal = evaluate(firstOperand, context, "ctl");
    expect(firstVal).toBeTruthy();
  });

  it("typSecOut in ctl - a modifier updated by a selection", () => {
    const secOutValue =
      "Buildings.Templates.AirHandlersFans.Components.OutdoorSection.DedicatedDampersAirflow";

    const selections = {
      "Buildings.Templates.AirHandlersFans.Components.OutdoorReliefReturnSection.MixedAirWithDamper.secOut-secOutRel.secOut":
        secOutValue,
    };
    const configWithSecOut = addNewConfig(
      "Another Config With secOut selected",
      mzTemplate,
      selections,
    );

    const newContext = new ConfigContext(
      mzTemplate as TemplateInterface,
      configWithSecOut,
      allOptions,
      createSelections(selections),
    );

    const secOutTyp = newContext.getValue("secOut.typ", "secOutRel");
    expect(secOutTyp).toBeDefined();
    // To get this value, the following links are followed:
    // ctl.typSecOut -> secOutRel.typSecOut -> secOutRel.secOut.typ -> <secOut selection>.typ
    const typSecOut = newContext.getValue("typSecOut", "ctl"); // secOutRel.typSecOut -> secOut.typ
    expect(typSecOut).toEqual(
      "Buildings.Controls.OBC.ASHRAE.G36.Types.OutdoorAirSection.DedicatedDampersAirflow",
    );
  });

  it("Second operand", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );

    const secondOperand = {
      operator: "==",
      operands: [
        "Buildings.Templates.AirHandlersFans.Components.Interfaces.PartialControllerVAVMultizone.typSecOut",
        "Buildings.Controls.OBC.ASHRAE.G36.Types.OutdoorAirSection.DedicatedDampersPressure",
      ],
    };
    let secOutRelTypSecOut = context.getValue("secOutRel.typSecOut", "ctl");
    let typSecOut = context.getValue("typSecOut", "ctl"); // ctl.typSecOut = secOutRel.typSecout
    expect(typSecOut).toEqual(
      "Buildings.Controls.OBC.ASHRAE.G36.Types.OutdoorAirSection.SingleDamper",
    );

    let secondEvaluation = evaluate(secondOperand, context, "ctl");
    expect(secondEvaluation).toBeFalsy();

    // make a context after selection for DedicatedDampersPressure for secOut
    const selections = {
      "Buildings.Templates.AirHandlersFans.Components.OutdoorReliefReturnSection.MixedAirWithDamper.secOut-secOutRel.secOut":
        "Buildings.Templates.AirHandlersFans.Components.OutdoorSection.DedicatedDampersAirflow",
    };

    const configWithSecOut = addNewConfig(
      "Config With secOut selected",
      mzTemplate,
      selections,
    );

    const newContext = new ConfigContext(
      mzTemplate as TemplateInterface,
      configWithSecOut,
      allOptions,
      createSelections(selections),
    );

    secOutRelTypSecOut = newContext.getValue("secOutRel.typSecOut", "ctl");
    typSecOut = newContext.getValue("typSecOut", "ctl"); // ctl.typSecOut = secOutRel.typSecout
    expect(typSecOut).toEqual(
      "Buildings.Controls.OBC.ASHRAE.G36.Types.OutdoorAirSection.DedicatedDampersAirflow",
    );

    secondEvaluation = evaluate(secondOperand, newContext, "ctl");
    expect(secondEvaluation).toBeFalsy();
  });

  it("Third Operand - includes a datAll param", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );

    const stdVenValue =
      "Buildings.Controls.OBC.ASHRAE.G36.Types.VentilationStandard.California_Title_24";

    const thirdOperand = {
      operator: "==",
      operands: [
        "Buildings.Templates.AirHandlersFans.Components.Interfaces.PartialControllerVAVMultizone.stdVen",
        stdVenValue,
      ],
    };

    const stdVen = context.getValue("ctl.stdVen");
    expect(stdVen).toEqual(
      "Buildings.Controls.OBC.ASHRAE.G36.Types.VentilationStandard.California_Title_24",
    );

    const thirdEvaluation = evaluate(thirdOperand, context);
    expect(thirdEvaluation).toBeTruthy();
  });
});

describe("Scope tests", () => {
  it("Gets value for ctl.typSecOut", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );

    // falls back to original
    let typSecOut = context.getValue("ctl.typSecOut"); // ctl.typSecOut = secOutRel.typSecOut
    expect(typSecOut).toEqual(
      "Buildings.Controls.OBC.ASHRAE.G36.Types.OutdoorAirSection.SingleDamper",
    );
  });

  it("Evaluates the expression at mod secOutRel.secOut.dat", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );
    const path = "secOutRel.secOut.dat"; // secOut.dat = dat
    const val = evaluate(context.mods[path]?.expression, context, "secOutRel");
    expect(val).toEqual(undefined);
  });

  it("Able to resolve secOutRel.secOut.dat without going into an infinite loop due to bad scope", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );
    const path = "secOutRel.secOut.dat";
    const expectedVal =
      "Buildings.Templates.AirHandlersFans.Components.Data.OutdoorReliefReturnSection";
    // test path resolution of original secOutRel.secOut.dat
    const { optionPath, instancePath } = resolvePaths(path, context, "");
    const originalParamDefinition =
      "Buildings.Templates.AirHandlersFans.Components.Interfaces.PartialOutdoorSection.dat";
    expect(optionPath).toEqual(originalParamDefinition);
    expect(path).toEqual(instancePath); // instance path should not change
    // test modifier value
    // modifier points to the correct parameter definition (secOutRel.dat location)
    expect(context.mods["secOutRel.secOut.dat"].expression.operands[0]).toEqual(
      "Buildings.Templates.AirHandlersFans.Components.Interfaces.PartialOutdoorReliefReturnSection.dat",
    );

    // scope is wrong when we attempt to get value
    // we get a modifier that has a scope baked in. Do we need to know where the modifier is from to evaluate it?
    const val = context.getValue("secOutRel.secOut.dat");
  });
});

describe("Display Enable is set as expected", () => {
  it("Sets enable correctly on parameter with expression", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );

    const optionInstance = context.getOptionInstance("fanSupBlo");
    expect(optionInstance?.display).toBeFalsy();

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
      createSelections(selections),
    );

    const updatedOptionInstance = newContext.getOptionInstance("fanSupBlo");
    expect(updatedOptionInstance?.display).toBeTruthy();
  });

  it("Sets ctl.have_CO2Sen param to true", () => {
    const selections = {
      "Buildings.Templates.AirHandlersFans.Components.OutdoorReliefReturnSection.MixedAirWithDamper.secOut-secOutRel.secOut":
        "Buildings.Templates.AirHandlersFans.Components.OutdoorSection.DedicatedDampersPressure",
    };

    const configWithSecOut = addNewConfig(
      "Config With secOut selected",
      mzTemplate,
      selections,
    );

    const newContext = new ConfigContext(
      mzTemplate as TemplateInterface,
      configWithSecOut,
      allOptions,
      createSelections(selections),
    );

    const optionInstance = newContext.getOptionInstance("ctl.have_CO2Sen");
    expect(optionInstance?.display).toBeTruthy();
  });

  it("ctl.have_winSen returns an enabled control", () => {
    const context = new ConfigContext(
      zoneTemplate as TemplateInterface,
      zoneConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );

    const haveWinSen = context.getOptionInstance(
      "ctl.have_winSen",
    ) as OptionInstance;
    expect(haveWinSen.display).toBeTruthy();
  });
});

describe("Valid selection", () => {
  it("Returns an invalid selection", () => {
    // you should NOT be able to select secOutRel.secRel.fanRel if a ReliefDamper is specified for secOutRel.secRel
    const selections = {
      "Buildings.Templates.AirHandlersFans.Components.OutdoorReliefReturnSection.MixedAirWithDamper.secRel-secOutRel.secRel":
        "Buildings.Templates.AirHandlersFans.Components.ReliefReturnSection.ReliefDamper",
      "Buildings.Templates.AirHandlersFans.Components.ReliefReturnSection.ReliefFan.fanRel-secOutRel.secRel.fanRel":
        "Buildings.Templates.Components.Fans.ArrayVariable",
    };

    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      createSelections(selections),
    );

    expect(
      context.isValidSelection(
        "Buildings.Templates.AirHandlersFans.Components.ReliefReturnSection.ReliefFan.fanRel-secOutRel.secRel.fanRel",
      ),
    ).toEqual(false);
  });

  it("Returns an valid selection", () => {
    // you SHOULD be able to select secOutRel.secRel.fanRel if a ReliefDamper is specified for secOutRel.secRel
    const selections = {
      "Buildings.Templates.AirHandlersFans.Components.OutdoorReliefReturnSection.MixedAirWithDamper.secRel-secOutRel.secRel":
        "Buildings.Templates.AirHandlersFans.Components.ReliefReturnSection.ReliefFan",
      "Buildings.Templates.AirHandlersFans.Components.ReliefReturnSection.ReliefFan.fanRel-secOutRel.secRel.fanRel":
        "Buildings.Templates.Components.Fans.ArrayVariable",
    };

    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      createSelections(selections),
    );

    expect(
      context.isValidSelection(
        "Buildings.Templates.AirHandlersFans.Components.ReliefReturnSection.ReliefFan.fanRel-secOutRel.secRel.fanRel",
      ),
    ).toEqual(true);
  });

  it("Handles AllSystem paths", () => {
    const selections = {
      "Buildings.Templates.Data.AllSystems.ashCliZon":
        "Buildings.Controls.OBC.ASHRAE.G36.Types.ASHRAEClimateZone.Zone_1A",
    };

    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      createSelections(selections),
    );

    expect(
      context.isValidSelection("Buildings.Templates.Data.AllSystems.ashCliZon"),
    ).toEqual(true);
  });
});

describe("Display Option and Display Group Generation", () => {
  it("Generates Boolean DisplayOption for ctl.have_perZonRehBox", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );

    const have_perZonRehBoxPath = "ctl.have_perZonRehBox";
    const optionInstance = context.getOptionInstance(have_perZonRehBoxPath);

    expect(optionInstance?.display).toBeTruthy();
    expect(optionInstance?.instancePath).toBe(have_perZonRehBoxPath);
    const parent = context.getOptionInstance("ctl");
    const displayOption = _formatDisplayOption(
      optionInstance as OptionInstance,
      parent?.option.modelicaPath as string,
      context,
    );

    expect(displayOption).toBeDefined();
    expect(displayOption.selectionType).toEqual("Boolean");
    expect(displayOption.modelicaPath).toEqual(
      optionInstance?.option?.modelicaPath,
    );
    expect(displayOption.value).toEqual(false.toString());
  });

  it("Generates a normal DisplayOption", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
    );
    const optionInstance = context.getOptionInstance("secOutRel.secOut");
    const parentInstance = context.getOptionInstance("secOutRel");

    const displayOption = _formatDisplayOption(
      optionInstance as OptionInstance,
      parentInstance?.option.modelicaPath as string,
      context,
    );

    expect(displayOption.name).toEqual(optionInstance?.option.name);
    expect(displayOption.value).toEqual(
      "Buildings.Templates.AirHandlersFans.Components.OutdoorSection.SingleDamper",
    );

    const expectedChoicePaths = {
      "Buildings.Templates.AirHandlersFans.Components.OutdoorSection.SingleDamper":
        null,
      "Buildings.Templates.AirHandlersFans.Components.OutdoorSection.DedicatedDampersAirflow":
        null,
      "Buildings.Templates.AirHandlersFans.Components.OutdoorSection.DedicatedDampersPressure":
        null,
    };

    displayOption.choices?.map((c) =>
      expect(c.modelicaPath in expectedChoicePaths).toBeTruthy(),
    );
  });

  it("Generates the correct type for an enum when using _displayItem", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
    );

    const enumInstance = context.getOptionInstance(
      "secOutRel.secOut.typ",
    ) as OptionInstance;
    expect(enumInstance?.value).toEqual(
      "Buildings.Controls.OBC.ASHRAE.G36.Types.OutdoorAirSection.SingleDamper",
    );
    const parentInstance = context.getOptionInstance("secOutRel.secOut");
    const displayItems = _formatDisplayItem(
      enumInstance as OptionInstance,
      parentInstance?.option.modelicaPath as string,
      context,
    );

    expect(displayItems.length).toEqual(0);

    enumInstance.display = true; // for testing, forcing this to true

    const updatedDisplayItems = _formatDisplayItem(
      enumInstance as OptionInstance,
      parentInstance?.option.modelicaPath as string,
      context,
    );

    expect(updatedDisplayItems.length).toEqual(1);
  });

  it("Generates a display group", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );
    // get secOutRel type
    const secOutRel = context.getOptionInstance("secOutRel");
    const secOutRelType = secOutRel?.option.type as string;
    const secOutRelTypeOption = context.options[secOutRelType];

    const displayGroup = _formatDisplayGroup(
      secOutRelTypeOption,
      secOutRel as OptionInstance,
      context,
    );

    const items = displayGroup?.items as (
      | FlatConfigOptionGroup
      | FlatConfigOption
    )[];

    expect(displayGroup?.groupName).toBe(secOutRel?.option.name);
    expect(displayGroup?.items.length).toBeGreaterThan(0);
  });

  it("Generates a display group and display options for Multizone Template", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      {},
    );

    const displayOptions = mapToDisplayOptions(context);
    expect(displayOptions).toBeDefined();
  });

  // TODO: may need ctrlFlow annotation for this
  it("Hides params with outer designation", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );

    const coiCoo = context.getOptionInstance("ctl.coiCoo") as OptionInstance;
    expect(coiCoo.display).toBeFalsy();
    const { optionPath } = resolvePaths("ctl", context);
    const items = _formatDisplayItem(coiCoo, optionPath as string, context);
    expect(items.length).toEqual(0);
  });

  it("Generates a display group and display options for VAVBox Cooling Only Template", () => {
    const context = new ConfigContext(
      zoneTemplate as TemplateInterface,
      zoneConfig as ConfigInterface,
      allOptions,
      createSelections(),
    );

    const coiHea = context.getOptionInstance("coiHea") as OptionInstance;
    expect(coiHea.display).toBeFalsy();

    const ctl = context.getOptionInstance("ctl") as OptionInstance;
    const ctlDisplayOptions = _formatDisplayItem(
      ctl,
      zoneTemplate.modelicaPath,
      context,
    );

    expect(ctlDisplayOptions.length).toBeGreaterThan(0);

    const displayOptions = mapToDisplayOptions(context);
    expect(displayOptions.length).toBeGreaterThan(0);
  });
});

describe("Specific parameter debugging", () => {
  it("Visits coiHea", () => {
    const context = new ConfigContext(
      zoneReheatTemplate as TemplateInterface,
      zoneReheatConfig as ConfigInterface,
      allOptions,
      {},
    );

    // load display options resolve values
    const displayOptions = mapToDisplayOptions(context);
    const instancePath = "coiHea";
    const evaluatedValues = context.getEvaluatedValues();
    const optionInstance = context.getOptionInstance(instancePath);
    const selectionPath = constructSelectionPath(
      optionInstance?.option.modelicaPath as string,
      instancePath,
    );
    expect(selectionPath in evaluatedValues).toBeTruthy();
  });

  it("Able to make mzConfig evaluated values", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      {},
    );
  });

  it("secOutRel.secOut.damOut has undefined value and is excluded from evaluatedValues", () => {
    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      mzConfig as ConfigInterface,
      allOptions,
      {},
    );

    const path = "secOutRel.secOut.damOut";
    // fill in cache by generating display options
    const displayOptions = mapToDisplayOptions(context);
    // With no binding, value is undefined and not added to _resolvedValues cache
    expect(context._resolvedValues[path]).toBeUndefined();
    const optionInstance = context.getOptionInstance(path);
    const evaluatedValues = context.getEvaluatedValues();
    const selectionPath = constructSelectionPath(
      optionInstance?.option.modelicaPath as string,
      path,
    );
    expect(path in evaluatedValues).toBeFalsy();
  });

  // "Buildings.Templates.ZoneEquipment.Interfaces.PartialAirTerminal.have_souChiWat-have_souChiWat"
  // "Buildings.Templates.ZoneEquipment.Interfaces.PartialAirTerminal.have_souHeaWat-have_souHeaWat"
  it("have_souChiWat and have_souHeaWat should NOT show on zone controllers", () => {
    const context = new ConfigContext(
      zoneReheatTemplate as TemplateInterface,
      zoneReheatConfig as ConfigInterface,
      allOptions,
      {},
    );

    const optionInstance = context.getOptionInstance("have_souChiWat");
    expect(optionInstance?.display).toBeFalsy();
  });

  it("have_souChiWat and have_souHeaWat should NOT show on zone controllers", () => {
    const context = new ConfigContext(
      zoneReheatTemplate as TemplateInterface,
      zoneReheatConfig as ConfigInterface,
      allOptions,
      {},
    );

    const optionInstance = context.getOptionInstance("have_souChiWat");
    expect(optionInstance?.display).toBeFalsy();
  });

  it("coiCoo.typVal should NOT show for any selection of coiCoo", () => {
    const selections = {
      "Buildings.Templates.AirHandlersFans.VAVMultiZone.coiCoo-coiCoo":
        "Buildings.Templates.Components.Coils.WaterBasedCooling",
    };
    const coiCooConfig = addNewConfig(
      "MZ Template with coiCoo Selected",
      mzTemplate,
      selections,
    );

    const context = new ConfigContext(
      mzTemplate as TemplateInterface,
      coiCooConfig as ConfigInterface,
      allOptions,
      {},
    );

    const contextWithSelection = new ConfigContext(
      mzTemplate as TemplateInterface,
      coiCooConfig,
      allOptions,
      selections,
    );

    const optionInstance = context.getOptionInstance("coiCoo.typVal");
    expect(optionInstance?.display).toBeFalsy();

    const otherOptionInstance =
      contextWithSelection.getOptionInstance("coiCoo.typVal");
    expect(otherOptionInstance?.display).toBeFalsy();

    const displayOptions = mapToDisplayOptions(context);
    const coiCooDisplayOption = displayOptions.find(
      (o) =>
        "groupName" in o &&
        o.groupName ===
          "Buildings.Templates.AirHandlersFans.VAVMultiZone.coiCoo.__group",
    ) as FlatConfigOptionGroup;

    expect(coiCooDisplayOption).toBeUndefined();
  });
});
