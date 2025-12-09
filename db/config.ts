/**
 * DATABASE CONFIGURATION
 *
 * Handles MSSQL connection setup and management.
 * Uses connection pooling for efficient database access.
 * Provides centralized database configuration and error handling.
 */

import sql from "mssql";
import dotenv from "dotenv";
import assert from "assert";

// Load environment variables from .env file
dotenv.config();

// Validate that the required environment variables are present
// This prevents runtime errors from missing database configuration
assert(process.env.SQL_SERVER, "❌ Missing environment variable: SQL_SERVER");
assert(process.env.SQL_USERNAME, "❌ Missing environment variable: SQL_USERNAME");
assert(process.env.SQL_PASSWORD, "❌ Missing environment variable: SQL_PASSWORD");
assert(process.env.SQL_DATABASE, "❌ Missing environment variable: SQL_DATABASE");

/**
 * MSSQL connection pool configuration
 * Uses environment variables for Azure SQL connection
 */
const config: sql.config = {
  server: process.env.SQL_SERVER!,
  port: 1433,
  database: process.env.SQL_DATABASE!,
  user: process.env.SQL_USERNAME!,
  password: process.env.SQL_PASSWORD!,
  options: {
    encrypt: true, // Use encryption for Azure
    trustServerCertificate: false, // Do not trust self-signed certificates
    enableArithAbort: true,
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
  pool: {
    max: 10, // Maximum number of connections in pool
    min: 0,  // Minimum number of connections in pool
    idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  },
};

const pool = new sql.ConnectionPool(config);

// Connection retry configuration
const MAX_RETRIES = 10;
const RETRY_DELAY_MS = 10000;


export const getPool = async (): Promise<sql.ConnectionPool> => {
  // Test the connection with retry logic
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await pool.connect();
      console.log("\x1b[32m[DB]\x1b[0m  Connected successfully to MSSQL");
      return pool;
    } catch (error: any) {
      const code = error.code || "UNKNOWN";
      const message = error.message || "No error message provided";

      console.error(`\x1b[31m[DB]\x1b[0m  Connection failed [${code}]: ${message}`);

      // Provide helpful error messages for common connection issues
      switch (code) {
        case "ECONNREFUSED":
          console.error(" Check if MSSQL is running and accessible.");
          break;
        case "ENOTFOUND":
          console.error(" Database host not found — verify SQL_SERVER in your .env file.");
          break;
        case "ELOGIN":
          console.error(" Authentication failed — verify credentials in your .env file.");
          break;
        case "ETIMEOUT":
          console.error(" Timeout — check network/firewall settings or server availability.");
          break;
        default:
          console.error(" Unknown error — inspect .env variables or network configuration.");
      }

      // Retry connection if attempts remain
      if (attempt < MAX_RETRIES) {
        console.log(`\x1b[33m[DB]\x1b[0m  Retrying in ${RETRY_DELAY_MS / 1000}s...`);
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      } else {
        console.error("\x1b[31m[DB]\x1b[0m  Max retries reached. Unable to connect to MSSQL.");
        throw error;
      }
    }
  }

  throw new Error("MSSQL connection failed after multiple retries.");
};

/**
 * Close database connection pool gracefully
 *
 * Should be called during application shutdown to clean up resources.
 * Handles errors during pool closure.
 */
export const closePool = async (): Promise<void> => {
  try {
    await pool.close();
    console.log("\x1b[33m[DB]\x1b[0m  MSSQL connection pool closed gracefully.");
  } catch (err) {
    console.error("\x1b[31m[DB]\x1b[0m  Error closing MSSQL pool:", err);
  }
};