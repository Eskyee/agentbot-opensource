import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      "@next/next/no-html-link-for-pages": "off",
      "react/no-unescaped-entities": "warn",
      "react/jsx-no-duplicate-props": "error",
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
  {
    ignores: ["node_modules/", ".next/", "dist/"],
  }
);
