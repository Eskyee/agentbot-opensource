module.exports = {
  displayName: 'basefm-provisioning-tests',
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'app/api/**/*.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80,
    },
  },
  testTimeout: 30000,
  verbose: true,
  bail: false,
  maxWorkers: 1, // Run tests sequentially to avoid port conflicts
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      },
    },
  },
};
