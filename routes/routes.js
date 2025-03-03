const {Router } = require("express");
const {  getSearchDataPostman, getlatlongPostmanGoogle } = require("../functions/functions");
const { latlongGoogle, searchedTopFivePlace, nearbyPlacesByText, getPlaceDetailsById } = require("../rapidapi/nearbysearch");
const mainRoutes = Router();


mainRoutes.post("/getRestaurants",getSearchDataPostman);
mainRoutes.get("/getlatlong",getlatlongPostmanGoogle);


module.exports = mainRoutes;