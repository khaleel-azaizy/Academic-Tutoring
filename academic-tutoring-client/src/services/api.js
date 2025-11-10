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
  getTimeConstraints: async () => {
    try {
      const res = await api.get('/teacher/time-constraints');
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  updateTimeConstraint: async (id, payload) => {
    try {
      const res = await api.put(`/teacher/time-constraints/${id}`, payload);
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  deleteTimeConstraint: async (id) => {
    try {
      const res = await api.delete(`/teacher/time-constraints/${id}`);
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
  // Mark a lesson complete when no clock in/out was used, with worked minutes
  completeLesson: async (lessonId, workedMinutes) => {
    try {
      const res = await api.post('/teacher/lessons/complete', { lessonId, workedMinutes });
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  // Lesson resource links (Google Drive) - Teacher
  // Add/list/delete links per lesson; server enforces teacher ownership & simple validation
  getLessonResources: async (lessonId) => {
    try {
      const res = await api.get(`/teacher/lessons/${lessonId}/resources`);
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  addLessonResource: async (lessonId, payload) => {
    try {
      const res = await api.post(`/teacher/lessons/${lessonId}/resources`, payload);
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  // Add lesson resource with file upload
  addLessonResourceWithFile: async (lessonId, file, label, description) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (label) formData.append('label', label);
      if (description) formData.append('description', description);
      
      const res = await api.post(`/teacher/lessons/${lessonId}/resources`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  deleteLessonResource: async (lessonId, resourceId) => {
    try {
      const res = await api.delete(`/teacher/lessons/${lessonId}/resources/${resourceId}`);
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
  getTeacherConversations: async () => {
    try {
      const res = await api.get('/teacher/conversations');
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getTeacherConversation: async ({ studentId }) => {
    try {
      const res = await api.get('/teacher/conversation', { params: { studentId } });
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  teacherReply: async ({ studentId, parentId, message, file }) => {
    try {
      if (file) {
        const formData = new FormData();
        if (studentId) formData.append('studentId', studentId);
        if (parentId) formData.append('parentId', parentId);
        formData.append('message', message);
        formData.append('file', file);
        
        const res = await api.post('/teacher/reply', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return res.data;
      } else {
        const res = await api.post('/teacher/reply', { studentId, parentId, message });
        return res.data;
      }
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
  updateMeetingLink: async (meetingLink) => {
    try {
      const res = await api.put('/teacher/meeting-link', { meetingLink });
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  updateSpecializations: async (specializations) => {
    try {
      const res = await api.put('/teacher/specializations', { specializations });
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getAvailableSubjects: async () => {
    try {
      const res = await api.get('/teacher/subjects');
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Parent
  getAllTeachers: async () => {
    try {
      const res = await api.get('/teachers');
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  searchTeachers: async (q, subject = '') => {
    try {
      const res = await api.get('/teachers/search', { params: { q, subject } });
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
  getChildren: async () => {
    try {
      const res = await api.get('/parent/children');
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  addChild: async (childData) => {
    try {
      const res = await api.post('/parent/children', childData);
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  removeChild: async (childId) => {
    try {
      const res = await api.delete(`/parent/children/${childId}`);
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
    verifyStudentEmail: async (email) => {
      try {
        const res = await api.get('/parent/verify-student', { params: { email } });
        return res.data;
      } catch (error) {
        throw error.response?.data || error.message;
      }
    },
    updateChildGrade: async (childId, grade) => {
      try {
        const res = await api.put(`/parent/children/${childId}/grade`, { grade });
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
  cancelLesson: async (lessonId) => {
    try {
      const res = await api.delete(`/parent/lessons/${lessonId}`);
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  contactTeacher: async (payload) => {
    try {
      // Check if file attachment is present
      if (payload.file) {
        const formData = new FormData();
        formData.append('teacherEmail', payload.teacherEmail);
        if (payload.teacherId) formData.append('teacherId', payload.teacherId);
        formData.append('message', payload.message);
        formData.append('file', payload.file);
        
        const res = await api.post('/student/contact-teacher', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return res.data;
      } else {
        const res = await api.post('/student/contact-teacher', payload);
        return res.data;
      }
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getStudentConversation: async ({ teacherEmail, teacherId }) => {
    try {
      const res = await api.get('/student/messages', { params: { teacherEmail, teacherId } });
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getStudentConversations: async () => {
    try {
      const res = await api.get('/student/conversations');
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  updateProfile: async (profileData) => {
    try {
      const res = await api.put('/profile', profileData);
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  deleteAccount: async () => {
    try {
      const res = await api.delete('/profile');
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Parent messaging functions
  parentContactTeacher: async (payload) => {
    try {
      // Check if file attachment is present
      if (payload.file) {
        const formData = new FormData();
        formData.append('teacherEmail', payload.teacherEmail);
        if (payload.teacherId) formData.append('teacherId', payload.teacherId);
        formData.append('message', payload.message);
        formData.append('file', payload.file);
        
        const res = await api.post('/parent/contact-teacher', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return res.data;
      } else {
        const res = await api.post('/parent/contact-teacher', payload);
        return res.data;
      }
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getParentConversation: async ({ teacherEmail, teacherId }) => {
    try {
      const res = await api.get('/parent/messages', { params: { teacherEmail, teacherId } });
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getParentConversations: async () => {
    try {
      const res = await api.get('/parent/conversations');
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Admin API methods
export const studentAPI = {
  // Student dashboard upcoming lessons
  getUpcomingLessons: async () => {
    try {
      const res = await api.get('/student/lessons/upcoming');
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  // Fetch shared resource links for a specific lesson the student is assigned to
  getLessonResources: async (lessonId) => {
    try {
      const res = await api.get(`/student/lessons/${lessonId}/resources`);
      return res.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

// Admin API methods
export const adminAPI = {
  // Get admin dashboard stats
  getDashboardStats: async () => {
    try {
      const response = await api.get('/admin/dashboard');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all users
  getAllUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all lessons
  getAllLessons: async (params = {}) => {
    try {
      const response = await api.get('/admin/lessons', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get teacher payments
  getTeacherPayments: async (params = {}) => {
    try {
      const response = await api.get('/admin/teacher-payments', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Ban/Unban user
  updateUserBanStatus: async (userId, banData) => {
    try {
      const response = await api.put(`/admin/users/${userId}/ban`, banData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete lesson
  deleteLesson: async (lessonId, reason) => {
    try {
      const response = await api.delete(`/admin/lessons/${lessonId}`, { 
        data: { reason } 
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update teacher payment status
  updatePaymentStatus: async (paymentId, statusData) => {
    try {
      const response = await api.put(`/admin/teacher-payments/${paymentId}/status`, statusData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get admin logs
  getAdminLogs: async (params = {}) => {
    try {
      const response = await api.get('/admin/logs', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update teacher hourly rate
  updateTeacherRate: async (teacherId, hourlyRate) => {
    try {
      const response = await api.put(`/admin/teachers/${teacherId}/hourly-rate`, { hourlyRate });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get detailed teacher salary report
  getTeacherSalaryReport: async (params = {}) => {
    try {
      const response = await api.get('/admin/teacher-salary-report', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default api;