/**
 * ESLint Configuration
 * 
 * Code linting configuration for the React frontend application.
 * Enforces code quality, React best practices, and consistent coding standards.
 * 
 * Features:
 * - JavaScript and React JSX linting
 * - React Hooks rules enforcement
 * - React Refresh plugin for Vite
 * - Custom rules for unused variables
 * - Browser globals support
 * 
 * @file eslint.config.js
 * @version 1.0.0
 * @author Academic Tutoring Team
 */

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Global ignores for build output
  globalIgnores(['dist']),
  {
    // Target JavaScript and JSX files
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended, // Standard JavaScript rules
      reactHooks.configs['recommended-latest'], // React Hooks rules
      reactRefresh.configs.vite, // React Refresh for Vite
    ],
    languageOptions: {
      ecmaVersion: 2020, // ECMAScript version
      globals: globals.browser, // Browser global variables
      parserOptions: {
        ecmaVersion: 'latest', // Latest ECMAScript features
        ecmaFeatures: { jsx: true }, // Enable JSX parsing
        sourceType: 'module', // Use ES modules
      },
    },
    rules: {
      // Allow unused variables that start with uppercase (constants)
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
])
