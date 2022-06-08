import { getFile } from "../../../src/parser/parser";
import { writeFileSync } from "fs";
import { loadPackage } from "../../../src/parser";
import { getTemplates } from "../../../src/parser/template";

describe("Loading from all paths", () => {
  it("A building path can load", () => {
    const file = getFile(
      "Buildings.Templates.AirHandlersFans.Components.Controls.Interfaces.PartialVAVMultizone",
    );
    expect(file).toBeTruthy();
  });
});

describe("Parser extracts expected parts or modelica-buildings", () => {
  beforeAll(() => {
    loadPackage("Buildings");
  });

  it("Modelica Buildings can load", () => {
    const templates = getTemplates();

    expect(templates.length).toBe(3);
    const [template1, ..._] = templates;
    const options = template1.getOptions();
    writeFileSync("/app/test-options", JSON.stringify(options));
  });
});
