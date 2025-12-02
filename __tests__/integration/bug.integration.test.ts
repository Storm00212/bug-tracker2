import request from 'supertest';
import app from '../../src/index';

describe('Bug Routes Integration Tests', () => {
  let authToken: string;
  let userId: number;
  let projectId: number;
  let bugId: number;

  beforeAll(async () => {
    // Register and login user with unique email
    const uniqueEmail = `bugtest${Date.now()}@example.com`;
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send({
        username: 'bugtester',
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

    // Create a project
    const projectResponse = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        ProjectName: 'Test Project',
        description: 'A project for testing bugs'
      });
    projectId = projectResponse.body.project.ProjectID;
  });

  it('should get all bugs', async () => {
    const response = await request(app)
      .get('/api/bugs')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bugs');
    expect(Array.isArray(response.body.bugs)).toBe(true);
  });

  it('should create a new bug', async () => {
    const response = await request(app)
      .post('/api/bugs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        Title: 'Test Bug',
        Description: 'This is a test bug',
        Status: 'Open',
        Priority: 'High',
        ProjectID: projectId,
        ReportedBy: userId
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Bug created successfully');
    expect(response.body).toHaveProperty('bug');
    bugId = response.body.bug.BugID;
  });

  it('should get bug by id', async () => {
    const response = await request(app)
      .get(`/api/bugs/${bugId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bug');
    expect(response.body.bug.BugID).toBe(bugId);
  });

  it('should get bugs by project', async () => {
    const response = await request(app)
      .get(`/api/bugs/project/${projectId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bugs');
    expect(Array.isArray(response.body.bugs)).toBe(true);
  });

  it('should get bugs by assignee', async () => {
    const response = await request(app)
      .get(`/api/bugs/assignee/${userId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bugs');
    expect(Array.isArray(response.body.bugs)).toBe(true);
  });

  it('should get bugs by reporter', async () => {
    const response = await request(app)
      .get(`/api/bugs/reporter/${userId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bugs');
    expect(Array.isArray(response.body.bugs)).toBe(true);
  });

  it('should get bugs by status', async () => {
    const response = await request(app)
      .get('/api/bugs/status/Open')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('bugs');
    expect(Array.isArray(response.body.bugs)).toBe(true);
  });

  it('should update bug', async () => {
    const response = await request(app)
      .put(`/api/bugs/${bugId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        Status: 'In Progress',
        Priority: 'Medium'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Bug updated successfully');
    expect(response.body).toHaveProperty('bug');
  });

  it('should delete bug', async () => {
    const response = await request(app)
      .delete(`/api/bugs/${bugId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Bug deleted successfully');
  });
});