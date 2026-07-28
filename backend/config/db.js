const mysql = require("mysql2/promise");

const connection = mysql.createPool({
  host: "sql5.freesqldatabase.com",
  user: "sql5834019",
  password: "PyIDMXgTIf", // Déjalo vacío si no tiene contraseña
  database: "sql5834019", // Cambia por el nombre de tu base de datos
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log("✅ MySQL conectado");

module.exports = connection;