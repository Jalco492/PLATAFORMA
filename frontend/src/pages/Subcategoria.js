import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Subcategoria() {
  const { nombre } = useParams();
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [productosBusqueda, setProductosBusqueda] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);

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

  // 📱 DETECTOR RESPONSIVO DINÁMICO
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // 🔄 CARGAR PRODUCTOS POR SUBCATEGORÍA
  useEffect(() => {
    api.get(`/productos/subcategoria/${nombre}`)
      .then(res => setProductos(res.data))
      .catch(err => console.log(err));
  }, [nombre]);

  // 💾 GUARDAR FAVORITOS
  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  // 🖼 OBTENER IMAGEN - VERSIÓN CORREGIDA
const obtenerImagen = (producto) => {
  if (!producto) return "https://via.placeholder.com/200";

  let imagenUrl = "";

  // Prioriza 'imagenes' (puede tener múltiples separadas por coma)
  if (producto.imagenes && producto.imagenes.trim() !== "") {
    imagenUrl = producto.imagenes.split(",")[0].trim();
  } 
  // Si no tiene 'imagenes', usa 'imagen'
  else if (producto.imagen && producto.imagen.trim() !== "") {
    imagenUrl = producto.imagen.trim();
  } 
  // Si no tiene ninguna, usa placeholder
  else {
    return "https://via.placeholder.com/200";
  }

  // 🔥 FUNCIÓN PARA GENERAR URL COMPLETA
  return getImageUrl(imagenUrl);
};

