  const axios = require("axios");


  exports.getRestaurants = async (req, res) => {
      try {
    
        const params = 
        {
          "includedTypes": ["restaurant"],
          "maxResultCount": 10,
          "locationRestriction": {
            "circle": {
              "center": {
                
                "latitude": 18.97677273438098,
                "longitude":  72.83067631336192},
              "radius": 500.0
            }
          }
        }

        const response = await axios.post(process.env.placesUrl, params, {
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": process.env.placesApiKey,
            "X-Goog-FieldMask": "places.formattedAddress,places.displayName",
          },
        });
    
        // console.log(response.data);
        res.status(200).send({ data: response.data });
      } catch (error) {
        console.log(error.message);
        res.status(500).json({ error: error.message });
      }
    };