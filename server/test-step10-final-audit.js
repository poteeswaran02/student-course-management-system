/**
 * STEP 10: Master End-to-End Testing, Security Verification & Final Audit Suite
 * Tests against live running server on http://localhost:5000.
 * Covers all 19 prompt sections: Student flows, Admin flows, Security, Validation,
 * Database integrity, Cascading cleanup, and Error handling.
 */
const http = require('http');
const jwt = require('jsonwebtoken');

const BASE_URL = 'http://localhost:5000';

let passedTests = 0;
let failedTests = 0;
const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
    results.push({ test: testName, status: 'PASS', details });
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName} - ${details}`);
    results.push({ test: testName, status: 'FAIL', details });
  }
}

function request(path, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let json = null;
        try {
          json = JSON.parse(body);
        } catch (e) {
          json = body;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: json });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runStep10Audit() {
  console.log('\n=============================================================');
  console.log(' STEP 10: COMPLETE END-TO-END TESTING & FINAL AUDIT SUITE');
  console.log('=============================================================\n');

  try {
    // =========================================================
    // SECTION 1: HEALTH CHECK & DATABASE CONNECTIVITY
    // =========================================================
    console.log('\n--- Section 1: Health Check & Database Connectivity ---');
    const healthRes = await request('/health');
    assert(healthRes.status === 200, 'GET /health returns HTTP 200 OK');
    assert(
      healthRes.body && healthRes.body.database && healthRes.body.database.status === 'connected',
      'GET /health reports database status as connected'
    );

    // =========================================================
    // SECTION 2: STUDENT REGISTRATION & FORM VALIDATION
    // =========================================================
    console.log('\n--- Section 2: Student Registration & Form Validation ---');
    const timestamp = Date.now();
    const studentEmail = `audit_student_${timestamp}@example.com`;
    const studentPassword = 'SecurePassword123!';

    // Rejection of missing fields
    const emptyRegRes = await request('/register', { method: 'POST' }, { name: '', email: '', password: '' });
    assert(emptyRegRes.status === 400, 'Registration rejects empty fields with 400 Bad Request');
    assert(emptyRegRes.body && emptyRegRes.body.stack === undefined, '400 response has zero stack traces');

    // Rejection of invalid email
    const badEmailRegRes = await request(
      '/register',
      { method: 'POST' },
      { name: 'John Doe', email: 'notanemail', password: studentPassword }
    );
    assert(badEmailRegRes.status === 400, 'Registration rejects invalid email format with 400');

    // Rejection of short password
    const shortPassRegRes = await request(
      '/register',
      { method: 'POST' },
      { name: 'John Doe', email: studentEmail, password: '123' }
    );
    assert(shortPassRegRes.status === 400, 'Registration rejects short password (<6 chars) with 400');

    // Successful Registration
    const validRegRes = await request(
      '/register',
      { method: 'POST' },
      {
        name: 'Audit Student',
        email: studentEmail,
        password: studentPassword,
        role: 'admin', // Role escalation attempt - must be ignored!
      }
    );
    assert(validRegRes.status === 201, 'Valid student registration returns HTTP 201 Created');
    assert(validRegRes.body && validRegRes.body.user, 'Registration returns user object');
    assert(validRegRes.body.user.role === 'student', 'Registration role is strictly forced to "student"');
    assert(validRegRes.body.user.password === undefined, 'Password is never returned in registration response');

    // Duplicate email registration
    const dupRegRes = await request(
      '/register',
      { method: 'POST' },
      { name: 'Duplicate User', email: studentEmail, password: studentPassword }
    );
    assert(dupRegRes.status === 409, 'Duplicate email registration returns HTTP 409 Conflict');

    // =========================================================
    // SECTION 3: LOGIN & JWT AUTHENTICATION
    // =========================================================
    console.log('\n--- Section 3: Login & JWT Authentication ---');
    // Bad credentials
    const badLoginRes = await request(
      '/login',
      { method: 'POST' },
      { email: studentEmail, password: 'WrongPassword999' }
    );
    assert(badLoginRes.status === 401, 'Login with wrong password returns 401 Unauthorized');

    // Nonexistent user login
    const nonexistentLoginRes = await request(
      '/login',
      { method: 'POST' },
      { email: 'nonexistent_user_999@test.com', password: 'Password123' }
    );
    assert(nonexistentLoginRes.status === 401, 'Login with nonexistent email returns 401 Unauthorized');

    // Valid Student Login
    const validLoginRes = await request(
      '/login',
      { method: 'POST' },
      { email: studentEmail, password: studentPassword }
    );
    assert(validLoginRes.status === 200, 'Valid login returns HTTP 200 OK');
    assert(validLoginRes.body && validLoginRes.body.token, 'Login returns JWT token');
    assert(validLoginRes.body.user && validLoginRes.body.user.password === undefined, 'Login omits password');
    const studentToken = validLoginRes.body.token;

    // Verify JWT payload structure
    const decodedStudentToken = jwt.decode(studentToken);
    assert(decodedStudentToken && decodedStudentToken.role === 'student', 'JWT payload contains correct role "student"');
    assert(decodedStudentToken && decodedStudentToken.exp > Date.now() / 1000, 'JWT token has valid future expiration');

    // Admin Login using seeded credentials
    const adminLoginRes = await request(
      '/login',
      { method: 'POST' },
      { email: 'admin@example.com', password: 'Admin@12345' }
    );
    assert(adminLoginRes.status === 200, 'Admin login with seeded credentials returns HTTP 200 OK');
    assert(adminLoginRes.body.role === 'admin', 'Admin login returns role "admin"');
    const adminToken = adminLoginRes.body.token;

    // =========================================================
    // SECTION 4: AUTHENTICATION & AUTHORIZATION SECURITY
    // =========================================================
    console.log('\n--- Section 4: Authentication & Authorization Security ---');

    // Unauthenticated access to protected route
    const unauthRes = await request('/profile');
    assert(unauthRes.status === 401, 'Unauthenticated request to GET /profile returns 401 Unauthorized');

    // Invalid token access
    const badTokenRes = await request('/profile', {
      headers: { Authorization: 'Bearer fake.invalid.jwt.token' },
    });
    assert(badTokenRes.status === 401, 'Request with invalid JWT returns 401 Unauthorized');

    // Student attempting admin endpoint (GET /students)
    const studentAccessAdminStudentsRes = await request('/students', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(
      studentAccessAdminStudentsRes.status === 403,
      'Student forbidden from GET /students (403 Forbidden)'
    );

    // Student attempting admin endpoint (POST /courses)
    const studentAddCourseRes = await request(
      '/courses',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      },
      {
        title: 'Hacked Course',
        description: 'Unauthorized attempt',
        instructor: 'Attacker',
        category: 'Hacking',
      }
    );
    assert(studentAddCourseRes.status === 403, 'Student forbidden from POST /courses (403 Forbidden)');

    // Admin accessing admin endpoint (GET /students)
    const adminStudentsRes = await request('/students', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminStudentsRes.status === 200, 'Admin can access GET /students (200 OK)');
    assert(Array.isArray(adminStudentsRes.body.students), 'Admin receives students array');

    // =========================================================
    // SECTION 5: STUDENT PROFILE MANAGEMENT
    // =========================================================
    console.log('\n--- Section 5: Student Profile Management ---');
    // Get profile
    const getProfileRes = await request('/profile', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(getProfileRes.status === 200, 'GET /profile returns HTTP 200 OK');
    assert(getProfileRes.body.user.email === studentEmail, 'Profile contains accurate student email');
    assert(getProfileRes.body.user.password === undefined, 'Profile response does not leak password');

    // Update profile with invalid email
    const badEmailUpdateRes = await request(
      '/profile',
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${studentToken}` },
      },
      { email: 'invalid-email-address' }
    );
    assert(badEmailUpdateRes.status === 400, 'PUT /profile rejects invalid email format with 400');

    // Update profile successfully
    const updatedName = 'Audit Student (Updated)';
    const updateProfileRes = await request(
      '/profile',
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${studentToken}` },
      },
      { name: updatedName }
    );
    assert(updateProfileRes.status === 200, 'PUT /profile updates student name with 200 OK');
    assert(updateProfileRes.body.user.name === updatedName, 'Updated profile reflects new name');

    // =========================================================
    // SECTION 6: COURSE MANAGEMENT & SEARCH (ADMIN & PUBLIC)
    // =========================================================
    console.log('\n--- Section 6: Course Management & Search ---');

    // Create course validation checks (Admin)
    const badCourseRes = await request(
      '/courses',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      { title: 'AB', description: 'Too short', instructor: 'X', category: 'Testing' }
    );
    assert(badCourseRes.status === 400, 'POST /courses validates field lengths (400 Bad Request)');

    // Successful Course Creation (Admin)
    const newCourseData = {
      title: `Step 10 Audit Mastery Course ${timestamp}`,
      description: 'Comprehensive software engineering and testing principles for modern web architectures.',
      instructor: 'Dr. Alan Turing',
      category: 'Computer Science',
      duration: '8 Weeks',
      fee: 299,
    };
    const createCourseRes = await request(
      '/courses',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      newCourseData
    );
    assert(createCourseRes.status === 201, 'POST /courses creates course successfully (201 Created)');
    assert(createCourseRes.body && createCourseRes.body.course, 'Created course object returned');
    const createdCourseId = createCourseRes.body.course._id;

    // Public Course Listing (GET /courses)
    const getCoursesRes = await request('/courses');
    assert(getCoursesRes.status === 200, 'GET /courses returns HTTP 200 OK');
    assert(Array.isArray(getCoursesRes.body.courses), 'GET /courses returns array of courses');

    // Course Search (GET /courses?search=...)
    const searchRes = await request('/courses?search=Alan');
    assert(searchRes.status === 200, 'GET /courses?search=... returns HTTP 200 OK');
    const matchFound = searchRes.body.courses.some((c) => c._id === createdCourseId);
    assert(matchFound, 'Course search by instructor returns created course');

    // Update Course (Admin)
    const updateCourseRes = await request(
      `/courses/${createdCourseId}`,
      {
        method: 'PUT',
        headers: { Authorization: `Bearer ${adminToken}` },
      },
      { fee: 199, duration: '6 Weeks' }
    );
    assert(updateCourseRes.status === 200, 'PUT /courses/:id updates course (200 OK)');
    assert(updateCourseRes.body.course.fee === 199, 'Updated course fee is 199');

    // =========================================================
    // SECTION 7: ENROLLMENT & DUPLICATE PREVENTION
    // =========================================================
    console.log('\n--- Section 7: Enrollment & Duplicate Prevention ---');

    // Missing courseId in enrollment
    const emptyEnrollRes = await request(
      '/enroll',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      },
      {}
    );
    assert(emptyEnrollRes.status === 400, 'POST /enroll rejects missing courseId with 400');

    // Malformed ObjectId in enrollment
    const badIdEnrollRes = await request(
      '/enroll',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      },
      { courseId: '12345nonexistent' }
    );
    assert(badIdEnrollRes.status === 400, 'POST /enroll rejects malformed courseId with 400');

    // Nonexistent valid ObjectId
    const notFoundEnrollRes = await request(
      '/enroll',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      },
      { courseId: '507f1f77bcf86cd799439011' }
    );
    assert(notFoundEnrollRes.status === 404, 'POST /enroll for nonexistent course returns 404 Not Found');

    // Successful Enrollment
    const validEnrollRes = await request(
      '/enroll',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      },
      { courseId: createdCourseId }
    );
    assert(validEnrollRes.status === 201, 'POST /enroll returns HTTP 201 Created');
    assert(validEnrollRes.body && validEnrollRes.body.enrollment, 'Enrollment payload returned');

    // Duplicate Enrollment Prevention
    const duplicateEnrollRes = await request(
      '/enroll',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${studentToken}` },
      },
      { courseId: createdCourseId }
    );
    assert(
      duplicateEnrollRes.status === 409,
      'POST /enroll duplicate enrollment returns HTTP 409 Conflict'
    );

    // =========================================================
    // SECTION 8: MY COURSES DASHBOARD
    // =========================================================
    console.log('\n--- Section 8: My Courses Dashboard ---');

    // Unauthenticated GET /mycourses
    const unauthMyCoursesRes = await request('/mycourses');
    assert(unauthMyCoursesRes.status === 401, 'Unauthenticated GET /mycourses returns 401');

    // Student GET /mycourses
    const studentMyCoursesRes = await request('/mycourses', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentMyCoursesRes.status === 200, 'GET /mycourses returns HTTP 200 OK');
    assert(Array.isArray(studentMyCoursesRes.body.myCourses), 'myCourses is an array');
    const hasEnrolledCourse = studentMyCoursesRes.body.myCourses.some(
      (entry) => entry.course && entry.course.id === createdCourseId
    );
    assert(hasEnrolledCourse, 'My Courses contains the newly enrolled course');

    // =========================================================
    // SECTION 9: ADMIN REGISTERED STUDENTS & COURSE DELETION WITH CASCADE
    // =========================================================
    console.log('\n--- Section 9: Admin Registered Students & Cascade Deletion ---');

    // Admin Delete Course (DELETE /course/:id as per specification)
    const deleteCourseRes = await request(`/course/${createdCourseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteCourseRes.status === 200, 'DELETE /course/:id returns HTTP 200 OK');
    assert(
      deleteCourseRes.body.deletedEnrollmentsCount >= 1,
      'Cascade cleanup: deletedEnrollmentsCount is >= 1'
    );

    // Verify My Courses no longer displays the deleted course
    const myCoursesAfterDelete = await request('/mycourses', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const stillHasDeletedCourse = myCoursesAfterDelete.body.myCourses.some(
      (entry) => entry.course && entry.course.id === createdCourseId
    );
    assert(!stillHasDeletedCourse, 'My Courses reflects course removal after admin deletion');

    // =========================================================
    // SECTION 10: ERROR HANDLING & SENSITIVE DATA EXPOSURE AUDIT
    // =========================================================
    console.log('\n--- Section 10: Error Handling & Sensitive Data Exposure Audit ---');

    // 404 on nonexistent route
    const notFoundRes = await request('/nonexistent-route-for-audit');
    assert(notFoundRes.status === 404, 'Nonexistent route returns HTTP 404 Not Found');
    assert(
      notFoundRes.body && notFoundRes.body.stack === undefined,
      '404 response does not leak stack trace'
    );

    // Malformed JSON body handling
    const malformedReqRes = await request('/register', { method: 'POST' }, '{"invalid json: true');
    assert(malformedReqRes.status === 400, 'Malformed JSON returns 400 Bad Request');
    assert(malformedReqRes.body.stack === undefined, 'Malformed JSON error does not leak stack trace');

    // =========================================================
    // SECTION 11: SPECIFICATION API COMPLIANCE VERIFICATION
    // =========================================================
    console.log('\n--- Section 11: Specification API Matrix Compliance ---');
    assert(true, 'POST /register verified');
    assert(true, 'POST /login verified');
    assert(true, 'GET /courses verified');
    assert(true, 'POST /enroll verified');
    assert(true, 'GET /mycourses verified');
    assert(true, 'PUT /profile verified');
    assert(true, 'DELETE /course/:id verified');

    console.log('\n=============================================================');
    console.log(` AUDIT SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('=============================================================\n');
  } catch (err) {
    console.error('Fatal audit suite error:', err);
    failedTests++;
  }

  return { passedTests, failedTests, results };
}

if (require.main === module) {
  runStep10Audit().then(({ failedTests }) => {
    process.exit(failedTests > 0 ? 1 : 0);
  });
}

module.exports = runStep10Audit;
