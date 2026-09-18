const assert = require('assert');
const mongoose = require('mongoose');
const { Course } = require('./src/models');

const BASE_URL = 'http://localhost:5000';

async function runCourseTests() {
  console.log('========================================');
  console.log('      STARTING COURSE TEST SUITE        ');
  console.log('========================================\n');

  // Ensure DB connection for test data injection
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_course_db';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2000 });
  }

  // Clear existing courses in test collection first
  await Course.deleteMany({});

  // ----------------------------------------------------
  // Test A: GET /courses with no courses
  // ----------------------------------------------------
  console.log('Test A: Testing GET /courses with empty collection...');
  const emptyRes = await fetch(`${BASE_URL}/courses`);
  const emptyData = await emptyRes.json();
  assert.strictEqual(emptyRes.status, 200);
  assert.strictEqual(emptyData.success, true);
  assert.strictEqual(emptyData.count, 0);
  assert(Array.isArray(emptyData.courses));
  assert.strictEqual(emptyData.courses.length, 0);
  console.log('✓ Test A Passed: Returned empty array [] with count 0.\n');

  // ----------------------------------------------------
  // Test B: Seed actual valid courses and test GET /courses
  // ----------------------------------------------------
  console.log('Test B: Seeding realistic course records into MongoDB...');
  const testCourses = [
    {
      title: 'Full-Stack Web Development with React and Node',
      description: 'Master modern full-stack engineering using React.js, Express, and MongoDB.',
      instructor: 'Dr. Sarah Jenkins',
      category: 'Web Development',
      duration: '12 Weeks',
    },
    {
      title: 'Python for Data Science and Machine Learning',
      description: 'Comprehensive Python training covering NumPy, Pandas, and Scikit-Learn.',
      instructor: 'Prof. Alex Rivera',
      category: 'Data Science',
      duration: '8 Weeks',
    },
    {
      title: 'Advanced React Architecture and State Management',
      description: 'Deep dive into React 18, custom hooks, Redux Toolkit, and performance optimization.',
      instructor: 'John Doe',
      category: 'Frontend Engineering',
      duration: '6 Weeks',
    },
    {
      title: 'Cloud Computing Essentials with AWS',
      description: 'Learn cloud fundamentals, EC2, S3, Lambda, and deployment strategies.',
      instructor: 'Maria Chen',
      category: 'Cloud Computing',
      duration: '4 Weeks',
    },
  ];

  await Course.insertMany(testCourses);
  console.log(`Inserted ${testCourses.length} valid courses into MongoDB.`);

  const allRes = await fetch(`${BASE_URL}/courses`);
  const allData = await allRes.json();
  assert.strictEqual(allRes.status, 200);
  assert.strictEqual(allData.success, true);
  assert.strictEqual(allData.count, testCourses.length);
  assert.strictEqual(allData.courses.length, testCourses.length);
  console.log('✓ Test B Passed: GET /courses retrieved all database courses successfully.\n');

  // ----------------------------------------------------
  // Test C: GET /courses?search=react
  // ----------------------------------------------------
  console.log('Test C: Testing GET /courses?search=react...');
  const reactRes = await fetch(`${BASE_URL}/courses?search=react`);
  const reactData = await reactRes.json();
  assert.strictEqual(reactRes.status, 200);
  assert.strictEqual(reactData.count, 2, 'Should find 2 courses mentioning React');
  reactData.courses.forEach((c) => {
    const text = (c.title + ' ' + c.description + ' ' + c.category).toLowerCase();
    assert(text.includes('react'), 'Found course must match "react"');
  });
  console.log('✓ Test C Passed: Search for "react" returned 2 matching courses.\n');

  // ----------------------------------------------------
  // Test D: Search with uppercase/lowercase variations
  // ----------------------------------------------------
  console.log('Test D: Testing case-insensitive variations (REACT, ReAcT)...');
  const upperRes = await fetch(`${BASE_URL}/courses?search=REACT`);
  const upperData = await upperRes.json();
  const mixedRes = await fetch(`${BASE_URL}/courses?search=ReAcT`);
  const mixedData = await mixedRes.json();
  assert.strictEqual(upperData.count, 2);
  assert.strictEqual(mixedData.count, 2);
  console.log('✓ Test D Passed: Case-insensitive search works across all casing variations.\n');

  // ----------------------------------------------------
  // Test E: Search by title
  // ----------------------------------------------------
  console.log('Test E: Searching by title ("Machine Learning")...');
  const titleRes = await fetch(`${BASE_URL}/courses?search=Machine%20Learning`);
  const titleData = await titleRes.json();
  assert.strictEqual(titleData.count, 1);
  assert.strictEqual(titleData.courses[0].title, 'Python for Data Science and Machine Learning');
  console.log('✓ Test E Passed: Searching by title returned exact course.\n');

  // ----------------------------------------------------
  // Test F: Search by instructor and category
  // ----------------------------------------------------
  console.log('Test F: Searching by instructor ("Jenkins") and category ("Cloud")...');
  const instRes = await fetch(`${BASE_URL}/courses?search=Jenkins`);
  const instData = await instRes.json();
  assert.strictEqual(instData.count, 1);
  assert.strictEqual(instData.courses[0].instructor, 'Dr. Sarah Jenkins');

  const catRes = await fetch(`${BASE_URL}/courses?search=Cloud`);
  const catData = await catRes.json();
  assert.strictEqual(catData.count, 1);
  assert.strictEqual(catData.courses[0].category, 'Cloud Computing');
  console.log('✓ Test F Passed: Searching by instructor and category returned corresponding courses.\n');

  // ----------------------------------------------------
  // Test G: Search with no matching result
  // ----------------------------------------------------
  console.log('Test G: Searching with non-matching term ("nonexistentcourse123")...');
  const noMatchRes = await fetch(`${BASE_URL}/courses?search=nonexistentcourse123`);
  const noMatchData = await noMatchRes.json();
  assert.strictEqual(noMatchRes.status, 200);
  assert.strictEqual(noMatchData.count, 0);
  assert.strictEqual(noMatchData.courses.length, 0);
  console.log('✓ Test G Passed: Non-matching search returned empty array cleanly.\n');

  // ----------------------------------------------------
  // Test H: Verify JSON structure and fields
  // ----------------------------------------------------
  console.log('Test H: Verifying course fields and schema integrity...');
  const sample = allData.courses[0];
  assert(sample._id, 'Course must have _id');
  assert(sample.title, 'Course must have title');
  assert(sample.description, 'Course must have description');
  assert(sample.instructor, 'Course must have instructor');
  assert(sample.category, 'Course must have category');
  assert(sample.duration, 'Course must have duration');
  assert(sample.createdAt, 'Course must have createdAt');
  assert(sample.updatedAt, 'Course must have updatedAt');
  console.log('✓ Test H Passed: Course structure contains all specified fields.\n');

  // ----------------------------------------------------
  // Test I: Verify MongoDB direct query parity
  // ----------------------------------------------------
  console.log('Test I: Verifying database parity with MongoDB...');
  const countInDb = await Course.countDocuments();
  assert.strictEqual(countInDb, testCourses.length);
  console.log('✓ Test I Passed: Course count in MongoDB matches API results.\n');

  console.log('========================================');
  console.log('      ALL COURSE TESTS PASSED 100%      ');
  console.log('========================================');

  await mongoose.disconnect();
}

runCourseTests().catch(async (err) => {
  console.error('\n❌ Course Test Suite Failed:', err.message);
  try { await mongoose.disconnect(); } catch (e) {}
  process.exit(1);
});
