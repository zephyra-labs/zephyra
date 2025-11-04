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
  collectCoverage: true,
  coverageDirectory: 'coverage',
  roots: ['<rootDir>/src', '<rootDir>/test'],
};
