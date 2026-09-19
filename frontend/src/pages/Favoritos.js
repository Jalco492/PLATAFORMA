import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { FaShoppingCart, FaHeart, FaChartLine } from "react-icons/fa";

// 🔥 URL DE IMAGEN
const getImageUrl = (imagen) => {
  if (!imagen) return "https://via.placeholder.com/300x300?text=Sin+Imagen";
  if (imagen.startsWith("http://") || imagen.startsWith("https://")) return imagen;
  if (imagen.startsWith("/")) return `https://backend-zuib.onrender.com${imagen}`;
  return `https://backend-zuib.onrender.com/${imagen}`;
};

// 🔥 obtenerImagen
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

// 🔥 helpers
const parseNumero = (v) => {
  const n = parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
};

const getTipoVentaAmigable = (tipoVenta) => {
  const map = {
    metro_cuadrado: "Metro cuadrado",
    metro_lineal: "Metro lineal",
    caja: "Caja",
    paquete: "Paquete",
    pieza: "Pieza",
    presentacion: "Unidad",
    unidad: "Unidad",
    tramo: "Tramo",
  };
  return map[tipoVenta] || "Otros";
};

// 🔥 Precio unitario comparativo
const calcularPrecioUnitario = (p) => {
  const precio = parseNumero(p.precioOferta || p.precio);
  const t = p.tipoVenta;
  if (t === "metro_cuadrado") return { valor: precio, unidad: "m²" };
  if (t === "metro_lineal") {
    const ancho = parseNumero(p.anchoProducto);
    const m2 = parseNumero(p.metrosCuadrados) || (ancho > 0 ? ancho * parseNumero(p.metrosPorRollo) : 0);
    if (m2 > 0) return { valor: precio / m2, unidad: "m²" };
    return { valor: precio, unidad: "ml" };
  }
  if (t === "caja" || t === "paquete") {
    const piezas = parseNumero(p.piezasCaja) || 1;
    const ancho = parseNumero(p.ancho);
    const alto = parseNumero(p.alto);
    const uA = (p.unidadAncho || "cm").toLowerCase();
    const uB = (p.unidadAlto || "cm").toLowerCase();
    const cA = uA === "m" ? 1 : uA === "mm" ? 0.001 : 0.01;
    const cB = uB === "m" ? 1 : uB === "mm" ? 0.001 : 0.01;
    const m2 = (ancho * cA) * (alto * cB) * piezas;
    if (m2 > 0) return { valor: precio / m2, unidad: "m²" };
    return { valor: precio / piezas, unidad: "pieza" };
  }
  if (t === "pieza") {
    const ancho = parseNumero(p.ancho);
    const alto = parseNumero(p.alto);
    const uA = (p.unidadAncho || "cm").toLowerCase();
    const uB = (p.unidadAlto || "cm").toLowerCase();
    const cA = uA === "m" ? 1 : uA === "mm" ? 0.001 : 0.01;
    const cB = uB === "m" ? 1 : uB === "mm" ? 0.001 : 0.01;
    const m2 = (ancho * cA) * (alto * cB);
    if (m2 > 0) return { valor: precio / m2, unidad: "m²" };
    return { valor: precio, unidad: "pieza" };
  }
  if (t === "presentacion") {
    const cob = parseNumero(p.cobertura);
    if (cob > 0) return { valor: precio / cob, unidad: "m²" };
    return { valor: precio, unidad: "unidad" };
  }
  return { valor: precio, unidad: "unidad" };
};

