import request from 'supertest';
import app from '../../src/index';

describe('Comment Routes Integration Tests', () => {
  let authToken: string;
  let userId: number;
  let projectId: number;
  let bugId: number;
  let commentId: number;

  beforeAll(async () => {
    // Register and login user with unique email
    const uniqueEmail = `commenttest${Date.now()}@example.com`;
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send({
        username: 'commenttester',
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
        ProjectName: 'Test Project for Comments',
        description: 'A project for testing comments'
      });
    projectId = projectResponse.body.project.ProjectID;

    // Create a bug
    const bugResponse = await request(app)
      .post('/api/bugs')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        Title: 'Test Bug for Comments',
        Description: 'This is a test bug for comments',
        Status: 'Open',
        Priority: 'High',
        ProjectID: projectId,
        ReportedBy: userId
      });
    bugId = bugResponse.body.bug.BugID;
  });

  it('should get all comments', async () => {
    const response = await request(app)
      .get('/api/comments')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('comments');
    expect(Array.isArray(response.body.comments)).toBe(true);
  });

  it('should create a new comment', async () => {
    const response = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        BugID: bugId,
        CommentText: 'This is a test comment'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Comment created successfully');
    expect(response.body).toHaveProperty('comment');
    commentId = response.body.comment.CommentID;
  });

  it('should get comment by id', async () => {
    const response = await request(app)
      .get(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('comment');
    expect(response.body.comment.CommentID).toBe(commentId);
  });

  it('should get comments by bug', async () => {
    const response = await request(app)
      .get(`/api/comments/bug/${bugId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('comments');
    expect(Array.isArray(response.body.comments)).toBe(true);
  });

  it('should get comments by user', async () => {
    const response = await request(app)
      .get(`/api/comments/user/${userId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('comments');
    expect(Array.isArray(response.body.comments)).toBe(true);
  });

  it('should update comment', async () => {
    const response = await request(app)
      .put(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        CommentText: 'Updated test comment'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Comment updated successfully');
    expect(response.body).toHaveProperty('comment');
  });

  it('should delete comment', async () => {
    const response = await request(app)
      .delete(`/api/comments/${commentId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message', 'Comment deleted successfully');
  });

  it('should delete comments by bug', async () => {
    // Create another comment first
    await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        BugID: bugId,
        CommentText: 'Another test comment'
      });

    const response = await request(app)
      .delete(`/api/comments/bug/${bugId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('message');
  });
});