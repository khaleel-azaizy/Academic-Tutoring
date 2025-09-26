import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, roleAPI } from '../services/api';
import Modal from './Modal';
import Tabs from './Tabs';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [openModal, setOpenModal] = useState(null); // 'hours' | 'constraint' | 'book' | 'contact'

  // Teacher action state
  const [hoursForm, setHoursForm] = useState({ date: '', hours: '', notes: '' });
  const [constraintForm, setConstraintForm] = useState({ dayOfWeek: 0, startTime: '', endTime: '', note: '' });
  const [timeRange, setTimeRange] = useState({ from: '', to: '' });
  const [hoursSummary, setHoursSummary] = useState(null);
  const [hoursEntries, setHoursEntries] = useState([]);
  const [teacherLessons, setTeacherLessons] = useState([]);
  const [completeLessonState, setCompleteLessonState] = useState({ lessonId: '', workedMinutes: '' });
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedMessageIds, setSelectedMessageIds] = useState([]);

  // Parent action state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [bookingForm, setBookingForm] = useState({ teacherEmail: '', dateTime: '', subject: '', durationMinutes: 60, studentEmail: '' });
  const [teacherList, setTeacherList] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [availabilityDate, setAvailabilityDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);

  // Student action state
  const [upcoming, setUpcoming] = useState([]);
  const [contactForm, setContactForm] = useState({ teacherEmail: '', message: '' });

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

  const handleAction = async (fn) => {
    try {
      setActionError('');
      setActionSuccess('');
      await fn();
    } catch (err) {
      setActionError(err.error || err.message || 'Action failed');
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
            <h3>Actions</h3>
            {actionError && <div className="error-message">{actionError}</div>}
            {actionSuccess && <div className="success-message">{actionSuccess}</div>}
            <Tabs
              tabs={[
                { key: 'schedule', title: 'Schedule', content: (
                  <div className="grid-one">
                    <p style={{ color: '#6c757d', margin: '0 0 10px' }}>View upcoming lessons and clock in/out at start/end. Interacts: Parents (book/changes), Students (attendance), Managers (coordination).</p>
                    <button className="auth-button" onClick={() => handleAction(async () => {
                      const data = await roleAPI.getTeacherSchedule();
                      setTeacherLessons(data.lessons || []);
                      setActionSuccess(`Loaded ${data.lessons?.length || 0} lessons`);
                    })}>Load Schedule</button>
                    {teacherLessons.length > 0 && (
                      <ul>
                        {teacherLessons.map((l) => (
                          <li key={l._id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span>{new Date(l.dateTime).toLocaleString()} — {l.subject || 'Lesson'}</span>
                            <button className="auth-button" onClick={() => handleAction(async () => { await roleAPI.clockIn(l._id); setActionSuccess('Clocked in'); })}>Clock-in</button>
                            <button className="auth-button" onClick={() => handleAction(async () => { await roleAPI.clockOut(l._id); setActionSuccess('Clocked out'); })}>Clock-out</button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) },
                { key: 'hours', title: 'Hours', content: (
                  <div className="grid-one">
                    <p style={{ color: '#6c757d', margin: '0 0 10px' }}>Report hours and view totals/entries for payroll tracking. Interacts: Managers (payroll/review).</p>
                    <div className="grid-two">
                      <div className="form-group">
                        <label className="form-label">From</label>
                        <input type="date" className="form-input" value={timeRange.from} onChange={(e) => setTimeRange({ ...timeRange, from: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">To</label>
                        <input type="date" className="form-input" value={timeRange.to} onChange={(e) => setTimeRange({ ...timeRange, to: e.target.value })} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="auth-button" onClick={() => setOpenModal('hours')}>Report Hours</button>
                      <button className="auth-button" onClick={() => handleAction(async () => {
                        const data = await roleAPI.hoursSummary({ from: timeRange.from || undefined, to: timeRange.to || undefined });
                        setHoursSummary(data);
                        const list = await roleAPI.hoursEntries({ from: timeRange.from || undefined, to: timeRange.to || undefined });
                        setHoursEntries(list.entries || []);
                      })}>Load Summary</button>
                    </div>
                    {hoursSummary && (<p><strong>Total Hours:</strong> {hoursSummary.totalHours?.toFixed(2) || 0} ({hoursSummary.count} entries)</p>)}
                    {hoursEntries.length > 0 && (
                      <ul>
                        {hoursEntries.map((e) => (<li key={e._id}>{new Date(e.date).toLocaleDateString()} — {Number(e.hours).toFixed(2)}h</li>))}
                      </ul>
                    )}
                  </div>
                ) },
                { key: 'constraints', title: 'Constraints', content: (
                  <div className="grid-one">
                    <p style={{ color: '#6c757d', margin: '0 0 10px' }}>Submit your unavailability (days/times). Interacts: Managers (approval/coordinating), Parents (booking availability).</p>
                    <button className="auth-button" onClick={() => setOpenModal('constraint')}>Add Constraint</button>
                  </div>
                ) },
                { key: 'complete', title: 'Complete', content: (
                  <div className="grid-one">
                    <p style={{ color: '#6c757d', margin: '0 0 10px' }}>Mark a lesson completed and payable if you didn’t use clock in/out. Interacts: Managers (payments), Parents (billing/status).</p>
                    <div className="form-group">
                      <label className="form-label">Lesson ID</label>
                      <input className="form-input" value={completeLessonState.lessonId} onChange={(e) => setCompleteLessonState({ ...completeLessonState, lessonId: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Worked Minutes</label>
                      <input type="number" className="form-input" value={completeLessonState.workedMinutes} onChange={(e) => setCompleteLessonState({ ...completeLessonState, workedMinutes: e.target.value })} />
                    </div>
                    <button className="auth-button" onClick={() => handleAction(async () => {
                      await roleAPI.completeLesson(completeLessonState.lessonId, Number(completeLessonState.workedMinutes));
                      setActionSuccess('Lesson completed and payable');
                      setCompleteLessonState({ lessonId: '', workedMinutes: '' });
                    })}>Complete</button>
                  </div>
                ) },
                { key: 'notifications', title: 'Notifications', content: (
                  <div className="grid-one">
                    <p style={{ color: '#6c757d', margin: '0 0 10px' }}>See updates about bookings and changes. Interacts: Parents (bookings/changes), Managers (system alerts).</p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="auth-button" onClick={() => handleAction(async () => { const data = await roleAPI.notifications(); setNotifications(data.notifications || []); })}>Load</button>
                      <button className="auth-button" onClick={() => handleAction(async () => { await roleAPI.notificationsMarkAllRead(); setActionSuccess('Marked read'); })}>Mark All Read</button>
                    </div>
                    {notifications.length > 0 && (
                      <ul>
                        {notifications.map((n) => (<li key={n._id}>{n.message} {n.read ? '' : '(new)'} — {new Date(n.createdAt).toLocaleString()}</li>))}
                      </ul>
                    )}
                  </div>
                ) },
                { key: 'payments', title: 'Payments', content: (
                  <div className="grid-one">
                    <p style={{ color: '#6c757d', margin: '0 0 10px' }}>View simulated payment entries for completed lessons. Interacts: Managers (payment processing).</p>
                    <button className="auth-button" onClick={() => handleAction(async () => { const data = await roleAPI.payments(); setActionSuccess(`Loaded ${data.payments?.length || 0} payments`); })}>Load Payments</button>
                  </div>
                ) },
                { key: 'messages', title: 'Messages', content: (
                  <div className="grid-one">
                    <p style={{ color: '#6c757d', margin: '0 0 10px' }}>Read messages sent by students/parents and mark them as read. Interacts: Students, Parents.</p>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="auth-button" onClick={() => handleAction(async () => { const data = await roleAPI.messages(); setMessages(data.messages || []); setSelectedMessageIds([]); })}>Load Messages</button>
                      <button className="auth-button" onClick={() => handleAction(async () => { await roleAPI.messagesMarkRead(selectedMessageIds); setActionSuccess('Marked selected as read'); })} disabled={selectedMessageIds.length === 0}>Mark Selected Read</button>
                    </div>
                    {messages.length > 0 && (
                      <ul>
                        {messages.map((m) => (
                          <li key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <input type="checkbox" checked={selectedMessageIds.includes(m._id)} onChange={(e) => {
                              const id = m._id;
                              setSelectedMessageIds(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id));
                            }} />
                            <span>{m.message}</span>
                            <span style={{ color: '#6c757d' }}>— {new Date(m.createdAt).toLocaleString()}</span>
                            {!m.read && <span style={{ color: '#d63384', marginLeft: 8 }}>(new)</span>}
                          </li>
                        ))}
            </ul>
                    )}
                  </div>
                ) }
              ]}
            />
          </div>
        );
      case 'Parent':
        return (
          <div className="dashboard-actions">
            <h3>Actions</h3>
            {actionError && <div className="error-message">{actionError}</div>}
            {actionSuccess && <div className="success-message">{actionSuccess}</div>}
            <Tabs
              tabs={[
                { key: 'search', title: 'Search', content: (
                  <div className="grid-one">
                    <p style={{ color: '#6c757d', margin: '0 0 10px' }}>Find instructors (name/email). Subject/time filters coming later. Interacts: Teachers (availability).</p>
                    <button className="auth-button" onClick={() => setOpenModal('search')}>Open Search</button>
                  </div>
                ) },
                { key: 'book', title: 'Book', content: (
                  <div className="grid-one">
                    <p className="muted">Schedule and confirm lessons with instructors. Interacts: Teachers (schedule), Students (attendance).</p>

                    <div className="section">
                      <h4 className="section-title">1) Choose Instructor</h4>
                      <div className="inline-actions">
                        <input className="form-input" style={{ flex: 1 }} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search name or email" />
                        <button className="auth-button" onClick={() => handleAction(async () => { const data = await roleAPI.searchTeachers(searchQuery); setTeacherList(data.teachers || []); })}>Search</button>
                      </div>
                      <div className="card-list">
                        {teacherList.map(t => (
                          <div key={t._id} className={`card ${selectedTeacher === t._id ? 'selected' : ''}`} onClick={() => setSelectedTeacher(t._id)}>
                            <div style={{ fontWeight: 600 }}>{t.firstName} {t.lastName}</div>
                            <div className="muted" style={{ fontSize: '0.9rem' }}>{t.email}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="section">
                      <h4 className="section-title">2) Pick Date & Duration</h4>
                      <div className="grid-two">
                        <div className="form-group">
                          <label className="form-label">Date</label>
                          <input type="date" className="form-input" value={availabilityDate} onChange={(e) => setAvailabilityDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Duration (minutes)</label>
                          <input type="number" className="form-input" value={bookingForm.durationMinutes} onChange={(e) => setBookingForm({ ...bookingForm, durationMinutes: Number(e.target.value) })} />
                        </div>
                      </div>
                      <div className="inline-actions">
                        <button className="auth-button" disabled={!selectedTeacher || !availabilityDate} onClick={() => handleAction(async () => {
                          const data = await roleAPI.getTeacherAvailability(selectedTeacher, { date: availabilityDate, durationMinutes: bookingForm.durationMinutes });
                          setAvailableSlots(data.slots || []);
                        })}>Load Available Slots</button>
                      </div>
                    </div>

                    {availableSlots.length > 0 && (
                      <div className="section">
                        <h4 className="section-title">3) Select a Time</h4>
                        <div className="card-list">
                          {availableSlots.map((iso) => (
                            <div key={iso} className={`card ${bookingForm.dateTime === iso ? 'selected' : ''}`} onClick={() => setBookingForm({ ...bookingForm, dateTime: iso, teacherEmail: (teacherList.find(t => t._id === selectedTeacher)?.email) || '' })}>
                              {new Date(iso).toLocaleString()}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="section">
                      <h4 className="section-title">4) Add Details & Confirm</h4>
                      <div className="grid-two">
                        <div className="form-group">
                          <label className="form-label">Student Email (optional)</label>
                          <input className="form-input" value={bookingForm.studentEmail} onChange={(e) => setBookingForm({ ...bookingForm, studentEmail: e.target.value })} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Subject</label>
                          <input className="form-input" value={bookingForm.subject} onChange={(e) => setBookingForm({ ...bookingForm, subject: e.target.value })} />
                        </div>
                      </div>
                      <div className="inline-actions">
                        <button className="auth-button" disabled={!bookingForm.dateTime || !bookingForm.teacherEmail} onClick={() => handleAction(async () => {
                          await roleAPI.bookLesson({ ...bookingForm });
                          setActionSuccess('Lesson booked');
                          setAvailableSlots([]);
                          setBookingForm({ teacherEmail: '', dateTime: '', subject: '', durationMinutes: 60, studentEmail: '' });
                          setSelectedTeacher('');
                        })}>Book Selected Slot</button>
                      </div>
                    </div>
                  </div>
                ) },
                { key: 'history', title: 'History', content: (
                  <div className="grid-one">
                    <p style={{ color: '#6c757d', margin: '0 0 10px' }}>View lesson history and records. Interacts: Teachers (lesson records).</p>
                    <button className="auth-button" onClick={() => handleAction(async () => { const data = await roleAPI.getParentHistory(); setActionSuccess(`Loaded ${data.lessons?.length || 0} lessons`); })}>Load History</button>
                  </div>
                ) }
              ]}
            />
          </div>
        );
      case 'Student':
        return (
          <div className="dashboard-actions">
            <h3>Actions</h3>
            {actionError && <div className="error-message">{actionError}</div>}
            {actionSuccess && <div className="success-message">{actionSuccess}</div>}
            <Tabs
              tabs={[
                { key: 'upcoming', title: 'Upcoming', content: (
                  <div className="grid-one">
                    <p style={{ color: '#6c757d', margin: '0 0 10px' }}>See your upcoming lesson times. Interacts: Parents (who booked), Teachers (who teach).</p>
                    <button className="auth-button" onClick={() => handleAction(async () => { const data = await roleAPI.getStudentUpcoming(); setUpcoming(data.lessons || []); setActionSuccess(`Loaded ${data.lessons?.length || 0} lessons`); })}>Load Upcoming</button>
                    {upcoming.length > 0 && (
                      <ul>
                        {upcoming.map(l => (<li key={l._id}>{new Date(l.dateTime).toLocaleString()} - {l.subject || 'Lesson'}</li>))}
            </ul>
                    )}
                  </div>
                ) },
                { key: 'contact', title: 'Contact', content: (
                  <div className="grid-one">
                    <p style={{ color: '#6c757d', margin: '0 0 10px' }}>Message your instructor if you have questions or changes. Interacts: Teachers.</p>
                    <button className="auth-button" onClick={() => setOpenModal('contact')}>Open Contact</button>
                  </div>
                ) }
              ]}
            />
          </div>
        );
      default:
        return null;
    }
  };

  // Modals
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
          setActionSuccess('Working hours reported');
          setHoursForm({ date: '', hours: '', notes: '' });
          setOpenModal(null);
        })}>Submit</button>
      </Modal>

      <Modal isOpen={openModal === 'constraint'} title="Add Time Constraint" onClose={() => setOpenModal(null)}>
        <div className="form-group">
          <label className="form-label">Day of Week (0=Sun, 6=Sat)</label>
          <input type="number" min="0" max="6" className="form-input" value={constraintForm.dayOfWeek} onChange={(e) => setConstraintForm({ ...constraintForm, dayOfWeek: Number(e.target.value) })} />
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
          await roleAPI.addTimeConstraint({ ...constraintForm });
          setActionSuccess('Time constraint saved');
          setConstraintForm({ dayOfWeek: 0, startTime: '', endTime: '', note: '' });
          setOpenModal(null);
        })}>Save</button>
      </Modal>

      <Modal isOpen={openModal === 'search'} title="Search Teachers" onClose={() => setOpenModal(null)}>
        <div className="form-group">
          <label className="form-label">Query</label>
          <input className="form-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Name or email" />
        </div>
        <button className="auth-button" onClick={() => handleAction(async () => {
          const data = await roleAPI.searchTeachers(searchQuery);
          setSearchResults(data.teachers || []);
          setActionSuccess(`Found ${data.teachers?.length || 0} teachers`);
        })}>Search</button>
        {searchResults.length > 0 && (
          <ul style={{ marginTop: '10px' }}>
            {searchResults.map(t => (
              <li key={t._id}>{t.firstName} {t.lastName} - {t.email}</li>
            ))}
          </ul>
        )}
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
          setActionSuccess('Lesson booked');
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
          setActionSuccess('Message sent');
          setContactForm({ teacherEmail: '', message: '' });
          setOpenModal(null);
        })}>Send</button>
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
      {renderModals()}
    </div>
  );
};

export default Dashboard;