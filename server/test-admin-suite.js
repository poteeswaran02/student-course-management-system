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

async function runTests() {
  console.log('====================================================');
  console.log('   STEP 8 AUTOMATED ADMIN FEATURES TEST SUITE');
  console.log('====================================================\n');

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
    const studentEmail = `admin_test_student_${timestamp}@example.com`;
    const studentPassword = 'Password@123';

    // 1. Admin Login
    console.log('--- 1. Admin Authentication ---');
    const adminLoginRes = await request(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { email: 'admin@example.com', password: 'Admin@12345' });

    assert(adminLoginRes.status === 200, 'Admin can login with seeded credentials (HTTP 200)');
    assert(adminLoginRes.data.user && adminLoginRes.data.user.role === 'admin', 'Admin role is returned as "admin"');
    assert(!!adminLoginRes.data.token, 'JWT token returned for admin');
    const adminToken = adminLoginRes.data.token;

    // 2. Register standard Student & Login to get token
    console.log('\n--- 2. Student Authentication for RBAC Testing ---');
    const studentRegRes = await request(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { name: 'RBAC Test Student', email: studentEmail, password: studentPassword });

    assert(studentRegRes.status === 201, 'Student registered successfully (HTTP 201)');

    const studentLoginRes = await request(`${BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { email: studentEmail, password: studentPassword });

    assert(studentLoginRes.status === 200, 'Student logged in successfully (HTTP 200)');
    const studentToken = studentLoginRes.data.token;
    assert(!!studentToken, 'Student received valid JWT token');


    // 3. Role-Based Access Control (RBAC) & Route Protection
    console.log('\n--- 3. Strict RBAC & Route Protection ---');
    // POST /courses without token -> 401
    const noTokenPost = await request(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, { title: 'Unauthorized Course' });
    assert(noTokenPost.status === 401, 'POST /courses without token rejected (HTTP 401)');

    // POST /courses as student -> 403
    const studentPost = await request(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    }, { title: 'Unauthorized Course', description: 'Desc', instructor: 'Prof' });
    assert(studentPost.status === 403, 'POST /courses as student rejected (HTTP 403 Forbidden)');

    // GET /students without token -> 401
    const noTokenStudents = await request(`${BASE_URL}/students`);
    assert(noTokenStudents.status === 401, 'GET /students without token rejected (HTTP 401)');

    // GET /students as student -> 403
    const studentGetStudents = await request(`${BASE_URL}/students`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(studentGetStudents.status === 403, 'GET /students as student rejected (HTTP 403 Forbidden)');

    // 4. Admin Adds a Course (POST /courses)
    console.log('\n--- 4. Admin Add Course (POST /courses) ---');
    const addCourseInvalid = await request(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, { title: '' });
    assert(addCourseInvalid.status === 400, 'Add course with missing fields returns HTTP 400');

    const newCourseData = {
      title: `Full-Stack Cloud Architecture ${timestamp}`,
      description: 'Master enterprise microservices, containers, Kubernetes, and serverless computing.',
      instructor: 'Dr. Sarah Connor',
      category: 'Cloud Computing',
      duration: '8 Weeks',
      fee: 199,
    };
    const addCourseRes = await request(`${BASE_URL}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, newCourseData);

    assert(addCourseRes.status === 201, 'Admin adds course successfully (HTTP 201)');
    assert(addCourseRes.data.course && addCourseRes.data.course.title === newCourseData.title, 'Course title matches input');
    assert(addCourseRes.data.course.fee === 199, 'Course fee saved accurately');
    const createdCourseId = addCourseRes.data.course._id;

    // 5. Admin Updates Course (PUT /course/:id and PUT /courses/:id)
    console.log('\n--- 5. Admin Update Course (PUT) ---');
    // Test PUT /course/:id (singular)
    const updateResSingular = await request(`${BASE_URL}/course/${createdCourseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, { title: `Updated Full-Stack Cloud ${timestamp}`, fee: 249 });
    assert(updateResSingular.status === 200, 'Admin updates course via PUT /course/:id (HTTP 200)');
    assert(updateResSingular.data.course.title.includes('Updated'), 'Updated course title verified');
    assert(updateResSingular.data.course.fee === 249, 'Updated course fee verified');

    // Test PUT /courses/:id (plural)
    const updateResPlural = await request(`${BASE_URL}/courses/${createdCourseId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, { duration: '10 Weeks' });
    assert(updateResPlural.status === 200, 'Admin updates course via PUT /courses/:id (HTTP 200)');
    assert(updateResPlural.data.course.duration === '10 Weeks', 'Updated duration verified');

    // Update non-existent course -> 404
    const fakeId = '660000000000000000000000';
    const updateFakeRes = await request(`${BASE_URL}/course/${fakeId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
    }, { title: 'Fake' });
    assert(updateFakeRes.status === 404, 'Update non-existent course returns HTTP 404');

    // 6. Admin Views Registered Students (GET /students)
    console.log('\n--- 6. Admin View Registered Students (GET /students) ---');
    const getStudentsRes = await request(`${BASE_URL}/students`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(getStudentsRes.status === 200, 'Admin can view registered students (HTTP 200)');
    assert(Array.isArray(getStudentsRes.data.students), 'Students list is returned as an array');
    const studentsList = getStudentsRes.data.students;
    const foundStudent = studentsList.find((s) => s.email === studentEmail);
    assert(!!foundStudent, 'Registered test student found in admin students list');
    const hasPasswordExposed = studentsList.some((s) => s.password !== undefined);
    assert(!hasPasswordExposed, 'Security Check: Passwords NEVER returned in student list');
    const allAreStudents = studentsList.every((s) => s.role === 'student');
    assert(allAreStudents, 'Students list contains only student roles');

    // 7. Student Enrolls and Admin Cascading Delete (DELETE /course/:id)
    console.log('\n--- 7. Course Deletion with Enrollment Cascade Cleanup ---');
    // Student enrolls in the created course
    const enrollRes = await request(`${BASE_URL}/enroll`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`,
      },
    }, { courseId: createdCourseId });
    assert(enrollRes.status === 201, 'Student enrolled in course before deletion test (HTTP 201)');

    // Verify student has 1 course in /mycourses
    const myCoursesBefore = await request(`${BASE_URL}/mycourses`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    assert(myCoursesBefore.status === 200 && myCoursesBefore.data.count >= 1, 'Course confirmed in student mycourses');

    // Admin deletes course via DELETE /course/:id
    const deleteRes = await request(`${BASE_URL}/course/${createdCourseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteRes.status === 200, 'Admin deletes course via DELETE /course/:id (HTTP 200)');
    assert(deleteRes.data.deletedEnrollmentsCount >= 1, 'Cascade cleanup removed associated enrollment record');

    // Verify course is gone from GET /courses
    const coursesAfter = await request(`${BASE_URL}/courses`);
    const stillExists = coursesAfter.data.courses.some((c) => c._id === createdCourseId);
    assert(!stillExists, 'Deleted course no longer exists in course catalog');

    // Verify student's /mycourses no longer has this course
    const myCoursesAfter = await request(`${BASE_URL}/mycourses`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const orphanExists = (myCoursesAfter.data.enrollments || []).some((e) => e.course && e.course._id === createdCourseId);
    assert(!orphanExists, 'No orphan enrollment remaining in student dashboard');
    assert(myCoursesAfter.data.count === 0, 'Student enrolled courses count is now 0');


    // Attempt to delete non-existent course -> 404
    const deleteAgain = await request(`${BASE_URL}/course/${createdCourseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(deleteAgain.status === 404, 'Deleting already-deleted course returns HTTP 404');

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');
    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error('Test suite error:', err);
    process.exitCode = 1;
  }
}

runTests();
