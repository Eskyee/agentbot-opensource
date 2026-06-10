export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: ['src/**/*.ts', '!src/index.ts'],
  // Stub out bull (mocked in tests but not a real runtime dependency)
  moduleNameMapper: {
    '^bull$': '<rootDir>/src/__mocks__/bull.ts',
    // Mock jose (ESM-only dependency from @coinbase/cdp-sdk) for CJS test runner
    '^jose$': '<rootDir>/src/__mocks__/jose.ts',
  },
};
