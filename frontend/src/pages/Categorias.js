import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";

// 🔥 FUNCIÓN PARA GENERAR URL DE IMAGEN
const getImageUrl = (imagen) => {
  if (!imagen) {
    return "https://via.placeholder.com/400x300/1e293b/60a5fa?text=Categoría";
  }

  if (imagen.startsWith("http://") || imagen.startsWith("https://")) {
    return imagen;
  }

  if (imagen.startsWith("/")) {
    return `https://backend-zuib.onrender.com${imagen}`;
  }

  return `https://backend-zuib.onrender.com/${imagen}`;
};

export default function Categorias() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState([]);
  const [productos, setProductos] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos");
    return guardados ? JSON.parse(guardados) : [];
  });
  const [subcategorias, setSubcategorias] = useState([]);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    api.get("/categorias")
      .then((res) => setCategorias(res.data))
      .catch((err) => console.log(err));
    
    api.get("/productos")
      .then((res) => setProductos(res.data))
      .catch((err) => console.log(err));
    
    api.get("/subcategorias")
      .then((res) => setSubcategorias(res.data))
      .catch((err) => console.log(err));
  }, []);

  // 🖼 OBTENER IMAGEN - VERSIÓN CORREGIDA
  const obtenerImagen = (producto) => {
    if (!producto) return "https://via.placeholder.com/400x300/1e293b/60a5fa?text=Categoría";

    let imagenUrl = "";

    if (producto.imagenes && producto.imagenes.trim() !== "") {
      imagenUrl = producto.imagenes.split(",")[0].trim();
    } else if (producto.imagen && producto.imagen.trim() !== "") {
      imagenUrl = producto.imagen.trim();
    } else {
      return "https://via.placeholder.com/400x300/1e293b/60a5fa?text=Categoría";
    }

    return getImageUrl(imagenUrl);
  };

  const toggleFavorito = (producto) => {
    const existe = favoritos.find((fav) => fav.id === producto.id);
    if (existe) {
      setFavoritos(favoritos.filter((f) => f.id !== producto.id));
    } else {
      setFavoritos([...favoritos, producto]);
    }
  };

  const esFavorito = (id) => favoritos.some((f) => f.id === id);

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

      <div style={styles.container(isMobile)}>
        <div style={styles.header}>
          <h1 style={styles.title(darkMode, isMobile)}>📂 Todas las categorías</h1>
          <p style={styles.subtitle(isMobile)}>
            Explora nuestra selección de categorías y encuentra lo que necesitas
          </p>
        </div>

        <div style={styles.grid(isMobile)}>
          {categorias.length === 0 ? (
            <p style={styles.loading}>Cargando categorías...</p>
          ) : (
            categorias.map((cat) => {
              const productosCategoria = productos.filter(
                (p) => p.categoria_id === cat.id || p.categoria === cat.nombre
              );
              const primerProducto = productosCategoria[0];
              
              // Determinar la imagen a mostrar
              let imagenUrl = "https://via.placeholder.com/400x300/1e293b/60a5fa?text=Categoría";
              if (primerProducto) {
                imagenUrl = obtenerImagen(primerProducto);
              } else if (cat.imagen) {
                imagenUrl = getImageUrl(cat.imagen);
              }
              
              return (
                <div
                  key={cat.id}
                  style={styles.card(darkMode, isMobile)}
                  onClick={() => navigate(`/categoria-id/${cat.id}`)}
                >
                  <div style={styles.cardImageWrapper}>
                    <img
                      src={imagenUrl}
                      alt={cat.nombre}
                      style={styles.cardImage}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/400x300/1e293b/60a5fa?text=Categoría";
                      }}
                    />
                    <div style={styles.cardOverlay}>
                      <span style={styles.cardIcon}>📂</span>
                      <h3 style={styles.cardTitle(isMobile)}>{cat.nombre}</h3>
                      <p style={styles.cardCount(isMobile)}>
                        {productosCategoria.length} productos
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {categorias.length > 0 && (
          <div style={styles.footerInfo}>
            <p style={styles.footerText(darkMode)}>
              Mostrando {categorias.length} categorías disponibles
            </p>
          </div>
        )}
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
}

const styles = {
  page: (darkMode) => ({
    background: darkMode ? "#0f172a" : "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: darkMode ? "#f1f5f9" : "#0f172a",
    transition: "all 0.3s ease",
  }),

  container: (isMobile) => ({
    padding: isMobile ? "140px 16px 40px 16px" : "140px 40px 60px 40px", // Aumentado padding superior
    maxWidth: "1400px",
    margin: "0 auto",
  }),

  header: {
    textAlign: "center",
    marginBottom: "40px",
  },

  title: (darkMode, isMobile) => ({
    fontSize: isMobile ? "28px" : "42px",
    fontWeight: "800",
    color: darkMode ? "#f1f5f9" : "#0f172a",
    letterSpacing: "-0.02em",
    marginBottom: "8px",
  }),

  subtitle: (isMobile) => ({
    fontSize: isMobile ? "14px" : "18px",
    color: "#64748b",
    fontWeight: "400",
  }),

  grid: (isMobile) => ({
    display: "grid",
    gridTemplateColumns: isMobile
      ? "repeat(2, 1fr)"
      : "repeat(4, 1fr)",
    gap: isMobile ? "16px" : "24px",
  }),

  loading: {
    textAlign: "center",
    fontSize: "18px",
    color: "#64748b",
    gridColumn: "1 / -1",
    padding: "40px 0",
  },

  card: (darkMode, isMobile) => ({
    borderRadius: isMobile ? "14px" : "20px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: darkMode
      ? "0 4px 20px rgba(0,0,0,0.3)"
      : "0 4px 20px rgba(0,0,0,0.06)",
    "&:hover": {
      transform: "translateY(-8px)",
      boxShadow: "0 16px 50px rgba(59,130,246,0.25)",
    },
  }),

  cardImageWrapper: {
    position: "relative",
    width: "100%",
    paddingTop: "75%",
    overflow: "hidden",
  },

  cardImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.5s ease",
  },

  cardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "16px 20px",
    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: "55%",
  },

  cardIcon: {
    fontSize: "28px",
    marginBottom: "4px",
  },

  cardTitle: (isMobile) => ({
    fontSize: isMobile ? "14px" : "20px",
    fontWeight: "700",
    margin: "0",
    textAlign: "center",
    textShadow: "0 2px 8px rgba(0,0,0,0.5)",
  }),

  cardCount: (isMobile) => ({
    fontSize: isMobile ? "11px" : "14px",
    opacity: 0.8,
    margin: "4px 0 0 0",
    textShadow: "0 2px 8px rgba(0,0,0,0.5)",
  }),

  footerInfo: {
    textAlign: "center",
    marginTop: "40px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(59,130,246,0.1)",
  },

  footerText: (darkMode) => ({
    fontSize: "14px",
    color: darkMode ? "#94a3b8" : "#64748b",
  }),
};