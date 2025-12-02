import request from 'supertest';
import app from '../../src/index';

describe('Project Routes Integration Tests', () => {
  let authToken: string;
  let userId: number;
  let projectId: number;

  beforeAll(async () => {
    // Register and login user with unique email
    const uniqueEmail = `projecttest${Date.now()}@example.com`;
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send({
        username: 'projecttester',
        email: uniqueEmail,
        password: 'password123',
        role: 'user'
      });
    userId = registerResponse.body.user.UserID;

    const loginResponse = await request(app)
      .post('/api/users/login')
      .send({
        email: uniqueEmail,
        password: 'password123'
      });
    authToken = loginResponse.body.token;
  });

  it('should get all projects', async () => {
    const response = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('projects');
    expect(Array.isArray(response.body.projects)).toBe(true);
  });

  it('should create a new project', async () => {
    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ProjectName: 'Test Project',
        description: 'A project for testing'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Project created successfully');
    expect(response.body).toHaveProperty('project');
    projectId = response.body.project.ProjectID;
  });

  it('should get project by id', async () => {
    const response = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('project');
    expect(response.body.project.ProjectID).toBe(projectId);
  });

  it('should get projects by creator', async () => {
    const response = await request(app)
      .get(`/api/projects/creator/${userId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('projects');
    expect(Array.isArray(response.body.projects)).toBe(true);
  });

  it('should update project', async () => {
    const response = await request(app)
      .put(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ProjectName: 'Updated Test Project',
        description: 'Updated description'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Project updated successfully');
    expect(response.body).toHaveProperty('project');
  });

  it('should delete project', async () => {
    const response = await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Project deleted successfully');
  });
});