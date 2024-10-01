const express = require("express");
require("dotenv").config();
const app = express();
const dbconnection = require("./database");
const mainRoutes = require("./routes/routes");
const botCaller = require("./functions/BotFunctions");

app.use("/bot/api/v1",mainRoutes);

//start the bot.
botCaller();

// Database connection.
dbconnection.connect();

app.listen(3000, () => {
  console.log("Server started on port 3000 && Bot is live");
});

