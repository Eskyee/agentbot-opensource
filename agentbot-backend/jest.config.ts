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
    // Mock @coinbase/agentkit (+ vercel-ai-sdk) — they pull in the ESM-only
    // @across-protocol/app-sdk, which the CJS test runner can't parse.
    '^@coinbase/agentkit$': '<rootDir>/src/__mocks__/agentkit.ts',
    '^@coinbase/agentkit-vercel-ai-sdk$': '<rootDir>/src/__mocks__/agentkit-vercel-ai-sdk.ts',
  },
};
