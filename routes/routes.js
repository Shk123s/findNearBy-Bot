const {Router } = require("express");
const { getRestaurants } = require("../functions/functions");
const mainRoutes = Router();


mainRoutes.post("/getRestaurants",getRestaurants);

module.exports = mainRoutes;