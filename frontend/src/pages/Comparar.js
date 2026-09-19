import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import {
  FaShoppingCart, FaTrash, FaArrowLeft, FaCheck, FaTimes,
  FaTrophy, FaChartBar, FaEyeSlash, FaEye, FaFire,
  FaStar, FaBoxOpen, FaRulerCombined, FaPalette, FaTruck
} from "react-icons/fa";

export default function Comparar() {
  const navigate = useNavigate();

  // 🌙 DARKMODE
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // ⚖️ PRODUCTOS DEL COMPARADOR
  const [comparador, setComparador] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("comparador")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("comparador", JSON.stringify(comparador));
  }, [comparador]);

  // ❤️ FAVORITOS (para el Navbar)
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos");
    return guardados ? JSON.parse(guardados) : [];
  });

  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  const obtenerImagen = (producto) => {
    if (!producto) return "https://via.placeholder.com/200";
    if (producto.imagen) return producto.imagen;
    let img = "";
    if (producto.imagenes && producto.imagenes.trim() !== "") {
      img = producto.imagenes.split(",")[0].trim();
    }
    if (!img) return "https://via.placeholder.com/200";
    if (img.startsWith("http")) return img;
    return `https://backend-zuib.onrender.com${img}`;
  };

  const toggleFavorito = (producto) => {
    const productoCompleto = {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      imagen: obtenerImagen(producto)
    };
    const existe = favoritos.find(fav => Number(fav.id) === Number(producto.id));
    if (existe) setFavoritos(favoritos.filter(f => Number(f.id) !== Number(producto.id)));
    else setFavoritos([...favoritos, productoCompleto]);
  };

  const esFavorito = (id) => favoritos.some(f => Number(f.id) === Number(id));

  // 🛒 PEDIDO
  const [pedido, setPedido] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("carritoPedido")) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    sessionStorage.setItem("carritoPedido", JSON.stringify(pedido));
  }, [pedido]);

  // 📋 COTIZADOR (para el Navbar si lo usa)
  const [cotizador, setCotizador] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cotizador")) || [];
    } catch {
      return [];
    }
  });

  // 🔔 NOTIFICACIÓN
  const [notificacion, setNotificacion] = useState(null);

  const mostrarNotificacion = (mensaje, tipo = "success") => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => setNotificacion(null), 2500);
  };

  // 📱 RESPONSIVE
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // 👁️ SOLO MOSTRAR DIFERENCIAS
  const [soloDiferencias, setSoloDiferencias] = useState(false);

  // 🔤 CARGAR DATA PARA NAVBAR (categorías, subcategorías, productos)
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);

  useEffect(() => {
    // Import dinámico para no romper si falla la API
    import("../services/api").then(({ default: api }) => {
      api.get("/productos").then((res) => setProductos(res.data)).catch(() => {});
      api.get("/categorias").then((res) => setCategorias(res.data)).catch(() => {});
      api.get("/subcategorias").then((res) => setSubcategorias(res.data)).catch(() => {});
    });
  }, []);

  // ❌ QUITAR DEL COMPARADOR
  const quitarDelComparador = (id) => {
    const nuevo = comparador.filter(p => Number(p.id) !== Number(id));
    setComparador(nuevo);
    mostrarNotificacion("🗑 Producto quitado del comparador", "warning");
  };

  const limpiarComparador = () => {
    if (!window.confirm("¿Vaciar todo el comparador?")) return;
    setComparador([]);
    mostrarNotificacion("🗑 Comparador vaciado", "warning");
  };

  // 🛒 AGREGAR AL PEDIDO
  const agregarAlPedido = (producto) => {
    const precio = Number(producto.oferta ? producto.precioOferta : producto.precio) || 0;
    const existe = pedido.find(p => Number(p.id) === Number(producto.id));

    let nuevoPedido;
    if (existe) {
      nuevoPedido = pedido.map(p =>
        Number(p.id) === Number(producto.id)
          ? { ...p, cantidad: Number(p.cantidad) + 1, subtotal: precio * (Number(p.cantidad) + 1) }
          : p
      );
      mostrarNotificacion(`✅ "${producto.nombre}" +1 al pedido`, "success");
    } else {
      nuevoPedido = [...pedido, {
        id: producto.id,
        nombre: producto.nombre || 'Producto',
        sku: producto.sku || 'N/A',
        precio,
        imagen: obtenerImagen(producto),
        tipoVenta: producto.tipoVenta || 'unidad',
        presentacion: producto.presentacion || 'Unidad',
        categoria: producto.categoria || '',
        subcategoria: producto.subcategoria || '',
        cantidad: 1,
        subtotal: precio
      }];
      mostrarNotificacion(`✅ "${producto.nombre}" agregado al pedido`, "success");
    }

    setPedido(nuevoPedido);
    window.dispatchEvent(new Event("pedidoActualizado"));
  };

  const estaEnPedido = (id) => pedido.some(p => Number(p.id) === Number(id));

  // ============================================================
  // 🧠 HELPERS INTELIGENTES
  // ============================================================

  const getPrecioFinal = (p) => {
    if (!p) return 0;
    return Number(p.oferta ? p.precioOferta : p.precio) || 0;
  };

  const getTipoVentaAmigable = (tipoVenta) => {
    const map = {
      'metro_cuadrado': '📐 Metro cuadrado',
      'metro_lineal': '📏 Metro lineal',
      'caja': '📦 Caja',
      'paquete': '🎁 Paquete',
      'pieza': '🧩 Pieza',
      'presentacion': '🔢 Unidad',
      'unidad': '🔢 Unidad',
      'tramo': '🪵 Tramo',
    };
    return map[tipoVenta] || (tipoVenta ? `🏷️ ${tipoVenta}` : 'Otros');
  };

  const getColorTipoVenta = (tipoVenta) => {
    const map = {
      'metro_cuadrado': { bg: "#dbeafe", color: "#1e40af" },
      'metro_lineal': { bg: "#e0f2fe", color: "#075985" },
      'caja': { bg: "#fef3c7", color: "#92400e" },
      'paquete': { bg: "#fce7f3", color: "#9d174d" },
      'pieza': { bg: "#ede9fe", color: "#5b21b6" },
      'presentacion': { bg: "#f1f5f9", color: "#334155" },
      'unidad': { bg: "#f1f5f9", color: "#334155" },
      'tramo': { bg: "#fed7aa", color: "#9a3412" },
    };
    return map[tipoVenta] || { bg: "#f1f5f9", color: "#334155" };
  };

  // ============================================================
  // 📊 DEFINICIÓN DE FILAS (con lógica de "mejor")
  // ============================================================
  const FILAS_COMPARACION = useMemo(() => [
    {
      grupo: "💰 Precio y oferta",
      icono: "💰",
      filas: [
        {
          key: "precioFinal",
          label: "Precio final",
          formato: (p) => {
            const p1 = Number(p.precio) || 0;
            const pf = getPrecioFinal(p);
            return p.oferta ? `$${pf.toFixed(2)}` : `$${p1.toFixed(2)}`;
          },
          valorNumerico: (p) => getPrecioFinal(p),
          mejor: "menor", // el más barato gana
          barra: true
        },
        {
          key: "precio",
          label: "Precio original",
          formato: (p) => `$${Number(p.precio || 0).toFixed(2)}`,
          valorNumerico: (p) => Number(p.precio) || 0,
          mejor: "menor",
          barra: true
        },
        {
          key: "descuento",
          label: "Descuento",
          formato: (p) => {
            if (!p.oferta || !p.precioOferta) return "—";
            const orig = Number(p.precio) || 0;
            const of = Number(p.precioOferta) || 0;
            if (orig <= 0) return "—";
            const pct = ((orig - of) / orig) * 100;
            return `${pct.toFixed(0)}% off`;
          },
          valorNumerico: (p) => {
            if (!p.oferta || !p.precioOferta) return 0;
            const orig = Number(p.precio) || 0;
            const of = Number(p.precioOferta) || 0;
            if (orig <= 0) return 0;
            return ((orig - of) / orig) * 100;
          },
          mejor: "mayor",
          destacar: true
        },
      ]
    },
    {
      grupo: "📦 Información general",
      icono: "📦",
      filas: [
        { key: "sku", label: "SKU" },
        { key: "categoria", label: "Categoría" },
        { key: "subcategoria", label: "Subcategoría" },
        { key: "tipo", label: "Tipo de producto" },
        { key: "material", label: "Material" },
        { key: "acabado", label: "Acabado" },
        { key: "tipo_diseno", label: "Tipo de diseño" },
      ]
    },
    {
      grupo: "🚚 Venta y medidas",
      icono: "🚚",
      filas: [
        {
          key: "tipoVenta",
          label: "Tipo de venta",
          formato: (p) => getTipoVentaAmigable(p.tipoVenta),
          chip: (p) => {
            const c = getColorTipoVenta(p.tipoVenta);
            return { bg: c.bg, color: c.color };
          }
        },
        {
          key: "ancho",
          label: "Ancho",
          formato: (p) => p.ancho ? `${p.ancho} ${p.unidadAncho || 'cm'}` : "—",
          valorNumerico: (p) => Number(p.ancho) || null,
          barra: true
        },
        {
          key: "alto",
          label: "Alto",
          formato: (p) => p.alto ? `${p.alto} ${p.unidadAlto || 'cm'}` : "—",
          valorNumerico: (p) => Number(p.alto) || null,
          barra: true
        },
        {
          key: "grueso",
          label: "Grueso",
          formato: (p) => p.grueso ? `${p.grueso} ${p.unidadGrueso || 'mm'}` : "—",
          valorNumerico: (p) => Number(p.grueso) || null,
          barra: true
        },
        {
          key: "cobertura",
          label: "Cobertura",
          formato: (p) => p.cobertura ? `${p.cobertura} m²` : "—",
          valorNumerico: (p) => Number(p.cobertura) || null,
          mejor: "mayor",
          barra: true
        },
        {
          key: "piezasCaja",
          label: "Piezas por caja",
          formato: (p) => p.piezasCaja || "—",
          valorNumerico: (p) => Number(p.piezasCaja) || null
        },
        {
          key: "metrosCuadrados",
          label: "Metros cuadrados",
          formato: (p) => p.metrosCuadrados ? `${p.metrosCuadrados} m²` : "—",
          valorNumerico: (p) => Number(p.metrosCuadrados) || null,
          mejor: "mayor",
          barra: true
        },
        {
          key: "metrosPorRollo",
          label: "Metros por rollo",
          formato: (p) => p.metrosPorRollo ? `${p.metrosPorRollo} m` : "—",
          valorNumerico: (p) => Number(p.metrosPorRollo) || null,
          mejor: "mayor",
          barra: true
        },
      ]
    },
    {
      grupo: "🏠 Uso y aplicación",
      icono: "🏠",
      filas: [
        { key: "uso", label: "Uso" },
        { key: "aplicacion", label: "Aplicación" },
        { key: "tipo_instalacion", label: "Instalación" },
      ]
    },
    {
      grupo: "📊 Disponibilidad",
      icono: "📊",
      filas: [
        {
          key: "stock",
          label: "Stock",
          formato: (p) => p.stock > 0 ? `${p.stock} uds` : "Sin stock",
          valorNumerico: (p) => Number(p.stock) || 0,
          mejor: "mayor",
          barra: true,
          chip: (p) => p.stock > 0
            ? { bg: "#d1fae5", color: "#065f46" }
            : { bg: "#fee2e2", color: "#991b1b" }
        },
        {
          key: "nuevo",
          label: "Nuevo",
          formato: (p) => (p.nuevo === 1 || p.nuevo === true) ? "Sí" : "—",
          chip: (p) => (p.nuevo === 1 || p.nuevo === true)
            ? { bg: "#d1fae5", color: "#065f46" }
            : null
        },
        {
          key: "destacado",
          label: "Destacado",
          formato: (p) => (p.destacado === 1 || p.destacado === true) ? "Sí" : "—",
          chip: (p) => (p.destacado === 1 || p.destacado === true)
            ? { bg: "#fef3c7", color: "#92400e" }
            : null
        },
      ]
    },
  ], []);

  // ============================================================
  // 🧠 DETECCIÓN DE "MEJOR" POR FILA
  // ============================================================
  const calcularMejorPorFila = (fila) => {
    if (!fila.valorNumerico || comparador.length < 2) return null;
    const valores = comparador
      .map(p => ({ id: p.id, valor: fila.valorNumerico(p) }))
      .filter(v => v.valor !== null && v.valor !== undefined && !isNaN(v.valor));

    if (valores.length === 0) return null;

    const todosIguales = valores.every(v => v.valor === valores[0].valor);
    if (todosIguales) return null;

    let ganador;
    if (fila.mejor === "menor") {
      ganador = valores.reduce((a, b) => (a.valor < b.valor ? a : b));
    } else if (fila.mejor === "mayor") {
      ganador = valores.reduce((a, b) => (a.valor > b.valor ? a : b));
    } else {
      return null;
    }
    return ganador.id;
  };

  // ============================================================
  // 📊 BARRAS VISUALES
  // ============================================================
  const getRangoFila = (fila) => {
    if (!fila.valorNumerico) return null;
    const valores = comparador
      .map(p => fila.valorNumerico(p))
      .filter(v => v !== null && v !== undefined && !isNaN(v));
    if (valores.length === 0) return null;
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    if (min === max) return null;
    return { min, max };
  };

  const normalizar = (v) => {
    if (v === null || v === undefined || v === "") return "";
    return String(v).trim().toLowerCase();
  };

  const filaTieneDiferencia = (fila) => {
    if (comparador.length < 2) return false;
    const valores = comparador.map(p => {
      const valorCrudo = fila.formato ? fila.formato(p) : p[fila.key];
      return normalizar(valorCrudo);
    });
    const primero = valores[0];
    return valores.some(v => v !== primero);
  };

  // ============================================================
  // 🏆 PUNTUACIÓN GENERAL
  // ============================================================
  const calcularPuntuaciones = () => {
    if (comparador.length < 2) return [];

    const criterios = [
      { key: "precio", peso: 30, mejor: "menor", valor: (p) => getPrecioFinal(p) },
      { key: "stock", peso: 20, mejor: "mayor", valor: (p) => Number(p.stock) || 0 },
      { key: "oferta", peso: 15, mejor: "mayor", valor: (p) => (p.oferta === 1 || p.oferta === true) ? 1 : 0 },
      { key: "destacado", peso: 10, mejor: "mayor", valor: (p) => (p.destacado === 1 || p.destacado === true) ? 1 : 0 },
      { key: "nuevo", peso: 10, mejor: "mayor", valor: (p) => (p.nuevo === 1 || p.nuevo === true) ? 1 : 0 },
      { key: "cobertura", peso: 15, mejor: "mayor", valor: (p) => Number(p.cobertura) || 0 },
    ];

    const puntuaciones = comparador.map(p => {
      let total = 0;
      criterios.forEach(c => {
        const valores = comparador.map(x => c.valor(x));
        const min = Math.min(...valores);
        const max = Math.max(...valores);
        const val = c.valor(p);

        if (max === min) {
          total += c.peso * 0.5;
        } else if (c.mejor === "menor") {
          // menor = mejor → invertir
          const norm = 1 - ((val - min) / (max - min));
          total += c.peso * norm;
        } else {
          const norm = (val - min) / (max - min);
          total += c.peso * norm;
        }
      });
      return {
        id: p.id,
        nombre: p.nombre,
        imagen: obtenerImagen(p),
        puntuacion: Math.round(total),
        precio: getPrecioFinal(p)
      };
    });

    return puntuaciones.sort((a, b) => b.puntuacion - a.puntuacion);
  };

  const puntuaciones = useMemo(() => calcularPuntuaciones(), [comparador]);

  // ============================================================
  // 💡 INSIGHTS AUTOMÁTICOS
  // ============================================================
  const generarInsights = () => {
    if (comparador.length < 2) return [];

    const insights = [];
    const precios = comparador.map(p => ({ nombre: p.nombre, precio: getPrecioFinal(p) }));
    const ordenados = [...precios].sort((a, b) => a.precio - b.precio);

    if (ordenados[0].precio > 0 && ordenados.length > 1) {
      const diff = ordenados[ordenados.length - 1].precio - ordenados[0].precio;
      const pct = ((diff / ordenados[ordenados.length - 1].precio) * 100).toFixed(0);
      if (diff > 0) {
        insights.push({
          icono: "💰",
          texto: `"${ordenados[0].nombre}" es ${pct}% más económico que "${ordenados[ordenados.length - 1].nombre}"`,
          tipo: "success"
        });
      }
    }

    const conStock = comparador.filter(p => p.stock > 0);
    const sinStock = comparador.filter(p => !p.stock || p.stock <= 0);

    if (sinStock.length > 0 && conStock.length > 0) {
      insights.push({
        icono: "⚠️",
        texto: `${sinStock.length} producto${sinStock.length > 1 ? "s" : ""} sin stock. Disponible${conStock.length > 1 ? "s" : ""}: ${conStock.map(p => p.nombre).join(", ")}`,
        tipo: "warning"
      });
    } else if (conStock.length === comparador.length) {
      insights.push({
        icono: "✅",
        texto: "Todos los productos tienen stock disponible",
        tipo: "success"
      });
    }

    const ofertas = comparador.filter(p => p.oferta === 1 || p.oferta === true);
    if (ofertas.length > 0) {
      insights.push({
        icono: "🔥",
        texto: `${ofertas.length} producto${ofertas.length > 1 ? "s" : ""} en oferta: ${ofertas.map(p => p.nombre).join(", ")}`,
        tipo: "info"
      });
    }

    return insights;
  };

  const insights = useMemo(() => generarInsights(), [comparador]);

  // ============================================================
  // 🎨 RENDER
  // ============================================================
  return (
    <div style={styles.page(darkMode)}>
      {notificacion && (
        <div style={{
          position: "fixed", top: "90px", right: "20px",
          background: notificacion.tipo === "warning"
            ? "linear-gradient(135deg, #f59e0b, #d97706)"
            : "linear-gradient(135deg, #10b981, #059669)",
          color: "#fff", padding: "14px 22px", borderRadius: "12px",
          fontSize: "14px", fontWeight: "600",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          zIndex: 9999, animation: "slideInRight 0.4s ease",
          maxWidth: "90%", display: "flex", alignItems: "center", gap: "8px"
        }}>
          {notificacion.mensaje}
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeInUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .comp-row-hover:hover {
          background: rgba(99, 102, 241, 0.04) !important;
        }
      `}</style>

      {/* ✅ NAVBAR COMPLETO (todas las props de Productos.js) */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        productos={productos}
        favoritos={favoritos}
        toggleFavorito={toggleFavorito}
        esFavorito={esFavorito}
        categorias={categorias}
        subcategorias={subcategorias}
      />

      <div style={styles.container(isMobile)}>
        {/* HEADER */}
        <div style={styles.header}>
          <button onClick={() => navigate(-1)} style={styles.backBtn(darkMode)}>
            <FaArrowLeft /> Volver
          </button>

          <div style={{ flex: 1, minWidth: "200px" }}>
            <h1 style={styles.title(darkMode)}>
              <FaTrophy style={{ color: "#f59e0b", marginRight: "10px" }} />
              Comparador Inteligente
            </h1>
            <p style={styles.subtitle(darkMode)}>
              {comparador.length === 0
                ? "No hay productos en el comparador"
                : `Comparando ${comparador.length} producto${comparador.length !== 1 ? "s" : ""}`}
            </p>
          </div>

          {comparador.length > 1 && (
            <button
              onClick={() => setSoloDiferencias(!soloDiferencias)}
              style={styles.toggleDiffBtn(darkMode, soloDiferencias)}
              title={soloDiferencias ? "Mostrar todo" : "Solo mostrar diferencias"}
            >
              {soloDiferencias ? <FaEye /> : <FaEyeSlash />}
              {soloDiferencias ? "Mostrar todo" : "Solo diferencias"}
            </button>
          )}

          {comparador.length > 0 && (
            <button onClick={limpiarComparador} style={styles.clearBtn}>
              <FaTrash /> Vaciar
            </button>
          )}
        </div>

        {/* ESTADO VACÍO */}
        {comparador.length === 0 && (
          <div style={styles.emptyState(darkMode)}>
            <div style={styles.emptyIcon}>⚖️</div>
            <h2 style={styles.emptyTitle(darkMode)}>Tu comparador está vacío</h2>
            <p style={styles.emptyText(darkMode)}>
              Agrega hasta 3 productos de la misma categoría para comparar sus características.
            </p>
            <button onClick={() => navigate("/productos")} style={styles.emptyBtn}>
              🛍️ Explorar productos
            </button>
          </div>
        )}

        {/* 🏆 RANKING DE PUNTUACIONES */}
        {comparador.length >= 2 && puntuaciones.length > 0 && (
          <div style={styles.rankingSection(darkMode)}>
            <h2 style={styles.sectionTitle(darkMode)}>
              🏆 Ranking general
            </h2>
            <div style={styles.rankingGrid(isMobile)}>
              {puntuaciones.map((pu, i) => {
                const producto = comparador.find(p => Number(p.id) === Number(pu.id));
                return (
                  <div
                    key={pu.id}
                    style={styles.rankingCard(darkMode, i)}
                  >
                    <div style={styles.rankMedal(i)}>
                      {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
                    </div>
                    <img
                      src={pu.imagen}
                      alt={pu.nombre}
                      style={styles.rankImg}
                    />
                    <h4 style={styles.rankName(darkMode)}>{pu.nombre}</h4>
                    <div style={styles.rankPrice}>${pu.precio.toFixed(2)}</div>

                    <div style={styles.progressBarWrapper}>
                      <div
                        style={styles.progressBarFill(i)}
                      />
                      <span style={styles.progressBarText}>
                        {pu.puntuacion} / 100
                      </span>
                    </div>

                    <button
                      onClick={() => agregarAlPedido(producto)}
                      style={{
                        ...styles.rankAddBtn,
                        background: estaEnPedido(producto.id)
                          ? "linear-gradient(135deg, #10b981, #059669)"
                          : "linear-gradient(135deg, #6366f1, #4f46e5)"
                      }}
                    >
                      <FaShoppingCart size={11} />
                      {estaEnPedido(producto.id) ? "✓ En pedido" : "Agregar"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 💡 INSIGHTS */}
        {comparador.length >= 2 && insights.length > 0 && (
          <div style={styles.insightsGrid(isMobile)}>
            {insights.map((ins, i) => (
              <div key={i} style={styles.insightCard(darkMode, ins.tipo)}>
                <span style={styles.insightIcon}>{ins.icono}</span>
                <span style={styles.insightText(darkMode)}>{ins.texto}</span>
              </div>
            ))}
          </div>
        )}

        {/* TABLA COMPARATIVA */}
        {comparador.length > 0 && (
          <div style={styles.tableWrapper(darkMode, isMobile)}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.thFeature(darkMode)}>
                    <div style={styles.thFeatureContent}>
                      <FaChartBar style={{ color: "#6366f1" }} />
                      <span>Característica</span>
                    </div>
                  </th>
                  {comparador.map(p => {
                    const esGanador = puntuaciones[0] && Number(puntuaciones[0].id) === Number(p.id);
                    return (
                      <th key={p.id} style={styles.thProduct(darkMode)}>
                        <div style={styles.productHeader}>
                          {esGanador && (
                            <div style={styles.winnerBadge}>
                              <FaTrophy size={10} /> Mejor valorado
                            </div>
                          )}
                          <button
                            onClick={() => quitarDelComparador(p.id)}
                            style={styles.removeBtn}
                            title="Quitar del comparador"
                          >
                            <FaTimes />
                          </button>

                          <div style={styles.imgWrapHeader}>
                            <img
                              src={obtenerImagen(p)}
                              alt={p.nombre}
                              style={styles.productImg(isMobile)}
                              onClick={() => navigate(`/producto/${p.id}`)}
                            />
                            {(p.oferta === 1 || p.oferta === true) && (
                              <span style={styles.offerBadgeHeader}>
                                <FaFire size={9} /> Oferta
                              </span>
                            )}
                          </div>

                          <h3
                            style={styles.productName(darkMode)}
                            onClick={() => navigate(`/producto/${p.id}`)}
                          >
                            {p.nombre}
                          </h3>

                          <div style={styles.productPrice}>
                            {(p.oferta === 1 || p.oferta === true) ? (
                              <>
                                <span style={styles.oldPrice}>${p.precio}</span>
                                <span style={styles.offerPrice}>${p.precioOferta}</span>
                              </>
                            ) : (
                              <span style={styles.price}>${p.precio}</span>
                            )}
                          </div>

                          <button
                            onClick={() => agregarAlPedido(p)}
                            style={{
                              ...styles.addBtn,
                              background: estaEnPedido(p.id)
                                ? "linear-gradient(135deg, #10b981, #059669)"
                                : "linear-gradient(135deg, #f59e0b, #d97706)"
                            }}
                          >
                            <FaShoppingCart size={11} />
                            {estaEnPedido(p.id) ? "En pedido (+1)" : "Agregar al pedido"}
                          </button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody>
                {FILAS_COMPARACION.map((grupo) => {
                  const filasVisibles = soloDiferencias
                    ? grupo.filas.filter(f => filaTieneDiferencia(f))
                    : grupo.filas;

                  if (filasVisibles.length === 0) return null;

                  return (
                    <>
                      <tr key={`grupo-${grupo.grupo}`}>
                        <td colSpan={comparador.length + 1} style={styles.groupRow(darkMode)}>
                          <span style={styles.groupIcon}>{grupo.icono}</span>
                          {grupo.grupo}
                        </td>
                      </tr>

                      {filasVisibles.map((fila) => {
                        const hayDiferencia = filaTieneDiferencia(fila);
                        const mejorId = calcularMejorPorFila(fila);
                        const rango = fila.barra ? getRangoFila(fila) : null;

                        return (
                          <tr
                            key={fila.key}
                            className="comp-row-hover"
                            style={styles.dataRow(darkMode)}
                          >
                            <td style={styles.tdFeature(darkMode)}>
                              <span>{fila.label}</span>
                              {hayDiferencia && (
                                <span style={styles.diffBadge} title="Valores diferentes">≠</span>
                              )}
                            </td>
                            {comparador.map(p => {
                              const valor = fila.formato ? fila.formato(p) : (p[fila.key] || "—");
                              const esMejor = mejorId !== null && Number(mejorId) === Number(p.id);
                              const chipColors = fila.chip ? fila.chip(p) : null;
                              const valorNum = fila.valorNumerico ? fila.valorNumerico(p) : null;

                              let barraPct = null;
                              if (rango && valorNum !== null && !isNaN(valorNum)) {
                                barraPct = ((valorNum - rango.min) / (rango.max - rango.min)) * 100;
                                barraPct = Math.max(8, Math.min(100, barraPct));
                              }

                              return (
                                <td
                                  key={p.id}
                                  style={{
                                    ...styles.tdValue(darkMode),
                                    background: esMejor
                                      ? (darkMode ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.08)")
                                      : "transparent",
                                    position: "relative"
                                  }}
                                >
                                  {esMejor && (
                                    <span style={styles.bestBadge} title="Mejor en esta categoría">
                                      <FaCheck size={9} />
                                    </span>
                                  )}

                                  {chipColors ? (
                                    <span style={{
                                      ...styles.chip,
                                      background: chipColors.bg,
                                      color: chipColors.color
                                    }}>
                                      {valor}
                                    </span>
                                  ) : (
                                    <span style={{
                                      fontWeight: esMejor ? 700 : 500,
                                      color: esMejor
                                        ? (darkMode ? "#34d399" : "#059669")
                                        : undefined
                                    }}>
                                      {valor}
                                    </span>
                                  )}

                                  {barraPct !== null && (
                                    <div style={styles.miniBarWrapper}>
                                      <div
                                        style={{
                                          ...styles.miniBarFill,
                                          width: `${barraPct}%`,
                                          background: esMejor
                                            ? "linear-gradient(90deg, #10b981, #059669)"
                                            : "linear-gradient(90deg, #6366f1, #818cf8)"
                                        }}
                                      />
                                    </div>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* AYUDA */}
        {comparador.length > 0 && comparador.length < 3 && (
          <div style={styles.hintBox(darkMode)}>
            💡 Tip: puedes comparar hasta <strong>3 productos</strong>. Te falta{comparador.length === 1 ? "" : "n"} <strong>{3 - comparador.length}</strong> para el máximo.
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
    background: darkMode ? "#0a0a0f" : "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflowX: "hidden"
  }),

  container: (isMobile) => ({
    padding: isMobile ? "80px 10px 20px 10px" : "130px 25px 40px 25px",
    maxWidth: "1600px",
    margin: "0 auto",
    boxSizing: "border-box"
  }),

  header: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    marginBottom: "25px",
    flexWrap: "wrap"
  },

  backBtn: (darkMode) => ({
    display: "inline-flex", alignItems: "center", gap: "8px",
    background: darkMode ? "#1e293b" : "#fff",
    color: darkMode ? "#e2e8f0" : "#334155",
    border: darkMode ? "1px solid #2d2d3f" : "1px solid #e2e8f0",
    padding: "10px 16px", borderRadius: "10px",
    cursor: "pointer", fontWeight: "600", fontSize: "14px"
  }),

  title: (darkMode) => ({
    fontSize: "32px", fontWeight: "800",
    color: darkMode ? "#fff" : "#0f172a",
    margin: "0 0 4px 0", letterSpacing: "-0.5px",
    display: "flex", alignItems: "center"
  }),

  subtitle: (darkMode) => ({
    fontSize: "15px", color: darkMode ? "#94a3b8" : "#64748b", margin: 0
  }),

  toggleDiffBtn: (darkMode, activo) => ({
    display: "inline-flex", alignItems: "center", gap: "8px",
    background: activo
      ? "linear-gradient(135deg, #6366f1, #4f46e5)"
      : (darkMode ? "#1e293b" : "#fff"),
    color: activo ? "#fff" : (darkMode ? "#e2e8f0" : "#334155"),
    border: activo ? "none" : (darkMode ? "1px solid #2d2d3f" : "1px solid #e2e8f0"),
    padding: "10px 18px", borderRadius: "10px",
    cursor: "pointer", fontWeight: "700", fontSize: "14px",
    boxShadow: activo ? "0 4px 15px rgba(99, 102, 241, 0.3)" : "none"
  }),

  clearBtn: {
    display: "inline-flex", alignItems: "center", gap: "8px",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff", border: "none", padding: "10px 18px",
    borderRadius: "10px", cursor: "pointer",
    fontWeight: "700", fontSize: "14px",
    boxShadow: "0 4px 15px rgba(239, 68, 68, 0.3)"
  },

  emptyState: (darkMode) => ({
    background: darkMode ? "#14141e" : "#fff",
    borderRadius: "20px", padding: "60px 30px",
    textAlign: "center",
    border: darkMode ? "1px solid #2d2d3f" : "1px solid #f1f5f9",
    boxShadow: darkMode ? "0 8px 30px rgba(0,0,0,0.4)" : "0 8px 30px rgba(0,0,0,0.06)"
  }),

  emptyIcon: { fontSize: "72px", marginBottom: "16px", opacity: 0.7 },

  emptyTitle: (darkMode) => ({
    fontSize: "24px", fontWeight: "700",
    color: darkMode ? "#fff" : "#0f172a", margin: "0 0 10px 0"
  }),

  emptyText: (darkMode) => ({
    fontSize: "16px", color: darkMode ? "#94a3b8" : "#64748b",
    margin: "0 auto 24px auto", maxWidth: "500px", lineHeight: 1.6
  }),

  emptyBtn: {
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    color: "#fff", border: "none", padding: "14px 28px",
    borderRadius: "12px", cursor: "pointer",
    fontWeight: "700", fontSize: "16px",
    boxShadow: "0 4px 20px rgba(99, 102, 241, 0.4)"
  },

  // ============================================================
  // 🏆 RANKING
  // ============================================================
  rankingSection: (darkMode) => ({
    background: darkMode ? "#14141e" : "#fff",
    borderRadius: "18px",
    padding: "24px",
    marginBottom: "20px",
    border: darkMode ? "1px solid #2d2d3f" : "1px solid #f1f5f9",
    boxShadow: darkMode ? "0 8px 30px rgba(0,0,0,0.4)" : "0 8px 30px rgba(0,0,0,0.06)",
    animation: "fadeInUp 0.5s ease"
  }),

  sectionTitle: (darkMode) => ({
    fontSize: "20px", fontWeight: "800",
    color: darkMode ? "#fff" : "#0f172a",
    margin: "0 0 18px 0"
  }),

  rankingGrid: (isMobile) => ({
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "16px"
  }),

  rankingCard: (darkMode, index) => ({
    background: index === 0
      ? (darkMode ? "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.05))" : "linear-gradient(135deg, rgba(245,158,11,0.08), rgba(217,119,6,0.02))")
      : (darkMode ? "#1e293b" : "#f8fafc"),
    borderRadius: "14px",
    padding: "16px",
    border: index === 0
      ? "2px solid #f59e0b"
      : (darkMode ? "1px solid #2d2d3f" : "1px solid #e2e8f0"),
    textAlign: "center",
    position: "relative",
    transition: "transform 0.25s",
    boxShadow: index === 0
      ? "0 8px 24px rgba(245, 158, 11, 0.15)"
      : "none"
  }),

  rankMedal: (index) => ({
    position: "absolute", top: "-14px", left: "50%",
    transform: "translateX(-50%)",
    fontSize: "28px",
    filter: "drop-shadow(0 3px 6px rgba(0,0,0,0.2))"
  }),

  rankImg: {
    width: "70px", height: "70px",
    objectFit: "cover", borderRadius: "12px",
    marginBottom: "10px", marginTop: "6px"
  },

  rankName: (darkMode) => ({
    fontSize: "14px", fontWeight: "700",
    color: darkMode ? "#fff" : "#0f172a",
    margin: "0 0 6px 0",
    overflow: "hidden", textOverflow: "ellipsis",
    whiteSpace: "nowrap"
  }),

  rankPrice: {
    fontSize: "17px", fontWeight: "800",
    color: "#6366f1", marginBottom: "10px"
  },

  progressBarWrapper: {
    position: "relative",
    height: "26px",
    background: "rgba(99, 102, 241, 0.1)",
    borderRadius: "13px",
    overflow: "hidden",
    marginBottom: "10px"
  },

  progressBarFill: (index) => ({
    height: "100%",
    width: "100%",
    background: index === 0
      ? "linear-gradient(90deg, #f59e0b, #d97706)"
      : index === 1
      ? "linear-gradient(90deg, #6366f1, #4f46e5)"
      : "linear-gradient(90deg, #94a3b8, #64748b)",
    transition: "width 0.8s ease"
  }),

  progressBarText: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "12px", fontWeight: "800", color: "#fff",
    textShadow: "0 1px 3px rgba(0,0,0,0.4)"
  },

  rankAddBtn: {
    display: "inline-flex", alignItems: "center", gap: "5px",
    width: "100%", padding: "7px 12px",
    color: "#fff", border: "none", borderRadius: "8px",
    fontSize: "11px", fontWeight: "700", cursor: "pointer",
    justifyContent: "center"
  },

  // ============================================================
  // 💡 INSIGHTS
  // ============================================================
  insightsGrid: (isMobile) => ({
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "12px",
    marginBottom: "20px"
  }),

  insightCard: (darkMode, tipo) => {
    const colors = {
      success: { bg: "rgba(16,185,129,0.1)", border: "#10b981" },
      warning: { bg: "rgba(245,158,11,0.1)", border: "#f59e0b" },
      info: { bg: "rgba(99,102,241,0.1)", border: "#6366f1" },
    };
    const c = colors[tipo] || colors.info;
    return {
      background: darkMode ? c.bg : c.bg,
      borderLeft: `4px solid ${c.border}`,
      borderRadius: "12px",
      padding: "14px 16px",
      display: "flex", alignItems: "center", gap: "12px",
      animation: "fadeInUp 0.5s ease"
    };
  },

  insightIcon: { fontSize: "22px", flexShrink: 0 },

  insightText: (darkMode) => ({
    fontSize: "14px", fontWeight: "600",
    color: darkMode ? "#e2e8f0" : "#334155",
    lineHeight: 1.4
  }),

  // ============================================================
  // 📊 TABLA
  // ============================================================
  tableWrapper: (darkMode, isMobile) => ({
    background: darkMode ? "#14141e" : "#fff",
    borderRadius: "16px",
    border: darkMode ? "1px solid #2d2d3f" : "1px solid #f1f5f9",
    boxShadow: darkMode ? "0 8px 30px rgba(0,0,0,0.4)" : "0 8px 30px rgba(0,0,0,0.06)",
    overflowX: "auto",
    overflowY: "visible",
    animation: "fadeInUp 0.5s ease"
  }),

  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: "600px"
  },

  thFeature: (darkMode) => ({
    position: "sticky", left: 0, zIndex: 3,
    background: darkMode ? "#0a0a0f" : "#f8fafc",
    padding: "16px", textAlign: "left",
    borderBottom: darkMode ? "2px solid #2d2d3f" : "2px solid #e2e8f0",
    minWidth: "170px"
  }),

  thFeatureContent: {
    display: "flex", alignItems: "center", gap: "8px",
    fontWeight: "700", fontSize: "13px",
    color: "#64748b", textTransform: "uppercase", letterSpacing: "0.5px"
  },

  thProduct: (darkMode) => ({
    padding: "20px 16px 16px", textAlign: "center", verticalAlign: "top",
    borderBottom: darkMode ? "2px solid #2d2d3f" : "2px solid #e2e8f0",
    minWidth: "220px", position: "relative"
  }),

  winnerBadge: {
    position: "absolute", top: "8px", left: "50%",
    transform: "translateX(-50%)",
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "#fff", fontSize: "10px", fontWeight: "800",
    padding: "3px 10px", borderRadius: "10px",
    display: "flex", alignItems: "center", gap: "4px",
    textTransform: "uppercase", letterSpacing: "0.5px",
    boxShadow: "0 3px 10px rgba(245, 158, 11, 0.4)",
    whiteSpace: "nowrap", zIndex: 2
  },

  productHeader: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "10px", position: "relative"
  },

  removeBtn: {
    position: "absolute", top: "-6px", right: "-6px",
    width: "26px", height: "26px", borderRadius: "50%",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff", border: "none", cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "11px", boxShadow: "0 2px 8px rgba(239,68,68,0.4)",
    zIndex: 3
  },

  imgWrapHeader: {
    position: "relative",
    marginTop: "8px"
  },

  productImg: (isMobile) => ({
    width: isMobile ? "90px" : "120px",
    height: isMobile ? "90px" : "120px",
    objectFit: "cover", borderRadius: "12px",
    cursor: "pointer", border: "2px solid #f1f5f9",
    display: "block"
  }),

  offerBadgeHeader: {
    position: "absolute", top: "6px", left: "6px",
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff", fontSize: "9px", fontWeight: "800",
    padding: "3px 8px", borderRadius: "10px",
    display: "flex", alignItems: "center", gap: "3px",
    textTransform: "uppercase", letterSpacing: "0.3px",
    boxShadow: "0 2px 6px rgba(239, 68, 68, 0.4)"
  },

  productName: (darkMode) => ({
    fontSize: "15px", fontWeight: "700",
    color: darkMode ? "#fff" : "#0f172a",
    margin: 0, cursor: "pointer", textAlign: "center",
    lineHeight: 1.3, maxWidth: "200px"
  }),

  productPrice: {
    display: "flex", flexDirection: "column",
    alignItems: "center", gap: "2px"
  },

  price: { fontSize: "20px", fontWeight: "800", color: "#6366f1" },
  oldPrice: { textDecoration: "line-through", color: "#94a3b8", fontSize: "13px" },
  offerPrice: { fontSize: "20px", fontWeight: "800", color: "#ef4444" },

  addBtn: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: "6px", width: "100%", maxWidth: "200px",
    marginTop: "6px", padding: "9px 14px",
    color: "#fff", border: "none", borderRadius: "10px",
    fontSize: "12px", fontWeight: "700", cursor: "pointer",
    transition: "all 0.2s ease"
  },

  groupRow: (darkMode) => ({
    background: darkMode ? "#1e293b" : "#f1f5f9",
    padding: "12px 16px",
    fontSize: "14px", fontWeight: "800",
    color: darkMode ? "#a5b4fc" : "#4f46e5",
    textTransform: "uppercase", letterSpacing: "0.5px",
    position: "sticky", left: 0
  }),

  groupIcon: { marginRight: "8px", fontSize: "16px" },

  dataRow: (darkMode) => ({
    borderBottom: darkMode ? "1px solid #2d2d3f" : "1px solid #f1f5f9",
    transition: "background 0.15s"
  }),

  tdFeature: (darkMode) => ({
    position: "sticky", left: 0, zIndex: 2,
    background: darkMode ? "#0a0a0f" : "#f8fafc",
    padding: "14px 16px",
    fontSize: "14px", fontWeight: "600",
    color: darkMode ? "#cbd5e1" : "#334155",
    borderRight: darkMode ? "1px solid #2d2d3f" : "1px solid #e2e8f0",
    display: "flex", alignItems: "center", gap: "8px"
  }),

  diffBadge: {
    background: "#f59e0b", color: "#fff",
    fontSize: "10px", fontWeight: "800",
    padding: "2px 6px", borderRadius: "8px",
    lineHeight: 1, marginLeft: "auto"
  },

  tdValue: (darkMode) => ({
    padding: "14px 16px",
    fontSize: "14px", textAlign: "center",
    color: darkMode ? "#e2e8f0" : "#0f172a",
    fontWeight: "500",
    transition: "background 0.2s"
  }),

  bestBadge: {
    position: "absolute", top: "6px", right: "6px",
    width: "18px", height: "18px", borderRadius: "50%",
    background: "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "9px",
    boxShadow: "0 2px 6px rgba(16, 185, 129, 0.4)"
  },

  chip: {
    display: "inline-block",
    padding: "4px 12px", borderRadius: "12px",
    fontSize: "12px", fontWeight: "700"
  },

  miniBarWrapper: {
    marginTop: "6px",
    height: "4px",
    background: "rgba(99, 102, 241, 0.12)",
    borderRadius: "2px",
    overflow: "hidden"
  },

  miniBarFill: {
    height: "100%",
    borderRadius: "2px",
    transition: "width 0.6s ease"
  },

  hintBox: (darkMode) => ({
    marginTop: "16px",
    padding: "14px 20px",
    background: darkMode ? "rgba(99, 102, 241, 0.08)" : "rgba(99, 102, 241, 0.05)",
    border: darkMode ? "1px solid rgba(99, 102, 241, 0.2)" : "1px solid rgba(99, 102, 241, 0.15)",
    borderRadius: "12px",
    fontSize: "14px",
    color: darkMode ? "#a5b4fc" : "#4f46e5",
    textAlign: "center"
  })
};