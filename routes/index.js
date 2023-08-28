var express = require('express');
var router = express.Router();
var cekToken = require("../middleware");
/* GET home page. */
router.get('/', cekToken, function(req, res, next) {
    res.render('index', { title: 'Express' });
});

module.exports = router;