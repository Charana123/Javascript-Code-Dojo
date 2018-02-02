var express = require("express");
var path = require("path");
var router = express.Router();

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/courses.html"));
});

var course_id_parameter_name = "course_id";
router.get("/:" + course_id_parameter_name, (req, res) => {
    var course_id = req.param[course_id_parameter_name];
    //Use course_id to populate course_interactive.html template webpage 
    //for corresponding course, maybe ?
    res.sendFile(path.join(__dirname, "../views/course_interactive.html"));
});

module.exports = router;