const express = require('express')
const { getDb, connectToDb } = require('./db')
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const { ObjectId } = require('mongodb');
const e = require('express');
const aiTutorService = require('./services/aiTutorService');

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
    const validRoles = ['Parent', 'Student', 'Teacher', 'Admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid user type' });
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
      createdAt: new Date(),
      isActive: true,
      // Teacher-specific fields
      specializations: role === 'Teacher' ? [] : undefined,
      isProfileComplete: role === 'Teacher' ? false : true
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
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    // Ensure teacher has required fields
    if (req.user.role === 'Teacher') {
      const updateData = {};
      
      // Add specializations field if it doesn't exist
      if (req.user.specializations === undefined) {
        updateData.specializations = [];
      }
      
      // Add isProfileComplete field if it doesn't exist
      if (req.user.isProfileComplete === undefined) {
        updateData.isProfileComplete = false;
      }
      
      // Update user if needed
      if (Object.keys(updateData).length > 0) {
        await db.collection('users').updateOne(
          { _id: new ObjectId(req.user._id) },
          { $set: updateData }
        );
        
        // Update the user object
        Object.assign(req.user, updateData);
      }
    }
    
    res.json({
      message: 'פרופיל המשתמש',
      user: req.user
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
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

// Get teacher time constraints
app.get('/api/teacher/time-constraints', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const teacherId = new ObjectId(req.user._id);
    const constraints = await db.collection('time_constraints')
      .find({ teacherId })
      .sort({ dayOfWeek: 1, startTime: 1 })
      .toArray();
    return res.json({ constraints });
  } catch (error) {
    console.error('Get time constraints error:', error);
    return res.status(500).json({ error: 'Failed to fetch time constraints' });
  }
});

// Update time constraint
app.put('/api/teacher/time-constraints/:id', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const { dayOfWeek, startTime, endTime, note } = req.body || {};
    if (typeof dayOfWeek !== 'number' || dayOfWeek < 0 || dayOfWeek > 6 || !startTime || !endTime) {
      return res.status(400).json({ error: 'dayOfWeek (0-6), startTime, endTime are required' });
    }
    
    const teacherId = new ObjectId(req.user._id);
    const constraintId = new ObjectId(id);
    
    const result = await db.collection('time_constraints').updateOne(
      { _id: constraintId, teacherId },
      { $set: { dayOfWeek, startTime, endTime, note: note || '', updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Time constraint not found' });
    }
    
    return res.json({ message: 'Time constraint updated' });
  } catch (error) {
    console.error('Update time constraint error:', error);
    return res.status(500).json({ error: 'Failed to update time constraint' });
  }
});

// Delete time constraint
app.delete('/api/teacher/time-constraints/:id', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const teacherId = new ObjectId(req.user._id);
    const constraintId = new ObjectId(id);
    
    const result = await db.collection('time_constraints').deleteOne(
      { _id: constraintId, teacherId }
    );
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Time constraint not found' });
    }
    
    return res.json({ message: 'Time constraint deleted' });
  } catch (error) {
    console.error('Delete time constraint error:', error);
    return res.status(500).json({ error: 'Failed to delete time constraint' });
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

// Get all teachers (only those with complete profiles)
app.get('/api/teachers', authenticateToken, async (req, res) => {
  try {
    const teachers = await db.collection('users').find(
      { 
        role: 'Teacher',
        isProfileComplete: true,
        isActive: true
      },
      { projection: { password: 0 } }
    ).limit(100).toArray();
    return res.json({ teachers });
  } catch (error) {
    console.error('Get all teachers error:', error);
    return res.status(500).json({ error: 'Failed to get teachers' });
  }
});

// Search teachers (only those with complete profiles)
app.get('/api/teachers/search', authenticateToken, async (req, res) => {
  try {
    const q = (req.query.q || '').toString().trim();
    const subject = req.query.subject || '';
    
    const filter = { 
      role: 'Teacher',
      isProfileComplete: true,
      isActive: true
    };
    
    if (q) {
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { firstName: { $regex: regex } },
        { lastName: { $regex: regex } },
        { email: { $regex: regex } },
        { specializations: { $regex: regex } }
      ];
    }
    
    if (subject) {
      filter.specializations = { $in: [subject] };
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
      teacherEmail: teacher.email,
      teacherName: `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim(),
      teacherMeetingLink: teacher.teacherMeetingLink || null,
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
      
      // If teacher doesn't have a meeting link, remind them to add one
      if (!teacher.teacherMeetingLink) {
        await db.collection('notifications').insertOne({
          userId: new ObjectId(teacher._id),
          type: 'meeting_link_reminder',
          message: `Don't forget to add your meeting link for the lesson on ${new Date(dateTime).toLocaleString()}`,
          lessonId: new ObjectId(result.insertedId),
          read: false,
          createdAt: new Date()
        });
      }
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
    const parentId = new ObjectId(req.user._id);
    
    // Get lessons with student information
    const pipeline = [
      {
        $match: { parentId: parentId }
      },
      {
        $lookup: {
          from: 'parent_children',
          localField: 'studentId',
          foreignField: 'studentId',
          as: 'childInfo'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      {
        $addFields: {
          studentName: {
            $cond: {
              if: { $gt: [{ $size: '$studentInfo' }, 0] },
              then: {
                $concat: [
                  { $arrayElemAt: ['$studentInfo.firstName', 0] },
                  ' ',
                  { $arrayElemAt: ['$studentInfo.lastName', 0] }
                ]
              },
              else: null
            }
          },
          studentGrade: {
            $cond: {
              if: { $gt: [{ $size: '$childInfo' }, 0] },
              then: { $arrayElemAt: ['$childInfo.grade', 0] },
              else: null
            }
          }
        }
      },
      {
        $sort: { dateTime: -1 }
      },
      {
        $limit: 100
      }
    ];
    
    const lessons = await db.collection('lessons').aggregate(pipeline).toArray();
    return res.json({ lessons });
  } catch (error) {
    console.error('Parent history error:', error);
    return res.status(500).json({ error: 'Failed to load lesson history' });
  }
});

// =========================
// Parent Children Management
// =========================

