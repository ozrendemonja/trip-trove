const js = require("@eslint/js");
const { fixupPluginRules } = require("@eslint/compat");
const importPlugin = require("eslint-plugin-import");
const jestDom = require("eslint-plugin-jest-dom");
const jsxA11y = require("eslint-plugin-jsx-a11y");
const prettier = require("eslint-plugin-prettier");
const prettierRecommended = require("eslint-plugin-prettier/recommended");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const testingLibrary = require("eslint-plugin-testing-library");
const tseslint = require("typescript-eslint");
const globals = require("globals");

const sourceFiles = ["src/**/*.{js,ts,tsx}"];
const normalizeGlobals = (values) =>
  Object.fromEntries(
    Object.entries(values).map(([name, setting]) => [name.trim(), setting])
  );

module.exports = [
  {
    ignores: ["node_modules/**", "src/clients/manager/**"]
  },
  {
    ...js.configs.recommended,
    files: sourceFiles
  },
  ...tseslint.configs.recommended.map((config) => ({
    ...config,
    files: sourceFiles
  })),
  {
    files: sourceFiles,
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        ecmaFeatures: { jsx: true }
      },
      globals: {
        ...normalizeGlobals(globals.browser),
        ...normalizeGlobals(globals.node)
      }
    },
    plugins: {
      import: fixupPluginRules(importPlugin),
      "jest-dom": fixupPluginRules(jestDom),
      "jsx-a11y": fixupPluginRules(jsxA11y),
      prettier: fixupPluginRules(prettier),
      react: fixupPluginRules(react),
      "react-hooks": fixupPluginRules(reactHooks),
      "testing-library": fixupPluginRules(testingLibrary)
    },
    settings: {
      react: { version: "detect" },
      "import/extensions": [".js", ".jsx", ".ts", ".tsx"],
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"]
      },
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json"
        },
        node: {
          extensions: [".js", ".jsx", ".ts", ".tsx"]
        }
      }
    },
    rules: {
      ...importPlugin.flatConfigs.errors.rules,
      ...importPlugin.flatConfigs.typescript.rules,
      ...react.configs.flat.recommended.rules,
      ...react.configs.flat["jsx-runtime"].rules,
      ...jsxA11y.flatConfigs.recommended.rules,
      ...jestDom.configs["flat/recommended"].rules,
      ...prettierRecommended.rules,
      "import/no-restricted-paths": [
        "error",
        {
          zones: [
            {
              target: "./src/features/continent",
              from: "./src/features",
              except: ["./continent"]
            }
          ]
        }
      ],
      "import/no-cycle": "error",
      "linebreak-style": ["error", "windows"],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_"
        }
      ],
      "@typescript-eslint/explicit-function-return-type": [
        "warn",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true
        }
      ]
    }
  },
  {
    files: ["src/**/__tests__/**/*.{js,ts,tsx}"],
    rules: {
      ...testingLibrary.configs["flat/react"].rules
    }
  }
];
