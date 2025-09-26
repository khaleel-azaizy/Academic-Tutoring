const express = require('express')
const { getDb, connectToDb } = require('./db')
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const { ObjectId } = require('mongodb');
const e = require('express');

const app = express()
app.use(express.json())
app.use(cookieParser());  
app.use(cors({origin: 'http://localhost:5173',credentials: true}));

let db

connectToDb((err) => {
  if(!err){
    app.listen('4000', () => {
      console.log('app listening on port 4000')
    })
    db = getDb()
  }
})

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

// User Registration Route
app.post('/api/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, phoneNumber, grade } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ error: 'כל השדות הנדרשים חייבים להיות מלאים' });
    }

    // Validate role
    const validRoles = ['Parent', 'Student', 'Teacher'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    // Additional validation for student role
    if (role === 'Student' && !grade) {
      return res.status(400).json({ error: 'Grade is required for students' });
    }

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user object
    const newUser = {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role,
      phoneNumber: phoneNumber || null,
      grade: role === 'Student' ? grade : null,
      createdAt: new Date(),
      isActive: true
    };

    // Insert user into database
    const result = await db.collection('users').insertOne(newUser);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: result.insertedId,
        email: email,
        role: role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    });

    // Return success response (excluding password)
    const { password: _, ...userResponse } = newUser;
    userResponse._id = result.insertedId;

    res.status(201).json({
      message: 'User registered successfully',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User Login Route
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await db.collection('users').findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Account is not active' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    });

    // Return success response (excluding password)
    const { password: _, ...userResponse } = user;

    res.status(200).json({
      message: 'Login successful',
      user: userResponse,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// User Logout Route
app.post('/api/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'Logout successful' });
});

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'אין הרשאה - נדרש טוקן' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get user from database to ensure they still exist and are active
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(decoded.userId) },
      { projection: { password: 0 } } // Exclude password from result
    );

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'משתמש לא תקין או לא פעיל' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'טוקן לא תקין' });
  }
};

// Protected route example - Get user profile
app.get('/api/profile', authenticateToken, (req, res) => {
  res.json({
    message: 'פרופיל המשתמש',
    user: req.user
  });
});

// Role-based authorization middleware
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'אין הרשאה' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'אין הרשאה לביצוע פעולה זו' });
    }

    next();
  };
};

// Example protected route for employees only
app.get('/api/employee-dashboard', authenticateToken, authorizeRole('Teacher'), (req, res) => {
  res.json({
    message: 'Teacher Dashboard',
    user: req.user
  });
});

// Example protected route for parents only
app.get('/api/parent-dashboard', authenticateToken, authorizeRole('Parent'), (req, res) => {
  res.json({
    message: 'Parent Dashboard',
    user: req.user
  });
});

// Example protected route for students only
app.get('/api/student-dashboard', authenticateToken, authorizeRole('Student'), (req, res) => {
  res.json({
    message: 'Student Dashboard',
    user: req.user
  });
});

// Get all users (Admin only - you can create admin role later)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const users = await db.collection('users').find(
      {},
      { projection: { password: 0 } } // Exclude passwords
    ).toArray();

    res.json({
      message: 'רשימת משתמשים',
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'שגיאה בטעינת רשימת המשתמשים' });
  }
});

// Update user profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, grade } = req.body;
    const userId = req.user._id;

    const updateData = {
      firstName,
      lastName,
      phoneNumber,
      updatedAt: new Date()
    };

    // Only add grade if user is a student
    if (req.user.role === 'Student' && grade) {
      updateData.grade = grade;
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }

    // Get updated user
    const updatedUser = await db.collection('users').findOne(
      { _id: new ObjectId(userId) },
      { projection: { password: 0 } }
    );

    res.json({
      message: 'פרופיל עודכן בהצלחה',
      user: updatedUser
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'שגיאה בעדכון הפרופיל' });
  }
});


