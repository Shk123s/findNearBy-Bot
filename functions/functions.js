  const axios = require("axios");
const connection = require("../database");


  exports.getSearchData = async (userId) => {
      try {

        const selectQuery = "SELECT * FROM user_search WHERE user_id = ?";
        const [existingUser] = await connection.promise().execute(selectQuery, [userId]);
        const searchDetails = existingUser[0];
        
        const params = 
        {
          "includedTypes": [searchDetails.searchtype],
          "maxResultCount": 10,
          "locationRestriction": {
            "circle": {
              "center": {
                
                "latitude": searchDetails.latitude,
                "longitude":  searchDetails.longitude
              },
              "radius": 2000.0
            }
          }
        }

        const response = await axios.post(process.env.placesUrl, params, {
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": process.env.placesApiKey,
            "X-Goog-FieldMask": "places.name,places.formatted_address,places.photos,places.rating,places.geometry",
          },
        });
    
         console.log(response.data);

        //  res.status(200).send({ data: response.data });
         return [response.data,null]
      } catch (error) {
        console.log(error.message);
        return [null,error.message];
      }
    };