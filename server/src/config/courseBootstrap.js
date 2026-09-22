const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const { Course } = require('../models');

/**
 * 5 Realistic Sample Courses adhering to the Course schema:
 * - title (required, 3-200 chars)
 * - description (required, min 10 chars)
 * - instructor (required, 2-100 chars)
 * - category (required)
 * - duration (optional, default 'Self-paced')
 * - fee (optional, number, min 0)
 */
const SAMPLE_COURSES = [
  {
    title: 'Full Stack Web Development',
    description: 'Master modern full-stack web engineering using React.js, Node.js, Express, and MongoDB. Build robust RESTful APIs, responsive interfaces, and production-ready applications.',
    instructor: 'Dr. Sarah Jenkins',
    category: 'Web Development',
    duration: '12 Weeks',
    fee: 0,
  },
  {
    title: 'Python Programming',
    description: 'Comprehensive Python foundation covering fundamental programming concepts, object-oriented design, standard libraries, automated testing, and problem solving for real-world projects.',
    instructor: 'Prof. Alex Rivera',
    category: 'Programming',
    duration: '8 Weeks',
    fee: 0,
  },
  {
    title: 'Data Science Fundamentals',
    description: 'Explore exploratory data analysis, data manipulation with Pandas and NumPy, data visualization with Matplotlib, and foundational machine learning modeling with Scikit-Learn.',
    instructor: 'Dr. Marcus Vance',
    category: 'Data Science',
    duration: '10 Weeks',
    fee: 49,
  },
  {
    title: 'Cloud Computing',
    description: 'Gain a solid grasp of modern cloud architectures, infrastructure as code, containerization with Docker, serverless patterns, and deployment strategies across enterprise environments.',
    instructor: 'Maria Chen',
    category: 'Cloud & DevOps',
    duration: '6 Weeks',
    fee: 99,
  },
  {
    title: 'Java Programming',
    description: 'In-depth enterprise Java programming covering core language syntax, object-oriented design patterns, collections framework, exception handling, and concurrent multithreading.',
    instructor: 'David Reynolds',
    category: 'Software Engineering',
    duration: '8 Weeks',
    fee: 0,
  },
];

/**
 * Seed the 5 realistic sample courses if they do not exist
 * Prevents duplicates by matching on title (case-insensitive)
 */
const seedSampleCourses = async () => {
  try {
    let createdCount = 0;
    let existingCount = 0;

    for (const courseData of SAMPLE_COURSES) {
      // Check if course already exists by title (case-insensitive regex)
      const existing = await Course.findOne({
        title: { $regex: new RegExp(`^${courseData.title.trim()}$`, 'i') },
      });

      if (!existing) {
        await Course.create(courseData);
        createdCount++;
        console.log(`[Course Bootstrap] Seeded sample course: "${courseData.title}"`);
      } else {
        existingCount++;
      }
    }

    console.log(
      `[Course Bootstrap] Sample courses verified. (${createdCount} newly seeded, ${existingCount} already existed)`
    );
  } catch (error) {
    console.error('[Course Bootstrap] Error seeding sample courses:', error.message);
  }
};

// Allow standalone execution: `node src/config/courseBootstrap.js`
if (require.main === module) {
  const connectDB = require('./db');
  (async () => {
    try {
      await connectDB();
      await seedSampleCourses();
      console.log('[Course Bootstrap] Standalone seeding completed.');
      await mongoose.disconnect();
      process.exit(0);
    } catch (err) {
      console.error('[Course Bootstrap] Standalone seeding failed:', err);
      process.exit(1);
    }
  })();
}

module.exports = seedSampleCourses;
