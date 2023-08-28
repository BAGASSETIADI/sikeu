var express = require('express');
var router = express.Router();
var Users = require('../models/Users');
var jwt = require('jsonwebtoken');
var cekToken = require("../middleware");


/*proses authentication*/
router.post('/login', function(req, res, next) {
    var nama = req.body.nama;
    var password = req.body.password;
    Users.findOne({
        where: { nama: nama, password: password }
    }).then(data => {
        if (data) {
            var payload = {
                id: data.id,
                nama: data.nama,
                level: data.level,
                exp: Math.floor(Date.now() / 1000) + 3600, //token berlaku 1 jam
            }
            var kodeKeamanan = "Ht54fgD4gfb%hfgRgt3927B^vdgGtJ*"; //bisa diganti
            var token = jwt.sign(payload, kodeKeamanan);
            res.json({
                status: true,
                pesan: "Berhasil Login",
                data: token
            });

        } else {
            res.json({
                status: false,
                pesan: "Nama atau Password Salah",
                data: req.body
            });
        }
    }).catch(salahnya => {
        res.json({
            status: false,
            pesan: "Gagal Tambah: " + salahnya.message,
            data: req.body
        });
    });
});




/* TAMPIL DATA */
router.get('/', cekToken, function(req, res, next) {
    Users.findAndCountAll().then(data => {
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
    Users.create(req.body).then(data => {
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
    Users.update(req.body, {
        where: { id: req.body.id }
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
    Users.destroy({
        where: { id: req.body.id }
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