import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import { getPool } from '../db/config';
import bugRoutes from './routes/bug.routes';
import commentRoutes from './routes/comments.routes';
import projectRoutes from './routes/projects.routes';
import userRoutes from './routes/user.routes';

const  app = express();
dotenv.config();

// Middleware
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;


// Routes
bugRoutes(app);
commentRoutes(app);
projectRoutes(app);
userRoutes(app);

// Root route
app.get('/', (req, res) => {
    res.json({
        message: "Bug Tracker API is running",
        version: "1.0.0",
        endpoints: {
            bugs: "/api/bugs",
            comments: "/api/comments",
            projects: "/api/projects",
            users: "/api/users"
        }
    });
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(3000, async () => {
        console.log("Starting server...");
        try {
            const dbConnected = await getPool();
            if(dbConnected){
                console.log(`Server is running on http://localhost:${PORT}`);
                console.log("Database connected Successfully");
            }
            else{
                console.log("Database connection error");
            }
        } catch (error) {
            console.log("Error starting the server", error);
        }
    });
}

export default app;
