/**
 * Profile Component
 * 
 * User profile management interface with editing capabilities and role-specific features.
 * Handles profile updates, specializations (for teachers), and account management.
 * 
 * Features:
 * - Profile information editing
 * - Role-specific fields (grade for students, specializations for teachers)
 * - Teacher meeting link management
 * - Specialization selection for teachers
 * - Account deletion with confirmation
 * - Form validation and error handling
 * - Loading states for async operations
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user data
 * @param {Function} props.onUpdateUser - User update handler
 * @param {Function} props.onDeleteAccount - Account deletion handler
 * @returns {JSX.Element} Profile management interface
 */

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  GraduationCap, 
  Users, 
  User, 
  Edit3, 
  Save, 
  X, 
  Trash2, 
  AlertTriangle,
  BookOpen,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { roleAPI } from '../services/api';

const Profile = ({ user, onUpdateUser, onDeleteAccount }) => {
  // Profile editing state
  const [isEditing, setIsEditing] = useState(false); // Whether profile is in edit mode
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    grade: user?.grade || '',
    teacherMeetingLink: user?.teacherMeetingLink || ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Show delete confirmation dialog
  
  // Teacher specialization state
  const [availableSubjects, setAvailableSubjects] = useState([]); // Available subjects for selection
  const [selectedSpecializations, setSelectedSpecializations] = useState(user?.specializations || []); // Selected specializations
  const [isEditingSpecializations, setIsEditingSpecializations] = useState(false); // Specialization edit mode
  const [specializationsLoading, setSpecializationsLoading] = useState(false); // Loading state for specializations

  // Load available subjects for teachers
  useEffect(() => {
    if (user?.role === 'Teacher') {
      loadAvailableSubjects();
    }
  }, [user?.role]);

  // Update selected specializations when user data changes
  useEffect(() => {
    setSelectedSpecializations(user?.specializations || []);
  }, [user?.specializations]);

  // Initialize user with default values if they don't exist
  useEffect(() => {
    if (user?.role === 'Teacher' && user?.specializations === undefined) {
      setSelectedSpecializations([]);
    }
  }, [user]);

  const loadAvailableSubjects = async () => {
    // Use hardcoded subjects to ensure it works
    const subjects = [
      'Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology',
      'History', 'Geography', 'Computer Science', 'Art', 'Music', 'Physical Education',
      'Spanish', 'French', 'German', 'Economics', 'Psychology', 'Sociology',
      'Literature', 'Writing', 'Reading', 'Algebra', 'Geometry', 'Calculus',
      'Statistics', 'Trigonometry', 'Pre-Calculus', 'World History', 'US History',
      'Government', 'Philosophy', 'Religion', 'Environmental Science', 'Astronomy'
    ];
    
    setAvailableSubjects(subjects);
    
    // Also try API call for future use
    try {
      const data = await roleAPI.getAvailableSubjects();
      if (data.subjects && data.subjects.length > 0) {
        setAvailableSubjects(data.subjects);
      }
    } catch (error) {
      // API call failed, using hardcoded subjects
    }
  };

  const handleSpecializationToggle = (subject) => {
    setSelectedSpecializations(prev => {
      if (prev.includes(subject)) {
        return prev.filter(s => s !== subject);
      } else {
        return [...prev, subject];
      }
    });
  };

  const handleSaveSpecializations = async () => {
    if (selectedSpecializations.length === 0) {
      alert('Please select at least one subject to specialize in.');
      return;
    }

    try {
      setSpecializationsLoading(true);
      const data = await roleAPI.updateSpecializations(selectedSpecializations);
      
      // Update the user object with new specializations
      onUpdateUser({
        ...user,
        specializations: data.specializations,
        isProfileComplete: data.isProfileComplete
      });
      
      setIsEditingSpecializations(false);
    } catch (error) {
      console.error('Failed to update specializations:', error);
      alert('Failed to update specializations. Please try again.');
    } finally {
      setSpecializationsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      grade: user?.grade || '',
      teacherMeetingLink: user?.teacherMeetingLink || ''
    });
  };

  const handleSave = async () => {
    try {
      await onUpdateUser(editForm);
      setIsEditing(false);
    } catch (error) {
      console.error('Update failed:', error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      grade: user?.grade || '',
      teacherMeetingLink: user?.teacherMeetingLink || ''
    });
  };

  const handleDeleteAccount = async () => {
    try {
      await onDeleteAccount();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'Teacher':
        return { icon: UserCheck, color: '#667eea', description: 'Educator and instructor' };
      case 'Student':
        return { icon: GraduationCap, color: '#28a745', description: 'Learning and growing' };
      case 'Parent':
        return { icon: Users, color: '#fd7e14', description: 'Supporting your child\'s education' };
      default:
        return { icon: User, color: '#6c757d', description: 'User account' };
    }
  };

  const roleInfo = getRoleDisplay(user?.role);

  return (
    <div className="profile-container">
      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-avatar" style={{ backgroundColor: roleInfo.color }}>
            <span className="avatar-icon"><roleInfo.icon size={32} /></span>
          </div>
          
          <div className="profile-info">
            <h1 className="profile-name">{user?.firstName} {user?.lastName}</h1>
            <p className="profile-role" style={{ color: roleInfo.color }}>
              {user?.role}
            </p>
            <p className="profile-description">{roleInfo.description}</p>
          </div>
        </div>

        <div className="profile-details">
          <div className="details-header">
            <h2>Personal Information</h2>
            {!isEditing && (
              <button className="edit-button" onClick={handleEdit}>
                <span className="edit-icon"><Edit3 size={16} /></span>
                Edit Profile
              </button>
            )}
          </div>
          
          {isEditing ? (
            <div className="edit-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input
                    type="text"
                    value={editForm.lastName}
                    onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={editForm.phoneNumber}
                  onChange={(e) => setEditForm({ ...editForm, phoneNumber: e.target.value })}
                  className="form-input"
                  placeholder="Enter phone number"
                />
              </div>
              
              {user?.role === 'Student' && (
                <div className="form-group">
                  <label>Grade Level</label>
                  <input
                    type="text"
                    value={editForm.grade}
                    onChange={(e) => setEditForm({ ...editForm, grade: e.target.value })}
                    className="form-input"
                    placeholder="Enter grade level"
                  />
                </div>
              )}
              
              {user?.role === 'Teacher' && (
                <div className="form-group">
                  <label>Meeting Link</label>
                  <input
                    type="url"
                    value={editForm.teacherMeetingLink}
                    onChange={(e) => setEditForm({ ...editForm, teacherMeetingLink: e.target.value })}
                    className="form-input"
                    placeholder="https://zoom.us/j/your-room-id"
                  />
                  <small className="form-help">Your personal meeting room link (Zoom, Google Meet, etc.)</small>
                </div>
              )}
              
              <div className="form-actions">
                <button className="save-button" onClick={handleSave}>
                  <span className="save-icon"><Save size={16} /></span>
                  Save Changes
                </button>
                <button className="cancel-button" onClick={handleCancel}>
                  <span className="cancel-icon"><X size={16} /></span>
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="details-grid">
              <div className="detail-item">
                <label>Full Name</label>
                <div className="detail-value">{user?.firstName} {user?.lastName}</div>
              </div>
              
              <div className="detail-item">
                <label>Email Address</label>
                <div className="detail-value">{user?.email}</div>
              </div>
              
              <div className="detail-item">
                <label>Role</label>
                <div className="detail-value">
                  <span className="role-badge" style={{ backgroundColor: roleInfo.color }}>
                    <roleInfo.icon size={16} /> {user?.role}
                  </span>
                </div>
              </div>
              
              {user?.phoneNumber && (
                <div className="detail-item">
                  <label>Phone Number</label>
                  <div className="detail-value">{user.phoneNumber}</div>
                </div>
              )}
              
              {user?.grade && (
                <div className="detail-item">
                  <label>Grade Level</label>
                  <div className="detail-value">Grade {user.grade}</div>
                </div>
              )}
              
              {user?.role === 'Teacher' && user?.teacherMeetingLink && (
                <div className="detail-item">
                  <label>Meeting Link</label>
                  <div className="detail-value">
                    <a href={user.teacherMeetingLink} target="_blank" rel="noopener noreferrer" className="meeting-link">
                      {user.teacherMeetingLink}
                    </a>
                  </div>
                </div>
              )}
              
              <div className="detail-item">
                <label>Member Since</label>
                <div className="detail-value">
                  {new Date(user?.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Teacher Specializations Section */}
        {user?.role === 'Teacher' && (
          <div className="profile-specializations">
            <div className="specializations-header">
              <h2>Teaching Specializations</h2>
              {!user?.isProfileComplete && (
                <div className="profile-incomplete-warning">
                  <AlertCircle size={16} />
                  <span>Complete your profile to appear in parent searches</span>
                </div>
              )}
              {user?.isProfileComplete && (
                <div className="profile-complete-indicator">
                  <CheckCircle size={16} />
                  <span>Profile complete - visible to parents</span>
                </div>
              )}
            </div>
            
            
            {isEditingSpecializations ? (
              <div className="specializations-edit">
                <div className="subjects-grid">
                  {availableSubjects.length === 0 ? (
                    <div className="loading-subjects">
                      <p>Loading subjects...</p>
                    </div>
                  ) : (
                    availableSubjects.map(subject => (
                      <label key={subject} className="subject-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedSpecializations.includes(subject)}
                          onChange={() => handleSpecializationToggle(subject)}
                        />
                        <span className="subject-label">{subject}</span>
                      </label>
                    ))
                  )}
                </div>
                <div className="specializations-actions">
                  <button 
                    className="save-button" 
                    onClick={handleSaveSpecializations}
                    disabled={specializationsLoading}
                  >
                    <span className="save-icon"><Save size={16} /></span>
                    {specializationsLoading ? 'Saving...' : 'Save Specializations'}
                  </button>
                  <button 
                    className="cancel-button" 
                    onClick={() => {
                      setIsEditingSpecializations(false);
                      setSelectedSpecializations(user?.specializations || []);
                    }}
                  >
                    <span className="cancel-icon"><X size={16} /></span>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="specializations-display">
                {user?.specializations && user.specializations.length > 0 ? (
                  <div className="specializations-list">
                    {user.specializations.map(specialization => (
                      <span key={specialization} className="specialization-tag">
                        <BookOpen size={14} />
                        {specialization}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="no-specializations">
                    <BookOpen size={24} />
                    <p>No specializations selected</p>
                    <small>Select subjects you can teach to appear in parent searches</small>
                  </div>
                )}
                <button 
                  className="edit-specializations-button"
                  onClick={() => setIsEditingSpecializations(true)}
                >
                  <span className="edit-icon"><Edit3 size={16} /></span>
                  {user?.specializations && user.specializations.length > 0 ? 'Edit Specializations' : 'Add Specializations'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="profile-actions">
          <button className="delete-account-button" onClick={() => setShowDeleteConfirm(true)}>
            <span className="delete-icon"><Trash2 size={16} /></span>
            Delete Account
          </button>
        </div>

        {showDeleteConfirm && (
          <div className="delete-confirm-modal">
            <div className="delete-confirm-content">
              <h3><AlertTriangle size={20} /> Delete Account</h3>
              <p>Are you sure you want to delete your account? This action cannot be undone and will permanently remove ALL data associated with your account:</p>
              
              <div className="deletion-details">
                <h4><Trash2 className="icon" /> Complete Data Removal:</h4>
                <ul>
                  <li><strong>Account Information:</strong> Name, email, phone, profile data</li>
                  <li><strong>Authentication:</strong> Login credentials and session data</li>
                  <li><strong>Lessons & Bookings:</strong> All past, present, and future lessons</li>
                  <li><strong>Messages:</strong> All conversations with teachers/students/parents</li>
                  <li><strong>Notifications:</strong> All notification history</li>
                  {user?.role === 'Teacher' && (
                    <>
                      <li><strong>Teaching Data:</strong> Time constraints, working hours, schedule requests</li>
                      <li><strong>Payment Records:</strong> All payment and earnings history</li>
                    </>
                  )}
                  {user?.role === 'Parent' && (
                    <li><strong>Children Connections:</strong> All connected student accounts</li>
                  )}
                  {user?.role === 'Student' && (
                    <li><strong>Parent Connections:</strong> All parent account connections</li>
                  )}
                </ul>
                
                <div className="warning-box">
                  <AlertTriangle size={16} />
                  <span><strong>Warning:</strong> This will completely erase your account as if it never existed. You will need to create a new account to use the platform again.</span>
                </div>
              </div>
              
              <div className="delete-actions">
                <button className="confirm-delete-button" onClick={handleDeleteAccount}>
                  <span className="delete-icon"><Trash2 size={16} /></span>
                  Yes, Permanently Delete My Account
                </button>
                <button className="cancel-delete-button" onClick={() => setShowDeleteConfirm(false)}>
                  <span className="cancel-icon"><X size={16} /></span>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
