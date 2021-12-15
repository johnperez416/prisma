const config = {
  testEnvironment: 'node',
  collectCoverage: process.env.CI ? true : false,
  coverageReporters: ['clover'],
  coverageDirectory: 'src/__tests__/coverage',
  modulePathIgnorePatterns: [
    '<rootDir>/dist/',
    '<rootDir>/fixtures/',
    '<rootDir>/generator-build/',
    '<rootDir>/runtime/',
    '<rootDir>/runtime-dist/',
    '<rootDir>/sandbox/',
    '<rootDir>/scripts/',
    '<rootDir>/src/__tests__/benchmarks/',
    '<rootDir>/src/__tests__/types/.*/test.ts',
    '<rootDir>/src/__tests__/integration/happy/exhaustive-schema/generated-dmmf.ts',
    '__helpers__/',
    'node_modules/',
    'index.ts',
    'index.d.ts',
    'index.js',
    'index.test-d.ts',
    '.bench.ts',
  ],
  collectCoverageFrom: ['src/**/*.ts', '!**/__tests__/**/*'],
  snapshotSerializers: ['./helpers/jestSnapshotSerializer'],
  testTimeout: 90000,
  setupFiles: ['./helpers/jestSetup.js'],
}

if (process.env.TEST_USE_SWC) {
  config.transform = {
    '^.+\\.ts$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
          },
          target: 'es2018',
        },
      },
    ],
  }
} else {
  config.preset = 'ts-jest'
}

module.exports = config
