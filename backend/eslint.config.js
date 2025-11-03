import parser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettier from "eslint-config-prettier";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  // --- Files / folders to ignore ---
  {
    ignores: [
      "node_modules",
      "dist",
      "coverage",
      "jest.config.cjs",
    ],
  },

  // --- TypeScript (src & test) ---
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: ["./tsconfig.json"],
      },
      globals: {
        console: "readonly",
        process: "readonly",
        jest: "readonly",
        describe: "readonly",
        it: "readonly",
        expect: "readonly",
        beforeEach: "readonly",
        afterEach: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      "no-console": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
  },

  // --- Relaxed rules for test files ---
  {
    files: ["**/__tests__/**/*.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },

  // --- JavaScript config files ---
  {
    files: ["*.js", "*.cjs", "*.mjs"],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
    rules: {
      "no-console": "off",
    },
  },

  // --- Prettier integration ---
  prettier,
];
