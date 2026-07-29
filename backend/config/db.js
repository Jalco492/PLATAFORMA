const mysql = require("mysql2/promise");

const connection = mysql.createPool({
  host: "sakura.proxy.rlwy.net",
  port: 45872,
  user: "root",
  password: "RHBnhnoykHRNcaszqyEDwSMaaKQeWnLS",
  database: "railway",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log("✅ MySQL conectado");

module.exports = connection;