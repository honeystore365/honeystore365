const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

// Any custom config you want to pass to Jest
const customJestConfig = {
  setupFiles: ['<rootDir>/jest.polyfills.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  // Restore the manual moduleNameMapper.
  // next/jest was not automatically resolving paths correctly.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // Only run files with .test or .spec extensions as tests
  testMatch: [
    "**/__tests__/**/*.test.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)"
  ],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
  ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = async () => {
  // Passing `customJestConfig` to `createJestConfig` will extend the Next.js jest configuration.
  const jestConfig = await createJestConfig(customJestConfig)();

  // Manually override transformIgnorePatterns to include specific modules that are ESM.
  // @vercel/speed-insights was added to fix a syntax error.
  jestConfig.transformIgnorePatterns = [
    '/node_modules/(?!(next-intl|use-intl|lucide-react|@vercel/analytics|@vercel/speed-insights|msw|@mswjs)/)',
    '^.+\\.module\\.(css|sass|scss)$',
  ];

  return jestConfig;
};
