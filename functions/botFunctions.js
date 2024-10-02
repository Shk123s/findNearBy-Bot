const { Bot, Keyboard, InlineKeyboard } = require("grammy");
const token = process.env.TOKEN;
const bot = new Bot(token);
const connection = require("../database");
const {  getSearchData } = require("./functions");

const botCaller = async (req, res) => {
  try {
    const locationKeyboard = new InlineKeyboard()
      .text("📍 Share your location", "request_location")
      .text("Enter manually!", "enter_manually");

    bot.command("start", async (ctx) => {
      const userId = ctx.update.message.from.id;
      const username = ctx.update.message.from.username;
      const firstName = ctx.update.message.from.first_name;

      if (userId) {
        try {
          const selectQuery = "SELECT * FROM user_search WHERE user_id = ?";
          const [existingUser] = await connection
            .promise()
            .execute(selectQuery, [userId]);

          if (existingUser.length > 0) {
            const userInfo = existingUser[0];
            const userMessage = `Welcome back ${username}!.Once again select the options `;
            await ctx.reply(userMessage);

            await ctx.reply("Please share your location:", {
              reply_markup: locationKeyboard,
            });
          } else {
            const insertQuery =
              "INSERT INTO user_search (user_id, username, first_name) VALUES (?, ?, ?)";
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

    bot.callbackQuery("request_location", async (ctx) => {
      ctx.reply("Please share your location:", {
        reply_markup: {
          keyboard: [
            [{ text: "📍 Share my location", request_location: true }],
          ],
          one_time_keyboard: true,
          resize_keyboard: true,
        },
      });
    });

    // later on will see for manually.
    bot.callbackQuery("enter_manually", (ctx) => {
      ctx.reply("Please enter the location.:");
    });

    bot.on("message:location", async (ctx) => {
      try {
        const userId = ctx.update.message.from.id;
        const { latitude, longitude } = ctx.message.location;

        if (ctx.message.location) {
          const updateQuery = `
        UPDATE user_search 
        SET latitude = ?, longitude = ?
        WHERE user_id = ? `;

          const [userUpdationDetails] = await connection
            .promise()
            .execute(updateQuery, [latitude, longitude, userId]);

          console.log("User location updated in DB.", userUpdationDetails);

          const inlineKeyboardForOptions = new InlineKeyboard()
            .text("Restaurant", "restaurant")
            .row()
            .text("Hotel", "hotel")
            .row()
            .text("Cafe", "cafe");

          await ctx.reply("Please choose an option:", {
            reply_markup: inlineKeyboardForOptions,
          });
        }
      } catch (error) {
        console.log(error);
        // ctx.reply("Internal Server Error location:", error);
      }
    });

    bot.callbackQuery(/(restaurant|hotel|cafe)/, async (ctx) => {
      try {
        const userId = ctx.update.callback_query.from.id;
        const selection = ctx.callbackQuery.data;

        let responseText = "";
        switch (selection) {
          case "restaurant":
            responseText =
              "You selected Restaurant. Please wait while we fetch restaurant options...";
            break;
          case "hotel":
            responseText =
              "You selected Hotel. Please wait while we fetch hotel options...";
            break;
          case "cafe":
            responseText =
              "You selected Cafe. Please wait while we fetch cafe options...";
            break;
          default:
            responseText = "Invalid selection.";
        }

        const updateQuery = ` UPDATE user_search SET search_type =  ? WHERE user_id = ? `;

        const [userUpdationDetails] = await connection
          .promise()
          .execute(updateQuery, [selection, userId]);

          if (responseText) {
            await ctx.reply(responseText);
          } else {
            await ctx.reply("Sorry, no valid selection.");
          }

        const [userResults, userResultsError] = await getSearchData(userId);
        console.log(userResults,userResultsError)
        if (userResults) {
          await ctx.reply(userResults, { parse_mode: "HTML" });
        } else {
          await ctx.reply("No results found!.");
        }        
      
        
      } catch (error) {
        console.log(error,"errorrr");
        ctx.reply("Internal Server Error selection options:", error);
      }
    });

    bot.start();
  } catch (error) {
    console.log(error);
  }
};

module.exports = botCaller;
