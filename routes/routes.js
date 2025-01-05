const {Router } = require("express");
const {  getlatlongPostman, getSearchDataPostman } = require("../functions/functions");
const mainRoutes = Router();


mainRoutes.post("/getRestaurants",getSearchDataPostman);
mainRoutes.get("/getlatlong",getlatlongPostman);

module.exports = mainRoutes;