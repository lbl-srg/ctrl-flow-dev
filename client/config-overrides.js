const webpack = require("webpack");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");

module.exports = function override(config) {
  /*
  const fallback = config.resolve.fallback || {};
  Object.assign(fallback, {
    crypto: require.resolve("crypto-browserify"),
    stream: require.resolve("stream-browserify"),
    buffer: require.resolve("buffer"),
    buffer: require.resolve("buffer"),
  });
  config.resolve.fallback = fallback;
  */
  config.plugins = (config.plugins || []).concat([
    new NodePolyfillPlugin({
      excludeAliases: ["console"],
    }),
    /*
    new webpack.ProvidePlugin({
      process: "process/browser",
      Buffer: ["buffer", "Buffer"],
    }),
    */
  ]);
  return config;
};
