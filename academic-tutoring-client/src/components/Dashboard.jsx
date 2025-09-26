import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Try to get user from localStorage first
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }

        // Also fetch fresh data from server
        const response = await authAPI.getProfile();
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
        
      } catch (error) {
        console.error('Error fetching user data:', error);
        // If we can't get user data, redirect to login
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails on server, clear local data and redirect
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'Teacher':
        return 'Teacher Dashboard';
      case 'Parent':
        return 'Parent Dashboard';
      case 'Student':
        return 'Student Dashboard';
      default:
        return 'Dashboard';
    }
  };

  const getRoleActions = () => {
    switch (user?.role) {
      case 'Teacher':
        return (
          <div className="dashboard-actions">
            <h3>Available Actions:</h3>
            <ul>
              <li>Report working hours</li>
              <li>Submit time constraints</li>
              <li>View schedule</li>
              <li>Manage lessons</li>
            </ul>
          </div>
        );
      case 'Parent':
        return (
          <div className="dashboard-actions">
            <h3>Available Actions:</h3>
            <ul>
              <li>Search for teachers</li>
              <li>Book lessons</li>
              <li>Track payments</li>
              <li>View lesson history</li>
            </ul>
          </div>
        );
      case 'Student':
        return (
          <div className="dashboard-actions">
            <h3>Available Actions:</h3>
            <ul>
              <li>View upcoming lessons</li>
              <li>Track progress</li>
              <li>Access learning materials</li>
              <li>Contact teachers</li>
            </ul>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', padding: '50px' }}>
        <div className="loading-spinner" style={{ margin: '20px auto' }}></div>
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>{getDashboardTitle()}</h1>
          <p>Hello {user.firstName} {user.lastName}!</p>
        </div>
        <button 
          onClick={handleLogout}
          className="logout-button"
        >
          Logout
        </button>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-card">
          <h3>Personal Information</h3>
          <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          {user.phoneNumber && <p><strong>Phone:</strong> {user.phoneNumber}</p>}
          {user.grade && <p><strong>Grade:</strong> {user.grade}</p>}
          <p><strong>Join Date:</strong> {new Date(user.createdAt).toLocaleDateString('en-US')}</p>
        </div>

        <div className="dashboard-card">
          {getRoleActions()}
        </div>
      </div>

      <div className="dashboard-card" style={{
        marginTop: '30px',
        textAlign: 'center'
      }}>
        <h3>Welcome to Academic Tutoring Platform!</h3>
        <p>Here you can manage all your activities within the system.</p>
        <p style={{ color: '#666', marginTop: '20px' }}>
          The system is still under development - more features will be added soon
        </p>
      </div>
    </div>
  );
};

export default Dashboard;