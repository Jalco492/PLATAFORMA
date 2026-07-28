const mysql = require("mysql2/promise");

const connection = mysql.createPool({
  host: "maglev.proxy.rlwy.net",
  port: 30404,
  user: "root",
  password: "tWxOkTZbnEgsklCofROEbMlAhmkTRAWR",
  database: "railway",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log("✅ MySQL conectado");

module.exports = connection;