import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import config from "../../../src/config";

const tempDirPath = "/tmp/test-linkage-widget";
const templatePath =
  "json/tests/static-data/TestModelicaPackage/Template/TestTemplate.json";

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

  it("Sucessfully loads the parsed template", () => {
    const fullPath = path.resolve(tempDirPath, templatePath);
    const templateString = fs.readFileSync(fullPath, { encoding: "utf8" });
    JSON.parse(templateString);
  });
});

describe("Expected Options are extracted", () => {
  it("Extracts the expected number of template options", () => {});
  it("Ignore 'final' parameters", () => {});
});
