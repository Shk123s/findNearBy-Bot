const express = require("express");
require("dotenv").config();
const app = express();
const dbconnection = require("./database");
const mainRoutes = require("./routes/routes");
const rapidApiRoutes = require("./routes/rapidApiRoutes");
const botCaller = require("./functions/botFunctions");
//health check
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

// Ping route for Render Cron Job
app.get("/ping", (req, res) => {
  res.status(200).json({ message: "Bot is alive" });
});

app.use("/bot/api/v1",mainRoutes);
app.use("/api/v1",rapidApiRoutes);

//start the bot.
botCaller();

// Database connection.
dbconnection.connect();

app.listen(4000, () => {
  console.log("Server started on port 4000 && Bot is live");
});