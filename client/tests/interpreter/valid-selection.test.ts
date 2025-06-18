import { createTemplateContext, createSelections, TestTemplate } from "./utils";

describe("Valid selection", () => {
  it("Returns an invalid selection", () => {
    // you should NOT be able to select secOutRel.secRel.fanRel if a ReliefDamper is specified for secOutRel.secRel
    const selections = {
      "Buildings.Templates.AirHandlersFans.Components.OutdoorReliefReturnSection.MixedAirWithDamper.secRel-secOutRel.secRel":
        "Buildings.Templates.AirHandlersFans.Components.ReliefReturnSection.ReliefDamper",
      "Buildings.Templates.AirHandlersFans.Components.ReliefReturnSection.ReliefFan.fanRel-secOutRel.secRel.fanRel":
        "Buildings.Templates.Components.Fans.ArrayVariable",
    };

    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
      createSelections(selections),
    );

    expect(
      context.isValidSelection(
        "Buildings.Templates.AirHandlersFans.Components.ReliefReturnSection.ReliefFan.fanRel-secOutRel.secRel.fanRel",
      ),
    ).toEqual(false);
  });

  it("Returns a valid selection", () => {
    // you SHOULD be able to select secOutRel.secRel.fanRel if a ReliefDamper is specified for secOutRel.secRel
    const selections = {
      "Buildings.Templates.AirHandlersFans.Components.OutdoorReliefReturnSection.MixedAirWithDamper.secRel-secOutRel.secRel":
        "Buildings.Templates.AirHandlersFans.Components.ReliefReturnSection.ReliefFan",
      "Buildings.Templates.AirHandlersFans.Components.ReliefReturnSection.ReliefFan.fanRel-secOutRel.secRel.fanRel":
        "Buildings.Templates.Components.Fans.ArrayVariable",
    };

    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
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

    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
      createSelections(selections),
    );

    expect(
      context.isValidSelection("Buildings.Templates.Data.AllSystems.ashCliZon"),
    ).toEqual(true);
  });
});
