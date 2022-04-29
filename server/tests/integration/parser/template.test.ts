import { createTestModelicaJson, fullTempDirPath } from "./utils";
import { loadPackage, getTemplates, getSystemTypes } from "../../../src/parser/";

describe("Basic parser functionality", () => {
  beforeAll(() => {
    createTestModelicaJson();
    loadPackage(`${fullTempDirPath}/TestPackage`);
  });

  it("Extracts two templates and three Template types", () => {
    const templates = [...getTemplates()];
    expect(templates.length).toBe(2);
  
    const systemTypes = [...getSystemTypes()];
    expect(systemTypes.length).toBe(3);
  });
});
