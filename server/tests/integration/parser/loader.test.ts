import * as parser from "../../../src/parser/parser";
import { initializeTestModelicaJson } from "./utils";

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

  it("Discovers template files and project options", () => {
    const packageName = "TestPackage";
    const projectOptionsClassName = "Buildings.Templates.Data.AllSystems";
    parser.loadPackage(packageName);
    const projectOptionElement = parser.typeStore.find(projectOptionsClassName);
    expect(projectOptionElement).toBeDefined();
  });
});
