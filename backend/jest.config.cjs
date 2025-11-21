/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', 
    '^@/config/firebase$': '<rootDir>/src/config/__mocks__/firebase.ts',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  
  // Coverage
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['json', 'text', 'lcov'], // json = file, text = console, lcov = html
  
  // Roots
  roots: ['<rootDir>/src', '<rootDir>/test'],

  // Reporters
  reporters: [
    "default",
    ["jest-stare", {
      "resultDir": "jest-stare",
      "reportTitle": "Test Report",
      "additionalResultsProcessors": []
    }]
  ],
};
