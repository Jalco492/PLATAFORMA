import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import Navbar from "./Navbar";
import Footer from "./Footer";

// 🔥 FUNCIÓN PARA GENERAR URL DE IMAGEN (misma que en Categorias)
const getImageUrl = (imagen) => {
  if (!imagen) {
    return "https://via.placeholder.com/400x300/1e293b/60a5fa?text=Producto";
  }

  if (imagen.startsWith("http://") || imagen.startsWith("https://")) {
    return imagen;
  }

  if (imagen.startsWith("/")) {
    return `https://backend-zuib.onrender.com${imagen}`;
  }

  return `https://backend-zuib.onrender.com/${imagen}`;
};

export default function ProductosPorTipo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [tipo, setTipo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos");
    return guardados ? JSON.parse(guardados) : [];
  });
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // Cargar datos de navegación
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [productosTodos, setProductosTodos] = useState([]);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    const cargarDatosNavegacion = async () => {
      try {
        const [catRes, subRes, tipoRes, prodRes] = await Promise.all([
          api.get("/categorias"),
          api.get("/subcategorias"),
          api.get("/tipos"),
          api.get("/productos"),
        ]);
        setCategorias(catRes.data);
        setSubcategorias(subRes.data);
        setTipos(tipoRes.data);
        setProductosTodos(prodRes.data);
      } catch (error) {
        console.error("Error cargando datos de navegación:", error);
      }
    };
    cargarDatosNavegacion();
  }, []);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Primero obtener el tipo por ID
        const tipoRes = await api.get(`/tipos/${id}`);
        setTipo(tipoRes.data);
        
        // Luego obtener los productos de ese tipo
        const productosRes = await api.get(`/productos/tipo/${id}`);
        setProductos(productosRes.data);
        
      } catch (error) {
        console.error("Error cargando productos por tipo:", error);
        setError("No se pudieron cargar los productos. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      cargarProductos();
    }
  }, [id]);

  // ========== FUNCIONES ==========

  const toggleFavorito = (producto) => {
    const existe = favoritos.find((fav) => fav.id === producto.id);
    if (existe) {
      setFavoritos(favoritos.filter((f) => f.id !== producto.id));
    } else {
      setFavoritos([...favoritos, producto]);
    }
  };

  const esFavorito = (id) => favoritos.some((f) => f.id === id);

  // 🖼 OBTENER IMAGEN - VERSIÓN CORREGIDA (misma que en Categorias)
  const obtenerImagen = (producto) => {
    if (!producto) return "https://via.placeholder.com/400x300/1e293b/60a5fa?text=Producto";

    let imagenUrl = "";

    if (producto.imagenes && producto.imagenes.trim() !== "") {
      imagenUrl = producto.imagenes.split(",")[0].trim();
    } else if (producto.imagen && producto.imagen.trim() !== "") {
      imagenUrl = producto.imagen.trim();
    } else {
      return "https://via.placeholder.com/400x300/1e293b/60a5fa?text=Producto";
    }

    return getImageUrl(imagenUrl);
  };

  // Guardar favoritos en localStorage
  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  if (loading) {
    return (
      <div style={styles.page(darkMode)}>
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          productos={productosTodos}
          categorias={categorias}
          subcategorias={subcategorias}
          tipos={tipos}
          favoritos={favoritos}
          toggleFavorito={toggleFavorito}
          esFavorito={esFavorito}
        />
        <div style={styles.loadingContainer}>
          <h2 style={styles.loadingText(darkMode)}>Cargando productos...</h2>
        </div>
        <Footer darkMode={darkMode} />
      </div>
    );
  }

  if (error || !tipo) {
    return (
      <div style={styles.page(darkMode)}>
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          productos={productosTodos}
          categorias={categorias}
          subcategorias={subcategorias}
          tipos={tipos}
          favoritos={favoritos}
          toggleFavorito={toggleFavorito}
          esFavorito={esFavorito}
        />
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>❌ Tipo no encontrado</h2>
          <p style={styles.errorText(darkMode)}>El tipo que buscas no existe o ha sido eliminado.</p>
          <button 
            onClick={() => navigate(-1)}
            style={styles.backButton}
          >
            ← Volver atrás
          </button>
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
        productos={productosTodos}
        categorias={categorias}
        subcategorias={subcategorias}
        tipos={tipos}
        favoritos={favoritos}
        toggleFavorito={toggleFavorito}
        esFavorito={esFavorito}
      />

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header(darkMode)}>
          <h1 style={styles.title(darkMode)}>
            📦 Productos de tipo: <span style={styles.tipoNombre}>{tipo.nombre}</span>
          </h1>
          <p style={styles.subtitle(darkMode)}>
            {productos.length} {productos.length === 1 ? "producto disponible" : "productos disponibles"}
          </p>
          {tipo.subcategoria && (
            <p style={styles.breadcrumb(darkMode)}>
              Subcategoría: <strong>{tipo.subcategoria}</strong>
              {tipo.categoria && ` · Categoría: ${tipo.categoria}`}
            </p>
          )}
        </div>

        {/* Grid de productos */}
        {productos.length > 0 ? (
          <div style={styles.grid}>
            {productos.map((p) => (
              <div
                key={p.id}
                style={styles.card}
                onClick={() => navigate(`/producto/${p.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "0 15px 40px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
                }}
              >
                {/* Botón favoritos */}
                <button
                  style={styles.favButton(esFavorito(p.id))}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorito(p);
                  }}
                >
                  ❤️
                </button>

                {/* Badges */}
                <div style={styles.badges}>
                  {p.rebaja === 1 && (
                    <span style={styles.badgeRebaja}>REBAJA</span>
                  )}
                  {p.destacado === 1 && (
                    <span style={styles.badgeDestacado}>DESTACADO</span>
                  )}
                </div>

                <img
                  src={obtenerImagen(p)}
                  alt={p.nombre}
                  style={styles.productImage}
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/400x300/1e293b/60a5fa?text=Producto";
                  }}
                />
                
                <h4 style={styles.productName}>{p.nombre}</h4>
                
                {p.sku && (
                  <p style={styles.productSku}>SKU: {p.sku}</p>
                )}
                
                {p.oferta === 1 ? (
                  <div style={styles.priceContainer}>
                    <span style={styles.oldPrice}>${p.precio}</span>
                    <p style={styles.offerPrice}>${p.precioOferta}</p>
                  </div>
                ) : (
                  <p style={styles.normalPrice}>${p.precio}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.emptyState(darkMode)}>
            <p style={styles.emptyTitle}>🔍 No hay productos disponibles para este tipo</p>
            <p style={styles.emptyText(darkMode)}>
              No se encontraron productos en <strong>{tipo.nombre}</strong>
            </p>
            <button 
              onClick={() => navigate(-1)}
              style={styles.backButton}
            >
              ← Volver atrás
            </button>
          </div>
        )}
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
}

// ========== ESTILOS ==========

const styles = {
  page: (darkMode) => ({
    background: darkMode ? "#0f172a" : "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    color: darkMode ? "#f1f5f9" : "#0f172a",
    transition: "all 0.3s ease",
  }),

  container: {
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "140px 20px 60px 20px",
    minHeight: "60vh",
  },

  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "60vh",
  },

  loadingText: (darkMode) => ({
    color: darkMode ? "#f1f5f9" : "#0f172a",
  }),

  errorContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "60vh",
    flexDirection: "column",
    padding: "20px",
  },

  errorTitle: {
    color: "#dc2626",
    fontSize: "28px",
    marginBottom: "10px",
  },

  errorText: (darkMode) => ({
    color: darkMode ? "#94a3b8" : "#6b7280",
  }),

  header: (darkMode) => ({
    marginBottom: "30px",
    borderBottom: `1px solid ${darkMode ? "#1e293b" : "#e5e7eb"}`,
    paddingBottom: "20px",
  }),

  title: (darkMode) => ({
    fontSize: "36px",
    fontWeight: "800",
    color: darkMode ? "#f1f5f9" : "#111827",
    marginBottom: "5px",
  }),

  tipoNombre: {
    color: "#0ea5e9",
  },

  subtitle: (darkMode) => ({
    color: darkMode ? "#94a3b8" : "#6b7280",
    fontSize: "16px",
  }),

  breadcrumb: (darkMode) => ({
    color: darkMode ? "#94a3b8" : "#6b7280",
    fontSize: "14px",
    marginTop: "5px",
  }),

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
    gap: "24px",
  },

  card: {
    background: "#fff",
    borderRadius: "20px",
    padding: "16px",
    cursor: "pointer",
    border: "1px solid #e5e7eb",
    transition: "all 0.3s ease",
    textAlign: "center",
    position: "relative",
    boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
  },

  favButton: (esFavorito) => ({
    position: "absolute",
    top: "10px",
    right: "10px",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    fontSize: "16px",
    cursor: "pointer",
    background: esFavorito ? "#dc2626" : "#fff",
    color: esFavorito ? "#fff" : "#111",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    zIndex: "5",
  }),

  badges: {
    position: "absolute",
    top: "10px",
    left: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    zIndex: "5",
  },

  badgeRebaja: {
    background: "#dc2626",
    color: "#fff",
    padding: "2px 10px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "bold",
  },

  badgeDestacado: {
    background: "#111827",
    color: "#fff",
    padding: "2px 10px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "bold",
  },

  productImage: {
    width: "100%",
    height: "160px",
    objectFit: "contain",
    borderRadius: "12px",
    background: "#f9fafb",
    marginBottom: "12px",
  },

  productName: {
    margin: "0 0 4px 0",
    fontSize: "14px",
    fontWeight: "600",
    color: "#111827",
    lineHeight: "1.2",
    display: "-webkit-box",
    WebkitLineClamp: "2",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    height: "34px",
  },

  productSku: {
    fontSize: "12px",
    color: "#9ca3af",
    margin: "0 0 8px 0",
  },

  priceContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },

  oldPrice: {
    textDecoration: "line-through",
    color: "#9ca3af",
    fontSize: "14px",
  },

  offerPrice: {
    color: "#dc2626",
    fontWeight: "bold",
    fontSize: "20px",
    margin: "0",
  },

  normalPrice: {
    color: "#16a34a",
    fontWeight: "bold",
    fontSize: "20px",
    margin: "0",
  },

  emptyState: (darkMode) => ({
    textAlign: "center",
    padding: "80px 20px",
    background: darkMode ? "#1e293b" : "#f9fafb",
    borderRadius: "16px",
  }),

  emptyTitle: {
    fontSize: "20px",
    marginBottom: "10px",
    color: "#6b7280",
  },

  emptyText: (darkMode) => ({
    fontSize: "14px",
    color: darkMode ? "#94a3b8" : "#6b7280",
  }),

  backButton: {
    marginTop: "20px",
    padding: "12px 24px",
    background: "#111827",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "14px",
    transition: "all 0.3s ease",
  },
};