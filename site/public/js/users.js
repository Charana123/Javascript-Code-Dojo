var express = require("express");
var path = require("path");
var router = express.Router();

router.get("/", (req, res) => {
    //Redirect to currently connected users user information homepage
    res.sendFile(path.join(__dirname, "../views/users-info.html"));
});

var user_id_parameter_name = "user_id";
router.get("/:" + user_id_parameter_name, (req, res) => {
    //Query database to gather user information corresponding to the user_id
    //used to fill up the user information wekpage of that individual which will be displayed
    //user-info.html is the templated html page for all user information webpages
    var user_id = req.param[user_id_parameter_name];
    res.sendFile(path.join(__dirname, "../views/users-info.html"));
});

module.exports = router;