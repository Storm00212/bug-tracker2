import { getPool } from '../../db/config';
import { User, CreateUser, UpdateUser } from '../Types/user.types';
import sql from 'mssql';

export class UserRepository {
  // Get all users
  static async getAllUsers(): Promise<User[]> {
    try {
      const pool: sql.ConnectionPool = await getPool();
      const result = await pool.request().query('SELECT * FROM Users ORDER BY CreatedAt DESC');
      return result.recordset;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  // Get user by ID
  static async getUserById(userId: number): Promise<User | null> {
    try {
      const pool: sql.ConnectionPool = await getPool();
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query('SELECT * FROM Users WHERE UserID = @userId');
      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  // Get user by email (case insensitive)
  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const pool: sql.ConnectionPool = await getPool();
      const result = await pool.request()
        .input('email', sql.NVarChar, email.toLowerCase())
        .query('SELECT * FROM Users WHERE LOWER(Email) = LOWER(@email)');
      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      throw error;
    }
  }

  // Create new user
  static async createUser(userData: CreateUser): Promise<User> {
    try {
      const pool: sql.ConnectionPool = await getPool();
      const result = await pool.request()
        .input('username', sql.NVarChar, userData.Username)
        .input('email', sql.NVarChar, userData.Email)
        .input('passwordHash', sql.NVarChar, userData.PasswordHash)
        .input('role', sql.NVarChar, userData.Role || 'User')
        .query('INSERT INTO Users (Username, Email, PasswordHash, Role) OUTPUT INSERTED.* VALUES (@username, @email, @passwordHash, @role)');
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Update user
  static async updateUser(userId: number, userData: UpdateUser): Promise<User | null> {
    try {
      const updateFields: string[] = [];
      let paramIndex = 1;

      const request = (await getPool()).request();

      if (userData.Username) {
        updateFields.push(`Username = @username`);
        request.input('username', sql.NVarChar, userData.Username);
      }
      if (userData.Email) {
        updateFields.push(`Email = @email`);
        request.input('email', sql.NVarChar, userData.Email);
      }
      if (userData.PasswordHash) {
        updateFields.push(`PasswordHash = @passwordHash`);
        request.input('passwordHash', sql.NVarChar, userData.PasswordHash);
      }
      if (userData.Role) {
        updateFields.push(`Role = @role`);
        request.input('role', sql.NVarChar, userData.Role);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      request.input('userId', sql.Int, userId);

      const query = `
        UPDATE Users
        SET ${updateFields.join(', ')}
        OUTPUT INSERTED.*
        WHERE UserID = @userId
      `;

      const result = await request.query(query);
      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  static async deleteUser(userId: number): Promise<boolean> {
    try {
      const pool: sql.ConnectionPool = await getPool();
      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query('DELETE FROM Users WHERE UserID = @userId');
      return (result.rowsAffected[0] || 0) > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }
}