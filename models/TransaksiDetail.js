var koneksi = require('../koneksi');
const Sequelize = require('sequelize');
var Biaya = require('./Biaya'); //panggil model Biaya
var Coa = require('./Coa'); //panggilan mode Coa
const TransaksiDetail = koneksi.define('transaksi_detail', {
    id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
    },
    id_transaksi: {
        type: Sequelize.BIGINT,
        allowNull: false
    },
    id_biaya: {
        type: Sequelize.BIGINT,
        allowNull: true
    },
    id_coa_debit: {
        type: Sequelize.STRING,
        allowNull: false
    },
    id_coa_kredit: {
        type: Sequelize.STRING,
        allowNull: false
    },
    jumlah: {
        type: Sequelize.BIGINT,
        allowNull: false
    },
    keterangan: {
        type: Sequelize.STRING,
        allowNull: true
    }
}, {
    freezeTableName: true
});
TransaksiDetail.belongsTo(
    Biaya, { foreignKey: 'id_biaya', as: 'biaya' }
);
TransaksiDetail.belongsTo(
    Coa, { foreignKey: 'id_coa_debit', as: 'coa_debit' }
);
TransaksiDetail.belongsTo(
    Coa, { foreignKey: 'id_coa_kredit', as: 'coa_kredit' }
);
module.exports = TransaksiDetail;