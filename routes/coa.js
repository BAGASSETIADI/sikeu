var express = require('express');
var router = express.Router();
var cekToken = require("../middleware");
//panggil Model Coa
var Coa = require('../models/Coa.js');
/* TAMPIL DATA */
router.get('/', function(req, res, next) {
    Coa.findAll().then(data => {
        res.json({
            status: true,
            pesan: "Berhasil Tampil",
            data: data
        });
    }).catch(err => {
        res.json({
            status: false,
            pesan: "Gagal Tampil: " + err.message,
            data: []
        });
    });
});
/* TAMBAH DATA */
router.post('/', cekToken, function(req, res, next) {
    Coa.create(req.body).then(data => {
            res.json({
                status: true,
                pesan: "Berhasil Tambah",
                data: data
            });
        })
        .catch(err => {
            res.json({
                status: false,
                pesan: "Gagal Tambah: " + err.message,
                data: []
            });
        });
});
/* UBAH DATA */
router.put('/', cekToken, function(req, res, next) {
    Coa.update(req.body, {
        where: { kode: req.body.kode }
    }).then(() => {
        res.json({
            status: true,
            pesan: "Berhasil Ubah",
            data: []
        });
    }).catch(err => {
        res.json({
            status: false,
            pesan: "Gagal Ubah: " + err.message,
            data: []
        });
    });
});
/* HAPUS DATA */
router.delete('/', cekToken, function(req, res, next) {
    Coa.destroy({
        where: { kode: req.body.kode }
    }).then(() => {
        res.json({
            status: true,
            pesan: "Berhasil Hapus",
            data: []
        });
    }).catch(err => {
        res.json({
            status: false,
            pesan: "Gagal Hapus: " + err.message,
            data: []
        });
    });
});
module.exports = router;