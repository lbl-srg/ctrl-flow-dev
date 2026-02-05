const path = require("path");

module.exports = {
  entry: "./build/server/src/index.js",
  output: {
    filename: "index.js",
    path: path.resolve(__dirname, "dist"),
  },
  target: "node",
  externals: {
    rdflib: "commonjs rdflib",
  },
};
