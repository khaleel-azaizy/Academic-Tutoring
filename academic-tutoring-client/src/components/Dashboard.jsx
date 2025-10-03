import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, roleAPI, adminAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import Modal from './Modal';
import Tabs from './Tabs';
import Header from './Header';
import Profile from './Profile';
import MessagesSidebar from './MessagesSidebar';
import AIChat from './AIChat';
import { 
  Users, 
  Edit3, 
  Search, 
  GraduationCap, 
  Calendar, 
  Clock, 
  CheckCircle, 
  BookOpen, 
  Target, 
  Trash2, 
  AlertTriangle,
  User,
  Book,
  UserCheck,
  RotateCcw,
  FileText,
  MessageCircle,
  Bot,
  ArrowLeft,
  ArrowRight,
  Loader2
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(null); // 'hours' | 'constraint' | 'book' | 'contact' | 'chat' | 'teacher-chat' | 'ai-chat'
  const [activeTab, setActiveTab] = useState(''); // For controlling tabs

  // Teacher action state
  const [hoursForm, setHoursForm] = useState({ date: '', hours: '', notes: '' });
  const [constraintForm, setConstraintForm] = useState({ dayOfWeek: 0, startTime: '', endTime: '', note: '' });
  const [constraints, setConstraints] = useState([]);
  const [editingConstraint, setEditingConstraint] = useState(null);
  const [timeRange, setTimeRange] = useState({ from: '', to: '' });
  const [hoursSummary, setHoursSummary] = useState(null);
  const [hoursEntries, setHoursEntries] = useState([]);
  const [teacherLessons, setTeacherLessons] = useState([]);
  const [completeLessonState, setCompleteLessonState] = useState({ lessonId: '', workedMinutes: '' });
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);
  const [teacherConversations, setTeacherConversations] = useState([]);
  const [selectedStudentForChat, setSelectedStudentForChat] = useState(null);
  const [teacherChatConversation, setTeacherChatConversation] = useState({ student: null, messages: [] });
  const [teacherChatForm, setTeacherChatForm] = useState({ message: '' });
  const [showProfile, setShowProfile] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  // Parent action state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [bookingForm, setBookingForm] = useState({ teacherEmail: '', dateTime: '', subject: '', durationMinutes: 60, studentEmail: '' });
  const [teacherList, setTeacherList] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [availabilityDate, setAvailabilityDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [parentHistory, setParentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  // Booking flow state
  const [bookingStep, setBookingStep] = useState(1); // 1: Subject, 2: Teacher, 3: Date/Time, 4: Confirm
  
  // Children management state
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [childrenLoading, setChildrenLoading] = useState(false);
  const [newChildForm, setNewChildForm] = useState({ email: '', grade: '' });
  const [showAddChild, setShowAddChild] = useState(false);
  const [editingChild, setEditingChild] = useState(null);
  const [editChildForm, setEditChildForm] = useState({ grade: '' });
  
  // Parent lesson cancellation state
  const [cancellingLesson, setCancellingLesson] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [lessonToCancel, setLessonToCancel] = useState(null);
  
  // Tooltip state
  const [hoveredLesson, setHoveredLesson] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Week navigation state
  const [weekOffset, setWeekOffset] = useState(0);
  

  // Student action state
  const [upcoming, setUpcoming] = useState([]);
  const [contactForm, setContactForm] = useState({ teacherEmail: '', message: '' });
  const [studentConversation, setStudentConversation] = useState({ teacher: null, messages: [] });
  const [studentConversationsList, setStudentConversationsList] = useState([]);
  const [teacherSearchQuery, setTeacherSearchQuery] = useState('');
  const [teacherSearchResults, setTeacherSearchResults] = useState([]);
  const [selectedTeacherForChat, setSelectedTeacherForChat] = useState(null);

  // Admin action state
  const [adminStats, setAdminStats] = useState({});
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLessons, setAdminLessons] = useState([]);
  const [adminPayments, setAdminPayments] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminFilters, setAdminFilters] = useState({
    users: { role: 'all', status: 'all', search: '' },
    lessons: { status: 'all' },
    payments: { teacherId: '', fromDate: '', toDate: '' }
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [banForm, setBanForm] = useState({ reason: '', isBanned: false });
  const [salaryReport, setSalaryReport] = useState([]);
  const [overallTotals, setOverallTotals] = useState({});
  const [editingRate, setEditingRate] = useState(null);
  const [newRate, setNewRate] = useState('');

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

  // Auto-load data for students
  useEffect(() => {
    const loadStudentData = async () => {
      if (user && user.role === 'Student') {
        try {
          // Load conversations
          const conversationsData = await roleAPI.getStudentConversations();
          setStudentConversationsList(conversationsData.conversations || []);
          
          // Load upcoming lessons
          const upcomingData = await roleAPI.getStudentUpcoming();
          setUpcoming(upcomingData.lessons || []);
        } catch (error) {
          console.error('Error loading student data:', error);
        }
      }
    };

    loadStudentData();
  }, [user]);

  // Auto-load data for teachers
  useEffect(() => {
    const loadTeacherData = async () => {
      if (user && user.role === 'Teacher') {
        try {
          // Load schedule
          const scheduleData = await roleAPI.getTeacherSchedule();
          setTeacherLessons(scheduleData.lessons || []);
          
          // Load notifications
          const notificationsData = await roleAPI.notifications();
          setNotifications(notificationsData.notifications || []);
          
          // Load conversations
          const conversationsData = await roleAPI.getTeacherConversations();
          setTeacherConversations(conversationsData.conversations || []);
          
          // Load payments
          const paymentsData = await roleAPI.payments();
          // Note: payments data is just for display, no state set for it
          
          // Load hours summary and entries
          const hoursData = await roleAPI.hoursSummary({ from: undefined, to: undefined });
          setHoursSummary(hoursData);
          const hoursList = await roleAPI.hoursEntries({ from: undefined, to: undefined });
          setHoursEntries(hoursList.entries || []);
          
          // Load time constraints
          const constraintsData = await roleAPI.getTimeConstraints();
          setConstraints(constraintsData.constraints || []);
        } catch (error) {
          console.error('Error loading teacher data:', error);
        }
      }
    };

    loadTeacherData();
  }, [user]);

  // Auto-load data for parents
  useEffect(() => {
    const loadParentData = async () => {
      if (user && user.role === 'Parent') {
        try {
          setHistoryLoading(true);
          const historyData = await roleAPI.getParentHistory();
          setParentHistory(historyData.lessons || []);
          
          // Load all available teachers by default
          const teachersData = await roleAPI.getAllTeachers();
          setTeacherList(teachersData.teachers || []);
        } catch (error) {
          console.error('Error loading parent data:', error);
        } finally {
          setHistoryLoading(false);
        }
      }
    };

    loadParentData();
  }, [user]);

  useEffect(() => {
    loadChildren();
  }, [user]);

  // Auto-load data for admins
  useEffect(() => {
    const loadAdminData = async () => {
      if (user && user.role === 'Admin') {
        try {
          setAdminLoading(true);
          await loadAdminStats();
        } catch (error) {
          console.error('Error loading admin data:', error);
        } finally {
          setAdminLoading(false);
        }
      }
    };

    loadAdminData();
  }, [user]);

  const handleAction = async (fn) => {
    try {
      await fn();
    } catch (err) {
      showError(err.error || err.message || 'Action failed');
    }
  };

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

  const handleProfile = () => {
    setShowProfile(true);
  };

  const handleBackToDashboard = () => {
    setShowProfile(false);
  };

  const handleMessages = () => {
    setShowMessages(true);
  };

  const handleCloseMessages = () => {
    setShowMessages(false);
  };

  const handleUpdateUser = async (profileData) => {
    try {
      // Handle meeting link separately if it's a teacher
      if (user?.role === 'Teacher' && profileData.teacherMeetingLink !== undefined) {
        await roleAPI.updateMeetingLink(profileData.teacherMeetingLink);
        // Remove meeting link from profile data to avoid conflicts
        const { teacherMeetingLink, ...restProfileData } = profileData;
        const response = await roleAPI.updateProfile(restProfileData);
        setUser({ ...response.user, teacherMeetingLink: profileData.teacherMeetingLink });
        localStorage.setItem('user', JSON.stringify({ ...response.user, teacherMeetingLink: profileData.teacherMeetingLink }));
      } else {
        const response = await roleAPI.updateProfile(profileData);
        setUser(response.user);
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    } catch (error) {
      console.error('Profile update failed:', error);
      throw error;
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await roleAPI.deleteAccount();
      localStorage.removeItem('user');
      navigate('/login');
    } catch (error) {
      console.error('Account deletion failed:', error);
      throw error;
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
      if (unreadIds.length > 0) {
        await roleAPI.notificationsMarkAllRead(unreadIds);
        // Refresh notifications
        const data = await roleAPI.notifications();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Mark all read failed:', error);
    }
  };

  // Validation functions
  const validateBookingStep = (step) => {
    switch (step) {
      case 1:
        return selectedSubject !== '';
      case 2:
        return selectedTeacher !== '';
      case 3:
        return availabilityDate !== '' && bookingForm.durationMinutes > 0;
      case 4:
        return bookingForm.dateTime !== '' && bookingForm.teacherEmail !== '';
      default:
        return false;
    }
  };

  const canProceedToNextStep = (currentStep) => {
    return validateBookingStep(currentStep);
  };

  // Validate booking time (minimum 24 hours advance notice)
  const validateBookingTime = (dateTime) => {
    const now = new Date();
    const bookingTime = new Date(dateTime);
    const hoursUntilBooking = (bookingTime - now) / (1000 * 60 * 60);
    
    if (hoursUntilBooking < 24) {
      return { valid: false, message: 'Lessons must be booked at least 24 hours in advance' };
    }
    
    if (hoursUntilBooking > 24 * 30) {
      return { valid: false, message: 'Lessons cannot be booked more than 30 days in advance' };
    }
    
    return { valid: true };
  };

  // Handle subject selection
  const handleSubjectSelect = async (subject) => {
    setSelectedSubject(subject);
    setBookingForm({ ...bookingForm, subject });
    setBookingStep(2);
    
    // Load teachers for this subject
    try {
      setIsSearching(true);
      const data = await roleAPI.searchTeachers('', subject);
      setTeacherList(data.teachers || []);
    } catch (error) {
      console.error('Error loading teachers for subject:', error);
      setTeacherList([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Real-time search for teachers (within selected subject)
  const handleSearchChange = (query) => {
    setSearchQuery(query);
    performSearch(query, selectedSubject);
  };

  // Perform search with both query and subject filter
  const performSearch = (query, subject) => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set loading state
    setIsSearching(true);
    
    // Set new timeout for search
    const timeout = setTimeout(async () => {
      try {
        const data = await roleAPI.searchTeachers(query, subject);
        setTeacherList(data.teachers || []);
      } catch (error) {
        console.error('Search failed:', error);
        setTeacherList([]);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms delay for real-time search
    
    setSearchTimeout(timeout);
  };

  // Reset booking flow
  const resetBookingFlow = () => {
    setBookingStep(1);
    setSelectedSubject('');
    setSelectedTeacher('');
    setSearchQuery('');
    setTeacherList([]);
    setAvailabilityDate('');
    setAvailableSlots([]);
    setBookingForm({ teacherEmail: '', dateTime: '', subject: '', durationMinutes: 60, studentEmail: '' });
    setIsSearching(false);
    setIsCheckingAvailability(false);
  };

  // Children management functions
  const loadChildren = async () => {
    if (user && user.role === 'Parent') {
      try {
        setChildrenLoading(true);
        const data = await roleAPI.getChildren();
        setChildren(data.children || []);
      } catch (error) {
        console.error('Error loading children:', error);
        setChildren([]);
      } finally {
        setChildrenLoading(false);
      }
    }
  };

  const addChild = async () => {
    try {
      // First verify the email exists as a student
      const verificationResult = await roleAPI.verifyStudentEmail(newChildForm.email);
      if (!verificationResult.exists) {
        showError('No student account found with this email address. Please make sure your child has registered first.');
        return;
      }
      
      await roleAPI.addChild(newChildForm);
      showSuccess('Student connected successfully!');
      setNewChildForm({ email: '', grade: '' });
      setShowAddChild(false);
      loadChildren();
    } catch (error) {
      console.error('Error adding child:', error);
      if (error.message && error.message.includes('not found')) {
        showError('No student account found with this email address. Please make sure your child has registered first.');
      } else {
        showError('Failed to add child. Please try again.');
      }
    }
  };

  const removeChild = async (childId) => {
    try {
      await roleAPI.removeChild(childId);
      showSuccess('Student disconnected successfully!');
      loadChildren();
      if (selectedChild === childId) {
        setSelectedChild('');
        setBookingForm({ ...bookingForm, studentEmail: '' });
      }
    } catch (error) {
      console.error('Error removing child:', error);
      showError('Failed to remove child. Please try again.');
    }
  };

  const startEditChild = (child) => {
    setEditingChild(child._id);
    setEditChildForm({ grade: child.grade });
  };

  const cancelEditChild = () => {
    setEditingChild(null);
    setEditChildForm({ grade: '' });
  };

  const updateChildGrade = async () => {
    try {
      await roleAPI.updateChildGrade(editingChild, editChildForm.grade);
      showSuccess('Child grade updated successfully!');
      setEditingChild(null);
      setEditChildForm({ grade: '' });
      loadChildren();
    } catch (error) {
      console.error('Error updating child grade:', error);
      showError('Failed to update child grade. Please try again.');
    }
  };

  // Parent lesson cancellation functions
  const handleCancelLesson = (lesson) => {
    setLessonToCancel(lesson);
    setShowCancelConfirm(true);
  };

  const confirmCancelLesson = async () => {
    if (!lessonToCancel) return;
    
    try {
      setCancellingLesson(lessonToCancel._id);
      await roleAPI.cancelLesson(lessonToCancel._id);
      showSuccess('Lesson cancelled successfully!');
      
      // Remove the lesson from the history list
      setParentHistory(prev => prev.filter(l => l._id !== lessonToCancel._id));
      
      setShowCancelConfirm(false);
      setLessonToCancel(null);
    } catch (error) {
      console.error('Error cancelling lesson:', error);
      showError(error.message || 'Failed to cancel lesson. Please try again.');
    } finally {
      setCancellingLesson(null);
    }
  };

  const cancelCancelLesson = () => {
    setShowCancelConfirm(false);
    setLessonToCancel(null);
  };

  // Handle lesson hover
  const handleLessonHover = (lesson, event) => {
    setHoveredLesson(lesson);
    setTooltipPosition({
      x: event.clientX,
      y: event.clientY
    });
  };

  const handleLessonLeave = () => {
    setHoveredLesson(null);
  };

  // Week navigation functions
  const goToPreviousWeek = () => {
    setWeekOffset(prev => prev - 1);
  };

  const goToNextWeek = () => {
    setWeekOffset(prev => prev + 1);
  };

  const goToCurrentWeek = () => {
    setWeekOffset(0);
  };

  // Admin functions
  const loadAdminStats = async () => {
    try {
      const data = await adminAPI.getDashboardStats();
      setAdminStats(data.stats || {});
    } catch (error) {
      console.error('Error loading admin stats:', error);
      showError('Failed to load admin statistics');
    }
  };

  const loadAdminUsers = async () => {
    try {
      setAdminLoading(true);
      const data = await adminAPI.getAllUsers(adminFilters.users);
      setAdminUsers(data.users || []);
    } catch (error) {
      console.error('Error loading admin users:', error);
      showError('Failed to load users');
    } finally {
      setAdminLoading(false);
    }
  };

  const loadAdminLessons = async () => {
    try {
      setAdminLoading(true);
      const data = await adminAPI.getAllLessons(adminFilters.lessons);
      setAdminLessons(data.lessons || []);
    } catch (error) {
      console.error('Error loading admin lessons:', error);
      showError('Failed to load lessons');
    } finally {
      setAdminLoading(false);
    }
  };

  const loadAdminPayments = async () => {
    try {
      setAdminLoading(true);
      const data = await adminAPI.getTeacherPayments(adminFilters.payments);
      setAdminPayments(data);
    } catch (error) {
      console.error('Error loading admin payments:', error);
      showError('Failed to load payment data');
    } finally {
      setAdminLoading(false);
    }
  };

  const loadAdminLogs = async () => {
    try {
      setAdminLoading(true);
      const data = await adminAPI.getAdminLogs();
      setAdminLogs(data.logs || []);
    } catch (error) {
      console.error('Error loading admin logs:', error);
      showError('Failed to load activity logs');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleBanUser = async (userId, isBanned, reason = '') => {
    try {
      await adminAPI.updateUserBanStatus(userId, { isBanned, reason });
      showSuccess(`User ${isBanned ? 'banned' : 'unbanned'} successfully`);
      loadAdminUsers(); // Refresh the users list
      // Also refresh logs if they're loaded
      if (adminLogs.length > 0) {
        loadAdminLogs();
      }
    } catch (error) {
      console.error('Error updating user ban status:', error);
      showError('Failed to update user status');
    }
  };

  const handleDeleteLesson = async (lessonId, reason = '') => {
    if (!confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      return;
    }
    
    try {
      await adminAPI.deleteLesson(lessonId, reason);
      showSuccess('Lesson deleted successfully');
      loadAdminLessons(); // Refresh the lessons list
      // Also refresh logs if they're loaded
      if (adminLogs.length > 0) {
        loadAdminLogs();
      }
    } catch (error) {
      console.error('Error deleting lesson:', error);
      showError('Failed to delete lesson');
    }
  };

  const loadSalaryReport = async () => {
    try {
      setAdminLoading(true);
      const data = await adminAPI.getTeacherSalaryReport(adminFilters.payments);
      setSalaryReport(data.salaryReport || []);
      setOverallTotals(data.overallTotals || {});
    } catch (error) {
      console.error('Error loading salary report:', error);
      showError('Failed to load salary report');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleUpdateTeacherRate = async (teacherId, hourlyRate) => {
    try {
      await adminAPI.updateTeacherRate(teacherId, hourlyRate);
      showSuccess('Teacher hourly rate updated successfully');
      loadAdminUsers(); // Refresh users to show new rate
      loadSalaryReport(); // Refresh salary report
      // Also refresh logs
      if (adminLogs.length > 0) {
        loadAdminLogs();
      }
      setEditingRate(null);
      setNewRate('');
    } catch (error) {
      console.error('Error updating teacher rate:', error);
      showError('Failed to update teacher rate');
    }
  };


  const getRoleActions = () => {
    switch (user?.role) {
      case 'Teacher':
        return (
          <div className="dashboard-actions">
            <h3>Actions</h3>
            <Tabs
              tabs={[
                { key: 'schedule', title: 'Schedule', content: (
                  <div className="grid-one">
                    <p className="muted">View upcoming lessons and clock in/out at start/end. Manually complete lessons if you didn't use clock-in/out. Interacts: Parents (book/changes), Students (attendance), Managers (coordination/payments).</p>
                    {teacherLessons.length > 0 ? (
                      <div className="lesson-cards">
                        {teacherLessons.map((l) => (
                          <div key={l._id} className="lesson-card">
                            <div className="lesson-header">
                              <div className="lesson-time">
                                <Calendar className="icon" />
                                {new Date(l.dateTime).toLocaleString()}
                            </div>
                              <div className="lesson-duration">
                                <Clock className="icon" />
                                {l.durationMinutes || 60} min
                              </div>
                            </div>
                            <div className="lesson-details">
                              <div className="lesson-subject">
                                <BookOpen className="icon" />
                                {l.subject || 'General Lesson'}
                              </div>
                              {l.studentName && (
                                <div className="lesson-student">
                                  <User className="icon" />
                                  {l.studentName}
                                </div>
                              )}
                            </div>
                            <div className="lesson-actions">
                              {(() => {
                                const now = new Date();
                                const lessonTime = new Date(l.dateTime);
                                const timeUntilLesson = lessonTime - now;
                                const tenMinutesInMs = 10 * 60 * 1000;
                                const lessonTimePassed = now > lessonTime;
                                const noClockActivity = !l.clockInAt && !l.clockOutAt;
                                
                                // Clock-in: Show only 10 minutes before lesson
                                if (l.status === 'booked' && !l.clockInAt && timeUntilLesson <= tenMinutesInMs && timeUntilLesson > 0) {
                                  return (
                                    <button className="auth-button btn-sm" onClick={() => handleAction(async () => { 
                                      await roleAPI.clockIn(l._id); 
                                      showSuccess('Clocked in'); 
                                      const data = await roleAPI.getTeacherSchedule();
                                      setTeacherLessons(data.lessons || []);
                                    })}>
                                      <Clock className="icon" /> Clock-in
                                    </button>
                                  );
                                }
                                
                                // Clock-out: Show when lesson is in progress
                                if (l.status === 'in_progress' && l.clockInAt && !l.clockOutAt) {
                                  return (
                                    <button className="auth-button btn-sm" onClick={() => handleAction(async () => { 
                                      await roleAPI.clockOut(l._id); 
                                      showSuccess('Clocked out'); 
                                      const data = await roleAPI.getTeacherSchedule();
                                      setTeacherLessons(data.lessons || []);
                                    })}>
                                      <Clock className="icon" /> Clock-out
                                    </button>
                                  );
                                }
                                
                                // Complete: Show only if lesson time passed and no clock activity
                                if (l.status === 'booked' && lessonTimePassed && noClockActivity) {
                                  return (
                                    <button className="auth-button btn-sm success" onClick={() => {
                                      setCompleteLessonState({ lessonId: l._id, workedMinutes: l.durationMinutes || 60 });
                                      setOpenModal('complete');
                                    }}>
                                      <CheckCircle className="icon" /> Complete
                                    </button>
                                  );
                                }
                                
                                // Completed status
                                if (l.status === 'completed') {
                                  return (
                                    <div className="lesson-completed">
                                      <CheckCircle className="icon" />
                                      <span>Completed</span>
                                    </div>
                                  );
                                }
                                
                                // Default: Show lesson timing info
                                return (
                                  <div className="lesson-timing">
                                    {timeUntilLesson > tenMinutesInMs ? (
                                      <span className="timing-text">
                                        Clock-in available in {Math.ceil(timeUntilLesson / (60 * 1000))} minutes
                                      </span>
                                    ) : timeUntilLesson > 0 ? (
                                      <span className="timing-text available">
                                        Clock-in now available
                                      </span>
                                    ) : !lessonTimePassed ? (
                                      <span className="timing-text">
                                        Lesson starting soon
                                      </span>
                                    ) : null}
                                  </div>
                                );
                              })()}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-lessons">
                        <div className="no-lessons-icon"><Calendar className="icon" /></div>
                        <h4>No upcoming lessons scheduled</h4>
                        <p className="muted">Your schedule is clear. Check back later for new bookings.</p>
                      </div>
                    )}
                  </div>
                ) },
                { key: 'hours', title: 'Hours', content: (
                  <div className="grid-one">
                    <p className="muted">Report hours and view totals/entries for payroll tracking. Interacts: Managers (payroll/review).</p>
                    
                    <div className="section">
                      <h4 className="section-title">
                        <Clock className="icon" />
                        Time Range
                      </h4>
                    <div className="grid-two">
                      <div className="form-group">
                          <label className="form-label">
                            <Calendar className="icon" />
                            From
                          </label>
                        <input type="date" className="form-input" value={timeRange.from} onChange={(e) => setTimeRange({ ...timeRange, from: e.target.value })} />
                      </div>
                      <div className="form-group">
                          <label className="form-label">
                            <Calendar className="icon" />
                            To
                          </label>
                        <input type="date" className="form-input" value={timeRange.to} onChange={(e) => setTimeRange({ ...timeRange, to: e.target.value })} />
                      </div>
                    </div>
                    </div>

                    <div className="section">
                      <h4 className="section-title">
                        <FileText className="icon" />
                        Report Hours
                      </h4>
                      <button className="auth-button primary" onClick={() => setOpenModal('hours')}>
                        <Clock className="icon" />
                        Report Hours
                      </button>
                    </div>

                    {hoursSummary && (
                      <div className="section">
                        <h4 className="section-title">
                          <Target className="icon" />
                          Summary
                        </h4>
                        <div className="summary-card">
                          <div className="summary-item">
                            <span className="summary-label">Total Hours:</span>
                            <span className="summary-value">{hoursSummary.totalHours?.toFixed(2) || 0}</span>
                          </div>
                          <div className="summary-item">
                            <span className="summary-label">Entries:</span>
                            <span className="summary-value">{hoursSummary.count}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {hoursEntries.length > 0 && (
                      <div className="section">
                        <h4 className="section-title">
                          <FileText className="icon" />
                          Recent Entries
                        </h4>
                        <div className="hours-entries">
                          {hoursEntries.map((e) => (
                            <div key={e._id} className="hours-entry">
                              <div className="entry-date">
                                <Calendar className="icon" />
                                {new Date(e.date).toLocaleDateString()}
                              </div>
                              <div className="entry-hours">
                                <Clock className="icon" />
                                {Number(e.hours).toFixed(2)}h
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) },
                { key: 'constraints', title: 'Constraints', content: (
                  <div className="grid-one">
                    <p className="muted">Submit your unavailability (days/times). Interacts: Managers (approval/coordinating), Parents (booking availability).</p>
                    
                    <div className="section">
                      <h4 className="section-title">
                        <AlertTriangle className="icon" />
                        Time Constraints
                      </h4>
                      <button className="auth-button primary" onClick={() => {
                        setEditingConstraint(null);
                        setConstraintForm({ dayOfWeek: 0, startTime: '', endTime: '', note: '' });
                        setOpenModal('constraint');
                      }}>
                        <Edit3 className="icon" />
                        Add Constraint
                      </button>
                    </div>
                    
                    {constraints.length > 0 ? (
                      <div className="section">
                        <h4 className="section-title">
                          <Calendar className="icon" />
                          Current Constraints
                        </h4>
                        <div className="constraints-list">
                        {constraints.map((constraint) => {
                          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                          return (
                              <div key={constraint._id} className="constraint-card">
                                <div className="constraint-header">
                                  <div className="constraint-day">
                                    <Calendar className="icon" />
                                    {dayNames[constraint.dayOfWeek]}
                                  </div>
                                  <div className="constraint-actions">
                                  <button className="auth-button btn-sm" onClick={() => {
                                    setEditingConstraint(constraint);
                                    setConstraintForm({
                                      dayOfWeek: constraint.dayOfWeek,
                                      startTime: constraint.startTime,
                                      endTime: constraint.endTime,
                                      note: constraint.note || ''
                                    });
                                    setOpenModal('constraint');
                                    }}>
                                      <Edit3 className="icon" />
                                      Edit
                                    </button>
                                    <button className="auth-button btn-sm danger" onClick={() => handleAction(async () => {
                                    await roleAPI.deleteTimeConstraint(constraint._id);
                                    const data = await roleAPI.getTimeConstraints();
                                    setConstraints(data.constraints || []);
                                      showSuccess('Constraint deleted');
                                    })}>
                                      <Trash2 className="icon" />
                                      Delete
                                    </button>
                                </div>
                              </div>
                                <div className="constraint-details">
                                  <div className="constraint-time">
                                    <Clock className="icon" />
                                    {constraint.startTime} - {constraint.endTime}
                                  </div>
                                  {constraint.note && (
                                    <div className="constraint-note">
                                      <FileText className="icon" />
                                      {constraint.note}
                                    </div>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                        </div>
                      </div>
                    ) : (
                      <div className="no-lessons">
                        <div className="no-lessons-icon"><AlertTriangle className="icon" /></div>
                        <h4>No constraints set</h4>
                        <p className="muted">Add time constraints to let parents know when you're unavailable.</p>
                      </div>
                    )}
                  </div>
                ) },
                { key: 'payments', title: 'Payments', content: (
                  <div className="grid-one">
                    <p className="muted">View simulated payment entries for completed lessons. Interacts: Managers (payment processing).</p>
                    
                    <div className="section">
                      <h4 className="section-title">
                        <Target className="icon" />
                        Payment Information
                      </h4>
                      <div className="info-card">
                        <div className="info-item">
                          <FileText className="icon" />
                          <span>Payment data loads automatically from completed lessons</span>
                        </div>
                        <div className="info-item">
                          <User className="icon" />
                          <span>Contact managers for payment details and processing</span>
                        </div>
                      </div>
                    </div>

                    <div className="section">
                      <h4 className="section-title">
                        <Calendar className="icon" />
                        Payment Status
                      </h4>
                      <div className="status-card">
                        <div className="status-item">
                          <div className="status-label">System Status:</div>
                          <div className="status-value success">Active</div>
                        </div>
                        <div className="status-item">
                          <div className="status-label">Last Updated:</div>
                          <div className="status-value">{new Date().toLocaleDateString()}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) },
              ]}
            />
          </div>
        );
      case 'Parent':
        return (
          <div className="dashboard-actions">
            <h3>Actions</h3>
            <Tabs
              activeKey={activeTab}
              onTabChange={setActiveTab}
              tabs={[
                { key: 'children', title: 'My Children', content: (
                  <div className="grid-one">
                    <p className="muted">Connect your children's existing student accounts to your parent account. This allows you to book lessons on their behalf.</p>
                    
                    <div className="section">
                      <div className="section-header">
                        <h4 className="section-title">
                          <Users className="icon" />
                          Your Children
                        </h4>
                        <button 
                          className="auth-button primary" 
                          onClick={() => setShowAddChild(true)}
                        >
                          + Connect Student
                        </button>
                      </div>
                      
                      {childrenLoading ? (
                        <div className="loading-container">
                          <div className="loading-spinner"></div>
                          <p>Loading children...</p>
                        </div>
                      ) : children.length > 0 ? (
                        <div className="children-list">
                          {children.map(child => (
                            <div key={child._id} className="child-card">
                              <div className="child-info">
                                <div className="child-avatar">
                                  {(child.studentName || child.name || 'S').charAt(0).toUpperCase()}
                                </div>
                                <div className="child-details">
                                  <div className="child-name">{child.studentName || child.name || 'Student'}</div>
                                  <div className="child-email">{child.email}</div>
                                  {editingChild === child._id ? (
                                    <div className="edit-grade-section">
                                      <select 
                                        className="form-input grade-select"
                                        value={editChildForm.grade} 
                                        onChange={(e) => setEditChildForm({ ...editChildForm, grade: e.target.value })}
                                      >
                                        <option value="">Select grade</option>
                                        <option value="K">Kindergarten</option>
                                        <option value="1">1st Grade</option>
                                        <option value="2">2nd Grade</option>
                                        <option value="3">3rd Grade</option>
                                        <option value="4">4th Grade</option>
                                        <option value="5">5th Grade</option>
                                        <option value="6">6th Grade</option>
                                        <option value="7">7th Grade</option>
                                        <option value="8">8th Grade</option>
                                        <option value="9">9th Grade</option>
                                        <option value="10">10th Grade</option>
                                        <option value="11">11th Grade</option>
                                        <option value="12">12th Grade</option>
                                        <option value="College">College</option>
                                      </select>
                                      <div className="edit-grade-actions">
                                        <button 
                                          className="save-grade-btn"
                                          onClick={updateChildGrade}
                                          disabled={!editChildForm.grade}
                                        >
                                          Save
                                        </button>
                                        <button 
                                          className="cancel-grade-btn"
                                          onClick={cancelEditChild}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="child-grade">
                                      Grade {child.grade}
                                      <button 
                                        className="edit-grade-btn"
                                        onClick={() => startEditChild(child)}
                                        title="Edit grade"
                                      >
                                        <Edit3 size={16} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="child-actions">
                                <button 
                                  className={`select-child-btn ${selectedChild === child._id ? 'selected' : ''}`}
                                  onClick={() => {
                                    setSelectedChild(child._id);
                                    setBookingForm({ ...bookingForm, studentEmail: child.email });
                                  }}
                                  disabled={editingChild === child._id}
                                >
                                  {selectedChild === child._id ? 'Selected' : 'Select'}
                                </button>
                                <button 
                                  className="remove-child-btn"
                                  onClick={() => removeChild(child._id)}
                                  disabled={editingChild === child._id}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="no-children">
                          <div className="no-children-icon"><Users className="icon" /></div>
                          <p>No children connected yet</p>
                          <p className="no-children-suggestion">Connect your child's existing student account to get started with booking lessons</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) },
                { key: 'book', title: 'Book Lesson', content: (
                  <div className="grid-one">
                    <p className="muted">Schedule and confirm lessons with instructors. Interacts: Teachers (schedule), Students (attendance).</p>

                    {/* Booking Progress Indicator */}
                    <div className="booking-progress">
                      <div className={`progress-step ${bookingStep >= 1 ? 'active' : ''} ${bookingStep > 1 ? 'completed' : ''}`}>
                        <div className="step-number">1</div>
                        <div className="step-label">Choose Subject</div>
                      </div>
                      <div className={`progress-step ${bookingStep >= 2 ? 'active' : ''} ${bookingStep > 2 ? 'completed' : ''}`}>
                        <div className="step-number">2</div>
                        <div className="step-label">Select Teacher</div>
                      </div>
                      <div className={`progress-step ${bookingStep >= 3 ? 'active' : ''} ${bookingStep > 3 ? 'completed' : ''}`}>
                        <div className="step-number">3</div>
                        <div className="step-label">Pick Date & Time</div>
                      </div>
                      <div className={`progress-step ${bookingStep >= 4 ? 'active' : ''}`}>
                        <div className="step-number">4</div>
                        <div className="step-label">Confirm Booking</div>
                      </div>
                    </div>

                    {/* Step 1: Choose Subject */}
                    {bookingStep === 1 && (
                      <div className="section">
                        <h4 className="section-title">
                          <BookOpen className="icon" />
                          What subject would you like help with?
                        </h4>
                        <div className="subjects-grid">
                          {[
                            'Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology',
                            'History', 'Geography', 'Computer Science', 'Art', 'Music', 'Spanish',
                            'French', 'German', 'Economics', 'Psychology', 'Literature', 'Writing',
                            'Algebra', 'Geometry', 'Calculus', 'Statistics', 'World History', 'US History',
                            'Government', 'Philosophy', 'Environmental Science', 'Astronomy'
                          ].map(subject => (
                            <button
                              key={subject}
                              className="subject-card"
                              onClick={() => handleSubjectSelect(subject)}
                            >
                              <div className="subject-icon">
                                <BookOpen size={24} />
                              </div>
                              <div className="subject-name">{subject}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Step 2: Select Teacher */}
                    {bookingStep === 2 && (
                      <div className="section">
                        <div className="step-header">
                          <h4 className="section-title">
                            <GraduationCap className="icon" />
                            Choose a teacher for {selectedSubject}
                          </h4>
                          <button className="back-button" onClick={() => {
                            setBookingStep(1);
                            setSelectedTeacher('');
                            setTeacherList([]);
                          }}>
                            <ArrowLeft size={16} />
                            Back to Subjects
                          </button>
                        </div>
                        
                        <div className="search-container">
                          <div className="search-input-wrapper">
                            <input 
                              className="search-input" 
                              value={searchQuery} 
                              onChange={(e) => handleSearchChange(e.target.value)} 
                              placeholder="Search teachers by name or email..." 
                            />
                            {isSearching && <div className="search-loading"></div>}
                            {searchQuery && (
                              <button 
                                className="clear-search-btn"
                                onClick={() => {
                                  setSearchQuery('');
                                  performSearch('', selectedSubject);
                                }}
                              >
                                ×
                              </button>
                            )}
                          </div>

                          {isSearching && (
                            <div className="search-loading-state">
                              <div className="loading-spinner"></div>
                              <p>Searching for teachers...</p>
                            </div>
                          )}

                          {!isSearching && teacherList.length > 0 && (
                            <div className="search-results">
                              <div className="results-header">
                                <span className="results-count">
                                  <GraduationCap className="icon" />
                                  {teacherList.length} teacher{teacherList.length !== 1 ? 's' : ''} available for {selectedSubject}
                                </span>
                              </div>
                              <div className="teacher-cards">
                                {teacherList.map(t => (
                                  <div key={t._id} className={`teacher-card ${selectedTeacher === t._id ? 'selected' : ''}`} onClick={() => {
                                    setSelectedTeacher(t._id);
                                    setBookingForm({ ...bookingForm, teacherEmail: t.email });
                                    // Don't auto-advance to step 3, let user confirm selection
                                  }}>
                                    <div className="teacher-avatar">
                                      <span className="teacher-initial">{t.firstName.charAt(0)}{t.lastName.charAt(0)}</span>
                                    </div>
                                    <div className="teacher-info">
                                      <div className="teacher-header">
                                        <div className="teacher-name">{t.firstName} {t.lastName}</div>
                                      </div>
                                      <div className="teacher-email">{t.email}</div>
                                      {t.specializations && t.specializations.length > 0 && (
                                        <div className="teacher-specializations">
                                          <div className="specializations-label">Specializes in:</div>
                                          <div className="specializations-tags">
                                            {t.specializations.slice(0, 3).map(specialization => (
                                              <span key={specialization} className="specialization-tag">
                                                {specialization}
                                              </span>
                                            ))}
                                            {t.specializations.length > 3 && (
                                              <span className="specialization-more">
                                                +{t.specializations.length - 3} more
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      <div className="teacher-status">
                                        <span className="status-dot available"></span>
                                        <span className="status-text">Available</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {!isSearching && teacherList.length === 0 && (
                            <div className="no-teachers">
                              <div className="no-teachers-icon">
                                <GraduationCap className="icon" />
                              </div>
                              <p>No teachers available for {selectedSubject}</p>
                              <p className="no-teachers-suggestion">Try selecting a different subject</p>
                              <button className="back-button" onClick={() => setBookingStep(1)}>
                                <ArrowLeft size={16} />
                                Back to Subjects
                              </button>
                            </div>
                          )}

                          {/* Continue Button for Step 2 */}
                          {selectedTeacher && (
                            <div className="step-actions">
                              <button 
                                className="auth-button primary"
                                disabled={!canProceedToNextStep(2)}
                                onClick={() => setBookingStep(3)}
                              >
                                Continue to Date & Time
                                <ArrowRight size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Step 3: Pick Date & Time */}
                    {bookingStep === 3 && (
                      <div className="section">
                        <div className="step-header">
                          <h4 className="section-title">
                            <Calendar className="icon" />
                            Pick Date & Time
                          </h4>
                          <button className="back-button" onClick={() => setBookingStep(2)}>
                            <ArrowLeft size={16} />
                            Back to Teachers
                          </button>
                        </div>
                        <div className="booking-form-grid">
                          <div className="form-group">
                            <label className="form-label">
                              <Calendar className="icon" />
                              Select Date
                            </label>
                            <input 
                              type="date" 
                              className="form-input" 
                              value={availabilityDate} 
                              onChange={(e) => setAvailabilityDate(e.target.value)}
                              min={new Date().toISOString().split('T')[0]}
                            />
                            <div className="form-hint">Choose a date for your lesson</div>
                          </div>
                          <div className="form-group">
                            <label className="form-label">
                              <Clock className="icon" />
                              Duration
                            </label>
                            <div className="duration-options">
                              <button 
                                className={`duration-btn ${bookingForm.durationMinutes === 30 ? 'selected' : ''}`}
                                onClick={() => setBookingForm({ ...bookingForm, durationMinutes: 30 })}
                              >
                                30 min
                              </button>
                              <button 
                                className={`duration-btn ${bookingForm.durationMinutes === 60 ? 'selected' : ''}`}
                                onClick={() => setBookingForm({ ...bookingForm, durationMinutes: 60 })}
                              >
                                60 min
                              </button>
                              <button 
                                className={`duration-btn ${bookingForm.durationMinutes === 90 ? 'selected' : ''}`}
                                onClick={() => setBookingForm({ ...bookingForm, durationMinutes: 90 })}
                              >
                                90 min
                              </button>
                              <button 
                                className={`duration-btn ${bookingForm.durationMinutes === 120 ? 'selected' : ''}`}
                                onClick={() => setBookingForm({ ...bookingForm, durationMinutes: 120 })}
                              >
                                120 min
                              </button>
                            </div>
                            <div className="form-hint">Select your preferred lesson duration</div>
                          </div>
                        </div>
                        <div className="inline-actions">
                          <button 
                            className="auth-button primary" 
                            disabled={!selectedTeacher || !availabilityDate || isCheckingAvailability} 
                            onClick={() => handleAction(async () => {
                              try {
                                setIsCheckingAvailability(true);
                                const data = await roleAPI.getTeacherAvailability(selectedTeacher, { date: availabilityDate, durationMinutes: bookingForm.durationMinutes });
                                setAvailableSlots(data.slots || []);
                                if (data.slots && data.slots.length === 0) {
                                  showWarning('No available time slots found for the selected date and duration. Please try a different date.');
                                }
                              } catch (error) {
                                console.error('Error checking availability:', error);
                                showError('Failed to check teacher availability. Please try again.');
                                setAvailableSlots([]);
                              } finally {
                                setIsCheckingAvailability(false);
                              }
                            })}
                          >
                            {isCheckingAvailability ? (
                              <>
                                <Loader2 className="icon" style={{ animation: 'spin 1s linear infinite' }} />
                                Checking...
                              </>
                            ) : (
                              <>
                                <Search className="icon" /> Check Availability
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Time Slots Section - Part of Step 3 */}
                    {bookingStep === 3 && availableSlots.length > 0 && (
                      <div className="section">
                        <h4 className="section-title">Select a Time</h4>
                        <div className="time-slots-container">
                          <div className="time-slots-header">
                            <span className="slots-count">🕐 {availableSlots.length} available time{availableSlots.length !== 1 ? 's' : ''}</span>
                            <div className="time-format-toggle">
                              <button className="format-btn active">12h</button>
                              <button className="format-btn">24h</button>
                            </div>
                          </div>
                          <div className="time-slots-grid">
                            {availableSlots.map((iso) => {
                              const date = new Date(iso);
                              const time12h = date.toLocaleString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit', 
                                hour12: true 
                              });
                              const time24h = date.toLocaleString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit', 
                                hour12: false 
                              });
                              const isToday = date.toDateString() === new Date().toDateString();
                              const isTomorrow = date.toDateString() === new Date(Date.now() + 86400000).toDateString();
                              
                              return (
                                <div 
                                  key={iso} 
                                  className={`time-slot ${bookingForm.dateTime === iso ? 'selected' : ''}`} 
                                  onClick={() => {
                                    const timeValidation = validateBookingTime(iso);
                                    if (timeValidation.valid) {
                                      setBookingForm({ ...bookingForm, dateTime: iso, teacherEmail: (teacherList.find(t => t._id === selectedTeacher)?.email) || '' });
                                    } else {
                                      showWarning(timeValidation.message);
                                    }
                                  }}
                                >
                                  <div className="time-slot-header">
                                    <div className="time-display">
                                      <span className="time-12h">{time12h}</span>
                                      <span className="time-24h">{time24h}</span>
                                    </div>
                                    <div className="time-badge">
                                      {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : date.toLocaleDateString()}
                                    </div>
                                  </div>
                                  <div className="time-slot-details">
                                    <span className="duration-badge">{bookingForm.durationMinutes} min</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        
                        {/* Continue Button for Step 3 */}
                        {bookingForm.dateTime && (
                          <div className="step-actions">
                            <button 
                              className="auth-button primary"
                              disabled={!canProceedToNextStep(3)}
                              onClick={() => setBookingStep(4)}
                            >
                              Continue to Confirmation
                              <ArrowRight size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Step 4: Confirm Booking */}
                    {bookingStep === 4 && (
                      <div className="section">
                        <div className="step-header">
                          <h4 className="section-title">
                            <CheckCircle className="icon" />
                            Confirm Your Booking
                          </h4>
                          <button className="back-button" onClick={() => setBookingStep(3)}>
                            <ArrowLeft size={16} />
                            Back to Time Selection
                          </button>
                        </div>
                        <div className="booking-details-grid">
                          <div className="form-group">
                            <label className="form-label"><User className="icon" /> Student</label>
                            {selectedChild ? (
                              <div className="selected-child-display">
                                <div className="selected-child-info">
                                  <div className="selected-child-avatar">
                                    {(children.find(c => c._id === selectedChild)?.studentName || children.find(c => c._id === selectedChild)?.name || 'S').charAt(0).toUpperCase()}
                                  </div>
                                  <div className="selected-child-details">
                                    <div className="selected-child-name">
                                      {children.find(c => c._id === selectedChild)?.studentName || children.find(c => c._id === selectedChild)?.name || 'Student'}
                                    </div>
                                    <div className="selected-child-email">
                                      {children.find(c => c._id === selectedChild)?.email}
                                    </div>
                                  </div>
                                </div>
                                <button 
                                  className="change-child-btn"
                                  onClick={() => {
                                    setSelectedChild('');
                                    setBookingForm({ ...bookingForm, studentEmail: '' });
                                  }}
                                >
                                  Change
                                </button>
                              </div>
                            ) : (
                              <div className="child-selection-prompt">
                                <p>Please select a child from the "My Children" tab first</p>
                                <button 
                                  className="auth-button secondary"
                                  onClick={() => {
                                    setActiveTab('children');
                                  }}
                                >
                                  Go to My Children
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="form-group">
                            <label className="form-label"><Book className="icon" /> Subject</label>
                            <select 
                              className="form-input" 
                              value={bookingForm.subject} 
                              onChange={(e) => setBookingForm({ ...bookingForm, subject: e.target.value })}
                            >
                              <option value="">Select a subject</option>
                              <option value="Mathematics">Mathematics</option>
                              <option value="Physics">Physics</option>
                              <option value="Chemistry">Chemistry</option>
                              <option value="Biology">Biology</option>
                              <option value="English">English</option>
                              <option value="History">History</option>
                              <option value="Computer Science">Computer Science</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                        
                        {/* Booking Summary */}
                        {bookingForm.dateTime && bookingForm.teacherEmail && (
                          <div className="booking-summary">
                            <h5 className="summary-title"><FileText className="icon" /> Booking Summary</h5>
                            <div className="summary-content">
                              <div className="summary-item">
                                <span className="summary-label">Teacher:</span>
                                <span className="summary-value">
                                  {teacherList.find(t => t._id === selectedTeacher)?.firstName} {teacherList.find(t => t._id === selectedTeacher)?.lastName}
                                </span>
                              </div>
                              <div className="summary-item">
                                <span className="summary-label">Date & Time:</span>
                                <span className="summary-value">
                                  {new Date(bookingForm.dateTime).toLocaleString()}
                                </span>
                              </div>
                              <div className="summary-item">
                                <span className="summary-label">Duration:</span>
                                <span className="summary-value">{bookingForm.durationMinutes} minutes</span>
                              </div>
                              <div className="summary-item">
                                <span className="summary-label">Subject:</span>
                                <span className="summary-value">{bookingForm.subject || 'Not specified'}</span>
                              </div>
                              {bookingForm.studentEmail && (
                                <div className="summary-item">
                                  <span className="summary-label">Student:</span>
                                  <span className="summary-value">{bookingForm.studentEmail}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <div className="step-actions">
                          <button 
                            className="auth-button primary large" 
                            disabled={!canProceedToNextStep(4)} 
                            onClick={() => handleAction(async () => {
                              try {
                                // Final validation before booking
                                const timeValidation = validateBookingTime(bookingForm.dateTime);
                                if (!timeValidation.valid) {
                                  showWarning(timeValidation.message);
                                  return;
                                }
                                
                                await roleAPI.bookLesson({ ...bookingForm });
                                showSuccess('Lesson booked successfully! You will receive a confirmation email shortly.');
                                
                                // Reset all booking state
                                resetBookingFlow();
                                
                                // Refresh parent history
                                const historyData = await roleAPI.getParentHistory();
                                setParentHistory(historyData.lessons || []);
                              } catch (error) {
                                console.error('Booking error:', error);
                                showError('Failed to book lesson. Please try again.');
                              }
                            })}
                          >
                            <Target className="icon" /> Confirm & Book Lesson
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) },
                { key: 'history', title: 'History', content: (
                  <div className="grid-one">
                    <p className="muted">View lesson history and records. Interacts: Teachers (lesson records).</p>
                    
                    {historyLoading ? (
                      <div className="loading-container">
                        <div className="loading-spinner"></div>
                        <p>Loading lesson history...</p>
                      </div>
                    ) : parentHistory.length > 0 ? (
                      <div className="section">
                        <div className="section-header">
                          <h4 className="section-title">
                            <BookOpen className="icon" />
                            Lesson History
                          </h4>
                          <div className="results-count">
                            {parentHistory.length} lesson{parentHistory.length !== 1 ? 's' : ''} found
                          </div>
                        </div>
                        
                        <div className="history-cards">
                          {parentHistory.map(lesson => (
                            <div key={lesson._id} className="history-card">
                              {/* Student Information Header */}
                              {(lesson.studentName || lesson.studentEmail) && (
                                <div className="history-student-header">
                                  <div className="student-info">
                                    <div className="student-avatar">
                                      {(lesson.studentName || lesson.studentEmail).charAt(0).toUpperCase()}
                                    </div>
                                    <div className="student-details">
                                      <div className="student-name">
                                        {lesson.studentName || lesson.studentEmail}
                                      </div>
                                      {lesson.studentGrade && (
                                        <div className="student-grade">
                                          Grade {lesson.studentGrade}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Lesson Content */}
                              <div className="history-content">
                                <div className="history-header">
                                  <div className="lesson-subject">
                                    <BookOpen className="icon" />
                                    {lesson.subject || 'General Lesson'}
                                  </div>
                                  <div className="lesson-duration">
                                    <Clock className="icon" />
                                    {lesson.durationMinutes || 60} min
                                  </div>
                                </div>
                                
                                <div className="history-details">
                                  <div className="detail-item">
                                    <Calendar className="icon" />
                                    <span>{new Date(lesson.dateTime).toLocaleString()}</span>
                                  </div>
                                  
                                  {lesson.teacherName && (
                                    <div className="detail-item">
                                      <GraduationCap className="icon" />
                                      <span>With {lesson.teacherName}</span>
                                    </div>
                                  )}
                                  
                                  {lesson.status && (
                                    <div className="detail-item">
                                      <div className={`status-indicator status-${lesson.status.toLowerCase()}`}>
                                        {lesson.status === 'completed' ? <CheckCircle className="icon" /> :
                                         lesson.status === 'in_progress' ? <RotateCcw className="icon" /> :
                                         lesson.status === 'booked' ? <FileText className="icon" /> :
                                         <Calendar className="icon" />}
                                        <span>{lesson.status}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Actions */}
                                {new Date(lesson.dateTime) > new Date() && (
                                  <div className="history-actions">
                                    <button 
                                      className="auth-button danger btn-sm"
                                      onClick={() => handleCancelLesson(lesson)}
                                      disabled={cancellingLesson === lesson._id}
                                      title="Cancel this lesson"
                                    >
                                      {cancellingLesson === lesson._id ? (
                                        <>
                                          <span className="loading-spinner-small"></span>
                                          Cancelling...
                                        </>
                                      ) : (
                                        <>
                                          <Trash2 className="icon" />
                                          Cancel Lesson
                                        </>
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="no-lessons">
                        <div className="no-lessons-icon"><BookOpen className="icon" /></div>
                        <h4>No lesson history found</h4>
                        <p className="muted">Your lesson history will appear here once you start booking lessons.</p>
                      </div>
                    )}
                  </div>
                ) }
              ]}
            />
          </div>
        );
      case 'Admin':
        return (
          <div className="dashboard-actions">
            <h3>Admin Panel</h3>
            <Tabs
              activeKey={activeTab}
              onTabChange={setActiveTab}
              tabs={[
                { key: 'overview', title: 'Overview', content: (
                  <div className="grid-one">
                    <p className="muted">System overview and statistics for platform management.</p>
                    
                    <div className="section">
                      <h4 className="section-title">
                        <Target className="icon" />
                        System Statistics
                      </h4>
                      <div className="stats-grid">
                        <div className="stat-card">
                          <div className="stat-icon"><Users className="icon" /></div>
                          <div className="stat-content">
                            <div className="stat-value">{adminStats.totalUsers || 0}</div>
                            <div className="stat-label">Total Users</div>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon"><BookOpen className="icon" /></div>
                          <div className="stat-content">
                            <div className="stat-value">{adminStats.totalLessons || 0}</div>
                            <div className="stat-label">Total Lessons</div>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon"><GraduationCap className="icon" /></div>
                          <div className="stat-content">
                            <div className="stat-value">{adminStats.usersByRole?.teachers || 0}</div>
                            <div className="stat-label">Teachers</div>
                          </div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-icon"><Clock className="icon" /></div>
                          <div className="stat-content">
                            <div className="stat-value">{adminStats.totalTeacherHours?.toFixed(1) || 0}</div>
                            <div className="stat-label">Total Hours</div>
                          </div>
                        </div>
                      </div>
                      
                      {adminStats.usersByRole && (
                        <div className="section" style={{ marginTop: '32px' }}>
                          <h4 className="section-title">User Breakdown</h4>
                          <div className="stats-grid">
                            <div className="stat-card">
                              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                                <Users className="icon" />
                              </div>
                              <div className="stat-content">
                                <div className="stat-value">{adminStats.usersByRole.parents || 0}</div>
                                <div className="stat-label">Parents</div>
                              </div>
                            </div>
                            <div className="stat-card">
                              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
                                <User className="icon" />
                              </div>
                              <div className="stat-content">
                                <div className="stat-value">{adminStats.usersByRole.students || 0}</div>
                                <div className="stat-label">Students</div>
                              </div>
                            </div>
                            <div className="stat-card">
                              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
                                <GraduationCap className="icon" />
                              </div>
                              <div className="stat-content">
                                <div className="stat-value">{adminStats.usersByRole.teachers || 0}</div>
                                <div className="stat-label">Teachers</div>
                              </div>
                            </div>
                            <div className="stat-card">
                              <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                                <UserCheck className="icon" />
                              </div>
                              <div className="stat-content">
                                <div className="stat-value">{adminStats.usersByRole.admins || 0}</div>
                                <div className="stat-label">Admins</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) },
                { key: 'users', title: 'Manage Users', content: (
                  <div className="grid-one">
                    <p className="muted">View, search, and manage all users in the system. Ban or unban users as needed.</p>
                    
                    <div className="section">
                      <div className="section-header">
                        <h4 className="section-title">
                          <Users className="icon" />
                          User Management
                        </h4>
                        <div className="admin-filters">
                          <select 
                            className="form-input"
                            value={adminFilters.users.role}
                            onChange={(e) => {
                              setAdminFilters(prev => ({
                                ...prev,
                                users: { ...prev.users, role: e.target.value }
                              }));
                            }}
                          >
                            <option value="all">All Roles</option>
                            <option value="Parent">Parents</option>
                            <option value="Student">Students</option>
                            <option value="Teacher">Teachers</option>
                            <option value="Admin">Admin</option>
                          </select>
                          <select 
                            className="form-input"
                            value={adminFilters.users.status}
                            onChange={(e) => {
                              setAdminFilters(prev => ({
                                ...prev,
                                users: { ...prev.users, status: e.target.value }
                              }));
                            }}
                          >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="banned">Banned</option>
                          </select>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Search users..."
                            value={adminFilters.users.search}
                            onChange={(e) => {
                              setAdminFilters(prev => ({
                                ...prev,
                                users: { ...prev.users, search: e.target.value }
                              }));
                            }}
                          />
                          <button className="auth-button primary" onClick={loadAdminUsers}>
                            <Search className="icon" />
                            Search
                          </button>
                        </div>
                      </div>
                      
                      <div className="admin-table-container">
                        {adminLoading ? (
                          <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading users...</p>
                          </div>
                        ) : adminUsers.length > 0 ? (
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>User</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Hourly Rate</th>
                                <th>Status</th>
                                <th>Joined</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminUsers.map(user => (
                                <tr key={user._id}>
                                  <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                      <div className="child-avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>
                                        {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                                      </div>
                                      <div>
                                        <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
                                          {user.firstName} {user.lastName}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                          ID: {user._id.slice(-8)}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>{user.email}</td>
                                  <td>
                                    <span className={`role-badge ${user.role.toLowerCase()}`}>
                                      {user.role}
                                    </span>
                                  </td>
                                  <td>
                                    {user.role === 'Teacher' ? (
                                      editingRate === user._id ? (
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                          <input
                                            type="number"
                                            className="form-input"
                                            style={{ width: '80px', padding: '4px 8px', fontSize: '0.85rem' }}
                                            value={newRate}
                                            onChange={(e) => setNewRate(e.target.value)}
                                            placeholder="Rate"
                                            min="1"
                                            step="0.5"
                                          />
                                          <button
                                            className="admin-action-btn unban"
                                            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                            onClick={() => handleUpdateTeacherRate(user._id, parseFloat(newRate))}
                                          >
                                            Save
                                          </button>
                                          <button
                                            className="admin-action-btn ban"
                                            style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                                            onClick={() => {
                                              setEditingRate(null);
                                              setNewRate('');
                                            }}
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                          <span className="payment-amount">${user.hourlyRate || 25}/hr</span>
                                          <button
                                            className="admin-action-btn"
                                            style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                                            onClick={() => {
                                              setEditingRate(user._id);
                                              setNewRate((user.hourlyRate || 25).toString());
                                            }}
                                          >
                                            <Edit3 className="icon" />
                                            Edit
                                          </button>
                                        </div>
                                      )
                                    ) : (
                                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>N/A</span>
                                    )}
                                  </td>
                                  <td>
                                    <span className={`user-status-badge ${user.isActive ? 'active' : 'banned'}`}>
                                      <CheckCircle className="icon" />
                                      {user.isActive ? 'Active' : 'Banned'}
                                    </span>
                                  </td>
                                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                  <td>
                                    <div className="admin-action-buttons">
                                      {user.role !== 'Admin' && (
                                        <button 
                                          className={`admin-action-btn ${user.isActive ? 'ban' : 'unban'}`}
                                          onClick={() => {
                                            const reason = user.isActive 
                                              ? prompt('Please provide a reason for banning this user:')
                                              : prompt('Please provide a reason for unbanning this user:');
                                            if (reason !== null) { // null means user cancelled
                                              handleBanUser(user._id, user.isActive, reason);
                                            }
                                          }}
                                        >
                                          <AlertTriangle className="icon" />
                                          {user.isActive ? 'Ban' : 'Unban'}
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="admin-empty">
                            <Users className="icon" />
                            <h4>No users found</h4>
                            <p>Try adjusting your search filters</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) },
                { key: 'lessons', title: 'Manage Lessons', content: (
                  <div className="grid-one">
                    <p className="muted">View all lessons, filter by status, and manage bookings across the platform.</p>
                    
                    <div className="section">
                      <div className="section-header">
                        <h4 className="section-title">
                          <BookOpen className="icon" />
                          Lesson Management
                        </h4>
                        <div className="admin-filters">
                          <select 
                            className="form-input"
                            value={adminFilters.lessons.status}
                            onChange={(e) => {
                              setAdminFilters(prev => ({
                                ...prev,
                                lessons: { ...prev.lessons, status: e.target.value }
                              }));
                            }}
                          >
                            <option value="all">All Status</option>
                            <option value="booked">Booked</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button className="auth-button primary" onClick={loadAdminLessons}>
                            <Search className="icon" />
                            Load Lessons
                          </button>
                        </div>
                      </div>
                      
                      <div className="admin-table-container">
                        {adminLoading ? (
                          <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading lessons...</p>
                          </div>
                        ) : adminLessons.length > 0 ? (
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Date & Time</th>
                                <th>Teacher</th>
                                <th>Student</th>
                                <th>Subject</th>
                                <th>Duration</th>
                                <th>Status</th>
                                <th>Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminLessons.map(lesson => (
                                <tr key={lesson._id}>
                                  <td>
                                    <div>{new Date(lesson.dateTime).toLocaleDateString()}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                      {new Date(lesson.dateTime).toLocaleTimeString()}
                                    </div>
                                  </td>
                                  <td>
                                    {lesson.teacher ? (
                                      <div>
                                        <div style={{ fontWeight: '500' }}>
                                          {lesson.teacher.firstName} {lesson.teacher.lastName}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                          {lesson.teacher.email}
                                        </div>
                                      </div>
                                    ) : 'Unknown Teacher'}
                                  </td>
                                  <td>
                                    <div>{lesson.studentEmail}</div>
                                    {lesson.studentName && (
                                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {lesson.studentName}
                                      </div>
                                    )}
                                  </td>
                                  <td>{lesson.subject || 'General'}</td>
                                  <td>{lesson.durationMinutes || 60} min</td>
                                  <td>
                                    <span className={`lesson-status-badge ${lesson.status}`}>
                                      {lesson.status === 'completed' && <CheckCircle className="icon" style={{ width: '12px', height: '12px', margin: 0 }} />}
                                      {lesson.status === 'in_progress' && <RotateCcw className="icon" style={{ width: '12px', height: '12px', margin: 0 }} />}
                                      {lesson.status === 'booked' && <Calendar className="icon" style={{ width: '12px', height: '12px', margin: 0 }} />}
                                      {lesson.status || 'Unknown'}
                                    </span>
                                  </td>
                                  <td>
                                    <div className="admin-action-buttons">
                                      <button 
                                        className="admin-action-btn delete"
                                        onClick={() => handleDeleteLesson(lesson._id, 'Admin deletion')}
                                      >
                                        <Trash2 className="icon" />
                                        Delete
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="admin-empty">
                            <BookOpen className="icon" />
                            <h4>No lessons found</h4>
                            <p>Try adjusting your search filters or load lessons</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) },
                { key: 'payments', title: 'Teacher Salaries', content: (
                  <div className="grid-one">
                    <p className="muted">Comprehensive teacher salary management with individual hourly rates and detailed work tracking.</p>
                    
                    <div className="section">
                      <div className="section-header">
                        <h4 className="section-title">
                          <Target className="icon" />
                          Salary Report
                        </h4>
                        <div className="admin-filters">
                          <input 
                            type="date" 
                            className="form-input" 
                            placeholder="From Date"
                            value={adminFilters.payments.fromDate}
                            onChange={(e) => {
                              setAdminFilters(prev => ({
                                ...prev,
                                payments: { ...prev.payments, fromDate: e.target.value }
                              }));
                            }}
                          />
                          <input 
                            type="date" 
                            className="form-input" 
                            placeholder="To Date"
                            value={adminFilters.payments.toDate}
                            onChange={(e) => {
                              setAdminFilters(prev => ({
                                ...prev,
                                payments: { ...prev.payments, toDate: e.target.value }
                              }));
                            }}
                          />
                          <select 
                            className="form-input"
                            value={adminFilters.payments.teacherId}
                            onChange={(e) => {
                              setAdminFilters(prev => ({
                                ...prev,
                                payments: { ...prev.payments, teacherId: e.target.value }
                              }));
                            }}
                          >
                            <option value="">All Teachers</option>
                            {adminUsers.filter(u => u.role === 'Teacher').map(teacher => (
                              <option key={teacher._id} value={teacher._id}>
                                {teacher.firstName} {teacher.lastName}
                              </option>
                            ))}
                          </select>
                          <button className="auth-button primary" onClick={loadSalaryReport}>
                            <Search className="icon" />
                            Generate Report
                          </button>
                        </div>
                      </div>
                      
                      {overallTotals.totalTeachers > 0 && (
                        <div className="section" style={{ padding: '20px', background: 'var(--bg-tertiary)', marginTop: '20px', borderRadius: '12px' }}>
                          <h5 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
                            <FileText className="icon" />
                            Overall Summary
                          </h5>
                          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px' }}>
                            <div className="stat-card" style={{ padding: '16px', background: 'var(--bg-secondary)' }}>
                              <div className="stat-content">
                                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{overallTotals.totalTeachers}</div>
                                <div className="stat-label">Active Teachers</div>
                              </div>
                            </div>
                            <div className="stat-card" style={{ padding: '16px', background: 'var(--bg-secondary)' }}>
                              <div className="stat-content">
                                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{overallTotals.totalHours.toFixed(1)}</div>
                                <div className="stat-label">Total Hours</div>
                              </div>
                            </div>
                            <div className="stat-card" style={{ padding: '16px', background: 'var(--bg-secondary)' }}>
                              <div className="stat-content">
                                <div className="stat-value" style={{ fontSize: '1.5rem', color: 'var(--accent-primary)' }}>
                                  ${overallTotals.totalSalary.toFixed(2)}
                                </div>
                                <div className="stat-label">Total Salary</div>
                              </div>
                            </div>
                            <div className="stat-card" style={{ padding: '16px', background: 'var(--bg-secondary)' }}>
                              <div className="stat-content">
                                <div className="stat-value" style={{ fontSize: '1.5rem' }}>{overallTotals.totalEntries}</div>
                                <div className="stat-label">Total Entries</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="admin-table-container" style={{ marginTop: '20px' }}>
                        {adminLoading ? (
                          <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Generating salary report...</p>
                          </div>
                        ) : salaryReport.length > 0 ? (
                          <div>
                            {salaryReport.map(report => (
                              <div key={report.teacher._id} className="salary-teacher-section" style={{ 
                                marginBottom: '32px', 
                                background: 'var(--bg-secondary)', 
                                borderRadius: '12px', 
                                overflow: 'hidden',
                                border: '1px solid var(--border-light)'
                              }}>
                                <div style={{ 
                                  padding: '20px', 
                                  background: 'var(--bg-tertiary)', 
                                  borderBottom: '1px solid var(--border-light)' 
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                      <h5 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                                        {report.teacher.firstName} {report.teacher.lastName}
                                      </h5>
                                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        {report.teacher.email}
                                      </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                      <div style={{ fontSize: '1.8rem', fontWeight: '700', color: 'var(--accent-primary)' }}>
                                        ${report.totalSalary.toFixed(2)}
                                      </div>
                                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        ${report.teacher.hourlyRate}/hr × {report.totalHours.toFixed(1)} hrs
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginTop: '16px' }}>
                                    <div>
                                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Total Hours</div>
                                      <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{report.totalHours.toFixed(1)}</div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Work Sessions</div>
                                      <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{report.totalEntries}</div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Avg Hours/Session</div>
                                      <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>{report.averageHoursPerEntry.toFixed(1)}</div>
                                    </div>
                                    <div>
                                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Last Worked</div>
                                      <div style={{ fontSize: '1.2rem', fontWeight: '600' }}>
                                        {report.lastWorkedDate ? new Date(report.lastWorkedDate).toLocaleDateString() : 'N/A'}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                
                                {report.entries.length > 0 && (
                                  <div style={{ padding: '0' }}>
                                    <table className="admin-table" style={{ margin: '0', borderRadius: '0' }}>
                                      <thead>
                                        <tr>
                                          <th>Date</th>
                                          <th>Hours</th>
                                          <th>Rate</th>
                                          <th>Salary</th>
                                          <th>Status</th>
                                          <th>Notes</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {report.entries.slice(0, 5).map(entry => (
                                          <tr key={entry._id}>
                                            <td>{new Date(entry.date).toLocaleDateString()}</td>
                                            <td>{entry.hours.toFixed(1)} hrs</td>
                                            <td>${entry.hourlyRate}/hr</td>
                                            <td className="payment-amount">${entry.salary.toFixed(2)}</td>
                                            <td>
                                              <span className={`user-status-badge ${entry.paymentStatus === 'paid' ? 'active' : 'banned'}`}>
                                                {entry.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                                              </span>
                                            </td>
                                            <td style={{ maxWidth: '200px', fontSize: '0.85rem' }}>
                                              {entry.notes || 'No notes'}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                    {report.entries.length > 5 && (
                                      <div style={{ padding: '12px 20px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        ... and {report.entries.length - 5} more entries
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="admin-empty">
                            <Target className="icon" />
                            <h4>No salary data found</h4>
                            <p>Generate a salary report to see teacher payment information</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) },
                { key: 'logs', title: 'Activity Logs', content: (
                  <div className="grid-one">
                    <p className="muted">View admin activity logs and system audit trail.</p>
                    
                    <div className="section">
                      <h4 className="section-title">
                        <FileText className="icon" />
                        Admin Activity Logs
                      </h4>
                      
                      <div style={{ marginBottom: '20px' }}>
                        <button className="auth-button primary" onClick={loadAdminLogs}>
                          <FileText className="icon" />
                          Load Activity Logs
                        </button>
                      </div>
                      
                      <div className="admin-table-container">
                        {adminLoading ? (
                          <div className="loading-container">
                            <div className="loading-spinner"></div>
                            <p>Loading activity logs...</p>
                          </div>
                        ) : adminLogs.length > 0 ? (
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Timestamp</th>
                                <th>Admin</th>
                                <th>Action</th>
                                <th>Reason</th>
                              </tr>
                            </thead>
                            <tbody>
                              {adminLogs.map(log => (
                                <tr key={log._id}>
                                  <td>
                                    <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                      {new Date(log.timestamp).toLocaleTimeString()}
                                    </div>
                                  </td>
                                  <td>
                                    <div>{log.admin.firstName} {log.admin.lastName}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                      {log.admin.email}
                                    </div>
                                  </td>
                                  <td>
                                    <span className={`lesson-status-badge ${log.action.toLowerCase().includes('delete') ? 'cancelled' : 'completed'}`}>
                                      {log.action.replace('_', ' ')}
                                    </span>
                                  </td>
                                  <td>{log.reason || 'No reason provided'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="admin-empty">
                            <FileText className="icon" />
                            <h4>No activity logs found</h4>
                            <p>Load activity logs to see admin actions</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) }
              ]}
            />
          </div>
        );
      case 'Student':
        return (
          <div className="dashboard-actions">
            <h3>Your Upcoming Lessons</h3>
                  <div className="grid-one">
              <p className="muted">All your scheduled upcoming lessons. Interacts: Parents (who booked), Teachers (who teach).</p>
                    {upcoming.length > 0 ? (
                <div className="weekly-calendar-container">
                  <div className="lessons-header">
                    <span className="lessons-count">{upcoming.length} upcoming lesson{upcoming.length !== 1 ? 's' : ''}</span>
                            </div>
                  
                  <div className="week-navigation">
                    <button 
                      className="nav-button prev-week" 
                      onClick={goToPreviousWeek}
                      title="Previous Week"
                    >
                      ←
                    </button>
                    <button 
                      className="nav-button current-week" 
                      onClick={goToCurrentWeek}
                      title="Current Week"
                    >
                      Today
                    </button>
                    <button 
                      className="nav-button next-week" 
                      onClick={goToNextWeek}
                      title="Next Week"
                    >
                      →
                    </button>
                          </div>
                  
                  {(() => {
                    // Calculate current week based on offset
                    const currentDate = new Date();
                    const targetDate = new Date(currentDate);
                    targetDate.setDate(currentDate.getDate() + (weekOffset * 7));
                    
                    // Get start of target week (Sunday)
                    const weekStart = new Date(targetDate);
                    weekStart.setDate(targetDate.getDate() - targetDate.getDay());
                    weekStart.setHours(0, 0, 0, 0);
                    
                    // Get end of target week (Saturday)
                    const weekEnd = new Date(weekStart);
                    weekEnd.setDate(weekStart.getDate() + 6);
                    weekEnd.setHours(23, 59, 59, 999);
                    
                    // Filter lessons for current week
                    const currentWeekLessons = upcoming.filter(lesson => {
                      const lessonDate = new Date(lesson.dateTime);
                      return lessonDate >= weekStart && lessonDate <= weekEnd;
                    });
                    
                    // Group lessons by days within the week
                    const dayGroups = currentWeekLessons.reduce((days, lesson) => {
                      const lessonDate = new Date(lesson.dateTime);
                      const dayKey = lessonDate.toDateString();
                      
                      if (!days[dayKey]) {
                        days[dayKey] = {
                          date: lessonDate,
                          lessons: []
                        };
                      }
                      
                      days[dayKey].lessons.push(lesson);
                      return days;
                    }, {});
                    
                    // Create all 7 days of the week
                    const allDays = [];
                    for (let i = 0; i < 7; i++) {
                      const dayDate = new Date(weekStart);
                      dayDate.setDate(weekStart.getDate() + i);
                      allDays.push({
                        date: dayDate,
                        lessons: []
                      });
                    }
                    
                    // Merge lessons into the complete week structure
                    const completeWeek = allDays.map(day => {
                      const dayKey = day.date.toDateString();
                      const hasLessons = dayGroups[dayKey];
                      return {
                        date: day.date,
                        lessons: hasLessons ? hasLessons.lessons : []
                      };
                    });
                    
                    return (
                      <div className="week-container">
                        <div className="week-header">
                          <h4 className="week-title">
                            Week of {weekStart.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })} - {weekEnd.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </h4>
                          <span className="week-lesson-count">{currentWeekLessons.length} lesson{currentWeekLessons.length !== 1 ? 's' : ''}</span>
                      </div>
                        
                        <div className="week-grid">
                          {completeWeek.map((day, dayIndex) => {
                              const isToday = day.date.toDateString() === new Date().toDateString();
                              const isTomorrow = day.date.toDateString() === new Date(Date.now() + 86400000).toDateString();
                              
                              return (
                                <div key={dayIndex} className={`day-container ${isToday ? 'today' : ''} ${isTomorrow ? 'tomorrow' : ''}`}>
                                  <div className="day-header">
                                    <div className="day-name">
                                      {day.date.toLocaleDateString('en-US', { weekday: 'long' })}
                      </div>
                                    <div className="day-date">
                                      {day.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </div>
                                  </div>
                                  {(isToday || isTomorrow) && (
                                    <div className="day-badge">
                                      {isToday ? 'Today' : 'Tomorrow'}
                                    </div>
                                  )}
                                  
                                  <div className="day-lessons">
                            {day.lessons.length > 0 ? (
                              day.lessons.map((lesson, lessonIndex) => {
                                const lessonTime = new Date(lesson.dateTime);
                                
                                return (
                                  <div 
                                    key={lessonIndex} 
                                    className="lesson-item"
                                    onMouseEnter={(e) => handleLessonHover(lesson, e)}
                                    onMouseLeave={handleLessonLeave}
                                    onMouseMove={(e) => setTooltipPosition({ x: e.clientX, y: e.clientY })}
                                  >
                                    <div className="lesson-item-header">
                                      <div className="lesson-time-badge">
                                        {lessonTime.toLocaleTimeString('en-US', { 
                                          hour: '2-digit', 
                                          minute: '2-digit',
                                          hour12: true 
                                        })}
                                      </div>
                                      <div className="lesson-status-indicator">
                                        {lesson.status === 'booked' ? <FileText className="icon" /> : 
                                         lesson.status === 'in_progress' ? <RotateCcw className="icon" /> :
                                         lesson.status === 'completed' ? <CheckCircle className="icon" /> : <Calendar className="icon" />}
                                      </div>
                                    </div>
                                    
                                    <div className="lesson-content">
                                      <div className="lesson-subject">
                                        {lesson.subject || 'General Lesson'}
                                      </div>
                                      
                                      <div className="lesson-duration">
                                        <span className="duration-badge">{(lesson.durationMinutes || 60)} min</span>
                                      </div>
                                      
                                      {/* Meeting Link - Show when lesson time is live */}
                                      {(() => {
                                        const now = new Date();
                                        const lessonTime = new Date(lesson.dateTime);
                                        const timeUntilLesson = lessonTime - now;
                                        const tenMinutesInMs = 10 * 60 * 1000;
                                        const isLessonLive = timeUntilLesson <= tenMinutesInMs && timeUntilLesson > -60 * 60 * 1000; // 1 hour after lesson start
                                        
                                        if (isLessonLive && lesson.teacherMeetingLink) {
                                          return (
                                            <div className="lesson-meeting">
                                              <a 
                                                href={lesson.teacherMeetingLink} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="join-meeting-button"
                                              >
                                                🎥 Join Meeting
                                              </a>
                                            </div>
                                          );
                                        } else if (isLessonLive && !lesson.teacherMeetingLink) {
                                          return (
                                            <div className="lesson-meeting">
                                              <button 
                                                className="contact-teacher-button"
                                                onClick={() => {
                                                  // Set up contact form for this teacher
                                                  setContactForm({ 
                                                    teacherEmail: lesson.teacherEmail, 
                                                    message: `Hi! I'm ready for my ${lesson.subject || 'lesson'} that's scheduled for ${new Date(lesson.dateTime).toLocaleString()}. Could you please share the meeting link?` 
                                                  });
                                                  setOpenModal('contact');
                                                }}
                                              >
                                                📞 Contact teacher for meeting link
                                              </button>
                                            </div>
                                          );
                                        }
                                        return null;
                                      })()}
                                    </div>
                                  </div>
                                );
                              })
                                    ) : (
                                      <div className="empty-day">
                                        <div className="empty-day-icon"><Calendar className="icon" /></div>
                                        <div className="empty-day-text">No lessons</div>
                                      </div>
                    )}
                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                      </div>
                    ) : (
                <div className="no-lessons">
                  <div className="no-lessons-icon"><BookOpen className="icon" /></div>
                  <h4>No upcoming lessons this week</h4>
                  <p className="muted">
                    Your weekly calendar is empty. Your parents can book lessons for you, or you can explore available teachers.
                  </p>
                </div>
                    )}
                  </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Modals
  // Render tooltip
  const renderTooltip = () => {
    if (!hoveredLesson) return null;

    const lessonTime = new Date(hoveredLesson.dateTime);
    
    return (
      <div 
        className="lesson-tooltip"
        style={{
          left: tooltipPosition.x + 10,
          top: tooltipPosition.y - 10,
        }}
      >
        <div className="tooltip-content">
          <div className="tooltip-header">
            <div className="tooltip-time">
              {lessonTime.toLocaleString('en-US', { 
                weekday: 'long',
                month: 'short', 
                day: 'numeric',
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              })}
            </div>
            <div className="tooltip-status">
              <span className={`status-text status-${hoveredLesson.status}`}>
                {hoveredLesson.status === 'booked' ? 'Booked' : 
                 hoveredLesson.status === 'in_progress' ? 'In Progress' :
                 hoveredLesson.status === 'completed' ? 'Completed' : hoveredLesson.status}
              </span>
            </div>
          </div>
          
          <div className="tooltip-body">
            <div className="tooltip-subject">
              <strong>Subject:</strong> {hoveredLesson.subject || 'General Lesson'}
            </div>
            
            <div className="tooltip-duration">
              <strong>Duration:</strong> {hoveredLesson.durationMinutes || 60} minutes
            </div>
            
            {hoveredLesson.teacherName && (
              <div className="tooltip-teacher">
                <strong>Teacher:</strong> {hoveredLesson.teacherName}
              </div>
            )}
            
            {hoveredLesson.description && (
              <div className="tooltip-description">
                <strong>Description:</strong> {hoveredLesson.description}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderModals = () => (
    <>
      <Modal isOpen={openModal === 'hours'} title="Report Working Hours" onClose={() => setOpenModal(null)}>
        <div className="form-group">
          <label className="form-label">Date</label>
          <input type="date" className="form-input" value={hoursForm.date} onChange={(e) => setHoursForm({ ...hoursForm, date: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Hours</label>
          <input type="number" min="0" step="0.5" className="form-input" value={hoursForm.hours} onChange={(e) => setHoursForm({ ...hoursForm, hours: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Notes</label>
          <input type="text" className="form-input" value={hoursForm.notes} onChange={(e) => setHoursForm({ ...hoursForm, notes: e.target.value })} />
        </div>
        <button className="auth-button" onClick={() => handleAction(async () => {
          await roleAPI.reportWorkingHours({ date: hoursForm.date, hours: Number(hoursForm.hours), notes: hoursForm.notes });
          showSuccess('Working hours reported');
          setHoursForm({ date: '', hours: '', notes: '' });
          setOpenModal(null);
        })}>Submit</button>
      </Modal>

      <Modal isOpen={openModal === 'constraint'} title={editingConstraint ? "Edit Time Constraint" : "Add Time Constraint"} onClose={() => setOpenModal(null)}>
        <div className="form-group">
          <label className="form-label">Day of Week</label>
          <select className="form-input" value={constraintForm.dayOfWeek} onChange={(e) => setConstraintForm({ ...constraintForm, dayOfWeek: Number(e.target.value) })}>
            <option value={0}>Sunday</option>
            <option value={1}>Monday</option>
            <option value={2}>Tuesday</option>
            <option value={3}>Wednesday</option>
            <option value={4}>Thursday</option>
            <option value={5}>Friday</option>
            <option value={6}>Saturday</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Start Time (HH:MM)</label>
          <input type="time" className="form-input" value={constraintForm.startTime} onChange={(e) => setConstraintForm({ ...constraintForm, startTime: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">End Time (HH:MM)</label>
          <input type="time" className="form-input" value={constraintForm.endTime} onChange={(e) => setConstraintForm({ ...constraintForm, endTime: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Note</label>
          <input type="text" className="form-input" value={constraintForm.note} onChange={(e) => setConstraintForm({ ...constraintForm, note: e.target.value })} />
        </div>
        <button className="auth-button" onClick={() => handleAction(async () => {
          if (editingConstraint) {
            await roleAPI.updateTimeConstraint(editingConstraint._id, { ...constraintForm });
            showSuccess('Time constraint updated');
          } else {
            await roleAPI.addTimeConstraint({ ...constraintForm });
            showSuccess('Time constraint saved');
          }
          const data = await roleAPI.getTimeConstraints();
          setConstraints(data.constraints || []);
          setConstraintForm({ dayOfWeek: 0, startTime: '', endTime: '', note: '' });
          setEditingConstraint(null);
          setOpenModal(null);
        })}>{editingConstraint ? 'Update' : 'Save'}</button>
      </Modal>


      <Modal isOpen={openModal === 'book'} title="Book Lesson" onClose={() => setOpenModal(null)}>
        <div className="form-group">
          <label className="form-label">Teacher Email</label>
          <input className="form-input" value={bookingForm.teacherEmail} onChange={(e) => setBookingForm({ ...bookingForm, teacherEmail: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Student Email (optional)</label>
          <input className="form-input" value={bookingForm.studentEmail} onChange={(e) => setBookingForm({ ...bookingForm, studentEmail: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Date & Time</label>
          <input type="datetime-local" className="form-input" value={bookingForm.dateTime} onChange={(e) => setBookingForm({ ...bookingForm, dateTime: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Subject</label>
          <input className="form-input" value={bookingForm.subject} onChange={(e) => setBookingForm({ ...bookingForm, subject: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Duration (minutes)</label>
          <input type="number" className="form-input" value={bookingForm.durationMinutes} onChange={(e) => setBookingForm({ ...bookingForm, durationMinutes: Number(e.target.value) })} />
        </div>
        <button className="auth-button" onClick={() => handleAction(async () => {
          await roleAPI.bookLesson({ ...bookingForm });
          showSuccess('Lesson booked');
          setBookingForm({ teacherEmail: '', dateTime: '', subject: '', durationMinutes: 60, studentEmail: '' });
          setOpenModal(null);
        })}>Book</button>
      </Modal>

      <Modal isOpen={openModal === 'contact'} title="Contact Teacher" onClose={() => setOpenModal(null)}>
        <div className="form-group">
          <label className="form-label">Teacher Email</label>
          <input className="form-input" value={contactForm.teacherEmail} onChange={(e) => setContactForm({ ...contactForm, teacherEmail: e.target.value })} />
        </div>
        <div className="form-group">
          <label className="form-label">Message</label>
          <input className="form-input" value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} />
        </div>
        <button className="auth-button" onClick={() => handleAction(async () => {
          await roleAPI.contactTeacher({ ...contactForm });
          showSuccess('Message sent');
          setContactForm({ teacherEmail: '', message: '' });
          setOpenModal(null);
        })}>Send</button>
      </Modal>

      <Modal isOpen={openModal === 'chat'} title={`Chat with ${studentConversation.teacher?.firstName || ''} ${studentConversation.teacher?.lastName || ''}`} onClose={() => setOpenModal(null)}>
        <div className="conversation" style={{ maxHeight: '400px', marginBottom: '16px' }}>
          {studentConversation.messages.length === 0 ? (
            <span className="muted">No messages yet.</span>
          ) : (
            studentConversation.messages.map((m) => {
              const isMe = !!m.fromStudentId; // current student authored
              return (
                <div key={m._id} className={`bubble ${isMe ? 'me' : 'them'}`}>
                  <div>{m.message}</div>
                  <div className="bubble-meta">{new Date(m.createdAt).toLocaleString()}</div>
                </div>
              );
            })
          )}
        </div>

        <div className="chat-input">
          <input className="form-input" placeholder="Write a message..." value={contactForm.message} onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })} />
          <button className="auth-button" onClick={() => handleAction(async () => {
            await roleAPI.contactTeacher({ teacherEmail: contactForm.teacherEmail, message: contactForm.message });
            const data = await roleAPI.getStudentConversation({ teacherEmail: contactForm.teacherEmail });
            setStudentConversation({ teacher: data.teacher, messages: data.messages || [] });
            // Refresh conversations list
            const conversationsData = await roleAPI.getStudentConversations();
            setStudentConversationsList(conversationsData.conversations || []);
            setContactForm({ ...contactForm, message: '' });
          })}>Send</button>
        </div>
      </Modal>

      <Modal isOpen={openModal === 'teacher-chat'} title={`Chat with ${teacherChatConversation.student?.firstName || ''} ${teacherChatConversation.student?.lastName || ''}`} onClose={() => setOpenModal(null)}>
        <div className="conversation" style={{ maxHeight: '400px', marginBottom: '16px' }}>
          {teacherChatConversation.messages.length === 0 ? (
            <span className="muted">No messages yet.</span>
          ) : (
            teacherChatConversation.messages.map((m) => {
              const isMe = !!m.fromTeacherId; // current teacher authored
              return (
                <div key={m._id} className={`bubble ${isMe ? 'me' : 'them'}`}>
                  <div>{m.message}</div>
                  <div className="bubble-meta">{new Date(m.createdAt).toLocaleString()}</div>
                </div>
              );
            })
          )}
        </div>

        <div className="chat-input">
          <input className="form-input" placeholder="Write a message..." value={teacherChatForm.message} onChange={(e) => setTeacherChatForm({ ...teacherChatForm, message: e.target.value })} />
          <button className="auth-button" onClick={() => handleAction(async () => {
            await roleAPI.teacherReply({ studentId: teacherChatConversation.student._id, message: teacherChatForm.message });
            const data = await roleAPI.getTeacherConversation({ studentId: teacherChatConversation.student._id });
            setTeacherChatConversation({ student: data.student, messages: data.messages || [] });
            // Refresh conversations list
            const conversationsData = await roleAPI.getTeacherConversations();
            setTeacherConversations(conversationsData.conversations || []);
            setTeacherChatForm({ message: '' });
          })}>Send</button>
        </div>
      </Modal>

      <Modal isOpen={openModal === 'complete'} title="Complete Lesson" onClose={() => setOpenModal(null)}>
        <p style={{ color: '#6c757d', marginBottom: '16px' }}>Mark this lesson as completed and payable. Use this if you didn't use clock-in/clock-out.</p>
        <div className="form-group">
          <label className="form-label">Worked Minutes</label>
          <input type="number" className="form-input" value={completeLessonState.workedMinutes} onChange={(e) => setCompleteLessonState({ ...completeLessonState, workedMinutes: e.target.value })} placeholder="Enter actual minutes worked" />
          <small style={{ color: '#6c757d', fontSize: '12px' }}>Default: {completeLessonState.workedMinutes || 60} minutes (scheduled duration)</small>
        </div>
        <button className="auth-button" onClick={() => handleAction(async () => {
          await roleAPI.completeLesson(completeLessonState.lessonId, Number(completeLessonState.workedMinutes));
          showSuccess('Lesson completed and payable');
          setCompleteLessonState({ lessonId: '', workedMinutes: '' });
          setOpenModal(null);
          // Refresh schedule to show updated lesson status
          const data = await roleAPI.getTeacherSchedule();
          setTeacherLessons(data.lessons || []);
        })}>Mark as Complete</button>
      </Modal>

      <Modal isOpen={showAddChild} title="Connect Existing Student" onClose={() => setShowAddChild(false)}>
            <div className="modal-description">
              <p>To connect a child to your account, they must already have a student account registered. Please make sure your child has signed up as a student first.</p>
              <p><strong>Note:</strong> You will set your child's grade level when connecting them to your account.</p>
            </div>
        <div className="form-group">
          <label className="form-label">Child's Email</label>
          <input 
            className="form-input" 
            type="email"
            value={newChildForm.email} 
            onChange={(e) => setNewChildForm({ ...newChildForm, email: e.target.value })}
            placeholder="child@example.com"
          />
          <div className="form-hint"><AlertTriangle className="icon" /> Must be an existing student account email</div>
        </div>
              <div className="form-group">
                <label className="form-label">Grade Level *</label>
                <select 
                  className="form-input" 
                  value={newChildForm.grade} 
                  onChange={(e) => setNewChildForm({ ...newChildForm, grade: e.target.value })}
                  required
                >
                  <option value="">Select grade</option>
                  <option value="K">Kindergarten</option>
                  <option value="1">1st Grade</option>
                  <option value="2">2nd Grade</option>
                  <option value="3">3rd Grade</option>
                  <option value="4">4th Grade</option>
                  <option value="5">5th Grade</option>
                  <option value="6">6th Grade</option>
                  <option value="7">7th Grade</option>
                  <option value="8">8th Grade</option>
                  <option value="9">9th Grade</option>
                  <option value="10">10th Grade</option>
                  <option value="11">11th Grade</option>
                  <option value="12">12th Grade</option>
                  <option value="College">College</option>
                </select>
                <div className="form-hint"><Book className="icon" /> Select your child's current grade level</div>
              </div>
        <button 
          className="auth-button primary" 
          onClick={addChild}
          disabled={!newChildForm.email || !newChildForm.grade}
        >
          Connect Student
        </button>
      </Modal>

      {/* Cancel Lesson Confirmation Modal */}
      <Modal isOpen={showCancelConfirm} title="Cancel Lesson" onClose={cancelCancelLesson}>
        {lessonToCancel && (
          <div className="cancel-lesson-confirm">
            <div className="warning-icon"><AlertTriangle className="icon" /></div>
            <h3>Are you sure you want to cancel this lesson?</h3>
            
            <div className="lesson-details-confirm">
              <div className="lesson-info">
                <strong>Subject:</strong> {lessonToCancel.subject || 'General Lesson'}
              </div>
              <div className="lesson-info">
                <strong>Date & Time:</strong> {new Date(lessonToCancel.dateTime).toLocaleString()}
              </div>
              <div className="lesson-info">
                <strong>Duration:</strong> {lessonToCancel.durationMinutes || 60} minutes
              </div>
              {lessonToCancel.teacherName && (
                <div className="lesson-info">
                  <strong>Teacher:</strong> {lessonToCancel.teacherName}
                </div>
              )}
              {(lessonToCancel.studentName || lessonToCancel.studentEmail) && (
                <div className="lesson-info">
                  <strong>Student:</strong> {lessonToCancel.studentName || lessonToCancel.studentEmail}
                </div>
              )}
            </div>
            
            <div className="cancel-warning">
              <p><strong>Note:</strong> This action cannot be undone. The teacher and student will be notified of the cancellation.</p>
            </div>
            
            <div className="modal-actions">
              <button 
                className="auth-button secondary" 
                onClick={cancelCancelLesson}
                disabled={cancellingLesson}
              >
                Keep Lesson
              </button>
              <button 
                className="auth-button danger" 
                onClick={confirmCancelLesson}
                disabled={cancellingLesson}
              >
                {cancellingLesson ? (
                  <>
                    <span className="loading-spinner-small"></span>
                    Cancelling...
                  </>
                ) : (
                  'Yes, Cancel Lesson'
                )}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* AI Chat Modal */}
      <Modal isOpen={openModal === 'ai-chat'} title="AI Tutor Chat" onClose={() => setOpenModal(null)} isFullWidth={true}>
        <AIChat user={user} />
      </Modal>

    </>
  );

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

  if (showProfile) {
    return (
      <div className="app-layout">
        <Header 
          user={user} 
          onLogout={handleLogout} 
          onProfile={handleProfile} 
          onBackToDashboard={handleBackToDashboard} 
          notifications={notifications} 
          onMarkAllRead={handleMarkAllRead} 
          onMessages={user?.role !== 'Parent' ? handleMessages : null} 
          onAIChat={() => setOpenModal('ai-chat')}
          currentView="profile" 
        />
        <main className="main-content">
          <Profile user={user} onUpdateUser={handleUpdateUser} onDeleteAccount={handleDeleteAccount} />
        </main>
        
        {user?.role !== 'Parent' && (
          <MessagesSidebar 
            isOpen={showMessages} 
            onClose={handleCloseMessages} 
            user={user} 
            roleAPI={roleAPI} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Header 
        user={user} 
        onLogout={handleLogout} 
        onProfile={handleProfile} 
        onBackToDashboard={handleBackToDashboard} 
        notifications={notifications} 
        onMarkAllRead={handleMarkAllRead} 
        onMessages={user?.role !== 'Parent' ? handleMessages : null} 
        onAIChat={() => setOpenModal('ai-chat')}
        currentView="dashboard" 
      />
      
      <main className="main-content">
        <div className="dashboard-container">
          <div className="dashboard-content">
            <div className="dashboard-card">
              {getRoleActions()}
            </div>
          </div>
          {renderTooltip()}
          {renderModals()}
        </div>
      </main>
      
      {user?.role !== 'Parent' && (
        <MessagesSidebar 
          isOpen={showMessages} 
          onClose={handleCloseMessages} 
          user={user} 
          roleAPI={roleAPI} 
        />
      )}
    </div>
  );
};

export default Dashboard;