const mongoose = require('mongoose');

/**
 * Enrollment Schema
 * Connects a User (student) to an enrolled Course.
 */
const enrollmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required for enrollment'],
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required for enrollment'],
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Prevent duplicate enrollment for the same user and course
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

// Individual indexes for querying enrollments by user or by course efficiently
enrollmentSchema.index({ userId: 1 });
enrollmentSchema.index({ courseId: 1 });

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);

module.exports = Enrollment;
