import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import eslintPluginAstro from 'eslint-plugin-astro';
import pluginReact from "eslint-plugin-react";
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    ignores: ['**/dist', '**/node_modules', '**/.astro', '**/.github', '**/.changeset'],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: { globals: globals.browser },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    }
  },

  // Apply React rules only to JSX/TSX files
  {
    files: ["**/*.{jsx,tsx}"],
    ...pluginReact.configs.flat.recommended,
    rules: {
      ...pluginReact.configs.flat.recommended.rules,
      "react/react-in-jsx-scope": "off",
    }
  },

  ...eslintPluginAstro.configs.recommended,
]);
