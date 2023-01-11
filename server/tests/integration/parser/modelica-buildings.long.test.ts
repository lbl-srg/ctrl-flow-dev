import { getFile } from "../../../src/parser/parser";
import { loadPackage } from "../../../src/parser";
import { getTemplates, Template } from "../../../src/parser/template";

describe("Loading from all paths", () => {
  it("A building path can load", () => {
    const file = getFile(
      "Buildings.Templates.AirHandlersFans.Components.Controls.Interfaces.PartialVAVMultizone",
    );
    expect(file).toBeTruthy();
  });
});

describe("Parser extracts expected templates", () => {
  beforeAll(() => {
    loadPackage("Buildings");
  });

  it("Modelica Buildings can load and extract options with breaking", () => {
    const templates = getTemplates();

    expect(templates.length).toBe(3);
    const [template1, ..._] = templates;
    const options = template1.getOptions();
  });

  it("Splits schedule options from regular options", () => {
    const templates = getTemplates();
    const vavMultiZone = templates.find(
      (t) =>
        t.modelicaPath === "Buildings.Templates.AirHandlersFans.VAVMultiZone",
    ) as Template;
    const { options, scheduleOptions } = vavMultiZone.getOptions();
    const secOutRelPath = "Buildings.Templates.AirHandlers.VAVMultiZone";
    const option = options[secOutRelPath];
  });

  it("Sets deadEnd param for TwoWayModulating.val correctl", () => {
    const templates = getTemplates();
    const mzTemplate = templates.find(
      (t) =>
        t.modelicaPath === "Buildings.Templates.AirHandlersFans.VAVMultiZone",
    ) as Template;
    const options = mzTemplate.getOptions();

    const twoWayModulatingOption =
      options.options[
        "Buildings.Templates.Components.Valves.TwoWayModulating.val"
      ];
    expect(twoWayModulatingOption.options?.length).toEqual(0);
  });
});
