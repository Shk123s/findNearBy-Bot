const axios = require("axios");
const geolib = require("geolib");


const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

exports.searchedTopFivePlace = async (req,res) => {
    try {
  
      const { latitude, longitude, radius = 5000, keyword } = req.query;
      
      if (!latitude || !longitude) {
        return [null, "Latitude and Longitude are required."];
      }
      const searchParams = new URLSearchParams({
        location: `${latitude},${longitude}`,
        radius: radius.toString(),
        keyword, 
        key: googleMapsApiKey,
      });
  
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${searchParams.toString()}`;
  
      const results = await axios.get(url);
      const data = results.data;
  
       if (!data || !data.results) {
       console.error("Error: No results found in API response", data);
       return [null, "No results found."];
      }
  
      let places = data.results
        .filter((place) => place.rating >= 4.0)
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
            place_id:place.place_id,
            name: place.name,
            address,
            category,
            openingHours,
            imageUrl: photoUrl,
            distance: `${(distance / 1000).toFixed(2)} km`,
            rating,
          };
        });
  
      // Shuffle and pick the top 5
      const top5 = shuffleArray(places).slice(0, 5);
  

      return res.status(200).json({top5 });
    } catch (error) {
      console.error("Error fetching nearby:", error.message);
      return res.status(500).json({ error: "Error fetching nearby:" });
    }
  };

exports.latlongGoogle = async (req,res) => {
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
      return res.status(404).json({ error: "Enter the Address in more specific or detail." });
    }

    let { lat, lng } = data.results[0].geometry.location;
  
    return res.status(200).json({
      message: "Lat Long Fetch successfully.",
      address:JSON?.parse(address ? address : {}),
      latitude: lat,
      longitude: lng,
    });
  } catch (error) {
    console.error("Error fetching latitude and longitude:", error.message);
    return res.status(500).json({ error: "An error occurred while fetching lat long" });
  }
};

 async function fetchData(address) {
 try {
  const apiKey = process.env.GOOGLE_GEOCODING_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}`;

  const response = await axios.get(url);
  const data = response.data;
  if (!data.results || data.results.length === 0) {
    return res.status(404).json({ error: "Enter the Address in more specific or detail." });
  }

  let { lat, lng } = data.results[0].geometry.location;
  const result =  { latitude: lat, longitude: lng }
   return [result, null];
} catch (error) {
  console.error("Error fetching latitude and longitude:", error.message);
  return [null,"An error occurred while fetching lat long"];
}
};
  
const googleMapsApiKey = process.env.googleMapsApiKey;

exports.nearbyPlacesByText = async (req, res) => {
  try {
    const { radius = 2000, address, keyword } = req.query;

    if (!keyword ) {
      return res.status(400).json({ message: "Keyword is required." });
    }

    const [fetchDatalatlong, fetchDatalatlangError] = await fetchData(address);

    if (fetchDatalatlangError) {
      return res.status(500).json({ message: fetchDatalatlangError });
    }

    if (!fetchDatalatlong || Object.keys(fetchDatalatlong).length === 0) {
      return res.status(404).json({ message: "Please provide your location and be more specific." });
    }

    const searchParams = new URLSearchParams({
      location: `${fetchDatalatlong.latitude},${fetchDatalatlong.longitude}`,
      radius: radius.toString(),
      keyword,
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
          { latitude: parseFloat(fetchDatalatlong.latitude), longitude: parseFloat(fetchDatalatlong.longitude) },
          {
            latitude: parseFloat(place.geometry.location.lat),
            longitude: parseFloat(place.geometry.location.lng),
          }
        );

        const imageUrls = place.photos
          ? place.photos.map(photo =>
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${googleMapsApiKey}`
            )
          : [userIconUrl];

        const openingHours = place.opening_hours
          ? place.opening_hours.open_now
            ? "Open Now"
            : "Closed"
          : "Not Mentioned";

        const detailedTimings = place.opening_hours?.weekday_text || ["Not Available"];
        
        // ✅ Fetch Place Details API to get website, phone, and more details
        const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=website,formatted_phone_number,reviews&key=${googleMapsApiKey}`;
        const placeDetails = await axios.get(placeDetailsUrl);
        const details = placeDetails.data.result;

        const website = details?.website || "Not Available";
        const phoneNumber = details?.formatted_phone_number || "Not Available";

        const reviews = details?.reviews
          ? details.reviews.map((review) => ({
              author: review.author_name,
              rating: review.rating,
              text: review.text,
            }))
          : [];

        const priceRange =
          place.price_level !== undefined
            ? ["Free", "Cheap", "Moderate", "Expensive", "Very Expensive"][place.price_level]
            : "Not Available";

        const amenities = {
          hasParking: place.types?.some(type => ["parking", "car_parking", "parking_lot"].includes(type)) || false,
          hasWiFi: place.types?.some(type => ["cafe", "internet_cafe", "library"].includes(type)) || false,
        };

        return {
          place_id:place.place_id,
          name: place.name,
          address,
          category,
          openingHours,
          detailedTimings,
          imageUrls,
          distance: `${(distance / 1000).toFixed(2)} km`,
          rating: place.rating || "N/A",
          phoneNumber,
          website,
          reviews,
          priceRange,
          amenities,
        };
      })
    );

    return res.status(200).json({ places });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch nearby data. Please try again later.", error: error.message });
  }
};

exports.getPlaceDetailsById = async (req, res) => {
  try {
    const { place_id } = req.query;

    if (!place_id) {
      return res.status(400).json({ message: "place_id is required." });
    }

    // ✅ Fetch details using Place Details API
    const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place_id}&fields=name,formatted_address,formatted_phone_number,opening_hours,website,reviews,price_level,photos,types&key=${googleMapsApiKey}`;
    const placeDetailsResponse = await axios.get(placeDetailsUrl);
    const place = placeDetailsResponse.data.result;

    if (!place) {
      return res.status(404).json({ message: "Place not found." });
    }

    // ✅ Extract Details
    const imageUrls = place.photos
      ? place.photos.map(photo =>
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photo.photo_reference}&key=${googleMapsApiKey}`
        )
      : ["https://example.com/default-image.png"]; // Default image if no photos

    const openingHours = place.opening_hours
      ? place.opening_hours.open_now
        ? "Open Now"
        : "Closed"
      : "Not Mentioned";

    const detailedTimings = place.opening_hours?.weekday_text || ["Not Available"];

    const phoneNumber = place.formatted_phone_number || "Not Available";
    const website = place.website || "Not Available";

    const reviews = place.reviews
      ? place.reviews.map(review => ({
          author: review.author_name,
          rating: review.rating,
          text: review.text,
        }))
      : [];

    const priceRange =
      place.price_level !== undefined
        ? ["Free", "Cheap", "Moderate", "Expensive", "Very Expensive"][place.price_level]
        : "Not Available";

    const amenities = {
      hasParking: place.types?.includes("parking") || false,
      hasWiFi: place.types?.includes("wifi") || false,
    };

    return res.status(200).json({
      place_id: place_id,
      name: place.name,
      address: place.formatted_address || "Not Available",
      category: place.types?.[0] || "N/A",
      openingHours,
      detailedTimings,
      imageUrls,
      rating: place.rating || "N/A",
      phoneNumber,
      website,
      reviews,
      priceRange,
      amenities,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to fetch place details. Please try again later.", error: error.message });
  }
};