// Change password
app.put('/api/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'סיסמה נוכחית וסיסמה חדשה נדרשות' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'סיסמה חדשה חייבת להכיל לפחות 6 תווים' });
    }

    // Get user with password
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    
    if (!user) {
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: 'סיסמה נוכחית שגויה' });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          password: hashedNewPassword,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'משתמש לא נמצא' });
    }

    res.json({ message: 'סיסמה שונתה בהצלחה' });

  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'שגיאה בשינוי הסיסמה' });
  }
});

// =========================
// Teacher Actions Endpoints
// =========================

// Report working hours
app.post('/api/teacher/working-hours', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const { date, hours, notes } = req.body || {};
    if (!date || typeof hours !== 'number' || hours <= 0) {
      return res.status(400).json({ error: 'date and positive numeric hours are required' });
    }
    const doc = {
      teacherId: new ObjectId(req.user._id),
      date: new Date(date),
      hours,
      notes: notes || '',
      createdAt: new Date()
    };
    const result = await db.collection('working_hours').insertOne(doc);
    return res.status(201).json({ message: 'Working hours reported', id: result.insertedId });
  } catch (error) {
    console.error('Report working hours error:', error);
    return res.status(500).json({ error: 'Failed to report working hours' });
  }
});

// Submit time constraints
app.post('/api/teacher/time-constraints', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, note } = req.body || {};
    if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6 || !startTime || !endTime) {
      return res.status(400).json({ error: 'dayOfWeek (0-6), startTime, endTime are required' });
    }
    const doc = {
      teacherId: new ObjectId(req.user._id),
      dayOfWeek,
      startTime,
      endTime,
      note: note || '',
      createdAt: new Date()
    };
    const result = await db.collection('time_constraints').insertOne(doc);
    return res.status(201).json({ message: 'Time constraint saved', id: result.insertedId });
  } catch (error) {
    console.error('Add time constraint error:', error);
    return res.status(500).json({ error: 'Failed to save time constraint' });
  }
});

// Get teacher schedule (upcoming lessons)
app.get('/api/teacher/schedule', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const now = new Date();
    const lessons = await db.collection('lessons')
      .find({ teacherId: new ObjectId(req.user._id), dateTime: { $gte: now } })
      .sort({ dateTime: 1 })
      .limit(100)
      .toArray();
    return res.json({ lessons });
  } catch (error) {
    console.error('Get teacher schedule error:', error);
    return res.status(500).json({ error: 'Failed to load schedule' });
  }
});

// =========================
// Parent Actions Endpoints
// =========================

// Search teachers
app.get('/api/teachers/search', authenticateToken, async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const filter = { role: 'Teacher' };
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } },
        { email: { $regex: regex } }
      ];
    }
    const teachers = await db.collection('users').find(filter, {
      projection: { password: 0 }
    }).limit(50).toArray();
    return res.json({ teachers });
  } catch (error) {
    console.error('Search teachers error:', error);
    return res.status(500).json({ error: 'Failed to search teachers' });
  }
});

