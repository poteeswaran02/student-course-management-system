const mongoose = require('mongoose');

/**
 * Course Schema
 * Represents courses available in the Student Course Management System.
 */
const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      minlength: [3, 'Course title must be at least 3 characters long'],
      maxlength: [200, 'Course title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Course description is required'],
      trim: true,
      minlength: [10, 'Course description must be at least 10 characters long'],
    },
    instructor: {
      type: String,
      required: [true, 'Instructor name is required'],
      trim: true,
      minlength: [2, 'Instructor name must be at least 2 characters long'],
      maxlength: [100, 'Instructor name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      required: [true, 'Course category is required'],
      trim: true,
    },
    duration: {
      type: String,
      trim: true,
      default: 'Self-paced',
    },
    fee: {
      type: Number,
      default: 0,
      min: [0, 'Course fee cannot be negative'],
    },

  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
  }
);

// Index category for fast filtering in course listings
courseSchema.index({ category: 1 });

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
