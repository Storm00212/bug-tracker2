import type { Express } from "express";
import * as userController from "../controllers/user.controller";
import { requireAuth, requireAdmin } from "../middleware/auth.middleware";

const userRoutes = (app:Express) => {
    // GET /users - Get all users
    app.get('/api/users', userController.getAllUsersController);

    // GET /users/project/:projectId - Get users by project
    app.get('/api/users/project/:projectId', userController.getUsersByProjectController);

    // POST /users/register - Create a new user
    app.post('/api/users/register', userController.createUserController);

    // POST /users/login - Login user
    app.post('/api/users/login', userController.loginUserController);

    // GET /users/profile - Get current user profile
    app.get('/api/users/profile', userController.getUserProfileController);

    // PUT /users/profile - Update user profile
    app.put('/api/users/profile', requireAuth, userController.updateUserProfileController);

    // PUT /users/change-password - Change password
    app.put('/api/users/change-password', requireAuth, userController.updateUserPasswordController);

    // DELETE /users/:id - Delete user
    app.delete('/api/users/:id', requireAuth, userController.deleteUserController);
}

export default userRoutes;