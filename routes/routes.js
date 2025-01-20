const {Router } = require("express");
const {  getlatlongPostman, getSearchDataPostman, getlatlongPostmanGoogle } = require("../functions/functions");
const mainRoutes = Router();


mainRoutes.post("/getRestaurants",getSearchDataPostman);
mainRoutes.get("/getlatlong",getlatlongPostmanGoogle);

module.exports = mainRoutes;