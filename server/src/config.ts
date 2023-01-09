import "dotenv/config";

export default {
  NODE_ENV: process.env.NODE_ENV || "production",
  PORT: process.env.PORT || 3000,
  MODELICA_DEPENDENCIES: process.env.MODELICA_DEPENDENCIES || "/dependencies",
  FE_ORIGIN_URL: process.env.FE_ORIGIN_URL || "http://localhost:3001",
};
