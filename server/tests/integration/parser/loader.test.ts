import * as parser from "../../../src/parser/parser";
import { initializeTestModelicaJson } from "./utils";
import config from "../../../src/config";

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

describe("Parser loads modelica-buildings package", () => {
  it("Modelica Buildings can load", () => {
    parser.loadPackage('Buildings');
  });
});