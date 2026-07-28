import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

export default function Simulador() {
  const { id } = useParams();

  const [producto, setProducto] = useState(null);
  const [largo, setLargo] = useState("");
  const [ancho, setAncho] = useState("");
  const [desperdicio, setDesperdicio] = useState(0);

  useEffect(() => {
    api.get(`/productos/${id}`).then(res => setProducto(res.data));
  }, [id]);

  if (!producto) return <h2>Cargando...</h2>;

  // 📐 ÁREA CLIENTE
  const areaCliente = Number(largo) * Number(ancho);
  const areaTotal = areaCliente * (1 + desperdicio / 100);

  // 📦 PRODUCTO
  const areaPieza =
    Number(producto.ancho) * Number(producto.alto);

  const piezasCaja = Number(producto.piezasCaja || 1);

  const coberturaUnidad =
    producto.tipoVenta === "caja"
      ? areaPieza * piezasCaja
      : areaPieza;

  // 🧮 PIEZAS NECESARIAS (REAL)
  const piezasNecesarias = Math.ceil(areaTotal / coberturaUnidad);

  // 🧠 GRID SOLO DEL ÁREA (NO DEL MATERIAL)
  const cols = Math.max(1, Math.floor(Number(ancho)));
  const rows = Math.max(1, Math.floor(Number(largo)));

  const totalCeldas = cols * rows;

  // 🧩 SOLO MOSTRAR PIEZAS NECESARIAS
  const piezasRender = Math.min(piezasNecesarias, totalCeldas);

  return (
    <div style={{ padding: 20 }}>

      <h2>🏗 Simulador Arquitectónico Real</h2>

      {/* INPUTS */}
      <div style={{ display: "flex", gap: 10 }}>
        <input placeholder="Largo (m)" onChange={e => setLargo(e.target.value)} />
        <input placeholder="Ancho (m)" onChange={e => setAncho(e.target.value)} />
      </div>

      {/* DESPERDICIO */}
      <div style={{ marginTop: 10 }}>
        {[0, 5, 10, 15].map(p => (
          <button key={p} onClick={() => setDesperdicio(p)}>
            {p}%
          </button>
        ))}
      </div>

      {/* INFO */}
      {areaCliente > 0 && (
        <h3>
          Área: {areaCliente.toFixed(2)} m² | Con desperdicio: {areaTotal.toFixed(2)} m²
        </h3>
      )}

      {/* 🏗 ÁREA REAL (GRID) */}
      {areaCliente > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 60px)`,
            gridTemplateRows: `repeat(${rows}, 60px)`,
            border: "3px solid #111",
            marginTop: 20
          }}
        >

          {Array.from({ length: totalCeldas }).map((_, i) => (
            <div
              key={i}
              style={{
                border: "1px solid #ddd",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                background: "#f9fafb"
              }}
            >
              {i < piezasRender ? "🧩" : ""}
            </div>
          ))}

        </div>
      )}

      {/* RESULTADOS */}
      {areaCliente > 0 && (
        <div style={{ marginTop: 20 }}>

          <p><strong>Tipo:</strong> {producto.tipoVenta}</p>
          <p><strong>Piezas necesarias:</strong> {piezasNecesarias}</p>

          {piezasNecesarias <= totalCeldas ? (
            <p style={{ color: "green", fontWeight: "bold" }}>
              ✅ Sí alcanza el material
            </p>
          ) : (
            <p style={{ color: "red", fontWeight: "bold" }}>
              ⚠ No alcanza el material
            </p>
          )}

        </div>
      )}

    </div>
  );
}