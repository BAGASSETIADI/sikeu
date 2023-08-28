var koneksi = require('../koneksi');
const Sequelize = require('sequelize');
var Biaya = require('./Biaya'); //panggil model Biaya
const BillingDetail = koneksi.define('billing_detail', {
    id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
    },
    id_billing: {
        type: Sequelize.STRING,
        allowNull: false
    },
    id_biaya: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    nama_biaya: {
        type: Sequelize.STRING,
        allowNull: false
    },
    jumlah: {
        type: Sequelize.BIGINT,
        allowNull: false
    }
}, {
    freezeTableName: true
});
BillingDetail.belongsTo(Biaya, {
    foreignKey: 'id_biaya',
    as: 'biaya'
});
module.exports = BillingDetail;