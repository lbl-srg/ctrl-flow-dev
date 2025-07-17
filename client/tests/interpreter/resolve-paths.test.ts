import {
  applyPathModifiers,
  evaluate,
  resolvePaths,
} from "../../src/interpreter/interpreter";

import {
  buildExpression,
  createTemplateContext,
  createSelections,
  TestTemplate,
} from "../utils";

/**
 * Includes tests for 'getValue' and 'resolveToValue'
 */

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

describe("Path resolution", () => {
  it("Maps an instance path to the original option path uneffected by selections, redeclares", () => {
    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
      createSelections(),
    );

    const { optionPath } = resolvePaths("TAirRet.isDifPreSen", context);
    expect(optionPath).toEqual(
      "Buildings.Templates.Components.Interfaces.PartialSensor.isDifPreSen",
    );
  });

  it("Maps an instance path to an option path modified by in template redeclares", () => {
    const { context } = createTemplateContext(
      TestTemplate.ZoneTemplate,
      createSelections(),
    );

    const expectedPath =
      "Buildings.Templates.ZoneEquipment.Components.Interfaces.PartialController.typ";
    const { optionPath } = resolvePaths("ctl.typ", context);

    // TODO: need a better parameter...
    expect(optionPath).toBe(expectedPath);
  });

  it("Returns the outerOptionPath if present", () => {
    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
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
    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
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
    const { context } = createTemplateContext(
      TestTemplate.MultiZoneTemplate,
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
    const { context } = createTemplateContext(TestTemplate.MultiZoneTemplate);

    const { optionPath } = resolvePaths(
      "secOutRel.secRel.fanRet.dat.nFan",
      context,
    );
  });

  it("Handles a 'datAll' path correctly", () => {});
});
