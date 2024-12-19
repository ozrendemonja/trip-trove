module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true
  },
  parserOptions: {
    ecmaFeatures: { jsx: true },
    sourceType: "module"
  },
  ignorePatterns: ["node_modules/*", "src/clients/manager/*"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:prettier/recommended"
  ],
  plugins: ["prettier", "check-file"],
  settings: {
    react: {
      version: "detect",
      "import/resolver": {
        typescript: {}
      }
    }
  },
  overrides: [
    {
      files: ["**/*.js", "**/*.ts", "**/*.tsx"],
      parser: "@typescript-eslint/parser",
      env: { browser: true, es6: true, node: true },
      extends: [
        "eslint:recommended",
        "plugin:prettier/recommended",
        "plugin:@typescript-eslint/recommended",
        "plugin:import/errors",
        "plugin:import/typescript",
        "plugin:react/recommended",
        "plugin:react-hooks/recommended",
        "plugin:jsx-a11y/recommended",
        "plugin:jest-dom/recommended",
        "plugin:testing-library/react"
      ],
      rules: {
        "import/no-restricted-paths": [
          "error",
          {
            zones: [
              // disables cross-feature imports:
              // eg. src/features/continent should not import from src/features/countries, etc.
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
        "@typescript-eslint/no-unused-vars": [
          "warn",
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
        ],
        "check-file/filename-naming-convention": [
          "error",
          {
            "**/*.{ts,tsx}": "PASCAL_CASE"
          },
          {
            ignoreMiddleExtensions: true
          }
        ]
      }
    },
    {
      plugins: ["check-file"],
      files: ["src/**/!(__tests__)/*"],
      rules: {
        "check-file/folder-naming-convention": [
          "error",
          {
            "**/*": "KEBAB_CASE"
          }
        ]
      }
    }
  ]
};
