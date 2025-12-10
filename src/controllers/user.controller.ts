import { Request, Response } from 'express';
import {
    getAllUsers,
    createUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    updateUserPassword,
    deleteUser,
    getUsersByProject
} from '../services/user.services';
import { handleControllerError } from '../utils/errorHandler';

// Get all users
export const getAllUsersController = async (req: Request, res: Response) => {
    try {
        const users = await getAllUsers();
        res.status(200).json({ users });
    } catch (error: any) {
        handleControllerError(error, res);
    }
};

// Get users by project
export const getUsersByProjectController = async (req: Request, res: Response) => {
    try {
        const projectId = parseInt(req.params.projectId);
        if (!projectId || isNaN(projectId)) {
            return res.status(400).json({ message: "Invalid project ID" });
        }
        const users = await getUsersByProject(projectId);
        res.status(200).json({ users });
    } catch (error: any) {
        handleControllerError(error, res);
    }
};

// Create a new user
export const createUserController = async (req: Request, res: Response) => {
    try {
        const userData = req.body;
        const result = await createUser(userData);
        res.status(201).json({
            message: "User created successfully",
            user: result.user,
            token: result.token
        });
    } catch (error: any) {
        handleControllerError(error, res);
    }
};

// Login user
export const loginUserController = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await loginUser(email, password);
        res.status(200).json({
            message: "Login successful",
            token: result.token,
            user: result.user
        });
    } catch (error: any) {
        handleControllerError(error, res);
    }
};

// Get current user profile
export const getUserProfileController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId; // From auth middleware
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const user = await getUserProfile(userId);
        res.status(200).json({ user });
    } catch (error: any) {
        handleControllerError(error, res);
    }
};

// Update user profile
export const updateUserProfileController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId;
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const updateData = {
            Username: req.body.username,
            Email: req.body.email,
            Role: req.body.role
        };

        const updatedUser = await updateUserProfile(userId, updateData);

        res.status(200).json({
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (error: any) {
        handleControllerError(error, res);
    }
};

// Update user password
export const updateUserPasswordController = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.userId; // From auth middleware
        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const { currentPassword, newPassword } = req.body;
        await updateUserPassword(userId, currentPassword, newPassword);
        res.status(204).send();
    } catch (error: any) {
        handleControllerError(error, res);
    }
};

// Delete user
export const deleteUserController = async (req: Request, res: Response) => {
    try {
        const userId = parseInt(req.params.id);
        if (!userId || isNaN(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }
        const currentUser = (req as any).user;
        if (currentUser.userId !== userId && currentUser.role !== 'admin') {
            return res.status(403).json({ message: "Forbidden: Can only delete your own account or require admin role" });
        }
        await deleteUser(userId);
        res.status(204).send();
    } catch (error: any) {
        handleControllerError(error, res);
    }
};