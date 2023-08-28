var koneksi = require('../koneksi');
const Sequelize = require('sequelize');
var BillingDetail = require('./BillingDetail'); //panggil model BillingDetail
const Billing = koneksi.define('billing', {
    id: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
    },
    snap_token: {
        type: Sequelize.STRING,
        allowNull: false
    },
    no_daftar: {
        type: Sequelize.STRING,
        allowNull: false
    },
    nama: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    status_code: {
        type: Sequelize.INTEGER,
        allowNull: true
    },
    transaction_status: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    freezeTableName: true
});
Billing.hasMany(BillingDetail, {
    foreignKey: 'id_billing',
    as: 'billing_detail'
});
module.exports = Billing;