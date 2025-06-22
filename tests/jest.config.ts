import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  projects: [
    {
      displayName: "frontend",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/src/frontend/**/*.test.tsx"],
      setupFilesAfterEnv: [
        "<rootDir>/src/setup-frontend.ts",
        "<rootDir>/src/setup-console.ts",
      ],
      moduleNameMapper: {
        "^react$": "<rootDir>/../frontend/node_modules/react",
        "^react-dom$": "<rootDir>/../frontend/node_modules/react-dom",
        "^@backend/(.*)$": "<rootDir>/../backend/$1",
        "^next/image$": "<rootDir>/src/__mocks__/nextImageMock.ts",
        "^next/link$": "<rootDir>/src/__mocks__/nextLinkMock.ts",
      },
      transform: {
        "^.+\\.(ts|tsx)$": [
          "ts-jest",
          {
            tsconfig: "tsconfig.json",
          },
        ],
      },
      transformIgnorePatterns: ["node_modules/(?!(@prisma/client|dotenv)/)"],
    },
    {
      displayName: "backend",
      testEnvironment: "node",
      testMatch: [
        "<rootDir>/src/routes/**/*.test.ts",
        "<rootDir>/src/middleware/**/*.test.ts",
        "<rootDir>/src/services/**/*.test.ts",
        "<rootDir>/src/integration/**/*.test.ts",
      ],
      setupFilesAfterEnv: [
        "<rootDir>/src/setup-backend.ts",
        "<rootDir>/src/setup-console.ts",
      ],
      moduleNameMapper: {
        "^@backend/(.*)$": "<rootDir>/../backend/$1",
      },
      transform: {
        "^.+\\.(ts|tsx)$": [
          "ts-jest",
          {
            tsconfig: "tsconfig.json",
          },
        ],
      },
      transformIgnorePatterns: [
        "node_modules/(?!(@prisma/client|dotenv|pglite)/)",
      ],
    },
  ],
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": "ts-jest",
  },
  moduleNameMapper: {
    "^@backend/(.*)$": "<rootDir>/../backend/$1",
    "^@frontend/(.*)$": "<rootDir>/../frontend/src/$1",
  },
  setupFilesAfterEnv: [
    "<rootDir>/src/setup.ts",
    "<rootDir>/src/setup-console.ts",
  ],
  testTimeout: 30000,
  silent: false,
  verbose: true,
};

export default config;