// Teacher availability for a specific date
app.get('/api/teachers/:teacherId/availability', authenticateToken, async (req, res) => {
  try {
    const { teacherId } = req.params;
    if (!ObjectId.isValid(teacherId)) {
      return res.status(400).json({ error: 'Invalid teacherId' });
    }
    const teacher = await db.collection('users').findOne({ _id: new ObjectId(teacherId), role: 'Teacher' });
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    const {
      date: dateStr,
      slotMinutes: slotMinutesStr,
      durationMinutes: durationStr,
      dayStart: dayStartStr,
      dayEnd: dayEndStr
    } = req.query || {};

    const date = dateStr ? new Date(dateStr + 'T00:00:00') : new Date(new Date().toISOString().slice(0,10) + 'T00:00:00');
    if (isNaN(date.getTime())) return res.status(400).json({ error: 'Invalid date' });
    const slotMinutes = Number(slotMinutesStr) > 0 ? Number(slotMinutesStr) : 30;
    const durationMinutes = Number(durationStr) > 0 ? Number(durationStr) : 60;
    const dayStart = dayStartStr || '08:00';
    const dayEnd = dayEndStr || '20:00';

    const parseHM = (hm) => {
      const [h, m] = String(hm || '').split(':').map(Number);
      return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
    };
    const dayStartMin = parseHM(dayStart);
    const dayEndMin = parseHM(dayEnd);
    if (dayStartMin === null || dayEndMin === null || dayEndMin <= dayStartMin) {
      return res.status(400).json({ error: 'Invalid dayStart/dayEnd' });
    }

    const dayOfWeek = date.getDay();
    const constraints = await db.collection('time_constraints').find({ teacherId: new ObjectId(teacherId), dayOfWeek }).toArray();

    const startOfDay = new Date(date);
    const endOfDay = new Date(date);
    endOfDay.setHours(23,59,59,999);
    const lessons = await db.collection('lessons').find({
      teacherId: new ObjectId(teacherId),
      dateTime: { $gte: startOfDay, $lte: endOfDay }
    }).project({ dateTime: 1, durationMinutes: 1 }).toArray();

    const slots = [];
    for (let start = dayStartMin; start + durationMinutes <= dayEndMin; start += slotMinutes) {
      const end = start + durationMinutes;
      // Check constraints overlap
      const conflictsConstraint = constraints.some(c => {
        const cs = parseHM(c.startTime);
        const ce = parseHM(c.endTime);
        if (cs === null || ce === null) return false;
        return start < ce && end > cs;
      });
      if (conflictsConstraint) continue;

      // Check existing lessons overlap
      const conflictsLesson = lessons.some(l => {
        const lsDate = new Date(l.dateTime);
        const lsStart = lsDate.getHours() * 60 + lsDate.getMinutes();
        const lsEnd = lsStart + (Number(l.durationMinutes) || 60);
        return start < lsEnd && end > lsStart;
      });
      if (conflictsLesson) continue;

      const slotDate = new Date(date);
      slotDate.setHours(0,0,0,0);
      slotDate.setMinutes(start);
      slots.push(slotDate.toISOString());
    }

    return res.json({ date: date.toISOString().slice(0,10), durationMinutes, slotMinutes, slots });
  } catch (error) {
    console.error('Teacher availability error:', error);
    return res.status(500).json({ error: 'Failed to compute availability' });
  }
});

// Book a lesson
app.post('/api/bookings', authenticateToken, authorizeRole('Parent'), async (req, res) => {
  try {
    const { teacherEmail, dateTime, subject, durationMinutes, studentEmail } = req.body || {};
    if (!teacherEmail || !dateTime) {
      return res.status(400).json({ error: 'teacherEmail and dateTime are required' });
    }
    const teacher = await db.collection('users').findOne({ email: teacherEmail.toLowerCase(), role: 'Teacher' });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    let studentId = null;
    if (studentEmail) {
      const student = await db.collection('users').findOne({ email: studentEmail.toLowerCase(), role: 'Student' });
      if (student) {
        studentId = student._id;
      }
    }
    // Check against teacher unavailability constraints
    try {
      const requestedStartDate = new Date(dateTime);
      if (isNaN(requestedStartDate.getTime())) {
        return res.status(400).json({ error: 'Invalid dateTime' });
      }
      const requestedDuration = typeof durationMinutes === 'number' && durationMinutes > 0 ? durationMinutes : 60;
      const requestedStartMinutes = requestedStartDate.getHours() * 60 + requestedStartDate.getMinutes();
      const requestedEndMinutes = requestedStartMinutes + requestedDuration;
      const dayOfWeek = requestedStartDate.getDay(); // 0..6
      const constraints = await db.collection('time_constraints').find({ teacherId: new ObjectId(teacher._id), dayOfWeek }).toArray();
      const toMinutes = (hm) => {
        const [h, m] = String(hm || '').split(':').map(Number);
        return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
      };
      const conflict = constraints.some(c => {
        const cs = toMinutes(c.startTime);
        const ce = toMinutes(c.endTime);
        if (cs === null || ce === null) return false;
        return requestedStartMinutes < ce && requestedEndMinutes > cs; // overlap
      });
      if (conflict) {
        return res.status(409).json({ error: 'Teacher is unavailable at the requested time (constraint conflict)' });
      }
    } catch (e) {
      console.error('Constraint validation error:', e);
      return res.status(500).json({ error: 'Failed to validate constraints' });
    }
    const lesson = {
      teacherId: new ObjectId(teacher._id),
      parentId: new ObjectId(req.user._id),
      studentId: studentId ? new ObjectId(studentId) : null,
      dateTime: new Date(dateTime),
      subject: subject || '',
      durationMinutes: typeof durationMinutes === 'number' && durationMinutes > 0 ? durationMinutes : 60,
      status: 'booked',
      createdAt: new Date()
    };
    const result = await db.collection('lessons').insertOne(lesson);
    // Notify teacher about new booking
    try {
      await db.collection('notifications').insertOne({
        userId: new ObjectId(teacher._id),
        type: 'booking',
        message: `New lesson booked on ${new Date(dateTime).toLocaleString()}`,
        lessonId: new ObjectId(result.insertedId),
        read: false,
        createdAt: new Date()
      });
    } catch (e) {
      console.error('Notification insert failed (booking):', e);
    }
    return res.status(201).json({ message: 'Lesson booked', id: result.insertedId });
  } catch (error) {
    console.error('Book lesson error:', error);
    return res.status(500).json({ error: 'Failed to book lesson' });
  }
});

