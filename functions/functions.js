const axios = require("axios");
const connection = require("../database");

exports.getSearchData = async (userId) => {
  try {
    const selectQuery = "SELECT * FROM user_search WHERE user_id = ?";
    const [existingUser] = await connection
      .promise()
      .execute(selectQuery, [userId]);
    const searchDetails = existingUser[0];

    // const params =
    // {
    //   "includedTypes": [searchDetails.searchtype],
    //   "maxResultCount": 10,
    //   "locationRestriction": {
    //     "circle": {
    //       "center": {

    //         "latitude": searchDetails.latitude,
    //         "longitude":  searchDetails.longitude
    //       },
    //       "radius": 2000.0
    //     }
    //   }
    // }

    // const response = await axios.post(process.env.placesUrl, params, {
    //   headers: {
    //     "Content-Type": "application/json",
    //     "X-Goog-Api-Key": process.env.placesApiKey,
    //     "X-Goog-FieldMask": "places.name,places.formatted_address,places.photos,places.rating,places.geometry",
    //   },
    // });

    const params = {
      location: `${searchDetails.latitude},${searchDetails.longitude}`,
      radius: 2000, // in meters
      type: searchDetails.searchtype,
      key: process.env.placesApiKey,
      fields: "name,formatted_address,photos,rating,geometry", // fields you want in the response
    };

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/nearbysearch/json",
      {
        params,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const data = response.data.results.slice(0, 5);
    // const formattedResults = formatPlacesAsHTML(data); // Format them into HTML
    const placess =  data
      .map(
        (place, index) => `
    <b>${index + 1}. ${place.name}</b>
    📍 Address: ${place.formatted_address ? place.formatted_address : "N/A"}
    ⭐ Rating: ${place.rating ? place.rating : "N/A"}
  `
      )
      .join("\n\n"); 

    console.log(placess)

    //  res.status(200).send({ data: response.data });
    return [placess, null];
  } catch (error) {
    console.log(error.message);
    return [null, error.message];
  }
};
