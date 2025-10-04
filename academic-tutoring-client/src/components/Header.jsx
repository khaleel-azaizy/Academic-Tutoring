import React, { useState, useEffect, useCallback } from 'react';
import { 
  Settings, 
  User, 
  GraduationCap, 
  Users, 
  Bell, 
  MessageCircle, 
  LogOut,
  UserCheck,
  Moon,
  Sun,
  Bot,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Header = ({ user, onLogout, onProfile, onBackToDashboard, notifications = [], onMarkAllRead, onMessages, onAIChat, currentView = 'dashboard' }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const [openDropdown, setOpenDropdown] = useState(null); // 'notifications'

  useEffect(() => {
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const handleMarkAllRead = () => {
    if (onMarkAllRead) {
      onMarkAllRead();
    }
  };

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  // Removed decorative pulse; keeping minimal.

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
        return { title: 'Teacher', icon: UserCheck, color: '#667eea' };
      case 'Student':
        return { title: 'Student', icon: GraduationCap, color: '#28a745' };
      case 'Parent':
        return { title: 'Parent', icon: Users, color: '#fd7e14' };
      case 'Admin':
        return { title: 'Admin', icon: Settings, color: '#dc3545' };
      default:
        return { title: 'User', icon: User, color: '#6c757d' };
    }
  };

  const roleInfo = getRoleDisplay(user?.role);

  const sidebarItems = [
    {
      icon: roleInfo.icon,
      label: roleInfo.title,
      isRole: true,
      color: roleInfo.color
    },
    {
      icon: Bell,
      label: 'Notifications',
      action: () => {
        setOpenDropdown(prev => prev === 'notifications' ? null : 'notifications');
      },
      badge: unreadCount > 0 ? unreadCount : null,
      dropdown: 'notifications'
    },
    {
      icon: MessageCircle,
      label: 'Messages',
      action: onMessages,
      show: !!onMessages
    },
    {
      icon: Bot,
      label: 'AI Tutor',
      action: onAIChat,
      show: !!onAIChat
    },
    {
      icon: isDarkMode ? Sun : Moon,
      label: isDarkMode ? 'Light Mode' : 'Dark Mode',
      action: toggleTheme
    },
    {
      icon: profileButton.icon,
      label: profileButton.text,
      action: profileButton.action
    },
    {
      icon: LogOut,
      label: 'Logout',
      action: onLogout,
      isLogout: true
    }
  ];

  const closePopup = useCallback(() => setOpenDropdown(null), []);

  // ESC key to close popup
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') closePopup();
    };
    if (openDropdown) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [openDropdown, closePopup]);

  return (
    <>
    <aside className={`app-sidebar ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Toggle Button */}
      <button 
        className="sidebar-toggle-btn" 
        onClick={toggleSidebar} 
        aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        title={isExpanded ? 'Collapse' : 'Expand'}
      >
        {/* Arrow points to the direction the sidebar WILL move */}
        {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>

      {/* Sidebar Content */}
      <div className="sidebar-content">
        {sidebarItems.map((item, index) => {
          if (item.show === false) return null;

          return (
            <div key={index} className="sidebar-item-container">
              {item.dropdown ? (
                <div className={`sidebar-dropdown-container`}>
                  <button 
                    className={`sidebar-item ${item.isRole ? 'role-item' : ''} ${item.isLogout ? 'logout-item' : ''} ${openDropdown === item.dropdown ? 'active' : ''}`}
                    style={item.isRole ? { backgroundColor: item.color } : {}}
                    onClick={item.action}
                    title={!isExpanded ? item.label : undefined}
                  >
                    <span className="sidebar-icon">
                      <item.icon size={20} />
                    </span>
                    {isExpanded && (
                      <>
                        <span className="sidebar-label">{item.label}</span>
                        {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <button 
                  className={`sidebar-item ${item.isRole ? 'role-item' : ''} ${item.isLogout ? 'logout-item' : ''}`}
                  onClick={item.action}
                  style={item.isRole ? { backgroundColor: item.color } : {}}
                  title={!isExpanded ? item.label : undefined}
                >
                  <span className="sidebar-icon">
                    <item.icon size={20} />
                  </span>
                  {isExpanded && (
                    <>
                      <span className="sidebar-label">{item.label}</span>
                      {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                    </>
                  )}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </aside>
    {openDropdown === 'notifications' && (
      <div className="notification-popup-overlay" onClick={closePopup}>
        <div className="notification-popup" onClick={(e) => e.stopPropagation()}>
          <div className="notification-popup-header">
            <h3>Notifications</h3>
            <div className="notification-popup-actions">
              {unreadCount > 0 && (
                <button className="mark-all-read-btn" onClick={handleMarkAllRead}>
                  Mark all read
                </button>
              )}
              <button className="close-popup-btn" onClick={closePopup} aria-label="Close notifications">✕</button>
            </div>
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
    )}
    </>
  );
};

export default Header;