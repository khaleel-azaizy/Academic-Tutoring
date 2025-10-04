# Academic Tutoring Platform

A full‑stack educational platform with AI‑powered tutoring, multi‑role access (Student / Teacher / Parent), lesson scheduling, messaging, and a themable modern UI (now supporting a green palette + dark mode).

## � Core Feature Set

### Authentication & Roles
- Secure JWT auth (HTTP‑only cookie friendly architecture)
- Roles: Student, Teacher, Parent (with child management) + (Admin if enabled)
- Password hashing (bcrypt)

### Lesson & Scheduling
- Parent → Teacher booking workflow (multi‑step with availability)
- Student monthly calendar (with meeting link indicators)
- Time constraints / availability management (teachers)
- Lesson status tracking (booked / in_progress / completed / cancelled)

### AI Tutoring Assistant
- Subject context (Math, Science, English, History, Computer Science, General)
- Concept explanation, study plan generation, quiz creation, homework help
- (Planned) Adaptive difficulty & usage budgeting

### Communication & Engagement
- Real-time style messaging (teacher ↔ student/parent channels)
- Notifications system
- Contact teacher quick action for missing meeting link

### Admin / Operational Tools
- User management, activity logs
- Salary / hours reporting per teacher (if enabled)
- Rate editing & reporting

### UI / UX Enhancements
- Responsive layout with collapsible sidebar
- Dark / light theme + green accent gradient
- Accessible focus states & keyboard navigation (ongoing improvements)

## 🧠 AI Roadmap Snapshot
Phased approach (from original AI integration plan):
| Phase | Delivered / Planned | Highlights |
|-------|--------------------|------------|
| 1 | ✅ Tutor Chat | Q&A, study plans, quizzes, explanations |
| 2 | ⏳ Teacher/Parent Insights | Progress analysis, lesson plan generator |
| 3 | 🔭 Voice & Vision | Voice Q&A, handwriting / math OCR |

Recommended next AI tasks: cost usage dashboard, adaptive quiz difficulty, student progress summarizer.

## 🗂 Project Structure
```
academic-tutoring/
├── academic-tutoring-client/        # React + Vite frontend
│   ├── src/
│   │   ├── components/              # UI + feature components
│   │   ├── services/                # API abstraction (authAPI, roleAPI, adminAPI)
│   │   ├── contexts/                # Providers (toast, theme, etc.)
│   │   ├── styles/                  # Global & feature CSS
│   │   └── assets/
├── academic-tutoring-server/        # Node/Express backend
│   ├── routes/                      # Route definitions
│   ├── models/                      # Mongoose schemas
│   ├── middleware/                  # Auth / validation
│   └── services/                    # Business & AI integration
```

## 🛠 Tech Stack
| Layer | Tech | Notes |
|-------|------|-------|
| Frontend | React 18, Vite | Fast dev, hooks-based architecture |
| Styling | CSS variables | Theme + dark/light + accent swap (green) |
| Icons | Lucide React | Consistent outlined icons |
| State | Local component + contexts | Simple & direct; could adopt Redux/Zustand later |
| Backend | Node.js + Express | REST API |
| DB | MongoDB + Mongoose | Flexible lesson & user models |
| Auth | JWT + bcrypt | Role gating and secure hashing |
| AI | OpenAI API | GPT-powered tutoring (extensible) |

## 📦 Prerequisites
| Requirement | Version | Why |
|-------------|---------|-----|
| Node.js | 18+ (recommend 20+) | Vite + modern syntax |
| MongoDB | 5+ | Lesson / user persistence |
| OpenAI API Key | valid | AI tutoring features |

Optional: Docker for future deployment, PM2 for process management.

## ⚙️ Environment Variables (Server)
Create `academic-tutoring-server/.env`:
```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/academic-tutoring
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=4000
```
You can add rate limiting or cost metrics later: `AI_MAX_DAILY_TOKENS`, `AI_LOGGING=1`.

## ▶️ Run Locally
Backend:
```bash
cd academic-tutoring-server
npm install
npm start
# Server → http://localhost:4000
```
Frontend:
```bash
cd academic-tutoring-client
npm install
npm run dev
# Frontend → http://localhost:5173
```

## � Authentication Flow
1. Register (role chosen) → server creates user + hashed password
2. Login → server returns JWT (stored client-side; consider httpOnly cookie for production security)
3. Protected routes validated by middleware → role gating
4. Token refresh strategy (manual re-login currently) – future: silent refresh endpoint

## 👥 Role Highlights
| Role | Capabilities |
|------|--------------|
| Student | View calendar, access AI tutor, message teachers |
| Teacher | Manage availability, report hours, chat with students |
| Parent | Book lessons, manage children, view history, use AI tutor |
| Admin | (If active) manage users, logs, rates, salary reports |

## 📅 Scheduling & Calendar
- Current student view: full month grid with mini lesson badges
- Meeting link indicators (camera icon) with improved visibility
- Real-time hover tooltip: subject, status, duration, teacher
- Planned enhancements: click-to-expand day, ICS export, conflict warnings

## 🤖 AI Tutor Details
Current:
- Model: GPT-3.5 (configurable)
- Context injection: subject + role + user request
- Quick actions: explain, quiz, study plan, homework help

Roadmap (from plan):
- Phase 2: progress analytics, lesson plan drafts
- Phase 3: voice / OCR / handwriting recognition (optionally via 3rd-party APIs)

## 🌍 Internationalization & RTL
- Hebrew RTL support added in initial auth & role flows
- Strategy: conditional `dir="rtl"` on root or container + logical CSS spacing
- Future: extract strings → i18n JSON (e.g., i18next) for full multilingual support

## 🧪 Testing (Suggested Next)
Currently minimal/no automated tests. Recommended:
- Unit: service layer (AI wrapper, booking validator)
- Integration: booking flow (mock availability → book → history)
- Snapshot/Visual: calendar & AI chat layout

## 🩻 Troubleshooting Cheatsheet
| Issue | Fix |
|-------|-----|
| AI chat 401 | Ensure OPENAI_API_KEY + server restart |
| Calendar empty | Confirm lessons returned by API & correct date range |
| JWT invalid | Clear localStorage or regenerate JWT_SECRET |
| Build fails (Vite) | Upgrade Node (>=18), delete node_modules, reinstall |
| CORS errors | Add proper origin in Express CORS middleware |

## 🔐 Security Notes
- Use httpOnly cookies for JWT in production
- Add rate limiting on AI endpoints
- Sanitize user-generated text sent to AI
- Enforce max lessons per day / per student (abuse prevention)

## 📈 Suggested Future Enhancements
- Export salary / hours as CSV
- Teacher performance dashboards
- AI cost tracking dashboard
- Calendar drag & drop rescheduling
- WebSocket real-time updates (currently likely polling / standard requests)
- PWA offline study plan viewer

## 🤝 Contributing
1. Fork & branch (`feat/your-feature`)
2. Add / adjust tests
3. Keep commits scoped & conventional
4. Open PR with summary & screenshots for UI work

## 📄 License
MIT License – see repository for full text.

## 🙋 Support
1. Read this README first
2. Check server logs
3. Verify environment variables
4. Isolate reproduction steps
5. Open issue / discussion

---
**Note**: An OpenAI API key is required for AI features. Without it, AI routes will return configuration errors. Keep keys private—do not commit `.env`.