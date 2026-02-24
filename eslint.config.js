/* eslint-disable no-console */

import globals from "globals";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import unusedImports from "eslint-plugin-unused-imports";
import mochaLint from "eslint-plugin-mocha";
import love from "eslint-config-love";

export default [
  {
    ...love,
    files: ["**/*.js", "**/*.ts"],
  },
  // JS/Default config (no parser override)
  {
    files: ["**/*.js", "**/*.ts"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  // TypeScript config (only for TS files)
  {
    files: ["src/**/*.ts", "scripts/**/*.ts", "config.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "unused-imports": unusedImports,
    },
    rules: {
      indent: "off", // Prettier is handling this
      "linebreak-style": "off", // Prettier is handling this
      quotes: "off", // Prettier is handling this
      semi: "off", // Prettier is handling this
      "no-negated-condition": "off",
      "no-plusplus": "off", // Allow usage of unary operator
      "no-restricted-syntax": [
        "error",
        {
          selector:
            ':matches(PropertyDefinition, MethodDefinition)[accessibility="private"]',
          message: "Use '#classMember' instead of 'private classMember'",
        },
      ],
      eqeqeq: ["error", "smart"],
      "@typescript-eslint/consistent-type-definitions": ["error", "interface"],
      "@typescript-eslint/no-magic-numbers": "off",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/prefer-promise-reject-errors": "off", // Using for custom error handler
      "@typescript-eslint/no-extraneous-class": [
        "error",
        { allowStaticOnly: true },
      ],
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          allowNullableString: true,
        },
      ],
      "@typescript-eslint/triple-slash-reference": [
        "error",
        { path: "never", types: "prefer-import", lib: "never" },
      ],
      "@typescript-eslint/no-var-requires": "error",
      "@typescript-eslint/prefer-destructuring": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/class-methods-use-this": "off",
      "@typescript-eslint/max-params": "off",
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      "eslint-comments/require-description": "off",
      "@typescript-eslint/strict-void-return": "warn", // Allow async function to be used when void is expected
      "require-unicode-regexp": "warn", // Allow regex without unicode flag in tests
      "require-atomic-updates": "warn",
      "@eslint-community/eslint-comments/require-description": "warn",
      "no-restricted-imports": [
        "error",
        {
          patterns: [".*"],
        },
      ],
    },
  },
  {
    files: ["tests/**/*.spec.ts", "tests/**/*.ts", "playwright.config.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.chai,
        ...globals.mocha,
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "unused-imports": unusedImports,
      "eslint-plugin-mocha": mochaLint,
    },
    rules: {
      "no-plusplus": "off",
      "no-param-reassign": "off",
      "no-await-in-loop": "off",
      eqeqeq: ["error", "smart"],
      "max-lines": "off",
      "max-nested-callbacks": "off",
      "promise/avoid-new": "off",
      "eslint-comments/require-description": "off",
      "@typescript-eslint/no-unsafe-type-assertion": "off",
      "@typescript-eslint/no-magic-numbers": "off",
      "@typescript-eslint/prefer-destructuring": "off",
      "@typescript-eslint/init-declarations": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/consistent-type-assertions": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/strict-void-return": "off", // Allow async function to be used when void is expected
      "require-unicode-regexp": "off", // Allow regex without unicode flag in tests
      "@eslint-community/eslint-comments/require-description": "warn",
      "no-restricted-imports": [
        "error",
        {
          patterns: [".*"],
        },
      ],
    },
  },
  // Add a separate config for declaration files
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // Sometimes needed in d.ts
      "@typescript-eslint/no-empty-interface": "off", // Sometimes needed in d.ts
      "@typescript-eslint/no-namespace": "off", // Namespaces are allowed in d.ts
    },
  },
  {
    ignores: [
      "node_modules/*",
      "public/*",
      "playwright-test-results/*",
      "eslint.config.js", // Parsing error this file was not found by the project service. Consider either including it in the `tsconfig.json` or including it in `allowDefaultProject`
    ],
  },
];
