/**
 * Main App Component
 * 
 * Root application component that sets up routing, context providers, and global configuration.
 * Handles authentication routing and role-based access control.
 * 
 * Features:
 * - React Router setup with protected routes
 * - Context providers for theme and notifications
 * - Role-based route protection
 * - Public and private route separation
 * - Global CSS imports
 * 
 * @component
 * @returns {JSX.Element} Main application component
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <Router>
          <div className="App">
            <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Role-specific dashboards */}
          <Route 
            path="/employee-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Teacher']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/parent-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Parent']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/student-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Student']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </div>
        </Router>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
