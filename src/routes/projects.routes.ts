import type { Express } from "express";
import * as projectController from "../controllers/project.controller";
import { requireAuth } from "../middleware/auth.middleware";

const projectRoutes = (app:Express) => {
    // GET /api/projects - Retrieve all projects
    app.get('/api/projects', requireAuth, projectController.getAllProjectsController);

    // GET /api/projects/:id - Retrieve a specific project by ID
    app.get('/api/projects/:id', requireAuth, projectController.getProjectByIdController);

    // GET /api/projects/creator/:creatorId - Retrieve projects by creator
    app.get('/api/projects/creator/:creatorId', requireAuth, projectController.getProjectsByCreatorController);

    // POST /api/projects - Create a new project
    app.post('/api/projects', requireAuth, projectController.createProjectController);

    // PUT /api/projects/:id - Update an existing project
    app.put('/api/projects/:id', requireAuth, projectController.updateProjectController);

    // DELETE /api/projects/:id - Delete a project
    app.delete('/api/projects/:id', requireAuth, projectController.deleteProjectController);
}

export default projectRoutes;