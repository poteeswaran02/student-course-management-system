const assert = require('assert');

const BASE_URL = 'http://localhost:5000';

async function runAuthTests() {
  console.log('========================================');
  console.log('  STARTING AUTHENTICATION TEST SUITE    ');
  console.log('========================================\n');

  const testStudent = {
    name: 'Alice Smith',
    email: `alice_${Date.now()}@example.com`,
    password: 'securePassword123!',
  };

  let studentToken = null;

  // ----------------------------------------------------
  // Test A: Register a new student
  // ----------------------------------------------------
  console.log('Test A: Registering a new student...');
  const regRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testStudent),
  });
  const regData = await regRes.json();

  assert.strictEqual(regRes.status, 201, `Expected 201 Created, got ${regRes.status}: ${JSON.stringify(regData)}`);
  assert.strictEqual(regData.success, true, 'Registration success should be true');
  assert(regData.user, 'Registration should return user object');
  assert.strictEqual(regData.user.name, testStudent.name);
  assert.strictEqual(regData.user.email, testStudent.email.toLowerCase());
  assert.strictEqual(regData.user.role, 'student', 'Role must default to student');
  assert.strictEqual(regData.user.password, undefined, 'Password must never be returned in registration');
  assert.strictEqual(regData.password, undefined, 'Password must never be returned at top level');
  console.log('✓ Test A Passed: Student registered successfully with role "student" and no password leakage.\n');

  // ----------------------------------------------------
  // Test B: Try registering the same email again
  // ----------------------------------------------------
  console.log('Test B: Attempting to register duplicate email...');
  const dupRes = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testStudent),
  });
  const dupData = await dupRes.json();

  assert.strictEqual(dupRes.status, 409, `Expected 409 Conflict, got ${dupRes.status}`);
  assert.strictEqual(dupData.success, false);
  assert(dupData.message.includes('already registered'), `Expected duplicate message, got: ${dupData.message}`);
  console.log('✓ Test B Passed: Duplicate email registration blocked cleanly with 409 Conflict.\n');

  // ----------------------------------------------------
  // Test C: Login with correct password
  // ----------------------------------------------------
  console.log('Test C: Logging in with correct credentials...');
  const loginRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testStudent.email,
      password: testStudent.password,
    }),
  });
  const loginData = await loginRes.json();

  assert.strictEqual(loginRes.status, 200, `Expected 200 OK, got ${loginRes.status}: ${JSON.stringify(loginData)}`);
  assert.strictEqual(loginData.success, true);
  assert(loginData.token, 'Login should return JWT token');
  assert.strictEqual(loginData.role, 'student');
  assert(loginData.user, 'Login should return user object');
  assert.strictEqual(loginData.user.password, undefined, 'Password must never be returned on login');
  studentToken = loginData.token;
  console.log('✓ Test C Passed: Successful login returned valid JWT and safe user object.\n');

  // ----------------------------------------------------
  // Test D: Login with incorrect password
  // ----------------------------------------------------
  console.log('Test D: Attempting login with incorrect password...');
  const badLoginRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testStudent.email,
      password: 'WrongPassword999!',
    }),
  });
  const badLoginData = await badLoginRes.json();

  assert.strictEqual(badLoginRes.status, 401, `Expected 401 Unauthorized, got ${badLoginRes.status}`);
  assert.strictEqual(badLoginData.success, false);
  assert(badLoginData.message.includes('Invalid email or password'));
  console.log('✓ Test D Passed: Incorrect password correctly rejected with 401 Unauthorized.\n');

  // ----------------------------------------------------
  // Test E: Verify valid JWT on protected endpoint
  // ----------------------------------------------------
  console.log('Test E: Verifying valid JWT token on protected /me route...');
  const meRes = await fetch(`${BASE_URL}/me`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${studentToken}`,
    },
  });
  const meData = await meRes.json();

  assert.strictEqual(meRes.status, 200, `Expected 200 OK, got ${meRes.status}`);
  assert.strictEqual(meData.success, true);
  assert.strictEqual(meData.user.email, testStudent.email.toLowerCase());
  assert.strictEqual(meData.user.role, 'student');
  assert.strictEqual(meData.user.password, undefined, 'Password must not be in protected profile');
  console.log('✓ Test E Passed: Valid JWT authenticated successfully; profile retrieved.\n');

  // ----------------------------------------------------
  // Test F: Verify invalid JWT is rejected
  // ----------------------------------------------------
  console.log('Test F: Testing rejected invalid JWT token...');
  const invalidTokenRes = await fetch(`${BASE_URL}/me`, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer this.is.an.invalid.jwt.token',
    },
  });
  const invalidTokenData = await invalidTokenRes.json();

  assert.strictEqual(invalidTokenRes.status, 401, `Expected 401, got ${invalidTokenRes.status}`);
  assert.strictEqual(invalidTokenData.success, false);
  assert(invalidTokenData.message.includes('Invalid token'));
  console.log('✓ Test F Passed: Invalid JWT token rejected with 401 Unauthorized.\n');

  // ----------------------------------------------------
  // Test G: Verify missing JWT is rejected
  // ----------------------------------------------------
  console.log('Test G: Testing rejected missing JWT token...');
  const noTokenRes = await fetch(`${BASE_URL}/me`, {
    method: 'GET',
  });
  const noTokenData = await noTokenRes.json();

  assert.strictEqual(noTokenRes.status, 401, `Expected 401, got ${noTokenRes.status}`);
  assert.strictEqual(noTokenData.success, false);
  assert(noTokenData.message.includes('No token provided'));
  console.log('✓ Test G Passed: Missing JWT token rejected with 401 Unauthorized.\n');

  // ----------------------------------------------------
  // Test H: Verify password never returned across any response
  // ----------------------------------------------------
  console.log('Test H: Verifying password field is omitted in all API responses...');
  const allResponses = [regData, loginData, meData];
  for (const resp of allResponses) {
    const rawString = JSON.stringify(resp);
    assert(!rawString.includes(testStudent.password), 'Plain-text password found in JSON response!');
    assert(!rawString.includes('$2a$'), 'Bcrypt hash found in JSON response!');
  }
  console.log('✓ Test H Passed: Password (plain-text and hash) is strictly never returned in any response.\n');

  // ----------------------------------------------------
  // Test I: Role Authorization (student trying to access admin endpoint)
  // ----------------------------------------------------
  console.log('Test I: Verifying role authorization (student blocked from admin route)...');
  const adminTestRes = await fetch(`${BASE_URL}/admin-test`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${studentToken}`,
    },
  });
  const adminTestData = await adminTestRes.json();

  assert.strictEqual(adminTestRes.status, 403, `Expected 403 Forbidden, got ${adminTestRes.status}`);
  assert.strictEqual(adminTestData.success, false);
  assert(adminTestData.message.includes('Forbidden') || adminTestData.message.includes('not authorized'));
  console.log('✓ Test I Passed: Student role blocked from admin-only route with 403 Forbidden.\n');

  // ----------------------------------------------------
  // Test J: Verify health check is still 200 OK
  // ----------------------------------------------------
  console.log('Test J: Verifying GET /health endpoint...');
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthData = await healthRes.json();
  assert.strictEqual(healthRes.status, 200);
  assert.strictEqual(healthData.status, 'ok');
  assert.strictEqual(healthData.database.status, 'connected');
  console.log('✓ Test J Passed: GET /health returns 200 OK and database status is connected.\n');

  console.log('========================================');
  console.log('  ALL AUTHENTICATION TESTS PASSED 100%  ');
  console.log('========================================');
}

runAuthTests().catch((err) => {
  console.error('\n❌ Test Suite Failed:', err.message);
  process.exit(1);
});
