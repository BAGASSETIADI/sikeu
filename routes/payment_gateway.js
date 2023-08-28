var express = require('express');
var router = express.Router();

//tambahkan pemanggilan model
var Billing = require('../models/Billing');
var BillingDetail = require('../models/BillingDetail');
var Biaya = require('../models/Biaya');
var Transaksi = require('../models/Biaya');
var TransaksiDetail = require('../models/TransaksiDetail');

//paknggil koneksi untuk proses transaction
var koneksi = require("../koneksi");

//pangggil operator
const Sequelize = require('sequelize');
const Op = Sequelize.Op;

//setting midtrans client
const midtransClient = require('midtrans-client');
const Midtrans = require('midtrans-client');

//variabel config midtrans
var configIsProduction = false;
var configServerKey = 'SB-Mid-server-JP1Q7sguk3MS66vl5-G31eKf';
var configClientKey = 'SB-Mid-client-gIEfCDfvE0uN4kkJ';

//membuat objek snap

let snap = new midtransClient.Snap({
    IsProduction: configIsProduction,
    serverKey: configServerKey,
    ClientKey: configClientKey
});

//membuat objek core apt
let coreApi = new midtransClient.CoreApi({
    IsProduction: configIsProduction,
    serverKey: configServerKey,
    ClientKey: configClientKey
})

/* INQUIRY Langkah1 : ambil data billing*/
router.get('/inquiry/:id', function(req, res, next) {
    //ambil data billing
    Billing.findByPk(req.params.id, {
        include: {
            model: BillingDetail,
            as: "billing_detail"
        }
    }).then(data => {
        if (data) {
            req.billing = data;
            next();
        } else {
            res.json({
                status: false,

                pesan: "Billing dengan id: " + req.params.id + " tidak ditemukan",
                data: data

            });
        }
    }).catch(err => {
        res.json({
            status: false,
            pesan: "Gagal Tampil: " + err.message,
            data: []
        });
    });
});
/* INQUIRY Langkah2 : buat transaksi di midtrans*/
router.get('/inquiry/:id', function(req, res, next) {
    var billing = req.billing;
    var parameter = {
        "transaction_details": {
            "order_id": billing.id,
            "gross_amount": 0
        },
        "customer_details": {
            "first_name": billing.nama,
            "email": billing.email
        },
        "item_details": []
    };
    var total_jumlah = 0;
    Promise.all(
        billing.billing_detail.map(async(item) => {
            var detail = {
                "id": item.id,
                "name": item.nama_biaya,
                "price": item.jumlah,
                "quantity": 1
            };
            total_jumlah += item.jumlah;
            parameter.transaction_details.gross_amount = total_jumlah;
            parameter.item_details.push(detail);
        })
    );

    snap.createTransaction(parameter)
        .then((transaction) => {
            Billing.update({ snap_token: transaction.token, status_code: 1 }, { where: { id: req.params.id } });
            var kodeHtml = `
 <script src="https://app.sandbox.midtrans.com/snap/snap.js" 
 data-client-key="` + configClientKey + `"></script>
 <script type="text/javascript">
 snap.pay('` + transaction.token + `');
 </script>
 `;
            res.send(kodeHtml);
        }).catch((e) => {
            res.json({
                status: false,
                pesan: "Error request ke midtrans",
                data: e.ApiResponse
            });
        });

});
/* cek status pembayaran di midtrans */
// router.get('/status/:id', function(req, res, next) {
//     coreApi.transaction.status(req.params.id).then((data) => {
//         res.json(data);
//     });



