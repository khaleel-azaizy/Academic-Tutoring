import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  // Register user
  register: async (userData) => {
    try {
      const response = await api.post('/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await api.post('/logout');
      localStorage.removeItem('user');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get user profile
  getProfile: async () => {
    try {
      const response = await api.get('/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/profile', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.put('/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export const roleAPI = {
  // Teacher
  reportWorkingHours: async (payload) => {
    try {
      const res = await api.post('/teacher/working-hours', payload);
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  addTimeConstraint: async (payload) => {
    try {
      const res = await api.post('/teacher/time-constraints', payload);
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getTeacherSchedule: async () => {
    try {
      const res = await api.get('/teacher/schedule');
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  clockIn: async (lessonId) => {
    try {
      const res = await api.post('/teacher/clock-in', { lessonId });
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  clockOut: async (lessonId) => {
    try {
      const res = await api.post('/teacher/clock-out', { lessonId });
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  completeLesson: async (lessonId, workedMinutes) => {
    try {
      const res = await api.post('/teacher/lessons/complete', { lessonId, workedMinutes });
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  hoursSummary: async (params) => {
    try {
      const res = await api.get('/teacher/hours/summary', { params });
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  hoursEntries: async (params) => {
    try {
      const res = await api.get('/teacher/hours', { params });
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  notifications: async () => {
    try {
      const res = await api.get('/teacher/notifications');
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  notificationsMarkAllRead: async () => {
    try {
      const res = await api.post('/teacher/notifications/mark-all-read');
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  payments: async () => {
    try {
      const res = await api.get('/teacher/payments');
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  messages: async () => {
    try {
      const res = await api.get('/teacher/messages');
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  messagesMarkRead: async (messageIds) => {
    try {
      const res = await api.post('/teacher/messages/mark-read', { messageIds });
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  scheduleRequest: async (payload) => {
    try {
      const res = await api.post('/teacher/schedule-requests', payload);
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Parent
  searchTeachers: async (q) => {
    try {
      const res = await api.get('/teachers/search', { params: { q } });
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getTeacherAvailability: async (teacherId, { date, slotMinutes, durationMinutes, dayStart, dayEnd } = {}) => {
    try {
      const res = await api.get(`/teachers/${teacherId}/availability`, { params: { date, slotMinutes, durationMinutes, dayStart, dayEnd } });
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  bookLesson: async (payload) => {
    try {
      const res = await api.post('/bookings', payload);
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getParentHistory: async () => {
    try {
      const res = await api.get('/parent/lessons/history');
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Student
  getStudentUpcoming: async () => {
    try {
      const res = await api.get('/student/lessons/upcoming');
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  contactTeacher: async (payload) => {
    try {
      const res = await api.post('/student/contact-teacher', payload);
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default api;