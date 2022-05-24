import { execSync } from "child_process";
import fs from "fs";

import config from "../../../src/config";
import * as parser from "../../../src/parser/parser";
import { createModelicaJson } from "../../../scripts/generate-modelica-json";

// const templatePath =
//   "json/tests/static-data/TestModelicaPackage/Template/TestTemplate";
// const fullTemplatePath = path.resolve(tempDirPath, templatePath);

// NOTE: if the test modelica package changes it will need to be
// manually removed to update for tests
const testPackagePath = "tests/static-data/TestPackage";
const tempDirPath = "/tmp/test-linkage-widget/";
export const fullTempDirPath = `${tempDirPath}json/tests/static-data/`;

export function createTestModelicaJson() {
  createModelicaJson(testPackagePath, tempDirPath);
}

/**
 * Creates json from test modelica package (if not already created) and
 * sets the parser to target the test modelica package
 */
export function initializeTestModelicaJson() {
  createTestModelicaJson();
  parser.setPathPrefix(fullTempDirPath);
}
