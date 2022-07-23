import fs from "fs";
import path from "path";
import {
  loadPackage,
  getTemplates,
  getSystemTypes,
  getOptions,
} from "../src/parser";

import { fullTempDirPath } from "../tests/integration/parser/utils";
loadPackage(`${fullTempDirPath}/TestPackage`);

// const buildDir = `${process.cwd()}/build/modelica-json/json`;
// loadPackage(`${buildDir}/Buildings/Templates`);

const { options, scheduleOptions } = getOptions();

const data = {
  templates: getTemplates(),
  systemTypes: getSystemTypes(),
  options: options,
  scheduleOptions: scheduleOptions,
};

const dest = path.resolve(
  `${__dirname}/../public/templates/system-template-test-package.json`,
);

fs.writeFileSync(dest, JSON.stringify(data, null, 2));
