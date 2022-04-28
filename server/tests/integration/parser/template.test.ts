import { createTestModelicaJson, fullTempDirPath } from "./utils";
import { loadPackage } from "../../../src/parser/";

describe("Basic parser functionality", () => {
  beforeAll(() => {
    createTestModelicaJson();
    loadPackage(`${fullTempDirPath}/TestPackage`);
  });

  it("Extracts two templates and three Template types", () => {});
});