// 🔥 FUNCIÓN AUXILIAR PARA URL DE IMÁGENES
const getImageUrl = (imagen) => {
  if (!imagen) {
    return "https://via.placeholder.com/200";
  }

  // Si ya viene con una URL completa la usa directamente
  if (imagen.startsWith("http://") || imagen.startsWith("https://")) {
    return imagen;
  }

  // Si la imagen comienza con /, la concatena con el backend
  if (imagen.startsWith("/")) {
    return `https://backend-zuib.onrender.com${imagen}`;
  }

  // Si no comienza con /, la agrega
  return `https://backend-zuib.onrender.com/${imagen}`;
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

  // 🌟 NUEVO: Lógica para encontrar la categoría perteneciente de forma dinámica
  const subcategoriaActual = subcategorias.find(
    (sub) => sub.nombre.toLowerCase() === nombre.toLowerCase()
  );

  const categoriaPerteneciente = subcategoriaActual
    ? categorias.find((cat) => Number(cat.id) === Number(subcategoriaActual.categoria_id))
    : null;

  // ========== NUEVA FUNCIÓN: AGRUPAR POR LÍNEA ==========
  const agruparPorLinea = (productosList) => {
    const grupos = {};
    productosList.forEach(producto => {
      // Usar 'tipo' como línea, si no existe usar 'General'
      const linea = producto.tipo || 'General';
      if (!grupos[linea]) {
        grupos[linea] = [];
      }
      grupos[linea].push(producto);
    });
    return grupos;
  };

  // ========== NUEVA FUNCIÓN: ORDENAR LÍNEAS ==========
  const ordenarLineas = (lineas) => {
    const orden = ['Premium', 'Estándar', 'Lujo', 'Clásica', 'General'];
    return Object.keys(lineas).sort((a, b) => {
      const indexA = orden.findIndex(o => a.toLowerCase().includes(o.toLowerCase()));
      const indexB = orden.findIndex(o => b.toLowerCase().includes(o.toLowerCase()));
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };

  // Verificar que el tipo tenga productos válidos
  const tieneProductosValidos = (productosList) => {
    return productosList && productosList.length > 0;
  };

  // Agrupar productos
  const productosAgrupados = agruparPorLinea(productos);
  const lineasOrdenadas = ordenarLineas(productosAgrupados);

  return (
    <div style={styles.page(darkMode)}>
      {/* 🟢 NAVBAR */}
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

      {/* 📦 CONTENEDOR PRINCIPAL - CON PADDING SUPERIOR PARA BAJAR EL CONTENIDO */}
      <div style={styles.container(isMobile)}>
        
        {/* 🏷️ ENCABEZADO */}
        <div style={styles.header(isMobile)}>
          {/* 🌟 NUEVO: Breadcrumb dinámico mostrando la Categoría Padre si existe */}
          {categoriaPerteneciente && (
            <span style={styles.categoriaBreadcrumb(darkMode)}>
              {categoriaPerteneciente.nombre}  &gt;  
            </span>
          )}
          
          <span style={styles.topBadge}>💎 SUBCATEGORÍA</span>
          <h1 style={styles.title(darkMode, isMobile)}>
            {nombre}
          </h1>
          <div style={styles.divider}></div>
        </div>

        {/* ❌ SIN PRODUCTOS */}
        {productos.length === 0 && (
          <div style={styles.emptyBox(darkMode)}>
            <span style={{ fontSize: "50px", marginBottom: "10px", display: "block" }}>📦</span>
            <p style={styles.emptyText(darkMode, isMobile)}>
              No se encontraron productos en esta subcategoría por el momento.
            </p>
          </div>
        )}

        {/* ========== NUEVA SECCIÓN: PRODUCTOS AGRUPADOS POR LÍNEA ========== */}
        {productos.length > 0 && lineasOrdenadas.map((linea) => {
          const productosDeLinea = productosAgrupados[linea];
          if (!tieneProductosValidos(productosDeLinea)) return null;

          return (
            <div key={linea} style={styles.lineaContainer}>
              {/* 📌 ENCABEZADO DE LA LÍNEA */}
              <div style={styles.lineaHeader(darkMode)}>
                <div style={styles.lineaHeaderLeft}>
                  <span style={styles.lineaNombre}>{linea}</span>
                  <span style={styles.lineaContador}>{productosDeLinea.length} productos</span>
                </div>
                <div style={styles.lineaDivider}></div>
              </div>

              {/* ✅ GRID DE PRODUCTOS DE ESTA LÍNEA */}
              <div style={styles.grid(isMobile)}>
                {productosDeLinea.map(p => {
                  const tieneOferta = p.oferta === 1 || p.oferta === true;
                  return (
                    <div
                      key={p.id}
                      style={styles.card(darkMode, isMobile)}
                      onClick={() => navigate(`/producto/${p.id}`)}
                      onMouseEnter={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.transform = "translateY(-6px)";
                          e.currentTarget.style.boxShadow = darkMode 
                            ? "0 20px 30px rgba(0, 0, 0, 0.4)" 
                            : "0 20px 30px rgba(15, 23, 42, 0.08)";
                          const img = e.currentTarget.querySelector(".sub-img");
                          if (img) img.style.transform = "scale(1.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isMobile) {
                          e.currentTarget.style.transform = "translateY(0px)";
                          e.currentTarget.style.boxShadow = darkMode 
                            ? "0 4px 20px rgba(0,0,0,0.2)" 
                            : "0 4px 20px rgba(0,0,0,0.02)";
                          const img = e.currentTarget.querySelector(".sub-img");
                          if (img) img.style.transform = "scale(1)";
                        }
                      }}
                    >
                      {/* 🔥 BADGE DE OFERTA */}
                      {tieneOferta && <span style={styles.offerBadge(isMobile)}>🔥 OFERTA</span>}

                      {/* 🏷️ BADGE DE LÍNEA (PEQUEÑO) */}
                      <span style={styles.lineaBadge(isMobile)}>{linea}</span>

                      {/* ❤️ BOTÓN FAVORITO */}
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

                      {/* 🖼 IMAGEN CON EFECTO ZOOM */}
                      <div style={styles.imageContainer(isMobile)}>
                        <img
                          src={obtenerImagen(p)}
                          alt={p.nombre}
                          className="sub-img"
                          style={styles.image}
                          loading="lazy"
  onError={(e) => {
    e.target.src = "https://via.placeholder.com/300/1e293b/60a5fa?text=No+img";
    }}
                        />
                      </div>

                      {/* 📝 INFO DEL PRODUCTO */}
                      <div style={styles.info(isMobile)}>
                        <h3 style={styles.name(darkMode, isMobile)}>
                          {p.nombre}
                        </h3>

                        <p style={styles.desc(darkMode, isMobile)}>
                          {p.descripcion || "Sin descripción disponible actualmente."}
                        </p>

                        {/* 💲 SECCIÓN DE PRECIOS */}
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
          );
        })}

      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
}

/* ================================================= */
/* 🎨 OBJETO DE ESTILOS PREMIUM Y MODERNOS         */
/* ================================================= */
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

  container: (isMobile) => ({
    // ⬇️⬇️⬇️ CAMBIO IMPORTANTE: Padding superior aumentado para bajar el contenido ⬇️⬇️⬇️
    padding: isMobile ? "90px 12px 20px 12px" : "140px 30px 50px 30px",
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

  // 🌟 NUEVO: Estilo para la categoría superior
  categoriaBreadcrumb: (darkMode) => ({
    fontSize: "13px",
    fontWeight: "600",
    color: darkMode ? "#94a3b8" : "#64748b",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
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

  // ========== NUEVOS ESTILOS PARA LÍNEAS ==========
  lineaContainer: {
    marginBottom: "48px"
  },

  lineaHeader: (darkMode) => ({
    display: "flex",
    flexDirection: "column",
    marginBottom: "24px",
    padding: "12px 20px",
    background: darkMode ? "rgba(30, 41, 59, 0.3)" : "rgba(241, 245, 249, 0.5)",
    borderRadius: "12px",
    borderLeft: "4px solid #2563eb"
  }),

  lineaHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap"
  },

  lineaNombre: {
    fontSize: "clamp(20px, 2vw, 28px)",
    fontWeight: "800",
    color: "#000000",
    letterSpacing: "1px"
  },

  lineaContador: {
    background: "rgba(37, 99, 235, 0.15)",
    color: "#60a5fa",
    padding: "2px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600"
  },

  lineaDivider: {
    width: "100%",
    height: "1px",
    background: "linear-gradient(90deg, rgba(37,99,235,0.2), transparent)",
    marginTop: "8px"
  },

  lineaBadge: (isMobile) => ({
    position: "absolute",
    top: isMobile ? "8px" : "12px",
    left: isMobile ? "8px" : "12px",
    background: "rgba(37, 99, 235, 0.2)",
    backdropFilter: "blur(10px)",
    padding: isMobile ? "2px 8px" : "4px 12px",
    borderRadius: "20px",
    fontSize: isMobile ? "8px" : "10px",
    fontWeight: "700",
    color: "#60a5fa",
    border: "1px solid rgba(37, 99, 235, 0.15)",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    zIndex: 10
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
    right: isMobile ? "8px" : "12px",
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