const fs = require('fs');
const express = require('express');//Used for incoming http requests
const app = express();
const bodyparse = require("body-parser");

app.use(bodyparse());
app.use(express.static("public"));

function errorRespsonse(){
    return "<!DOCTYPE html><html>Directory not found!</html>";
}

app.use("/", function(req, res, next){
    fs.readFile(process.cwd() + "/routes/main.html", "utf8", function(err, data){
        if(err){
            res.send(errorRespsonse());
            return;
        }
        res.send(data);
    });
});

app.use(function (req, res, next) {
    res.send(errorRespsonse());
});

module.exports = app;