// Get parent's connected children
app.get('/api/parent/children', authenticateToken, authorizeRole('Parent'), async (req, res) => {
  try {
    const parentId = new ObjectId(req.user._id);
    const children = await db.collection('parent_children')
      .find({ parentId })
      .toArray();
    
    // Get student details for each child
    const childrenWithDetails = await Promise.all(
      children.map(async (child) => {
        const student = await db.collection('users').findOne(
          { _id: new ObjectId(child.studentId) },
          { projection: { password: 0 } }
        );
        return {
          _id: child._id,
          studentId: child.studentId,
          email: child.email,
          grade: child.grade,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
          name: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
          connectedAt: child.createdAt
        };
      })
    );
    
    return res.json({ children: childrenWithDetails });
  } catch (error) {
    console.error('Get children error:', error);
    return res.status(500).json({ error: 'Failed to load children' });
  }
});

// Verify student email exists
app.get('/api/parent/verify-student', authenticateToken, authorizeRole('Parent'), async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    const student = await db.collection('users').findOne(
      { email: email.toLowerCase(), role: 'Student' },
      { projection: { password: 0 } }
    );
    
    if (!student) {
      return res.json({ exists: false });
    }
    
    return res.json({ 
      exists: true, 
      student: {
        _id: student._id,
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        grade: student.grade
      }
    });
  } catch (error) {
    console.error('Verify student error:', error);
    return res.status(500).json({ error: 'Failed to verify student' });
  }
});

// Add child connection
app.post('/api/parent/children', authenticateToken, authorizeRole('Parent'), async (req, res) => {
  try {
    const { email, grade } = req.body;
    if (!email || !grade) {
      return res.status(400).json({ error: 'Email and grade are required' });
    }
    
    // Verify student exists
    const student = await db.collection('users').findOne(
      { email: email.toLowerCase(), role: 'Student' }
    );
    
    if (!student) {
      return res.status(404).json({ error: 'Student not found with this email' });
    }
    
    // Check if already connected
    const existingConnection = await db.collection('parent_children').findOne({
      parentId: new ObjectId(req.user._id),
      studentId: new ObjectId(student._id)
    });
    
    if (existingConnection) {
      return res.status(400).json({ error: 'Student is already connected to your account' });
    }
    
    // Create connection
    const connection = {
      parentId: new ObjectId(req.user._id),
      studentId: new ObjectId(student._id),
      email: email.toLowerCase(),
      grade: grade,
      createdAt: new Date()
    };
    
    const result = await db.collection('parent_children').insertOne(connection);
    
    return res.status(201).json({ 
      message: 'Student connected successfully',
      id: result.insertedId
    });
  } catch (error) {
    console.error('Add child error:', error);
    return res.status(500).json({ error: 'Failed to connect student' });
  }
});

