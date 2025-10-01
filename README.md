# Academic Tutoring Platform

A comprehensive educational platform with AI-powered tutoring capabilities built with React and Node.js.

## Features

### 🔐 Authentication System
- Role-based access (Teacher, Student, Parent)
- JWT token authentication
- Secure password hashing with bcrypt

### 👥 User Management
- Student registration and profile management
- Teacher profile with subject specialization
- Parent accounts with child management

### 📚 Lesson Booking System
- Browse and book lessons with teachers
- Real-time availability checking
- Lesson history and management

### 🤖 AI Tutoring Assistant
- GPT-powered educational support
- Subject-specific tutoring (Math, Science, English, History, Computer Science)
- Study plan generation
- Quiz creation and practice
- Homework help and explanations

### 💬 Communication
- Real-time messaging between users
- Notifications system
- AI chat interface

## Technology Stack

### Frontend
- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide React** - Modern icon library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **OpenAI API** - AI tutoring capabilities

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- OpenAI API key (for AI features)

### Backend Setup

1. Navigate to the server directory:
```bash
cd academic-tutoring-server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
   - Open `.env` file
   - Add your OpenAI API key:
```
OPENAI_API_KEY=your_actual_openai_api_key_here
```
   - Get your API key from: https://platform.openai.com/api-keys

4. Start MongoDB (if running locally):
   - Make sure MongoDB is installed and running
   - Default connection: `mongodb://localhost:27017/academic-tutoring`

5. Start the server:
```bash
npm start
```
The server will run on http://localhost:4000

### Frontend Setup

1. Navigate to the client directory:
```bash
cd academic-tutoring-client
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```
The frontend will run on http://localhost:5173

## Usage Guide

### Getting Started

1. **Registration**: Create an account by selecting your role (Teacher, Student, or Parent)
2. **Login**: Sign in with your credentials
3. **Profile Setup**: Complete your profile information

### For Students
- Browse available teachers and their subjects
- Book lessons at convenient times  
- Use the AI Tutor for homework help and study assistance
- Message teachers for questions
- Track lesson history and progress

### For Teachers
- Set up your teaching profile and subjects
- Manage availability and time constraints
- Accept/decline lesson bookings
- Report working hours
- Use AI Tutor to help create study materials

### For Parents
- Connect existing student accounts as children
- Monitor children's lesson bookings
- Access AI Tutor for educational support
- Communicate with teachers

### AI Tutor Features

Access the AI Tutor through the "AI Tutor" button in the header:

#### 🎯 Subject Selection
Choose from:
- Mathematics
- Science  
- English Language Arts
- History
- Computer Science
- General Help

#### ⚡ Quick Actions
- **Explain Concept**: Get detailed explanations of topics
- **Create Study Plan**: Generate personalized study schedules
- **Generate Quiz**: Create practice quizzes on any subject
- **Homework Help**: Get step-by-step problem solving assistance

#### 💬 Interactive Chat
- Natural conversation with the AI tutor
- Context-aware responses based on your role and subject
- Message history for reference
- Real-time token usage tracking

## API Endpoints

### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login

### User Management
- `GET /api/user/profile` - Get current user profile
- `PUT /api/user/profile` - Update user profile

### AI Tutoring
- `POST /api/ai/chat` - Send message to AI tutor
- `POST /api/ai/study-plan` - Generate study plan
- `POST /api/ai/quiz` - Generate quiz
- `GET /api/ai/usage` - Get AI usage statistics

### Lessons & Booking
- `GET /api/teachers` - Get available teachers
- `POST /api/lessons/book` - Book a lesson
- `GET /api/lessons/history` - Get lesson history

## Configuration

### Environment Variables

#### Server (.env)
```
# OpenAI API Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Server Configuration  
PORT=4000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/academic-tutoring

# JWT Configuration
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Node Environment
NODE_ENV=development
```

### AI Configuration

The AI system is configured with:
- **Model**: GPT-3.5-turbo
- **Token Limits**: 4000 tokens per request
- **Rate Limiting**: Tracked per user
- **Educational Focus**: Responses optimized for learning

## Troubleshooting

### Common Issues

1. **AI Chat not working**
   - Verify OpenAI API key is set correctly in `.env`
   - Check server console for API errors
   - Ensure you have OpenAI API credits

2. **Frontend won't start**
   - Make sure Node.js version is 18 or higher
   - Delete `node_modules` and run `npm install` again

3. **Database connection issues**
   - Verify MongoDB is running
   - Check connection string in `.env`

4. **Authentication errors**
   - Clear browser localStorage
   - Check JWT_SECRET is set in `.env`

### Error Messages

- **"OpenAI API key not configured"**: Add your API key to `.env` file
- **"Database connection failed"**: Check MongoDB is running
- **"Token expired"**: Login again to refresh authentication

## Development

### Project Structure
```
academic-tutoring/
├── academic-tutoring-client/     # React frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   ├── services/           # API services
│   │   ├── styles/            # CSS styles
│   │   └── contexts/          # React contexts
├── academic-tutoring-server/    # Node.js backend
│   ├── routes/                # API routes
│   ├── models/               # Database models
│   ├── middleware/          # Express middleware
│   └── services/           # Business logic
```

### Key Components

#### Frontend
- `Dashboard.jsx` - Main user interface
- `AIChat.jsx` - AI tutoring interface  
- `Header.jsx` - Navigation and user actions
- `Auth components` - Login/Register forms

#### Backend
- `Router.js` - Main server and API routes
- `aiTutorService.js` - AI interaction logic
- Authentication middleware
- Database models and schemas

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues:
1. Check this README for common solutions
2. Review the troubleshooting section
3. Check server console logs for detailed error messages
4. Ensure all dependencies are properly installed

---

**Note**: This platform requires an OpenAI API key for AI tutoring features. Make sure to set up your API key before using the AI chat functionality.