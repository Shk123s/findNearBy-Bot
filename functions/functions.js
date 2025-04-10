const axios = require("axios");
const fourSquareToken = process.env.fourSquareToken;
const geolib = require("geolib");
const connection = require("../database");
userIconUrl = "https://img.freepik.com/premium-vector/colorful-collection-icons-including-house-with-red-orange-background_1187092-69811.jpg?w=740";


function sanitizeText(text) {
  return text.replace(/[^\x00-\x7F]/g, "");
}

// exports.getSearchData = async (userId) => {
//   try {
//     const selectQuery = "SELECT * FROM user_search WHERE user_id = ?";
//     const [existingUser] = await connection.promise().execute(selectQuery, [userId]);
//     const searchDetails = existingUser[0];

//     const searchParams = new URLSearchParams({
//       query: searchDetails.search_type, 
//      ll: `${searchDetails.latitude},${searchDetails.longitude}`,
//      open_now: "true", 
//      sort: "DISTANCE", 
//      limit: "10", 
//      radius: "2000", 
//      });

//      const url = `https://api.foursquare.com/v3/places/search?${searchParams.toString()}`;

//      const results = await axios.get(url, {
//       headers: {
//         Accept: "application/json",
//         Authorization: fourSquareToken, 
//       },
//     });
//     const data = results.data;
//     // const defaultIconUrl = "https://img.freepik.com/free-photo/hotel-beautiful-silhouette-tree-trees_1203-5175.jpg?w=740&t=st=1728111713~exp=1728112313~hmac=f93d6b6b07c1cb72bc47751d9a2bd66cb6a0e1af8b589669c2ea3fe2a7a5b0cd"; 
//     const userIconUrl = "https://img.freepik.com/premium-vector/colorful-collection-icons-including-house-with-red-orange-background_1187092-69811.jpg?w=740";
   
//     const placess = data.results
//       .map( (place) => {
//            const imageUrl =  userIconUrl ;
//            const address = place.location.formatted_address ? place.location.formatted_address : "N/A";
//            const category = place.categories[0]?.name ? place.categories[0].name : "N/A";
//            const distance = place.distance ? `${place.distance} ` : "N/A";
//           return {
//             name: place.name,
//             address,
//             category,
//             imageUrl,
//             distance, 
//           };
//         }
//       );    
    
//     return [placess, null];
//   } catch (error) {
//     console.log(error.message);
//     return [null, error.message];
//   }
// };

exports.getlatlongNoUse = async (address) => {
  if (!address) {
    return { error: "Address is required", latitude: null, longitude: null };
  }

  try {
    const apiKey = process.env.OPENCAGE_API_KEY;
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`;

    const response = await axios.get(url);
    const data = response.data;

    if (data.results.length === 0) {
      return { error: "Address not found", latitude: null, longitude: null };
    }

    const { lat, lng } = data.results[0].geometry; 
    if (lat.toFixed(2).length <= 5 || lng.toFixed(2).length <= 5) {
      const nearbyCoordinates = generateNearbyCoordinates(lat, lng);
      return {
        error: null,
        latitude: nearbyCoordinates[0].latitude,
        longitude:  nearbyCoordinates[0].longitude,
      };
    }
    
  } catch (error) {
    console.error("Error fetching latitude and longitude:", error.message);
    return { error: "An error occurred while fetching lat long", latitude: null, longitude: null };
  }
};
exports.getlatlongPostman2 = async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  try {
    const apiKey = process.env.OPENCAGE_API_KEY;
    const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`;

    const response = await axios.get(url);
    const data = response.data;

    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ error: "Address not found" });
    }

    let { lat, lng } = data.results[0].geometry;

    if (lat.toFixed(2).length <= 5 || lng.toFixed(2).length <= 5) {
      const nearbyCoordinates = generateNearbyCoordinates(lat, lng);

      return res.json({
        message: "Nearby coordinates due to low precision",
        latitude: lat,
        longitude: lng,
        nearbyCoordinates,
      });
    }

    return res.json({
      latitude: lat,
      longitude: lng,
    });
  } catch (error) {
    console.error("Error fetching latitude and longitude:", error.message);
    return res.status(500).json({ error: "An error occurred while fetching lat long" });
  }
};
// exports.getlatlongPostman = async (req, res) => {
//   const { address } = req.query;

//   if (!address) {
//     return res.status(400).json({ error: "Address is required" });
//   }

//   try {
//     const apiKey = process.env.OPENCAGE_API_KEY;
//     const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(address)}&key=${apiKey}`;

//     const response = await axios.get(url);
//     const data = response.data;

//     if (!data.results || data.results.length === 0) {
//       return res.status(404).json({ error: "Address not found" });
//     }

//     let { lat, lng } = data.results[0].geometry;
//     console.log(data.results[0].geometry);