// Remove child connection
app.delete('/api/parent/children/:id', authenticateToken, authorizeRole('Parent'), async (req, res) => {
  try {
    const { id } = req.params;
    const parentId = new ObjectId(req.user._id);
    const connectionId = new ObjectId(id);
    
    const result = await db.collection('parent_children').deleteOne({
      _id: connectionId,
      parentId: parentId
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Child connection not found' });
    }
    
    return res.json({ message: 'Student disconnected successfully' });
  } catch (error) {
    console.error('Remove child error:', error);
    return res.status(500).json({ error: 'Failed to disconnect student' });
  }
});

// Update child grade
app.put('/api/parent/children/:id/grade', authenticateToken, authorizeRole('Parent'), async (req, res) => {
  try {
    const { id } = req.params;
    const { grade } = req.body;
    const parentId = new ObjectId(req.user._id);
    const connectionId = new ObjectId(id);
    
    if (!grade) {
      return res.status(400).json({ error: 'Grade is required' });
    }
    
    const result = await db.collection('parent_children').updateOne(
      { _id: connectionId, parentId: parentId },
      { $set: { grade: grade, updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Child connection not found' });
    }
    
    return res.json({ message: 'Child grade updated successfully' });
  } catch (error) {
    console.error('Update child grade error:', error);
    return res.status(500).json({ error: 'Failed to update child grade' });
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
      .toArray();
    return res.json({ lessons });
  } catch (error) {
    console.error('Student upcoming error:', error);
    return res.status(500).json({ error: 'Failed to load upcoming lessons' });
  }
});

// Cancel a lesson (Parent)
app.delete('/api/parent/lessons/:id', authenticateToken, authorizeRole('Parent'), async (req, res) => {
  try {
    const { id } = req.params;
    const parentId = new ObjectId(req.user._id);
    const lessonId = new ObjectId(id);
    
    // Check if lesson exists and belongs to this parent
    const lesson = await db.collection('lessons').findOne({ 
      _id: lessonId, 
      parentId: parentId 
    });
    
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found or you do not have permission to cancel this lesson' });
    }
    
    // Check if lesson is in the future
    const now = new Date();
    if (new Date(lesson.dateTime) <= now) {
      return res.status(400).json({ error: 'Cannot cancel lessons that have already started or passed' });
    }
    
    // Delete the lesson
    const result = await db.collection('lessons').deleteOne({ _id: lessonId });
    
    if (result.deletedCount === 0) {
      return res.status(500).json({ error: 'Failed to cancel lesson' });
    }
    
    // Create notification for student
    if (lesson.studentId) {
      await db.collection('notifications').insertOne({
        userId: lesson.studentId,
        type: 'lesson_cancelled',
        title: 'Lesson Cancelled by Parent',
        message: `Your parent has cancelled the lesson scheduled for ${new Date(lesson.dateTime).toLocaleString()}`,
        lessonId: lessonId,
        createdAt: new Date(),
        read: false
      });
    }
    
    // Create notification for teacher
    if (lesson.teacherId) {
      await db.collection('notifications').insertOne({
        userId: lesson.teacherId,
        type: 'lesson_cancelled',
        title: 'Lesson Cancelled by Parent',
        message: `A parent has cancelled the lesson scheduled for ${new Date(lesson.dateTime).toLocaleString()}`,
        lessonId: lessonId,
        createdAt: new Date(),
        read: false
      });
    }
    
    return res.json({ message: 'Lesson cancelled successfully' });
  } catch (error) {
    console.error('Cancel lesson error:', error);
    return res.status(500).json({ error: 'Failed to cancel lesson' });
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

// Get student conversation with a teacher
app.get('/api/student/messages', authenticateToken, authorizeRole('Student'), async (req, res) => {
  try {
    const { teacherEmail, teacherId } = req.query || {};
    let teacher;
    if (teacherId && ObjectId.isValid(String(teacherId))) {
      teacher = await db.collection('users').findOne({ _id: new ObjectId(String(teacherId)), role: 'Teacher' });
    } else if (teacherEmail) {
      teacher = await db.collection('users').findOne({ email: String(teacherEmail).toLowerCase(), role: 'Teacher' });
    }
    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }
    const msgs = await db.collection('messages').find({
      $or: [
        { fromStudentId: new ObjectId(req.user._id), toTeacherId: new ObjectId(teacher._id) },
        { fromTeacherId: new ObjectId(teacher._id), toStudentId: new ObjectId(req.user._id) }
      ]
    }).sort({ createdAt: 1 }).toArray();
    return res.json({ messages: msgs, teacher: { id: teacher._id, email: teacher.email, firstName: teacher.firstName, lastName: teacher.lastName } });
  } catch (error) {
    console.error('Student conversation error:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// List student's past conversations grouped by teacher
app.get('/api/student/conversations', authenticateToken, authorizeRole('Student'), async (req, res) => {
  try {
    const studentId = new ObjectId(req.user._id);
    const pipeline = [
      {
        $match: {
          $or: [
            { fromStudentId: studentId },
            { toStudentId: studentId }
          ]
        }
      },
      {
        $addFields: {
          convTeacherId: {
            $cond: [
              { $ifNull: ["$toTeacherId", false] },
              "$toTeacherId",
              "$fromTeacherId"
            ]
          }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$convTeacherId",
          lastMessage: { $first: "$message" },
          lastAt: { $first: "$createdAt" },
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'teacher'
        }
      },
      { $unwind: "$teacher" },
      {
        $project: {
          teacherId: '$_id',
          _id: 0,
          lastMessage: 1,
          lastAt: 1,
          count: 1,
          teacher: {
            _id: '$teacher._id',
            email: '$teacher.email',
            firstName: '$teacher.firstName',
            lastName: '$teacher.lastName'
          }
        }
      },
      { $sort: { lastAt: -1 } }
    ];

    const convos = await db.collection('messages').aggregate(pipeline).toArray();
    return res.json({ conversations: convos });
  } catch (error) {
    console.error('Student conversations error:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
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

// Update teacher meeting link
app.put('/api/teacher/meeting-link', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const { meetingLink } = req.body || {};
    if (!meetingLink || typeof meetingLink !== 'string') {
      return res.status(400).json({ error: 'Valid meeting link is required' });
    }

    // Basic URL validation
    try {
      new URL(meetingLink);
    } catch {
      return res.status(400).json({ error: 'Please provide a valid URL for your meeting link' });
    }

    await db.collection('users').updateOne(
      { _id: new ObjectId(req.user._id) },
      { $set: { teacherMeetingLink: meetingLink, updatedAt: new Date() } }
    );

    return res.json({ message: 'Meeting link updated successfully' });
  } catch (error) {
    console.error('Update meeting link error:', error);
    return res.status(500).json({ error: 'Failed to update meeting link' });
  }
});

// Update teacher specializations
app.put('/api/teacher/specializations', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const { specializations } = req.body || {};
    
    if (!Array.isArray(specializations)) {
      return res.status(400).json({ error: 'Specializations must be an array' });
    }

    // Validate specializations against predefined list
    const validSubjects = [
      'Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology',
      'History', 'Geography', 'Computer Science', 'Art', 'Music', 'Physical Education',
      'Spanish', 'French', 'German', 'Economics', 'Psychology', 'Sociology',
      'Literature', 'Writing', 'Reading', 'Algebra', 'Geometry', 'Calculus',
      'Statistics', 'Trigonometry', 'Pre-Calculus', 'World History', 'US History',
      'Government', 'Philosophy', 'Religion', 'Environmental Science', 'Astronomy'
    ];

    const invalidSubjects = specializations.filter(subject => !validSubjects.includes(subject));
    if (invalidSubjects.length > 0) {
      return res.status(400).json({ 
        error: `Invalid subjects: ${invalidSubjects.join(', ')}. Please select from the available subjects.` 
      });
    }

    if (specializations.length === 0) {
      return res.status(400).json({ error: 'At least one specialization is required' });
    }

    // Update specializations and mark profile as complete
    await db.collection('users').updateOne(
      { _id: new ObjectId(req.user._id) },
      { 
        $set: { 
          specializations: specializations,
          isProfileComplete: true,
          updatedAt: new Date() 
        } 
      }
    );

    return res.json({ 
      message: 'Specializations updated successfully',
      specializations: specializations,
      isProfileComplete: true
    });
  } catch (error) {
    console.error('Update specializations error:', error);
    return res.status(500).json({ error: 'Failed to update specializations' });
  }
});

// Get available subjects for teacher specialization
app.get('/api/teacher/subjects', authenticateToken, authorizeRole('Teacher'), (req, res) => {
  try {
    const subjects = [
      'Mathematics', 'English', 'Science', 'Physics', 'Chemistry', 'Biology',
      'History', 'Geography', 'Computer Science', 'Art', 'Music', 'Physical Education',
      'Spanish', 'French', 'German', 'Economics', 'Psychology', 'Sociology',
      'Literature', 'Writing', 'Reading', 'Algebra', 'Geometry', 'Calculus',
      'Statistics', 'Trigonometry', 'Pre-Calculus', 'World History', 'US History',
      'Government', 'Philosophy', 'Religion', 'Environmental Science', 'Astronomy'
    ];
    
    return res.json({ subjects });
  } catch (error) {
    console.error('Get subjects error:', error);
    return res.status(500).json({ error: 'Failed to get subjects' });
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

// Get teacher conversations grouped by student
app.get('/api/teacher/conversations', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const teacherId = new ObjectId(req.user._id);
    const pipeline = [
      {
        $match: {
          $or: [
            { toTeacherId: teacherId },
            { fromTeacherId: teacherId }
          ]
        }
      },
      {
        $addFields: {
          convStudentId: {
            $cond: [
              { $ifNull: ["$toStudentId", false] },
              "$toStudentId",
              "$fromStudentId"
            ]
          }
        }
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$convStudentId",
          lastMessage: { $first: "$message" },
          lastAt: { $first: "$createdAt" },
          count: { $sum: 1 },
          unreadCount: { $sum: { $cond: [{ $and: ["$toTeacherId", { $ne: ["$read", true] }] }, 1, 0] } }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: "$student" },
      {
        $project: {
          studentId: '$_id',
          _id: 0,
          lastMessage: 1,
          lastAt: 1,
          count: 1,
          unreadCount: 1,
          student: {
            _id: '$student._id',
            email: '$student.email',
            firstName: '$student.firstName',
            lastName: '$student.lastName'
          }
        }
      },
      { $sort: { lastAt: -1 } }
    ];

    const convos = await db.collection('messages').aggregate(pipeline).toArray();
    return res.json({ conversations: convos });
  } catch (error) {
    console.error('Teacher conversations error:', error);
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get conversation with specific student
app.get('/api/teacher/conversation', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const teacherId = new ObjectId(req.user._id);
    const { studentId } = req.query;
    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required' });
    }

    const messages = await db.collection('messages').find({
      $or: [
        { fromTeacherId: teacherId, toStudentId: new ObjectId(studentId) },
        { toTeacherId: teacherId, fromStudentId: new ObjectId(studentId) }
      ]
    }).sort({ createdAt: 1 }).toArray();

    // Get student info
    const student = await db.collection('users').findOne({ _id: new ObjectId(studentId), role: 'Student' });
    
    return res.json({ 
      student: student ? {
        _id: student._id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName
      } : null,
      messages: messages 
    });
  } catch (error) {
    console.error('Teacher conversation error:', error);
    return res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Teacher reply to student
app.post('/api/teacher/reply', authenticateToken, authorizeRole('Teacher'), async (req, res) => {
  try {
    const { studentId, message } = req.body || {};
    if (!studentId || !message) {
      return res.status(400).json({ error: 'studentId and message are required' });
    }

    const teacherId = new ObjectId(req.user._id);
    const studentObjectId = new ObjectId(studentId);

    // Verify student exists
    const student = await db.collection('users').findOne({ _id: studentObjectId, role: 'Student' });
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const messageDoc = {
      fromTeacherId: teacherId,
      toStudentId: studentObjectId,
      message: message,
      read: false,
      createdAt: new Date()
    };

    const result = await db.collection('messages').insertOne(messageDoc);
    return res.status(201).json({ message: 'Reply sent', id: result.insertedId });
  } catch (error) {
    console.error('Teacher reply error:', error);
    return res.status(500).json({ error: 'Failed to send reply' });
  }
});

// Profile management endpoints
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email, phoneNumber, grade } = req.body || {};
    const userId = new ObjectId(req.user._id);

    // Check if email is being changed and if it's already taken
    if (email && email !== req.user.email) {
      const existingUser = await db.collection('users').findOne({ email: email, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (email) updateData.email = email;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (grade !== undefined) updateData.grade = grade;

    const result = await db.collection('users').updateOne(
      { _id: userId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get updated user data
    const updatedUser = await db.collection('users').findOne({ _id: userId });
    return res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Profile update error:', error);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.delete('/api/profile', authenticateToken, async (req, res) => {
  try {
    const userId = new ObjectId(req.user._id);
    const userRole = req.user.role;

    console.log(`Starting comprehensive account deletion for user ${userId} with role ${userRole}`);

    // Comprehensive deletion of all user-related data
    const deletionResults = await Promise.allSettled([
      // 1. Delete user account
      db.collection('users').deleteOne({ _id: userId }),
      
      // 2. Delete all messages involving this user (as teacher or student)
      db.collection('messages').deleteMany({
        $or: [
          { fromTeacherId: userId },
          { toStudentId: userId },
          { fromStudentId: userId },
          { toTeacherId: userId }
        ]
      }),
      
      // 3. Delete all lessons involving this user (as teacher, student, or parent)
      db.collection('lessons').deleteMany({
        $or: [
          { teacherId: userId },
          { studentId: userId },
          { parentId: userId }
        ]
      }),
      
      // 4. Delete all time constraints for teachers
      db.collection('time_constraints').deleteMany({ teacherId: userId }),
      
      // 5. Delete all working hours for teachers
      db.collection('working_hours').deleteMany({ teacherId: userId }),
      
      // 6. Delete all notifications for this user
      db.collection('notifications').deleteMany({ userId: userId }),
      
      // 7. Delete all payment records for teachers
      db.collection('payments').deleteMany({ teacherId: userId }),
      
      // 8. Delete all schedule requests for teachers
      db.collection('schedule_requests').deleteMany({ teacherId: userId }),
      
      // 9. Delete parent-child connections (if user is parent)
      userRole === 'Parent' ? db.collection('parent_children').deleteMany({ parentId: userId }) : Promise.resolve({ deletedCount: 0 }),
      
      // 10. Delete parent-child connections where user is the child (if user is student)
      userRole === 'Student' ? db.collection('parent_children').deleteMany({ studentId: userId }) : Promise.resolve({ deletedCount: 0 })
    ]);

    // Log deletion results for debugging
    const deletionSummary = deletionResults.map((result, index) => {
      const collectionNames = [
        'users', 'messages', 'lessons', 'time_constraints', 
        'working_hours', 'notifications', 'payments', 
        'schedule_requests', 'parent_children (as parent)', 'parent_children (as child)'
      ];
      
      if (result.status === 'fulfilled') {
        console.log(`✅ Deleted from ${collectionNames[index]}: ${result.value.deletedCount || result.value.matchedCount || 0} records`);
        return { collection: collectionNames[index], status: 'success', count: result.value.deletedCount || result.value.matchedCount || 0 };
      } else {
        console.error(`❌ Failed to delete from ${collectionNames[index]}:`, result.reason);
        return { collection: collectionNames[index], status: 'failed', error: result.reason.message };
      }
    });

    // Check if any critical deletions failed
    const criticalFailures = deletionSummary.filter((result, index) => 
      result.status === 'failed' && index < 3 // users, messages, lessons are critical
    );

    if (criticalFailures.length > 0) {
      console.error('Critical deletion failures:', criticalFailures);
      return res.status(500).json({ 
        error: 'Failed to delete critical account data', 
        details: criticalFailures 
      });
    }

    // Log any non-critical failures but still proceed
    const nonCriticalFailures = deletionSummary.filter((result, index) => 
      result.status === 'failed' && index >= 3
    );

    if (nonCriticalFailures.length > 0) {
      console.warn('Non-critical deletion failures (account still deleted):', nonCriticalFailures);
    }

    console.log(`Account deletion completed for user ${userId}. Total collections processed: ${deletionSummary.length}`);

    return res.json({ 
      message: 'Account and all related data deleted successfully',
      summary: {
        totalCollectionsProcessed: deletionSummary.length,
        successfulDeletions: deletionSummary.filter(r => r.status === 'success').length,
        failedDeletions: deletionSummary.filter(r => r.status === 'failed').length,
        details: deletionSummary
      }
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return res.status(500).json({ error: 'Failed to delete account' });
  }
});

// =========================
// Admin Cleanup Functions
// =========================

// Cleanup orphaned data (for administrators)
app.post('/api/admin/cleanup-orphaned-data', authenticateToken, async (req, res) => {
  try {
    // Only allow admin users (you can add admin role check here)
    // For now, we'll just log that this was called
    console.log('Orphaned data cleanup requested by user:', req.user._id);

    const cleanupResults = await Promise.allSettled([
      // Clean up orphaned messages (where referenced users don't exist)
      db.collection('messages').deleteMany({
        $or: [
          { fromTeacherId: { $exists: true }, fromTeacherId: { $nin: await db.collection('users').distinct('_id', { role: 'Teacher' }) } },
          { toStudentId: { $exists: true }, toStudentId: { $nin: await db.collection('users').distinct('_id', { role: 'Student' }) } },
          { fromStudentId: { $exists: true }, fromStudentId: { $nin: await db.collection('users').distinct('_id', { role: 'Student' }) } },
          { toTeacherId: { $exists: true }, toTeacherId: { $nin: await db.collection('users').distinct('_id', { role: 'Teacher' }) } }
        ]
      }),
      
      // Clean up orphaned lessons
      db.collection('lessons').deleteMany({
        $or: [
          { teacherId: { $exists: true }, teacherId: { $nin: await db.collection('users').distinct('_id', { role: 'Teacher' }) } },
          { studentId: { $exists: true }, studentId: { $nin: await db.collection('users').distinct('_id', { role: 'Student' }) } },
          { parentId: { $exists: true }, parentId: { $nin: await db.collection('users').distinct('_id', { role: 'Parent' }) } }
        ]
      }),
      
      // Clean up orphaned parent-child connections
      db.collection('parent_children').deleteMany({
        $or: [
          { parentId: { $exists: true }, parentId: { $nin: await db.collection('users').distinct('_id', { role: 'Parent' }) } },
          { studentId: { $exists: true }, studentId: { $nin: await db.collection('users').distinct('_id', { role: 'Student' }) } }
        ]
      }),
      
      // Clean up orphaned notifications
      db.collection('notifications').deleteMany({
        userId: { $exists: true }, 
        userId: { $nin: await db.collection('users').distinct('_id') }
      }),
      
      // Clean up orphaned time constraints
      db.collection('time_constraints').deleteMany({
        teacherId: { $exists: true }, 
        teacherId: { $nin: await db.collection('users').distinct('_id', { role: 'Teacher' }) }
      }),
      
      // Clean up orphaned working hours
      db.collection('working_hours').deleteMany({
        teacherId: { $exists: true }, 
        teacherId: { $nin: await db.collection('users').distinct('_id', { role: 'Teacher' }) }
      }),
      
      // Clean up orphaned payments
      db.collection('payments').deleteMany({
        teacherId: { $exists: true }, 
        teacherId: { $nin: await db.collection('users').distinct('_id', { role: 'Teacher' }) }
      }),
      
      // Clean up orphaned schedule requests
      db.collection('schedule_requests').deleteMany({
        teacherId: { $exists: true }, 
        teacherId: { $nin: await db.collection('users').distinct('_id', { role: 'Teacher' }) }
      })
    ]);

    const cleanupSummary = cleanupResults.map((result, index) => {
      const collectionNames = [
        'messages', 'lessons', 'parent_children', 'notifications',
        'time_constraints', 'working_hours', 'payments', 'schedule_requests'
      ];
      
      if (result.status === 'fulfilled') {
        return { collection: collectionNames[index], status: 'success', count: result.value.deletedCount || 0 };
      } else {
        return { collection: collectionNames[index], status: 'failed', error: result.reason.message };
      }
    });

    const totalCleaned = cleanupSummary.reduce((sum, result) => sum + (result.count || 0), 0);

    console.log(`Orphaned data cleanup completed. Total records cleaned: ${totalCleaned}`);

    return res.json({
      message: 'Orphaned data cleanup completed',
      summary: {
        totalRecordsCleaned: totalCleaned,
        collectionsProcessed: cleanupSummary.length,
        details: cleanupSummary
      }
    });

  } catch (error) {
    console.error('Orphaned data cleanup error:', error);
    return res.status(500).json({ error: 'Failed to cleanup orphaned data' });
  }
});

// ==================== AI TUTOR ROUTES ====================

// AI Chat Route - Main tutoring assistance
app.post('/api/ai/chat', authenticateToken, async (req, res) => {
  try {
    const { message, subject, conversationHistory } = req.body;
    const user = req.user;

    // Validate input
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!aiTutorService.isConfigured()) {
      return res.status(503).json({ error: 'AI service is not configured. Please contact administrator.' });
    }

    // Get AI response
    const result = await aiTutorService.getChatResponse(
      message,
      subject || 'general',
      user.grade,
      conversationHistory || []
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Log AI usage for analytics
    try {
      await db.collection('ai_usage').insertOne({
        userId: user._id,
        userRole: user.role,
        subject: subject || 'general',
        question: message,
        tokensUsed: result.tokensUsed,
        model: result.model,
        timestamp: new Date()
      });
    } catch (logError) {
      console.warn('Failed to log AI usage:', logError);
    }

    res.json({
      success: true,
      response: result.response,
      subject: result.subject,
      tokensUsed: result.tokensUsed
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ error: 'Failed to process AI request' });
  }
});

// Generate Study Plan Route
app.post('/api/ai/study-plan', authenticateToken, async (req, res) => {
  try {
    const { subjects, weakAreas, timeAvailable } = req.body;
    const user = req.user;

    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return res.status(400).json({ error: 'At least one subject is required' });
    }

    if (!aiTutorService.isConfigured()) {
      return res.status(503).json({ error: 'AI service is not configured. Please contact administrator.' });
    }

    const result = await aiTutorService.generateStudyPlan(
      user.grade || 'General',
      subjects,
      weakAreas || [],
      timeAvailable || '1 hour'
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Save study plan to user's profile
    try {
      await db.collection('study_plans').insertOne({
        userId: user._id,
        grade: user.grade,
        subjects: subjects,
        weakAreas: weakAreas || [],
        timeAvailable: timeAvailable || '1 hour',
        studyPlan: result.studyPlan,
        tokensUsed: result.tokensUsed,
        createdAt: new Date()
      });
    } catch (saveError) {
      console.warn('Failed to save study plan:', saveError);
    }

    res.json({
      success: true,
      studyPlan: result.studyPlan,
      tokensUsed: result.tokensUsed
    });

  } catch (error) {
    console.error('Study Plan generation error:', error);
    res.status(500).json({ error: 'Failed to generate study plan' });
  }
});

// Generate Quiz Route
app.post('/api/ai/quiz', authenticateToken, async (req, res) => {
  try {
    const { subject, topic, questionCount } = req.body;
    const user = req.user;

    if (!subject || !topic) {
      return res.status(400).json({ error: 'Subject and topic are required' });
    }

    if (!aiTutorService.isConfigured()) {
      return res.status(503).json({ error: 'AI service is not configured. Please contact administrator.' });
    }

    const result = await aiTutorService.generateQuiz(
      subject,
      topic,
      user.grade || 'General',
      questionCount || 5
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Save quiz for later reference
    try {
      await db.collection('generated_quizzes').insertOne({
        userId: user._id,
        grade: user.grade,
        subject: subject,
        topic: topic,
        quiz: result.quiz,
        questionCount: questionCount || 5,
        tokensUsed: result.tokensUsed,
        createdAt: new Date()
      });
    } catch (saveError) {
      console.warn('Failed to save quiz:', saveError);
    }

    res.json({
      success: true,
      quiz: result.quiz,
      subject: result.subject,
      topic: result.topic,
      tokensUsed: result.tokensUsed
    });

  } catch (error) {
    console.error('Quiz generation error:', error);
    res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Explain Concept Route
app.post('/api/ai/explain', authenticateToken, async (req, res) => {
  try {
    const { concept, subject } = req.body;
    const user = req.user;

    if (!concept || !subject) {
      return res.status(400).json({ error: 'Concept and subject are required' });
    }

    if (!aiTutorService.isConfigured()) {
      return res.status(503).json({ error: 'AI service is not configured. Please contact administrator.' });
    }

    const result = await aiTutorService.explainConcept(
      concept,
      subject,
      user.grade || 'General'
    );

    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }

    // Log concept explanation for analytics
    try {
      await db.collection('concept_explanations').insertOne({
        userId: user._id,
        grade: user.grade,
        concept: concept,
        subject: subject,
        explanation: result.explanation,
        tokensUsed: result.tokensUsed,
        createdAt: new Date()
      });
    } catch (saveError) {
      console.warn('Failed to save concept explanation:', saveError);
    }

    res.json({
      success: true,
      explanation: result.explanation,
      concept: result.concept,
      subject: result.subject,
      tokensUsed: result.tokensUsed
    });

  } catch (error) {
    console.error('Concept explanation error:', error);
    res.status(500).json({ error: 'Failed to explain concept' });
  }
});

// Get Available AI Subjects
app.get('/api/ai/subjects', authenticateToken, (req, res) => {
  try {
    const subjects = aiTutorService.getAvailableSubjects();
    res.json({
      success: true,
      subjects: subjects
    });
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Failed to get available subjects' });
  }
});

// AI Service Status
app.get('/api/ai/status', authenticateToken, (req, res) => {
  try {
    const isConfigured = aiTutorService.isConfigured();
    res.json({
      success: true,
      configured: isConfigured,
      availableFeatures: [
        'chat',
        'study-plan',
        'quiz',
        'explain'
      ]
    });
  } catch (error) {
    console.error('AI status error:', error);
    res.status(500).json({ error: 'Failed to get AI service status' });
  }
});

// Get User's AI Usage History
app.get('/api/ai/history', authenticateToken, async (req, res) => {
  try {
    const user = req.user;
    const limit = parseInt(req.query.limit) || 20;
    const offset = parseInt(req.query.offset) || 0;

    const history = await db.collection('ai_usage')
      .find({ userId: user._id })
      .sort({ timestamp: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const totalUsage = await db.collection('ai_usage')
      .countDocuments({ userId: user._id });

    res.json({
      success: true,
      history: history,
      totalQuestions: totalUsage,
      hasMore: (offset + limit) < totalUsage
    });

  } catch (error) {
    console.error('AI history error:', error);
    res.status(500).json({ error: 'Failed to get AI usage history' });
  }
});

// =========================
// ADMIN ENDPOINTS
// =========================

// Admin Dashboard - Get all system statistics
app.get('/api/admin/dashboard', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const users = await db.collection('users').find({}, { projection: { password: 0 } }).toArray();
    const lessons = await db.collection('lessons').find({}).toArray();
    const teacherHours = await db.collection('working_hours').find({}).toArray();

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.isActive).length,
      bannedUsers: users.filter(u => !u.isActive).length,
      usersByRole: {
        parents: users.filter(u => u.role === 'Parent').length,
        students: users.filter(u => u.role === 'Student').length,
        teachers: users.filter(u => u.role === 'Teacher').length,
        admins: users.filter(u => u.role === 'Admin').length
      },
      totalLessons: lessons.length,
      lessonsByStatus: {
        booked: lessons.filter(l => l.status === 'booked').length,
        inProgress: lessons.filter(l => l.status === 'in_progress').length,
        completed: lessons.filter(l => l.status === 'completed').length,
        cancelled: lessons.filter(l => l.status === 'cancelled').length
      },
      totalTeacherHours: teacherHours.reduce((sum, h) => sum + parseFloat(h.hours || 0), 0)
    };

    res.json({ stats, message: 'Admin dashboard data retrieved successfully' });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to get admin dashboard data' });
  }
});

// Get all users with detailed information
app.get('/api/admin/users', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { role, status, search } = req.query;
    let query = {};
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'banned') {
      query.isActive = false;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await db.collection('users').find(query, { 
      projection: { password: 0 } 
    }).sort({ createdAt: -1 }).toArray();

    res.json({ users, message: 'Users retrieved successfully' });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Get all lessons with detailed information
app.get('/api/admin/lessons', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { status, teacherId, parentId, studentId } = req.query;
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (teacherId) {
      query.teacherId = new ObjectId(teacherId);
    }
    
    if (parentId) {
      query.parentId = new ObjectId(parentId);
    }
    
    if (studentId) {
      query.studentEmail = studentId; // Assuming studentId is email for this search
    }

    const lessons = await db.collection('lessons').aggregate([
      { $match: query },
      { $lookup: {
          from: 'users',
          localField: 'teacherId',
          foreignField: '_id',
          as: 'teacher',
          pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }]
      }},
      { $lookup: {
          from: 'users',
          localField: 'parentId',
          foreignField: '_id',
          as: 'parent',
          pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }]
      }},
      { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$parent', preserveNullAndEmptyArrays: true } },
      { $sort: { dateTime: -1 } }
    ]).toArray();

    res.json({ lessons, message: 'Lessons retrieved successfully' });
  } catch (error) {
    console.error('Admin get lessons error:', error);
    res.status(500).json({ error: 'Failed to get lessons' });
  }
});

// Get all teacher payment information
app.get('/api/admin/teacher-payments', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { teacherId, fromDate, toDate } = req.query;
    let query = {};
    
    if (teacherId) {
      query.teacherId = new ObjectId(teacherId);
    }
    
    if (fromDate || toDate) {
      query.date = {};
      if (fromDate) {
        query.date.$gte = new Date(fromDate);
      }
      if (toDate) {
        query.date.$lte = new Date(toDate);
      }
    }

    const teacherHours = await db.collection('working_hours').aggregate([
      { $match: query },
      { $lookup: {
          from: 'users',
          localField: 'teacherId',
          foreignField: '_id',
          as: 'teacher',
          pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }]
      }},
      { $unwind: '$teacher' },
      { $sort: { date: -1 } }
    ]).toArray();

    // Calculate payment summary by teacher with individual hourly rates
    const paymentSummary = {};
    teacherHours.forEach(entry => {
      const teacherId = entry.teacherId.toString();
      const hourlyRate = entry.teacher.hourlyRate || 25; // Use individual rate or default to $25
      const hours = parseFloat(entry.hours || 0);
      
      if (!paymentSummary[teacherId]) {
        paymentSummary[teacherId] = {
          teacher: entry.teacher,
          hourlyRate: hourlyRate,
          totalHours: 0,
          totalEntries: 0,
          estimatedPayment: 0
        };
      }
      paymentSummary[teacherId].totalHours += hours;
      paymentSummary[teacherId].totalEntries += 1;
      paymentSummary[teacherId].estimatedPayment += (hours * hourlyRate); // Calculate with individual rate
    });

    res.json({ 
      teacherHours, 
      paymentSummary: Object.values(paymentSummary),
      message: 'Teacher payments retrieved successfully' 
    });
  } catch (error) {
    console.error('Admin teacher payments error:', error);
    res.status(500).json({ error: 'Failed to get teacher payments' });
  }
});

// Ban/Unban user
app.put('/api/admin/users/:userId/ban', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { isBanned, reason } = req.body;

    // Don't allow banning other admins
    const targetUser = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (targetUser.role === 'Admin') {
      return res.status(403).json({ error: 'Cannot ban admin users' });
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      { 
        $set: { 
          isActive: !isBanned,
          banReason: reason || null,
          bannedAt: isBanned ? new Date() : null,
          bannedBy: req.user._id
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log the ban/unban action for audit purposes
    await db.collection('adminActions').insertOne({
      action: isBanned ? 'BAN_USER' : 'UNBAN_USER',
      adminId: req.user._id,
      targetUserId: new ObjectId(userId),
      userData: {
        name: `${targetUser.firstName} ${targetUser.lastName}`,
        email: targetUser.email,
        role: targetUser.role
      },
      reason: reason || 'No reason provided',
      timestamp: new Date()
    });

    res.json({ 
      message: `User ${isBanned ? 'banned' : 'unbanned'} successfully`,
      userId,
      isBanned
    });
  } catch (error) {
    console.error('Admin ban user error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Delete lesson (admin only)
app.delete('/api/admin/lessons/:lessonId', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { reason } = req.body;

    const lesson = await db.collection('lessons').findOne({ _id: new ObjectId(lessonId) });
    if (!lesson) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    // Log the deletion for audit purposes
    await db.collection('adminActions').insertOne({
      action: 'DELETE_LESSON',
      adminId: req.user._id,
      targetLessonId: new ObjectId(lessonId),
      lessonData: lesson,
      reason: reason || 'No reason provided',
      timestamp: new Date()
    });

    const result = await db.collection('lessons').deleteOne({ _id: new ObjectId(lessonId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }

    res.json({ 
      message: 'Lesson deleted successfully',
      lessonId,
      deletedBy: req.user.email
    });
  } catch (error) {
    console.error('Admin delete lesson error:', error);
    res.status(500).json({ error: 'Failed to delete lesson' });
  }
});

// Update teacher payment status
app.put('/api/admin/teacher-payments/:paymentId/status', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { status, notes } = req.body; // status: 'pending', 'paid', 'disputed'

    const result = await db.collection('working_hours').updateOne(
      { _id: new ObjectId(paymentId) },
      { 
        $set: { 
          paymentStatus: status,
          paymentNotes: notes || null,
          paymentUpdatedAt: new Date(),
          paymentUpdatedBy: req.user._id
        } 
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    res.json({ 
      message: 'Payment status updated successfully',
      paymentId,
      status
    });
  } catch (error) {
    console.error('Admin update payment error:', error);
    res.status(500).json({ error: 'Failed to update payment status' });
  }
});

// Get admin action logs
app.get('/api/admin/logs', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { limit = 50, skip = 0 } = req.query;

    const logs = await db.collection('adminActions').aggregate([
      { $lookup: {
          from: 'users',
          localField: 'adminId',
          foreignField: '_id',
          as: 'admin',
          pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1 } }]
      }},
      { $unwind: '$admin' },
      { $sort: { timestamp: -1 } },
      { $skip: parseInt(skip) },
      { $limit: parseInt(limit) }
    ]).toArray();

    const totalLogs = await db.collection('adminActions').countDocuments();

    res.json({ 
      logs, 
      totalLogs,
      message: 'Admin logs retrieved successfully' 
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).json({ error: 'Failed to get admin logs' });
  }
});

// Update teacher hourly rate
app.put('/api/admin/teachers/:teacherId/hourly-rate', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { hourlyRate } = req.body;

    if (!hourlyRate || hourlyRate <= 0) {
      return res.status(400).json({ error: 'Valid hourly rate is required' });
    }

    const teacher = await db.collection('users').findOne({ 
      _id: new ObjectId(teacherId),
      role: 'Teacher'
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(teacherId) },
      { 
        $set: { 
          hourlyRate: parseFloat(hourlyRate),
          hourlyRateUpdatedAt: new Date(),
          hourlyRateUpdatedBy: req.user._id
        } 
      }
    );

    // Log the rate change for audit
    await db.collection('adminActions').insertOne({
      action: 'UPDATE_TEACHER_RATE',
      adminId: req.user._id,
      targetUserId: new ObjectId(teacherId),
      userData: {
        name: `${teacher.firstName} ${teacher.lastName}`,
        email: teacher.email,
        previousRate: teacher.hourlyRate || 25,
        newRate: parseFloat(hourlyRate)
      },
      reason: `Hourly rate updated from $${teacher.hourlyRate || 25} to $${hourlyRate}`,
      timestamp: new Date()
    });

    res.json({ 
      message: 'Teacher hourly rate updated successfully',
      teacherId,
      hourlyRate: parseFloat(hourlyRate)
    });
  } catch (error) {
    console.error('Admin update teacher rate error:', error);
    res.status(500).json({ error: 'Failed to update teacher hourly rate' });
  }
});

// Get detailed teacher salary report
app.get('/api/admin/teacher-salary-report', authenticateToken, authorizeRole('Admin'), async (req, res) => {
  try {
    const { fromDate, toDate, teacherId } = req.query;
    let dateQuery = {};
    
    if (fromDate || toDate) {
      dateQuery.date = {};
      if (fromDate) dateQuery.date.$gte = new Date(fromDate);
      if (toDate) dateQuery.date.$lte = new Date(toDate);
    }

    let hoursQuery = { ...dateQuery };
    if (teacherId) {
      hoursQuery.teacherId = new ObjectId(teacherId);
    }

    // Get all teachers with their hourly rates
    const teachers = await db.collection('users').find(
      { role: 'Teacher' },
      { projection: { firstName: 1, lastName: 1, email: 1, hourlyRate: 1 } }
    ).toArray();

    // Get teacher hours data
    const teacherHours = await db.collection('working_hours').aggregate([
      { $match: hoursQuery },
      { $lookup: {
          from: 'users',
          localField: 'teacherId',
          foreignField: '_id',
          as: 'teacher',
          pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1, hourlyRate: 1 } }]
      }},
      { $unwind: '$teacher' },
      { $sort: { date: -1 } }
    ]).toArray();

    // Calculate detailed salary report
    const salaryReport = {};
    
    teachers.forEach(teacher => {
      salaryReport[teacher._id.toString()] = {
        teacher: {
          _id: teacher._id,
          firstName: teacher.firstName,
          lastName: teacher.lastName,
          email: teacher.email,
          hourlyRate: teacher.hourlyRate || 25
        },
        totalHours: 0,
        totalEntries: 0,
        totalSalary: 0,
        entries: [],
        averageHoursPerEntry: 0,
        lastWorkedDate: null
      };
    });

    teacherHours.forEach(entry => {
      const teacherId = entry.teacherId.toString();
      const hourlyRate = entry.teacher.hourlyRate || 25;
      const hours = parseFloat(entry.hours || 0);
      const entrySalary = hours * hourlyRate;

      if (salaryReport[teacherId]) {
        salaryReport[teacherId].totalHours += hours;
        salaryReport[teacherId].totalEntries += 1;
        salaryReport[teacherId].totalSalary += entrySalary;
        salaryReport[teacherId].entries.push({
          _id: entry._id,
          date: entry.date,
          hours: hours,
          hourlyRate: hourlyRate,
          salary: entrySalary,
          notes: entry.notes,
          paymentStatus: entry.paymentStatus || 'pending'
        });
        
        // Update last worked date
        const entryDate = new Date(entry.date);
        if (!salaryReport[teacherId].lastWorkedDate || entryDate > new Date(salaryReport[teacherId].lastWorkedDate)) {
          salaryReport[teacherId].lastWorkedDate = entry.date;
        }
      }
    });

    // Calculate averages and sort entries
    Object.values(salaryReport).forEach(report => {
      if (report.totalEntries > 0) {
        report.averageHoursPerEntry = report.totalHours / report.totalEntries;
        report.entries.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
    });

    // Convert to array and sort by total salary (highest first)
    const reportArray = Object.values(salaryReport)
      .filter(report => report.totalEntries > 0 || teacherId) // Show only teachers with entries, unless specific teacher requested
      .sort((a, b) => b.totalSalary - a.totalSalary);

    // Calculate overall totals
    const overallTotals = reportArray.reduce((totals, report) => ({
      totalTeachers: totals.totalTeachers + (report.totalEntries > 0 ? 1 : 0),
      totalHours: totals.totalHours + report.totalHours,
      totalSalary: totals.totalSalary + report.totalSalary,
      totalEntries: totals.totalEntries + report.totalEntries
    }), { totalTeachers: 0, totalHours: 0, totalSalary: 0, totalEntries: 0 });

    res.json({ 
      salaryReport: reportArray,
      overallTotals,
      dateRange: { fromDate: fromDate || null, toDate: toDate || null },
      message: 'Teacher salary report generated successfully' 
    });
  } catch (error) {
    console.error('Admin salary report error:', error);
    res.status(500).json({ error: 'Failed to generate salary report' });
  }
});

module.exports = app;

