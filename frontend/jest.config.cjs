const nextJest = require("next/jest");
module.exports = nextJest({ dir: "./" })({
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
  clearMocks: true,
});
