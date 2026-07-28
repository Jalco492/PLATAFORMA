const mysql = require("mysql2/promise");

const connection = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "", // Déjalo vacío si no tiene contraseña
  database: "tienda", // Cambia por el nombre de tu base de datos
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log("✅ MySQL conectado");

module.exports = connection;