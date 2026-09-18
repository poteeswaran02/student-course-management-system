const assert = require('assert');
const mongoose = require('mongoose');
const { User, Course, Enrollment } = require('./src/models');

const BASE_URL = 'http://localhost:5000';

async function runMyCoursesTests() {
  console.log('========================================');
  console.log('    STARTING MY COURSES TEST SUITE      ');
  console.log('========================================\n');

  // Connect to DB for direct validation
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_course_db';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2000 });
  }

  const timestamp = Date.now();
  const studentA = {
    name: 'Grace Hopper',
    email: `grace_${timestamp}@example.com`,
    password: 'password12345!',
  };
  const studentB = {
    name: 'Alan Turing',
    email: `alan_${timestamp}@example.com`,
    password: 'password12345!',
  };

  // Register Student A
  const regARes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentA),
  });
  const regAData = await regARes.json();
  const studentAId = regAData.user.id;

  // Register Student B
  const regBRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentB),
  });
  const regBData = await regBRes.json();
  const studentBId = regBData.user.id;

  // Login Student A
  const loginARes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: studentA.email, password: studentA.password }),
  });
  const tokenA = (await loginARes.json()).token;

  // Login Student B
  const loginBRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: studentB.email, password: studentB.password }),
  });
  const tokenB = (await loginBRes.json()).token;

  // Fetch courses from DB
  const coursesRes = await fetch(`${BASE_URL}/courses`);
  const coursesData = await coursesRes.json();
  assert(coursesData.courses.length >= 2, 'Need at least 2 courses for thorough testing');
  const course1 = coursesData.courses[0];
  const course2 = coursesData.courses[1];

  // ----------------------------------------------------
  // Test A & B: Enroll Student A in Course 1 and Course 2
  // ----------------------------------------------------
  console.log('Test A & B: Enrolling Student A in Course 1 and Course 2...');
  const enroll1 = await fetch(`${BASE_URL}/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ courseId: course1._id }),
  });
  assert.strictEqual(enroll1.status, 201);

  const enroll2 = await fetch(`${BASE_URL}/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({ courseId: course2._id }),
  });
  assert.strictEqual(enroll2.status, 201);
  console.log('✓ Test A & B Passed: Student A enrolled in 2 courses.\n');

  // ----------------------------------------------------
  // Test C & D: GET /mycourses for Student A
  // ----------------------------------------------------
  console.log('Test C & D: Fetching GET /mycourses for Student A...');
  const myCoursesARes = await fetch(`${BASE_URL}/mycourses`, {
    headers: { Authorization: `Bearer ${tokenA}` },
  });
  const myCoursesAData = await myCoursesARes.json();
  assert.strictEqual(myCoursesARes.status, 200);
  assert.strictEqual(myCoursesAData.success, true);
  assert.strictEqual(myCoursesAData.count, 2);
  assert(Array.isArray(myCoursesAData.myCourses));
  assert.strictEqual(myCoursesAData.myCourses.length, 2);

  // Check structure of each enrolled course
  const firstItem = myCoursesAData.myCourses[0];
  assert(firstItem.enrollmentId, 'Must contain enrollmentId');
  assert(firstItem.enrolledAt, 'Must contain enrolledAt date');
  assert(firstItem.course, 'Must contain populated course object');
  assert(firstItem.course.title, 'Must contain course title');
  assert(firstItem.course.instructor, 'Must contain instructor');
  assert(firstItem.course.category, 'Must contain category');
  assert(firstItem.course.duration, 'Must contain duration');
  console.log('✓ Test C & D Passed: GET /mycourses returned populated courses with enrollment dates.\n');

  // ----------------------------------------------------
  // Test E & F: Student B with zero enrollments
  // ----------------------------------------------------
  console.log('Test E & F: Fetching GET /mycourses for Student B (zero enrollments)...');
  const myCoursesBRes = await fetch(`${BASE_URL}/mycourses`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const myCoursesBData = await myCoursesBRes.json();
  assert.strictEqual(myCoursesBRes.status, 200);
  assert.strictEqual(myCoursesBData.success, true);
  assert.strictEqual(myCoursesBData.count, 0);
  assert(Array.isArray(myCoursesBData.myCourses));
  assert.strictEqual(myCoursesBData.myCourses.length, 0);
  console.log('✓ Test E & F Passed: Student B received clean empty array [] with count 0.\n');

  // ----------------------------------------------------
  // Test G: User Isolation & Spoofing Test
  // ----------------------------------------------------
  console.log('Test G: Testing user isolation and parameter tampering protection...');
  // Student B attempts to query Student A's courses by appending ?userId=studentAId
  const spoofRes = await fetch(`${BASE_URL}/mycourses?userId=${studentAId}`, {
    headers: { Authorization: `Bearer ${tokenB}` },
  });
  const spoofData = await spoofRes.json();
  assert.strictEqual(spoofRes.status, 200);
  // Must still return Student B's courses (0), NEVER Student A's courses!
  assert.strictEqual(spoofData.count, 0);
  assert.strictEqual(spoofData.myCourses.length, 0);
  console.log('✓ Test G Passed: Student B cannot view Student A courses; backend enforces JWT user identity.\n');

  // ----------------------------------------------------
  // Test H & I: Unauthenticated and invalid token tests
  // ----------------------------------------------------
  console.log('Test H & I: Testing unauthenticated and invalid token requests...');
  const noTokenRes = await fetch(`${BASE_URL}/mycourses`);
  assert.strictEqual(noTokenRes.status, 401);

  const badTokenRes = await fetch(`${BASE_URL}/mycourses`, {
    headers: { Authorization: 'Bearer invalid.token.xyz' },
  });
  assert.strictEqual(badTokenRes.status, 401);
  console.log('✓ Test H & I Passed: Missing and invalid JWT tokens rejected with 401 Unauthorized.\n');

  // ----------------------------------------------------
  // Test J: Password omission test
  // ----------------------------------------------------
  console.log('Test J: Verifying sensitive data omission in response...');
  const rawResponse = JSON.stringify(myCoursesAData);
  assert(!rawResponse.includes('password'), 'Password field leaked in response!');
  assert(!rawResponse.includes('$2a$'), 'Bcrypt hash leaked in response!');
  console.log('✓ Test J Passed: Zero password or hash leakage in response.\n');

  console.log('========================================');
  console.log('   ALL MY COURSES TESTS PASSED 100%     ');
  console.log('========================================');

  await mongoose.disconnect();
}

runMyCoursesTests().catch(async (err) => {
  console.error('\n❌ My Courses Test Suite Failed:', err.message);
  try { await mongoose.disconnect(); } catch (e) {}
  process.exit(1);
});
