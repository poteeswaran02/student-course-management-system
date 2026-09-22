const path = require('path');
// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const app = require('./app');
const connectDB = require('./config/db');
const seedAdmin = require('./config/adminBootstrap');
const seedSampleCourses = require('./config/courseBootstrap');

const PORT = process.env.PORT || 5000;

// Initialize Database connection, seed Admin and Sample Courses
const startServer = async () => {
  await connectDB();
  await seedAdmin();
  await seedSampleCourses();

  const server = app.listen(PORT, () => {
    console.log(`[Server] Backend running on http://localhost:${PORT}`);
    console.log(`[Server] Health check available at: http://localhost:${PORT}/health`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  return server;
};

const server = startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[Server] Unhandled Rejection: ${err.message}`);
});

module.exports = server;

