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

const data = {
  templates: getTemplates(),
  systemTypes: getSystemTypes(),
  options: getOptions(),
};

const dest = path.resolve(`${__dirname}/../public/build/system-templates.json`);

fs.writeFileSync(dest, JSON.stringify(data, null, 2));
