import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 100,
  duration: '5m',
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Stress test with high load
  const uniqueEmail = `stress${__VU}${Date.now()}@example.com`;

  // Register
  let registerResponse = http.post(`${BASE_URL}/api/users/register`, JSON.stringify({
    username: `stressuser${__VU}`,
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
    ProjectName: `Stress Project ${__VU}`,
    description: 'Stress test project'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  check(projectResponse, {
    'create project status is 201': (r) => r.status === 201,
  });

  // Get projects
  let projectsResponse = http.get(`${BASE_URL}/api/projects`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  check(projectsResponse, {
    'get projects status is 200': (r) => r.status === 200,
  });

  // Simulate some delay
  sleep(0.5);
}