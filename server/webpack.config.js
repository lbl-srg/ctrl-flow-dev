const path = require("path");

// modelica-json is an external package, loaded at runtime from its own directory,
// where its dependencies and data files are located.
const modelicaJsonParser = path.resolve(
  __dirname,
  "../dependencies/modelica-json/lib/parser",
);

module.exports = {
  entry: "./build/server/src/index.js",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
  },
  target: "node",
  externals: {
    "../../dependencies/modelica-json/lib/parser": `commonjs ${modelicaJsonParser}`,
  },
};
