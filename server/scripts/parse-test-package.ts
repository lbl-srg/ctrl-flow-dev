import fs from "fs";
import path from "path";
import {
  loadPackage,
  getTemplates,
  getSystemTypes,
  getOptions,
} from "../src/parser";

import { fullTempDirPath } from "../tests/integration/parser/utils";
import { prependToModelicaJsonPath } from "../src/parser/loader";

// TODO: if this path is prepended here, buildings/templates does not finish
// loading, and throws with a bad reference. Something in the parser is not handling
// a failed lookup well
// prependToModelicaJsonPath([fullTempDirPath]);

// loadPackage(`Buildings/Templates`);
prependToModelicaJsonPath([fullTempDirPath]);
loadPackage(`${fullTempDirPath}/TestPackage`);
loadPackage(`${fullTempDirPath}/SecondTestPackage/Templates`);

const { options, scheduleOptions } = getOptions();

const data = {
  templates: getTemplates(),
  systemTypes: getSystemTypes(),
  options: options,
  scheduleOptions: scheduleOptions,
};

const dest = path.resolve(`${__dirname}/test-templates.json`);

fs.writeFileSync(dest, JSON.stringify(data, null, 2));
