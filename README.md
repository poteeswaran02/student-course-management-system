# Student Course Management System

A full-stack production-ready web application for managing students, courses, and enrollments, built with React, Node.js, Express, MongoDB, and Bootstrap 5.

---

## 🚀 Technologies Used

- **Frontend**:
  - HTML5 & CSS3
  - JavaScript (ES6+)
  - React.js (v18)
  - Vite (Build tool & Bundler)
  - Bootstrap 5 (Responsive Layout, Modals, Forms & Components)
- **Backend**:
  - Node.js & Express.js (REST API Architecture)
  - Mongoose (MongoDB ODM)
  - JWT Authentication (`jsonwebtoken`)
  - Password Hashing (`bcryptjs` with salt factor 10)
  - CORS, Dotenv, Centralized Error Handling & Security Sanitization
- **Database**:
  - MongoDB (Users, Courses, Enrollments Collections)
  - Compound Indexes, Foreign Key References, Cascading Cleanup

---

## 📋 Features Implemented

### 🎓 Student Features
- **Student Registration**: Client and server-side validation, unique normalized email check, secure bcrypt password hashing.
- **User Login & JWT**: Secure authentication issuing signed JSON Web Tokens (1-day expiration) storing user identity and role.
- **Forgot Password UI**: Dedicated, accessible password recovery assistance modal with email validation.
- **Profile Management**: View and update full name and email address with collision detection and tamper protection.
- **Available Courses**: Real-time browsing of all published courses with category badges, duration, instructor, and fees.
- **Course Search**: Real-time debounced search by title, instructor, description, or category with empty search fallback and reset button.
- **Course Enrollment**: Instant one-click course enrollment with duplicate enrollment prevention (enforced by compound unique index `{ userId: 1, courseId: 1 }`).
- **My Courses Dashboard**: Personalized student dashboard displaying all active enrollments with enrollment timestamps, course details, fee indicators, and easy navigation to explore more courses.

### 🛡️ Admin Features
- **Admin Authentication**: Role-based access control (RBAC) securely verifying admin privileges from server-verified JWT.
- **Admin Dashboard**: Comprehensive control center with metrics overview, tabbed navigation, and quick actions.
- **Add Course**: Modal form with strict validation (title >= 3 chars, description >= 10 chars, instructor >= 2 chars, non-negative fee).
- **Edit Course**: In-place modification of course titles, descriptions, categories, durations, and fees.
- **Delete Course & Cascade Cleanup**: Safe deletion removing the course record and automatically cleaning up all associated student enrollments to prevent orphan references.
- **View Registered Students**: Complete directory listing registered students with enrollment metrics (never returning passwords or sensitive tokens).

---

## 📁 Project Structure

