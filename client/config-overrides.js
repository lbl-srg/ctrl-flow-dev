/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const { override, addBabelPlugins } = require("customize-cra");

module.exports = override(
  addBabelPlugins(
    ["@babel/plugin-proposal-class-properties", { loose: false }],
    "@babel/plugin-proposal-private-methods",
    "@babel/plugin-proposal-private-property-in-object",
  ),
);
