import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 1,
  duration: '10s',
};

const BASE_URL = 'http://localhost:3000';

export default function () {
  // Test root endpoint
  let response = http.get(`${BASE_URL}/`);
  check(response, {
    'root status is 200': (r) => r.status === 200,
  });

  // Register a test user
  const uniqueEmail = `smoke${Date.now()}@example.com`;
  let registerResponse = http.post(`${BASE_URL}/api/users/register`, JSON.stringify({
    username: 'smoketest',
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

  // Test get all users
  let usersResponse = http.get(`${BASE_URL}/api/users`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  check(usersResponse, {
    'get users status is 200': (r) => r.status === 200,
  });

  // Test get profile
  let profileResponse = http.get(`${BASE_URL}/api/users/profile`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  check(profileResponse, {
    'get profile status is 200': (r) => r.status === 200,
  });
}