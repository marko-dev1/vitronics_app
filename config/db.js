// const sqlite3 = require('sqlite3').verbose();
// const { promisify } = require('util');
// require('dotenv').config();

// class Database {
//   constructor() {
//     // Initialize SQLite database
//     this.db = new sqlite3.Database(
//       process.env.DB_PATH || './database.sqlite',
//       sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
//       (err) => {
//         if (err) {
//           console.error('Database connection error:', err.message);
//           process.exit(1);
//         }
//         console.log('Connected to SQLite database');
//       }
//     );

//     // Promisify methods to match MySQL promise interface
//     this.query = promisify(this.db.all.bind(this.db));
//     this.execute = promisify(this.db.run.bind(this.db));
//     this.get = promisify(this.db.get.bind(this.db));

//     // Initialize database schema
//     this.initialize();
//   }

//   async initialize() {
//     try {
//       // Enable foreign keys and other PRAGMA settings
//       await this.execute('PRAGMA foreign_keys = ON');
//       await this.execute('PRAGMA journal_mode = WAL');
      
//       // Create tables if they don't exist
//       await this.createTables();
//     } catch (err) {
//       console.error('Database initialization failed:', err);
//     }
//   }

//   async createTables() {
//     try {
//       await this.execute(`
//         CREATE TABLE IF NOT EXISTS products (
//           id INTEGER PRIMARY KEY AUTOINCREMENT,
//           name TEXT NOT NULL,
//           description TEXT,
//           category TEXT DEFAULT 'general',
//           price REAL NOT NULL,
//           old_price REAL,
//           image_url TEXT,
//           stock_quantity INTEGER DEFAULT 0,
//           created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//           updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//         )
//       `);
//     } catch (err) {
//       console.error('Table creation failed:', err);
//     }
//   }

//   // Add other database methods as needed
// }

// // Create singleton instance
// const db = new Database();

// module.exports = db;

// config/database.js
// config/db.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite' // or absolute path if needed
});

module.exports = sequelize;

