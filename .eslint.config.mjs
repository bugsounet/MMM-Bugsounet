import globals from "globals";
import eslintPluginStylistic from "@stylistic/eslint-plugin";
import {configs as eslintPluginDepend_configs} from "eslint-plugin-depend";
import {flatConfigs as eslintPluginImportX_flatConfigs} from "eslint-plugin-import-x";
import eslintPluginJs from "@eslint/js";
import eslintPluginPackageJson from "eslint-plugin-package-json";

const config = [
  eslintPluginDepend_configs["flat/recommended"],
  eslintPluginImportX_flatConfigs.recommended,
  eslintPluginJs.configs.recommended,
  eslintPluginPackageJson.configs.recommended,
  {
    "files": ["**/*.js"],
    "languageOptions": {
      "ecmaVersion": "latest",
      "globals": {
        ...globals.browser,
        ...globals.node,
        "config": true,
        "Log": true,
        "MM": true,
        "Module": true,
        "moment": true,
        "document": true,
        "windows": true,
        "configMerge": true
      }
    },
    "plugins": {
      ...eslintPluginStylistic.configs["all-flat"].plugins
    },
    "rules": {
      ...eslintPluginStylistic.configs["all-flat"].rules,
      "@stylistic/array-element-newline": ["error", "consistent"],
      "@stylistic/arrow-parens": ["error", "always"],
      "@stylistic/brace-style": "off",
      "@stylistic/comma-dangle": ["error", "never"],
      "@stylistic/dot-location": ["error", "property"],
      "@stylistic/function-call-argument-newline": ["error", "consistent"],
      "@stylistic/function-paren-newline": ["error", "consistent"],
      "@stylistic/implicit-arrow-linebreak": ["error", "beside"],
      "@stylistic/indent": ["error", 2],
      "@stylistic/max-statements-per-line": ["error", {"max": 2}],
      "@stylistic/multiline-comment-style": "off",
      "@stylistic/multiline-ternary": ["error", "always-multiline"],
      "@stylistic/newline-per-chained-call": ["error", {"ignoreChainWithDepth": 4}],
      "@stylistic/no-extra-parens": "off",
      "@stylistic/no-tabs": "off",
      "@stylistic/object-curly-spacing": ["error", "always"],
      "@stylistic/object-property-newline": ["error", {"allowAllPropertiesOnSameLine": true}],
      "@stylistic/operator-linebreak": ["error", "before"],
      "@stylistic/padded-blocks": "off",
      "@stylistic/quote-props": ["error", "as-needed"],
      "@stylistic/quotes": ["error", "double"],
      "@stylistic/semi": ["error", "always"],
      "@stylistic/space-before-function-paren": ["error", "always"],
      "@stylistic/spaced-comment": "off",
      "eqeqeq": "error",
      "id-length": "off",
      "import-x/order": "error",
      "import-x/newline-after-import": "error",
      "import-x/no-unresolved": "error",
      "init-declarations": "off",
      "max-lines-per-function": ["warn", 400],
      "max-statements": "off",
      "no-global-assign": "off",
      "no-inline-comments": "off",
      "no-magic-numbers": "off",
      "no-param-reassign": "error",
      "no-plusplus": "off",
      "no-prototype-builtins": "off",
      "no-ternary": "off",
      "no-throw-literal": "error",
      "no-undefined": "off",
      "no-unused-vars": "error",
      "no-useless-return": "error",
      "no-warning-comments": "off",
      "object-shorthand": ["error", "methods"],
      "one-var": "off",
      "prefer-destructuring": "off",
      "prefer-template": "error",
      "sort-keys": "off"
    }
  },
  {
    "files": [".eslint.config.mjs"],
    "languageOptions": {
      "ecmaVersion": "latest",
      "globals": {
        ...globals.node
      },
      "sourceType": "module"
    },
    "plugins": {
      ...eslintPluginStylistic.configs["all-flat"].plugins
    },
    "rules": {
      ...eslintPluginStylistic.configs["all-flat"].rules,
      "@stylistic/indent": ["error", 2],
      "@stylistic/array-element-newline": "off",
      "@stylistic/function-call-argument-newline": "off",
      "import-x/no-unresolved": "off"
    }
  },
  {
    "files": ["**/package.json"],
    "rules": {
      "package-json/valid-name": "off"
    }
  },
  {
    "ignores": ["*.js", "components/**/*.js"]
  },
  {
    "ignores": ["EXTs/EXT-*/*.js", "EXTs/EXT-*/components/**/*.js"]
  },
  {
    "ignores": ["website/assets/js/*.js", "website/**/*.min.js"]
  },
  {
    "ignores": ["EXTs/EXT-SmartHome/website/assets/js/*.js", "EXTs/EXT-SmartHome/website/**/*.min.js"]
  },
  {
    "ignores": ["website/tools/*.js"]
  }
];

export default config;
