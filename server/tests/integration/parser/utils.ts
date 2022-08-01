import * as parser from "../../../src/parser/parser";
import { createModelicaJson } from "../../../scripts/generate-modelica-json";

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

type SimpleOption = {
  name: string;
  path: string;
  options: SimpleOption[];
}

/*
 * De-normalizes options and returns the denormalized shape
 */
export function optionTree(optionsN: {[key: string]: parser.OptionN}, rootPath: string): SimpleOption  {
  const root = optionsN[rootPath];
  const options = (root.options) ? root.options.map(o => optionTree(optionsN, o)) : [];
  return { name: root.name, path: root.modelicaPath, options: options};
}
