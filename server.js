const express = require("express");
require("dotenv").config();
const app = express();
const dbconnection = require("./database");
const mainRoutes = require("./routes/routes");
const botCaller = require("./functions/botFunctions");

app.get('/healthCheck', async (req, res, next) => {
  try {
    res.status(200).json({
      message: '🚀 Backend Service is Up and Running! 💻🌟',
      dBHealthCheck: '✅ PASS 🗄️',
      status: 'success',
    });
  } catch (error) {
    res.status(500).json({
      message: 'Health check failed!',
      error: error.message,
    });
  }
});

app.use("/bot/api/v1",mainRoutes);

//start the bot.
botCaller();

// Database connection.
dbconnection.connect();

app.listen(3000, () => {
  console.log("Server started on port 3000 && Bot is live");
});

