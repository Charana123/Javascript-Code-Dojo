const express = require("express");
const path = require("path");
const app = express();

//set default template engine to 'ejs' (no need for file extensions)
//app.set("view engine", "ejs");

//ExpressJS Middleware to serve static assets (files) in chosen directory
app.use(express.static(path.join(__dirname, "public")));

//Add Routing (Handlers associated with HTTP request type and URI)
app.get("/", (req, res) => { res.send("Sign Up or Login Screen"); });
app.use("/courses", require("./public/js/courses"));
app.use("/users", require("./public/js/users"));
app.use("/login", require("./public/js/login"));
app.use("/sign-up", require("./public/js/sign_up"));

// app.get(rootURL + "download", (req, res) => {
//     res.download("public/images/anime.png"); //download asset
// });
// app.get(rootURL + "file", (req, res) => {
//     //res.sendFile(path.join(__dirname, "public/images/anime.png")); //render asset
//     res.sendFile(path.join(__dirname, "public/views/main.html")); //render HTML
// });


//Start Listening
let port = 3000;
app.listen(port, () => { console.log("Server started at http://localhost:" + port); });

