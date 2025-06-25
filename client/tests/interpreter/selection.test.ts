import { createTemplateContext, createSelections, TestTemplate } from "./utils";

describe("Multiple Package Selections", () => {
  it("Should allow selections from two different packages", () => {
    const firstTemplateNode = "TestPackage.Template.TestTemplate.typ";
    const firstTemplateNodeSelection = "TestPackage.Types.IceCream.Vanilla";
    const secondTemplateNode =
      "SecondTestPackage.Templates.Plants.Chiller.testParam";
    const secondTemplateNodeSelection = "true";

    const { store, config: testTemplateConfig } = createTemplateContext(
      TestTemplate.TestTemplate,
      createSelections({ [firstTemplateNode]: firstTemplateNodeSelection }),
    );

    const { config: secondTestTemplateConfig } = createTemplateContext(
      TestTemplate.SecondTestTemplate,
      createSelections({ [secondTemplateNode]: secondTemplateNodeSelection }),
      { store }, // re-use store
    );

    const firstTemplateSelections = testTemplateConfig.selections!;
    expect(firstTemplateSelections[firstTemplateNode]).toBeDefined();
    expect(firstTemplateSelections[firstTemplateNode]).toEqual(
      firstTemplateNodeSelection,
    );

    const secondTemplateSelections = secondTestTemplateConfig.selections!;
    expect(secondTemplateSelections[secondTemplateNode]).toBeDefined();
    expect(secondTemplateSelections[secondTemplateNode]).toEqual(
      secondTemplateNodeSelection,
    );
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
