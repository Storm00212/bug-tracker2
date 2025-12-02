import type { Express } from "express";
import * as bugController from "../controllers/bug.controller";
import { requireAuth } from "../middleware/auth.middleware";

const bugRoutes = (app:Express) => {
    // GET /api/bugs - Retrieve all bugs
    app.get('/api/bugs', requireAuth, bugController.getAllBugsController);

    // GET /api/bugs/:id - Retrieve a specific bug by ID
    app.get('/api/bugs/:id', requireAuth, bugController.getBugByIdController);

    // GET /api/bugs/project/:projectId - Retrieve bugs for a specific project
    app.get('/api/bugs/project/:projectId', requireAuth, bugController.getBugsByProjectController);

    // GET /api/bugs/assignee/:assigneeId - Retrieve bugs assigned to a user
    app.get('/api/bugs/assignee/:assigneeId', requireAuth, bugController.getBugsByAssigneeController);

    // GET /api/bugs/reporter/:reporterId - Retrieve bugs reported by a user
    app.get('/api/bugs/reporter/:reporterId', requireAuth, bugController.getBugsByReporterController);

    // GET /api/bugs/status/:status - Retrieve bugs by status
    app.get('/api/bugs/status/:status', requireAuth, bugController.getBugsByStatusController);

    // POST /api/bugs - Create a new bug
    app.post('/api/bugs', requireAuth, bugController.createBugController);

    // PUT /api/bugs/:id - Update an existing bug
    app.put('/api/bugs/:id', requireAuth, bugController.updateBugController);

    // DELETE /api/bugs/:id - Delete a bug
    app.delete('/api/bugs/:id', requireAuth, bugController.deleteBugController);
}

export default bugRoutes;