// Optional: Parent lesson history
app.get('/api/parent/lessons/history', authenticateToken, authorizeRole('Parent'), async (req, res) => {
  try {
    const lessons = await db.collection('lessons')
      .find({ parentId: new ObjectId(req.user._id) })
      .sort({ dateTime: -1 })
      .limit(100)
      .toArray();
    return res.json({ lessons });
  } catch (error) {
    console.error('Parent history error:', error);
    return res.status(500).json({ error: 'Failed to load lesson history' });
  }
});

// =========================
// Student Actions Endpoints
// =========================

// Upcoming lessons for student
app.get('/api/student/lessons/upcoming', authenticateToken, authorizeRole('Student'), async (req, res) => {
  try {
    const now = new Date();
    const lessons = await db.collection('lessons')
      .find({ studentId: new ObjectId(req.user._id), dateTime: { $gte: now } })
      .sort({ dateTime: 1 })
      .limit(100)
      .toArray();
    return res.json({ lessons });
  } catch (error) {
    console.error('Student upcoming error:', error);
    return res.status(500).json({ error: 'Failed to load upcoming lessons' });
  }
});

// Contact a teacher
app.post('/api/student/contact-teacher', authenticateToken, authorizeRole('Student'), async (req, res) => {
  try {
    const { teacherEmail, message } = req.body || {};
    if (!teacherEmail || !message) {
      return res.status(400).json({ error: 'teacherEmail and message are required' });
    }
    const teacher = await db.collection('users').findOne({ email: teacherEmail.toLowerCase(), role: 'Teacher' }, { projection: { password: 0 } });
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    const msg = {
      fromStudentId: new ObjectId(req.user._id),
      toTeacherId: new ObjectId(teacher._id),
      message: message.toString(),
      createdAt: new Date()
    };
    const result = await db.collection('messages').insertOne(msg);
    return res.status(201).json({ message: 'Message sent', id: result.insertedId });
  } catch (error) {
    console.error('Student contact error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

// =========================
// Teacher Clock & Hours APIs
// =========================

// Clock in to a lesson
app.post('/api/teacher/clock-in', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const { lessonId } = req.body || {};
    if (!lessonId) return res.status(400).json({ error: 'lessonId is required' });
    const lesson = await db.collection('lessons').findOne({ _id: new ObjectId(lessonId), teacherId: new ObjectId(req.user._id) });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    if (lesson.status === 'completed') return res.status(400).json({ error: 'Lesson already completed' });

    const now = new Date();
    await db.collection('lessons').updateOne(
      { _id: new ObjectId(lessonId) },
      { $set: { status: 'in_progress', clockInAt: now, updatedAt: now } }
    );

    // Notification to teacher self optional - skip
    return res.json({ message: 'Clocked in', at: now });
  } catch (error) {
    console.error('Clock-in error:', error);
    return res.status(500).json({ error: 'Failed to clock in' });
  }
});

// Clock out from a lesson and create payable entry
app.post('/api/teacher/clock-out', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const { lessonId } = req.body || {};
    if (!lessonId) return res.status(400).json({ error: 'lessonId is required' });
    const lesson = await db.collection('lessons').findOne({ _id: new ObjectId(lessonId), teacherId: new ObjectId(req.user._id) });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });
    const now = new Date();
    const start = lesson.clockInAt ? new Date(lesson.clockInAt) : new Date(lesson.dateTime);
    const workedMinutes = Math.max(1, Math.round((now - start) / 60000));

    await db.collection('lessons').updateOne(
      { _id: new ObjectId(lessonId) },
      { $set: { status: 'completed', clockOutAt: now, workedMinutes, updatedAt: now, payable: true } }
    );

    // Also record a working_hours entry
    await db.collection('working_hours').insertOne({
      teacherId: new ObjectId(req.user._id),
      lessonId: new ObjectId(lessonId),
      date: new Date(lesson.dateTime),
      hours: workedMinutes / 60,
      notes: 'Clock-out auto entry',
      createdAt: new Date()
    });

    // Create a simulated payment record (pending)
    const hourlyRate = 100; // simulated
    const amount = Math.round((workedMinutes / 60) * hourlyRate * 100) / 100;
    await db.collection('payments').insertOne({
      teacherId: new ObjectId(req.user._id),
      lessonId: new ObjectId(lessonId),
      workedMinutes,
      amount,
      currency: 'ILS',
      status: 'pending',
      createdAt: new Date()
    });

    return res.json({ message: 'Clocked out, lesson completed and marked payable', workedMinutes, amount });
  } catch (error) {
    console.error('Clock-out error:', error);
    return res.status(500).json({ error: 'Failed to clock out' });
  }
});

