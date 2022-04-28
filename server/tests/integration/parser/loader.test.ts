import * as parser from "../../../src/parser/parser";
import { initializeTestModelicaJson } from "./utils";

const testModelicaFile = "TestPackage.Template.TestTemplate";

describe("Parser file loading", () => {
  beforeAll(() => {
    initializeTestModelicaJson();
  });

  it("Extracts a 'file' object", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const expectedPath = "TestPackage.Template";
    expect(file.modelicaPath).toEqual(expectedPath);
  });

  it("Supports loading with . syntax", () => {
    const file = parser.getFile(testModelicaFile) as parser.File;
    const expectedPath = "TestPackage.Template";
    expect(file.modelicaPath).toEqual(expectedPath);
  });

  it("Discovers template files", () => {
    const packagePath = "TestPackage";
    parser.load(packagePath);
  });
});
