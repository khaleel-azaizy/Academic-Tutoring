/**
 * Vite Configuration
 * 
 * Build tool configuration for the React frontend application.
 * Sets up development server, build process, and React compiler optimization.
 * 
 * Features:
 * - React plugin with JSX support
 * - React compiler for performance optimization
 * - Hot module replacement for development
 * - Production build optimization
 * 
 * @file vite.config.js
 * @version 1.0.0
 * @author Academic Tutoring Team
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite configuration for React application
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        // Enable React compiler for performance optimization
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
})
