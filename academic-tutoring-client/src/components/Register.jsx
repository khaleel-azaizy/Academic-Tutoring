import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import '../styles/Auth.css';

const Register = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    phoneNumber: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({
      ...prev,
      role
    }));
  };

  const validateForm = () => {
    if (!formData.firstName.trim()) {
      showError('First name is required');
      return false;
    }
    if (!formData.lastName.trim()) {
      showError('Last name is required');
      return false;
    }
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
    if (formData.password.length < 6) {
      showError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      return false;
    }
    if (!formData.role) {
      showError('Please select a user type');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        phoneNumber: formData.phoneNumber.trim() || undefined
      };

      const response = await authAPI.register(registrationData);
      
      showSuccess('Registration successful! Redirecting to dashboard...');
      
      // Store user data
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error) {
      console.error('Registration error:', error);
      showError(error.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <h1 className="auth-title">Sign Up</h1>
          <p className="auth-subtitle">Join our tutoring platform</p>
        </div>


        <form onSubmit={handleSubmit} className="auth-form two-column">
          {/* Left Column: Personal Information */}
          <div className="form-column">
            <div className="form-section">
              <h3 className="form-section-title">Personal Information</h3>
              <div className="form-group">
                <label className="form-label">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter first name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter last name"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter email address"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter phone number"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Account Type & Security */}
          <div className="form-column">
            <div className="form-section">
              <h3 className="form-section-title">Account Type</h3>
              <div className="role-selection">
                <div
                  className={`role-option ${formData.role === 'Parent' ? 'selected' : ''}`}
                  onClick={() => handleRoleSelect('Parent')}
                >
                  Parent
                </div>
                <div
                  className={`role-option ${formData.role === 'Student' ? 'selected' : ''}`}
                  onClick={() => handleRoleSelect('Student')}
                >
                  Student
                </div>
                <div
                  className={`role-option ${formData.role === 'Teacher' ? 'selected' : ''}`}
                  onClick={() => handleRoleSelect('Teacher')}
                >
                  Teacher
                </div>
              </div>
            </div>

            <div className="form-section">
              <h3 className="form-section-title">Security</h3>
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Enter password (at least 6 characters)"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="auth-button full-width"
            disabled={loading}
          >
            {loading ? (
              <>
                Signing up...
                <span className="loading-spinner"></span>
              </>
            ) : (
              'Sign Up'
            )}
          </button>
        </form>

        <div className="auth-link">
          Already have an account?
          <Link to="/login">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;