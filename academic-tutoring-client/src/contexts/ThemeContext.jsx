/**
 * Theme Context
 * 
 * React context for managing application theme (dark/light mode).
 * Provides theme state and toggle functionality with persistence.
 * 
 * Features:
 * - Dark and light theme support
 * - System preference detection
 * - Local storage persistence
 * - CSS custom properties management
 * - Context provider and hook
 * 
 * @file ThemeContext.jsx
 * @version 1.0.0
 * @author Academic Tutoring Team
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

// Create theme context
const ThemeContext = createContext();

/**
 * Custom hook to access theme context
 * Throws error if used outside of ThemeProvider
 * 
 * @returns {Object} Theme context value
 * @throws {Error} If used outside ThemeProvider
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/**
 * Theme Provider Component
 * 
 * Provides theme context to child components with persistence and system preference detection.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Theme provider wrapper
 */
export const ThemeProvider = ({ children }) => {
  // Initialize theme state with preference detection
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage first for user preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    
    // Check system preference as fallback
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return true;
    }
    
    // Default to light mode
    return false;
  });

  useEffect(() => {
    // Update CSS custom properties
    const root = document.documentElement;
    
    if (isDarkMode) {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
    } else {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
    }
    
    // Save to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const value = {
    isDarkMode,
    toggleTheme,
    theme: isDarkMode ? 'dark' : 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
