/**
 * Login Component
 * 
 * Handles user authentication and login functionality.
 * Provides a secure login form with validation and error handling.
 * 
 * Features:
 * - Email and password authentication
 * - Form validation with error messages
 * - Password visibility toggle
 * - Loading states during authentication
 * - Automatic redirect after successful login
 * - Toast notifications for user feedback
 * 
 * @component
 * @returns {JSX.Element} Login form interface
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { authAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import '../styles/Auth.css';

const Login = () => {
  // Navigation and toast utilities
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  
  // Form state management
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false); // Loading state during authentication
  const [showPassword, setShowPassword] = useState(false); // Password visibility toggle

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
  };

  const validateForm = () => {
    if (!formData.email.trim()) {
      showError('Email is required');
      return false;
    }
    if (!formData.email.includes('@')) {
      showError('Invalid email format');
      return false;
    }
    if (!formData.password) {
      showError('Password is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const loginData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password
      };

      const response = await authAPI.login(loginData);
      
      // Store user data
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      showSuccess('Login successful!');
      // Redirect based on user role
      const userRole = response.user?.role;
      switch (userRole) {
        case 'Teacher':
          navigate('/employee-dashboard');
          break;
        case 'Parent':
          navigate('/parent-dashboard');
          break;
        case 'Student':
          navigate('/student-dashboard');
          break;
        default:
          navigate('/dashboard');
      }

    } catch (error) {
      console.error('Login error:', error);
      showError(error.error || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card login-card">
        <div className="auth-header">
          <h1 className="auth-title">Login</h1>
          <p className="auth-subtitle">Welcome back to our platform</p>
        </div>


        <form onSubmit={handleSubmit} className="auth-form login-form">
          <div className="form-group">
            <label className="form-label">
              <Mail className="icon" size={16} />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your email address"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock className="icon" size={16} />
              Password
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="form-input password-input"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-button login-button"
            disabled={loading}
          >
            {loading ? (
              <>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="auth-link">
          Don't have an account yet?
          <Link to="/register">Sign up here</Link>
        </div>

        
      </div>
    </div>
  );
};

export default Login;