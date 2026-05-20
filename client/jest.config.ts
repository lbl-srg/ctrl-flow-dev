import type { Config } from "@jest/types";
// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    "^.+\\.ts?$": "ts-jest",
    "^.+\\.js?$": "babel-jest",
  },
  roots: ["<rootDir>/tests"],
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.js"],
  transformIgnorePatterns: ["/node_modules/(?!(uuid)/)"],
};
export default config;
