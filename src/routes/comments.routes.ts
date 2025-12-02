import type { Express } from "express";
import * as commentController from "../controllers/comment.controller";
import { requireAuth } from "../middleware/auth.middleware";

const commentRoutes = (app:Express) => {
    // GET /api/comments - Retrieve all comments
    app.get('/api/comments', requireAuth, commentController.getAllCommentsController);

    // GET /api/comments/:id - Retrieve a specific comment by ID
    app.get('/api/comments/:id', requireAuth, commentController.getCommentByIdController);

    // GET /api/comments/bug/:bugId - Retrieve all comments for a specific bug
    app.get('/api/comments/bug/:bugId', requireAuth, commentController.getCommentsByBugController);

    // GET /api/comments/user/:userId - Retrieve all comments by a specific user
    app.get('/api/comments/user/:userId', requireAuth, commentController.getCommentsByUserController);

    // POST /api/comments - Create a new comment
    app.post('/api/comments', requireAuth, commentController.createCommentController);

    // PUT /api/comments/:id - Update an existing comment
    app.put('/api/comments/:id', requireAuth, commentController.updateCommentController);

    // DELETE /api/comments/:id - Delete a specific comment
    app.delete('/api/comments/:id', requireAuth, commentController.deleteCommentController);

    // DELETE /api/comments/bug/:bugId - Delete all comments for a specific bug
    app.delete('/api/comments/bug/:bugId', requireAuth, commentController.deleteCommentsByBugController);
}

export default commentRoutes;