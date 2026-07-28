const mysql = require("mysql2/promise");

const connection = mysql.createPool({
  host: "sakura.proxy.rlwy.net",
  user: "root",
  password: "QHEQhXsonjshFWxDWDHlTXyJxvdRXxFq", // Déjalo vacío si no tiene contraseña
  database: "railway", // Cambia por el nombre de tu base de datos
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log("✅ MySQL conectado");

module.exports = connection;