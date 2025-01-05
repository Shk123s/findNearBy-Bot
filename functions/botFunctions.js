const { Bot, InlineKeyboard } = require("grammy");
const token = process.env.TOKEN;
const bot = new Bot(token);
const connection = require("../database");
const { getSearchData, getlatlong } = require("./functions");

const botCaller = async () => {
  try {
    bot.catch((err) => {
      console.error("Global error occurred:", err);
    });

    bot.command("start", async (ctx) => {
      const userId = ctx.update.message.from.id || 11111;
      const username = ctx.update.message.from.username || "default_username";
      const firstName = ctx.update.message.from.first_name || "default_first_name";

      try {
        const selectQuery = "SELECT * FROM user_search WHERE user_id = ?";
        const [existingUser] = await connection.promise().execute(selectQuery, [userId]);

        if (existingUser.length > 0) {
          await ctx.reply(`Welcome back, ${username}!`);
          await ctx.reply("Please provide your location and be more specific (e.g., landmark or area district,city,country. like : Byculla station west mumbai india. ).");
        } else {
          const insertQuery = "INSERT INTO user_search (user_id, username, first_name) VALUES (?, ?, ?)";
          await connection.promise().execute(insertQuery, [userId, username, firstName]);

          await ctx.reply(`Hello ${firstName}! Welcome to the bot.`);
          await ctx.reply("Please provide your location and be more specific (e.g., landmark or area district,city,country. like : Byculla station west mumbai india. ).");
        }
      } catch (error) {
        console.error("Error in start command:", error);
        await ctx.reply("There was an error. Please try again later.");
      }
    });

    bot.on("message:text", async (ctx) => {
      const userId = ctx.update.message.from.id;
      const userInput = ctx.message.text.trim();

      try {
        const locationData = await getlatlong(userInput); 
 
        const { latitude, longitude } = locationData;
        if ( latitude && longitude) {
   
          const updateQuery = `
            UPDATE user_search
            SET latitude = ?, longitude = ?
            WHERE user_id = ?`;
          await connection.promise().execute(updateQuery, [latitude, longitude, userId]);

          const inlineKeyboardForOptions = new InlineKeyboard()
          .text("Restaurant", "restaurant")
          .text("Hotel", "hotel")
          .text("Cafe", "cafe")
          .row()
          .text("Gym", "gym")
          .text("Hospital", "hospital")
          .text("Pharmacy", "pharmacy")
          .row()
          .text("Park", "park")
          .text("ATM", "atm")
          .text("Mall", "mall")
          .row()
          .text("Gas Station", "gas_station")
          .text("Movie Theater", "movie_theater")
          .text("Supermarket", "supermarket");

          await ctx.reply("Received! Great😊. Please choose an option:", {
            reply_markup: inlineKeyboardForOptions,
          });
        } else {
          await ctx.reply("Could not find the location. Please be more specific area or landmark,state,city and country.");
        }
      } catch (error) {
        console.error("Error processing location input:", error);
        await ctx.reply("There was an error. Please try again later.");
      }
    });

    bot.callbackQuery(  /(restaurant|hotel|cafe|gym|hospital|pharmacy|park|atm|mall|gas_station|movie_theater|supermarket)/, async (ctx) => {
      try {
        const userId = ctx.update.callback_query.from.id;
        const selection = ctx.callbackQuery.data;

        const updateQuery = `UPDATE user_search SET search_type = ? WHERE user_id = ?`;
        await connection.promise().execute(updateQuery, [selection, userId]);

        const [userResults, userResultsError] = await getSearchData(userId);

        if (userResultsError) {
          await ctx.reply("An error occurred while fetching the search results. Please try again later.");
        } else if (userResults && userResults.length > 0) {
          for (const place of userResults) {
            const caption = `
<b>🟡 ${place.name}</b>
📍 <u>Address:</u> ${place.address}
🚩 <u>Category:</u> ${place.category}
⭐ <u>Rating:</u> ${place.rating}
🔓 <u>Open:</u> ${place.openingHours}
📏 <u>Distance:</u> ${place.distance}`;

            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`;
            const mapKeyboard = new InlineKeyboard().url("Get Directions", mapsUrl);

            await ctx.replyWithPhoto(place.imageUrl, {
              caption: caption,
              parse_mode: "HTML",
              reply_markup: mapKeyboard,
            });
          } 
          const inlineKeyboardForOptions = new InlineKeyboard()
          .text("Restaurant", "restaurant")
         .text("Hotel", "hotel")
        .text("Cafe", "cafe")
        .row()
        .text("Gym", "gym")
        .text("Hospital", "hospital")
        .text("Pharmacy", "pharmacy")
        .row()
        .text("Park", "park")
        .text("ATM", "atm")
        .text("Mall", "mall")
        .row()
        .text("Gas Station", "gas_station")
        .text("Movie Theater", "movie_theater")
        .text("Supermarket", "supermarket");

        await ctx.reply("Thank you😊. Please choose an option:", {
          reply_markup: inlineKeyboardForOptions,
        });

        } else {
          await ctx.reply("No results found.Try entering a nearby area or use a more specific location (e.g., landmark or area district,city,country. like : Byculla station west mumbai india. ).");
        }
      } catch (error) {
        console.error("Error processing callback query:", error);
        await ctx.reply("There was an error processing your request. Please try again later.");
      }
    });

    bot.start();
  } catch (error) {
    console.error("Error initializing bot:", error);
  }
};

module.exports = botCaller;
