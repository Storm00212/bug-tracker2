import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 10,
  duration: '10m', // Extended period for soak test
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Soak test for stability
  const uniqueEmail = `soak${__VU}${Date.now()}@example.com`;

  // Register
  let registerResponse = http.post(`${BASE_URL}/api/users/register`, JSON.stringify({
    username: `soakuser${__VU}`,
    email: uniqueEmail,
    password: 'password123',
    role: 'user'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(registerResponse, {
    'register status is 201': (r) => r.status === 201,
  });

  // Login
  let loginResponse = http.post(`${BASE_URL}/api/users/login`, JSON.stringify({
    email: uniqueEmail,
    password: 'password123'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
  check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
  });

  const token = loginResponse.json().token;

  // Repeated operations
  for (let i = 0; i < 5; i++) {
    // Get users
    let usersResponse = http.get(`${BASE_URL}/api/users`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    check(usersResponse, {
      'get users status is 200': (r) => r.status === 200,
    });

    // Get profile
    let profileResponse = http.get(`${BASE_URL}/api/users/profile`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    check(profileResponse, {
      'get profile status is 200': (r) => r.status === 200,
    });

    sleep(1);
  }
}