import { createTemplateContext, createSelections, TestTemplate } from "./utils";
import { OptionInstance } from "../../src/interpreter/interpreter";
import {
  _formatDisplayOption,
  _formatDisplayItem,
  _formatDisplayGroup,
  FlatConfigOption,
  FlatConfigOptionGroup,
  mapToDisplayOptions,
} from "../../src/interpreter/display-option";

import { resolvePaths } from "../../src/interpreter/interpreter";

/**
 * Tests related to mapping an 'option' to a 'display option' - a UI friendly
 * representation of an 'option'.
 */

describe("Display Option and Display Group Generation", () => {
  it("Generates Boolean DisplayOption for ctl.have_perZonRehBox", () => {
    const { context } = createTemplateContext(TestTemplate.MultiZoneTemplate);

    const have_perZonRehBoxPath = "ctl.have_perZonRehBox";
    const optionInstance = context.getOptionInstance(have_perZonRehBoxPath);

    expect(optionInstance?.display).toBeTruthy();
    expect(optionInstance?.instancePath).toBe(have_perZonRehBoxPath);
    const parent = context.getOptionInstance("ctl");
    const displayOption = _formatDisplayOption(
      optionInstance as OptionInstance,
      parent?.option.modelicaPath as string,
      context
    );

    expect(displayOption).toBeDefined();
    expect(displayOption.selectionType).toEqual("Boolean");
    expect(displayOption.modelicaPath).toEqual(
      optionInstance?.option?.modelicaPath
    );
    expect(displayOption.value).toEqual(false.toString());
  });

  it("Generates a normal DisplayOption", () => {
    const { context } = createTemplateContext(TestTemplate.MultiZoneTemplate);
    const optionInstance = context.getOptionInstance("secOutRel.secOut");
    const parentInstance = context.getOptionInstance("secOutRel");

    const displayOption = _formatDisplayOption(
      optionInstance as OptionInstance,
      parentInstance?.option.modelicaPath as string,
      context
    );

    expect(displayOption.name).toEqual(optionInstance?.option.name);
    expect(displayOption.value).toEqual(
      "Buildings.Templates.AirHandlersFans.Components.OutdoorSection.SingleDamper"
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
      expect(c.modelicaPath in expectedChoicePaths).toBeTruthy()
    );
  });

  it("Generates the correct type for an enum when using _displayItem", () => {
    const { context } = createTemplateContext(TestTemplate.MultiZoneTemplate);

    const enumInstance = context.getOptionInstance(
      "secOutRel.secOut.typ"
    ) as OptionInstance;
    expect(enumInstance?.value).toEqual(
      "Buildings.Controls.OBC.ASHRAE.G36.Types.OutdoorAirSection.SingleDamper"
    );
    const parentInstance = context.getOptionInstance("secOutRel.secOut");
    const displayItems = _formatDisplayItem(
      enumInstance as OptionInstance,
      parentInstance?.option.modelicaPath as string,
      context
    );

    expect(displayItems.length).toEqual(0);

    enumInstance.display = true; // for testing, forcing this to true

    const updatedDisplayItems = _formatDisplayItem(
      enumInstance as OptionInstance,
      parentInstance?.option.modelicaPath as string,
      context
    );

    expect(updatedDisplayItems.length).toEqual(1);
  });

  it("Generates a display group", () => {
    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
      createSelections()
    );

    // get secOutRel type
    const secOutRel = context.getOptionInstance("secOutRel");
    const secOutRelType = secOutRel?.option.type as string;
    const secOutRelTypeOption = context.options[secOutRelType];

    const displayGroup = _formatDisplayGroup(
      secOutRelTypeOption,
      secOutRel as OptionInstance,
      context
    );

    const items = displayGroup?.items as (
      | FlatConfigOptionGroup
      | FlatConfigOption
    )[];

    expect(displayGroup?.groupName).toBe(secOutRel?.option.name);
    expect(displayGroup?.items.length).toBeGreaterThan(0);
  });

  it("Generates a display group and display options for Multizone Template", () => {
    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
      {}
    );

    const displayOptions = mapToDisplayOptions(context);
    expect(displayOptions).toBeDefined();
  });

  // // TODO: may need ctrlFlow annotation for this
  it("Hides params with outer designation", () => {
    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
      createSelections()
    );

    const coiCoo = context.getOptionInstance("ctl.coiCoo") as OptionInstance;
    expect(coiCoo.display).toBeFalsy();
    const { optionPath } = resolvePaths("ctl", context);
    const items = _formatDisplayItem(coiCoo, optionPath as string, context);
    expect(items.length).toEqual(0);
  });

  it("Generates a display group and display options for VAVBox Cooling Only Template", () => {
    const { context, template } = createTemplateContext(
      TestTemplate.ZoneTemplate,
      createSelections()
    );
    const coiHea = context.getOptionInstance("coiHea") as OptionInstance;
    expect(coiHea.display).toBeFalsy();

    const ctl = context.getOptionInstance("ctl") as OptionInstance;
    const ctlDisplayOptions = _formatDisplayItem(
      ctl,
      template.modelicaPath,
      context
    );

    expect(ctlDisplayOptions.length).toBeGreaterThan(0);

    const displayOptions = mapToDisplayOptions(context);
    expect(displayOptions.length).toBeGreaterThan(0);
  });
});

describe("Display Enable is set as expected", () => {
  it("Sets enable correctly on parameter with expression", () => {
    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
      createSelections()
    );

    const optionInstance = context.getOptionInstance("fanSupBlo");
    expect(optionInstance?.display).toBeFalsy();

    const configName = "VAVMultiZone Config with fanSupDra selection";
    const selections = {
      ["Buildings.Templates.AirHandlersFans.VAVMultiZone.fanSupDra-fanSupDra"]:
        "Buildings.Templates.Components.Fans.None",
    };

    const { context: newContext } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
      createSelections(selections)
    );

    const updatedOptionInstance = newContext.getOptionInstance("fanSupBlo");
    expect(updatedOptionInstance?.display).toBeTruthy();
  });

  it("Sets ctl.have_CO2Sen param to true", () => {
    const selections = {
      "Buildings.Templates.AirHandlersFans.Components.OutdoorReliefReturnSection.MixedAirWithDamper.secOut-secOutRel.secOut":
        "Buildings.Templates.AirHandlersFans.Components.OutdoorSection.DedicatedDampersPressure",
    };

    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
      createSelections(selections)
    );

    const optionInstance = context.getOptionInstance("ctl.have_CO2Sen");
    expect(optionInstance?.display).toBeTruthy();
  });

  it("ctl.have_winSen returns an enabled control", () => {
    const { context } = createTemplateContext(
      TestTemplate.ZoneTemplate,
      createSelections()
    );

    const haveWinSen = context.getOptionInstance(
      "ctl.have_winSen"
    ) as OptionInstance;
    expect(haveWinSen.display).toBeTruthy();
  });
});
