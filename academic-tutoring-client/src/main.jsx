/**
 * Application Entry Point
 * 
 * Main entry point for the React application.
 * Initializes the React root and renders the App component with StrictMode.
 * 
 * Features:
 * - React 18 createRoot API
 * - StrictMode for development checks
 * - Global CSS imports
 * - Application mounting
 * 
 * @file main.jsx
 * @version 1.0.0
 * @author Academic Tutoring Team
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Create React root and render application
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
