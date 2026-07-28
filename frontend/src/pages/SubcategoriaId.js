// pages/SubcategoriaId.jsx
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function SubcategoriaId() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [productosBusqueda, setProductosBusqueda] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [subcategoriaNombre, setSubcategoriaNombre] = useState("");
  const [cargando, setCargando] = useState(true);

  // ❤️ FAVORITOS
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos");
    return guardados ? JSON.parse(guardados) : [];
  });

  // 🌙 DARK MODE
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // 📱 DETECTOR RESPONSIVO
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // 🔄 CARGAR PRODUCTOS POR ID DE SUBCATEGORÍA
  useEffect(() => {
    if (!id) return;
    
    setCargando(true);
    
    // Obtener productos
    api.get(`/productos/subcategoria-id/${id}`)
      .then(res => {
        setProductos(res.data);
        setCargando(false);
      })
      .catch(err => {
        console.log(err);
        setCargando(false);
      });
    
    // Obtener el nombre de la subcategoría
    api.get(`/subcategorias/${id}`)
      .then(res => {
        setSubcategoriaNombre(res.data.nombre);
      })
      .catch(err => console.log(err));
  }, [id]);

  // 💾 GUARDAR FAVORITOS
  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  // 🖼 OBTENER IMAGEN
  const obtenerImagen = (producto) => {
    if (producto.imagenes && producto.imagenes.trim() !== "") {
      return producto.imagenes.split(",")[0];
    }
    return producto.imagen;
  };

  // ❤️ TOGGLE FAVORITO
  const toggleFavorito = (producto) => {
    const productoCompleto = {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      imagen: obtenerImagen(producto)
    };

    const existe = favoritos.find(fav => Number(fav.id) === Number(producto.id));

    if (existe) {
      setFavoritos(favoritos.filter(f => Number(f.id) !== Number(producto.id)));
    } else {
      setFavoritos([...favoritos, productoCompleto]);
    }
  };

  // ❤️ VALIDAR FAVORITO
  const esFavorito = (id) => favoritos.some(f => Number(f.id) === Number(id));

  // 🔍 CARGAR OTROS DATOS COMPLEMENTARIOS
  useEffect(() => {
    api.get("/productos").then((res) => setProductosBusqueda(res.data)).catch(console.log);
    api.get("/categorias").then((res) => setCategorias(res.data)).catch(console.log);
    api.get("/subcategorias").then((res) => setSubcategorias(res.data)).catch(console.log);
  }, []);

  if (cargando) {
    return (
      <div style={styles.page(darkMode)}>
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          favoritos={favoritos}
          productos={productosBusqueda}
          toggleFavorito={toggleFavorito}
          esFavorito={esFavorito}
          categorias={categorias}
          subcategorias={subcategorias}
          isMobile={isMobile}
        />
        <div style={styles.loadingContainer}>
          <h2>Cargando productos...</h2>
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
        productos={productosBusqueda}
        toggleFavorito={toggleFavorito}
        esFavorito={esFavorito}
        categorias={categorias}
        subcategorias={subcategorias}
        isMobile={isMobile}
      />

      <div style={styles.container(isMobile)}>
        {/* ENCABEZADO */}
        <div style={styles.header(isMobile)}>
          <span style={styles.topBadge}>💎 SUBCATEGORÍA</span>
          <h1 style={styles.title(darkMode, isMobile)}>
            {subcategoriaNombre || `Subcategoría #${id}`}
          </h1>
          <div style={styles.divider}></div>
        </div>

        {/* SIN PRODUCTOS */}
        {productos.length === 0 && (
          <div style={styles.emptyBox(darkMode)}>
            <span style={{ fontSize: "50px", marginBottom: "10px", display: "block" }}>📦</span>
            <p style={styles.emptyText(darkMode, isMobile)}>
              No se encontraron productos en esta subcategoría por el momento.
            </p>
          </div>
        )}

        {/* GRID DE PRODUCTOS */}
        <div style={styles.grid(isMobile)}>
          {productos.map(p => {
            const tieneOferta = p.oferta === 1 || p.oferta === true;
            return (
              <div
                key={p.id}
                style={styles.card(darkMode, isMobile)}
                onClick={() => navigate(`/producto/${p.id}`)}
              >
                {tieneOferta && <span style={styles.offerBadge(isMobile)}>🔥 OFERTA</span>}

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorito(p);
                  }}
                  style={{
                    ...styles.favBtn(isMobile),
                    background: esFavorito(p.id) ? "#dc2626" : darkMode ? "rgba(30, 41, 59, 0.8)" : "rgba(255, 255, 255, 0.8)",
                    color: esFavorito(p.id) ? "#fff" : darkMode ? "#fff" : "#111",
                    backdropFilter: "blur(4px)"
                  }}
                >
                  ❤️
                </button>

                <div style={styles.imageContainer(isMobile)}>
                  <img
                    src={obtenerImagen(p)}
                    alt={p.nombre}
                    style={styles.image}
                  />
                </div>

                <div style={styles.info(isMobile)}>
                  <h3 style={styles.name(darkMode, isMobile)}>
                    {p.nombre}
                  </h3>

                  <p style={styles.desc(darkMode, isMobile)}>
                    {p.descripcion || "Sin descripción disponible actualmente."}
                  </p>

                  <div style={styles.priceContainer}>
                    {tieneOferta ? (
                      <div style={styles.priceFlex}>
                        <span style={styles.precioAnterior(isMobile)}>${p.precio}</span>
                        <h2 style={styles.precioOferta(isMobile)}>${p.precioOferta}</h2>
                      </div>
                    ) : (
                      <h2 style={styles.price(darkMode, isMobile)}>${p.precio}</h2>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
}

// ================================================= //
// 🎨 ESTILOS (los mismos que en Subcategoria.jsx) //
// ================================================= //
const styles = {
  page: (darkMode) => ({
    backgroundColor: darkMode ? "#0f172a" : "#f8fafc",
    minHeight: "100vh",
    transition: "background-color 0.3s ease",
    color: darkMode ? "#fff" : "#0f172a",
    fontFamily: "'Inter', sans-serif",
    overflowX: "hidden",
    display: "flex",
    flexDirection: "column"
  }),

  loadingContainer: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "300px",
    padding: "40px"
  },

  container: (isMobile) => ({
    padding: isMobile ? "20px 12px" : "50px 30px",
    maxWidth: "1850px", 
    margin: "0 auto",
    boxSizing: "border-box",
    flexGrow: 1,
    width: "100%"
  }),

  header: (isMobile) => ({
    marginBottom: "35px",
    textAlign: isMobile ? "center" : "left",
    display: "flex",
    flexDirection: "column",
    alignItems: isMobile ? "center" : "flex-start"
  }),

  topBadge: {
    fontSize: "11px",
    letterSpacing: "1.5px",
    fontWeight: "800",
    color: "#2563eb",
    background: "rgba(37, 99, 235, 0.1)",
    padding: "6px 12px",
    borderRadius: "30px",
    marginBottom: "10px",
    display: "inline-block"
  },

  title: (darkMode, isMobile) => ({
    fontSize: isMobile ? "26px" : "44px", 
    fontWeight: "900",
    margin: "0 0 12px 0",
    letterSpacing: "-0.5px",
    color: darkMode ? "#ffffff" : "#0f172a"
  }),

  divider: {
    width: "60px",
    height: "4px",
    background: "#2563eb",
    borderRadius: "2px"
  },

  emptyBox: (darkMode) => ({
    backgroundColor: darkMode ? "rgba(30, 41, 59, 0.4)" : "rgba(255, 255, 255, 0.7)",
    border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
    backdropFilter: "blur(8px)",
    padding: "40px 20px",
    borderRadius: "24px",
    textAlign: "center",
    maxWidth: "500px",
    margin: "40px auto",
    boxShadow: "0 10px 25px rgba(0,0,0,0.02)"
  }),

  emptyText: (darkMode, isMobile) => ({
    fontSize: isMobile ? "15px" : "18px",
    margin: 0,
    lineHeight: "1.5",
    color: darkMode ? "#94a3b8" : "#64748b"
  }),

  grid: (isMobile) => ({
    display: "grid",
    gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(6, 1fr)",
    gap: isMobile ? "12px" : "24px"
  }),

  card: (darkMode, isMobile) => ({
    cursor: "pointer",
    backgroundColor: darkMode ? "#1e293b" : "#ffffff",
    border: darkMode ? "1px solid #334155" : "1px solid #f1f5f9",
    color: darkMode ? "#fff" : "#0f172a",
    borderRadius: isMobile ? "16px" : "24px",
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 4px 20px rgba(0,0,0,0.02)",
    transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), boxShadow 0.4s ease, border-color 0.3s ease"
  }),

  offerBadge: (isMobile) => ({
    position: "absolute",
    top: isMobile ? "8px" : "12px",
    left: isMobile ? "8px" : "12px",
    background: "#dc2626",
    color: "#fff",
    fontSize: isMobile ? "9px" : "11px",
    fontWeight: "800",
    padding: "4px 8px",
    borderRadius: "8px",
    zIndex: 10,
    boxShadow: "0 4px 10px rgba(220, 38, 38, 0.25)"
  }),

  favBtn: (isMobile) => ({
    position: "absolute",
    top: isMobile ? "8px" : "12px",
    right: isMobile ? "8px" : "12px",
    width: isMobile ? "32px" : "38px",
    height: isMobile ? "32px" : "38px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    fontSize: isMobile ? "13px" : "15px",
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
    transition: "background-color 0.2s ease, transform 0.2s ease"
  }),

  imageContainer: (isMobile) => ({
    width: "100%",
    height: isMobile ? "145px" : "185px", 
    overflow: "hidden",
    background: "#f1f5f9"
  }),

  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
  },

  info: (isMobile) => ({
    padding: isMobile ? "12px" : "20px",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1
  }),

  name: (darkMode, isMobile) => ({
    fontSize: isMobile ? "14px" : "17px", 
    fontWeight: "700",
    margin: "0 0 6px 0",
    color: darkMode ? "#f8fafc" : "#0f172a",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    lineHeight: "1.35",
    textAlign: "left"
  }),

  desc: (darkMode, isMobile) => ({
    fontSize: "14px", 
    color: darkMode ? "#94a3b8" : "#64748b",
    margin: "0 0 16px 0",
    lineHeight: "1.45",
    textAlign: "left",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden"
  }),

  priceContainer: {
    marginTop: "auto",
    textAlign: "left",
    width: "100%"
  },

  priceFlex: {
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },

  price: (darkMode, isMobile) => ({
    margin: 0,
    fontSize: isMobile ? "16px" : "22px", 
    fontWeight: "800",
    color: darkMode ? "#4ade80" : "#16a34a",
    letterSpacing: "-0.5px"
  }),

  precioAnterior: (isMobile) => ({
    textDecoration: "line-through",
    color: "#94a3b8",
    fontSize: isMobile ? "11px" : "13px",
    fontWeight: "500"
  }),

  precioOferta: (isMobile) => ({
    margin: 0,
    color: "#dc2626",
    fontSize: isMobile ? "16px" : "22px", 
    fontWeight: "800",
    letterSpacing: "-0.5px"
  })
};