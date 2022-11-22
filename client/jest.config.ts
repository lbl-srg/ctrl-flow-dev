import type { Config } from "@jest/types";
// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  roots: ["<rootDir>/tests"],
  testEnvironment: "node",
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.js"],
};
export default config;
