const { Bot, Markup,InlineKeyboard } = require("grammy");
const token = process.env.TOKEN;
const bot = new Bot(token);
const connection = require("../database");
const { getSearchData } = require("./functions");

const botCaller = async () => {
  try {
    const locationKeyboard = new InlineKeyboard().text(
      "📍 Share your location",
      "request_location"
    );
    // .text("Enter manually!", "enter_manually");

    bot.command("start", async (ctx) => {
      const userId = ctx.update.message.from.id || 11111;
      const username = ctx.update.message.from.username || "default_username";
      const firstName =
        ctx.update.message.from.first_name || "default_first_name";
      if (userId) {
        try {
          const selectQuery = "SELECT * FROM user_search WHERE user_id = ?";
          const [existingUser] = await connection
            .promise()
            .execute(selectQuery, [userId]);

          if (existingUser.length > 0) {
            const userInfo = existingUser[0];
            const userMessage = `Welcome back ${username}! Once again select the options.`;

            try {
              await ctx.reply(userMessage);
              await ctx.reply("Please share your location:", {
                reply_markup: locationKeyboard,
              });
            } catch (error) {
              if (error.error_code === 403 && error.description.includes("user is deactivated")) {
                console.error(`User ${userId} is deactivated.`);
              } else {
                console.error("Failed to send message:", error);
                ctx.reply("Failed to send message:");
              }
            }
          } else {
            try {
              const insertQuery =
                "INSERT INTO user_search (user_id, username, first_name) VALUES (?, ?, ?)";
              await connection
                .promise()
                .execute(insertQuery, [userId, username, firstName]);

              const introductionMessage = `Hello ${firstName}! I'm a Telegram bot.
              I'm powered by shaqeeb, the next-generation serverless computing platform for Finding NearBy.`;

              await ctx.reply(introductionMessage);
              await ctx.reply("Please share your location:", {
                reply_markup: locationKeyboard,
              });
            } catch (error) {
              console.log(error);
              ctx.reply(
                "Internal Server Error.Please try again after some time.!"
              );
            }
          }
        } catch (outerError) {
          console.error("Operation failed:", outerError);
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

    // // later on will see for manually.
    // bot.callbackQuery("enter_manually", (ctx) => {
    //   ctx.reply("Please enter the location.:");
    // });

    bot.on("message:location", async (ctx) => {
      try {
        const userId = ctx.update.message.from.id;
        const { latitude, longitude } = ctx.message.location;

        if (ctx?.message?.location) {
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
            .text("Cafe", "cafe")
            .row()
            .text("Gym", "gym")
           

          await ctx.reply("Please choose an option:", {
            reply_markup: inlineKeyboardForOptions,
          });
        }
      } catch (error) {
        console.log(error);
        ctx.reply(
          "There was an error processing your request. Please try again later."
        );
      }
    });

    bot.callbackQuery(/(restaurant|hotel|cafe|gym)/, async (ctx) => {
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
          case "gym":
            responseText =
              "You selected Gym. Please wait while we fetch gym options...";
            break;
          default:
            responseText = "Invalid selection.";
        }

        const updateQuery = ` UPDATE user_search SET search_type =  ? WHERE user_id = ? `;

        const [userUpdationDetails] = await connection.promise().execute(updateQuery, [selection, userId]);

        if (responseText) {
          await ctx.reply(responseText);
        } else {
          await ctx.reply("Sorry, no valid selection.");
        }

        const [userResults, userResultsError] = await getSearchData(userId);

        if (userResultsError) {
          await ctx.reply( "An error occurred while fetching the search results. Please try again later." );

        } else if (userResults && userResults.length > 0) {
              for (const place of userResults) {

             const caption = `
             <b>             🟡 ${place.name}          </b>\n
             📍 <u>Address:</u> ${place.address}.\n
             ⭐ <u>Category:</u> ${place.category}\n
             📏 <u>Distance:</u> ${place.distance} m `;

              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`;

              const mapKeyboard = new InlineKeyboard().url('Get Directions', mapsUrl);
            
              await ctx.replyWithPhoto(place.imageUrl, {
                caption: caption,
                parse_mode: "HTML",
                reply_markup: mapKeyboard
              });
            
          }
        } else {
          await ctx.reply("No results found.");
        }
      } catch (error) {
        ctx.reply( "There was an error processing your request. Please try again later.");
      }
    });

    bot.start();
  } catch (error) {
    console.log(error);
  }
};

module.exports = botCaller;
