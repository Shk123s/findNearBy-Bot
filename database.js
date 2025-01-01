const mysql = require("mysql2");
require("dotenv").config();

let connection;

function handleDisconnect() {
  connection = mysql.createConnection({
    host: process.env.db_LOCALHOST,
    user: process.env.db_USERNAME,
    password: process.env.db_PASSWORD,
    database: process.env.db_DATABASE,
    port: process.env.db_PORT,
    connectTimeout: 20000,
  });

  connection.connect((err) => {
    if (err) {
      console.error("Error connecting to the database:", err.message);
      setTimeout(handleDisconnect, 5000); // Retry after 5 seconds
    } else {
      console.log("db Connected!");
    }
  });

  connection.on("error", (err) => {
    console.error("Database error:", err);
    if (err.code === "PROTOCOL_CONNECTION_LOST") {
      console.log("Reconnecting to the database...");
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect(); 


module.exports = connection;
