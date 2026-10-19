module.exports = {
  testEnvironment: "node",
  testMatch: ["<rootDir>/src/**/*.spec.ts"],
  setupFiles: ["reflect-metadata"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  clearMocks: true,
  moduleNameMapper: { "^(\\.{1,2}/.*)\\.js$": "$1" },
};
