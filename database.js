const mysql = require("mysql2");
require("dotenv").config();

const connection = mysql.createConnection({
  host: process.env.db_LOCALHOST,
  user: process.env.db_USERNAME,
  password: process.env.db_PASSWORD,
  database: process.env.db_DATABASE,
  port: process.env.db_PORT,
  connectTimeout: 20000, // Increased timeout to 20 seconds
});

connection.connect(function (err) {
  if (err) {
    console.error("Error connecting to the database:", err.message);
    connection.end();
    return;
  }
  console.log("db Connected!");
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  connection.end();
  process.exit(1);
});

module.exports = connection;
