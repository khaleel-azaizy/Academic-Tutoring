import React, { useState } from 'react';
import { 
  UserCheck, 
  GraduationCap, 
  Users, 
  User, 
  Edit3, 
  Save, 
  X, 
  Trash2, 
  AlertTriangle 
} from 'lucide-react';

const Profile = ({ user, onUpdateUser, onDeleteAccount }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    grade: user?.grade || ''
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    setEditForm({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      grade: user?.grade || ''
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
      grade: user?.grade || ''
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
