/**
 * Modal Component
 * 
 * Reusable modal dialog component with keyboard navigation and accessibility features.
 * Provides a consistent modal interface throughout the application.
 * 
 * Features:
 * - Keyboard navigation (ESC to close)
 * - Click outside to close
 * - Customizable width and full-width option
 * - Accessible close button
 * - Event propagation handling
 * 
 * @component
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {string} props.title - Modal title text
 * @param {Function} props.onClose - Function to call when modal should close
 * @param {React.ReactNode} props.children - Modal content
 * @param {number} [props.maxWidth=560] - Maximum width of the modal
 * @param {boolean} [props.isFullWidth=false] - Whether to use full width
 * @returns {JSX.Element|null} Modal component or null if not open
 */

import { useEffect } from 'react';

const Modal = ({ isOpen, title, onClose, children, maxWidth = 560, isFullWidth = false }) => {
  /**
   * Handle keyboard navigation
   * Adds ESC key listener when modal is open, removes when closed
   */
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) {
      document.addEventListener('keydown', onKey);
    }
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className={`modal-content ${isFullWidth ? 'modal-full-width' : ''}`} 
        style={isFullWidth ? {} : { maxWidth }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button onClick={onClose} className="modal-close-btn" title="Close">×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;


