import { findPackageEntryPoints } from "../../../src/parser/loader";
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

  it("Finds package entry points in single package", () => {
    const packageName = "TestPackage";
    const entryPointNames = findPackageEntryPoints(packageName)
      .map(({ className }) => className)
      .sort();
    expect(entryPointNames).toEqual([
      "TestPackage",
      "TestPackage.NestedTemplate",
      "TestPackage.NestedTemplate.Subcategory",
      "TestPackage.NestedTemplate.Subcategory.SecondTemplate",
      "TestPackage.Template",
      "TestPackage.Template.TestTemplate",
    ]);
  });

  it("Finds package entry points in two packages", () => {
    const firstPackageName = "TestPackage";
    const secondPackageName = "SecondTestPackage";
    findPackageEntryPoints(firstPackageName);
    const entryPointNames = findPackageEntryPoints(secondPackageName)
      .map(({ className }) => className)
      .sort();
    expect(entryPointNames).toEqual([
      "SecondTestPackage.Templates",
      "SecondTestPackage.Templates.Plants",
      "SecondTestPackage.Templates.Plants.Chiller",
      "TestPackage",
      "TestPackage.NestedTemplate",
      "TestPackage.NestedTemplate.Subcategory",
      "TestPackage.NestedTemplate.Subcategory.SecondTemplate",
      "TestPackage.Template",
      "TestPackage.Template.TestTemplate",
    ]);
  });

  it("Discovers template files and project options", () => {
    const packageName = "TestPackage";
    const projectOptionsClassName = "Buildings.Templates.Data.AllSystems";
    parser.loadPackage(packageName);
    const projectOptionElement = parser.typeStore.find(projectOptionsClassName);
    expect(projectOptionElement).toBeDefined();
  });

  it("Is able to load the second test package", () => {
    const packageName = "SecondTestPackage";
    const secondPackageTestParam =
      "SecondTestPackage.Templates.Plants.Chiller.testParam";
    parser.loadPackage(packageName);
    const projectOptionElement = parser.typeStore.find(secondPackageTestParam);
    expect(projectOptionElement).toBeDefined();
  });
});
