/** @type {import('jest').Config} */
const path = require('path');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': path.resolve(__dirname, 'src/$1'), // <-- __dirname = backend/
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  setupFilesAfterEnv: [path.resolve(__dirname, 'test/setup.ts')],
  collectCoverage: true,
  coverageDirectory: path.resolve(__dirname, 'coverage'),
  roots: [path.resolve(__dirname, 'src'), path.resolve(__dirname, 'test')],
};
