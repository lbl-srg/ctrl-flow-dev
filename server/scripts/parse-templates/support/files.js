const path = require("path");
const pathPrefix = path.join(__dirname, "../../../build/modelica-json/json/");

module.exports = {
  pathPrefix,
  getFile(reference) {
    const path = reference.replace(/\./g, "/") + ".json";
    return require(pathPrefix + path);
  },
};