// Manually mark lesson completed/payable (without clock)
app.post('/api/teacher/lessons/complete', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const { lessonId, workedMinutes } = req.body || {};
    if (!lessonId) return res.status(400).json({ error: 'lessonId is required' });
    const lesson = await db.collection('lessons').findOne({ _id: new ObjectId(lessonId), teacherId: new ObjectId(req.user._id) });
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const minutes = Number(workedMinutes) > 0 ? Number(workedMinutes) : (lesson.durationMinutes || 60);
    const now = new Date();
    await db.collection('lessons').updateOne(
      { _id: new ObjectId(lessonId) },
      { $set: { status: 'completed', workedMinutes: minutes, payable: true, updatedAt: now } }
    );

    await db.collection('working_hours').insertOne({
      teacherId: new ObjectId(req.user._id),
      lessonId: new ObjectId(lessonId),
      date: new Date(lesson.dateTime),
      hours: minutes / 60,
      notes: 'Manual completion entry',
      createdAt: new Date()
    });

    const hourlyRate = 100;
    const amount = Math.round((minutes / 60) * hourlyRate * 100) / 100;
    await db.collection('payments').insertOne({
      teacherId: new ObjectId(req.user._id),
      lessonId: new ObjectId(lessonId),
      workedMinutes: minutes,
      amount,
      currency: 'ILS',
      status: 'pending',
      createdAt: new Date()
    });

    return res.json({ message: 'Lesson marked completed and payable', workedMinutes: minutes, amount });
  } catch (error) {
    console.error('Lesson complete error:', error);
    return res.status(500).json({ error: 'Failed to complete lesson' });
  }
});

