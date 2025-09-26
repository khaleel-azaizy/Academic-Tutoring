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

const JWT_SECRET = process.env.JWT_SECRET;

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
    if (req.user.role === 'תלמיד' && grade) {
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

module.exports = app;

