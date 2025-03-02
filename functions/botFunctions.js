const { Bot, InlineKeyboard } = require("grammy");
const token = process.env.TOKEN;
const bot = new Bot(token);
const connection = require("../database");
const {
  getSearchData,
  getlatlong,
  getSearchedTopFiveData,
} = require("./functions");

const botCaller = async () => {
  try {
    bot.catch((err) => {
      console.error("Global error occurred:", err);
    });

    bot.command("start", async (ctx) => {
      const userId = ctx.update.message.from.id || 11111;
      const username = ctx.update.message.from.username || "default_username";
      const firstName =
        ctx.update.message.from.first_name || "default_first_name";

      try {
        const selectQuery = "SELECT * FROM user_search WHERE user_id = ?";
        const [existingUser] = await connection
          .promise()
          .execute(selectQuery, [userId]);

        if (existingUser.length > 0) {
          await ctx.reply(`Welcome back, ${username}!`);
          await ctx.reply(
            "Please provide your location and be more specific (e.g., landmark or area district,city,country. like : Byculla station west mumbai india. )."
          );
        } else {
          const insertQuery =
            "INSERT INTO user_search (user_id, username, first_name) VALUES (?, ?, ?)";
          await connection
            .promise()
            .execute(insertQuery, [userId, username, firstName]);

          await ctx.reply(`Hello ${firstName}! Welcome to the bot.`);
          await ctx.reply(
            "Please provide your location and be more specific (e.g., landmark or area district,city,country. like : Byculla station west mumbai india. )."
          );
        }
      } catch (error) {
        console.error("Error in start command:", error);
        await ctx.reply("There was an error. Please try again later.");
      }
    });

    bot.on("message:text", async (ctx) => {
      const userId = ctx.update.message.from.id;
      let userInput = ctx.message.text.trim();
      const selectQuery = "SELECT * FROM user_search WHERE user_id = ?";
      const [existingUser] = await connection.promise().execute(selectQuery, [userId]);
      const checkTopFive = existingUser[0];
    
      // Check if input matches "Top 5" format
      const top5Regex = /^Top\s*5\s*(.*)$/i;
      const match = userInput.match(top5Regex);
       if(!match){
        try {
          const locationData = await getlatlong(userInput);
          const { latitude, longitude } = locationData;
    
          if (latitude && longitude) {
            const updateQuery = `UPDATE user_search SET latitude = ?, longitude = ? WHERE user_id = ?`;
            await connection.promise().execute(updateQuery, [latitude, longitude, userId]);
    
            const inlineKeyboardForOptions = new InlineKeyboard()
            .text("🔝 Top 5", "top5")
            .row()
            .text("🏨 Hotel", "hotel")
            .text("🍽️ Restaurant", "restaurant")
            .text("☕ Cafe", "cafe")
            .row()
            .text("🏋️ Gym", "gym")
            .text("🏥 Hospital", "hospital")
            .text("💊 Pharmacy", "pharmacy")
            .row()
            .text("🏞️ Park", "park")
            .text("🏧 ATM", "atm")
            .text("🛍️ Mall", "mall")
            .row()
            .text("⛽ Gas Station", "gas_station")
            .text("🎥 Movie Theater", "movie_theater")
            .text("🛒 Supermarket", "supermarket");
    
            await ctx.reply("Received! Great😊. Please choose an option:", {
              reply_markup: inlineKeyboardForOptions,
            });
          } else {
            await ctx.reply("Could not find the location. Please be more specific with area or landmark, state, city, and country.");
          }
        } catch (error) {
          console.error("Error processing location input:", error);
          await ctx.reply("There was an error. Please try again later.");
        }
       } else if (checkTopFive?.top5 && match) {

        const searchQuery = match[1].trim();
        const updateQuery = `UPDATE user_search SET search_type = ?, top5_search = ? WHERE user_id = ?`;
        await connection.promise().execute(updateQuery, ["top5", searchQuery, userId]);
    
        await ctx.reply(`Got it! Searching for '${userInput}' in your area...`);
  
        // Fetch top 5 places
        const [userResults, userResultsError] = await getSearchedTopFiveData(userId, searchQuery);
    
        if (userResultsError) {
          await ctx.reply("An error occurred while fetching the search results. Please try again later.");
        } else if (userResults && userResults.length > 0) {
          const truncate = (text, length = 200) => 
          text && text.length > length ? text.slice(0, length) + "..." : text;

          for (const place of userResults) {
            let caption = `
            <b>🟡 ${place.name}</b>\n
            📍 <u>Address:</u> ${place.address}\n
            🚩 <u>Category:</u> ${place.category}\n
            ⭐ <u>Rating:</u> ${place.rating}\n
            🔓 <u>Open:</u> ${place.openingHours}\n
            📏 <u>Distance:</u> ${place.distance}\n
            📞 <u>Phone:</u> ${place.phoneNumber}\n
            🌐 <u>Website:</u> <a href="${place.website}">${place.website}</a>\n
            💰 <u>Price Range:</u> ${place.priceRange}\n
            🏆 <u>Top Reviews:</u>\n
            ${place.reviews.map(r => `- ${r.author}: ${r.rating}⭐ - ${truncate(r.text, 200)}`).join("\n")}\n
            🛠 <u>Amenities:</u>\n
               - 🅿️ Parking: ${place?.amenities?.hasParking ? "Yes" : "No"}\n
               - 📶 WiFi: ${place?.amenities?.hasWiFi ? "Yes" : "No"}\n
               - ♿ Accessibility: ${place?.amenities?.isAccessible ? "Yes" : "No"}\n
            `.trim();
            
            if (caption.length > 1024) {
              console.warn("Caption too long! Truncating...");
              caption = caption.slice(0, 1020) + "...";
            }
          
            
    
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`;
            const mapKeyboard = new InlineKeyboard().url("Get Directions", mapsUrl);
    
            await ctx.replyWithPhoto(place.imageUrl, {
              caption: caption,
              parse_mode: "HTML",
              reply_markup: mapKeyboard,
            });
          }
          const inlineKeyboardForOptions = new InlineKeyboard()
          .text("🔝 Top 5", "top5")
          .row()
          .text("🏨 Hotel", "hotel")
          .text("🍽️ Restaurant", "restaurant")
          .text("☕ Cafe", "cafe")
          .row()
          .text("🏋️ Gym", "gym")
          .text("🏥 Hospital", "hospital")
          .text("💊 Pharmacy", "pharmacy")
          .row()
          .text("🏞️ Park", "park")
          .text("🏧 ATM", "atm")
          .text("🛍️ Mall", "mall")
          .row()
          .text("⛽ Gas Station", "gas_station")
          .text("🎥 Movie Theater", "movie_theater")
          .text("🛒 Supermarket", "supermarket");

        await ctx.reply("Thank you😊. Please choose an option:", {
          reply_markup: inlineKeyboardForOptions,
        });
        } else {
          await ctx.reply("No results found. Try using a different search phrase or location.");
        }
      }
    });
    

    bot.callbackQuery(
      /(restaurant|hotel|cafe|gym|hospital|pharmacy|park|atm|mall|gas_station|movie_theater|supermarket)/,
      async (ctx) => {
        try {
          const userId = ctx.update.callback_query.from.id;
          const selection = ctx.callbackQuery.data;
    
          const updateQuery = `UPDATE user_search SET search_type = ? WHERE user_id = ?`;
          await connection.promise().execute(updateQuery, [selection, userId]);
    
          const [userResults, userResultsError] = await getSearchData(userId);
      
          if (userResultsError) {
            await ctx.reply("An error occurred while fetching the search results. Please try again later.");
          } else if (userResults && userResults.length > 0) {
          const maxCaptionLength = 1024; // Telegram's max caption limit
            for (const place of userResults) {
              let caption = `
              <b>🟡 ${place.name}</b>
              📍 <u>Address:</u> ${place.address}
              🚩 <u>Category:</u> ${place.category}
              ⭐ <u>Rating:</u> ${place.rating}
              🔓 <u>Open:</u> ${place.openingHours}
              📏 <u>Distance:</u> ${place.distance}
              📞 <u>Phone:</u> ${place.phoneNumber}
              🌐 <u>Website:</u> <a href="${place.website}">${place.website}</a>
              💰 <u>Price Range:</u> ${place.priceRange}
              🏆 <u>Top Reviews:</u> ${place.reviews
                .slice(0, 2)
                .map((r) => `\n- ${r.author}: ${r.rating}⭐ - ${r.text}`)
                .join("")}
              🛠 <u>Amenities:</u> 
                 - 🅿️ Parking: ${place.amenities.hasParking ? "Yes" : "No"}
                 - 📶 WiFi: ${place.amenities.hasWiFi ? "Yes" : "No"}
                 - ♿ Accessibility: ${place.amenities.isAccessible ? "Yes" : "No"}
                 - 🍽️ Restaurant: ${place.amenities.hasRestaurant ? "Yes" : "No"}
              `;
              
              // Slice if exceeds Telegram's limit
              caption = caption.length > 1024 ? caption.slice(0, 1021) + "..." : caption;
              
    
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`;
              const mapKeyboard = new InlineKeyboard().url("Get Directions", mapsUrl);
    
              await ctx.replyWithPhoto(place.imageUrl, {
                caption: caption,
                parse_mode: "HTML",
                reply_markup: mapKeyboard,
              });
            }
    
            // ✅ New Interactive Options
            const inlineKeyboardForOptions = new InlineKeyboard()
              .text("🔝 Top 5", "top5")
              .row()
              .text("🏨 Hotel", "hotel")
              .text("🍽️ Restaurant", "restaurant")
              .text("☕ Cafe", "cafe")
              .row()
              .text("🏋️ Gym", "gym")
              .text("🏥 Hospital", "hospital")
              .text("💊 Pharmacy", "pharmacy")
              .row()
              .text("🏞️ Park", "park")
              .text("🏧 ATM", "atm")
              .text("🛍️ Mall", "mall")
              .row()
              .text("⛽ Gas Station", "gas_station")
              .text("🎥 Movie Theater", "movie_theater")
              .text("🛒 Supermarket", "supermarket");
    
            await ctx.reply("Thank you 😊. Please choose an option:", { reply_markup: inlineKeyboardForOptions });
          } else {
            await ctx.reply("No results found. Try a more specific location.");
          }
        } catch (error) {
          console.error("Error processing callback query:", error);
          await ctx.reply("There was an error processing your request. Please try again later.");
        }
      }
    );
    

    // ✅ Top 5 selection triggers this
    bot.callbackQuery("top5", async (ctx) => {
      const userId = ctx.update.callback_query.from.id;

      // ✅ Set `top5` to true for this user in the database
      const updateQuery = `UPDATE user_search SET top5 = ? WHERE user_id = ?`;
      await connection.promise().execute(updateQuery, [true, userId]); // ✅ Set it as TRUE
      await ctx.reply(
        "Please enter your 'Top 5' request (e.g., 'Top 5 Pav Bhaji Restaurants', 'Top 5 Gyms', etc.)."
      );
    });

  //   bot.on("message::text", async (ctx) => {
  //     // const userId = ctx.update.callback_query.from.id;
  //     // const userRequest = ctx.message.text.trim();
  //     // const selectQuery = "SELECT * FROM user_search WHERE user_id = ?";
  //     // const [existingUser] = await connection.promise().execute(selectQuery, [userId]);
  //     // const checkTopFive = existingUser[0];
  //     // console.log(
  //     //   checkTopFive,
  //     //   "checkTopFive",
  //     //   userRequest,
  //     //   "top five ke andar."
  //     // );
  //     if (checkTopFive?.top5) {
  //       // Save the user request in the database
  //       const updateQuery = `UPDATE user_search SET search_type = ?, top5_search = ? WHERE user_id = ?`;
  //       await connection
  //         .promise()
  //         .execute(updateQuery, ["top5", userRequest, userId]);

  //       await ctx.reply(
  //         `Got it! Searching for '${userRequest}' in your area...`
  //       );

  //       // Fetch top 5 places
  //       const [userResults, userResultsError] = await getSearchedTopFiveData(
  //         userId,
  //         userRequest
  //       );

  //       if (userResultsError) {
  //         await ctx.reply(
  //           "An error occurred while fetching the search results. Please try again later."
  //         );
  //       } else if (userResults && userResults.length > 0) {
  //         for (const place of userResults) {
  //           const caption = `
  // <b>🟡 ${place.name}</b>
  // 📍 <u>Address:</u> ${place.address}
  // 🚩 <u>Category:</u> ${place.category}
  // ⭐ <u>Rating:</u> ${place.rating}
  // 🔓 <u>Open:</u> ${place.openingHours}
  // 📏 <u>Distance:</u> ${place.distance}`;

  //           const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  //             place.address
  //           )}`;
  //           const mapKeyboard = new InlineKeyboard().url(
  //             "Get Directions",
  //             mapsUrl
  //           );

  //           await ctx.replyWithPhoto(place.imageUrl, {
  //             caption: caption,
  //             parse_mode: "HTML",
  //             reply_markup: mapKeyboard,
  //           });
  //         }
  //       } else {
  //         await ctx.reply(
  //           "No results found. Try using a different search phrase or location."
  //         );
  //       }
  //       ctx.session.waitingForTop5Input = false; // Reset flag after handling input
  //     }
  //   });

    bot.start();
  } catch (error) {
    console.error("Error initializing bot:", error);
  }
};

module.exports = botCaller;
