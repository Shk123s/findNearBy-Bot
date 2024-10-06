const axios = require("axios");
const fourSquareToken = process.env.fourSquareToken;
const connection = require("../database");

exports.getSearchData = async (userId) => {
  try {
    const selectQuery = "SELECT * FROM user_search WHERE user_id = ?";
    const [existingUser] = await connection.promise().execute(selectQuery, [userId]);
    const searchDetails = existingUser[0];

    const searchParams = new URLSearchParams({
      query: searchDetails.search_type, 
     ll: `${searchDetails.latitude},${searchDetails.longitude}`,
     open_now: "true", 
     sort: "DISTANCE", 
     limit: "10", 
     radius: "2000", 
     });

     const url = `https://api.foursquare.com/v3/places/search?${searchParams.toString()}`;

     const results = await axios.get(url, {
      headers: {
        Accept: "application/json",
        Authorization: fourSquareToken, 
      },
    });
    const data = results.data;
    const defaultIconUrl = "https://img.freepik.com/free-photo/hotel-beautiful-silhouette-tree-trees_1203-5175.jpg?w=740&t=st=1728111713~exp=1728112313~hmac=f93d6b6b07c1cb72bc47751d9a2bd66cb6a0e1af8b589669c2ea3fe2a7a5b0cd"; 
    const userIconUrl = "https://img.freepik.com/premium-vector/colorful-collection-icons-including-house-with-red-orange-background_1187092-69811.jpg?w=740";
   
    const placess = data.results
      .map( (place) => {
           const imageUrl =  userIconUrl ;
           const address = place.location.formatted_address ? place.location.formatted_address : "N/A";
           const category = place.categories[0]?.name ? place.categories[0].name : "N/A";
           const distance = place.distance ? `${place.distance} ` : "N/A";
          return {
            name: place.name,
            address,
            category,
            imageUrl,
            distance, 
          };
        }
      );    
    
    return [placess, null];
  } catch (error) {
    console.log(error.message);
    return [null, error.message];
  }
};
