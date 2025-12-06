import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  vus: 15,
  duration: '2m',
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Simulate typical user behavior
  const uniqueEmail = `avgload${__VU}${Date.now()}@example.com`;

  // Register
  let registerResponse = http.post(`${BASE_URL}/api/users/register`, JSON.stringify({
    username: `user${__VU}`,
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

  // Get profile
  let profileResponse = http.get(`${BASE_URL}/api/users/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  check(profileResponse, {
    'get profile status is 200': (r) => r.status === 200,
  });

  // Create project
  let projectResponse = http.post(`${BASE_URL}/api/projects`, JSON.stringify({
    ProjectName: `Project ${__VU}`,
    description: 'Test project'
  }), {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  });
  check(projectResponse, {
    'create project status is 201': (r) => r.status === 201,
  });

  const projectId = projectResponse.json().project.ProjectID;

  // Get projects
  let projectsResponse = http.get(`${BASE_URL}/api/projects`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  check(projectsResponse, {
    'get projects status is 200': (r) => r.status === 200,
  });

  // Simulate some delay
  sleep(1);
}