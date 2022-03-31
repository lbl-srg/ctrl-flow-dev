const { getFile } = require("./files.js");
const parseElements = require("./parse-elements.js");
const { getClassDef } = require("./util.js");

function parseFile(filePath) {
  const { description_string: name, identifier: id } = getClassDef(
    getFile(filePath),
  );

  return {
    id,
    name,
    // elements: parseElements(filePath),
  };
}

module.exports = parseFile;
