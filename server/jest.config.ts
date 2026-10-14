import type { Config } from "@jest/types";
// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
  roots: ["<rootDir>/tests"],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/tests/integration/parser/modelica-buildings\\.long\\.test\\.ts$",
  ],
};
export default config;
