const Sequelize = require('sequelize');
const koneksiDB = new Sequelize('siakad_udb', 'root', '', {
    host: 'localhost',
    dialect: 'mysql'
});
try {
    koneksiDB.authenticate();
    console.log('Koneksi SIAKAD Berhasil.');
} catch (error) {
    console.error('Gagal Koneksi SIAKAD:', error);
}
module.exports = koneksiDB;