//     if (lat.toFixed(2).length <= 5 || lng.toFixed(2).length <= 5) {
//       const nearbyCoordinates = generateNearbyCoordinates(lat, lng);
     
//       return res.json({
//         message: "Nearby coordinates due to low precision",
//         latitude: lat,
//         longitude: lng,
//         nearbyCoordinates,
//       });
//     }

//     return res.json({
//       latitude: lat,
//       longitude: lng,
//     });
//   } catch (error) {
//     console.error("Error fetching latitude and longitude:", error.message);
//     return res.status(500).json({ error: "An error occurred while fetching lat long" });
//   }
// };


//use postman wala
exports.getlatlongPostmanGoogle = async (req,res) => {
    const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: "Address is required" });
  }

  try {
    const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`;

    const response = await axios.get(url);
    const data = response.data;
    if (!data.results || data.results.length === 0) {
      return res.status(404).json({ error: "Address not found" });
    }

    let { lat, lng } = data.results[0].geometry.location;
    console.log(lat, lng);

    return res.json({
      latitude: lat,
      longitude: lng,
    });
  } catch (error) {
    console.error("Error fetching latitude and longitude:", error.message);
    return res.status(500).json({ error: "An error occurred while fetching lat long" });
  }
};
// use wala  address
exports.getlatlong = async (address) => {

  if (!address) {
    return { error: "Address is required", latitude: null, longitude: null };
  }

  try {
    const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      address
    )}&key=${apiKey}`;

    const response = await axios.get(url);
    const data = response.data;
  
    if (!data.results || data.results.length === 0) {
      return { error: "Address not found", latitude: null, longitude: null };
    }

    let { lat, lng } = data.results[0].geometry.location;

    return {
      error: null,
      latitude: lat,
      longitude:  lng,
    };
  } catch (error) {
    console.error("Error fetching latitude and longitude:", error.message);
    return res.status(500).json({ error: "An error occurred while fetching lat long" });
  }
};

function generateNearbyCoordinates(lat, lng, count = 5, distance = 0.01) {
  const coordinates = [];

  for (let i = 0; i < count; i++) {
    const randomLat = lat + (Math.random() * 2 - 1) * distance;
    const randomLng = lng + (Math.random() * 2 - 1) * distance;
    coordinates.push({ latitude: randomLat.toFixed(6), longitude: randomLng.toFixed(6) });
  }

  return coordinates;
}

const googleMapsApiKey = process.env.googleMapsApiKey;

