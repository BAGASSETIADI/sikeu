var Users = require("./models/Users");
var jwt = require('jsonwebtoken');
var cekToken = function(req, res, next) {
    var token = req.header("Authorization");

    if (token) {
        token = token.replace("Bearer ", "");
        try {
            var kodeKeamanan = "Ht54fgD4gfb%hfgRgt3927B^vdgGtJ*"; //harus sama dgn yang di login
            var akunToken = jwt.verify(token, kodeKeamanan);
            Users.findByPk(akunToken.id).then(data => {
                if (data) {
                    next(); //next artinya diperbolehkan lanjut ke proses berikutnya
                } else {
                    res.json({
                        status: false,
                        pesan: "Token Tidak Valid",
                        data: []
                    });
                }
            });
        } catch (err) {
            res.json({
                status: false,
                pesan: err.message,
                data: []
            });
        }
    } else {
        res.json({
            status: false,
            pesan: "Maaf tidak membawa token",
            data: []
        });
    }
}
module.exports = cekToken;