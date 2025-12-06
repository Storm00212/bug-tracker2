import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '30s', target: 50 },
    { duration: '30s', target: 100 },
    { duration: '30s', target: 150 },
    { duration: '30s', target: 200 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.5'], // Allow up to 50% failure rate
  },
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Breakpoint test - ramp up load
  const uniqueEmail = `breakpoint${__VU}${Date.now()}@example.com`;

  // Register
  let registerResponse = http.post(`${BASE_URL}/api/users/register`, JSON.stringify({
    username: `breakpointuser${__VU}`,
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

  // Get users
  let usersResponse = http.get(`${BASE_URL}/api/users`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  check(usersResponse, {
    'get users status is 200': (r) => r.status === 200,
  });

  // Create project
  let projectResponse = http.post(`${BASE_URL}/api/projects`, JSON.stringify({
    ProjectName: `Breakpoint Project ${__VU}`,
    description: 'Breakpoint test project'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  check(projectResponse, {
    'create project status is 201': (r) => r.status === 201,
  });

  sleep(0.5);
}