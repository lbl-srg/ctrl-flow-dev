import fs from "fs";
import path from "path";

import {
  loadPackage,
  getAllTemplates,
} from "../src/parser";

loadPackage("Buildings");

const data = {
  allTemplates: getAllTemplates(),
};

const dest = path.resolve(
  `${__dirname}/all_templates.json`,
);

fs.writeFileSync(dest, JSON.stringify(data, null, 2));
