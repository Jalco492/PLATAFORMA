const mysql = require("mysql2/promise");

const connection = mysql.createPool({
  host: "altaria.proxy.rlwy.net",
  port: 50640,
  user: "root",
  password: "altaria.proxy.rlwy.net",
  database: "railway",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function probarConexion() {
  try {
    console.log("🔄 Probando conexión...");

    const [resultado] = await connection.query("SELECT 1");

    console.log("✅ CONEXIÓN A MYSQL CORRECTA");
    console.log(resultado);

    const [productos] = await connection.query(
      "SELECT * FROM productos LIMIT 10"
    );

    console.log("✅ TABLA PRODUCTOS CORRECTA");
    console.log("📦 Productos encontrados:", productos.length);
    console.log(productos);

  } catch (error) {
    console.error("❌ ERROR MYSQL:");
    console.error(error);
  }
}

probarConexion();

module.exports = connection;