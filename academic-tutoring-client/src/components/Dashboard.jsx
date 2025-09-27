import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, roleAPI } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import Modal from './Modal';
import Tabs from './Tabs';
import Header from './Header';
import Profile from './Profile';
import MessagesSidebar from './MessagesSidebar';
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
  MessageCircle
} from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openModal, setOpenModal] = useState(null); // 'hours' | 'constraint' | 'book' | 'contact' | 'chat' | 'teacher-chat'

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
  const [bookingForm, setBookingForm] = useState({ teacherEmail: '', dateTime: '', subject: '', durationMinutes: 60, studentEmail: '' });
  const [teacherList, setTeacherList] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [availabilityDate, setAvailabilityDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [parentHistory, setParentHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  
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
        } catch (error) {
          console.error('Error loading parent history:', error);
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
      const response = await roleAPI.updateProfile(profileData);
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));
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

  // Real-time search for teachers
  const handleSearchChange = (query) => {
    console.log('Search query changed:', query);
    setSearchQuery(query);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // If query is empty, clear results
    if (!query.trim()) {
      setTeacherList([]);
      return;
    }
    
    // Set loading state
    setIsSearching(true);
    console.log('Starting search for:', query);
    
    // Set new timeout for search
    const timeout = setTimeout(async () => {
      try {
        console.log('Executing search for:', query);
        const data = await roleAPI.searchTeachers(query);
        console.log('Search results:', data.teachers);
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
                              {l.status === 'booked' && !l.clockInAt && (
                                <button className="auth-button btn-sm" onClick={() => handleAction(async () => { 
                                  await roleAPI.clockIn(l._id); 
                                  showSuccess('Clocked in'); 
                                  // Refresh schedule
                                  const data = await roleAPI.getTeacherSchedule();
                                  setTeacherLessons(data.lessons || []);
                                })}>
                                  <Clock className="icon" /> Clock-in
                                </button>
                              )}
                              {l.status === 'in_progress' && l.clockInAt && !l.clockOutAt && (
                                <button className="auth-button btn-sm" onClick={() => handleAction(async () => { 
                                  await roleAPI.clockOut(l._id); 
                                  showSuccess('Clocked out'); 
                                  // Refresh schedule
                                  const data = await roleAPI.getTeacherSchedule();
                                  setTeacherLessons(data.lessons || []);
                                })}>
                                  <Clock className="icon" /> Clock-out
                                </button>
                              )}
                              {l.status === 'completed' && (
                                <div className="lesson-completed">
                                  <CheckCircle className="icon" />
                                  <span>Completed</span>
                                </div>
                              )}
                              {l.status === 'booked' && !l.clockInAt && (
                                <button className="auth-button btn-sm success" onClick={() => {
                                  setCompleteLessonState({ lessonId: l._id, workedMinutes: l.durationMinutes || 60 });
                                  setOpenModal('complete');
                                }}>
                                  <CheckCircle className="icon" /> Complete
                                </button>
                              )}
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

                    <div className="section">
                      <h4 className="section-title">1) Choose Instructor</h4>
                      <div className="search-container">
                        <div className="search-input-wrapper">
                          <input 
                            className="search-input" 
                            value={searchQuery} 
                            onChange={(e) => handleSearchChange(e.target.value)} 
                            placeholder="Search teachers by name, email, or subject..." 
                          />
                          {isSearching && <div className="search-loading"></div>}
                      </div>
                        

                        {searchQuery && !isSearching && teacherList.length === 0 && (
                          <div className="no-results">
                            <div className="no-results-icon">
                              <Search className="icon" />
                            </div>
                            <p>No teachers found matching "{searchQuery}"</p>
                            <p className="no-results-suggestion">Try adjusting your search terms</p>
                          </div>
                        )}
                        {isSearching && (
                          <div className="search-loading-state">
                            <div className="loading-spinner"></div>
                            <p>Searching for teachers...</p>
                          </div>
                        )}
                        {teacherList.length > 0 && (
                          <div className="search-results">
                            <div className="results-header">
                              <span className="results-count">
                                <GraduationCap className="icon" />
                                {teacherList.length} teacher{teacherList.length !== 1 ? 's' : ''} found
                              </span>
                            </div>
                            <div className="teacher-cards">
                        {teacherList.map(t => (
                                <div key={t._id} className={`teacher-card ${selectedTeacher === t._id ? 'selected' : ''}`} onClick={() => setSelectedTeacher(t._id)}>
                                  <div className="teacher-avatar">
                                    <span className="teacher-initial">{t.firstName.charAt(0)}{t.lastName.charAt(0)}</span>
                                  </div>
                                  <div className="teacher-info">
                                    <div className="teacher-header">
                                      <div className="teacher-name">{t.firstName} {t.lastName}</div>
                                    </div>
                                    <div className="teacher-email">{t.email}</div>
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
                      </div>
                    </div>

                    <div className="section">
                      <h4 className="section-title">2) Pick Date & Duration</h4>
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
                          disabled={!selectedTeacher || !availabilityDate} 
                          onClick={() => handleAction(async () => {
                          const data = await roleAPI.getTeacherAvailability(selectedTeacher, { date: availabilityDate, durationMinutes: bookingForm.durationMinutes });
                          setAvailableSlots(data.slots || []);
                          })}
                        >
                          <Search className="icon" /> Check Availability
                        </button>
                      </div>
                    </div>

                    {availableSlots.length > 0 && (
                      <div className="section">
                        <h4 className="section-title">3) Select a Time</h4>
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
                                  onClick={() => setBookingForm({ ...bookingForm, dateTime: iso, teacherEmail: (teacherList.find(t => t._id === selectedTeacher)?.email) || '' })}
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
                      </div>
                    )}

                    <div className="section">
                      <h4 className="section-title">4) Add Details & Confirm</h4>
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
                                  // This would switch to the children tab
                                  // For now, just show a message
                                  showError('Please go to "My Children" tab to select a child first');
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
                      
                      <div className="inline-actions">
                        <button 
                          className="auth-button primary large" 
                          disabled={!bookingForm.dateTime || !bookingForm.teacherEmail} 
                          onClick={() => handleAction(async () => {
                          await roleAPI.bookLesson({ ...bookingForm });
                            showSuccess('Lesson booked successfully!');
                          setAvailableSlots([]);
                          setBookingForm({ teacherEmail: '', dateTime: '', subject: '', durationMinutes: 60, studentEmail: '' });
                          setSelectedTeacher('');
                          })}
                        >
                          <Target className="icon" /> Book This Lesson
                        </button>
                      </div>
                    </div>
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
        <div>
        <Header 
          user={user} 
          onLogout={handleLogout} 
          onProfile={handleProfile} 
          onBackToDashboard={handleBackToDashboard} 
          notifications={notifications} 
          onMarkAllRead={handleMarkAllRead} 
          onMessages={user?.role !== 'Parent' ? handleMessages : null} 
          currentView="profile" 
        />
        <Profile user={user} onUpdateUser={handleUpdateUser} onDeleteAccount={handleDeleteAccount} />
        
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
    <div>
      <Header 
        user={user} 
        onLogout={handleLogout} 
        onProfile={handleProfile} 
        onBackToDashboard={handleBackToDashboard} 
        notifications={notifications} 
        onMarkAllRead={handleMarkAllRead} 
        onMessages={user?.role !== 'Parent' ? handleMessages : null} 
        currentView="dashboard" 
      />
      
      <div className="dashboard-container">
      <div className="dashboard-content">

        <div className="dashboard-card">
          {getRoleActions()}
        </div>
      </div>

        {renderTooltip()}
        {renderModals()}
      </div>
      
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