// wala use wala userid 
exports.getSearchData = async (userId) => {
  try {
    const selectQuery = "SELECT * FROM user_search WHERE user_id = ?";
    const [existingUser] = await connection.promise().execute(selectQuery, [userId]);

    const searchDetails = existingUser[0];
    const { latitude, longitude, radius = 2000, search_type } = searchDetails;

    if (!latitude || !longitude) {
      return [null, "Latitude and Longitude are required."];
    }

    const searchParams = new URLSearchParams({
      location: `${latitude},${longitude}`,
      radius: radius.toString(),
      type: search_type,
      keyword: search_type,
      key: googleMapsApiKey,
    });

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${searchParams.toString()}`;
    const results = await axios.get(url);
    const data = results.data;
    const limitedResults = data.results.slice(0, 10);

    const places = await Promise.all(
      limitedResults.map(async (place) => {
        const address = place.vicinity || "N/A";
        const category = place.types?.[0] || "N/A";

        const distance = geolib.getDistance(
          { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
          {
            latitude: parseFloat(place.geometry.location.lat),
            longitude: parseFloat(place.geometry.location.lng),
          }
        );

        const photoUrl = place.photos?.[0]?.photo_reference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${googleMapsApiKey}`
          : userIconUrl;

        const openingHours = place.opening_hours
          ? place.opening_hours.open_now
            ? "Open Now"
            : "Closed"
          : "Not Mentioned";

        const rating = place.rating || "N/A";

        // ✅ Fetch additional details using Place Details API
        const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number,price_level,reviews&key=${googleMapsApiKey}`;
        const placeDetails = await axios.get(placeDetailsUrl);
        const details = placeDetails.data.result;

        const website = details?.website || "Not Available";
        const phoneNumber = details?.formatted_phone_number || "Not Available";

        const priceRange =
          details.price_level !== undefined
            ? ["Free", "Cheap", "Moderate", "Expensive", "Very Expensive"][details.price_level]
            : "Not Available";
            const truncate = (text, length = 100) => 
            text && text.length > length ? text.slice(0, length) + "..." : text;
          
          const reviews = details.reviews?.length
          ? [
              {
                author: details.reviews[0].author_name,
                rating: details.reviews[0].rating,
                text: sanitizeText(details.reviews[0].text.slice(0, 150)) + "..", // Limit text to 150 chars
              },
            ]
          : []


        // ✅ Add Amenities
        const amenities = {
          hasParking: place.types?.some((type) => ["parking", "car_parking", "parking_lot"].includes(type)) || false,
          hasWiFi: place.types?.some((type) => ["cafe", "internet_cafe", "library"].includes(type)) || false,
          isAccessible: place.types?.includes("wheelchair_accessible") || false,
          hasRestaurant: place.types?.includes("restaurant") || false,
        };

        return {
          place_id: place.place_id,
          name: place.name,
          address,
          category,
          openingHours,
          imageUrl: photoUrl,
          distance: `${(distance / 1000).toFixed(2)} km`,
          rating,
          phoneNumber,
          website,
          priceRange,
          reviews,
          amenities,
        };
      })
    );

    return [places, null];
  } catch (error) {
    console.log(error)
    return [null, "Failed to fetch nearby data. Please try again later."];
  }
};
//address use postman  wala 
exports.getSearchDataPostman = async (req, res) => {
  try {
    const { userId, } = req.query; // Get radius from query, default is 1000 meters
  
    // Fetch user search details from the database
    const selectQuery = "SELECT * FROM user_search WHERE user_id = ?";
    const [existingUser] = await connection.promise().execute(selectQuery, [userId]);
  
    if (!existingUser.length) {
      return res.status(404).json({ error: "User search details not found." });
    }
  
    const searchDetails = existingUser[0];

      const { latitude, longitude, radius = 1000 } = searchDetails; // Get latitude, longitude, and radius from query params
    
      // Validate latitude and longitude
      if (!latitude || !longitude) {
        return res.status(400).json({ error: "Latitude and Longitude are required." });
      }
      console.log(latitude, longitude);

      // Construct the request body for the new Places API
      const requestBody = {
        location: {
          lat: parseFloat(latitude),
          lng: parseFloat(longitude),
        },
        radius: parseInt(radius), // Convert to number
        type: "gym", // Type of place to search
        languageCode: "en", // Language preference (optional)
      };
      
      // Google Places API URL
      // const url = "https://places.googleapis.com/v1/places:searchNearby";
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=gym&key=${googleMapsApiKey}`;

        // Make the API request
        const response = await axios.post(url, requestBody, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${googleMapsApiKey}`, // Replace with your actual API key
          },
        });
      
        const data = response.data;
      // Format the response
      console.log(data)
        const places = data.results.map((place) => {
        const address = place.vicinity || "N/A";
        const category = place.types?.[0] || "N/A";
    
        // Handle photo references
        const photoUrl = place.photos?.[0]?.photo_reference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${googleMapsApiKey}`
          : "https://via.placeholder.com/150"; // Fallback placeholder image
    
        return {
          name: place.name,
          address,
          category,
          imageUrl: photoUrl,
        };
      });
    
      // Send the response
      return res.json({ data: places });
    } catch (error) {
      // console.error("Error fetching nearby gyms:", error);
      return res.status(500).json({ error: "Failed to fetch nearby gyms. Please try again later." });
    }
    
  
};

// wala use wala userid top 5
const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);


