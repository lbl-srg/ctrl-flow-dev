import {
  constructSelectionPath,
  evaluate,
  resolvePaths,
} from "../../src/interpreter/interpreter";

import {
  mapToDisplayOptions,
  _formatDisplayOption,
  _formatDisplayGroup,
  _formatDisplayItem,
  FlatConfigOptionGroup,
} from "../../src/interpreter/display-option";

import { createTemplateContext, createSelections, TestTemplate } from "./utils";

describe("Specific parameter debugging", () => {
  it("Visits coiHea", () => {
    const { context } = createTemplateContext(TestTemplate.ZoneReheat, {});

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

  it("Assigns null to secOutRel.secOut.damOut", () => {
    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
      {},
    );

    const path = "secOutRel.secOut.damOut";
    // fill in cache by generating display options
    const displayOptions = mapToDisplayOptions(context);
    const { value } = context._resolvedValues[path];
    expect(value).toEqual("");
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
    const { context } = createTemplateContext(TestTemplate.ZoneReheat, {});

    const optionInstance = context.getOptionInstance("have_souChiWat");
    expect(optionInstance?.display).toBeFalsy();
  });

  it("have_souChiWat and have_souHeaWat should NOT show on zone controllers", () => {
    const { context } = createTemplateContext(TestTemplate.ZoneReheat, {});

    const optionInstance = context.getOptionInstance("have_souChiWat");
    expect(optionInstance?.display).toBeFalsy();
  });

  it("coiCoo.typVal should NOT show for any selection of coiCoo", () => {
    const selections = {
      "Buildings.Templates.AirHandlersFans.VAVMultiZone.coiCoo-coiCoo": {
        value: "Buildings.Templates.Components.Coils.WaterBasedCooling",
      },
    };

    const { context: contextWithSelection } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
      createSelections(selections),
    );

    const { context } = createTemplateContext(TestTemplate.MultiZoneTemplate);

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

/**
 * This is a test of the ctl.haveCO2Sen enable expression
 *
 * The expression is broken into its separate tests for each operand as
 * well as components of each operand
 */
describe("ctl.have_CO2Sen enable expression", () => {
  it("First operand", () => {
    const { context } = createTemplateContext(TestTemplate.MultiZoneTemplate);

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
        { value: secOutValue },
    };
    const { context: newContext } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
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
    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
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
        {
          value:
            "Buildings.Templates.AirHandlersFans.Components.OutdoorSection.DedicatedDampersAirflow",
        },
    };

    const { context: newContext } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
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
    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
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
    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
      createSelections(),
    );

    // falls back to original
    const typSecOut = context.getValue("ctl.typSecOut"); // ctl.typSecOut = secOutRel.typSecOut
    expect(typSecOut).toEqual(
      "Buildings.Controls.OBC.ASHRAE.G36.Types.OutdoorAirSection.SingleDamper",
    );
  });

  it("Evaluates the expression at mod secOutRel.secOut.dat", () => {
    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
      createSelections(),
    );
    const path = "secOutRel.secOut.dat"; // secOut.dat = dat
    const val = evaluate(context.mods[path]?.expression, context, "secOutRel");
    expect(val).toEqual("");
  });

  it("Able to resolve secOutRel.secOut.dat without going into an infinite loop due to bad scope", () => {
    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
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
