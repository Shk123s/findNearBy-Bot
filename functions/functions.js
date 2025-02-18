const axios = require("axios");
const fourSquareToken = process.env.fourSquareToken;
const geolib = require("geolib");
const connection = require("../database");
 const userIconUrl = "https://img.freepik.com/premium-vector/colorful-collection-icons-including-house-with-red-orange-background_1187092-69811.jpg?w=740";

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
    
     const { latitude, longitude, radius = 1000 } = searchDetails; 
  
        if (!latitude || !longitude) {
         return [null,"Latitude and Longitude are required."];
       }

      const searchParams = new URLSearchParams({
        location: `${latitude},${longitude}`, // Latitude and Longitude
        radius:radius.toString(), // Radius in meters (default 1000)
        type: searchDetails.search_type, // Type of place to search
        keyword: searchDetails.search_type, // Search keyword
        key: googleMapsApiKey, // Your API key
      });
    
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${searchParams.toString()}`;
      // const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=gym&key=${googleMapsApiKey}`;

      const results = await axios.get(url);
      const data = results.data;
      const limitedResults = data.results.slice(0, 10);
      const places = limitedResults.map((place) => {
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
      
          const openingHours = place.opening_hours ? place.opening_hours.open_now  ? "Open Now" : "Closed" : "Not Mentioned";
        const rating = place.rating || "N/A";
      
        return {
          name: place.name,
          address,
          category,
          openingHours,
          imageUrl: photoUrl,
          distance: `${(distance / 1000).toFixed(2)} km`,
          rating, 
        };
      });
    
      return [places ,null];
    } catch (error) {
      // console.error("Error fetching nearby:", error.message);
      return [  null,"Failed to fetch nearby data. Please try again later." ];
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
exports.getSearchedTopFiveData = async (userId, searchQuery = null) => {
  try {
    const selectQuery = "SELECT * FROM user_search WHERE user_id = ?";
    const [existingUser] = await connection.promise().execute(selectQuery, [userId]);
    const searchDetails = existingUser[0];

    const { latitude, longitude, radius = 5000 } = searchDetails;

    if (!latitude || !longitude) {
      return [null, "Latitude and Longitude are required."];
    }


    // Determine keyword: prioritize searchQuery if available
    const keyword = searchQuery || searchDetails.search_type;

    // Avoid restricting type for more accurate results
    const searchParams = new URLSearchParams({
      location: `${latitude},${longitude}`,
      radius: radius.toString(),
      keyword, // Use keyword directly
      key: googleMapsApiKey,
    });

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${searchParams.toString()}`;

    const results = await axios.get(url);
    const data = results.data;

    const places = data.results
      .filter((place) => place.rating >= 4.0) // High-rated places
      .slice(0, 5) // Limit to Top 5
      .map((place) => {
        const address = place.vicinity || "N/A";
        const category = place.types?.[0] || "N/A";
        const distance = geolib.getDistance(
          { latitude: parseFloat(latitude), longitude: parseFloat(longitude) },
          { latitude: parseFloat(place.geometry.location.lat), longitude: parseFloat(place.geometry.location.lng) }
        );

        const photoUrl = place.photos?.[0]?.photo_reference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${place.photos[0].photo_reference}&key=${googleMapsApiKey}`
          : userIconUrl;

        const openingHours = place.opening_hours
          ? place.opening_hours.open_now ? "Open Now" : "Closed"
          : "Not Mentioned";
        const rating = place.rating || "N/A";

        return {
          name: place.name,
          address,
          category,
          openingHours,
          imageUrl: photoUrl,
          distance: `${(distance / 1000).toFixed(2)} km`,
          rating,
        };
      });

    return [places, null];
  } catch (error) {
    console.error("Error fetching nearby:", error.message);
    return [null, "Failed to fetch nearby data. Please try again later."];
  }
};