exports.getSearchedTopFiveData = async (userId, searchQuery = null) => {
  try {
    const selectQuery = "SELECT * FROM user_search WHERE user_id = ?";
    const [existingUser] = await connection.promise().execute(selectQuery, [userId]);

    if (!existingUser.length) {
      return [null, "User data not found."];
    }

    const searchDetails = existingUser[0];
    const { latitude, longitude, radius = 5000, last_top5 = "[]", search_type } = searchDetails;

    if (!latitude || !longitude) {
      return [null, "Latitude and Longitude are required."];
    }

    const keyword = searchQuery || search_type;
    const searchParams = new URLSearchParams({
      location: `${latitude},${longitude}`,
      radius: radius.toString(),
      keyword,
      key: googleMapsApiKey,
    });

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${searchParams.toString()}`;
    const results = await axios.get(url);
    const data = results.data;
    const filteredResults = data.results.filter((place) => place.rating >= 4.0);

    if (!filteredResults.length) {
      return [null, "No results found."];
    }

    const places = await Promise.all(
      filteredResults.map(async (place) => {
        const address = place.vicinity || "N/A";
        const category = place.types?.[0] || "N/A";
        const distance = geolib.getDistance(
          { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
          {
            latitude: parseFloat(place.geometry.location.lat),
            longitude: parseFloat(place.geometry.location.lng),
          }
        );

        const photoUrl = place.photos?.[0]?.photo_reference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${googleMapsApiKey}`
          : userIconUrl;

        const openingHours = place.opening_hours
          ? place.opening_hours.open_now
            ? "Open Now"
            : "Closed"
          : "Not Mentioned";

        const rating = place.rating || "N/A";

        // Fetch additional details
        const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number,price_level,reviews&key=${googleMapsApiKey}`;
        const placeDetails = await axios.get(placeDetailsUrl).catch(() => null);
        const details = placeDetails?.data?.result || {};

        return {
          place_id: place.place_id,
          name: place.name,
          address,
          category,
          openingHours,
          imageUrl: photoUrl,
          distance: `${(distance / 1000).toFixed(2)} km`,
          rating,
          phoneNumber: details.formatted_phone_number || "Not Available",
          website: details.website || "Not Available",
          priceRange:
            details.price_level !== undefined
              ? ["Free", "Cheap", "Moderate", "Expensive", "Very Expensive"][details.price_level]
              : "Not Available",
              reviews: details.reviews?.length
              ? [
                  {
                    author: details.reviews[0].author_name,
                    rating: details.reviews[0].rating,
                    text: sanitizeText(details.reviews[0].text.slice(0, 150)) + "..", // Limit text to 150 chars
                  },
                ]
              : [],
            
            
        };
      })
    );

    const lastTop5 = JSON.parse(last_top5);
    const uniquePlaces = places.filter((place) => !lastTop5?.some((prev) => prev.name === place.name));
    const top5 = shuffleArray(uniquePlaces).slice(0, 5);

    const updateQuery = "UPDATE user_search SET last_top5 = ? WHERE user_id = ?";
    await connection.promise().execute(updateQuery, [JSON.stringify(top5), userId]);

    return [top5, null];
  } catch (error) {
    console.error("Error fetching nearby Top 5:", error.message);
    return [null, "Failed to fetch nearby data. Please try again later."];
  }
};
exports.getNearbyData = async (userId, searchQuery = null) => {
  try {
    const selectQuery = "SELECT * FROM user_search WHERE user_id = ?";
    const [existingUser] = await connection.promise().execute(selectQuery, [userId]);

    const searchDetails = existingUser[0];
    const { latitude, longitude, radius = 2000, nearby_search } = searchDetails;

    if (!latitude || !longitude) {
      return [null, "Latitude and Longitude are required."];
    }

    const searchParams = new URLSearchParams({
      location: `${latitude},${longitude}`,
      radius: radius.toString(),
      type: nearby_search,
      keyword: nearby_search,
      key: googleMapsApiKey,
    });

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${searchParams.toString()}`;
    const results = await axios.get(url);
    const data = results.data;
    const limitedResults = data.results.slice(0, 10);

    const places = await Promise.all(
      limitedResults.map(async (place) => {
        const address = place.vicinity || "N/A";
        const category = place.types?.[0] || "N/A";

        const distance = geolib.getDistance(
          { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
          {
            latitude: parseFloat(place.geometry.location.lat),
            longitude: parseFloat(place.geometry.location.lng),
          }
        );

        const photoUrl = place.photos?.[0]?.photo_reference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${googleMapsApiKey}`
          : userIconUrl;

        const openingHours = place.opening_hours
          ? place.opening_hours.open_now
            ? "Open Now"
            : "Closed"
          : "Not Mentioned";

        const rating = place.rating || "N/A";

        // ✅ Fetch additional details using Place Details API
        const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number,price_level,reviews&key=${googleMapsApiKey}`;
        const placeDetails = await axios.get(placeDetailsUrl);
        const details = placeDetails.data.result;

        const website = details?.website || "Not Available";
        const phoneNumber = details?.formatted_phone_number || "Not Available";

        const priceRange =
          details.price_level !== undefined
            ? ["Free", "Cheap", "Moderate", "Expensive", "Very Expensive"][details.price_level]
            : "Not Available";
            const truncate = (text, length = 100) => 
            text && text.length > length ? text.slice(0, length) + "..." : text;
          
          const reviews = details.reviews?.length
          ? [
              {
                author: details.reviews[0].author_name,
                rating: details.reviews[0].rating,
                text: sanitizeText(details.reviews[0].text.slice(0, 150)) + "..", // Limit text to 150 chars
              },
            ]
          : []


        // ✅ Add Amenities
        const amenities = {
          hasParking: place.types?.some((type) => ["parking", "car_parking", "parking_lot"].includes(type)) || false,
          hasWiFi: place.types?.some((type) => ["cafe", "internet_cafe", "library"].includes(type)) || false,
          isAccessible: place.types?.includes("wheelchair_accessible") || false,
          hasRestaurant: place.types?.includes("restaurant") || false,
        };

        return {
          place_id: place.place_id,
          name: place.name,
          address,
          category,
          openingHours,
          imageUrl: photoUrl,
          distance: `${(distance / 1000).toFixed(2)} km`,
          rating,
          phoneNumber,
          website,
          priceRange,
          reviews,
          amenities,
        };
      })
    );

    return [places, null];
  } catch (error) {
    console.error("Error fetching nearby search :", error.message);
    return [null, "Failed to fetch nearby search. Please try again later."];
  }
};
