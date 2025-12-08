import bcrypt from 'bcrypt';
import { Response } from 'express';
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import sql from 'mssql';
import { CreateUser, UpdateUser, User } from '../Types/user.types';
import { UserRepository } from '../repositories/user.repositories';
import { getPool } from '../../db/config';
import { AppError, ErrorType } from '../utils/errorHandler';
import { request } from 'http';

// Get all users
export const getAllUsers = async (): Promise<User[]> => {
    return await UserRepository.getAllUsers();
};

// Get users by project (users who created the project or are assigned to bugs in the project)
export const getUsersByProject = async (projectId: number): Promise<User[]> => {
    const pool = await getPool();
    const result = await pool.request()
        .input('projectId', sql.Int, projectId)
        .query(`
            SELECT DISTINCT u.UserID, u.Username, u.Email, u.Role, u.CreatedAt
            FROM Users u
            LEFT JOIN Projects p ON u.UserID = p.CreatedBy
            LEFT JOIN Bugs b ON (u.UserID = b.AssignedTo OR u.UserID = b.ReportedBy)
            WHERE p.ProjectID = @projectId OR b.ProjectID = @projectId
        `);

    return result.recordset.map(user => ({
        UserID: user.UserID,
        Username: user.Username,
        Email: user.Email,
        PasswordHash: '', // Don't include password hash
        Role: user.Role,
        CreatedAt: user.CreatedAt
    }));
};


const ensureUserexists =async(id: number) => {
  const verified = await UserRepository.getUserById(id);
  if(!verified){
    throw new Error("User not found");
  }
}
const validateAndParseCredentials = async (body:any): Promise<CreateUser> => {
 const {username, email, password, role} = body ?? {};
 if(!username || !email || !password){
     throw new Error("Missing credentials, please fully fill credentials required")
 };

 if(typeof username !== 'string' || typeof email !== 'string') {
     throw new Error("Invalid field types  in req.body");
 }
 const trimmedUsername = username.trim();
 const trimmedEmail = email.trim().toLowerCase();

 const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

 if(!emailRe.test(trimmedEmail)){
     throw new Error('Invalid email format');
 }

 if(password.length < 8){
     throw new Error('Password must be at least 8 characters');
 };

 console.log("this is the pass", password);

 const passwordHash = await bcrypt.hash(password, 10);

 return{
     Username: trimmedUsername,
     Email: trimmedEmail,
     PasswordHash: passwordHash,
     Role: role && typeof role === 'string' ? role : 'User'
 }
}

export const createUser = async (userData: any) => {
    if(!userData){
        throw new Error("Please fill in credentials");
    }
    const newUser = await validateAndParseCredentials(userData);

    // Check if user already exists
    const existingUser = await UserRepository.getUserByEmail(newUser.Email);
    if (existingUser) {
        throw new Error("User with this email already exists");
    }

    // Create the user
    const createdUser = await UserRepository.createUser(newUser);

    // Remove password hash from response
    const { PasswordHash, ...userResponse } = createdUser;
    return userResponse;
}

// Login user
export const loginUser = async (email: string, password: string) => {
    if (!email || !password) {
        throw new Error("Email and password are required");
    }

    // Find user by email
    const user = await UserRepository.getUserByEmail(email.toLowerCase().trim());
    if (!user) {
        throw new Error("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.PasswordHash);
    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }

    // Generate JWT token
    const token = jwt.sign(
        {
            userId: user.UserID,
            email: user.Email,
            role: user.Role
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
    );

    // Remove password hash from response
    const { PasswordHash, ...userResponse } = user;

    return { token, user: userResponse };
}

// Delete user
export const deleteUser = async (userId: number): Promise<boolean> => {
    await ensureUserexists(userId);

    // Check for dependencies before deleting
    const pool = await getPool();
    const projectCount = await pool.request()
        .input('userId', sql.Int, userId)
        .query('SELECT COUNT(*) as count FROM Projects WHERE CreatedBy = @userId');
    if (parseInt(projectCount.recordset[0].count) > 0) {
        throw new AppError(ErrorType.CONFLICT, "Cannot delete user who has created projects");
    }

    const assignedBugCount = await pool.request()
        .input('userId', sql.Int, userId)
        .query('SELECT COUNT(*) as count FROM Bugs WHERE AssignedTo = @userId');
    if (parseInt(assignedBugCount.recordset[0].count) > 0) {
        throw new AppError(ErrorType.CONFLICT, "Cannot delete user who is assigned to bugs");
    }

    const commentCount = await pool.request()
        .input('userId', sql.Int, userId)
        .query('SELECT COUNT(*) as count FROM Comments WHERE UserID = @userId');
    if (parseInt(commentCount.recordset[0].count) > 0) {
        throw new AppError(ErrorType.CONFLICT, "Cannot delete user who has comments");
    }

    return await UserRepository.deleteUser(userId);
}

// Get current user profile
export const getUserProfile = async (userId: number) => {
    const user = await UserRepository.getUserById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    // Remove password hash from response
    const { PasswordHash, ...userResponse } = user;
    return userResponse;
}

// Update user profile
export const updateUserProfile = async (id: number, updateData: UpdateUser) => {
    await ensureUserexists(id);

    // Validate and prepare update data
    const validatedData: Partial<UpdateUser> = {};

    if (updateData.Username !== undefined) {
        if (typeof updateData.Username !== 'string' || updateData.Username.trim() === '') {
            throw new Error("Invalid username");
        }
        validatedData.Username = updateData.Username.trim();
    }

    if (updateData.Email !== undefined) {
        if (typeof updateData.Email !== 'string') {
            throw new Error("Invalid email type");
        }
        const email = updateData.Email.trim().toLowerCase();
        const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRe.test(email)) {
            throw new Error("Invalid email format");
        }
        // Check if email is already taken by another user
        const existingUser = await UserRepository.getUserByEmail(email);
        if (existingUser && existingUser.UserID !== id) {
            throw new Error("Email is already taken");
        }
        validatedData.Email = email;
    }

    if (updateData.Role !== undefined) {
        if (typeof updateData.Role !== 'string') {
            throw new Error("Invalid role");
        }
        validatedData.Role = updateData.Role;
    }

    // Note: PasswordHash should not be updated here; use changePassword instead
    if (updateData.PasswordHash !== undefined) {
        throw new Error("Password cannot be updated via profile update");
    }

    if (Object.keys(validatedData).length === 0) {
        throw new Error("No valid fields to update");
    }

    const updatedUser = await UserRepository.updateUser(id, validatedData);
    if (!updatedUser) {
        throw new Error("Failed to update user");
    }

    // Remove password hash from response
    const { PasswordHash, ...userResponse } = updatedUser;
    return userResponse;
}

// Update user password
export const updateUserPassword = async (userId: number, currentPassword: string, newPassword: string) => {
    if (!currentPassword || !newPassword) {
        throw new Error("Current password and new password are required");
    }

    if (newPassword.length < 8) {
        throw new Error("New password must be at least 8 characters");
    }

    // Get user
    const user = await UserRepository.getUserById(userId);
    if (!user) {
        throw new Error("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.PasswordHash);
    if (!isCurrentPasswordValid) {
        throw new Error("Current password is incorrect");
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password

    await UserRepository.updateUser(userId, { PasswordHash: newPasswordHash });

    await UserRepository.updateUser(userId, { PasswordHash: newPasswordHash });

}