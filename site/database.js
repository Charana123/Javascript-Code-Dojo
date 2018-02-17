var sqlite3 = require("sqlite3");

//Open database (creates one if it doesn't exist)
var db = new sqlite3.Database("./db.sqlite3", (err) => {
    if(err) {
        console.log(err.message);
        return;
    }
    console.log("Connected to an file SQLite database");
});

//Print error callback handler function
var logErr = function (err) {
    if(err) {
        console.log(err.message);
        return;
    }
};


function getRow(db, table, id) {
    db.all("SELECT * FROM " + table + " WHERE id = " + id + ";", function(err, row) {
        if (err) {
            console.log("failed to read " + id + " from table " + table + " in database: " + err);
            return;
        }
        console.log(row);
    });
}

getRow(db, "users", 0);
