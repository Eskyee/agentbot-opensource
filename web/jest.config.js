const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  clearMocks: true,
  roots: ['<rootDir>/__tests__'],
  testEnvironment: 'jsdom',
  testMatch: ['**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
}

// next/jest manages `transform` (SWC) but tends to overwrite
// transformIgnorePatterns. uncrypto (pulled in by @upstash/redis) is ESM-only
// and must be transformed, so we re-apply the pattern after Next builds config.
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)()
  config.transformIgnorePatterns = [
    '/node_modules/(?!(?:uncrypto|@upstash/redis)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ]
  return config
}
