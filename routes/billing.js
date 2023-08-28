var express = require('express');
var router = express.Router();
//panggil operator query
const Sequelize = require('sequelize');
const Op = Sequelize.Op;
//panggil Model
var Billing = require('../models/Billing');
var BillingDetail = require('../models/BillingDetail');
var Biaya = require('../models/Biaya');
//panggil koneksi utk proses transaction
var koneksi = require("../koneksi");
//panggil middleware JWT
var cekToken = require("../middleware");
//middleware_spmb
var cekTokenSpmb = require("../middleware_spmb");
/* TAMPIL DATA */
router.get('/', cekToken, function(req, res, next) {
    Billing.findAll({
        include: {
            model: BillingDetail,
            as: "billing_detail",

            include: {

                model: Biaya,
                as: 'biaya'
            },
        }
    }).then(data => {
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
    //menggunakan metode transaction
    koneksi.transaction().then(function(t) {
        Billing.create(req.body, { transaction: t }).then(data => {
            //update id_billing di req.body.billing_detail
            //promise all : digunakan untuk menunggu proses selesai di setiap looping

            Promise.all(
                req.body.billing_detail.map(async(item) => {

                    item.id = data.id + "-" + item.id_biaya; //id detailbilling = id_billing + id_biaya

                    item.id_billing = data.id;
                })
            );

            BillingDetail.bulkCreate(
                req.body.billing_detail, { transaction: t }
            ).then(dataDetail => {

                t.commit(); //simpan permanen
                res.json({
                    status: true,
                    pesan: "Berhasil Billing",
                    data: data,
                    detail: dataDetail
                });
            }).catch(err => {
                t.rollback(); //batalkan simpan
                res.json({
                    status: false,
                    pesan: "Gagal Billing Detail: " + err.message,
                    data: []
                });
            });
        }).catch(err => {
            t.rollback(); //batalkan simpan
            res.json({
                status: false,

                pesan: "Gagal Billing: " + err.message,
                data: []
            });
        });
    }); //tutup transaction
});

/* HAPUS DATA Langkah1: cek statu code dulu */
router.delete('/', cekToken, function(req, res, next) {
    Billing.count({
        where: {
            id: req.body.id,
            status_code: {
                [Op.gt]: 0
            }
        }
    }).then(function(data) {
        console.log(data);
        if (data == 0) {
            next();
        } else {
            res.json({
                status: false,

                pesan: "Maaf billing ini tidak dapat dihapus",
                data: data

            });
        }
    }).catch(err => {
        res.json({
            status: false,
            pesan: "Gagal Cek Billing: " + err.message,
            data: []
        });
    });
});


/* HAPUS DATA Langkah2: lanjut hapus data */
router.delete('/', cekToken, function(req, res, next) {
    koneksi.transaction().then(function(t) {
        Billing.destroy({
            where: {
                id: req.body.id,

                status_code: {
                    [Op.or]: [0, null]
                }

            }
        }, { transaction: t }).then(() => {
            BillingDetail.destroy(

                { where: { id_billing: req.body.id } },

                { transaction: t }
            ).then(data => {

                t.commit(); //hapus berpanen
                res.json({
                    status: true,
                    pesan: "Berhasil menghapus data billing"
                });
            }).catch(err => {
                t.rollback(); //batalkan hapus
                res.json({
                    status: true,
                    pesan: err.message
                });
            });
        }).catch(err => {
            t.rollback(); //batalkan hapus
            res.json({
                status: false,
                pesan: "Gagal Hapus: " + err.message,
                data: []
            });
        });
    });
});
/* TAMPIL BILLING UNTUK SPMB */
router.get('/spmb/:no_daftar', cekTokenSpmb, function(req, res, next) {
    var no_daftar = req.params.no_daftar;
    //ambil data billing
    Billing.findAll({
        where: { no_daftar: no_daftar }
    }, {
        include: {
            model: BillingDetail,
            as: "billing_detail",
        }
    }).then(dataBilling => {
        res.json({
            status: true,
            pesan: "Tampil data billing",
            data: dataBilling,
        });
    }).catch(err => {
        res.json({
            status: false,
            pesan: "Gagal Ambil billing: " + err.message,
            data: dataMidtrans,
        });
    });
});
/* TAMBAH BILLING DARI SPMB */
router.post('/spmb', cekTokenSpmb, function(req, res, next) {
    //menggunakan metode transaction
    koneksi.transaction().then(function(t) {
        Billing.create(
            req.body,

            { transaction: t }
        ).then(data => {
            Promise.all(
                req.body.billing_detail.map(async(item) => {
                    item.id = data.id + "-" + item.id_biaya;

                    item.id_billing = data.id;
                })
            );
            BillingDetail.bulkCreate(
                req.body.billing_detail, { transaction: t }
            ).then(dataDetail => {
                t.commit();
                res.json({
                    status: true,
                    pesan: "Berhasil Billing",
                    data: data,
                    detail: dataDetail
                });
            }).catch(err => {

                t.rollback(); //batalkan simpan
                res.json({
                    status: false,
                    pesan: "Gagal Billing Detail: " + err.message,
                    data: []
                });
            });
        }).catch(err => {
            t.rollback();
            res.json({
                status: false,
                pesan: "Gagal Billing: " + err.message,

                data: []
            });
        });
    }); //tutup transaction
});
module.exports = router;