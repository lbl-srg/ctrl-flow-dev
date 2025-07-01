import { resolveToValue } from "../../src/interpreter/interpreter";

import { createTemplateContext, createSelections, TestTemplate } from "./utils";

describe("resolveToValue tests using context and evaluation", () => {
  it("Handles fanSupBlo.typ", () => {
    const { context } = createTemplateContext(TestTemplate.MultiZoneTemplate);

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
    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
      createSelections(selections),
    );

    const expectedVal = "Buildings.Templates.Components.Fans.ArrayVariable";
    const val = context.getValue(instancePath);
    expect(val).toEqual(expectedVal);
  });
});

describe("Testing context getValue", () => {
  it("Components (parameter that have a type of a class/model) that are not replaceables have no value assigned", () => {
    const { context } = createTemplateContext(TestTemplate.MultiZoneTemplate);

    // TODO: expected behavior for components that are not replaceables?
    // Currently returns an empty string
    const expectedVal = "";
    const val = context.getValue("TAirCoiCooLvg");
    expect(val).toEqual(expectedVal);
  });

  it("Fetches the correct value for a replaceable type without a selection made", () => {
    const { context } = createTemplateContext(TestTemplate.MultiZoneTemplate);

    const expectedVal = "Buildings.Templates.Components.Fans.None";
    const val = context.getValue("fanSupBlo");

    expect(val).toEqual(expectedVal);
  });

  it("Fetches the correct value for a replaceable type after a selection is made", () => {
    const configName = "VAVMultiZone Config with selections";
    const selections = {
      ["Buildings.Templates.AirHandlersFans.VAVMultiZone.fanSupBlo-fanSupBlo"]:
        "Buildings.Templates.Components.Fans.SingleVariable",
    };

    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
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
    const { context } = createTemplateContext(TestTemplate.ZoneTemplate);
    const expectedVal = "Buildings.Templates.Components.Coils.None";
    expect(context.getValue("coiHea")).toBe(expectedVal);
  });

  it("Gets ctl.typFanSup", () => {
    const { context } = createTemplateContext(TestTemplate.MultiZoneTemplate);

    const path = "ctl.typFanSup";
    const optionInstance = context.getOptionInstance(path);
  });

  it("Evaluates the expression at mod secOutRel.secOut.dat", () => {
    const { context } = createTemplateContext(
      TestTemplate.ZoneTemplate,
      createSelections(),
    );

    const evaluatedValues = context.getEvaluatedValues();
    expect("coiHea" in evaluatedValues);
  });
});
