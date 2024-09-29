const { Bot,InlineKeyboard, Keyboard } = require("grammy");
const token = process.env.TOKEN;
const bot = new Bot(token);
const connection = require("../database");


const botCaller = async (req, res) => {
    try {

    bot.command("start", async (ctx) => {
      console.log(JSON.stringify(ctx));
      const userId = ctx.update.message.from.id;
      const username = ctx.update.message.from.username;
      const firstName = ctx.update.message.from.first_name;

      if (userId) {
        try {
          const selectQuery = "SELECT * FROM userTextBot WHERE user_id = ?";
          const [existingUser] = await connection
            .promise()
            .execute(selectQuery, [userId]);

          if (existingUser.length > 0) { 
            const userInfo = existingUser[0];
            const userMessage = `Welcome back ${userInfo.first_name}!.Once again select the options `;

            const optionsKeyboard = new Keyboard()
            .text("Restaurant")
            .text("Hotel")
            .text("Bar")
            .requestLocation("Share your location") // This requests the user's location
            .row()
          
          // Get the markup directly from the optionsKeyboard without destructuring
          const keyboardMarkup = optionsKeyboard.build(); 
          
          // Log the keyboard markup to verify its structure
          console.log("Keyboard Markup:", JSON.stringify(keyboardMarkup, null, 2));
          
          await ctx.reply("Please choose an option or share your location:", {
            reply_markup: keyboardMarkup,
          });
          
        

          } else {
            const insertQuery =
              "INSERT INTO userTextBot (user_id, username, first_name) VALUES (?, ?, ?)";
            const [userIntro] = await connection
              .promise()
              .execute(insertQuery, [userId, username, firstName]);

            if (userIntro.affectedRows == 1) {
              const introductionMessage = `Hello ${firstName}! I'm a Telegram bot.
              I'm powered by shaqeeb, the next-generation serverless computing platform for Budget Management System.
              Please select the options.`;
              ctx.reply(introductionMessage);
            }
          }
        } catch (error) {
          console.error("Database operation failed:", error);
          ctx.reply(
            "There was an error processing your request. Please try again later."
          );
        }
      }
    });

     bot.callbackQuery(/(restaurant|hotel|bar)/, (ctx) => {
        const selection = ctx.callbackQuery.data;
        
        let responseText = "";
        switch (selection) {
          case "restaurant":
            responseText = "You selected Restaurant. Please wait while we fetch restaurant options...";
            break;
          case "hotel":
            responseText = "You selected Hotel. Please wait while we fetch hotel options...";
            break;
          case "bar":
            responseText = "You selected Bar. Please wait while we fetch bar options...";
            break;
          default:
            responseText = "Invalid selection.";
        }
      
        ctx.reply(responseText);
      });
      
      bot.on("message:location", async (ctx) => {
        const { latitude, longitude } = ctx.message.location;
    

        // Logic to handle the received location
        await ctx.reply(`Thank you for sharing your location! Latitude: ${latitude}, Longitude: ${longitude}`);
      });

    // bot.on("message:contact", (ctx) => {
    //   const phoneNumber = ctx.message.contact.phone_number;
    //   ctx.reply(`Thanks for sharing your phone number: ${phoneNumber}`);
    // });

    bot.start();

  } catch (error) {
       res
      .status(500)
      .send({ message: " Internal server error in the bot functions." });
  }
};

module.exports = botCaller;