```
sc project/
├── .gitignore             # Git ignore rules for node_modules, .env, dist
├── package.json           # Root scripts to orchestrate client and server
├── README.md              # Project documentation
├── client/                # React.js frontend
│   ├── .env               # Frontend environment variables
│   ├── .env.example       # Example frontend env configuration
│   ├── index.html         # HTML entry page
│   ├── package.json       # Frontend dependencies and scripts
│   ├── vite.config.js     # Vite configuration
│   └── src/
│       ├── main.jsx       # React application entry point (Bootstrap loaded)
│       ├── App.jsx        # App component, navbar, role routing, notification toasts
│       ├── index.css      # Custom styles, design tokens & responsive overrides
│       └── components/
│           ├── AdminDashboard.jsx  # Admin Course Management & Registered Students
│           ├── AuthModal.jsx       # Register / Login modal with validation
│           ├── Courses.jsx         # Public Course Catalog & Live Search
│           ├── ForgotPassword.jsx  # Password recovery UI
│           ├── MyCourses.jsx       # Student Enrolled Courses Dashboard
│           └── Profile.jsx         # Student profile update modal
└── server/                # Node.js + Express backend
    ├── .env               # Backend environment variables
    ├── .env.example       # Example backend env configuration
    ├── package.json       # Backend dependencies and scripts
    ├── test-*.js          # Automated verification & audit test suites
    └── src/
        ├── app.js         # Express app, CORS, routes & centralized error middleware
        ├── server.js      # Server startup, port listening & database bootstrap
        ├── config/
        │   ├── db.js      # MongoDB Mongoose connection configuration
        │   └── adminBootstrap.js # Admin account initialization
        ├── controllers/
        │   ├── authController.js       # Register, Login, GetMe
        │   ├── courseController.js     # Course CRUD & Search
        │   ├── enrollmentController.js # Enrollment & My Courses
        │   └── userController.js       # Profile & Admin Students
        ├── middleware/
        │   ├── authMiddleware.js       # JWT verification & role authorization
        │   └── errorHandler.js         # Global error handler (zero stack trace leakage)
        ├── models/
        │   ├── Course.js      # Course schema
        │   ├── Enrollment.js  # Enrollment schema (compound unique index)
        │   ├── User.js        # User schema (bcrypt hashing, select: false)
        │   └── index.js       # Models barrel export
        └── routes/
            ├── auth.js        # POST /register, POST /login
            ├── course.js      # GET /courses, POST /courses, PUT/DELETE /course/:id
            ├── enrollment.js  # POST /enroll, GET /mycourses
            ├── health.js      # GET /health
            └── user.js        # PUT /profile, GET /profile, GET /students
```

---

## 📡 REST API Reference

| Endpoint | Method | Access | Description |
|---|---|---|---|
| `/health` | `GET` | Public | Server health status & MongoDB connection state |
| `/register` | `POST` | Public | Register a new student account |
| `/login` | `POST` | Public | Authenticate user (student/admin) and receive JWT |
| `/profile` | `GET` | Private (User) | Get authenticated user profile |
| `/profile` | `PUT` | Private (User) | Update user profile (name, email) |
| `/courses` | `GET` | Public | Browse all courses or search via `?search=query` |
| `/courses` | `POST` | Private (Admin) | Add a new course to catalog |
| `/course/:id` | `PUT` | Private (Admin) | Update an existing course |
| `/course/:id` | `DELETE` | Private (Admin) | Delete course and cascade remove student enrollments |
| `/enroll` | `POST` | Private (Student) | Enroll authenticated student in course (`courseId`) |
| `/mycourses` | `GET` | Private (Student) | Retrieve courses enrolled by authenticated student |
| `/students` | `GET` | Private (Admin) | View all registered students in the system |

---

## ⚙️ Environment Variables

### Backend (`server/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/student_course_db
CLIENT_URL=http://localhost:5173
JWT_SECRET=student_course_management_jwt_secret_dev_key_2026
JWT_EXPIRES_IN=1d
NODE_ENV=development
```

### Frontend (`client/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 🛠️ Installation & Quick Start

### 1. Install Dependencies
From the root directory:
```bash
npm run install:all
```

### 2. Start Services
In one terminal, start the backend:
```bash
npm run server
```

In a second terminal, start the frontend:
```bash
npm run client
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Running Automated Tests

Run any or all test suites from the `server` directory:

```bash
# Comprehensive Master Audit Suite (Step 10)
node test-step10-final-audit.js

# Validation, Search & Polish Suite (Step 9)
node test-step9-suite.js

# Admin Features Suite (Step 8)
node test-admin-suite.js

# My Courses Suite (Step 7)
node test-mycourses-suite.js

# Enrollment Suite (Step 6)
node test-enrollment-suite.js

# Course Browsing & Search Suite (Step 5)
node test-course-suite.js

# Authentication & JWT Suite (Step 3)
node test-auth-suite.js

# Profile Suite (Step 4)
node test-profile-suite.js
```

---

## 🏗️ Production Build
To create an optimized production build of the frontend:
```bash
cd client
npm run build
```
Production assets will be built to `client/dist/`.
