const jp = require("jsonpath");

const fs = require("fs");
const parseClass = require("./support/parse-class.js");

const entries = [
  parseClass("Buildings/Templates/AirHandlersFans/VAVMultiZone"),
];

fs.writeFileSync(`${__dirname}/tmp.json`, JSON.stringify(entries, null, 2));

/*
- entry
  - elements
    - components
      - options
*/
