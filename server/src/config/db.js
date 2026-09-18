const mongoose = require('mongoose');

/**
 * Connect to MongoDB using Mongoose.
 * Connection string is read from process.env.MONGODB_URI.
 */
let mongodInstance = null;

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_course_db';

  try {
    const conn = await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2000 });
    console.log(`[MongoDB] Connected successfully to: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.warn(`[MongoDB] Could not connect to external MongoDB at ${mongoURI} (${error.message}).`);

    // In development environment, start an embedded real MongoDB server instance
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[MongoDB] Starting local MongoDB instance...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const localURI = mongodInstance.getUri();
        const conn = await mongoose.connect(localURI);
        console.log(`[MongoDB] Connected to local MongoDB instance at: ${localURI}`);
      } catch (embeddedErr) {
        console.error(`[MongoDB] Failed to start local MongoDB: ${embeddedErr.message}`);
      }
    }
  }
};

// Monitor connection state events
mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Connection re-established.');
});

module.exports = connectDB;
