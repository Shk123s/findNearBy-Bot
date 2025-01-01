const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.db_LOCALHOST,
  user: process.env.db_USERNAME,
  password: process.env.db_PASSWORD,
  database: process.env.db_DATABASE,
  port: process.env.db_PORT,
  waitForConnections: true,
  connectionLimit: 10, // Adjust as needed
  queueLimit: 0,
  connectTimeout: 20000, // 20 seconds
});

process.on("SIGINT", async () => {
    console.log("Closing database connection pool...");
    try {
      await pool.end();
      console.log("Database connection pool closed.");
      process.exit(0);
    } catch (err) {
      console.error("Error closing the pool:", err.message);
      process.exit(1);
    }
  });

module.exports = pool;
