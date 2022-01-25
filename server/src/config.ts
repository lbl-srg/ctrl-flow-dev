import "dotenv/config";

export default {
  NODE_ENV: process.env.NODE_ENV || "production",
  PORT: process.env.PORT || 3000,
};