import { getPool } from '../../db/config';
import { Bug, CreateBug, UpdateBug } from '../Types/bugs.types';
import sql from 'mssql';

export class BugRepository {
  // Get all bugs
  static async getAllBugs(): Promise<Bug[]> {
    try {
      const pool: sql.ConnectionPool = await getPool();
      const result = await pool.request().query('SELECT * FROM Bugs ORDER BY CreatedAt DESC');
      return result.recordset;
    } catch (error) {
      console.error('Error fetching bugs:', error);
      throw error;
    }
  }

  // Get bug by ID
  static async getBugById(bugId: number): Promise<Bug | null> {
    try {
      const pool: sql.ConnectionPool = await getPool();
      const result = await pool.request()
        .input('bugId', sql.Int, bugId)
        .query('SELECT * FROM Bugs WHERE BugID = @bugId');
      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error fetching bug by ID:', error);
      throw error;
    }
  }

  // Get bugs by project
  static async getBugsByProject(projectId: number): Promise<Bug[]> {
    try {
      const pool: sql.ConnectionPool = await getPool();
      const result = await pool.request()
        .input('projectId', sql.Int, projectId)
        .query('SELECT * FROM Bugs WHERE ProjectID = @projectId ORDER BY CreatedAt DESC');
      return result.recordset;
    } catch (error) {
      console.error('Error fetching bugs by project:', error);
      throw error;
    }
  }

  // Get bugs by assignee
  static async getBugsByAssignee(assigneeId: number): Promise<Bug[]> {
    try {
      const pool: sql.ConnectionPool = await getPool();
      const result = await pool.request()
        .input('assigneeId', sql.Int, assigneeId)
        .query('SELECT * FROM Bugs WHERE AssignedTo = @assigneeId ORDER BY CreatedAt DESC');
      return result.recordset;
    } catch (error) {
      console.error('Error fetching bugs by assignee:', error);
      throw error;
    }
  }

  // Get bugs by reporter
  static async getBugsByReporter(reporterId: number): Promise<Bug[]> {
    try {
      const pool: sql.ConnectionPool = await getPool();
      const result = await pool.request()
        .input('reporterId', sql.Int, reporterId)
        .query('SELECT * FROM Bugs WHERE ReportedBy = @reporterId ORDER BY CreatedAt DESC');
      return result.recordset;
    } catch (error) {
      console.error('Error fetching bugs by reporter:', error);
      throw error;
    }
  }

  // Get bugs by status
  static async getBugsByStatus(status: string): Promise<Bug[]> {
    try {
      const pool: sql.ConnectionPool = await getPool();
      const result = await pool.request()
        .input('status', sql.NVarChar, status)
        .query('SELECT * FROM Bugs WHERE Status = @status ORDER BY CreatedAt DESC');
      return result.recordset;
    } catch (error) {
      console.error('Error fetching bugs by status:', error);
      throw error;
    }
  }

  // Create new bug
  static async createBug(bugData: CreateBug): Promise<Bug> {
    try {
      const pool: sql.ConnectionPool = await getPool();
      const result = await pool.request()
        .input('title', sql.NVarChar, bugData.Title)
        .input('description', sql.NVarChar, bugData.Description || null)
        .input('status', sql.NVarChar, bugData.Status || 'Open')
        .input('priority', sql.NVarChar, bugData.Priority || 'Medium')
        .input('projectId', sql.Int, bugData.ProjectID)
        .input('reportedBy', sql.Int, bugData.ReportedBy || null)
        .input('assignedTo', sql.Int, bugData.AssignedTo || null)
        .query('INSERT INTO Bugs (Title, Description, Status, Priority, ProjectID, ReportedBy, AssignedTo) OUTPUT INSERTED.* VALUES (@title, @description, @status, @priority, @projectId, @reportedBy, @assignedTo)');
      return result.recordset[0];
    } catch (error) {
      console.error('Error creating bug:', error);
      throw error;
    }
  }

  // Update bug
  static async updateBug(bugId: number, bugData: UpdateBug): Promise<Bug | null> {
    try {
      const request = (await getPool()).request();

      if (bugData.Title) {
        request.input('title', sql.NVarChar, bugData.Title);
      }
      if (bugData.Description !== undefined) {
        request.input('description', sql.NVarChar, bugData.Description);
      }
      if (bugData.Status) {
        request.input('status', sql.NVarChar, bugData.Status);
      }
      if (bugData.Priority) {
        request.input('priority', sql.NVarChar, bugData.Priority);
      }
      if (bugData.AssignedTo !== undefined) {
        request.input('assignedTo', sql.Int, bugData.AssignedTo);
      }

      const updateFields: string[] = [];
      if (bugData.Title) {
        updateFields.push('Title = @title');
      }
      if (bugData.Description !== undefined) {
        updateFields.push('Description = @description');
      }
      if (bugData.Status) {
        updateFields.push('Status = @status');
      }
      if (bugData.Priority) {
        updateFields.push('Priority = @priority');
      }
      if (bugData.AssignedTo !== undefined) {
        updateFields.push('AssignedTo = @assignedTo');
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      request.input('bugId', sql.Int, bugId);

      const query = `
        UPDATE Bugs
        SET ${updateFields.join(', ')}
        OUTPUT INSERTED.*
        WHERE BugID = @bugId
      `;

      const result = await request.query(query);
      return result.recordset[0] || null;
    } catch (error) {
      console.error('Error updating bug:', error);
      throw error;
    }
  }

  // Delete bug
  static async deleteBug(bugId: number): Promise<boolean> {
    try {
      const pool: sql.ConnectionPool = await getPool();
      const result = await pool.request()
        .input('bugId', sql.Int, bugId)
        .query('DELETE FROM Bugs WHERE BugID = @bugId');
      return (result.rowsAffected[0] || 0) > 0;
    } catch (error) {
      console.error('Error deleting bug:', error);
      throw error;
    }
  }
}