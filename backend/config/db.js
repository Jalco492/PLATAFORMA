const mysql = require("mysql2/promise");

const connection = mysql.createPool({
  host: "altaria.proxy.rlwy.net",
  port: 42847,
  user: "root",
  password: "OZsiloqsOtiTdSpxnePyuRttDTFnUGKi",
  database: "railway",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log("✅ Configuración MySQL cargada");

async function probarConexion() {
  try {
    const [productos] = await connection.query(
      "SELECT * FROM productos LIMIT 10"
    );

    console.log("=================================");
    console.log("✅ MYSQL RAILWAY CONECTADO");
    console.log("📦 PRODUCTOS:", productos.length);
    console.log(productos);
    console.log("=================================");

  } catch (error) {
    console.error("❌ ERROR AL CONSULTAR PRODUCTOS:");
    console.error(error);
  }
}

probarConexion();