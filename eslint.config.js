import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

const generatedAndBinaryIgnores = [
  "coverage/**",
  "data/generated/**",
  "data/qa/**",
  "data/source-snapshots/**",
  "dist/**",
  "node_modules/**",
  "package-lock.json",
  "prior-art/**",
  "work/runs/**"
];

export default tseslint.config(
  {
    ignores: generatedAndBinaryIgnores
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      globals: {
        ...globals.browser,
        ...globals.es2023
      },
      sourceType: "module"
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "no-undef": "off",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }]
    }
  },
  {
    files: ["src/domain/**/*.ts"],
    languageOptions: {
      globals: globals.es2023
    },
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "document", message: "Domain contracts must not depend on DOM APIs." },
        { name: "fetch", message: "Domain contracts must not perform network access." },
        { name: "localStorage", message: "Domain contracts must not depend on browser storage." },
        { name: "navigator", message: "Domain contracts must not depend on browser APIs." },
        { name: "sessionStorage", message: "Domain contracts must not depend on browser storage." },
        { name: "window", message: "Domain contracts must not depend on DOM APIs." }
      ],
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "react", message: "Domain contracts must stay framework-neutral." },
            { name: "react-dom", message: "Domain contracts must stay framework-neutral." },
            { name: "react/jsx-runtime", message: "Domain contracts must stay framework-neutral." }
          ],
          patterns: [
            {
              group: ["../app/*", "../../app/*", "src/app/*", "@/app/*"],
              message: "Domain contracts must not import app modules."
            },
            {
              group: ["../test/*", "../../test/*", "test/*"],
              message: "Domain contracts must not import test fixtures."
            },
            {
              group: ["../scripts/data/*", "../../scripts/data/*", "scripts/data/*"],
              message: "Domain contracts must not import data tooling."
            }
          ]
        }
      ]
    }
  },
  {
    files: ["vite.config.ts", "eslint.config.js"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.es2023
      }
    },
    rules: {
      "no-undef": "off"
    }
  }
);