/* cek status pembayaran di midtrans: Langkah 1-Update Billing */
router.get('/status/:id', function(req, res, next) {
    var id_billing = req.params.id;
    coreApi.transaction.status(id_billing).then((data) => {
        //update status billing
        Billing.update({
            status_code: data.status_code,
            transaction_status: data.transaction_status
        }, {
            where: {
                id: id_billing,
                transaction_status: {
                    [Op.not]: "Terbayar"
                }
            }
        }).then(() => {
            req.dataMidtrans = data;
            next();
        }).catch(err => {
            res.json({
                status: false,
                pesan: "Gagal Update Billing: " + err.message,
                data: []
            });
        });
    }).catch(err => {
        res.json({
            status: false,
            pesan: "Gagal Cek status: ",
            data: err.ApiResponse
        });
    });

    //cek status pembayaran di midtrans : Langkah 2 Ambil Billing
    router.get('/status/:id', function(req, res, next) {
        var id_billing = req.params.id;
        var dataMidtrans = req.dataMidtrans;

        if (dataMidtrans.transaction_status == "settlement" ||
            dataMidtrans.transaction_status == "capture") {

            //ambildata billing
            Billing.findByPk(id_billing, {
                include: {
                    model: BillingDetail,
                    as: "billing_detail",
                    include: {
                        model: Biaya,
                        as: 'biaya'
                    },
                }
            }).then(dataBilling => {
                if (dataBilling) {
                    req.dataBilling = dataBilling;
                    next();
                } else {
                    res.json({
                        status: false,
                        pesan: "Billing dengan id: " + id_billing + " tidak ditemukan",
                        data: dataMidtrans
                    });
                }

            }).catch(err => {
                res.json({
                    status: false,
                    pesan: "Gagal Ambil Billing :" + err.message,
                    data: dataMidtrans
                });
            });
        } else {
            res.json({
                status: true,
                pesan: "Status Pembayaran: " + dataMidtrans.transaction_status,
                data: dataMidtrans
            });
        }
    });

    //cek status pembayaran di midtrans: Langkah 3 Transaksi Pembayaran
    router.get('/status/:id', function(req, res, next) {
        var id_billing = req.params.id;
        var dataBilling = req.dataBilling;
        var dataMidtrans = req.dataMidtrans;

        if (dataBilling.transaction_status == "Terbayar") {
            //buat data Transaksi
            var dataTrans = {
                jenis: "Bayar",
                tanggal: new Date(),
                no_daftar: dataBilling.no_daftar,
                diterima_dari: dataBilling.nama,
                transaksi_detail: []
            }
            Promise.all(
                dataBilling.billing_detail.map(async(item) => {
                    dataTrans.transaksi_detail.push({
                        id_biaya: item.biaya.id,
                        id_coa_debit: item.biaya.id_coa,
                        id_coa_kredit: 1,
                        jumlah: item.jumlah,
                        keterangan: "Online"
                    });
                })
            );

            //proses insert transaksi dan detail
            //menggunakan metode transaction
            koneksi.transaction().then(function(t) {

                Transaksi.create(
                    dataTrans, { transaction: t }
                ).then(data => {

                    //update id_transaksi di dataTrans.transaksi_detail
                    Promise.all(
                        dataTrans.transaksi_detail.map(async(item) => {
                            item.id_transaksi = data.id
                        })
                    );

                    TransaksiDetail.bulkCreate(
                        dataTrans.transaksi_detail, { transaction: t }
                    ).then(dataDetail => {
                        Billing.update({ transaction_status: "Terbayar" }, {
                            where: { id: id_billing }
                        }, { transaction: t }).then(() => {
                            t.commit();
                            res.json({
                                staus: true,
                                pesan: "Berhasil Transaksi",
                                data: dataMidtrans
                            });
                        }).catch(err => {
                            t.rollback();
                            res.json({
                                status: false,
                                pesan: "Gagal Transaksi Detail: " + err.message,
                                data: dataMidtrans
                            });
                        });;
                    }).catch(err => {
                        t.rollback();
                        res.json({
                            status: false,
                            pesan: "Gagal Transaksi Detail: " + err.message,
                            data: dataMidtrans
                        });
                    });
                }).catch(err => {
                    t.rollback();
                    res.json({
                        status: false,
                        pesan: "Gaga; Transaksi: " + err.message,
                        data: dataMidtrans
                    });
                });
            }); //tutup transaksi
        } else {
            res.json({
                status: true,
                pesan: "Status Pembayaran: " + dataMidtrans.transaction_status,
                data: dataMidtrans
            });
        }
    });

    /*post notif dari midtrans: langkah 1 update Billing */
    router.post('/notif', function(req, res, next) {
        var id_billing = req.body.order_id;
        coreApi.transaction.status(id_billing).then((data) => {
            //update status billing
            Billing.update({
                status_code: data.status,
                transaction_status: data.transaction_status
            }, {
                where: {
                    id: id_billing,
                    transaction_status: {
                        [Op.not]: "Terbayar"
                    }
                }
            }).then(() => {
                req.dataMidtrans = data;
                next();
            }).catch(err => {
                res.json({
                    status: false,
                    pesan: "Gagal update Billing: " + err.message,
                    data: []
                });
            });

        }).catch((e) => {
            res.json({
                staus: false,
                pesan: "Error request ke Midtrans",
                data: e.ApiResponse
            });
        })
    });
    /* post notif di midtrans: Langkah 2-Ambil Billing */
    router.post('/notif', function(req, res, next) {
        var id_billing = req.body.order_id;
        var dataMidtrans = req.dataMidtrans;

        if (dataMidtrans.transaction_status == "settlement" ||
            dataMidtrans.transaction_status == "capture") {

            //ambil data billing
            Billing.findByPk(id_billing, {
                include: {
                    model: BillingDetail,
                    as: "billing_detail",
                    include: {
                        model: Biaya,
                        as: 'biaya'
                    },
                }
            }).then(dataBilling => {
                if (dataBilling) {
                    req.dataBilling = dataBilling;
                    next();
                } else {
                    res.json({
                        status: false,
                        pesan: "Billing dengan id: " + id_billing + " tidak ditemukan",
                        data: dataMidtrans
                    });
                }
            }).catch(err => {
                res.json({
                    status: false,
                    pesan: "Gagal Ambil billing:" + err.message,
                    data: dataMidtrans
                });
            });
        } else {
            res.json({
                status: true,
                pesan: "Status Pembayaran: " + dataMidtrans.transaction_status,
                data: dataMidtrans
            });
        }
    });
    /*post notif di midtrans: Langkah 3-Transaksi Pembayaran */
    router.post('/notif', function(req, res, next) {
        var id_billing = req.body.order_id;
        var dataBilling = req.dataBilling;
        var dataMidtrans = req.dataMidtrans;

        if (dataBilling.transaction_status != "Terbayar") {

            //Buat data Transaksi
            var dataTrans = {
                jenis: "BAYAR",
                tanggal: new Date(),
                no_daftar: dataBilling.no_daftar,
                diterima_dari: dataBilling.nama,
                transaksi_detail: []
            }
            Promise.all(
                dataBilling.billing_detail.map(async(item) => {
                    dataTrans.transaksi_detail.push({
                        id_biaya: item.biaya.id,
                        id_coa_debit: item.biaya.id_coa,
                        id_coa_kredit: 1,
                        jumlah: item.jumlah,
                        keterangan: "Online"
                    });
                })
            );
            //proses insert transaksi di dataTrans.transaksi_detail
            //menggunakan metode transaction
            koneksi.transaction().then(function(t) {
                Transaksi.create(
                    dataMidtrans, { transaction: t }
                ).then(data => {
                    //update id_transaksi di dataTrans.transaksi_detail
                    Promise.all(
                        dataTrans.transaksi_detail.map(async(item) => {
                            item.id_transaksi = data.id
                        })
                    );
                    TransaksiDetail.bulkCreate(
                        dataTrans.transaksi_detail, { transaction: t }
                    ).then(dataDetail => {
                        Billing.update({ transaction_status: "Terbayar" }, {
                            where: { id: id_billing }
                        }, { transaction: t }).then(() => {
                            t.commit();
                            res.json({
                                status: true,
                                pesan: "Berhasil Transaksi",
                                data: dataMidtrans,
                            });
                        }).catch(err => {
                            t.rollback();
                            res.json({
                                status: false,
                                pesan: "Gagal Transaksi Detail:" + err.message,
                                data: dataMidtrans,
                            });
                        });;
                    }).catch(err => {
                        t.rollback();
                        res.json({
                            status: false,
                            pesan: "Gagal Transaksi: " + err.message,
                            data: dataMidtrans
                        });
                    }).catch(err => {
                        t.rollback();
                        res.json({
                            status: false,
                            pesan: "Gagal Transaksi Detail: " + err.message,
                            data: dataMidtrans
                        });
                    });
                }).catch(err => {
                    t.rollback();
                    res.json({
                        status: false,
                        pesan: "Gagal Transaksi Detail: " + err.message,
                        data: dataMidtrans
                    });
                });
            }); //tutup sementara
        } else {
            res.json({
                status: true,
                pesan: "Status Pembayaran: " + dataMidtrans.transaction_status,
                data: dataMidtrans
            });
        }
    });

});

module.exports = router;