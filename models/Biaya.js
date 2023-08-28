var koneksi = require('../koneksi');
const Sequelize = require('sequelize');
const Biaya = koneksi.define('biaya',
{
id: {
type: Sequelize.BIGINT,
allowNull: false,
primaryKey:true,
autoIncrement: true,
},
id_prodi: {
type: Sequelize.STRING,
allowNull: false
},
id_coa: {
type: Sequelize.STRING,
allowNull: false
},
id_angkatan: {
type: Sequelize.INTEGER,
allowNull: false
},
nama_biaya: {
type: Sequelize.STRING,
allowNull: false
},
jumlah: {
type: Sequelize.BIGINT,
allowNull: false
},
},
{
freezeTableName: true
}
);
module.exports = Biaya;