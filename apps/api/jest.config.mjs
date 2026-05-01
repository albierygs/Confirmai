/** @type {import("jest").Config} */
const config = {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".ts"],
  transform: {
    "^.+\\.ts$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: "tsconfig.json",
      },
    ],
  },
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  testMatch: ["**/__tests__/**/*.test.ts", "**/*.spec.ts"],
  testTimeout: 30000,
};

export default config;
