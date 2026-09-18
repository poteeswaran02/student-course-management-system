const express = require('express');
const cors = require('cors');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const courseRoutes = require('./routes/course');
const enrollmentRoutes = require('./routes/enrollment');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');
// Register Mongoose models
require('./models');

const app = express();

// ==========================================
// Middleware Configuration
// ==========================================

// 1. CORS Configuration
const clientEnvUrls = (process.env.CLIENT_URL || 'http://localhost:5173')
  .split(',')
  .map((url) => url.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  ...clientEnvUrls,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(origin) || allowedOrigins.includes(normalized)) {
        callback(null, true);
      } else {
        callback(new Error(`Blocked by CORS policy for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);

// 2. Body Parsing Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Basic Request Logger Middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// ==========================================
// Routes
// ==========================================

// Health check endpoint
app.use('/health', healthRoutes);

// Authentication endpoints (accessible directly at /register & /login, and /api/auth/*)
app.use('/', authRoutes);
app.use('/api/auth', authRoutes);

// User Profile and Admin Student endpoints (accessible directly at /profile, /students, etc.)
app.use('/', userRoutes);
app.use('/api', userRoutes);

// Course endpoints (accessible at /courses, /course, /api/courses, /api/course)
app.use('/courses', courseRoutes);
app.use('/course', courseRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/course', courseRoutes);

// Enrollment endpoints (accessible directly at /enroll, /mycourses and /api/*)
app.use('/', enrollmentRoutes);
app.use('/api', enrollmentRoutes);


// Root route welcome
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'Student Course Management System API',
    status: 'online',
    healthCheck: '/health',
  });
});

// ==========================================
// Error Handling Middleware
// ==========================================

// Handle 404 routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
