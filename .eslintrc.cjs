/** @type {import('@typescript-eslint/utils').TSESLint.FlatConfig.ConfigFile} */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier', // must be last — disables ESLint rules that conflict with Prettier
  ],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    // TypeScript — allow unused vars that start with underscore (common convention)
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    // React — not needed when using the new JSX transform
    'react/react-in-jsx-scope': 'off',
    // React — TypeScript already enforces prop types
    'react/prop-types': 'off',
  },
};
