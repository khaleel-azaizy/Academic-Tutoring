/**
 * Toast Context
 * 
 * React context for managing toast notifications throughout the application.
 * Provides centralized notification management with different types and durations.
 * 
 * Features:
 * - Multiple notification types (success, error, warning, info)
 * - Configurable duration and auto-dismiss
 * - Queue management for multiple toasts
 * - Convenience methods for common notifications
 * - Context provider and hook
 * 
 * @file ToastContext.jsx
 * @version 1.0.0
 * @author Academic Tutoring Team
 */

import { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';
import '../components/Toast.css';

// Create toast context
const ToastContext = createContext();

/**
 * Custom hook to access toast context
 * Throws error if used outside of ToastProvider
 * 
 * @returns {Object} Toast context value with notification methods
 * @throws {Error} If used outside ToastProvider
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

/**
 * Toast Provider Component
 * 
 * Provides toast notification context to child components with queue management.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Toast provider wrapper with notification container
 */
export const ToastProvider = ({ children }) => {
  // State for managing toast queue
  const [toasts, setToasts] = useState([]);

  /**
   * Add a new toast notification to the queue
   * 
   * @param {Object} toast - Toast configuration
   * @param {string} [toast.type='info'] - Toast type (success, error, warning, info)
   * @param {string} toast.title - Toast title
   * @param {string} toast.message - Toast message
   * @param {number} [toast.duration=5000] - Auto-dismiss duration in milliseconds
   * @returns {number} Toast ID for manual removal
   */
  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      type: 'info',
      duration: 5000,
      ...toast
    };
    
    setToasts(prev => [...prev, newToast]);
    return id;
  }, []);

  /**
   * Remove a specific toast by ID
   * 
   * @param {number} id - Toast ID to remove
   */
  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * Clear all toast notifications
   */
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, title = 'Success', duration = 5000) => {
    return addToast({ type: 'success', title, message, duration });
  }, [addToast]);

  const showError = useCallback((message, title = 'Error', duration = 7000) => {
    return addToast({ type: 'error', title, message, duration });
  }, [addToast]);

  const showWarning = useCallback((message, title = 'Warning', duration = 6000) => {
    return addToast({ type: 'warning', title, message, duration });
  }, [addToast]);

  const showInfo = useCallback((message, title = 'Info', duration = 5000) => {
    return addToast({ type: 'info', title, message, duration });
  }, [addToast]);

  const value = {
    addToast,
    removeToast,
    clearAllToasts,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    toasts
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

