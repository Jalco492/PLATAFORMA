const mysql = require("mysql2/promise");

const connection = mysql.createPool({
  host: "altaria.proxy.rlwy.net",
  port: 3306,
  user: "root",
  password: "OZsiloqsOtiTdSpxnePyuRttDTFnUGKi",
  database: "railway",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log("✅ MySQL conectado");

module.exports = connection;