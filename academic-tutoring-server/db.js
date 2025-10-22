/**
 * Database Connection Module
 * 
 * Handles MongoDB connection and provides database access throughout the application.
 * Uses connection pooling and environment-based configuration for flexibility.
 * 
 * Features:
 * - MongoDB connection management
 * - Environment-based URI configuration
 * - Connection error handling
 * - Singleton pattern for database access
 * 
 * @file db.js
 * @version 1.0.0
 * @author Academic Tutoring Team
 */

const { MongoClient } = require('mongodb')
require('dotenv').config()

// Global database connection instance
let dbConnection

module.exports = {
  /**
   * Connect to MongoDB database
   * Establishes connection using environment variable or default local URI
   * 
   * @param {Function} cb - Callback function to execute after connection attempt
   * @param {Error} [cb.err] - Error object if connection fails
   * @returns {void}
   */
  connectToDb: (cb) => {
    // Use environment variable or fallback to local MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/AcademicTutoring'
    
    MongoClient.connect(uri)
      .then(client => {
        // Store database connection for later use
        dbConnection = client.db()
        return cb() // Success callback
      })
      .catch(err => {
        console.log('Database connection error:', err)
        return cb(err) // Error callback
      })
  },
  
  /**
   * Get database connection instance
   * Returns the established database connection for use in other modules
   * 
   * @returns {Db} MongoDB database instance
   */
  getDb: () => dbConnection
}