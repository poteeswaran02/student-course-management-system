const http = require('http');

function request(url, options = {}, data = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = http.request(reqOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, headers: res.headers, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

const BASE_URL = 'http://localhost:5000';

async function runStep9Tests() {
  console.log('================================================================');
  console.log('       STEP 9 COMPREHENSIVE VERIFICATION TEST SUITE (A - AG)    ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(cond, desc) {
    if (cond) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc}`);
      failed++;
    }
  }

  try {
    const timestamp = Date.now();
    const studentEmail = `step9_student_${timestamp}@example.com`;
    const studentPassword = 'Password@123';

    // AF. GET /health & AE. MongoDB Connection
    console.log('--- Criteria AF & AE: Health and Database Connectivity ---');
    const healthRes = await request(`${BASE_URL}/health`);
    assert(healthRes.status === 200, 'AF: GET /health returns HTTP 200 OK');
    assert(healthRes.data.database && healthRes.data.database.status === 'connected', 'AE: MongoDB status is connected');

    // A. Registration
    console.log('\n--- Criteria A: Registration ---');
    const regRes = await request(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { name: 'Step Nine Student', email: studentEmail, password: studentPassword });
    assert(regRes.status === 201, 'A: Student registered successfully (HTTP 201)');
    assert(regRes.data.user && regRes.data.user.role === 'student', 'A: Default role is strictly student');

    // B. Login & C. JWT Authentication
    console.log('\n--- Criteria B & C: Login & JWT Authentication ---');
    const loginRes = await request(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { email: studentEmail, password: studentPassword });
    assert(loginRes.status === 200, 'B: Student logged in successfully (HTTP 200)');
    assert(!!loginRes.data.token, 'C: Valid signed JWT token issued on login');
    const studentToken = loginRes.data.token;

    // D. Profile Management (GET & PUT)
    console.log('\n--- Criteria D: Profile Management ---');
    const getProfRes = await request(`${BASE_URL}/profile`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(getProfRes.status === 200, 'D: Authenticated GET /profile succeeds (HTTP 200)');
    assert(getProfRes.data.user.email === studentEmail, 'D: Returned profile matches logged in student');

    const updateProfRes = await request(`${BASE_URL}/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    }, { name: 'Step Nine Updated Student' });
    assert(updateProfRes.status === 200, 'D: PUT /profile updates name successfully (HTTP 200)');
    assert(updateProfRes.data.user.name === 'Step Nine Updated Student', 'D: Updated name verified');

    // K. Admin Login & L. Admin Authorization
    console.log('\n--- Criteria K & L: Admin Login & Role Authorization ---');
    const adminLoginRes = await request(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { email: 'admin@example.com', password: 'Admin@12345' });
    assert(adminLoginRes.status === 200, 'K: Admin logged in successfully with seeded credentials (HTTP 200)');
    assert(adminLoginRes.data.user && adminLoginRes.data.user.role === 'admin', 'K: User role confirmed as "admin"');
    const adminToken = adminLoginRes.data.token;
    assert(!!adminToken, 'L: Admin received valid JWT token');

    // M. Add Course
    console.log('\n--- Criteria M: Add Course ---');
    const courseTitle = `Verification Course ${timestamp}`;
    const addCourseRes = await request(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, {
      title: courseTitle,
      description: 'Comprehensive curriculum for validating search, enrollment, error handling and polish.',
      instructor: 'Prof. Ada Lovelace',
      category: 'Software Engineering',
      duration: '10 Weeks',
      fee: 250,
    });
    assert(addCourseRes.status === 201, 'M: Admin adds course successfully (HTTP 201)');
    assert(addCourseRes.data.course && addCourseRes.data.course.fee === 250, 'M: Course fee recorded accurately');
    const testCourseId = addCourseRes.data.course._id;

    // F. GET /courses & G. Course Search
    console.log('\n--- Criteria F & G: Available Courses & Course Search ---');
    const allCoursesRes = await request(`${BASE_URL}/courses`);
    assert(allCoursesRes.status === 200 && Array.isArray(allCoursesRes.data.courses), 'F: GET /courses returns course catalog array');

    // Search by title
    const searchTitleRes = await request(`${BASE_URL}/courses?search=${encodeURIComponent(courseTitle)}`);
    assert(searchTitleRes.data.courses.some((c) => c._id === testCourseId), 'G: Course found by title search');

    // Search case-insensitivity
    const searchCaseRes = await request(`${BASE_URL}/courses?search=lOvElAcE`);
    assert(searchCaseRes.data.courses.some((c) => c._id === testCourseId), 'G: Case-insensitive instructor search works');

    // Search by category
    const searchCatRes = await request(`${BASE_URL}/courses?search=Engineering`);
    assert(searchCatRes.data.courses.some((c) => c._id === testCourseId), 'G: Category search works');

    // Non-matching search returns clean empty array []
    const searchEmptyRes = await request(`${BASE_URL}/courses?search=unmatched_query_xyz_12345`);
    assert(searchEmptyRes.status === 200 && searchEmptyRes.data.courses.length === 0, 'G: Non-matching search returns empty array cleanly');

    // H. Enrollment & I. Duplicate Enrollment Rejection
    console.log('\n--- Criteria H & I: Enrollment & Duplicate Prevention ---');
    const enrollRes = await request(`${BASE_URL}/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    }, { courseId: testCourseId });
    assert(enrollRes.status === 201, 'H: Student enrolled in course successfully (HTTP 201)');

    const dupEnrollRes = await request(`${BASE_URL}/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    }, { courseId: testCourseId });
    assert(dupEnrollRes.status === 409, 'I: Duplicate enrollment cleanly rejected with HTTP 409 Conflict');

    // J. My Courses Dashboard
    console.log('\n--- Criteria J: My Courses Dashboard ---');
    const myCoursesRes = await request(`${BASE_URL}/mycourses`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(myCoursesRes.status === 200, 'J: GET /mycourses succeeds (HTTP 200)');
    assert(myCoursesRes.data.myCourses.some((e) => e.course && e.course.id === testCourseId), 'J: Enrolled course present in student dashboard');
    assert(myCoursesRes.data.myCourses[0].course.fee !== undefined, 'J: Course fee included in populated enrolled course');

    // N. Update Course
    console.log('\n--- Criteria N: Update Course ---');
    const updateCourseRes = await request(`${BASE_URL}/course/${testCourseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, { title: `${courseTitle} - Updated`, fee: 299 });
    assert(updateCourseRes.status === 200, 'N: Admin updates course via PUT /course/:id (HTTP 200)');
    assert(updateCourseRes.data.course.fee === 299, 'N: Updated course fee verified');

    // P. Registered Students
    console.log('\n--- Criteria P: View Registered Students ---');
    const studentsRes = await request(`${BASE_URL}/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(studentsRes.status === 200, 'P: Admin retrieves registered students (HTTP 200)');
    assert(Array.isArray(studentsRes.data.students), 'P: Students returned as array');
    const studentCheck = studentsRes.data.students.find((s) => s.email === studentEmail);
    assert(!!studentCheck, 'P: Newly registered student found in directory');
    const passwordExposed = studentsRes.data.students.some((s) => s.password !== undefined);
    assert(!passwordExposed, 'P: Passwords NEVER returned in students response');

    // Q. Student cannot access admin APIs
    console.log('\n--- Criteria Q: Student Forbidden from Admin APIs ---');
    const studentAddRes = await request(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    }, { title: 'Unauthorized Course', description: 'Desc', instructor: 'Ins' });
    assert(studentAddRes.status === 403, 'Q: Student POST /courses rejected with HTTP 403 Forbidden');

    const studentGetStudentsRes = await request(`${BASE_URL}/students`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentGetStudentsRes.status === 403, 'Q: Student GET /students rejected with HTTP 403 Forbidden');

    // R. Invalid input handling
    console.log('\n--- Criteria R: Input Validation ---');
    const shortTitleRes = await request(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, { title: 'AB', description: 'Description that is long enough', instructor: 'Instructor' });
    assert(shortTitleRes.status === 400, 'R: Short course title (<3) rejected with HTTP 400');

    const negFeeRes = await request(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, { title: 'Valid Course Title', description: 'Description that is long enough', instructor: 'Instructor', fee: -50 });
    assert(negFeeRes.status === 400, 'R: Negative course fee rejected with HTTP 400');

    // S. 401 Unauthorized handling
    console.log('\n--- Criteria S: 401 Unauthorized Handling ---');
    const noTokenRes = await request(`${BASE_URL}/mycourses`);
    assert(noTokenRes.status === 401, 'S: Request without token returns HTTP 401');

    const badTokenRes = await request(`${BASE_URL}/mycourses`, {
      headers: { Authorization: 'Bearer this_is_an_invalid_token' },
    });
    assert(badTokenRes.status === 401, 'S: Request with invalid token returns HTTP 401');

    // T. 403 Forbidden handling
    console.log('\n--- Criteria T: 403 Forbidden Handling ---');
    const studentDelRes = await request(`${BASE_URL}/course/${testCourseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentDelRes.status === 403, 'T: Student delete attempt returns HTTP 403 Forbidden');

    // U. 404 Not Found handling
    console.log('\n--- Criteria U: 404 Not Found Handling ---');
    const missingRouteRes = await request(`${BASE_URL}/api/non_existent_route_404`);
    assert(missingRouteRes.status === 404, 'U: Non-existent route returns HTTP 404 Not Found');

    const fakeCourseId = '660000000000000000000000';
    const missingCourseRes = await request(`${BASE_URL}/course/${fakeCourseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(missingCourseRes.status === 404, 'U: Deleting non-existent course returns HTTP 404 Not Found');

    // V. 409 Conflict handling
    console.log('\n--- Criteria V: 409 Conflict Handling ---');
    const dupRegRes = await request(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { name: 'Duplicate', email: studentEmail, password: 'Password@123' });
    assert(dupRegRes.status === 409, 'V: Duplicate email registration returns HTTP 409 Conflict');

    // W. 500 Sanitization (Zero stack traces / internal secrets leakage)
    console.log('\n--- Criteria W: Error Response Sanitization ---');
    assert(missingRouteRes.data.stack === undefined, 'W: Error response strictly omits stack traces');
    assert(noTokenRes.data.stack === undefined, 'W: Auth error response strictly omits stack traces');
    assert(!JSON.stringify(shortTitleRes.data).includes('password'), 'W: No sensitive password keywords in error payload');

    // O. Delete Course & Cascade Enrollment Cleanup
    console.log('\n--- Criteria O: Course Deletion & Cascade Cleanup ---');
    const deleteCourseRes = await request(`${BASE_URL}/course/${testCourseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteCourseRes.status === 200, 'O: Admin deletes course via DELETE /course/:id (HTTP 200)');
    assert(deleteCourseRes.data.deletedEnrollmentsCount >= 1, 'O: Cascade cleanup deleted associated enrollment');

    const myCoursesAfterDel = await request(`${BASE_URL}/mycourses`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const hasOrphan = (myCoursesAfterDel.data.myCourses || []).some((e) => e.course && e.course.id === testCourseId);
    assert(!hasOrphan, 'O: Deleted course cleanly removed from student dashboard (no orphan records)');

    console.log('\n================================================================');
    console.log(`STEP 9 TEST MATRIX RESULT: ${passed} Passed, ${failed} Failed`);
    console.log('================================================================');

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test error:', err);
    process.exitCode = 1;
  }
}

runStep9Tests();
