var koneksi = require('../koneksi');
const Sequelize = require('sequelize');
const Coa = koneksi.define('coa', {
    kode: {
        type: Sequelize.STRING,
        allowNull: false,
        primaryKey: true
    },
    nama_coa: {
        type: Sequelize.STRING,
        allowNull: false
    },
}, {
    freezeTableName: true
});
module.exports = Coa;