import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "./Navbar";
import Footer from "./Footer";

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

export default function Favoritos() {
  const [favoritos, setFavoritos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });
  
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isDesktop = windowWidth >= 1024;

  // 1. CARGAR DATA
  useEffect(() => {
    api.get("/productos")
      .then((res) => setProductos(res.data))
      .catch((err) => console.log(err));

    api.get("/categorias")
      .then((res) => setCategorias(res.data))
      .catch((err) => console.log(err));

    api.get("/subcategorias")
      .then((res) => setSubcategorias(res.data))
      .catch((err) => console.log(err));
  }, []);

  // 2. VINCULAR FAVORITOS
  useEffect(() => {
    const favsLocal = JSON.parse(localStorage.getItem("favoritos")) || [];
    if (productos.length > 0) {
      const datosActualizados = favsLocal
        .map(fav => productos.find(p => p.id === fav.id))
        .filter(p => p !== undefined);
      setFavoritos(datosActualizados);
    } else {
      setFavoritos(favsLocal);
    }
  }, [productos]);

  const eliminarFavorito = (id) => {
    const nuevos = favoritos.filter(f => f.id !== id);
    setFavoritos(nuevos);
    localStorage.setItem("favoritos", JSON.stringify(nuevos));
  };

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

  // Función para toggle favorito desde el navbar
  const toggleFavorito = (producto) => {
    const existe = favoritos.some(f => f.id === producto.id);
    let nuevos;
    if (existe) {
      nuevos = favoritos.filter(f => f.id !== producto.id);
    } else {
      nuevos = [...favoritos, producto];
    }
    setFavoritos(nuevos);
    localStorage.setItem("favoritos", JSON.stringify(nuevos));
  };

  const esFavorito = (id) => favoritos.some(f => f.id === id);

  return (
    <div style={styles.page(darkMode)}>
      <Navbar
        categorias={categorias}
        subcategorias={subcategorias}
        productos={productos}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        favoritos={favoritos}
        esFavorito={esFavorito}
        toggleFavorito={toggleFavorito}
      />

      <div style={styles.container(isDesktop)}>
        
        <div style={styles.header}>
          <div>
            <h1 style={styles.title(darkMode, isMobile)}>❤️ Mis Favoritos</h1>
            <p style={styles.subtitle}>Tus productos guardados</p>
          </div>
          <div style={styles.counter}>
            {favoritos.length} {favoritos.length === 1 ? "prod" : "prods"}
          </div>
        </div>

        {favoritos.length === 0 && (
          <div style={styles.emptyBox(darkMode)}>
            <div style={styles.emptyIcon}>🤍</div>
            <h2 style={styles.emptyTitle(darkMode, isMobile)}>Tu lista está vacía</h2>
            <p style={styles.emptyText(darkMode)}>Explora nuestra tienda y añade tus productos favoritos.</p>
            <button
              style={styles.shopBtn(darkMode)}
              onClick={() => navigate("/productos")}
            >
              🛍 Ver productos
            </button>
          </div>
        )}

        {favoritos.length > 0 && (
          <div style={styles.grid(windowWidth)}>
            {favoritos.map(p => (
              <div
                key={p.id}
                style={styles.card(darkMode)}
                onClick={() => navigate(`/producto/${p.id}`)}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    eliminarFavorito(p.id);
                  }}
                  style={styles.removeBtn(isMobile)}
                >
                  ❤️
                </button>

                <div style={styles.imageContainer(isMobile)}>
                  <img
                    src={obtenerImagen(p)}
                    alt={p.nombre}
                    style={styles.image}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/300x300?text=Sin+Imagen";
                    }}
                  />
                </div>

                <div style={styles.info(isMobile)}>
                  <div style={styles.tags}>
                    {p.categoria && <span style={styles.tag}>📂 {p.categoria.slice(0, 10)}</span>}
                  </div>

                  <h3 style={styles.name(darkMode, isMobile)}>{p.nombre}</h3>

                  {!isMobile && (
                    <p style={styles.desc(darkMode)}>
                      {p.descripcion?.slice(0, 45) || "Sin descripción"}...
                    </p>
                  )}

                  {(p.oferta === 1 || p.oferta === true) ? (
                    <div>
                      <span style={styles.oldPrice}>${p.precio}</span>
                      <h2 style={styles.offerPrice(isMobile)}>${p.precioOferta}</h2>
                    </div>
                  ) : (
                    <h2 style={styles.price(darkMode, isMobile)}>${p.precio}</h2>
                  )}

                  <div style={styles.actions}>
                    <button
                      style={styles.viewBtn(isMobile)}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/producto/${p.id}`);
                      }}
                    >
                      Ver
                    </button>
                    <button
                      style={styles.deleteBtn(isMobile)}
                      onClick={(e) => {
                        e.stopPropagation();
                        eliminarFavorito(p.id);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
}

const styles = {
  page: (darkMode) => ({
    background: darkMode ? "#0f172a" : "#f4f6f9",
    minHeight: "100vh",
    fontFamily: "Arial, sans-serif",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  }),

  container: (isDesktop) => ({
    maxWidth: isDesktop ? "1440px" : "1100px",
    width: "100%",
    margin: "0 auto",
    padding: "140px 10px 20px 10px", // 🔥 AUMENTADO el padding-top
    boxSizing: "border-box",
    flexGrow: 1
  }),

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "10px"
  },

  title: (darkMode, isMobile) => ({
    margin: 0,
    fontSize: isMobile ? "22px" : "36px",
    color: darkMode ? "#fff" : "#111",
    fontWeight: "bold"
  }),

  subtitle: {
    marginTop: "4px",
    color: "#666",
    fontSize: "13px"
  },

  counter: {
    background: "#111",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "8px",
    fontWeight: "bold",
    fontSize: "13px",
  },

  grid: (windowWidth) => ({
    display: "grid",
    gridTemplateColumns: windowWidth < 600 
      ? "repeat(2, 1fr)" 
      : windowWidth < 1024 
        ? "repeat(3, 1fr)" 
        : "repeat(6, 1fr)",
    gap: windowWidth < 600 ? "10px" : "16px"
  }),

  card: (darkMode) => ({
    background: darkMode ? "#1e293b" : "#fff",
    borderRadius: "14px",
    overflow: "hidden",
    cursor: "pointer",
    position: "relative",
    boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    transition: "transform 0.2s ease, box-shadow 0.2s ease",
    '&:hover': {
      transform: "translateY(-4px)",
      boxShadow: "0 8px 25px rgba(0,0,0,0.1)"
    }
  }),

  imageContainer: (isMobile) => ({
    width: "100%",
    height: isMobile ? "120px" : "160px",
    overflow: "hidden",
    background: "#f3f3f3"
  }),

  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    padding: "8px",
    background: "#fafafa"
  },

  info: (isMobile) => ({
    padding: isMobile ? "8px" : "12px",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1
  }),

  name: (darkMode, isMobile) => ({
    fontSize: isMobile ? "13px" : "14px",
    fontWeight: "bold",
    marginBottom: "4px",
    color: darkMode ? "#fff" : "#111",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis"
  }),

  desc: (darkMode) => ({
    color: darkMode ? "#94a3b8" : "#777",
    lineHeight: "1.4",
    fontSize: "11px",
    minHeight: "32px",
    marginBottom: "10px"
  }),

  price: (darkMode, isMobile) => ({
    color: darkMode ? "#60a5fa" : "#16a34a",
    fontSize: isMobile ? "15px" : "18px",
    margin: "4px 0",
    fontWeight: "bold"
  }),

  oldPrice: {
    textDecoration: "line-through",
    color: "#999",
    fontSize: "11px"
  },

  offerPrice: (isMobile) => ({
    color: "#dc2626",
    fontSize: isMobile ? "16px" : "20px",
    margin: "2px 0",
    fontWeight: "bold"
  }),

  tags: {
    display: "flex",
    gap: "4px",
    marginBottom: "4px",
    flexWrap: "wrap"
  },

  tag: {
    background: "#e0f2fe",
    color: "#0369a1",
    padding: "2px 5px",
    borderRadius: "4px",
    fontSize: "9px",
    fontWeight: "bold"
  },

  actions: {
    display: "flex",
    gap: "4px",
    marginTop: "auto"
  },

  viewBtn: (isMobile) => ({
    flex: 2,
    background: "#111",
    color: "#fff",
    border: "none",
    padding: isMobile ? "6px" : "8px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: isMobile ? "11px" : "12px",
    transition: "background 0.2s ease",
    '&:hover': {
      background: "#333"
    }
  }),

  deleteBtn: (isMobile) => ({
    flex: 1,
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: isMobile ? "6px" : "8px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: isMobile ? "11px" : "12px",
    transition: "background 0.2s ease",
    '&:hover': {
      background: "#fecaca"
    }
  }),

  removeBtn: (isMobile) => ({
    position: "absolute",
    top: "6px",
    right: "6px",
    width: isMobile ? "28px" : "32px",
    height: isMobile ? "28px" : "32px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(255,255,255,0.9)",
    cursor: "pointer",
    fontSize: isMobile ? "12px" : "14px",
    zIndex: 10,
    boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    transition: "transform 0.2s ease",
    '&:hover': {
      transform: "scale(1.1)"
    }
  }),

  emptyBox: (darkMode) => ({
    background: darkMode ? "#1e293b" : "#fff",
    borderRadius: "20px",
    padding: "50px 20px",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(0,0,0,0.05)"
  }),

  emptyIcon: {
    fontSize: "50px",
    marginBottom: "10px"
  },

  emptyTitle: (darkMode, isMobile) => ({
    fontSize: isMobile ? "20px" : "26px",
    marginBottom: "10px",
    color: darkMode ? "#fff" : "#111"
  }),

  emptyText: (darkMode) => ({
    color: darkMode ? "#cbd5e1" : "#666",
    fontSize: "14px",
    marginBottom: "20px"
  }),

  shopBtn: (darkMode) => ({
    background: darkMode ? "#334155" : "#111",
    color: "#fff",
    border: "none",
    padding: "12px 20px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px",
    transition: "background 0.2s ease, transform 0.2s ease",
    '&:hover': {
      transform: "scale(1.02)",
      background: darkMode ? "#475569" : "#222"
    }
  })
};