export default function Favoritos() {
  const [favoritos, setFavoritos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");

  // 🔔 Notificación
  const [notificacion, setNotificacion] = useState(null);
  const mostrarNotificacion = (mensaje, tipo = "success") => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => setNotificacion(null), 2500);
  };

  // 🔍 Búsqueda y orden
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState("recientes");

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const navigate = useNavigate();

  // 📋 Cotizador y pedido
  const [cotizador, setCotizador] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cotizador")) || []; } catch { return []; }
  });
  const [pedido, setPedido] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("carritoPedido")) || []; } catch { return []; }
  });

  useEffect(() => { localStorage.setItem("cotizador", JSON.stringify(cotizador)); }, [cotizador]);
  useEffect(() => { sessionStorage.setItem("carritoPedido", JSON.stringify(pedido)); }, [pedido]);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isDesktop = windowWidth >= 1024;

  // 1. CARGAR DATA
  useEffect(() => {
    api.get("/productos").then((res) => setProductos(res.data)).catch(console.log);
    api.get("/categorias").then((res) => setCategorias(res.data)).catch(console.log);
    api.get("/subcategorias").then((res) => setSubcategorias(res.data)).catch(console.log);
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

  // 🔄 ESCUCHAR EVENTOS EXTERNOS (para actualizar stats en vivo)
  useEffect(() => {
    const actualizar = () => {
      const favsLocal = JSON.parse(localStorage.getItem("favoritos")) || [];
      if (productos.length > 0) {
        const datosActualizados = favsLocal
          .map(fav => productos.find(p => p.id === fav.id))
          .filter(p => p !== undefined);
        setFavoritos(datosActualizados);
      } else {
        setFavoritos(favsLocal);
      }
    };
    window.addEventListener("favoritosActualizado", actualizar);
    window.addEventListener("storage", actualizar);
    return () => {
      window.removeEventListener("favoritosActualizado", actualizar);
      window.removeEventListener("storage", actualizar);
    };
  }, [productos]);

  // 🔥 ELIMINAR
  const eliminarFavorito = (id) => {
    const nuevos = favoritos.filter(f => f.id !== id);
    setFavoritos(nuevos);
    localStorage.setItem("favoritos", JSON.stringify(nuevos));
    mostrarNotificacion("🗑 Producto eliminado de favoritos", "warning");
    window.dispatchEvent(new Event("favoritosActualizado"));
  };

  // ⚖️ estado cotizador / pedido
  const estaEnCotizador = (id) => cotizador.some(p => Number(p.id) === Number(id));
  const estaEnPedido = (id) => pedido.some(p => Number(p.id) === Number(id));

  // 🛒 agregar cotizador
  const agregarCotizador = (producto, e) => {
    if (e) e.stopPropagation();
    const existe = cotizador.find(p => Number(p.id) === Number(producto.id));
    if (existe) {
      mostrarNotificacion("⚠️ Ya está en el cotizador", "warning");
      return;
    }
    const nuevo = [...cotizador, { ...producto, imagen: obtenerImagen(producto), cantidad: 1 }];
    setCotizador(nuevo);
    localStorage.setItem("cotizador", JSON.stringify(nuevo));
    mostrarNotificacion("✅ Agregado al cotizador", "success");
    window.dispatchEvent(new Event("cotizadorActualizado"));
  };

  // 🛒 agregar pedido
  const agregarAlPedido = (producto, e) => {
    if (e) e.stopPropagation();
    const existe = pedido.find(p => Number(p.id) === Number(producto.id));
    let nuevoPedido;
    if (existe) {
      nuevoPedido = pedido.map(p =>
        Number(p.id) === Number(producto.id)
          ? { ...p, cantidad: Number(p.cantidad) + 1, subtotal: (Number(p.precio) || 0) * (Number(p.cantidad) + 1) }
          : p
      );
      mostrarNotificacion(`✅ "${producto.nombre}" +1 al pedido`, "success");
    } else {
      const precio = Number(producto.oferta ? producto.precioOferta : producto.precio) || 0;
      nuevoPedido = [...pedido, {
        id: producto.id,
        nombre: producto.nombre || "Producto",
        sku: producto.sku || "N/A",
        precio,
        imagen: obtenerImagen(producto),
        tipoVenta: producto.tipoVenta || "unidad",
        presentacion: producto.presentacion || "Unidad",
        cobertura: producto.cobertura || 0,
        categoria: producto.categoria || "",
        subcategoria: producto.subcategoria || "",
        ancho: producto.ancho || 0,
        alto: producto.alto || 0,
        anchoProducto: producto.anchoProducto || 0,
        metrosPorRollo: producto.metrosPorRollo || 0,
        piezasCaja: producto.piezasCaja || 0,
        grueso: producto.grueso || 0,
        unidadGrueso: producto.unidadGrueso || "mm",
        unidadAncho: producto.unidadAncho || "cm",
        unidadAlto: producto.unidadAlto || "cm",
        metrosCuadrados: producto.metrosCuadrados || 0,
        cantidad: 1,
        subtotal: precio,
      }];
      mostrarNotificacion(`✅ "${producto.nombre}" agregado al pedido`, "success");
    }
    setPedido(nuevoPedido);
    sessionStorage.setItem("carritoPedido", JSON.stringify(nuevoPedido));
    window.dispatchEvent(new Event("pedidoActualizado"));
  };

  const toggleFavorito = (producto) => {
    const existe = favoritos.some(f => f.id === producto.id);
    let nuevos;
    if (existe) {
      nuevos = favoritos.filter(f => f.id !== producto.id);
      mostrarNotificacion("🗑 Producto eliminado de favoritos", "warning");
    } else {
      nuevos = [...favoritos, producto];
      mostrarNotificacion("❤️ Agregado a favoritos", "success");
    }
    setFavoritos(nuevos);
    localStorage.setItem("favoritos", JSON.stringify(nuevos));
    window.dispatchEvent(new Event("favoritosActualizado"));
  };

  const esFavorito = (id) => favoritos.some(f => f.id === id);

  // ============================================================
  // 🔥 ANÁLISIS INTELIGENTE
  // ============================================================
  const favoritosAnalizados = useMemo(() => {
    return favoritos.map(p => {
      const precioActual = parseNumero(p.precioOferta || p.precio);
      const precioOriginal = parseNumero(p.precio);
      const tieneOferta = (p.oferta === 1 || p.oferta === true) && precioOriginal > 0 && precioActual < precioOriginal;
      const descuentoPct = tieneOferta
        ? Math.round(((precioOriginal - precioActual) / precioOriginal) * 100)
        : 0;
      const precioUnitario = calcularPrecioUnitario(p);
      return {
        ...p,
        _precioActual: precioActual,
        _precioOriginal: precioOriginal,
        _tieneOferta: tieneOferta,
        _descuentoPct: descuentoPct,
        _precioUnitario: precioUnitario,
      };
    });
  }, [favoritos]);

  // ============================================================
  // 🔥 ESTADÍSTICAS EN VIVO (se recalculan automáticamente)
  // ============================================================
  const stats = useMemo(() => {
    const total = favoritosAnalizados.length;
    const enOferta = favoritosAnalizados.filter(p => p._tieneOferta).length;
    const sinStock = favoritosAnalizados.filter(p => !p.stock || p.stock <= 0).length;
    const disponibles = total - sinStock;

    const valorTotal = favoritosAnalizados.reduce((acc, p) => acc + p._precioActual, 0);

    const ahorro = favoritosAnalizados.reduce(
      (acc, p) => acc + (p._tieneOferta ? (p._precioOriginal - p._precioActual) : 0),
      0
    );

    // Descuento promedio en los que tienen oferta
    const descuentoPromedio = enOferta > 0
      ? Math.round(
          favoritosAnalizados
            .filter(p => p._tieneOferta)
            .reduce((acc, p) => acc + p._descuentoPct, 0) / enOferta
        )
      : 0;

    // Precio promedio
    const precioPromedio = total > 0 ? valorTotal / total : 0;

    // Categoría más frecuente
    const categoriasCount = {};
    favoritosAnalizados.forEach(p => {
      if (p.categoria) categoriasCount[p.categoria] = (categoriasCount[p.categoria] || 0) + 1;
    });
    const categoriaTop = Object.keys(categoriasCount).sort(
      (a, b) => categoriasCount[b] - categoriasCount[a]
    )[0] || "—";

    // Precio unitario más bajo (por m²)
    const conPrecioUnitario = favoritosAnalizados.filter(
      p => p._precioUnitario.valor > 0 && p._precioUnitario.unidad === "m²"
    );
    const mejorPrecioM2 = conPrecioUnitario.length > 0
      ? [...conPrecioUnitario].sort((a, b) => a._precioUnitario.valor - b._precioUnitario.valor)[0]
      : null;

    return {
      total,
      enOferta,
      sinStock,
      disponibles,
      valorTotal,
      ahorro,
      descuentoPromedio,
      precioPromedio,
      categoriaTop,
      mejorPrecioM2,
    };
  }, [favoritosAnalizados]);

  // 🔥 FILTRADO + ORDEN
  const favoritosFiltrados = useMemo(() => {
    let lista = [...favoritosAnalizados];

    if (busqueda.trim()) {
      const t = busqueda.toLowerCase();
      lista = lista.filter(p =>
        (p.nombre || "").toLowerCase().includes(t) ||
        (p.descripcion || "").toLowerCase().includes(t) ||
        (p.categoria || "").toLowerCase().includes(t) ||
        (p.sku || "").toLowerCase().includes(t)
      );
    }

    switch (orden) {
      case "precio-asc": lista.sort((a, b) => a._precioActual - b._precioActual); break;
      case "precio-desc": lista.sort((a, b) => b._precioActual - a._precioActual); break;
      case "nombre-asc": lista.sort((a, b) => (a.nombre || "").localeCompare(b.nombre || "")); break;
      case "nombre-desc": lista.sort((a, b) => (b.nombre || "").localeCompare(a.nombre || "")); break;
      case "descuento": lista.sort((a, b) => b._descuentoPct - a._descuentoPct); break;
      case "recientes":
      default:
        lista.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
        break;
    }

    return lista;
  }, [favoritosAnalizados, busqueda, orden]);

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

      {/* NOTIFICACIÓN */}
      {notificacion && (
        <div style={{
          position: "fixed",
          top: "90px",
          right: "20px",
          background: notificacion.tipo === "warning"
            ? "linear-gradient(135deg, #f59e0b, #d97706)"
            : "linear-gradient(135deg, #10b981, #059669)",
          color: "#fff",
          padding: "14px 22px",
          borderRadius: "12px",
          fontSize: "14px",
          fontWeight: "600",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          zIndex: 9999,
          animation: "slideInRight 0.4s ease",
          maxWidth: "90%",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          {notificacion.mensaje}
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes floatHeart {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }
        @keyframes shimmerStat {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .fav-card {
          transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease;
        }
        .fav-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 20px 45px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.06) !important;
        }
        .fav-card:hover .fav-img {
          transform: scale(1.06);
        }
        .fav-img {
          transition: transform 0.5s ease;
        }
        .stat-live-dot {
          animation: pulseDot 1.8s ease-in-out infinite;
        }
      `}</style>

      <div style={styles.container(isDesktop)}>
        {/* 🔥 HERO PREMIUM */}
        <div style={styles.heroSection(darkMode)}>
          <div style={styles.heroContent}>
            <div style={styles.heroBadge}>
              <span style={styles.heroBadgeIcon}>❤️</span>
              <span>LISTA DE DESEOS</span>
              <span style={styles.livePill}>
                <span className="stat-live-dot" style={styles.liveDot}></span>
                EN VIVO
              </span>
            </div>
            <h1 style={styles.heroTitle(darkMode, isMobile)}>
              Mis <span style={styles.heroTitleAccent(darkMode)}>Favoritos</span>
            </h1>
            <p style={styles.heroSubtitle(darkMode)}>
              Análisis en tiempo real de todo lo que has guardado.
            </p>
          </div>

          {/* ⚡ ESTADÍSTICAS EN VIVO */}
          {favoritos.length > 0 && (
            <div style={styles.statsGrid(isMobile)}>
              <div style={styles.statCard(darkMode)}>
                <div style={styles.statIconWrap("#f43f5e")}>❤️</div>
                <div style={styles.statText}>
                  <div style={styles.statValue(darkMode)}>{stats.total}</div>
                  <div style={styles.statLabel(darkMode)}>Guardados</div>
                </div>
              </div>

              <div style={styles.statCard(darkMode)}>
                <div style={styles.statIconWrap("#f59e0b")}>🔥</div>
                <div style={styles.statText}>
                  <div style={styles.statValue(darkMode)}>{stats.enOferta}</div>
                  <div style={styles.statLabel(darkMode)}>En oferta</div>
                </div>
              </div>

              <div style={styles.statCard(darkMode)}>
                <div style={styles.statIconWrap("#10b981")}>💸</div>
                <div style={styles.statText}>
                  <div style={styles.statValue(darkMode)}>
                    ${stats.ahorro.toFixed(0)}
                  </div>
                  <div style={styles.statLabel(darkMode)}>Puedes ahorrar</div>
                </div>
              </div>

              <div style={styles.statCard(darkMode)}>
                <div style={styles.statIconWrap("#3b82f6")}>💰</div>
                <div style={styles.statText}>
                  <div style={styles.statValue(darkMode)}>
                    ${stats.valorTotal.toFixed(0)}
                  </div>
                  <div style={styles.statLabel(darkMode)}>Valor total</div>
                </div>
              </div>

              <div style={styles.statCard(darkMode)}>
                <div style={styles.statIconWrap("#22c55e")}>📦</div>
                <div style={styles.statText}>
                  <div style={styles.statValue(darkMode)}>{stats.disponibles}</div>
                  <div style={styles.statLabel(darkMode)}>Disponibles</div>
                </div>
              </div>

              <div style={styles.statCard(darkMode)}>
                <div style={styles.statIconWrap("#8b5cf6")}>📈</div>
                <div style={styles.statText}>
                  <div style={styles.statValue(darkMode)}>{stats.descuentoPromedio}%</div>
                  <div style={styles.statLabel(darkMode)}>Desc. promedio</div>
                </div>
              </div>
            </div>
          )}

          {/* 🎯 INSIGHTS INTELIGENTES */}
          {favoritos.length > 0 && (
            <div style={styles.insightsWrap(isMobile)}>
              {stats.mejorPrecioM2 && (
                <div style={styles.insightCard(darkMode)}>
                  <div style={styles.insightIcon}>💎</div>
                  <div style={styles.insightText}>
                    <div style={styles.insightLabel(darkMode)}>
                      Mejor precio por m² en tu lista
                    </div>
                    <div style={styles.insightValue(darkMode)}>
                      {stats.mejorPrecioM2.nombre}
                      <span style={styles.insightHighlight}>
                        ${stats.mejorPrecioM2._precioUnitario.valor.toFixed(2)}/m²
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {stats.categoriaTop !== "—" && (
                <div style={styles.insightCard(darkMode)}>
                  <div style={styles.insightIcon}>🏷️</div>
                  <div style={styles.insightText}>
                    <div style={styles.insightLabel(darkMode)}>
                      Categoría más guardada
                    </div>
                    <div style={styles.insightValue(darkMode)}>
                      {stats.categoriaTop}
                    </div>
                  </div>
                </div>
              )}

              {stats.sinStock > 0 && (
                <div style={styles.insightCard(darkMode)}>
                  <div style={styles.insightIcon}>⚠️</div>
                  <div style={styles.insightText}>
                    <div style={styles.insightLabel(darkMode)}>
                      Productos sin stock
                    </div>
                    <div style={styles.insightValue(darkMode)}>
                      {stats.sinStock} en tu lista
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BARRA DE BÚSQUEDA + ORDEN */}
        {favoritos.length > 0 && (
          <div style={styles.controlsBar(darkMode, isMobile)}>
            <div style={styles.searchWrap}>
              <span style={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Buscar en favoritos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={styles.searchInput(darkMode)}
              />
              {busqueda && (
                <button
                  onClick={() => setBusqueda("")}
                  style={styles.searchClear}
                  aria-label="Limpiar búsqueda"
                >
                  ✕
                </button>
              )}
            </div>

            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              style={styles.selectOrden(darkMode)}
            >
              <option value="recientes">🆕 Más recientes</option>
              <option value="precio-asc">💰 Precio: menor a mayor</option>
              <option value="precio-desc">💎 Precio: mayor a menor</option>
              <option value="nombre-asc">🔤 Nombre A-Z</option>
              <option value="nombre-desc">🔡 Nombre Z-A</option>
              <option value="descuento">🔥 Mayor descuento</option>
            </select>
          </div>
        )}

        {/* RESULTADOS DE BÚSQUEDA */}
        {favoritos.length > 0 && busqueda && (
          <div style={styles.resultsInfo(darkMode)}>
            🔍 {favoritosFiltrados.length} resultado{favoritosFiltrados.length !== 1 ? "s" : ""} para
            "<strong>{busqueda}</strong>"
          </div>
        )}

        {/* EMPTY STATE */}
        {favoritos.length === 0 && (
          <div style={styles.emptyBox(darkMode, isMobile)}>
            <div style={styles.emptyIconWrap}>
              <FaHeart style={{ fontSize: "70px", color: "#f43f5e", animation: "floatHeart 3s ease-in-out infinite" }} />
            </div>
            <h2 style={styles.emptyTitle(darkMode, isMobile)}>Aún no tienes favoritos</h2>
            <p style={styles.emptyText(darkMode)}>
              Explora nuestro catálogo y guarda los productos que te enamoren.
              Los encontrarás aquí cuando vuelvas.
            </p>
            <button style={styles.shopBtn} onClick={() => navigate("/productos")}>
              🛍️ Explorar productos
            </button>
          </div>
        )}

        {/* EMPTY FILTRADO */}
        {favoritos.length > 0 && favoritosFiltrados.length === 0 && (
          <div style={styles.emptyBox(darkMode, isMobile)}>
            <div style={styles.emptyIconWrap}>
              <span style={{ fontSize: "60px" }}>🔍</span>
            </div>
            <h2 style={styles.emptyTitle(darkMode, isMobile)}>Sin resultados</h2>
            <p style={styles.emptyText(darkMode)}>
              No encontramos favoritos que coincidan con "{busqueda}".
            </p>
            <button style={styles.shopBtn} onClick={() => setBusqueda("")}>
              Limpiar búsqueda
            </button>
          </div>
        )}

        {/* GRID DE FAVORITOS */}
        {favoritosFiltrados.length > 0 && (
          <div style={styles.grid(windowWidth)}>
            {favoritosFiltrados.map((p) => (
              <div
                key={p.id}
                className="fav-card"
                style={styles.card(darkMode)}
                onClick={() => navigate(`/producto/${p.id}`)}
              >
                {/* BADGES */}
                <div style={styles.badgesWrap}>
                  {p._tieneOferta && (
                    <span style={styles.badgeOferta}>🔥 -{p._descuentoPct}%</span>
                  )}
                  {p.nuevo === 1 && <span style={styles.badgeNuevo}>🆕</span>}
                  {p.stock > 0 && p.stock <= 3 && <span style={styles.badgeStock}>⚡ Últimas</span>}
                  {(!p.stock || p.stock <= 0) && <span style={styles.badgeAgotado}>Agotado</span>}
                </div>

                {/* BOTÓN ELIMINAR */}
                <button
                  onClick={(e) => { e.stopPropagation(); eliminarFavorito(p.id); }}
                  style={styles.removeBtn(isMobile)}
                  title="Quitar de favoritos"
                >
                  <FaHeart />
                </button>

                {/* IMAGEN */}
                <div style={styles.imageContainer(isMobile, darkMode)}>
                  <img
                    src={obtenerImagen(p)}
                    alt={p.nombre}
                    className="fav-img"
                    style={styles.image}
                    loading="lazy"
                    onError={(e) => { e.target.src = "https://via.placeholder.com/300x300?text=Sin+Imagen"; }}
                  />
                </div>

                {/* INFO */}
                <div style={styles.info(isMobile)}>
                  <div style={styles.tags}>
                    {p.categoria && <span style={styles.tagCat}>📂 {p.categoria.slice(0, 12)}</span>}
                    {p.tipoVenta && (
                      <span style={styles.tagVenta}>
                        🚚 {getTipoVentaAmigable(p.tipoVenta)}
                      </span>
                    )}
                    {p.material && <span style={styles.tagMat}>🧱 {p.material}</span>}
                  </div>

                  <h3 style={styles.name(darkMode, isMobile)}>{p.nombre}</h3>

                  {!isMobile && p.descripcion && (
                    <p style={styles.desc(darkMode)}>
                      {p.descripcion.slice(0, 55)}
                      {p.descripcion.length > 55 && "..."}
                    </p>
                  )}

                  <div style={styles.precioRow}>
                    {p._tieneOferta ? (
                      <>
                        <span style={styles.oldPrice}>${p._precioOriginal.toFixed(0)}</span>
                        <span style={styles.offerPrice(isMobile)}>${p._precioActual.toFixed(0)}</span>
                      </>
                    ) : (
                      <span style={styles.price(darkMode, isMobile)}>${p._precioActual.toFixed(0)}</span>
                    )}
                  </div>

                  {p._precioUnitario.valor > 0 && (
                    <div style={styles.unitPrice(darkMode)}>
                      <FaChartLine style={{ fontSize: "10px" }} />
                      ≈ ${p._precioUnitario.valor.toFixed(2)} / {p._precioUnitario.unidad}
                    </div>
                  )}

                  {p.stock > 0 && (
                    <div style={styles.stockInfo(darkMode)}>
                      <span style={styles.stockDot(p.stock)}></span>
                      {p.stock > 10
                        ? "Disponible"
                        : p.stock > 3
                        ? `${p.stock} disponibles`
                        : `¡Solo ${p.stock}!`}
                    </div>
                  )}

                  <div style={styles.actions}>
                    <button
                      style={styles.cotizadorBtn(isMobile)}
                      onClick={(e) => agregarCotizador(p, e)}
                      title="Agregar al cotizador"
                    >
                      📋 {isMobile ? "" : "Cotizar"}
                    </button>
                    <button
                      style={styles.pedidoBtn(isMobile, estaEnPedido(p.id))}
                      onClick={(e) => agregarAlPedido(p, e)}
                      title="Agregar al pedido"
                    >
                      <FaShoppingCart style={{ fontSize: isMobile ? "11px" : "12px" }} />
                    </button>
                    <button
                      style={styles.deleteBtn(isMobile)}
                      onClick={(e) => { e.stopPropagation(); eliminarFavorito(p.id); }}
                      title="Eliminar"
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

// ============================================================
// 🎨 ESTILOS
// ============================================================
const styles = {
  page: (darkMode) => ({
    background: darkMode
      ? "linear-gradient(180deg, #0a0a1a 0%, #0f172a 100%)"
      : "linear-gradient(180deg, #fdf2f8 0%, #f4f6f9 100%)",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
  }),

  container: (isDesktop) => ({
    maxWidth: isDesktop ? "1440px" : "1100px",
    width: "100%",
    margin: "0 auto",
    padding: "140px 16px 40px 16px",
    boxSizing: "border-box",
    flexGrow: 1,
  }),

  // HERO
  heroSection: (darkMode) => ({
    background: darkMode
      ? "linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #831843 100%)"
      : "linear-gradient(135deg, #ffe4e6 0%, #fce7f3 50%, #fae8ff 100%)",
    borderRadius: "24px",
    padding: "32px 28px",
    marginBottom: "24px",
    boxShadow: darkMode
      ? "0 20px 60px rgba(131, 24, 67, 0.3)"
      : "0 20px 60px rgba(244, 63, 94, 0.15)",
    position: "relative",
    overflow: "hidden",
  }),

  heroContent: {
    position: "relative",
    zIndex: 1,
    marginBottom: "20px",
  },

  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    background: "rgba(255,255,255,0.9)",
    color: "#f43f5e",
    padding: "6px 14px",
    borderRadius: "999px",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1.2px",
    marginBottom: "12px",
    boxShadow: "0 4px 12px rgba(244, 63, 94, 0.2)",
  },

  heroBadgeIcon: {
    fontSize: "14px",
    animation: "floatHeart 3s ease-in-out infinite",
    display: "inline-block",
  },

  livePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    background: "#dc2626",
    color: "#fff",
    padding: "2px 8px",
    borderRadius: "999px",
    fontSize: "9px",
    fontWeight: "900",
    letterSpacing: "0.5px",
    marginLeft: "4px",
  },

  liveDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#fff",
    display: "inline-block",
  },

  heroTitle: (darkMode, isMobile) => ({
    fontSize: isMobile ? "30px" : "44px",
    fontWeight: "900",
    margin: "0 0 8px 0",
    lineHeight: 1.1,
    letterSpacing: "-1px",
    color: darkMode ? "#fff" : "#831843",
  }),

  heroTitleAccent: (darkMode) => ({
    background: darkMode
      ? "linear-gradient(135deg, #f472b6, #ec4899, #db2777)"
      : "linear-gradient(135deg, #f43f5e, #ec4899, #be185d)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  }),

  heroSubtitle: (darkMode) => ({
    fontSize: "15px",
    color: darkMode ? "#c7d2fe" : "#831843",
    margin: 0,
    maxWidth: "560px",
    lineHeight: 1.5,
    opacity: 0.9,
  }),

  // STATS
  statsGrid: (isMobile) => ({
    display: "grid",
    gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
    gap: "12px",
    position: "relative",
    zIndex: 1,
    marginBottom: "16px",
  }),

  statCard: (darkMode) => ({
    background: darkMode ? "rgba(15, 23, 42, 0.7)" : "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    borderRadius: "16px",
    padding: "14px 16px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    border: darkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(255,255,255,0.9)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
    minWidth: 0,
    transition: "all 0.3s ease",
  }),

  statIconWrap: (color) => ({
    width: "38px",
    height: "38px",
    borderRadius: "12px",
    background: `${color}22`,
    color,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    flexShrink: 0,
  }),

  statText: {
    minWidth: 0,
    flex: 1,
  },

  statValue: (darkMode) => ({
    fontSize: "18px",
    fontWeight: "900",
    color: darkMode ? "#fff" : "#0f172a",
    lineHeight: 1.1,
    letterSpacing: "-0.3px",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),

  statLabel: (darkMode) => ({
    fontSize: "10.5px",
    fontWeight: "700",
    color: darkMode ? "#94a3b8" : "#64748b",
    letterSpacing: "0.4px",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),

  // INSIGHTS
  insightsWrap: (isMobile) => ({
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "10px",
    position: "relative",
    zIndex: 1,
  }),

  insightCard: (darkMode) => ({
    background: darkMode ? "rgba(15, 23, 42, 0.5)" : "rgba(255,255,255,0.75)",
    backdropFilter: "blur(8px)",
    borderRadius: "14px",
    padding: "12px 14px",
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.85)",
  }),

  insightIcon: {
    fontSize: "20px",
    flexShrink: 0,
    lineHeight: 1.2,
  },

  insightText: {
    flex: 1,
    minWidth: 0,
  },

  insightLabel: (darkMode) => ({
    fontSize: "10px",
    fontWeight: "700",
    color: darkMode ? "#94a3b8" : "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    marginBottom: "2px",
  }),

  insightValue: (darkMode) => ({
    fontSize: "13px",
    fontWeight: "800",
    color: darkMode ? "#fff" : "#0f172a",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    flexWrap: "wrap",
  }),

  insightHighlight: {
    background: "#10b981",
    color: "#fff",
    fontSize: "10px",
    fontWeight: "800",
    padding: "2px 6px",
    borderRadius: "6px",
    whiteSpace: "nowrap",
  },

  // CONTROLS
  controlsBar: (darkMode, isMobile) => ({
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    gap: "12px",
    marginBottom: "18px",
  }),

  searchWrap: {
    position: "relative",
    flex: 1,
    display: "flex",
    alignItems: "center",
  },

  searchIcon: {
    position: "absolute",
    left: "16px",
    fontSize: "16px",
    opacity: 0.5,
    pointerEvents: "none",
  },

  searchInput: (darkMode) => ({
    width: "100%",
    padding: "14px 44px 14px 44px",
    borderRadius: "14px",
    border: darkMode ? "1.5px solid #2d2d3f" : "1.5px solid #e2e8f0",
    background: darkMode ? "#14141e" : "#fff",
    color: darkMode ? "#fff" : "#0f172a",
    fontSize: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
    boxShadow: darkMode ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.04)",
  }),

  searchClear: {
    position: "absolute",
    right: "14px",
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px 8px",
    borderRadius: "6px",
  },

  selectOrden: (darkMode) => ({
    padding: "14px 16px",
    borderRadius: "14px",
    border: darkMode ? "1.5px solid #2d2d3f" : "1.5px solid #e2e8f0",
    background: darkMode ? "#14141e" : "#fff",
    color: darkMode ? "#fff" : "#0f172a",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    outline: "none",
    minWidth: "200px",
    boxShadow: darkMode ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.04)",
  }),

  resultsInfo: (darkMode) => ({
    fontSize: "13px",
    color: darkMode ? "#94a3b8" : "#64748b",
    marginBottom: "16px",
    padding: "10px 16px",
    background: darkMode ? "rgba(99, 102, 241, 0.08)" : "rgba(99, 102, 241, 0.06)",
    borderRadius: "10px",
    borderLeft: "3px solid #6366f1",
  }),

  // GRID
  grid: (windowWidth) => ({
    display: "grid",
    gridTemplateColumns:
      windowWidth < 500
        ? "repeat(2, 1fr)"
        : windowWidth < 768
        ? "repeat(2, 1fr)"
        : windowWidth < 1024
        ? "repeat(3, 1fr)"
        : windowWidth < 1280
        ? "repeat(4, 1fr)"
        : "repeat(5, 1fr)",
    gap: windowWidth < 600 ? "12px" : "20px",
  }),

  // CARD
  card: (darkMode) => ({
    background: darkMode ? "#1e293b" : "#fff",
    borderRadius: "18px",
    overflow: "hidden",
    cursor: "pointer",
    position: "relative",
    boxShadow: darkMode
      ? "0 4px 20px rgba(0,0,0,0.3)"
      : "0 4px 20px rgba(15, 23, 42, 0.06)",
    display: "flex",
    flexDirection: "column",
    border: darkMode ? "1px solid #2d2d3f" : "1px solid #f1f5f9",
  }),

  badgesWrap: {
    position: "absolute",
    top: "10px",
    left: "10px",
    zIndex: 5,
    display: "flex",
    flexDirection: "column",
    gap: "5px",
    alignItems: "flex-start",
  },

  badgeOferta: {
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.3px",
    boxShadow: "0 4px 10px rgba(239, 68, 68, 0.35)",
  },

  badgeNuevo: {
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    padding: "4px 8px",
    borderRadius: "999px",
    fontSize: "10px",
    fontWeight: "800",
    boxShadow: "0 4px 10px rgba(16, 185, 129, 0.35)",
  },

  badgeStock: {
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "9px",
    fontWeight: "800",
    letterSpacing: "0.2px",
    boxShadow: "0 4px 10px rgba(245, 158, 11, 0.35)",
  },

  badgeAgotado: {
    background: "linear-gradient(135deg, #64748b, #475569)",
    color: "#fff",
    padding: "4px 10px",
    borderRadius: "999px",
    fontSize: "9px",
    fontWeight: "800",
    letterSpacing: "0.2px",
  },

  removeBtn: (isMobile) => ({
    position: "absolute",
    top: "10px",
    right: "10px",
    width: isMobile ? "32px" : "38px",
    height: isMobile ? "32px" : "38px",
    borderRadius: "50%",
    border: "none",
    background: "linear-gradient(135deg, #f43f5e, #e11d48)",
    color: "#fff",
    cursor: "pointer",
    fontSize: isMobile ? "13px" : "15px",
    zIndex: 10,
    boxShadow: "0 6px 16px rgba(244, 63, 94, 0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    transition: "transform 0.2s ease",
  }),

  imageContainer: (isMobile, darkMode) => ({
    width: "100%",
    height: isMobile ? "140px" : "180px",
    overflow: "hidden",
    background: darkMode
      ? "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)"
      : "linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  }),

  image: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
    padding: "10px",
  },

  info: (isMobile) => ({
    padding: isMobile ? "10px" : "14px",
    display: "flex",
    flexDirection: "column",
    flexGrow: 1,
    gap: "4px",
  }),

  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    marginBottom: "4px",
  },

  tagCat: {
    background: "#e0f2fe",
    color: "#0369a1",
    padding: "2px 8px",
    borderRadius: "6px",
    fontSize: "9px",
    fontWeight: "700",
    letterSpacing: "0.2px",
  },

  tagVenta: {
    background: "#ede9fe",
    color: "#6d28d9",
    padding: "2px 8px",
    borderRadius: "6px",
    fontSize: "9px",
    fontWeight: "700",
    letterSpacing: "0.2px",
  },

  tagMat: {
    background: "#fef3c7",
    color: "#92400e",
    padding: "2px 8px",
    borderRadius: "6px",
    fontSize: "9px",
    fontWeight: "700",
    letterSpacing: "0.2px",
  },

  name: (darkMode, isMobile) => ({
    fontSize: isMobile ? "13px" : "15px",
    fontWeight: "800",
    color: darkMode ? "#fff" : "#0f172a",
    margin: "2px 0",
    lineHeight: 1.3,
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    height: isMobile ? "34px" : "40px",
    letterSpacing: "-0.2px",
  }),

  desc: (darkMode) => ({
    color: darkMode ? "#94a3b8" : "#64748b",
    lineHeight: 1.5,
    fontSize: "11.5px",
    margin: "2px 0 6px 0",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  }),

  precioRow: {
    display: "flex",
    alignItems: "baseline",
    gap: "8px",
    flexWrap: "wrap",
    marginTop: "2px",
  },

  price: (darkMode, isMobile) => ({
    color: darkMode ? "#60a5fa" : "#16a34a",
    fontSize: isMobile ? "17px" : "20px",
    fontWeight: "900",
    letterSpacing: "-0.5px",
  }),

  oldPrice: {
    textDecoration: "line-through",
    color: "#94a3b8",
    fontSize: "12px",
    fontWeight: "500",
  },

  offerPrice: (isMobile) => ({
    color: "#dc2626",
    fontSize: isMobile ? "18px" : "22px",
    fontWeight: "900",
    letterSpacing: "-0.6px",
  }),

  unitPrice: (darkMode) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "10.5px",
    fontWeight: "700",
    color: darkMode ? "#a5b4fc" : "#6366f1",
    background: darkMode ? "rgba(99, 102, 241, 0.15)" : "rgba(99, 102, 241, 0.08)",
    padding: "3px 8px",
    borderRadius: "6px",
    marginTop: "2px",
    alignSelf: "flex-start",
  }),

  stockInfo: (darkMode) => ({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "11px",
    color: darkMode ? "#94a3b8" : "#64748b",
    fontWeight: "600",
    marginTop: "2px",
  }),

  stockDot: (stock) => ({
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: stock > 10 ? "#10b981" : stock > 3 ? "#f59e0b" : "#ef4444",
    boxShadow: stock > 10
      ? "0 0 0 3px rgba(16,185,129,0.2)"
      : stock > 3
      ? "0 0 0 3px rgba(245,158,11,0.2)"
      : "0 0 0 3px rgba(239,68,68,0.2)",
    flexShrink: 0,
  }),

  actions: {
    display: "flex",
    gap: "6px",
    marginTop: "auto",
    paddingTop: "10px",
  },

  cotizadorBtn: (isMobile) => ({
    flex: 2,
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    color: "#fff",
    border: "none",
    padding: isMobile ? "8px 6px" : "10px 12px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: isMobile ? "11px" : "12px",
    letterSpacing: "0.2px",
    transition: "all 0.25s ease",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
    whiteSpace: "nowrap",
  }),

  pedidoBtn: (isMobile, estaEnPedido) => ({
    flex: 1,
    background: estaEnPedido
      ? "linear-gradient(135deg, #10b981, #059669)"
      : "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "#fff",
    border: "none",
    padding: isMobile ? "8px 4px" : "10px 8px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "800",
    transition: "all 0.25s ease",
    boxShadow: estaEnPedido
      ? "0 4px 12px rgba(16, 185, 129, 0.3)"
      : "0 4px 12px rgba(245, 158, 11, 0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  }),

  deleteBtn: (isMobile) => ({
    flex: 1,
    background: "#fee2e2",
    color: "#dc2626",
    border: "none",
    padding: isMobile ? "8px 4px" : "10px 8px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: isMobile ? "12px" : "13px",
    transition: "all 0.2s ease",
  }),

  // EMPTY
  emptyBox: (darkMode, isMobile) => ({
    background: darkMode ? "#1e293b" : "#fff",
    borderRadius: "24px",
    padding: isMobile ? "50px 20px" : "80px 40px",
    textAlign: "center",
    boxShadow: darkMode
      ? "0 20px 60px rgba(0,0,0,0.4)"
      : "0 20px 60px rgba(15, 23, 42, 0.06)",
    border: darkMode ? "1px solid #2d2d3f" : "1px solid #f1f5f9",
  }),

  emptyIconWrap: {
    marginBottom: "16px",
    display: "flex",
    justifyContent: "center",
  },

  emptyTitle: (darkMode, isMobile) => ({
    fontSize: isMobile ? "20px" : "26px",
    marginBottom: "8px",
    color: darkMode ? "#fff" : "#0f172a",
    fontWeight: "900",
    letterSpacing: "-0.5px",
  }),

  emptyText: (darkMode) => ({
    color: darkMode ? "#94a3b8" : "#64748b",
    fontSize: "14px",
    marginBottom: "24px",
    maxWidth: "420px",
    margin: "0 auto 24px auto",
    lineHeight: 1.6,
  }),

  shopBtn: {
    background: "linear-gradient(135deg, #f43f5e, #be185d)",
    color: "#fff",
    border: "none",
    padding: "14px 32px",
    borderRadius: "14px",
    cursor: "pointer",
    fontWeight: "800",
    fontSize: "14px",
    letterSpacing: "0.3px",
    transition: "all 0.25s ease",
    boxShadow: "0 8px 24px rgba(244, 63, 94, 0.35)",
  },
};