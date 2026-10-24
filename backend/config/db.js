const connection = mysql.createPool({
  host: "mysql-1ebced27-johanlopezcordoba9-6fef.g.aivencloud.com",
  port: 12295,
  user: "avnadmin",
  password: "AVNS_TLczsiaKbkvE5FXXOuS",
  database: "defaultdb",
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