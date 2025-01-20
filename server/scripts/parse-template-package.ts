import fs from "fs";
import path from "path";

import {
  loadPackage,
  getTemplates,
  getSystemTypes,
  getOptions,
  getProject
} from "../src/parser";

loadPackage("Buildings.Templates");

const { options, scheduleOptions } = getOptions();

const data = {
  templates: getTemplates(),
  systemTypes: getSystemTypes(),
  options: options,
  scheduleOptions: scheduleOptions,
  project: getProject()
};

const dest = path.resolve(
  `${__dirname}/templates.json`,
);

fs.writeFileSync(dest, JSON.stringify(data, null, 2));
