const express = require("express");
require("dotenv").config();
const app = express();
const { createWorker } = require("tesseract.js");
const { Keyboard } = require("grammy");
const { Bot } = require("grammy");
const token = process.env.TOKEN;
const bot = new Bot(token);
const connection = require("./database");
connection.connect();

const textExacter = async (imagePath) => {
  try {
    const worker = await createWorker(["eng", "hin"]);
    const {
      data: { text },
    } = await worker.recognize(imagePath);
    await worker.terminate();
    return text;
  } catch (error) {
    console.log("Tesseract error:", error);
    return null;
  }
};

bot.command("start", async (ctx) => {
  const userId = ctx.update.message.from.id;
  const username = ctx.update.message.from.username;
  const firstName = ctx.update.message.from.first_name;
  
  if (userId) {
    try {
  
      const selectQuery = "SELECT * FROM userTextBot WHERE user_id = ?";
      const [existingUser] = await connection.promise().execute(selectQuery, [userId]);
  
      if (existingUser.length > 0) {
        const userInfo = existingUser[0];  
        const userMessage = `Welcome back ${userInfo.first_name}! `;
        ctx.reply(userMessage);
      } else {
      
        const insertQuery = "INSERT INTO userTextBot (user_id, username, first_name) VALUES (?, ?, ?)";
        const [userIntro] = await connection.promise().execute(insertQuery, [userId, username, firstName]);
  
        if (userIntro.affectedRows == 1) {
          const introductionMessage = `Hello ${firstName}! I'm a Telegram bot.
          I'm powered by shaqeeb, the next-generation serverless computing platform for Budget Management System.
          Please send me an image, and I'll try to extract the text from it.`;
          ctx.reply(introductionMessage);
        }
      }
    } catch (error) {
      console.error("Database operation failed:", error);
      ctx.reply("There was an error processing your request. Please try again later.");
    }
  }
});

bot.on("message", async (ctx) => {
    const userId = ctx.update.message.from.id;
  if (ctx.message.photo) {
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;

    try {
      const file = await bot.api.getFile(fileId);
      const filePath = `https://api.telegram.org/file/bot${token}/${file.file_path}`;

      const recognizedText = await textExacter(filePath);

      if (recognizedText) {
      
        const selectQuery = "SELECT * FROM userTextBot WHERE user_id = ?";
        const [existingUser] = await connection.promise().execute(selectQuery, [userId]);

        if (existingUser.length > 0) {
  
          const updateQuery = "UPDATE userTextBot SET text = ?  WHERE user_id = ?";
          await connection.promise().execute(updateQuery, [recognizedText , userId]);

          await ctx.reply(`I found the following text in your image: \n${recognizedText}`);
          await ctx.reply("Your information has been updated. Thank you for using me!");
        } else {
             const text = "/start " + "," +  " New User! Please Click on start."
          ctx.reply(text);
        }
      } else {
        await ctx.reply("Sorry, I couldn't extract any text from this image.");
      }
    } catch (error) {
      console.error("Failed to process the photo:", error);
      await ctx.reply("There was an error processing the image.");
    }
  } else {
    ctx.reply("Please send a photo for me to process!");
  }
});


bot.command("request_contact", (ctx) => {
  const keyboard = new Keyboard().requestContact("Share your phone number");

  ctx.reply("Please share your phone number:", {
    reply_markup: {},
  });
});

bot.on("message:contact", (ctx) => {
  const phoneNumber = ctx.message.contact.phone_number;
  ctx.reply(`Thanks for sharing your phone number: ${phoneNumber}`);
});

bot.start();

app.listen(3000, () => {
  console.log("Server started on port 3000.Bot is live");
});
