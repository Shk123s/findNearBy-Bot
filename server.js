const express = require("express");
require('dotenv').config();
const app = express();
const { createWorker } = require("tesseract.js");
const { Bot } = require('grammy');
const token = process.env.TOKEN;
const bot = new Bot(token);  


const textExacter = async (imagePath) => {
  try {
    const worker = await createWorker(["eng","hin"]);
    const { data: { text } } = await worker.recognize(imagePath);
    await worker.terminate();
    return text; 
  } catch (error) {
    console.log("Tesseract error:", error);
    return null;
  }
};

bot.command('start', (ctx) => {
  const introductionMessage = `Hello ${ctx.update.message.from.first_name}! I'm a Telegram bot.
I'm powered by shaqeeb, the next-generation serverless computing platform for Budget Management System.
Please send me an image, and I'll try to extract the text from it.`;
  ctx.reply(introductionMessage);  
});


bot.on('message', async (ctx) => {
  if (ctx.message.photo) {  
    const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id; 
    
    try {
   
      const file = await bot.api.getFile(fileId);
      const filePath = `https://api.telegram.org/file/bot${token}/${file.file_path}`;  
  
      const recognizedText = await textExacter(filePath);

      if (recognizedText) {
        await ctx.reply(`I found the following text in your image: \n${recognizedText}`);
        
        await ctx.reply("Thank you for using me!!");
        
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

bot.start();

app.listen(3000, () => {
  console.log("Server started on port 3000.Bot is live");
});
