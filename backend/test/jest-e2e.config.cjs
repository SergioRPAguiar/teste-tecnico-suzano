const { compilerOptions } = require("../tsconfig.json");
module.exports = {
  rootDir: "..",
  testEnvironment: "node",
  testMatch: ["<rootDir>/test/**/*.e2e-spec.ts"],
  setupFiles: ["reflect-metadata"],
  transform: { "^.+\\.tsx?$": ["ts-jest", { tsconfig: { ...compilerOptions, rootDir: "." } }] },
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
  testTimeout: 20000,
};
