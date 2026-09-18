const assert = require('assert');
const mongoose = require('mongoose');
const { User, Course, Enrollment } = require('./src/models');

const BASE_URL = 'http://localhost:5000';

async function runEnrollmentTests() {
  console.log('========================================');
  console.log('    STARTING ENROLLMENT TEST SUITE      ');
  console.log('========================================\n');

  // Connect to DB for direct validation
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/student_course_db';
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2000 });
  }

  // Clear existing enrollments for clean testing
  await Enrollment.deleteMany({});

  const timestamp = Date.now();
  const student = {
    name: 'Eva Student',
    email: `eva_${timestamp}@example.com`,
    password: 'password12345!',
  };
  const anotherUser = {
    name: 'Frank Victim',
    email: `frank_${timestamp}@example.com`,
    password: 'password12345!',
  };

  // Register student
  await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(student),
  });

  // Register another user
  const regFrankRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(anotherUser),
  });
  const frankData = await regFrankRes.json();
  const frankId = frankData.user.id;

  // ----------------------------------------------------
  // Test A: Login as student
  // ----------------------------------------------------
  console.log('Test A: Logging in as student...');
  const loginRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: student.email, password: student.password }),
  });
  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200);
  assert(loginData.token, 'Should receive token');
  const token = loginData.token;
  const studentId = loginData.user.id;
  console.log(`✓ Test A Passed: Logged in as Eva (${studentId}).\n`);

  // ----------------------------------------------------
  // Test B: Get a valid course from GET /courses
  // ----------------------------------------------------
  console.log('Test B: Fetching available courses...');
  const coursesRes = await fetch(`${BASE_URL}/courses`);
  const coursesData = await coursesRes.json();
  assert.strictEqual(coursesRes.status, 200);
  assert(coursesData.courses.length > 0, 'Must have at least one course available');
  const targetCourse = coursesData.courses[0];
  console.log(`✓ Test B Passed: Retrieved course "${targetCourse.title}" (${targetCourse._id}).\n`);

  // ----------------------------------------------------
  // Test C: Enroll in course using POST /enroll
  // ----------------------------------------------------
  console.log('Test C: Enrolling in course via POST /enroll...');
  const enrollRes = await fetch(`${BASE_URL}/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ courseId: targetCourse._id }),
  });
  const enrollData = await enrollRes.json();
  assert.strictEqual(enrollRes.status, 201, `Expected 201 Created, got ${enrollRes.status}: ${JSON.stringify(enrollData)}`);
  assert.strictEqual(enrollData.success, true);
  assert(enrollData.enrollment, 'Must return enrollment object');
  assert.strictEqual(enrollData.enrollment.userId.toString(), studentId.toString());
  assert.strictEqual(enrollData.enrollment.courseId.toString(), targetCourse._id.toString());
  console.log('✓ Test C Passed: Enrolled successfully with 201 Created.\n');

  // ----------------------------------------------------
  // Test D: Verify enrollment is stored in MongoDB
  // ----------------------------------------------------
  console.log('Test D: Verifying enrollment in MongoDB...');
  const dbEnrollment = await Enrollment.findOne({
    userId: studentId,
    courseId: targetCourse._id,
  });
  assert(dbEnrollment, 'Enrollment must exist in database');
  console.log('✓ Test D Passed: Enrollment document found in MongoDB collection.\n');

  // ----------------------------------------------------
  // Test E & F: Try enrolling in the same course again (duplicate prevention)
  // ----------------------------------------------------
  console.log('Test E & F: Attempting duplicate enrollment...');
  const dupRes = await fetch(`${BASE_URL}/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ courseId: targetCourse._id }),
  });
  const dupData = await dupRes.json();
  assert.strictEqual(dupRes.status, 409, `Expected 409 Conflict, got ${dupRes.status}`);
  assert.strictEqual(dupData.success, false);
  assert(dupData.message.includes('already enrolled'));
  console.log('✓ Test E & F Passed: Duplicate enrollment rejected cleanly with 409 Conflict.\n');

  // ----------------------------------------------------
  // Test G: Try enrolling with an invalid courseId format
  // ----------------------------------------------------
  console.log('Test G: Enrolling with invalid ObjectId format...');
  const invalidFormatRes = await fetch(`${BASE_URL}/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ courseId: 'invalid-id-format-123' }),
  });
  const invalidFormatData = await invalidFormatRes.json();
  assert.strictEqual(invalidFormatRes.status, 400);
  assert.strictEqual(invalidFormatData.success, false);
  assert(invalidFormatData.message.includes('Invalid course ID format'));
  console.log('✓ Test G Passed: Malformed courseId rejected with 400 Bad Request.\n');

  // ----------------------------------------------------
  // Test H: Try enrolling in a non-existent course
  // ----------------------------------------------------
  console.log('Test H: Enrolling in non-existent course ObjectId...');
  const fakeCourseId = new mongoose.Types.ObjectId().toString();
  const notFoundRes = await fetch(`${BASE_URL}/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ courseId: fakeCourseId }),
  });
  const notFoundData = await notFoundRes.json();
  assert.strictEqual(notFoundRes.status, 404);
  assert.strictEqual(notFoundData.success, false);
  assert(notFoundData.message.includes('Course not found'));
  console.log('✓ Test H Passed: Non-existent course rejected with 404 Not Found.\n');

  // ----------------------------------------------------
  // Test I: Try POST /enroll without JWT
  // ----------------------------------------------------
  console.log('Test I: Testing POST /enroll without JWT...');
  const noTokenRes = await fetch(`${BASE_URL}/enroll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ courseId: targetCourse._id }),
  });
  assert.strictEqual(noTokenRes.status, 401);
  console.log('✓ Test I Passed: Unauthenticated request rejected with 401 Unauthorized.\n');

  // ----------------------------------------------------
  // Test J: Try POST /enroll with an invalid JWT
  // ----------------------------------------------------
  console.log('Test J: Testing POST /enroll with bad JWT token...');
  const badTokenRes = await fetch(`${BASE_URL}/enroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer invalid.jwt.token',
    },
    body: JSON.stringify({ courseId: targetCourse._id }),
  });
  assert.strictEqual(badTokenRes.status, 401);
  console.log('✓ Test J Passed: Invalid JWT rejected with 401 Unauthorized.\n');

  // ----------------------------------------------------
  // Test K & L: Verify user identity comes strictly from JWT (tamper test)
  // ----------------------------------------------------
  console.log('Test K & L: Attempting to enroll someone else by spoofing userId in body...');
  if (coursesData.courses.length > 1) {
    const secondCourse = coursesData.courses[1];
    const spoofRes = await fetch(`${BASE_URL}/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      // Client attempts to enroll Frank instead of Eva
      body: JSON.stringify({ courseId: secondCourse._id, userId: frankId }),
    });
    const spoofData = await spoofRes.json();
    assert.strictEqual(spoofRes.status, 201);
    // Verified: the created enrollment MUST belong to Eva (authenticated student), NOT Frank!
    assert.strictEqual(spoofData.enrollment.userId.toString(), studentId.toString());
    assert.notStrictEqual(spoofData.enrollment.userId.toString(), frankId.toString());

    const frankEnrollment = await Enrollment.findOne({ userId: frankId, courseId: secondCourse._id });
    assert.strictEqual(frankEnrollment, null, 'Frank must NOT have been enrolled by another user!');
    console.log('✓ Test K & L Passed: Client-provided userId ignored; identity securely bound to JWT user.\n');
  }

  console.log('========================================');
  console.log('   ALL ENROLLMENT TESTS PASSED 100%     ');
  console.log('========================================');

  await mongoose.disconnect();
}

runEnrollmentTests().catch(async (err) => {
  console.error('\n❌ Enrollment Test Suite Failed:', err.message);
  try { await mongoose.disconnect(); } catch (e) {}
  process.exit(1);
});
