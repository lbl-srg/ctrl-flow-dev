import * as parser from "../../../src/parser/parser";
import { initializeTestModelicaJson } from "./utils";
import * as publicParser from "../../../src/parser";

const testTemplatePath = "TestPackage.Template.TestTemplate";
const testPackagePath = "TestPackage.Template";

describe("Parser file loading", () => {
  beforeAll(() => {
    initializeTestModelicaJson();
  });

  it("Extracts a 'file' object with '.' syntax", () => {
    const file = parser.getFile(testTemplatePath) as parser.File;
    const expectedPath = "TestPackage.Template";
    expect(file.package).toEqual(expectedPath);
  });

  it("Finds 'package' using modelica path", () => {
    const file = parser.getFile(testPackagePath) as parser.File;
    expect(file.package).toBe("TestPackage");
  });

  it("Discovers template files", () => {
    const packagePath = "TestPackage";
    parser.loadPackage(packagePath);
  });
});

describe("Loading from all paths", () => {
  it("A building path can load", () => {
    const file = parser.getFile('Buildings.Templates.AirHandlersFans.Components.Controls.Interfaces.PartialVAVMultizone');
    expect(file).toBeTruthy();
  });
});

// describe("Parser extracts expected parts or modelica-buildings", () => {
//   beforeAll(() => {
//     parser.loadPackage('Buildings');
//   });

//   it("Modelica Buildings can load", () => {
//     const templates = publicParser.getTemplates();
//     expect(templates.length).toBe(3);
//   });
// });