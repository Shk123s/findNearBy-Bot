const {Router } = require("express");
const { getSearchData } = require("../functions/functions");
const mainRoutes = Router();


mainRoutes.post("/getRestaurants",getSearchData);

module.exports = mainRoutes;