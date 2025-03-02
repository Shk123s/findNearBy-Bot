const {Router } = require("express");
const {  getSearchDataPostman, getlatlongPostmanGoogle } = require("../functions/functions");
const { latlongGoogle, searchedTopFivePlace, nearbyPlacesByText, getPlaceDetailsById } = require("../rapidapi/nearbysearch");
const mainRoutes = Router();


mainRoutes.post("/getRestaurants",getSearchDataPostman);
mainRoutes.get("/getlatlong",getlatlongPostmanGoogle);

//rapid api 

mainRoutes.get("/latlong",latlongGoogle);
mainRoutes.get("/topfivePlaces",searchedTopFivePlace);
mainRoutes.get("/nearbyplaces/text",nearbyPlacesByText);
mainRoutes.get("/placedetailsbyId",getPlaceDetailsById);

module.exports = mainRoutes;