import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  User, 
  GraduationCap, 
  Users, 
  Bell, 
  MessageCircle, 
  LogOut,
  UserCheck,
  UserPlus,
  Home,
  Moon,
  Sun,
  Bot
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Header = ({ user, onLogout, onProfile, onBackToDashboard, notifications = [], onMarkAllRead, onMessages, onAIChat, currentView = 'dashboard' }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const handleMarkAllRead = () => {
    if (onMarkAllRead) {
      onMarkAllRead();
    }
  };

  const getProfileButtonContent = () => {
    if (currentView === 'profile') {
      return {
        text: 'Actions',
        icon: Settings,
        action: onBackToDashboard // This will go back to dashboard
      };
    }
    return {
      text: 'Profile',
      icon: User,
      action: onProfile
    };
  };

  const profileButton = getProfileButtonContent();

  const getRoleDisplay = (role) => {
    switch (role) {
      case 'Teacher':
        return { title: 'Teacher Dashboard', icon: UserCheck, color: '#667eea' };
      case 'Student':
        return { title: 'Student Dashboard', icon: GraduationCap, color: '#28a745' };
      case 'Parent':
        return { title: 'Parent Dashboard', icon: Users, color: '#fd7e14' };
      default:
        return { title: 'Dashboard', icon: User, color: '#6c757d' };
    }
  };

  const roleInfo = getRoleDisplay(user?.role);

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <div className="role-badge" style={{ backgroundColor: roleInfo.color }}>
            <span className="role-icon"><roleInfo.icon size={16} /></span>
            <span className="role-text">{user?.role}</span>
          </div>
          <div className="user-info">
            <h1 className="welcome-text">Welcome back, {user?.firstName}!</h1>
            <p className="user-email">{user?.email}</p>
          </div>
        </div>
        <div className="header-right">
          <button className="theme-toggle-btn" onClick={toggleTheme} title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}>
            <span className="theme-icon">
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </span>
          </button>
          
          <div className="notification-container">
            <button className="notification-btn">
              <span className="notification-icon"><Bell size={18} /></span>
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button className="mark-all-read-btn" onClick={handleMarkAllRead}>
                    Mark all read
                  </button>
                )}
              </div>
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="no-notifications">No notifications</div>
                ) : (
                  notifications.map((notification) => (
                    <div key={notification._id} className={`notification-item ${!notification.read ? 'unread' : ''}`}>
                      <div className="notification-content">
                        <div className="notification-title">{notification.title}</div>
                        <div className="notification-message">{notification.message}</div>
                        <div className="notification-time">
                          {new Date(notification.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          
          {onMessages && (
            <button className="messages-btn" onClick={onMessages}>
              <span className="messages-icon"><MessageCircle size={18} /></span>
              Messages
            </button>
          )}
          
          {onAIChat && (
            <button className="ai-chat-btn" onClick={onAIChat}>
              <span className="ai-chat-icon"><Bot size={18} /></span>
              AI Tutor
            </button>
          )}
          
          <button className="profile-btn" onClick={profileButton.action}>
            <span className="profile-icon"><profileButton.icon size={18} /></span>
            {profileButton.text}
          </button>
          <button className="logout-btn" onClick={onLogout}>
            <span className="logout-icon"><LogOut size={18} /></span>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;