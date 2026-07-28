import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Categoria() {
  // 🔥 PARAMS
  const { id, nombre } = useParams();
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [nombreCategoria, setNombreCategoria] = useState("");
  const [loading, setLoading] = useState(true);
  const [productosBusqueda, setProductosBusqueda] = useState([]);

  // 🌙 DARK MODE
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // ❤️ FAVORITOS
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos");
    return guardados ? JSON.parse(guardados) : [];
  });

  useEffect(() => {
    api.get("/productos")
      .then((res) => setProductosBusqueda(res.data))
      .catch((err) => console.log(err));
  }, []);

  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [tipos, setTipos] = useState([]);

  useEffect(() => {
    api.get("/categorias").then((res) => setCategorias(res.data)).catch(console.log);
  }, []);

  useEffect(() => {
    api.get("/subcategorias").then((res) => setSubcategorias(res.data)).catch(console.log);
  }, []);

  useEffect(() => {
    api.get("/tipos")
      .then((res) => {
        setTipos(res.data);
        console.log("📋 Tipos cargados:", res.data);
      })
      .catch(console.log);
  }, []);

  // 📱 DETECTOR RESPONSIVO DINÁMICO
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // =====================================
  // 🔥 CARGAR DATOS
  // =====================================
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);

        let productosData = [];

        if (id) {
          const productosRes = await api.get(`/productos/categoria-id/${id}`);
          productosData = productosRes.data;
          
          console.log("📦 Productos recibidos:", productosData);
          console.log("🔍 Primer producto:", productosData[0]);
          
          setProductos(productosData);

          const categoriasRes = await api.get("/categorias");
          const categoria = categoriasRes.data.find(c => String(c.id) === String(id));

          if (categoria) {
            setNombreCategoria(categoria.nombre);
          } else {
            setNombreCategoria(`Categoría ${id}`);
          }
        } 
        else if (nombre) {
          const productosRes = await api.get(`/productos/categoria/${nombre}`);
          productosData = productosRes.data;
          setProductos(productosData);

          if (productosData.length > 0) {
            setNombreCategoria(productosData[0].categoria || nombre);
          } else {
            setNombreCategoria(nombre);
          }
        }

        // 🔥 IMPORTANTE: Si los productos tienen tipo_id pero no tipo, asignarlos
        if (productosData.length > 0 && tipos.length > 0) {
          const productosActualizados = productosData.map(p => {
            let tipoNombre = p.tipo || null;
            
            // Si tiene tipo_id pero no tipo nombre, buscarlo
            if (p.tipo_id && !tipoNombre) {
              const tipoEncontrado = tipos.find(t => Number(t.id) === Number(p.tipo_id));
              if (tipoEncontrado) {
                tipoNombre = tipoEncontrado.nombre;
              }
            }
            
            // Si no tiene ni tipo_id ni tipo, usar "General"
            if (!tipoNombre) {
              tipoNombre = "General";
            }
            
            return {
              ...p,
              tipo: tipoNombre
            };
          });
          
          setProductos(productosActualizados);
          console.log("✅ Productos actualizados con tipos:", productosActualizados);
        }

      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    // Esperar a que los tipos estén cargados
    if (tipos.length > 0 || id || nombre) {
      cargarDatos();
    }
  }, [id, nombre, tipos]);

  // =====================================
  // ❤️ GUARDAR FAVORITOS
  // =====================================
  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  // =====================================
  // 🖼 OBTENER IMAGEN
  // =====================================
  const obtenerImagen = (producto) => {
    if (producto.imagenes && producto.imagenes.trim() !== "") {
      return producto.imagenes.split(",")[0];
    }
    return producto.imagen || "";
  };

  // =====================================
  // ❤️ TOGGLE FAVORITO
  // =====================================
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

  const esFavorito = (id) => favoritos.some(f => Number(f.id) === Number(id));

  // =====================================
  // 📊 AGRUPAR PRODUCTOS POR SUBCATEGORÍA Y TIPO
  // =====================================
  const agruparPorSubcategoriaYTipo = (productosList) => {
    const grupos = {};

    productosList.forEach(producto => {
      // Obtener nombre de subcategoría
      let subcategoriaNombre = "Sin subcategoría";
      if (producto.subcategoria) {
        subcategoriaNombre = producto.subcategoria;
      } else if (producto.subcategoria_id) {
        const subEncontrada = subcategorias.find(s => Number(s.id) === Number(producto.subcategoria_id));
        if (subEncontrada) {
          subcategoriaNombre = subEncontrada.nombre;
        }
      }

      // Obtener nombre de tipo (línea) - AHORA CON MEJOR MANEJO
      let tipoNombre = "General";
      
      // 1. Intentar con el campo 'tipo' del producto
      if (producto.tipo) {
        tipoNombre = producto.tipo;
      } 
      // 2. Si no, intentar con 'tipo_nombre' (posible campo alternativo)
      else if (producto.tipo_nombre) {
        tipoNombre = producto.tipo_nombre;
      }
      // 3. Si no, intentar con 'tipo_id' buscando en la lista de tipos
      else if (producto.tipo_id) {
        const tipoEncontrado = tipos.find(t => Number(t.id) === Number(producto.tipo_id));
        if (tipoEncontrado) {
          tipoNombre = tipoEncontrado.nombre;
        }
      }
      // 4. Si no, usar "General"

      // DEBUG: Ver qué tipo está asignando
      console.log(`Producto: ${producto.nombre} -> Tipo: ${tipoNombre}`);

      // Crear estructura: subcategoria -> tipo -> productos
      if (!grupos[subcategoriaNombre]) {
        grupos[subcategoriaNombre] = {};
      }

      if (!grupos[subcategoriaNombre][tipoNombre]) {
        grupos[subcategoriaNombre][tipoNombre] = [];
      }

      grupos[subcategoriaNombre][tipoNombre].push(producto);
    });

    console.log("📊 Grupos finales:", grupos);
    return grupos;
  };

  // =====================================
  // 📊 ORDENAR TIPOS
  // =====================================
  const ordenarTipos = (tiposList) => {
    const orden = ['Premium', 'Estándar', 'Lujo', 'Clásica', 'General'];
    return Object.keys(tiposList).sort((a, b) => {
      const indexA = orden.findIndex(o => a.toLowerCase().includes(o.toLowerCase()));
      const indexB = orden.findIndex(o => b.toLowerCase().includes(o.toLowerCase()));
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  };

  // =====================================
  // 📊 ORDENAR SUBCATEGORÍAS
  // =====================================
  const ordenarSubcategorias = (subcategoriasList) => {
    return Object.keys(subcategoriasList).sort((a, b) => {
      if (a === "Sin subcategoría") return 1;
      if (b === "Sin subcategoría") return -1;
      return a.localeCompare(b);
    });
  };

  // Verificar que el tipo tenga productos válidos
  const tieneProductosValidos = (productosList) => {
    return productosList && productosList.length > 0;
  };

  // Agrupar productos (solo si hay productos y tipos)
  const productosAgrupados = productos.length > 0 ? agruparPorSubcategoriaYTipo(productos) : {};
  const subcategoriasOrdenadas = Object.keys(productosAgrupados).length > 0 
    ? ordenarSubcategorias(productosAgrupados) 
    : [];

  if (loading) {
    return (
      <div style={styles.loading(darkMode)}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: "15px", fontSize: "18px" }}>Buscando productos...</p>
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
        tipos={tipos}
        isMobile={isMobile}
      />

      <div style={styles.container(isMobile)}>
        
        {/* 🏷️ ENCABEZADO */}
        <div style={styles.header(isMobile)}>
          <span style={styles.topBadge}>📂 CATEGORÍA EXPLORADA</span>
          <h1 style={styles.title(darkMode, isMobile)}>
            {nombreCategoria}
          </h1>
          <div style={styles.divider}></div>
          {productos.length > 0 && (
            <p style={styles.totalProductos(darkMode, isMobile)}>
              {productos.length} productos encontrados
            </p>
          )}
        </div>

        {/* ❌ SIN PRODUCTOS */}
        {productos.length === 0 && (
          <div style={styles.emptyBox(darkMode)}>
            <span style={{ fontSize: "50px", marginBottom: "10px", display: "block" }}>📦</span>
            <p style={styles.emptyText(darkMode, isMobile)}>
              No se encontraron productos en esta categoría por el momento.
            </p>
          </div>
        )}

        {/* ========== PRODUCTOS AGRUPADOS ========== */}
        {productos.length > 0 && subcategoriasOrdenadas.map((subcategoria) => {
          const tiposGroup = productosAgrupados[subcategoria];
          
          return (
            <div key={subcategoria} style={styles.subcategoriaContainer}>
              {/* 📌 ENCABEZADO DE SUBCATEGORÍA */}
              <div style={styles.subcategoriaHeader(darkMode)}>
                <div style={styles.subcategoriaHeaderLeft}>
                  <span style={styles.subcategoriaNombre}>📂 {subcategoria}</span>
                  <span style={styles.subcategoriaContador}>
                    {Object.values(tiposGroup).reduce((total, arr) => total + arr.length, 0)} productos
                  </span>
                </div>
                <div style={styles.subcategoriaDivider}></div>
              </div>

              {/* Iterar sobre los tipos dentro de la subcategoría */}
              {ordenarTipos(tiposGroup).map((tipo) => {
                const productosDeTipo = tiposGroup[tipo];
                if (!tieneProductosValidos(productosDeTipo)) return null;

                return (
                  <div key={tipo} style={styles.tipoContainer}>
                    {/* 📌 ENCABEZADO DE TIPO */}
                    <div style={styles.tipoHeader(darkMode)}>
                      <div style={styles.tipoHeaderLeft}>
                        <span style={styles.tipoNombre}>🏷️ {tipo}</span>
                        <span style={styles.tipoContador}>{productosDeTipo.length} productos</span>
                      </div>
                      <div style={styles.tipoDivider}></div>
                    </div>

                    {/* ✅ GRID DE PRODUCTOS */}
                    <div style={styles.grid(isMobile)}>
                      {productosDeTipo.map(p => {
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
                                const img = e.currentTarget.querySelector(".prod-img");
                                if (img) img.style.transform = "scale(1.05)";
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isMobile) {
                                e.currentTarget.style.transform = "translateY(0px)";
                                e.currentTarget.style.boxShadow = darkMode 
                                  ? "0 4px 20px rgba(0,0,0,0.2)" 
                                  : "0 4px 20px rgba(0,0,0,0.02)";
                                const img = e.currentTarget.querySelector(".prod-img");
                                if (img) img.style.transform = "scale(1)";
                              }
                            }}
                          >
                            {/* 🔥 BADGE DE OFERTA */}
                            {tieneOferta && <span style={styles.offerBadge(isMobile)}>🔥 OFERTA</span>}

                            {/* 🏷️ BADGE DE TIPO */}
                            <span style={styles.tipoBadge(isMobile)}>{tipo}</span>

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

                            {/* 🖼 IMAGEN */}
                            <div style={styles.imageContainer(isMobile)}>
                              <img
                                src={obtenerImagen(p)}
                                alt={p.nombre}
                                className="prod-img"
                                style={styles.image}
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

                              {/* 💲 PRECIOS */}
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
          );
        })}

      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
}

// ============================================
// 🎨 ESTILOS (igual que antes)
// ============================================
const styles = {
  loading: (darkMode) => ({
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: darkMode ? "#0f172a" : "#f8fafc",
    color: darkMode ? "#94a3b8" : "#64748b",
    fontFamily: "'Inter', sans-serif"
  }),

  spinner: {
    width: "40px",
    height: "40px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite"
  },

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

  totalProductos: (darkMode, isMobile) => ({
    fontSize: isMobile ? "14px" : "16px",
    color: darkMode ? "#94a3b8" : "#64748b",
    marginTop: "12px",
    fontWeight: "500"
  }),

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

  subcategoriaContainer: {
    marginBottom: "48px"
  },

  subcategoriaHeader: (darkMode) => ({
    display: "flex",
    flexDirection: "column",
    marginBottom: "20px",
    padding: "12px 20px",
    background: darkMode ? "rgba(30, 41, 59, 0.3)" : "rgba(241, 245, 249, 0.5)",
    borderRadius: "12px",
    borderLeft: "4px solid #8b5cf6"
  }),

  subcategoriaHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap"
  },

  subcategoriaNombre: {
    fontSize: "clamp(20px, 2vw, 28px)",
    fontWeight: "800",
    color: "#8b5cf6",
    letterSpacing: "1px"
  },

  subcategoriaContador: {
    background: "rgba(139, 92, 246, 0.15)",
    color: "#a78bfa",
    padding: "2px 12px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "600"
  },

  subcategoriaDivider: {
    width: "100%",
    height: "1px",
    background: "linear-gradient(90deg, rgba(139,92,246,0.2), transparent)",
    marginTop: "8px"
  },

  tipoContainer: {
    marginBottom: "32px",
    marginLeft: "16px"
  },

  tipoHeader: (darkMode) => ({
    display: "flex",
    flexDirection: "column",
    marginBottom: "16px",
    padding: "8px 16px",
    background: darkMode ? "rgba(30, 41, 59, 0.15)" : "rgba(241, 245, 249, 0.3)",
    borderRadius: "8px",
    borderLeft: "3px solid #2563eb"
  }),

  tipoHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap"
  },

  tipoNombre: {
    fontSize: "clamp(16px, 1.5vw, 20px)",
    fontWeight: "700",
    color: "#60a5fa",
    letterSpacing: "0.5px"
  },

  tipoContador: {
    background: "rgba(37, 99, 235, 0.12)",
    color: "#60a5fa",
    padding: "2px 10px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "600"
  },

  tipoDivider: {
    width: "100%",
    height: "1px",
    background: "linear-gradient(90deg, rgba(37,99,235,0.15), transparent)",
    marginTop: "6px"
  },

  tipoBadge: (isMobile) => ({
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