// Hours summary
app.get('/api/teacher/hours/summary', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const { from, to } = req.query || {};
    const teacherId = new ObjectId(req.user._id);
    const match = { teacherId };
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = new Date(from);
      if (to) match.date.$lte = new Date(to);
    }
    const entries = await db.collection('working_hours').find(match).toArray();
    const totalHours = entries.reduce((sum, e) => sum + (Number(e.hours) || 0), 0);
    return res.json({ totalHours, count: entries.length });
  } catch (error) {
    console.error('Hours summary error:', error);
    return res.status(500).json({ error: 'Failed to fetch hours summary' });
  }
});

// Hours entries list
app.get('/api/teacher/hours', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const { from, to } = req.query || {};
    const teacherId = new ObjectId(req.user._id);
    const match = { teacherId };
    if (from || to) {
      match.date = {};
      if (from) match.date.$gte = new Date(from);
      if (to) match.date.$lte = new Date(to);
    }
    const entries = await db.collection('working_hours').find(match).sort({ date: -1 }).limit(500).toArray();
    return res.json({ entries });
  } catch (error) {
    console.error('Hours list error:', error);
    return res.status(500).json({ error: 'Failed to fetch hours' });
  }
});

// Teacher notifications
app.get('/api/teacher/notifications', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const teacherId = new ObjectId(req.user._id);
    const items = await db.collection('notifications').find({ userId: teacherId }).sort({ createdAt: -1 }).limit(100).toArray();
    return res.json({ notifications: items });
  } catch (error) {
    console.error('Notifications error:', error);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// Mark all notifications as read
app.post('/api/teacher/notifications/mark-all-read', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const teacherId = new ObjectId(req.user._id);
    const result = await db.collection('notifications').updateMany({ userId: teacherId, read: false }, { $set: { read: true } });
    return res.json({ message: 'Marked as read', modified: result.modifiedCount });
  } catch (error) {
    console.error('Notifications mark read error:', error);
    return res.status(500).json({ error: 'Failed to mark notifications' });
  }
});

// Teacher payments (simulated)
app.get('/api/teacher/payments', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const teacherId = new ObjectId(req.user._id);
    const items = await db.collection('payments').find({ teacherId }).sort({ createdAt: -1 }).limit(200).toArray();
    return res.json({ payments: items });
  } catch (error) {
    console.error('Payments list error:', error);
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// Schedule adjustment requests
app.post('/api/teacher/schedule-requests', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const { lessonId, requestedTime, note } = req.body || {};
    const doc = {
      teacherId: new ObjectId(req.user._id),
      lessonId: lessonId ? new ObjectId(lessonId) : null,
      requestedTime: requestedTime ? new Date(requestedTime) : null,
      note: note || '',
      status: 'pending',
      createdAt: new Date()
    };
    const result = await db.collection('schedule_requests').insertOne(doc);
    return res.status(201).json({ message: 'Request submitted', id: result.insertedId });
  } catch (error) {
    console.error('Schedule request error:', error);
    return res.status(500).json({ error: 'Failed to submit request' });
  }
});

// =========================
// Teacher Messages
// =========================
app.get('/api/teacher/messages', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const teacherId = new ObjectId(req.user._id);
    const msgs = await db.collection('messages').find({ toTeacherId: teacherId }).sort({ createdAt: -1 }).limit(200).toArray();
    return res.json({ messages: msgs });
  } catch (error) {
    console.error('Teacher messages error:', error);
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

app.post('/api/teacher/messages/mark-read', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const teacherId = new ObjectId(req.user._id);
    const { messageIds } = req.body || {};
    if (!Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({ error: 'messageIds (array) is required' });
    }
    const ids = messageIds.map(id => new ObjectId(id));
    const result = await db.collection('messages').updateMany({ _id: { $in: ids }, toTeacherId: teacherId }, { $set: { read: true, readAt: new Date() } });
    return res.json({ message: 'Marked read', modified: result.modifiedCount });
  } catch (error) {
    console.error('Teacher mark read error:', error);
    return res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

module.exports = app;

