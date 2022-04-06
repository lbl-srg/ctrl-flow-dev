import { notDeepEqual } from "assert";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import config from "../../../src/config";
import * as parser from "../../../src/parser/parser";

const tempDirPath = "/tmp/test-linkage-widget";
const templatePath =
  "json/tests/static-data/TestModelicaPackage/Template/TestTemplate.json";
const fullTemplatePath = path.resolve(tempDirPath, templatePath);

describe("Basic parser functionality", () => {
  beforeAll(() => {
    // NOTE: if the test modelica package changes it will need to be
    // manually removed to update for tests
    if (!fs.existsSync(tempDirPath)) {
      fs.mkdirSync(tempDirPath);
      execSync(
        `node ${config.MODELICA_DEPENDENCIES}/modelica-json/app.js -f tests/static-data/TestModelicaPackage -o json -d ${tempDirPath}`,
      );
    }
  });

  it("Extracts a 'file' object", () => {
    const file = parser.getFile(fullTemplatePath);
    const expectedPath = "TestPackage.Template";
    expect(file.modelicaPath).toEqual(expectedPath);
  });

  it("Extracts Template modelica path", () => {
    const file = parser.getFile(fullTemplatePath);
    const [template, ..._rest] = file.entries;
    const expectedPath = "TestPackage.Template.TestTemplate";
    expect(template.modelicaPath).toEqual(expectedPath);
  });

  it("Extracts model elements", () => {
    const file = parser.getFile(fullTemplatePath);
    const template = file.entries[0] as parser.Model;
    expect(template.elementList.length).toBe(7);
    template.elementList.map((e: parser.Element) =>
      expect(e.modelicaPath).not.toBeFalsy(),
    );
    template.elementList.map((e: parser.Element) =>
      expect(e.name).not.toBeFalsy(),
    );
  });
});

describe("Expected Options are extracted", () => {
  it("Extracts the expected number of template options", () => {});
  it("Ignore 'final' parameters", () => {});
});
