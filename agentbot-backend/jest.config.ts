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
  },
  // smoke-test-review depends on @coinbase/cdp-sdk → jose (ESM-only, no CJS build)
  // which ts-jest cannot transform. Skip it in CI; run it locally with --experimental-vm-modules.
  testPathIgnorePatterns: ['/node_modules/', 'smoke-test-review\\.test\\.ts'],
};
