// const jp = require("jsonpath");
import fs from "fs";
import path from "path";
import * as parser from "../../src/parser/parser";

const pathPrefix = path.resolve(__dirname, "../../build/modelica-json/json/");

const vav = parser.getFile(
  path.resolve(
    pathPrefix,
    "Buildings/Templates/AirHandlersFans/VAVMultiZone.json",
  ),
);

const template = vav.entries[0];

fs.writeFileSync(
  `${__dirname}/tmp.json`,
  JSON.stringify(
    {
      name: template.name,
      id: template.identifier,
      description: template.description,
      elements: template.elementList,
      components: template.components,
    },
    null,
    2,
  ),
);

/*
- entry
  - elements
    - components
      - options
*/
