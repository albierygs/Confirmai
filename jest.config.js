import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const apiTsconfigPath = path.resolve(__dirname, "test/tsconfig.json");

/** @type {import("jest").Config} **/
export default {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    "^@scalar/express-api-reference$": "<rootDir>/test/mocks/scalar-express-api-reference.ts",
  },
  transform: {
    // Configura o ts-jest para usar ESM
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        tsconfig: apiTsconfigPath,
      },
    ],
  },
  testMatch: ["**/test/**/*.test.ts", "**/src/**/*.test.ts"],
};
