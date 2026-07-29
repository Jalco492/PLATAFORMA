// MasVendidos.js
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Footer from "./Footer";
import Navbar from "./Navbar";

// 🔥 FUNCIÓN PARA GENERAR URL DE IMAGEN
const getImageUrl = (imagen) => {
  if (!imagen) {
    return "https://via.placeholder.com/300x300?text=Sin+Imagen";
  }

  if (imagen.startsWith("http://") || imagen.startsWith("https://")) {
    return imagen;
  }

  if (imagen.startsWith("/")) {
    return `https://backend-zuib.onrender.com${imagen}`;
  }

  return `https://backend-zuib.onrender.com/${imagen}`;
};

export default function MasVendidos() {
  const [productosOferta, setProductosOferta] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos");
    return guardados ? JSON.parse(guardados) : [];
  });
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      try {
        const [productosRes, categoriasRes, subcategoriasRes] = await Promise.all([
          api.get("/productos"),
          api.get("/categorias"),
          api.get("/subcategorias"),
        ]);

        setProductos(productosRes.data);
        setCategorias(categoriasRes.data);
        setSubcategorias(subcategoriasRes.data);

        // Filtrar productos en oferta
        const oferta = productosRes.data.filter(
          (p) =>
            p.oferta === 1 ||
            p.oferta === true ||
            p.rebaja === 1 ||
            p.rebaja === true
        );
        setProductosOferta(oferta);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  const toggleFavorito = (producto) => {
    const existe = favoritos.find((fav) => fav.id === producto.id);
    if (existe) {
      setFavoritos(favoritos.filter((f) => f.id !== producto.id));
    } else {
      setFavoritos([...favoritos, producto]);
    }
  };

  const esFavorito = (id) => favoritos.some((f) => f.id === id);

  // 🖼 OBTENER IMAGEN - VERSIÓN CORREGIDA
  const obtenerImagen = (producto) => {
    if (!producto) return "https://via.placeholder.com/300x300?text=Sin+Imagen";

    let imagenUrl = "";

    if (producto.imagenes && producto.imagenes.trim() !== "") {
      imagenUrl = producto.imagenes.split(",")[0].trim();
    } else if (producto.imagen && producto.imagen.trim() !== "") {
      imagenUrl = producto.imagen.trim();
    } else {
      return "https://via.placeholder.com/300x300?text=Sin+Imagen";
    }

    return getImageUrl(imagenUrl);
  };

  if (cargando) {
    return (
      <div style={styles.page(darkMode)}>
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          favoritos={favoritos}
          productos={productos}
          toggleFavorito={toggleFavorito}
          esFavorito={esFavorito}
          categorias={categorias}
          subcategorias={subcategorias}
        />
        <div style={styles.loaderContainer}>
          <div style={styles.loader}></div>
          <p style={styles.loaderText}>Cargando productos en oferta...</p>
        </div>
        <Footer darkMode={darkMode} />
      </div>
    );
  }

  return (
    <div style={styles.page(darkMode)}>
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        favoritos={favoritos}
        productos={productos}
        toggleFavorito={toggleFavorito}
        esFavorito={esFavorito}
        categorias={categorias}
        subcategorias={subcategorias}
      />

      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title(darkMode)}>🔥 Productos en Oferta</h1>
          <p style={styles.subtitle}>
            {productosOferta.length} productos con descuentos especiales
          </p>
        </div>

        <div style={styles.grid}>
          {productosOferta.map((p, index) => (
            <div
              key={p.id}
              style={styles.card(darkMode)}
              onClick={() => navigate(`/producto/${p.id}`)}
              className="card-animated"
              style={{
                ...styles.card(darkMode),
                animationDelay: `${index * 0.05}s`
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorito(p);
                }}
                style={{
                  ...styles.favBtn,
                  background: esFavorito(p.id) ? "#dc2626" : "#fff",
                  color: esFavorito(p.id) ? "#fff" : "#111",
                }}
              >
                ❤️
              </button>
              <div style={styles.badge}>🔥 OFERTA</div>
              <img
                src={obtenerImagen(p)}
                alt={p.nombre}
                style={styles.image}
                loading="lazy"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/300x300?text=Sin+Imagen";
                }}
              />
              <h3 style={styles.productName(darkMode)}>{p.nombre}</h3>
              <div style={styles.prices}>
                <span style={styles.oldPrice}>${p.precio}</span>
                <span style={styles.newPrice}>
                  ${p.precioOferta || p.precio}
                </span>
              </div>
              <div style={styles.btn}>Ver producto →</div>
            </div>
          ))}
        </div>

        {productosOferta.length === 0 && (
          <div style={styles.emptyState}>
            <p>No hay productos en oferta disponibles</p>
            <button
              style={styles.emptyBtn}
              onClick={() => navigate("/")}
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>

      <Footer darkMode={darkMode} />

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes cardFadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .card-animated {
          opacity: 0;
          animation: cardFadeUp 0.6s ease forwards;
        }

        .card-animated:hover {
          transform: translateY(-6px) !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important;
        }

        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
        }

        @media (prefers-reduced-motion: reduce) {
          .card-animated {
            animation: none !important;
            opacity: 1 !important;
          }
        }

        @media (max-width: 768px) {
          .card-animated {
            animation-duration: 0.4s;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: (darkMode) => ({
    background: darkMode 
      ? "linear-gradient(180deg, #0f172a 0%, #1a2332 30%, #0f172a 60%, #1a2332 100%)"
      : "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 30%, #f1f5f9 60%, #e2e8f0 100%)",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    overflowX: "hidden",
    color: darkMode ? "#f1f5f9" : "#0f172a",
    transition: "all 0.3s ease",
  }),

  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "20px",
  },

  loader: {
    width: "50px",
    height: "50px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  loaderText: {
    color: "#64748b",
    fontSize: "16px",
    fontWeight: "500",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "140px 20px 60px", // Aumentado el padding superior
  },

  header: {
    textAlign: "center",
    marginBottom: "40px",
  },

  title: (darkMode) => ({
    fontSize: "36px",
    fontWeight: "800",
    marginBottom: "8px",
    color: darkMode ? "#f1f5f9" : "#0f172a",
    letterSpacing: "-0.02em",
  }),

  subtitle: {
    fontSize: "18px",
    color: "#64748b",
    fontWeight: "400",
  },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))",
    gap: "24px",
  },

  card: (darkMode) => ({
    background: darkMode
      ? "rgba(30, 41, 59, 0.8)"
      : "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    padding: "18px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    border: darkMode
      ? "1px solid rgba(255,255,255,0.1)"
      : "1px solid rgba(0,0,0,0.06)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
  }),

  favBtn: {
    position: "absolute",
    top: "12px",
    right: "12px",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
    transition: "all 0.2s ease",
  },

  badge: {
    position: "absolute",
    top: "12px",
    left: "12px",
    background: "linear-gradient(135deg, #dc2626, #b91c1c)",
    color: "#fff",
    padding: "4px 14px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    zIndex: 10,
    letterSpacing: "0.3px",
    boxShadow: "0 2px 10px rgba(220,38,38,0.4)",
  },

  image: {
    width: "100%",
    height: "200px",
    objectFit: "contain",
    borderRadius: "12px",
    marginBottom: "12px",
    background: "rgba(255,255,255,0.3)",
    padding: "8px",
  },

  productName: (darkMode) => ({
    fontSize: "16px",
    fontWeight: "600",
    margin: "4px 0",
    textAlign: "center",
    color: darkMode ? "#f1f5f9" : "#0f172a",
    lineHeight: "1.3",
  }),

  prices: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "4px",
  },

  oldPrice: {
    color: "#94a3b8",
    textDecoration: "line-through",
    fontSize: "15px",
  },

  newPrice: {
    color: "#dc2626",
    fontWeight: "700",
    fontSize: "22px",
  },

  btn: {
    marginTop: "12px",
    padding: "8px 20px",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#fff",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "600",
    transition: "all 0.3s ease",
    cursor: "pointer",
    width: "100%",
    textAlign: "center",
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "300px",
    gap: "20px",
  },

  emptyBtn: {
    padding: "12px 32px",
    fontSize: "16px",
    fontWeight: "600",
    color: "#fff",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 20px rgba(59,130,246,0.25)",
  },
};