const assert = require('assert');

const BASE_URL = 'http://localhost:5000';

async function runProfileTests() {
  console.log('========================================');
  console.log('    STARTING PROFILE TEST SUITE         ');
  console.log('========================================\n');

  // Register two users to test duplicate email collision
  const timestamp = Date.now();
  const user1 = {
    name: 'Bob Initial',
    email: `bob_${timestamp}@example.com`,
    password: 'password12345!',
  };
  const user2 = {
    name: 'Charlie Student',
    email: `charlie_${timestamp}@example.com`,
    password: 'password12345!',
  };

  // Register user 1
  const reg1Res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user1),
  });
  assert.strictEqual(reg1Res.status, 201);

  // Register user 2
  const reg2Res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(user2),
  });
  assert.strictEqual(reg2Res.status, 201);

  // ----------------------------------------------------
  // Test A: Login with an existing student account
  // ----------------------------------------------------
  console.log('Test A: Logging in with existing student account...');
  const loginRes = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: user1.email, password: user1.password }),
  });
  const loginData = await loginRes.json();
  assert.strictEqual(loginRes.status, 200);
  assert(loginData.token, 'Must return JWT token');
  const token = loginData.token;
  console.log('✓ Test A Passed: Logged in and received JWT token.\n');

  // ----------------------------------------------------
  // Test B: Access protected profile endpoint with valid JWT
  // ----------------------------------------------------
  console.log('Test B: Accessing GET /profile with valid JWT...');
  const getProfRes = await fetch(`${BASE_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const getProfData = await getProfRes.json();
  assert.strictEqual(getProfRes.status, 200);
  assert.strictEqual(getProfData.success, true);
  assert.strictEqual(getProfData.user.name, user1.name);
  assert.strictEqual(getProfData.user.email, user1.email);
  assert.strictEqual(getProfData.user.role, 'student');
  assert.strictEqual(getProfData.user.password, undefined);
  console.log('✓ Test B Passed: GET /profile successfully returned authenticated student profile.\n');

  // ----------------------------------------------------
  // Test C: Update the student's name
  // ----------------------------------------------------
  console.log("Test C: Updating student's name via PUT /profile...");
  const updateNameRes = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: 'Bob Updated Name' }),
  });
  const updateNameData = await updateNameRes.json();
  assert.strictEqual(updateNameRes.status, 200);
  assert.strictEqual(updateNameData.user.name, 'Bob Updated Name');
  assert.strictEqual(updateNameData.user.email, user1.email);
  console.log("✓ Test C Passed: Student's name updated successfully.\n");

  // ----------------------------------------------------
  // Test D: Update the student's email
  // ----------------------------------------------------
  console.log("Test D: Updating student's email via PUT /profile...");
  const newEmail = `bob_new_${timestamp}@example.com`;
  const updateEmailRes = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email: newEmail }),
  });
  const updateEmailData = await updateEmailRes.json();
  assert.strictEqual(updateEmailRes.status, 200);
  assert.strictEqual(updateEmailData.user.email, newEmail);
  console.log("✓ Test D Passed: Student's email updated successfully.\n");

  // ----------------------------------------------------
  // Test E: Try using a duplicate email (user2's email)
  // ----------------------------------------------------
  console.log('Test E: Attempting to update to an already taken email...');
  const dupEmailRes = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email: user2.email }),
  });
  const dupEmailData = await dupEmailRes.json();
  assert.strictEqual(dupEmailRes.status, 409, `Expected 409, got ${dupEmailRes.status}`);
  assert.strictEqual(dupEmailData.success, false);
  assert(dupEmailData.message.includes('already in use'));
  console.log('✓ Test E Passed: Duplicate email collision rejected with 409 Conflict.\n');

  // ----------------------------------------------------
  // Test F: Try accessing profile without JWT
  // ----------------------------------------------------
  console.log('Test F: Attempting to access profile without JWT...');
  const noTokenGet = await fetch(`${BASE_URL}/profile`);
  assert.strictEqual(noTokenGet.status, 401);
  const noTokenPut = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Hacker' }),
  });
  assert.strictEqual(noTokenPut.status, 401);
  console.log('✓ Test F Passed: Unauthenticated GET and PUT requests rejected with 401.\n');

  // ----------------------------------------------------
  // Test G: Try changing role through profile request
  // ----------------------------------------------------
  console.log('Test G: Attempting privilege escalation (role: "admin") via PUT /profile...');
  const roleAttemptRes = await fetch(`${BASE_URL}/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name: 'Bob Secured Name', role: 'admin', password: 'newHackedPassword' }),
  });
  const roleAttemptData = await roleAttemptRes.json();
  assert.strictEqual(roleAttemptRes.status, 200);
  assert.strictEqual(roleAttemptData.user.name, 'Bob Secured Name');
  assert.strictEqual(roleAttemptData.user.role, 'student', 'Role MUST remain student!');
  console.log('✓ Test G Passed: Role alteration ignored; user role remains "student".\n');

  // ----------------------------------------------------
  // Test H: Verify password is never returned
  // ----------------------------------------------------
  console.log('Test H: Verifying password field is omitted in all profile responses...');
  const responses = [getProfData, updateNameData, updateEmailData, roleAttemptData];
  for (const resp of responses) {
    const raw = JSON.stringify(resp);
    assert(!raw.includes('password12345!'), 'Plain-text password leaked!');
    assert(!raw.includes('$2a$'), 'Hashed password leaked!');
    assert.strictEqual(resp.user.password, undefined);
  }
  console.log('✓ Test H Passed: Password strictly omitted from all profile responses.\n');

  console.log('========================================');
  console.log('    ALL PROFILE TESTS PASSED 100%       ');
  console.log('========================================');
}

runProfileTests().catch((err) => {
  console.error('\n❌ Profile Test Suite Failed:', err.message);
  process.exit(1);
});
