const {Router } = require("express");

const { latlongGoogle, searchedTopFivePlace, nearbyPlacesByText, getPlaceDetailsById } = require("../rapidapi/nearbysearch");
const rapidApiRoutes = Router();


//rapid api 

rapidApiRoutes.get("/latlong",latlongGoogle);
rapidApiRoutes.get("/topfivePlaces",searchedTopFivePlace);
rapidApiRoutes.get("/nearbyplaces/text",nearbyPlacesByText);
rapidApiRoutes.get("/placedetailsbyId",getPlaceDetailsById);



module.exports = rapidApiRoutes;