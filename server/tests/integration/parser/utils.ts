import * as parser from "../../../src/parser/parser";
import { prependToModelicaJsonPath } from '../../../src/parser/loader';
import { createModelicaJson } from "../../../scripts/generate-modelica-json";

// NOTE: if the test modelica package changes it will need to be
// manually removed to update for tests
const testPackagePath = "tests/static-data/TestPackage";
// We need an exact match on path to test project settings
const buildingsPackage = "tests/static-data/Buildings";
const tempDirPath = "/tmp/test-linkage-widget/";

export const fullTempDirPath = `${tempDirPath}json/`;

// modelica-json writes each class at the path of its full name: the stub of
// Buildings is converted into its own directory so that it is not mixed with
// the classes of the MBL used by the test packages, and it is searched first
const stubDirPath = "/tmp/test-linkage-widget-stub/";

export const testModelicaJsonPath = [`${stubDirPath}json/`, fullTempDirPath];

export function createStubModelicaJson() {
  createModelicaJson(buildingsPackage, stubDirPath);
}

export function createTestModelicaJson() {
  createModelicaJson(testPackagePath, tempDirPath);
  createStubModelicaJson();
}

/**
 * Creates json from test modelica package (if not already created) and
 * sets the parser to target the test modelica package
 */
export function initializeTestModelicaJson() {
  createTestModelicaJson();
  prependToModelicaJsonPath(testModelicaJsonPath);
}

type SimpleOption = {
  name: string;
  path: string;
  options: SimpleOption[];
};

/*
 * De-normalizes options and returns the denormalized shape
 */
export function inputTree(
  optionsN: { [key: string]: parser.TemplateInput },
  rootPath: string,
): SimpleOption {
  const root = optionsN[rootPath];
  const options = root.inputs
    ? root.inputs.map((o) => inputTree(optionsN, o))
    : [];
  return { name: root.name, path: root.modelicaPath, options: options };
}
