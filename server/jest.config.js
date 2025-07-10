// server/jest.config.js
module.exports = {
  testEnvironment: 'node', // Use Node.js environment for backend tests
  verbose: true, // Output more information during tests
  roots: ['<rootDir>/src'], // Look for tests within the src directory
  testMatch: [ // Patterns to discover test files
    '**/__tests__/**/*.test.[jt]s?(x)', // Standard Jest __tests__ folder
    '**/?(*.)+(spec|test).[jt]s?(x)', // Files with .spec.js/ts or .test.js/ts
  ],
  moduleFileExtensions: ['js', 'json', 'node'],
  collectCoverage: true, // Enable coverage collection
  coverageDirectory: '<rootDir>/coverage', // Output directory for coverage reports
  coverageReporters: ['json', 'lcov', 'text', 'clover', 'html'], // Coverage report formats
  coveragePathIgnorePatterns: [ // Files/directories to ignore for coverage
    '/node_modules/',
    '/coverage/',
    '/config/', // Example: if you have a config folder not worth testing directly
    // Add other paths like specific placeholder files if necessary
    // 'src/services/emailService.js', // Example: if it's mostly placeholder
    // 'src/services/socialService.js', // Example: if it's mostly placeholder
  ],
  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Setup files to run before each test file (e.g., for global setup, environment variables)
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Corrected path from <rootDir>

  // Test timeout (default is 5000ms)
  // testTimeout: 10000,

  // Indicates whether each individual test should be reported during the run
  // verbose: true, // Already set above

  // An array of regexp pattern strings that are matched against all source file paths before transformation.
  // transformIgnorePatterns: ['/node_modules/', '\\.pnp\\.[^\\/]+$'],

  // If you're using Babel or TypeScript, you'd configure transformers here
  // transform: {
  //   '^.+\\.js$': 'babel-jest', // If using Babel
  //   '^.+\\.ts$': 'ts-jest',    // If using TypeScript
  // },

  // If tests are slow, you can run them in band (sequentially)
  // runInBand: true, // Already added to package.json script for now
};
