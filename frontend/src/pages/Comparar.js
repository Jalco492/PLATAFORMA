import { useEffect, useState } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import api from "../services/api";

export default function Comparar() {
  const [comparador, setComparador] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);

  /* 🌙 DARK MODE */
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // Control responsivo dinámico
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;

  // 🔥 CARGAR PRODUCTOS DEL COMPARADOR
  useEffect(() => {
    const guardados = localStorage.getItem("comparador");
    if (guardados) {
      setComparador(JSON.parse(guardados));
    }
  }, []);

  useEffect(() => {
    if (comparador.length <= 1) return;

    const categoriaBase = comparador[0].categoria_id;
    const validos = comparador.filter(
      p => Number(p.categoria_id) === Number(categoriaBase)
    );

    if (validos.length !== comparador.length) {
      setComparador(validos);
      localStorage.setItem("comparador", JSON.stringify(validos));
      alert("Se eliminaron productos de categorías diferentes.");
    }
  }, [comparador]);

  // 🔥 CARGAR PRODUCTOS, CATEGORÍAS Y SUBCATEGORÍAS
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

  // ❌ ELIMINAR
  const eliminarProducto = (id) => {
    const nuevos = comparador.filter(p => Number(p.id) !== Number(id));
    setComparador(nuevos);
    localStorage.setItem("comparador", JSON.stringify(nuevos));
  };

  // 🏷 FORMATEAR NOMBRES
  const formatearCampo = (campo) => {
    const nombres = {
      nombre: "Nombre",
      descripcion: "Descripción",
      precio: "Precio",
      precioOferta: "Precio Oferta",
      oferta: "Oferta",
      stock: "Stock",
      imagenes: "Imágenes",
      destacado: "Destacado",
      sku: "SKU",
      ancho: "Ancho",
      alto: "Alto",
      grueso: "Grosor",
      cobertura: "Cobertura",
      tipoVenta: "Tipo Venta",
      tipoCobertura: "Tipo Cobertura",
      especificaciones: "Especificaciones",
      informacionAdicional: "Información Adicional",
      piezasCaja: "Piezas por Caja",
      variante: "Variante",
      presentacion: "Presentación",
      uso: "🏠 Uso",
      aplicacion: "📋 Aplicación",
      tipo_diseno: "🎨 Tipo de Diseño",
      material: "🧱 Material",
      acabado: "✨ Acabado",
      tipo_instalacion: "🔧 Tipo de Instalación",
      espesor_capa_desgaste: "📏 Espesor Capa Desgaste"
    };
    return nombres[campo] || campo;
  };

  // 🧠 MEJOR PRODUCTO
  const mejorProducto = [...comparador].sort((a, b) => {
    const precioA = Number(a.precioOferta || a.precio);
    const precioB = Number(b.precioOferta || b.precio);
    const scoreA = Number(a.stock || 0) + Number(a.cobertura || 0) + (a.destacado ? 50 : 0) - precioA / 10;
    const scoreB = Number(b.stock || 0) + Number(b.cobertura || 0) + (b.destacado ? 50 : 0) - precioB / 10;
    return scoreB - scoreA;
  })[0];

  // 💲 MÁS BARATO
  const masBarato = [...comparador].sort((a, b) => {
    return Number(a.precioOferta || a.precio) - Number(b.precioOferta || b.precio);
  })[0];

  // 🏆 MAYOR COBERTURA
  const mayorCobertura = [...comparador].sort((a, b) => {
    return Number(b.cobertura || 0) - Number(a.cobertura || 0);
  })[0];

  // 📏 MAYOR GROSOR
  const mayorGrueso = [...comparador].sort((a, b) => {
    return Number(b.grueso || 0) - Number(a.grueso || 0);
  })[0];

  // 🧱 MEJOR MATERIAL
  const mejorMaterial = [...comparador].sort((a, b) => {
    const prioridad = { "SPC": 5, "LVT": 4, "PVC": 3, "Laminado": 2, "Madera": 1 };
    const scoreA = prioridad[a.material] || 0;
    const scoreB = prioridad[b.material] || 0;
    return scoreB - scoreA;
  })[0];

  // 🏷️ CAMPOS QUE NO SE MUESTRAN EN EL COMPARADOR
  const camposExcluidos = [
    "id", "created_at", "updated_at", "visible", 
    "nuevo", "imagen", "rebaja", "fichaTecnica",
    "categoria_id", "subcategoria_id", "tipo_id",
    "categoria", "subcategoria", "tipo",
    "sugerencias", "colores_ids"
  ];

  return (
    <div style={styles.page(darkMode)}>
      {/* 🔥 NAVBAR */}
      <Navbar
        categorias={categorias}
        subcategorias={subcategorias}
        productos={productos}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        favoritos={comparador}
        esFavorito={(id) => comparador.some(p => p.id === id)}
        toggleFavorito={(producto) => {
          const existe = comparador.some(p => p.id === producto.id);
          let nuevos;
          if (existe) {
            nuevos = comparador.filter(p => p.id !== producto.id);
          } else {
            if (comparador.length > 0) {
              const categoriaActual = comparador[0].categoria_id;
              if (Number(producto.categoria_id) !== Number(categoriaActual)) {
                alert("Solo puedes comparar productos de la misma categoría.");
                return;
              }
            }
            nuevos = [...comparador, producto];
          }
          setComparador(nuevos);
          localStorage.setItem("comparador", JSON.stringify(nuevos));
        }}
      />

      <div style={styles.container}>
        {/* TÍTULO CON DECORACIÓN */}
        <div style={styles.headerSection}>
          <div style={styles.titleWrapper}>
            <span style={styles.titleIcon}>⚖️</span>
            <h1 style={styles.title(darkMode, isMobile)}>
              Comparador de Productos
            </h1>
          </div>
          <p style={styles.subtitle(darkMode)}>
            Compara hasta 3 productos lado a lado y encuentra el mejor para ti
          </p>
          <div style={styles.headerStats}>
            <span style={styles.headerStat(darkMode)}>
              <span style={styles.headerStatNumber}>{comparador.length}</span>
              Productos en comparación
            </span>
          </div>
        </div>

        {/* ⭐ MEJOR OPCIÓN - REDISEÑADA */}
        {mejorProducto && (
          <div style={styles.bestBox(darkMode, isMobile)}>
            <div style={styles.bestBadge}>⭐ RECOMENDADO</div>
            <div style={styles.bestContent}>
              <div style={styles.bestInfo}>
                <h2 style={styles.bestTitle(isMobile)}>
                  {mejorProducto.nombre}
                </h2>
                <p style={styles.bestText(darkMode, isMobile)}>
                  {mejorProducto.descripcion || "Producto destacado con excelente relación calidad-precio"}
                </p>
                <div style={styles.bestAttributes}>
                  {mejorProducto.material && (
                    <span style={styles.bestAttribute}>🧱 {mejorProducto.material}</span>
                  )}
                  {mejorProducto.uso && (
                    <span style={styles.bestAttribute}>🏠 {mejorProducto.uso}</span>
                  )}
                  {mejorProducto.grueso && (
                    <span style={styles.bestAttribute}>📏 {mejorProducto.grueso} mm</span>
                  )}
                  {mejorProducto.espesor_capa_desgaste && (
                    <span style={styles.bestAttribute}>📏 {mejorProducto.espesor_capa_desgaste} mm</span>
                  )}
                  {mejorProducto.cobertura && (
                    <span style={styles.bestAttribute}>📦 {mejorProducto.cobertura} m²</span>
                  )}
                </div>
                <div style={styles.bestPrice}>
                  {mejorProducto.precioOferta ? (
                    <>
                      <span style={styles.bestOldPrice}>${mejorProducto.precio}</span>
                      <span style={styles.bestOfferPrice}>${mejorProducto.precioOferta}</span>
                    </>
                  ) : (
                    <span style={styles.bestPriceValue}>${mejorProducto.precio}</span>
                  )}
                </div>
              </div>
              <img
                src={mejorProducto.imagenes ? mejorProducto.imagenes.split(",")[0] : ""}
                alt={mejorProducto.nombre}
                style={styles.bestImage(isMobile)}
                onError={(e) => e.target.src = "https://via.placeholder.com/150"}
              />
            </div>
          </div>
        )}

        {/* 🧠 RECOMENDACIONES INTELIGENTES - REDISEÑADAS */}
        <div style={styles.smartSection}>
          <h3 style={styles.smartSectionTitle(darkMode)}>🎯 Recomendaciones Inteligentes</h3>
          <div style={styles.smartGrid(isMobile)}>
            {masBarato && (
              <div style={styles.smartCard(darkMode)}>
                <div style={styles.smartCardIcon}>💰</div>
                <h4 style={styles.smartTitle(isMobile)}>Más Económico</h4>
                <p style={styles.smartText(darkMode, isMobile)}>{masBarato.nombre}</p>
                {masBarato.precioOferta ? (
                  <span style={styles.smartPrice}>${masBarato.precioOferta}</span>
                ) : (
                  <span style={styles.smartPrice}>${masBarato.precio}</span>
                )}
              </div>
            )}

            {mayorCobertura && (
              <div style={styles.smartCard(darkMode)}>
                <div style={styles.smartCardIcon}>📦</div>
                <h4 style={styles.smartTitle(isMobile)}>Mayor Cobertura</h4>
                <p style={styles.smartText(darkMode, isMobile)}>{mayorCobertura.nombre}</p>
                <span style={styles.smartPrice}>{mayorCobertura.cobertura} m²</span>
              </div>
            )}

            {mayorGrueso && (
              <div style={styles.smartCard(darkMode)}>
                <div style={styles.smartCardIcon}>📏</div>
                <h4 style={styles.smartTitle(isMobile)}>Mayor Grosor</h4>
                <p style={styles.smartText(darkMode, isMobile)}>{mayorGrueso.nombre}</p>
                <span style={styles.smartPrice}>{mayorGrueso.grueso} mm</span>
              </div>
            )}

            {mejorMaterial && mejorMaterial.material && (
              <div style={styles.smartCard(darkMode)}>
                <div style={styles.smartCardIcon}>🧱</div>
                <h4 style={styles.smartTitle(isMobile)}>Mejor Material</h4>
                <p style={styles.smartText(darkMode, isMobile)}>{mejorMaterial.nombre}</p>
                <span style={styles.smartPrice}>{mejorMaterial.material}</span>
              </div>
            )}
          </div>
        </div>

        {comparador.length === 0 ? (
          <div style={styles.emptyBox}>
            <div style={styles.emptyIcon}>📭</div>
            <p style={styles.empty(darkMode, isMobile)}>
              No hay productos para comparar
            </p>
            <p style={styles.emptySub(darkMode)}>
              Agrega productos desde el catálogo para comenzar a comparar
            </p>
            <button
              style={styles.addBtn}
              onClick={() => window.location.href = "/productos"}
            >
              ➕ Agregar productos
            </button>
          </div>
        ) : (
          <div style={styles.tableSection(darkMode)}>
            <div style={styles.tableHeader(darkMode)}>
              <span style={styles.tableTitle(darkMode)}>📊 Comparación Detallada</span>
              <span style={styles.tableCount}>{comparador.length} productos</span>
            </div>
            <div style={styles.tableWrapper}>
              <table style={styles.table(darkMode)}>
                <tbody>
                  {/* FILA DE CABECERA CON NOMBRES DE PRODUCTOS - REDISEÑADA */}
                  <tr style={styles.headerRow(darkMode)}>
                    <td style={styles.headerLabel(darkMode, isMobile)}>Producto</td>
                    {comparador.map((p, index) => (
                      <td key={p.id} style={styles.headerCell(darkMode, isMobile, index)}>
                        <div style={styles.productHeader}>
                          <img
                            src={p.imagenes ? p.imagenes.split(",")[0] : ""}
                            alt={p.nombre}
                            style={styles.thumbImage(isMobile)}
                            onError={(e) => e.target.src = "https://via.placeholder.com/80"}
                          />
                          <span style={styles.productName(isMobile)}>{p.nombre}</span>
                          <span style={styles.productSku}>SKU: {p.sku || 'N/A'}</span>
                        </div>
                      </td>
                    ))}
                  </tr>

                  {/* TODOS LOS CAMPOS DEL PRODUCTO */}
                  {Object.keys(comparador[0] || {})
                    .filter((key) => !camposExcluidos.includes(key))
                    .filter((campo) => {
                      return comparador.some((p) => {
                        return (
                          p[campo] !== null &&
                          p[campo] !== "" &&
                          p[campo] !== undefined
                        );
                      });
                    })
                    .map((campo) => (
                      <tr key={campo} style={styles.dataRow(darkMode)}>
                        <td style={styles.label(darkMode, isMobile)}>
                          {formatearCampo(campo)}
                        </td>

                        {comparador.map((p) => {
                          // Determinar si este producto tiene el mejor valor en este campo
                          let esMejor = false;
                          if (campo === "precio" || campo === "precioOferta") {
                            const valores = comparador.map(prod => Number(prod[campo] || 0)).filter(v => v > 0);
                            const minValor = Math.min(...valores);
                            const currentValor = Number(p[campo] || 0);
                            esMejor = currentValor > 0 && currentValor === minValor;
                          } else if (campo === "cobertura" || campo === "grueso" || campo === "stock") {
                            const valores = comparador.map(prod => Number(prod[campo] || 0));
                            const maxValor = Math.max(...valores);
                            const currentValor = Number(p[campo] || 0);
                            esMejor = currentValor > 0 && currentValor === maxValor;
                          }

                          return (
                            <td
                              key={p.id}
                              style={{
                                ...styles.cell(darkMode, isMobile),
                                background: esMejor ? (darkMode ? "#1a3a2a" : "#f0fdf4") : undefined,
                                borderLeft: esMejor ? "3px solid #22c55e" : undefined
                              }}
                            >
                              {/* 🖼 IMAGENES */}
                              {campo === "imagenes" ? (
                                <img
                                  src={p.imagenes ? p.imagenes.split(",")[0] : ""}
                                  alt={p.nombre}
                                  style={styles.image(isMobile)}
                                  onError={(e) => e.target.src = "https://via.placeholder.com/120"}
                                />
                              )
                              // 💲 PRECIOS
                              : campo === "precio" || campo === "precioOferta" ? (
                                <span style={{
                                  ...styles.price(isMobile),
                                  color: esMejor ? "#22c55e" : "#16a34a"
                                }}>
                                  ${p[campo]}
                                  {esMejor && <span style={styles.bestTag}>🏆</span>}
                                </span>
                              )
                              // 📏 MEDIDAS
                              : campo === "ancho" || campo === "alto" ? (
                                `${p[campo]} cm`
                              )
                              // 📏 GROSOR - AHORA CON mm
                              : campo === "grueso" ? (
                                <span style={{
                                  fontWeight: esMejor ? "bold" : "normal",
                                  color: esMejor ? "#22c55e" : undefined
                                }}>
                                  {p[campo]} mm {esMejor && <span style={styles.bestTag}>🏆</span>}
                                </span>
                              )
                              // 📏 ESPESOR CAPA DESGASTE
                              : campo === "espesor_capa_desgaste" ? (
                                `${p[campo]} mm`
                              )
                              // 📦 COBERTURA
                              : campo === "cobertura" ? (
                                p[campo] ? (
                                  <span style={{ fontWeight: esMejor ? "bold" : "normal", color: esMejor ? "#22c55e" : undefined }}>
                                    {p[campo]} m² {esMejor && <span style={styles.bestTag}>🏆</span>}
                                  </span>
                                ) : "-"
                              )
                              // ✅ BOOLEANOS
                              : campo === "oferta" || campo === "destacado" ? (
                                p[campo] === 1 || p[campo] === true ? (
                                  <span style={styles.badgeYes}>✅ Sí</span>
                                ) : (
                                  <span style={styles.badgeNo}>❌ No</span>
                                )
                              )
                              // 📝 TEXTO LARGO
                              : campo === "descripcion" || campo === "especificaciones" || campo === "informacionAdicional" ? (
                                <div style={styles.longText(isMobile)}>
                                  {p[campo]}
                                </div>
                              )
                              // ❌ VACÍO
                              : !p[campo] ? (
                                <span style={styles.emptyValue}>-</span>
                              )
                              // 🆕 CAMPOS CON FORMATO ESPECIAL
                              : campo === "uso" ? (
                                <span style={styles.tagValue}>🏠 {p[campo]}</span>
                              )
                              : campo === "aplicacion" ? (
                                <span style={styles.tagValue}>📋 {p[campo]}</span>
                              )
                              : campo === "tipo_diseno" ? (
                                <span style={styles.tagValue}>🎨 {p[campo]}</span>
                              )
                              : campo === "material" ? (
                                <span style={styles.tagValue}>🧱 {p[campo]}</span>
                              )
                              : campo === "acabado" ? (
                                <span style={styles.tagValue}>✨ {p[campo]}</span>
                              )
                              : campo === "tipo_instalacion" ? (
                                <span style={styles.tagValue}>🔧 {p[campo]}</span>
                              )
                              : campo === "tipoVenta" ? (
                                <span style={styles.tagValue}>🚚 {p[campo]}</span>
                              )
                              : campo === "stock" ? (
                                <span style={{
                                  color: Number(p[campo]) > 10 ? "#22c55e" : Number(p[campo]) > 0 ? "#f59e0b" : "#ef4444",
                                  fontWeight: esMejor ? "bold" : "normal"
                                }}>
                                  {p[campo]} {esMejor && <span style={styles.bestTag}>🏆</span>}
                                </span>
                              )
                              // ✅ NORMAL
                              : (
                                String(p[campo])
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                  {/* ❌ FILA ELIMINAR */}
                  <tr style={styles.actionRow(darkMode)}>
                    <td style={styles.label(darkMode, isMobile)}>Acción</td>
                    {comparador.map((p) => (
                      <td key={p.id} style={styles.cell(darkMode, isMobile)}>
                        <button
                          style={styles.removeBtn(isMobile)}
                          onClick={() => eliminarProducto(p.id)}
                        >
                          🗑 Eliminar
                        </button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
}

const styles = {
  // PÁGINA
  page: (darkMode) => ({
    minHeight: "100vh",
    background: darkMode ? "#0f172a" : "#f0f4f8",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  }),

  container: {
    maxWidth: "1400px",
    width: "100%",
    margin: "0 auto",
    padding: "90px 20px 40px 20px",
    boxSizing: "border-box",
    flexGrow: 1
  },

  // HEADER
  headerSection: {
    textAlign: "center",
    marginBottom: "40px"
  },

  titleWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "16px",
    flexWrap: "wrap"
  },

  titleIcon: {
    fontSize: "48px"
  },

  title: (darkMode, isMobile) => ({
    color: darkMode ? "#fff" : "#0f172a",
    fontSize: isMobile ? "32px" : "48px",
    fontWeight: "800",
    margin: 0,
    letterSpacing: "-0.5px",
    background: darkMode ? "linear-gradient(135deg, #818cf8, #6366f1)" : "linear-gradient(135deg, #4f46e5, #7c3aed)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text"
  }),

  subtitle: (darkMode) => ({
    color: darkMode ? "#94a3b8" : "#64748b",
    fontSize: "18px",
    marginTop: "8px",
    marginBottom: "16px"
  }),

  headerStats: {
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    flexWrap: "wrap"
  },

  headerStat: (darkMode) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 20px",
    borderRadius: "20px",
    background: darkMode ? "#1e293b" : "#fff",
    color: darkMode ? "#e2e8f0" : "#334155",
    fontSize: "14px",
    fontWeight: "500",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)"
  }),

  headerStatNumber: {
    fontWeight: "700",
    color: "#6366f1",
    fontSize: "18px"
  },

  // MEJOR OPCIÓN
  bestBox: (darkMode, isMobile) => ({
    background: darkMode ? "#1e293b" : "#fff",
    borderRadius: "20px",
    padding: isMobile ? "20px" : "28px",
    marginBottom: "32px",
    position: "relative",
    boxShadow: darkMode ? "0 8px 32px rgba(0,0,0,0.3)" : "0 8px 32px rgba(0,0,0,0.06)",
    border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
    overflow: "hidden"
  }),

  bestBadge: {
    position: "absolute",
    top: "12px",
    right: "12px",
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "#fff",
    padding: "4px 16px",
    borderRadius: "20px",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "0.5px"
  },

  bestContent: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    flexWrap: "wrap"
  },

  bestInfo: {
    flex: 1,
    minWidth: "200px"
  },

  bestTitle: (isMobile) => ({
    fontSize: isMobile ? "20px" : "28px",
    margin: "0 0 8px 0",
    color: "#f59e0b",
    fontWeight: "700"
  }),

  bestText: (darkMode, isMobile) => ({
    fontSize: isMobile ? "14px" : "16px",
    lineHeight: 1.6,
    margin: "0 0 12px 0",
    color: darkMode ? "#cbd5e1" : "#475569"
  }),

  bestAttributes: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "12px"
  },

  bestAttribute: {
    display: "inline-block",
    padding: "4px 14px",
    borderRadius: "12px",
    background: "#eef2ff",
    color: "#4f46e5",
    fontSize: "13px",
    fontWeight: "500"
  },

  bestPrice: {
    display: "flex",
    alignItems: "center",
    gap: "12px"
  },

  bestOldPrice: {
    textDecoration: "line-through",
    color: "#94a3b8",
    fontSize: "18px"
  },

  bestOfferPrice: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#ef4444"
  },

  bestPriceValue: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#22c55e"
  },

  bestImage: (isMobile) => ({
    width: isMobile ? "100px" : "150px",
    height: isMobile ? "100px" : "150px",
    objectFit: "cover",
    borderRadius: "16px",
    border: "2px solid #e2e8f0"
  }),

  // RECOMENDACIONES
  smartSection: {
    marginBottom: "32px"
  },

  smartSectionTitle: (darkMode) => ({
    fontSize: "20px",
    fontWeight: "700",
    color: darkMode ? "#fff" : "#0f172a",
    marginBottom: "16px"
  }),

  smartGrid: (isMobile) => ({
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(4, 1fr)",
    gap: "16px"
  }),

  smartCard: (darkMode) => ({
    background: darkMode ? "#1e293b" : "#fff",
    borderRadius: "16px",
    padding: "20px",
    textAlign: "center",
    boxShadow: darkMode ? "0 4px 16px rgba(0,0,0,0.2)" : "0 4px 16px rgba(0,0,0,0.04)",
    border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0",
    transition: "transform 0.2s",
    "&:hover": {
      transform: "translateY(-4px)"
    }
  }),

  smartCardIcon: {
    fontSize: "32px",
    marginBottom: "8px"
  },

  smartTitle: (isMobile) => ({
    fontSize: isMobile ? "14px" : "16px",
    margin: "0 0 4px 0",
    color: "#f59e0b",
    fontWeight: "700"
  }),

  smartText: (darkMode, isMobile) => ({
    fontSize: isMobile ? "13px" : "14px",
    margin: "0 0 4px 0",
    color: darkMode ? "#cbd5e1" : "#334155",
    fontWeight: "500"
  }),

  smartPrice: {
    fontSize: "16px",
    fontWeight: "700",
    color: "#22c55e",
    display: "block",
    marginTop: "4px"
  },

  // TABLA
  tableSection: (darkMode) => ({
    background: darkMode ? "#1e293b" : "#fff",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow: darkMode ? "0 8px 32px rgba(0,0,0,0.3)" : "0 8px 32px rgba(0,0,0,0.06)",
    border: darkMode ? "1px solid #334155" : "1px solid #e2e8f0"
  }),

  tableHeader: (darkMode) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 24px",
    borderBottom: darkMode ? "1px solid #334155" : "1px solid #e2e8f0"
  }),

  tableTitle: (darkMode) => ({
    fontSize: "18px",
    fontWeight: "700",
    color: darkMode ? "#fff" : "#0f172a"
  }),

  tableCount: {
    fontSize: "14px",
    color: "#94a3b8",
    fontWeight: "500"
  },

  tableWrapper: {
    overflowX: "auto",
    WebkitOverflowScrolling: "touch"
  },

  table: (darkMode) => ({
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "700px",
    background: darkMode ? "#1e293b" : "#fff"
  }),

  headerRow: (darkMode) => ({
    borderBottom: darkMode ? "2px solid #334155" : "2px solid #e2e8f0"
  }),

  headerLabel: (darkMode, isMobile) => ({
    padding: isMobile ? "12px 16px" : "16px 24px",
    fontWeight: "700",
    color: darkMode ? "#94a3b8" : "#64748b",
    fontSize: isMobile ? "12px" : "14px",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    background: darkMode ? "#0f172a" : "#f8fafc",
    position: "sticky",
    left: 0,
    zIndex: 5,
    minWidth: isMobile ? "100px" : "160px"
  }),

  headerCell: (darkMode, isMobile, index) => ({
    padding: isMobile ? "12px" : "16px",
    textAlign: "center",
    background: darkMode ? "#0f172a" : "#f8fafc",
    minWidth: isMobile ? "140px" : "200px",
    borderLeft: index > 0 ? (darkMode ? "1px solid #1e293b" : "1px solid #f1f5f9") : "none"
  }),

  productHeader: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px"
  },

  thumbImage: (isMobile) => ({
    width: isMobile ? "50px" : "70px",
    height: isMobile ? "50px" : "70px",
    objectFit: "cover",
    borderRadius: "10px",
    border: "2px solid #e2e8f0"
  }),

  productName: (isMobile) => ({
    fontWeight: "700",
    fontSize: isMobile ? "12px" : "14px",
    color: "#6366f1",
    textAlign: "center"
  }),

  productSku: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "400"
  },

  dataRow: (darkMode) => ({
    borderBottom: darkMode ? "1px solid #1e293b" : "1px solid #f1f5f9",
    "&:hover": {
      background: darkMode ? "#1e293b" : "#fafbfc"
    }
  }),

  label: (darkMode, isMobile) => ({
    padding: isMobile ? "10px 16px" : "14px 24px",
    fontWeight: "600",
    color: darkMode ? "#e2e8f0" : "#334155",
    fontSize: isMobile ? "12px" : "14px",
    background: darkMode ? "#0f172a" : "#fafbfc",
    position: "sticky",
    left: 0,
    zIndex: 3,
    minWidth: isMobile ? "100px" : "160px",
    borderRight: darkMode ? "1px solid #1e293b" : "1px solid #f1f5f9"
  }),

  cell: (darkMode, isMobile) => ({
    padding: isMobile ? "10px 12px" : "14px 20px",
    textAlign: "center",
    color: darkMode ? "#f1f5f9" : "#1e293b",
    fontSize: isMobile ? "12px" : "14px",
    minWidth: isMobile ? "120px" : "160px",
    borderLeft: darkMode ? "1px solid #1e293b" : "1px solid #f1f5f9"
  }),

  actionRow: (darkMode) => ({
    borderTop: darkMode ? "2px solid #334155" : "2px solid #e2e8f0"
  }),

  image: (isMobile) => ({
    width: isMobile ? "80px" : "120px",
    height: isMobile ? "80px" : "120px",
    objectFit: "cover",
    borderRadius: "12px"
  }),

  longText: (isMobile) => ({
    whiteSpace: "pre-wrap",
    lineHeight: 1.5,
    fontSize: isMobile ? "11px" : "13px",
    minWidth: isMobile ? "120px" : "180px",
    maxWidth: isMobile ? "120px" : "180px",
    wordBreak: "break-word",
    textAlign: "left",
    margin: "0 auto"
  }),

  price: (isMobile) => ({
    fontSize: isMobile ? "16px" : "20px",
    fontWeight: "700",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px"
  }),

  bestTag: {
    fontSize: "14px"
  },

  tagValue: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: "10px",
    background: "#eef2ff",
    color: "#4f46e5",
    fontSize: "12px",
    fontWeight: "500"
  },

  badgeYes: {
    display: "inline-block",
    padding: "2px 12px",
    borderRadius: "10px",
    background: "#dcfce7",
    color: "#16a34a",
    fontSize: "12px",
    fontWeight: "600"
  },

  badgeNo: {
    display: "inline-block",
    padding: "2px 12px",
    borderRadius: "10px",
    background: "#fee2e2",
    color: "#dc2626",
    fontSize: "12px",
    fontWeight: "600"
  },

  emptyValue: {
    color: "#94a3b8",
    fontSize: "13px"
  },

  removeBtn: (isMobile) => ({
    background: "linear-gradient(135deg, #dc2626, #ef4444)",
    color: "#fff",
    border: "none",
    padding: isMobile ? "6px 14px" : "8px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: isMobile ? "11px" : "13px",
    transition: "transform 0.2s",
    "&:hover": {
      transform: "scale(1.05)"
    }
  }),

  // EMPTY STATE
  emptyBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "60px 20px",
    background: "#fff",
    borderRadius: "20px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.06)"
  },

  emptyIcon: {
    fontSize: "64px"
  },

  empty: (darkMode, isMobile) => ({
    color: darkMode ? "#e2e8f0" : "#334155",
    textAlign: "center",
    fontSize: isMobile ? "18px" : "24px",
    fontWeight: "600",
    margin: 0
  }),

  emptySub: (darkMode) => ({
    color: darkMode ? "#94a3b8" : "#64748b",
    textAlign: "center",
    fontSize: "14px",
    margin: 0
  }),

  addBtn: {
    background: "linear-gradient(135deg, #22c55e, #16a34a)",
    color: "#fff",
    border: "none",
    padding: "14px 32px",
    borderRadius: "12px",
    fontWeight: "700",
    fontSize: "16px",
    cursor: "pointer",
    transition: "transform 0.2s",
    marginTop: "8px",
    "&:hover": {
      transform: "scale(1.03)"
    }
  }
};