import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Buscar() {
  const { texto } = useParams();
  const [productos, setProductos] = useState([]);
  const navigate = useNavigate();

  // Hook simple para detectar pantallas pequeñas y ajustar paddings de forma dinámica
  const [esMovil, setEsMovil] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setEsMovil(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    api.get("/productos").then((res) => {
      const filtrados = res.data.filter((p) => {
        const t = (texto || "").toLowerCase();
        return (
          (p.nombre || "").toLowerCase().includes(t) ||
          (p.descripcion || "").toLowerCase().includes(t) ||
          (p.categoria || "").toLowerCase().includes(t) ||
          (p.subcategoria || "").toLowerCase().includes(t)
        );
      });
      setProductos(filtrados);
    });
  }, [texto]);

  const obtenerImagen = (producto) => {
    if (producto.imagenes && producto.imagenes.trim() !== "") {
      return producto.imagenes.split(",")[0];
    }
    return producto.imagen;
  };

  return (
    <div style={{ ...styles.container, padding: esMovil ? "15px" : "30px" }}>
      <h1 style={styles.titulo}>
        🔍 Resultados para: <span style={styles.textoBusqueda}>"{texto}"</span>
      </h1>

      {productos.length === 0 ? (
        <div style={styles.sinResultados}>
          No se encontraron productos que coincidan con tu búsqueda.
        </div>
      ) : (
        <div style={styles.grid}>
          {productos.map((p) => (
            <div
              key={p.id}
              style={styles.card}
              onClick={() => navigate(`/producto/${p.id}`)}
            >
              <div style={styles.imageContainer}>
                <img
                  src={obtenerImagen(p)}
                  alt={p.nombre}
                  style={styles.image}
                />
              </div>
              <div style={styles.infoContainer}>
                <h3 style={styles.productoNombre}>{p.nombre}</h3>
                <p style={styles.descripcion}>{p.descripcion}</p>
                <h2 style={styles.precio}>${p.precio}</h2>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  titulo: {
    fontSize: "clamp(1.5rem, 4vw, 2.2rem)", // Tamaño de fuente responsivo nativo
    marginBottom: "24px",
    color: "#333",
  },
  textoBusqueda: {
    color: "#0070f3",
    fontWeight: "600",
  },
  grid: {
    display: "grid",
    // auto-fill asegura que se creen tantas columnas como quepan de mínimo 240px
    gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
    gap: "20px",
    width: "100%",
  },
  card: {
    background: "#fff",
    borderRadius: "16px",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    height: "100%", // Asegura que todas las tarjetas midan lo mismo en la misma fila
  },
  imageContainer: {
    width: "100%",
    height: "200px",
    overflow: "hidden",
    backgroundColor: "#f5f5f5",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  infoContainer: {
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1, // Empuja el precio hacia abajo si las descripciones varían en tamaño
  },
  productoNombre: {
    fontSize: "1.1rem",
    margin: "0 0 8px 0",
    color: "#222",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap", // Evita que nombres larguísimos rompan el diseño
  },
  descripcion: {
    fontSize: "0.9rem",
    color: "#666",
    margin: "0 0 16px 0",
    display: "-webkit-box",
    WebkitLineClamp: "2", // Corta el texto a 2 líneas máximo con puntos suspensivos
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    flexGrow: 1,
  },
  precio: {
    fontSize: "1.3rem",
    margin: 0,
    color: "#111",
    fontWeight: "700",
  },
  sinResultados: {
    textAlign: "center",
    padding: "40px 20px",
    color: "#777",
    fontSize: "1.1rem",
  },
};