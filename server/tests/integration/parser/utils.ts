import { execSync } from "child_process";
import fs from "fs";

import config from "../../../src/config";
const tempDirPath = "/tmp/test-linkage-widget/";
import * as parser from "../../../src/parser/parser";

// const templatePath =
//   "json/tests/static-data/TestModelicaPackage/Template/TestTemplate";
// const fullTemplatePath = path.resolve(tempDirPath, templatePath);

// NOTE: if the test modelica package changes it will need to be
// manually removed to update for tests
function createTestModelicaJson() {
  if (!fs.existsSync(tempDirPath)) {
    fs.mkdirSync(tempDirPath);
    execSync(
      `node ${config.MODELICA_DEPENDENCIES}/modelica-json/app.js -f tests/static-data/TestPackage -o json -d ${tempDirPath}`,
    );
    // TODO: maybe use spawnsync so when a process errors this throws instead of silently failing
  }
}

/**
 * Creates json from test modelica package (if not already created) and
 * sets the parser to target the test modelica package
 */
export function initializeTestModelicaJson() {
  createTestModelicaJson();
  parser.setPathPrefix(tempDirPath + "json/tests/static-data/");
}
