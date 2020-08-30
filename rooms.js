express = require("express");

router = express.Router();





router.get("/", function(req, res, next){
    let purp = req.query.purpose;

    res.send("hello");

});

module.exports = router;