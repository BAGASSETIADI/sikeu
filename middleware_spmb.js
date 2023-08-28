var cekTokenSpmb = function(req, res, next) {
    var token = req.header("spmb_token");
    if (token) {
        if (token == "842P37u<Ghdbu3t3gTgreOi*736_hgdrTT4") {
            next();
        } else {
            res.json({
                status: false,

                pesan: "Token spmb Tidak Valid",
                data: []
            });
        }
    } else {
        res.json({
            status: false,
            pesan: "Maaf tidak membawa token spmb",
            data: []
        });
    }
}
module.exports = cekTokenSpmb;