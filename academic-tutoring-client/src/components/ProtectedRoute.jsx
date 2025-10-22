/**
 * Protected Route Component
 * 
 * Route protection wrapper that handles authentication and role-based access control.
 * Redirects unauthorized users and enforces role-based permissions.
 * 
 * Features:
 * - Authentication checking via localStorage
 * - Role-based access control
 * - Automatic redirects for unauthorized access
 * - Flexible role requirements
 * - Secure route protection
 * 
 * @component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authorized
 * @param {Array} [props.allowedRoles=[]] - Array of allowed user roles
 * @returns {JSX.Element} Protected route wrapper or redirect component
 */

import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required and user doesn't have them
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // User is authenticated and authorized, render children
  return children;
};

export default ProtectedRoute;