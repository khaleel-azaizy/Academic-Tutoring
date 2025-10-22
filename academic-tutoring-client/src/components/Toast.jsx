/**
 * Toast Notification Component
 * 
 * Displays temporary notification messages with different types and animations.
 * Provides user feedback for various actions and system states.
 * 
 * Features:
 * - Multiple notification types (success, error, warning, info)
 * - Auto-dismiss with configurable duration
 * - Smooth entrance and exit animations
 * - Manual close functionality
 * - Icon indicators for each type
 * - Accessible design
 * 
 * @component
 * @param {Object} props - Component props
 * @param {string} props.id - Unique identifier for the toast
 * @param {string} [props.type='info'] - Toast type (success, error, warning, info)
 * @param {string} props.title - Toast title text
 * @param {string} props.message - Toast message content
 * @param {number} [props.duration=5000] - Auto-dismiss duration in milliseconds
 * @param {Function} props.onClose - Function to call when toast is closed
 * @returns {JSX.Element} Toast notification component
 */

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import './Toast.css';

const Toast = ({ 
  id, 
  type = 'info', 
  title, 
  message, 
  duration = 5000, 
  onClose 
}) => {
  // Animation state management
  const [isVisible, setIsVisible] = useState(false); // Controls entrance animation
  const [isLeaving, setIsLeaving] = useState(false); // Controls exit animation

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-close timer
    const autoCloseTimer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoCloseTimer);
    };
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match CSS transition duration
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <XCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
      default:
        return <Info size={20} />;
    }
  };

  const getTypeClass = () => {
    switch (type) {
      case 'success':
        return 'toast-success';
      case 'error':
        return 'toast-error';
      case 'warning':
        return 'toast-warning';
      case 'info':
      default:
        return 'toast-info';
    }
  };

  return (
    <div 
      className={`toast ${getTypeClass()} ${isVisible ? 'toast-visible' : ''} ${isLeaving ? 'toast-leaving' : ''}`}
      role="alert"
      aria-live="polite"
    >
      <div className="toast-content">
        <div className="toast-icon">
          {getIcon()}
        </div>
        <div className="toast-body">
          {title && <div className="toast-title">{title}</div>}
          <div className="toast-message">{message}</div>
        </div>
        <button 
          className="toast-close"
          onClick={handleClose}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
      <div className="toast-progress">
        <div className="toast-progress-bar" style={{ animationDuration: `${duration}ms` }} />
      </div>
    </div>
  );
};

export default Toast;

