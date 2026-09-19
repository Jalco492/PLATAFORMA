import { useEffect, useState, useMemo, useCallback, useRef, memo } from "react";
import api from "../services/api";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";
import { FaShoppingCart } from "react-icons/fa";

/* ============================================================
   🧠 HELPERS GLOBALES
   ============================================================ */
const getFiltro = (key, defaultValue) => {
  const guardado = localStorage.getItem(`filtro_${key}`);
  return guardado !== null ? guardado : defaultValue;
};
const getFiltroBooleano = (key, defaultValue) => {
  const guardado = localStorage.getItem(`filtro_${key}`);
  if (guardado === null) return defaultValue;
  return guardado === "true";
};
const getFiltroArray = (key, defaultValue) => {
  const guardado = localStorage.getItem(`filtro_${key}`);
  if (guardado === null) return defaultValue;
  try {
    return JSON.parse(guardado);
  } catch {
    return defaultValue;
  }
};

const convertirACm = (valor, unidad = "cm") => {
  const num = parseFloat(String(valor).replace(/[^0-9.\-]/g, "")) || 0;
  const u = (unidad || "cm").toLowerCase().trim();
  if (["m", "mt", "mts", "metro", "metros"].includes(u)) return num * 100;
  if (["mm", "milimetro", "milimetros"].includes(u)) return num / 10;
  return num;
};
const convertirAMm = (valor, unidad = "mm") => {
  const num = parseFloat(String(valor).replace(/[^0-9.\-]/g, "")) || 0;
  const u = (unidad || "mm").toLowerCase().trim();
  if (["m", "mt", "mts", "metro", "metros"].includes(u)) return num * 1000;
  if (["cm", "centimetro", "centimetros"].includes(u)) return num * 10;
  return num;
};
const parseOpcionConUnidad = (opcion) => {
  if (!opcion) return null;
  const str = String(opcion).toLowerCase().trim();
  let unidad = "";
  let valorStr = str;
  if (str.includes("m²") || str.includes("m2")) {
    unidad = "m2";
    valorStr = str.replace(/m²|m2/g, "");
  } else if (str.endsWith("mm")) {
    unidad = "mm";
    valorStr = str.replace(/mm/g, "");
  } else if (str.endsWith("cm")) {
    unidad = "cm";
    valorStr = str.replace(/cm/g, "");
  } else if (str.endsWith("ml")) {
    unidad = "ml";
    valorStr = str.replace(/ml/g, "");
  } else if (str.endsWith("m")) {
    unidad = "m";
    valorStr = str.replace(/m/g, "");
  }
  const num = parseFloat(valorStr.replace(/[^0-9.\-]/g, ""));
  if (isNaN(num)) return null;
  return { valor: num, unidad };
};

const getAnchoEfectivoCm = (p) => {
  if (p.tipoVenta === "metro_cuadrado" || p.tipoVenta === "metro_lineal") {
    if (p.anchoProducto) return parseFloat(p.anchoProducto) * 100;
    if (p.alto && p.tipoVenta === "metro_cuadrado") return parseFloat(p.alto) * 100;
    return null;
  }
  if (p.ancho) return convertirACm(p.ancho, p.unidadAncho || "cm");
  return null;
};
const getAltoEfectivoCm = (p) => {
  if (p.tipoVenta === "metro_cuadrado") {
    if (p.alto) return parseFloat(p.alto) * 100;
    return null;
  }
  if (p.tipoVenta === "metro_lineal") {
    if (p.metrosPorRollo) return parseFloat(p.metrosPorRollo) * 100;
    return null;
  }
  if (p.alto) return convertirACm(p.alto, p.unidadAlto || "cm");
  return null;
};
const getGruesoEfectivoMm = (p) => {
  if (!p.grueso) return null;
  return convertirAMm(p.grueso, p.unidadGrueso || "mm");
};
const getCoberturaEfectivaM2 = (p) => {
  if (p.tipoVenta === "metro_cuadrado" || p.tipoVenta === "metro_lineal") {
    if (p.metrosCuadrados) return parseFloat(p.metrosCuadrados);
    return null;
  }
  if ((p.mostrarCobertura === 1 || p.mostrarCobertura === true) && p.cobertura) {
    const num = parseFloat(String(p.cobertura).replace(/[^0-9.\-]/g, ""));
    if (!isNaN(num)) return num;
  }
  return null;
};
const getMetrosLinealesEfectivo = (p) => {
  if (p.tipoVenta === "metro_lineal" && p.metrosPorRollo) return parseFloat(p.metrosPorRollo);
  if (p.tipoVenta === "metro_cuadrado") {
    if (p.metrosCuadrados && p.anchoProducto) return parseFloat(p.metrosCuadrados) / parseFloat(p.anchoProducto);
    if (p.alto) return parseFloat(p.alto);
  }
  return null;
};
const getPiezasEfectivo = (p) => {
  if (p.tipoVenta === "caja" || p.tipoVenta === "paquete") {
    if (p.piezasCaja) return parseInt(p.piezasCaja) || null;
  }
  return null;
};
const getEspesorEfectivoMm = (p) => {
  if (!p.espesor_capa_desgaste) return null;
  return parseFloat(String(p.espesor_capa_desgaste).replace(/[^0-9.\-]/g, ""));
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
  return map[tipoVenta] || (tipoVenta ? tipoVenta.charAt(0).toUpperCase() + tipoVenta.slice(1) : "Otros");
};

const estaEnRangoSeleccionado = (valorProducto, opcionesSeleccionadas, unidadConversion) => {
  if (valorProducto === null || valorProducto === undefined) return false;
  if (opcionesSeleccionadas.length === 0) return true;

  const valorNum = parseFloat(valorProducto);
  if (isNaN(valorNum)) return false;

  const valoresSeleccionados = opcionesSeleccionadas
    .map((op) => {
      const parsed = parseOpcionConUnidad(op);
      if (!parsed) return null;
      return unidadConversion(parsed.valor, parsed.unidad);
    })
    .filter((v) => v !== null && !isNaN(v))
    .sort((a, b) => a - b);

  if (valoresSeleccionados.length === 0) return true;

  for (let i = 0; i < valoresSeleccionados.length; i++) {
    const actual = valoresSeleccionados[i];
    const siguiente = i < valoresSeleccionados.length - 1 ? valoresSeleccionados[i + 1] : null;
    const anterior = i > 0 ? valoresSeleccionados[i - 1] : null;

    if (valoresSeleccionados.length === 1) {
      const margen = actual * 0.15;
      if (Math.abs(valorNum - actual) <= margen) return true;
    }
    if (i === 0 && siguiente !== null) {
      if (valorNum >= actual && valorNum <= siguiente) return true;
    } else if (i === valoresSeleccionados.length - 1 && anterior !== null) {
      if (valorNum >= anterior && valorNum <= actual) return true;
    } else if (anterior !== null && siguiente !== null) {
      if (valorNum >= anterior && valorNum <= siguiente) return true;
    }
  }
  return false;
};

const valorSimpleCoincide = (valorProducto, opcionesSeleccionadas, margenPct = 0.05) => {
  if (valorProducto === null || valorProducto === undefined) return false;
  if (opcionesSeleccionadas.length === 0) return true;

  const valorNum = parseFloat(valorProducto);
  if (isNaN(valorNum)) return false;

  return opcionesSeleccionadas.some((sel) => {
    const selNum = parseFloat(String(sel).replace(/[^0-9.\-]/g, ""));
    if (isNaN(selNum)) return false;
    if (String(sel).includes("+")) {
      const min = parseFloat(String(sel).replace(/[^0-9.\-]/g, ""));
      return !isNaN(min) && valorNum >= min;
    }
    const margen = selNum * margenPct;
    return Math.abs(valorNum - selNum) <= margen;
  });
};

/* ============================================================
   🎯 CONSTANTES DE FILTROS
   ============================================================ */
const OPCIONES_ANCHO = ["50cm", "100cm", "150cm", "200cm", "300cm", "500cm", "800cm", "1m", "1.5m", "2m", "3m", "4m"];
const OPCIONES_ALTO = ["50cm", "100cm", "150cm", "200cm", "300cm", "500cm", "800cm", "1m", "1.5m", "2m", "3m", "4m", "5m", "10m", "20m", "30m"];
const OPCIONES_GRUESO = ["2mm", "3mm", "5mm", "8mm", "10mm", "15mm", "20mm", "30mm", "50mm"];
const OPCIONES_COBERTURA = ["0.5m²", "1m²", "2m²", "3m²", "5m²", "8m²", "10m²", "15m²", "20m²", "30m²", "50m²"];
const OPCIONES_PIEZAS = ["4", "6", "8", "10", "12", "16", "20", "24", "30", "36", "40", "48", "50", "60", "72", "80", "96", "100"];
const OPCIONES_ESPESOR = ["0.3mm", "0.5mm", "0.7mm", "1.0mm", "1.5mm", "2.0mm", "2.5mm", "3.0mm", "4.0mm", "5.0mm"];
const OPCIONES_M2 = ["1m²", "5m²", "10m²", "15m²", "20m²", "30m²", "40m²", "50m²", "60m²", "80m²", "100m²", "120m²", "150m²", "200m²"];
const OPCIONES_ML = ["5m", "10m", "15m", "20m", "25m", "30m", "40m", "50m", "60m", "80m", "100m"];

const OPCIONES_TIPO_VENTA = [
  { valor: "Metro cuadrado", icono: "📐" },
  { valor: "Metro lineal", icono: "📏" },
  { valor: "Caja", icono: "📦" },
  { valor: "Paquete", icono: "🎁" },
  { valor: "Tramo", icono: "🪵" },
  { valor: "Pieza", icono: "🧩" },
  { valor: "Unidad", icono: "🔢" },
  { valor: "Otros", icono: "🏷️" },
];

const OPCIONES_ORDEN = [
  { valor: "", icono: "🎯", label: "Relevancia" },
  { valor: "Recientes", icono: "🆕", label: "Más recientes" },
  { valor: "A-Z", icono: "🔤", label: "Nombre A-Z" },
  { valor: "Z-A", icono: "🔡", label: "Nombre Z-A" },
  { valor: "Menor precio", icono: "💰", label: "Menor precio" },
  { valor: "Mayor precio", icono: "💎", label: "Mayor precio" },
  { valor: "SKU", icono: "🔢", label: "SKU" },
];

/* ============================================================
   🔤 INPUTS — MEMOIZADOS (NO pierden foco)
   ============================================================ */
const BuscadorInput = memo(function BuscadorInput({
  darkMode, valorInicial, onDebouncedChange, placeholder,
}) {
  const [valor, setValor] = useState(valorInicial || "");
  const timeoutRef = useRef(null);
  const inputRef = useRef(null);
  const estaEscribiendoRef = useRef(false);
  const ultimoValorExternoRef = useRef(valorInicial || "");

  useEffect(() => {
    if (estaEscribiendoRef.current) return;
    if ((valorInicial || "") !== ultimoValorExternoRef.current) {
      ultimoValorExternoRef.current = valorInicial || "";
      setValor(valorInicial || "");
    }
  }, [valorInicial]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleChange = (e) => {
    const nuevo = e.target.value;
    estaEscribiendoRef.current = true;
    setValor(nuevo);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      ultimoValorExternoRef.current = nuevo;
      onDebouncedChange(nuevo);
      estaEscribiendoRef.current = false;
    }, 350);
  };

  const handleClear = () => {
    estaEscribiendoRef.current = false;
    setValor("");
    ultimoValorExternoRef.current = "";
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onDebouncedChange("");
    inputRef.current?.focus();
  };

  return (
    <div style={styles.searchWrap}>
      <span style={styles.searchIcon}>🔍</span>
      <input
        ref={inputRef}
        type="text"
        placeholder={placeholder || "Buscar…"}
        value={valor}
        onChange={handleChange}
        style={styles.searchInput(darkMode)}
        autoComplete="off"
        spellCheck="false"
      />
      {valor && (
        <button
          onClick={handleClear}
          style={styles.searchClear(darkMode)}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          aria-label="Limpiar"
        >
          ✕
        </button>
      )}
    </div>
  );
});

const PrecioInput = memo(function PrecioInput({
  darkMode, valorInicial, onCambio, placeholder, prefijo = "$",
}) {
  const [valor, setValor] = useState(valorInicial || "");
  const inputRef = useRef(null);
  const estaEscribiendoRef = useRef(false);
  const ultimoValorExternoRef = useRef(valorInicial || "");

  useEffect(() => {
    if (estaEscribiendoRef.current) return;
    if ((valorInicial || "") !== ultimoValorExternoRef.current) {
      ultimoValorExternoRef.current = valorInicial || "";
      setValor(valorInicial || "");
    }
  }, [valorInicial]);

  const handleChange = (e) => {
    const nuevo = e.target.value;
    estaEscribiendoRef.current = true;
    setValor(nuevo);
    ultimoValorExternoRef.current = nuevo;
    onCambio(nuevo);
    setTimeout(() => {
      estaEscribiendoRef.current = false;
    }, 0);
  };

  return (
    <div style={styles.precioInputWrap(darkMode)}>
      <span style={styles.precioPrefix}>{prefijo}</span>
      <input
        ref={inputRef}
        type="number"
        placeholder={placeholder}
        value={valor}
        onChange={handleChange}
        style={styles.precioInputField(darkMode)}
        autoComplete="off"
      />
    </div>
  );
});

/* ============================================================
   🧩 SUBCOMPONENTES DEL PANEL
   ============================================================ */
const SeccionColapsable = memo(function SeccionColapsable({
  id, titulo, subtitulo, icono, children, badge, abierta, onToggle, darkMode,
}) {
  return (
    <div style={styles.seccionCard(darkMode, abierta)}>
      <button onClick={() => onToggle(id)} style={styles.seccionHeader} type="button">
        <span style={styles.seccionIconWrap(darkMode, abierta)}>{icono}</span>
        <div style={styles.seccionTitles}>
          <span style={styles.seccionTitulo(darkMode)}>{titulo}</span>
          {subtitulo && <span style={styles.seccionSubtitulo(darkMode)}>{subtitulo}</span>}
        </div>
        {badge > 0 && <span style={styles.seccionBadge}>{badge}</span>}
        <span
          style={{
            ...styles.seccionArrow(darkMode),
            transform: abierta ? "rotate(180deg)" : "rotate(0)",
          }}
        >
          ▾
        </span>
      </button>
      {abierta && <div style={styles.seccionContenido}>{children}</div>}
    </div>
  );
});

const SelectorFiltro = memo(function SelectorFiltro({
  darkMode, icono, label, value, onChange, options, contadores: mapCont, placeholder = "Todos",
}) {
  const activo = !!value;
  // Ordena opciones: activas primero, luego las que tienen resultados, luego el resto
  const opcionesOrdenadas = useMemo(() => {
    if (!mapCont) return options;
    return [...options].sort((a, b) => {
      const va = typeof a === "string" ? a : a.valor;
      const vb = typeof b === "string" ? b : b.valor;
      const ca = mapCont[va] || 0;
      const cb = mapCont[vb] || 0;
      // La opción activa siempre primero
      if (va === value) return -1;
      if (vb === value) return 1;
      // Con resultados primero
      if (ca > 0 && cb === 0) return -1;
      if (ca === 0 && cb > 0) return 1;
      // Ordenar por conteo descendente
      return cb - ca;
    });
  }, [options, mapCont, value]);

  return (
    <div style={styles.filtroCampo}>
      {label && (
        <label style={styles.filtroLabel(darkMode, activo)}>
          <span>{label}</span>
          {activo && <span style={styles.filtroLabelDot} />}
        </label>
      )}
      <div style={styles.selectWrap}>
        <span style={styles.selectIconLeft}>{icono}</span>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={styles.selectStyled(darkMode, activo)}
        >
          <option value="">{placeholder}</option>
          {opcionesOrdenadas.map((opt) => {
            const val = typeof opt === "string" ? opt : opt.valor;
            const ico = typeof opt === "string" ? null : opt.icono;
            const lbl = typeof opt === "string" ? opt : opt.label || opt.valor;
            const count = mapCont?.[val];
            const sinResultados = typeof count === "number" && count === 0 && val !== "";
            return (
              <option key={val} value={val} disabled={sinResultados}>
                {ico ? `${ico} ` : ""}
                {lbl}
                {typeof count === "number" ? ` (${count})` : ""}
                {sinResultados ? " — sin resultados" : ""}
              </option>
            );
          })}
        </select>
        {activo && (
          <button
            onClick={() => onChange("")}
            style={styles.selectClearBtn(darkMode)}
            title="Limpiar"
            type="button"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
});

const ChipsRango = memo(function ChipsRango({
  darkMode, icono, label, options, selected, onToggle,
}) {
  if (!options || options.length === 0) return null;
  return (
    <div style={styles.filtroCampo}>
      <label style={styles.filtroLabel(darkMode, selected.length > 0)}>
        <span>{icono} {label}</span>
        {selected.length > 0 && <span style={styles.chipCountBadge}>{selected.length}</span>}
      </label>
      <div style={styles.chipsWrap}>
        {options.map((opt) => {
          const activo = selected.includes(opt);
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              style={styles.chipBtn(darkMode, activo)}
              type="button"
            >
              {activo && <span style={styles.chipCheck}>✓</span>}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
});

const ToggleSwitch = memo(function ToggleSwitch({ darkMode, icono, texto, activo, onChange }) {
  return (
    <button onClick={onChange} style={styles.toggleCard(darkMode, activo)} type="button">
      <span style={styles.toggleCardIcon}>{icono}</span>
      <span style={styles.toggleCardText(darkMode, activo)}>{texto}</span>
      <span style={styles.toggleSwitchTrack(activo)}>
        <span style={styles.toggleSwitchThumb(activo)} />
      </span>
    </button>
  );
});

/* ============================================================
   🧩 COMPONENTE PRINCIPAL
   ============================================================ */
export default function Productos() {
  const [productos, setProductos] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  const desdePedido = location.state?.desdePedido || false;

  /* 🌙 DARK MODE */
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  useEffect(() => localStorage.setItem("darkMode", darkMode), [darkMode]);

  /* ❤️ FAVORITOS */
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos");
    return guardados ? JSON.parse(guardados) : [];
  });
  useEffect(() => localStorage.setItem("favoritos", JSON.stringify(favoritos)), [favoritos]);

  /* 🔔 NOTIFICACIONES */
  const [notificacion, setNotificacion] = useState(null);
  const mostrarNotificacion = useCallback((mensaje, tipo = "success") => {
    setNotificacion({ mensaje, tipo });
    setTimeout(() => setNotificacion(null), 2500);
  }, []);

  /* 📋 COTIZADOR */
  const [cotizador, setCotizador] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("cotizador")) || [];
    } catch {
      return [];
    }
  });
  useEffect(() => localStorage.setItem("cotizador", JSON.stringify(cotizador)), [cotizador]);

  /* 🛒 PEDIDO */
  const [pedido, setPedido] = useState(() => {
    try {
      return JSON.parse(sessionStorage.getItem("carritoPedido")) || [];
    } catch {
      return [];
    }
  });
  useEffect(() => sessionStorage.setItem("carritoPedido", JSON.stringify(pedido)), [pedido]);

  /* ⚖️ COMPARADOR */
  const [comparador, setComparador] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("comparador")) || [];
    } catch {
      return [];
    }
  });
  useEffect(() => localStorage.setItem("comparador", JSON.stringify(comparador)), [comparador]);

  /* 🎯 FILTROS */
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(() => getFiltro("categoria", ""));
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState(() => getFiltro("subcategoria", ""));
  const [tipoSeleccionado, setTipoSeleccionado] = useState(() => getFiltro("tipo", ""));
  const [usoSeleccionado, setUsoSeleccionado] = useState(() => getFiltro("uso", ""));
  const [aplicacionSeleccionada, setAplicacionSeleccionada] = useState(() => getFiltro("aplicacion", ""));
  const [tipoDisenoSeleccionado, setTipoDisenoSeleccionado] = useState(() => getFiltro("tipo_diseno", ""));
  const [materialSeleccionado, setMaterialSeleccionado] = useState(() => getFiltro("material", ""));
  const [acabadoSeleccionado, setAcabadoSeleccionado] = useState(() => getFiltro("acabado", ""));
  const [tipoInstalacionSeleccionado, setTipoInstalacionSeleccionado] = useState(() => getFiltro("tipo_instalacion", ""));
  const [tipoVentaSeleccionado, setTipoVentaSeleccionado] = useState(() => getFiltro("tipo_venta", ""));

  const [anchosSeleccionados, setAnchosSeleccionados] = useState(() => getFiltroArray("anchos_seleccionados", []));
  const [altosSeleccionados, setAltosSeleccionados] = useState(() => getFiltroArray("altos_seleccionados", []));
  const [gruesosSeleccionados, setGruesosSeleccionados] = useState(() => getFiltroArray("gruesos_seleccionados", []));
  const [coberturasSeleccionadas, setCoberturasSeleccionadas] = useState(() => getFiltroArray("coberturas_seleccionadas", []));
  const [piezasSeleccionadas, setPiezasSeleccionadas] = useState(() => getFiltroArray("piezas_seleccionadas", []));
  const [espesoresSeleccionados, setEspesoresSeleccionados] = useState(() => getFiltroArray("espesores_seleccionados", []));
  const [metrosCuadradosSeleccionados, setMetrosCuadradosSeleccionados] = useState(() => getFiltroArray("metros_cuadrados_seleccionados", []));
  const [metrosLinealesSeleccionados, setMetrosLinealesSeleccionados] = useState(() => getFiltroArray("metros_lineales_seleccionados", []));

  const [precioMin, setPrecioMin] = useState(() => getFiltro("precio_min", ""));
  const [precioMax, setPrecioMax] = useState(() => getFiltro("precio_max", ""));
  const [soloConStock, setSoloConStock] = useState(() => getFiltroBooleano("con_stock", false));
  const [soloSinStock, setSoloSinStock] = useState(() => getFiltroBooleano("sin_stock", false));
  const [soloNuevos, setSoloNuevos] = useState(() => getFiltroBooleano("nuevos", false));
  const [soloRebajados, setSoloRebajados] = useState(() => getFiltroBooleano("rebajados", false));
  const [soloConFicha, setSoloConFicha] = useState(() => getFiltroBooleano("con_ficha", false));

  const [busqueda, setBusqueda] = useState(() => getFiltro("busqueda", ""));
  const [orden, setOrden] = useState(() => getFiltro("orden", ""));
  const [soloOfertas, setSoloOfertas] = useState(() => getFiltroBooleano("ofertas", false));
  const [soloDestacados, setSoloDestacados] = useState(() => getFiltroBooleano("destacados", false));

  /* 🧩 SECCIONES COLAPSABLES */
  const [seccionesAbiertas, setSeccionesAbiertas] = useState(() => {
    try {
      return {
        busquedaOrden: true,
        categoria: true,
        precio: true,
        rapidos: true,
        medidas: false,
        caracteristicas: false,
        venta: false,
        ...JSON.parse(localStorage.getItem("secciones_filtros") || "{}"),
      };
    } catch {
      return {
        busquedaOrden: true,
        categoria: true,
        precio: true,
        rapidos: true,
        medidas: false,
        caracteristicas: false,
        venta: false,
      };
    }
  });
  useEffect(() => {
    localStorage.setItem("secciones_filtros", JSON.stringify(seccionesAbiertas));
  }, [seccionesAbiertas]);

  const toggleSeccion = useCallback((id) => {
    setSeccionesAbiertas((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const [openFiltrosExtra, setOpenFiltrosExtra] = useState(false);

  /* 📥 DATA */
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [tipos, setTipos] = useState([]);

  /* 📱 RESPONSIVE */
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  const getGridColumns = () => {
    if (isMobile) return "repeat(2, 1fr)";
    if (isTablet) return "repeat(2, 1fr)";
    if (windowWidth >= 1024 && windowWidth < 1280) return "repeat(3, 1fr)";
    return "repeat(4, 1fr)";
  };

  /* 📄 PAGINACIÓN */
  const [paginaActual, setPaginaActual] = useState(() => {
    const guardado = localStorage.getItem("pagina_actual");
    return guardado ? parseInt(guardado) : 1;
  });
  const getProductosPorPagina = () => {
    if (isMobile) return 10;
    if (isTablet) return 15;
    return 20;
  };
  const productosPorPagina = getProductosPorPagina();

  /* 💾 HELPERS */
  const guardarFiltro = (key, value) => localStorage.setItem(`filtro_${key}`, value);
  const guardarFiltroArray = (key, value) => localStorage.setItem(`filtro_${key}`, JSON.stringify(value));

  const toggleSeleccionArray = useCallback((setter, key, value) => {
    setter((prev) => {
      const nuevos = prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value];
      guardarFiltroArray(key, nuevos);
      return nuevos;
    });
  }, []);

  const limpiarTodosLosFiltros = useCallback(() => {
    const filtrosArrays = [
      "anchos_seleccionados", "altos_seleccionados", "gruesos_seleccionados",
      "coberturas_seleccionadas", "piezas_seleccionadas", "espesores_seleccionados",
      "metros_cuadrados_seleccionados", "metros_lineales_seleccionados",
    ];
    filtrosArrays.forEach((key) => localStorage.removeItem(`filtro_${key}`));

    const filtrosSimples = [
      "categoria", "subcategoria", "tipo", "uso", "aplicacion", "tipo_diseno",
      "material", "acabado", "tipo_instalacion", "tipo_venta",
      "busqueda", "orden", "ofertas", "destacados",
      "precio_min", "precio_max", "con_stock", "sin_stock",
      "nuevos", "rebajados", "con_ficha",
    ];
    filtrosSimples.forEach((key) => localStorage.removeItem(`filtro_${key}`));
    localStorage.removeItem("pagina_actual");

    setCategoriaSeleccionada("");
    setSubcategoriaSeleccionada("");
    setTipoSeleccionado("");
    setUsoSeleccionado("");
    setAplicacionSeleccionada("");
    setTipoDisenoSeleccionado("");
    setMaterialSeleccionado("");
    setAcabadoSeleccionado("");
    setTipoInstalacionSeleccionado("");
    setTipoVentaSeleccionado("");
    setAnchosSeleccionados([]);
    setAltosSeleccionados([]);
    setGruesosSeleccionados([]);
    setCoberturasSeleccionadas([]);
    setPiezasSeleccionadas([]);
    setEspesoresSeleccionados([]);
    setMetrosCuadradosSeleccionados([]);
    setMetrosLinealesSeleccionados([]);
    setPrecioMin("");
    setPrecioMax("");
    setSoloConStock(false);
    setSoloSinStock(false);
    setSoloNuevos(false);
    setSoloRebajados(false);
    setSoloConFicha(false);
    setBusqueda("");
    setOrden("");
    setSoloOfertas(false);
    setSoloDestacados(false);
    setPaginaActual(1);
  }, []);

  useEffect(() => {
    setPaginaActual(1);
  }, [
    busqueda, soloOfertas, soloDestacados, orden, precioMin, precioMax,
    soloConStock, soloSinStock, soloNuevos, soloRebajados, soloConFicha,
    categoriaSeleccionada, subcategoriaSeleccionada, tipoSeleccionado,
    usoSeleccionado, aplicacionSeleccionada, tipoDisenoSeleccionado,
    materialSeleccionado, acabadoSeleccionado, tipoInstalacionSeleccionado,
    tipoVentaSeleccionado, anchosSeleccionados, altosSeleccionados,
    gruesosSeleccionados, coberturasSeleccionadas, piezasSeleccionadas,
    espesoresSeleccionados, metrosCuadradosSeleccionados, metrosLinealesSeleccionados,
  ]);

  /* 🔥 CARGAR DATA */
  useEffect(() => {
    api.get("/productos").then((res) => setProductos(res.data)).catch((err) => console.log(err));
    api.get("/categorias").then((res) => setCategorias(res.data)).catch((err) => console.log(err));
    api.get("/subcategorias").then((res) => setSubcategorias(res.data)).catch((err) => console.log(err));
    api.get("/tipos").then((res) => setTipos(res.data)).catch((err) => console.log(err));
  }, []);

  const [searchParams] = useSearchParams();
  const [filtrosInicializados, setFiltrosInicializados] = useState(false);

  useEffect(() => {
    const all = searchParams.get("all");
    if (!filtrosInicializados) {
      if (all === "true") {
        limpiarTodosLosFiltros();
        window.history.replaceState({}, "", window.location.pathname);
      }
      setFiltrosInicializados(true);
    }
  }, [searchParams, filtrosInicializados, limpiarTodosLosFiltros]);

  useEffect(() => {
    const buscar = searchParams.get("buscar");
    if (buscar) {
      setBusqueda(buscar);
      guardarFiltro("busqueda", buscar);
    }
  }, [searchParams]);

  /* 💾 Persistir filtros */
  useEffect(() => {
    guardarFiltro("categoria", categoriaSeleccionada);
    guardarFiltro("subcategoria", subcategoriaSeleccionada);
    guardarFiltro("tipo", tipoSeleccionado);
    guardarFiltro("uso", usoSeleccionado);
    guardarFiltro("aplicacion", aplicacionSeleccionada);
    guardarFiltro("tipo_diseno", tipoDisenoSeleccionado);
    guardarFiltro("material", materialSeleccionado);
    guardarFiltro("acabado", acabadoSeleccionado);
    guardarFiltro("tipo_instalacion", tipoInstalacionSeleccionado);
    guardarFiltro("tipo_venta", tipoVentaSeleccionado);
    guardarFiltroArray("anchos_seleccionados", anchosSeleccionados);
    guardarFiltroArray("altos_seleccionados", altosSeleccionados);
    guardarFiltroArray("gruesos_seleccionados", gruesosSeleccionados);
    guardarFiltroArray("coberturas_seleccionadas", coberturasSeleccionadas);
    guardarFiltroArray("piezas_seleccionadas", piezasSeleccionadas);
    guardarFiltroArray("espesores_seleccionados", espesoresSeleccionados);
    guardarFiltroArray("metros_cuadrados_seleccionados", metrosCuadradosSeleccionados);
    guardarFiltroArray("metros_lineales_seleccionados", metrosLinealesSeleccionados);
    guardarFiltro("busqueda", busqueda);
    guardarFiltro("orden", orden);
    guardarFiltro("ofertas", soloOfertas);
    guardarFiltro("destacados", soloDestacados);
    guardarFiltro("precio_min", precioMin);
    guardarFiltro("precio_max", precioMax);
    guardarFiltro("con_stock", soloConStock);
    guardarFiltro("sin_stock", soloSinStock);
    guardarFiltro("nuevos", soloNuevos);
    guardarFiltro("rebajados", soloRebajados);
    guardarFiltro("con_ficha", soloConFicha);
    localStorage.setItem("pagina_actual", String(paginaActual));
  }, [
    categoriaSeleccionada, subcategoriaSeleccionada, tipoSeleccionado,
    usoSeleccionado, aplicacionSeleccionada, tipoDisenoSeleccionado,
    materialSeleccionado, acabadoSeleccionado, tipoInstalacionSeleccionado,
    tipoVentaSeleccionado, anchosSeleccionados, altosSeleccionados,
    gruesosSeleccionados, coberturasSeleccionadas, piezasSeleccionadas,
    espesoresSeleccionados, metrosCuadradosSeleccionados, metrosLinealesSeleccionados,
    busqueda, orden, soloOfertas, soloDestacados, precioMin, precioMax,
    soloConStock, soloSinStock, soloNuevos, soloRebajados, soloConFicha, paginaActual,
  ]);

  const obtenerImagen = (producto) => {
    let imagen = "";
    if (producto.imagenes && producto.imagenes.trim() !== "") {
      imagen = producto.imagenes.split(",")[0].trim();
    } else {
      imagen = producto.imagen;
    }
    if (!imagen) return "https://via.placeholder.com/200";
    return `https://backend-zuib.onrender.com${imagen}`;
  };

  const toggleFavorito = (producto) => {
    const productoCompleto = {
      id: producto.id,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precio: producto.precio,
      imagen: obtenerImagen(producto),
    };
    const existe = favoritos.find((fav) => Number(fav.id) === Number(producto.id));
    if (existe) setFavoritos(favoritos.filter((f) => Number(f.id) !== Number(producto.id)));
    else setFavoritos([...favoritos, productoCompleto]);
  };

  const agregarCotizador = (producto, e) => {
    if (e) e.stopPropagation();
    const existe = cotizador.find((p) => Number(p.id) === Number(producto.id));
    if (existe) {
      mostrarNotificacion("⚠️ Este producto ya está en el cotizador", "warning");
      return;
    }
    const productoCompleto = {
      ...producto,
      imagen: obtenerImagen(producto),
      cantidad: 1,
      agregadoEn: new Date().toISOString(),
    };
    const nuevoCotizador = [...cotizador, productoCompleto];
    setCotizador(nuevoCotizador);
    localStorage.setItem("cotizador", JSON.stringify(nuevoCotizador));
    mostrarNotificacion("✅ Producto agregado al cotizador", "success");
    window.dispatchEvent(new Event("cotizadorActualizado"));
  };

  const agregarAlPedido = (producto, e) => {
    if (e) e.stopPropagation();
    const existe = pedido.find((p) => Number(p.id) === Number(producto.id));
    let nuevoPedido;
    if (existe) {
      nuevoPedido = pedido.map((p) =>
        Number(p.id) === Number(producto.id)
          ? { ...p, cantidad: Number(p.cantidad) + 1, subtotal: (Number(p.precio) || 0) * (Number(p.cantidad) + 1) }
          : p
      );
      mostrarNotificacion(`✅ "${producto.nombre}" +1 al pedido`, "success");
    } else {
      const precio = Number(producto.oferta ? producto.precioOferta : producto.precio) || 0;
      const nuevoItem = {
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
      };
      nuevoPedido = [...pedido, nuevoItem];
      mostrarNotificacion(`✅ "${producto.nombre}" agregado al pedido`, "success");
    }
    setPedido(nuevoPedido);
    sessionStorage.setItem("carritoPedido", JSON.stringify(nuevoPedido));
    window.dispatchEvent(new Event("pedidoActualizado"));
  };

  const toggleComparador = (producto, e) => {
    if (e) e.stopPropagation();
    const existe = comparador.find((p) => Number(p.id) === Number(producto.id));
    if (existe) {
      const nuevo = comparador.filter((p) => Number(p.id) !== Number(producto.id));
      setComparador(nuevo);
      localStorage.setItem("comparador", JSON.stringify(nuevo));
      mostrarNotificacion(`🗑 "${producto.nombre}" quitado del comparador`, "warning");
    } else {
      if (comparador.length >= 3) {
        mostrarNotificacion("⚠️ Máximo 3 productos para comparar", "warning");
        return;
      }
      if (comparador.length > 0) {
        const catActual = comparador[0].categoria_id;
        if (Number(producto.categoria_id) !== Number(catActual)) {
          mostrarNotificacion("⚠️ Solo puedes comparar productos de la misma categoría", "warning");
          return;
        }
      }
      const productoCompleto = { ...producto, imagen: obtenerImagen(producto) };
      const nuevo = [...comparador, productoCompleto];
      setComparador(nuevo);
      localStorage.setItem("comparador", JSON.stringify(nuevo));
      mostrarNotificacion(`✅ "${producto.nombre}" agregado al comparador`, "success");
    }
  };

  const quitarDelComparador = (id, e) => {
    if (e) e.stopPropagation();
    const nuevo = comparador.filter((p) => Number(p.id) !== Number(id));
    setComparador(nuevo);
    localStorage.setItem("comparador", JSON.stringify(nuevo));
    mostrarNotificacion("🗑 Producto quitado del comparador", "warning");
  };

  const esFavorito = (id) => favoritos.some((f) => Number(f.id) === Number(id));
  const estaComparando = (id) => comparador.some((p) => Number(p.id) === Number(id));
  const estaEnCotizador = (id) => cotizador.some((p) => Number(p.id) === Number(id));
  const estaEnPedido = (id) => pedido.some((p) => Number(p.id) === Number(id));

  const resaltarTexto = (texto) => {
    if (!busqueda.trim()) return texto;
    const regex = new RegExp(`(${busqueda.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    return texto?.split(regex).map((parte, index) =>
      parte.toLowerCase() === busqueda.toLowerCase() ? (
        <span key={index} style={styles.highlight()}>{parte}</span>
      ) : (
        parte
      )
    );
  };

  /* ============================================================
     🔥 FILTRADO PRINCIPAL
     ============================================================ */
  const productosFiltrados = useMemo(() => {
    return [...productos]
      .filter((p) => {
        if (!busqueda.trim()) return true;
        const t = busqueda.toLowerCase();
        return (
          (p.nombre || "").toLowerCase().includes(t) ||
          (p.descripcion || "").toLowerCase().includes(t) ||
          (p.categoria || "").toLowerCase().includes(t) ||
          (p.subcategoria || "").toLowerCase().includes(t) ||
          (p.sku || "").toLowerCase().includes(t) ||
          (p.tipo || "").toLowerCase().includes(t)
        );
      })
      .filter((p) => !categoriaSeleccionada || p.categoria === categoriaSeleccionada)
      .filter((p) => !subcategoriaSeleccionada || p.subcategoria === subcategoriaSeleccionada)
      .filter((p) => !tipoSeleccionado || p.tipo === tipoSeleccionado)
      .filter((p) => !soloOfertas || p.oferta === 1 || p.oferta === true)
      .filter((p) => !soloDestacados || p.destacado === 1 || p.destacado === true)
      .filter((p) => !usoSeleccionado || p.uso === usoSeleccionado)
      .filter((p) => !aplicacionSeleccionada || p.aplicacion === aplicacionSeleccionada)
      .filter((p) => !tipoDisenoSeleccionado || p.tipo_diseno === tipoDisenoSeleccionado)
      .filter((p) => !materialSeleccionado || p.material === materialSeleccionado)
      .filter((p) => !acabadoSeleccionado || p.acabado === acabadoSeleccionado)
      .filter((p) => !tipoInstalacionSeleccionado || p.tipo_instalacion === tipoInstalacionSeleccionado)
      .filter((p) => !tipoVentaSeleccionado || getTipoVentaAmigable(p.tipoVenta) === tipoVentaSeleccionado)
      .filter((p) => {
        if (anchosSeleccionados.length === 0) return true;
        const v = getAnchoEfectivoCm(p);
        return v !== null && estaEnRangoSeleccionado(v, anchosSeleccionados, convertirACm);
      })
      .filter((p) => {
        if (altosSeleccionados.length === 0) return true;
        const v = getAltoEfectivoCm(p);
        return v !== null && estaEnRangoSeleccionado(v, altosSeleccionados, convertirACm);
      })
      .filter((p) => {
        if (gruesosSeleccionados.length === 0) return true;
        const v = getGruesoEfectivoMm(p);
        return v !== null && estaEnRangoSeleccionado(v, gruesosSeleccionados, convertirAMm);
      })
      .filter((p) => {
        if (coberturasSeleccionadas.length === 0) return true;
        const v = getCoberturaEfectivaM2(p);
        return v !== null && estaEnRangoSeleccionado(v, coberturasSeleccionadas, (x) => x);
      })
      .filter((p) => {
        if (piezasSeleccionadas.length === 0) return true;
        const v = getPiezasEfectivo(p);
        return v !== null && valorSimpleCoincide(v, piezasSeleccionadas);
      })
      .filter((p) => {
        if (espesoresSeleccionados.length === 0) return true;
        const v = getEspesorEfectivoMm(p);
        return v !== null && estaEnRangoSeleccionado(v, espesoresSeleccionados, (x) => x);
      })
      .filter((p) => {
        if (metrosCuadradosSeleccionados.length === 0) return true;
        if (p.tipoVenta !== "metro_cuadrado" && p.tipoVenta !== "metro_lineal") return false;
        const v = getCoberturaEfectivaM2(p);
        return v !== null && estaEnRangoSeleccionado(v, metrosCuadradosSeleccionados, (x) => x);
      })
      .filter((p) => {
        if (metrosLinealesSeleccionados.length === 0) return true;
        if (p.tipoVenta !== "metro_cuadrado" && p.tipoVenta !== "metro_lineal") return false;
        const v = getMetrosLinealesEfectivo(p);
        return v !== null && estaEnRangoSeleccionado(v, metrosLinealesSeleccionados, (x) => x);
      })
      .filter((p) => {
        const precio = Number(p.oferta ? p.precioOferta : p.precio) || 0;
        const min = parseFloat(precioMin);
        const max = parseFloat(precioMax);
        if (!isNaN(min) && precio < min) return false;
        if (!isNaN(max) && precio > max) return false;
        return true;
      })
      .filter((p) => {
        if (soloConStock && (!p.stock || p.stock <= 0)) return false;
        if (soloSinStock && p.stock > 0) return false;
        return true;
      })
      .filter((p) => !soloNuevos || p.nuevo === 1 || p.nuevo === true)
      .filter((p) => !soloRebajados || p.rebaja === 1 || p.rebaja === true)
      .filter((p) => !soloConFicha || (p.fichaTecnica && p.fichaTecnica.trim() !== ""));
  }, [
    productos, busqueda, categoriaSeleccionada, subcategoriaSeleccionada,
    tipoSeleccionado, soloOfertas, soloDestacados, usoSeleccionado,
    aplicacionSeleccionada, tipoDisenoSeleccionado, materialSeleccionado,
    acabadoSeleccionado, tipoInstalacionSeleccionado, tipoVentaSeleccionado,
    anchosSeleccionados, altosSeleccionados, gruesosSeleccionados,
    coberturasSeleccionadas, piezasSeleccionadas, espesoresSeleccionados,
    metrosCuadradosSeleccionados, metrosLinealesSeleccionados,
    precioMin, precioMax, soloConStock, soloSinStock, soloNuevos,
    soloRebajados, soloConFicha,
  ]);

  const productosOrdenados = useMemo(() => {
    return [...productosFiltrados].sort((a, b) => {
      if (!orden) {
        const da = a.destacado === 1 || a.destacado === true ? 1 : 0;
        const db = b.destacado === 1 || b.destacado === true ? 1 : 0;
        if (db !== da) return db - da;
        const oa = a.oferta === 1 || a.oferta === true ? 1 : 0;
        const ob = b.oferta === 1 || b.oferta === true ? 1 : 0;
        if (ob !== oa) return ob - oa;
        return (b.id || 0) - (a.id || 0);
      }
      if (orden === "A-Z") return (a.nombre || "").localeCompare(b.nombre || "");
      if (orden === "Z-A") return (b.nombre || "").localeCompare(a.nombre || "");
      if (orden === "Menor precio") {
        return (Number(a.precioOferta) || Number(a.precio)) - (Number(b.precioOferta) || Number(b.precio));
      }
      if (orden === "Mayor precio") {
        return (Number(b.precioOferta) || Number(b.precio)) - (Number(a.precioOferta) || Number(a.precio));
      }
      if (orden === "SKU") return (a.sku || "").localeCompare(b.sku || "");
      if (orden === "Recientes") return (b.id || 0) - (a.id || 0);
      return 0;
    });
  }, [productosFiltrados, orden]);

  /* ============================================================
     🧠 CONTADORES INTELIGENTES CONTEXTUALES
     ============================================================ */
  // Los contadores se calculan aplicando TODOS los filtros EXCEPTO el propio
  // Así cada opción muestra cuántos productos quedarían si la seleccionas
  const contadores = useMemo(() => {
    const filtrarExcepto = (excepto) => {
      return productos.filter((p) => {
        if (excepto !== "busqueda" && busqueda.trim()) {
          const t = busqueda.toLowerCase();
          const match =
            (p.nombre || "").toLowerCase().includes(t) ||
            (p.descripcion || "").toLowerCase().includes(t) ||
            (p.categoria || "").toLowerCase().includes(t) ||
            (p.subcategoria || "").toLowerCase().includes(t) ||
            (p.sku || "").toLowerCase().includes(t) ||
            (p.tipo || "").toLowerCase().includes(t);
          if (!match) return false;
        }
        if (excepto !== "categoria" && categoriaSeleccionada && p.categoria !== categoriaSeleccionada) return false;
        if (excepto !== "subcategoria" && subcategoriaSeleccionada && p.subcategoria !== subcategoriaSeleccionada) return false;
        if (excepto !== "tipo" && tipoSeleccionado && p.tipo !== tipoSeleccionado) return false;
        if (excepto !== "uso" && usoSeleccionado && p.uso !== usoSeleccionado) return false;
        if (excepto !== "aplicacion" && aplicacionSeleccionada && p.aplicacion !== aplicacionSeleccionada) return false;
        if (excepto !== "tipo_diseno" && tipoDisenoSeleccionado && p.tipo_diseno !== tipoDisenoSeleccionado) return false;
        if (excepto !== "material" && materialSeleccionado && p.material !== materialSeleccionado) return false;
        if (excepto !== "acabado" && acabadoSeleccionado && p.acabado !== acabadoSeleccionado) return false;
        if (excepto !== "tipo_instalacion" && tipoInstalacionSeleccionado && p.tipo_instalacion !== tipoInstalacionSeleccionado) return false;
        if (excepto !== "tipo_venta" && tipoVentaSeleccionado && getTipoVentaAmigable(p.tipoVenta) !== tipoVentaSeleccionado) return false;
        // Filtros rápidos
        if (excepto !== "rapidos") {
          if (soloOfertas && !(p.oferta === 1 || p.oferta === true)) return false;
          if (soloDestacados && !(p.destacado === 1 || p.destacado === true)) return false;
          if (soloConStock && (!p.stock || p.stock <= 0)) return false;
          if (soloSinStock && p.stock > 0) return false;
          if (soloNuevos && !(p.nuevo === 1 || p.nuevo === true)) return false;
          if (soloRebajados && !(p.rebaja === 1 || p.rebaja === true)) return false;
        }
        return true;
      });
    };

    const contar = (campo, excepto) => {
      const base = filtrarExcepto(excepto);
      const map = {};
      if (campo === "tipoVenta") {
        base.forEach((p) => {
          const v = getTipoVentaAmigable(p.tipoVenta);
          if (v) map[v] = (map[v] || 0) + 1;
        });
      } else {
        base.forEach((p) => {
          const v = p[campo];
          if (v) map[v] = (map[v] || 0) + 1;
        });
      }
      return map;
    };

    return {
      categoria: contar("categoria", "categoria"),
      subcategoria: contar("subcategoria", "subcategoria"),
      tipo: contar("tipo", "tipo"),
      uso: contar("uso", "uso"),
      aplicacion: contar("aplicacion", "aplicacion"),
      tipo_diseno: contar("tipo_diseno", "tipo_diseno"),
      material: contar("material", "material"),
      acabado: contar("acabado", "acabado"),
      tipo_instalacion: contar("tipo_instalacion", "tipo_instalacion"),
      tipoVenta: contar("tipoVenta", "tipo_venta"),
    };
  }, [
    productos, busqueda, categoriaSeleccionada, subcategoriaSeleccionada,
    tipoSeleccionado, usoSeleccionado, aplicacionSeleccionada,
    tipoDisenoSeleccionado, materialSeleccionado, acabadoSeleccionado,
    tipoInstalacionSeleccionado, tipoVentaSeleccionado,
    soloOfertas, soloDestacados, soloConStock, soloSinStock,
    soloNuevos, soloRebajados,
  ]);

  /* 🎯 Conteos para filtros rápidos (muestra cuántos hay con cada uno) */
  const contadoresRapidos = useMemo(() => {
    const base = productos.filter((p) => {
      if (busqueda.trim()) {
        const t = busqueda.toLowerCase();
        const match =
          (p.nombre || "").toLowerCase().includes(t) ||
          (p.descripcion || "").toLowerCase().includes(t) ||
          (p.categoria || "").toLowerCase().includes(t) ||
          (p.subcategoria || "").toLowerCase().includes(t) ||
          (p.sku || "").toLowerCase().includes(t) ||
          (p.tipo || "").toLowerCase().includes(t);
        if (!match) return false;
      }
      if (categoriaSeleccionada && p.categoria !== categoriaSeleccionada) return false;
      if (subcategoriaSeleccionada && p.subcategoria !== subcategoriaSeleccionada) return false;
      if (tipoSeleccionado && p.tipo !== tipoSeleccionado) return false;
      return true;
    });
    return {
      ofertas: base.filter((p) => p.oferta === 1 || p.oferta === true).length,
      destacados: base.filter((p) => p.destacado === 1 || p.destacado === true).length,
      nuevos: base.filter((p) => p.nuevo === 1 || p.nuevo === true).length,
      rebajados: base.filter((p) => p.rebaja === 1 || p.rebaja === true).length,
      conStock: base.filter((p) => p.stock && p.stock > 0).length,
      sinStock: base.filter((p) => !p.stock || p.stock <= 0).length,
      conFicha: base.filter((p) => p.fichaTecnica && p.fichaTecnica.trim() !== "").length,
    };
  }, [productos, busqueda, categoriaSeleccionada, subcategoriaSeleccionada, tipoSeleccionado]);

  /* 💡 Sugerencias inteligentes: filtros con más resultados sin seleccionar */
  const sugerencias = useMemo(() => {
    if (categoriaSeleccionada || subcategoriaSeleccionada) return [];
    const base = productos;
    const conteos = {};
    base.forEach((p) => {
      if (p.categoria) {
        conteos[p.categoria] = (conteos[p.categoria] || 0) + 1;
      }
    });
    return Object.entries(conteos)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([nombre, count]) => ({ nombre, count }));
  }, [productos, categoriaSeleccionada, subcategoriaSeleccionada]);

  const getOpcionesFiltro = (campo) => {
    let base = productos;
    if (categoriaSeleccionada) base = base.filter((p) => p.categoria === categoriaSeleccionada);
    if (subcategoriaSeleccionada) base = base.filter((p) => p.subcategoria === subcategoriaSeleccionada);
    return [...new Set(base.map((p) => p[campo]).filter(Boolean))].sort();
  };

  const opcionesUso = getOpcionesFiltro("uso");
  const opcionesAplicacion = getOpcionesFiltro("aplicacion");
  const opcionesTipoDiseno = getOpcionesFiltro("tipo_diseno");
  const opcionesMaterial = getOpcionesFiltro("material");
  const opcionesAcabado = getOpcionesFiltro("acabado");
  const opcionesTipoInstalacion = getOpcionesFiltro("tipo_instalacion");

  const opcionesTipoProducto = useMemo(() => {
    let base = productos;
    if (categoriaSeleccionada) base = base.filter((p) => p.categoria === categoriaSeleccionada);
    if (subcategoriaSeleccionada) base = base.filter((p) => p.subcategoria === subcategoriaSeleccionada);
    const disponibles = new Set(base.map((p) => p.tipo).filter(Boolean));
    return tipos
      .filter((t) => disponibles.has(t.nombre))
      .map((t) => t.nombre)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort();
  }, [productos, tipos, categoriaSeleccionada, subcategoriaSeleccionada]);

  const categoriasDisponibles = useMemo(
    () => [...new Set(productos.map((p) => p.categoria).filter(Boolean))].sort(),
    [productos]
  );

  const subcategoriasDisponibles = useMemo(() => {
    const base = categoriaSeleccionada
      ? productos.filter((p) => p.categoria === categoriaSeleccionada)
      : productos;
    return [...new Set(base.map((p) => p.subcategoria).filter(Boolean))].sort();
  }, [productos, categoriaSeleccionada]);

  const totalPaginas = Math.ceil(productosOrdenados.length / productosPorPagina);
  const indiceUltimo = paginaActual * productosPorPagina;
  const indicePrimero = indiceUltimo - productosPorPagina;
  const productosPaginaActual = productosOrdenados.slice(indicePrimero, indiceUltimo);

  const cambiarPagina = (n) => {
    setPaginaActual(n);
    localStorage.setItem("pagina_actual", String(n));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPaginasMostradas = () => {
    if (isMobile) {
      const paginas = [];
      if (totalPaginas <= 5) {
        for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
      } else {
        paginas.push(1);
        if (paginaActual > 3) paginas.push("...");
        const start = Math.max(2, paginaActual - 1);
        const end = Math.min(totalPaginas - 1, paginaActual + 1);
        for (let i = start; i <= end; i++) paginas.push(i);
        if (paginaActual < totalPaginas - 2) paginas.push("...");
        paginas.push(totalPaginas);
      }
      return paginas;
    }
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  };

  const contarFiltrosActivos = useCallback(() => {
    let count = 0;
    if (categoriaSeleccionada) count++;
    if (subcategoriaSeleccionada) count++;
    if (tipoSeleccionado) count++;
    if (usoSeleccionado) count++;
    if (aplicacionSeleccionada) count++;
    if (tipoDisenoSeleccionado) count++;
    if (materialSeleccionado) count++;
    if (acabadoSeleccionado) count++;
    if (tipoInstalacionSeleccionado) count++;
    if (tipoVentaSeleccionado) count++;
    count += anchosSeleccionados.length;
    count += altosSeleccionados.length;
    count += gruesosSeleccionados.length;
    count += coberturasSeleccionadas.length;
    count += piezasSeleccionadas.length;
    count += espesoresSeleccionados.length;
    count += metrosCuadradosSeleccionados.length;
    count += metrosLinealesSeleccionados.length;
    if (soloOfertas) count++;
    if (soloDestacados) count++;
    if (soloConStock) count++;
    if (soloSinStock) count++;
    if (soloNuevos) count++;
    if (soloRebajados) count++;
    if (soloConFicha) count++;
    if (precioMin) count++;
    if (precioMax) count++;
    if (orden) count++;
    if (busqueda) count++;
    return count;
  }, [
    categoriaSeleccionada, subcategoriaSeleccionada, tipoSeleccionado,
    usoSeleccionado, aplicacionSeleccionada, tipoDisenoSeleccionado,
    materialSeleccionado, acabadoSeleccionado, tipoInstalacionSeleccionado,
    tipoVentaSeleccionado, anchosSeleccionados, altosSeleccionados,
    gruesosSeleccionados, coberturasSeleccionadas, piezasSeleccionadas,
    espesoresSeleccionados, metrosCuadradosSeleccionados, metrosLinealesSeleccionados,
    soloOfertas, soloDestacados, soloConStock, soloSinStock, soloNuevos,
    soloRebajados, soloConFicha, precioMin, precioMax, orden, busqueda,
  ]);

  const filtrosActivos = contarFiltrosActivos();

  const badgesSeccion = {
    busquedaOrden: (busqueda ? 1 : 0) + (orden ? 1 : 0),
    categoria: [categoriaSeleccionada, subcategoriaSeleccionada, tipoSeleccionado].filter(Boolean).length,
    precio: [precioMin, precioMax].filter(Boolean).length,
    rapidos: [soloOfertas, soloDestacados, soloConStock, soloSinStock, soloNuevos, soloRebajados, soloConFicha].filter(Boolean).length,
    medidas:
      anchosSeleccionados.length + altosSeleccionados.length + gruesosSeleccionados.length +
      coberturasSeleccionadas.length + piezasSeleccionadas.length + espesoresSeleccionados.length +
      metrosCuadradosSeleccionados.length + metrosLinealesSeleccionados.length,
    caracteristicas: [usoSeleccionado, aplicacionSeleccionada, tipoDisenoSeleccionado, materialSeleccionado, acabadoSeleccionado].filter(Boolean).length,
    venta: [tipoVentaSeleccionado, tipoInstalacionSeleccionado].filter(Boolean).length,
  };

  /* ============================================================
     🎛️ PANEL DE FILTROS
     ============================================================ */
  const renderPanelFiltros = () => (
    <>
      {/* HEADER DE FILTROS APLICADOS */}
      {filtrosActivos > 0 && (
        <div style={styles.appliedHeader(darkMode)}>
          <div style={styles.appliedHeaderLeft}>
            <span style={styles.appliedHeaderIcon}>✨</span>
            <div>
              <span style={styles.appliedHeaderTitle(darkMode)}>
                {filtrosActivos} filtro{filtrosActivos !== 1 ? "s" : ""} aplicado{filtrosActivos !== 1 ? "s" : ""}
              </span>
              <span style={styles.appliedHeaderSub(darkMode)}>
                {productosOrdenados.length} resultado{productosOrdenados.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={limpiarTodosLosFiltros}
            style={styles.appliedClearBtn}
            title="Limpiar todos los filtros"
          >
            Limpiar
          </button>
        </div>
      )}

      <SeccionColapsable
        id="busquedaOrden"
        titulo="Búsqueda y orden"
        subtitulo="Encuentra lo que necesitas"
        icono="🔍"
        badge={badgesSeccion.busquedaOrden}
        abierta={seccionesAbiertas.busquedaOrden}
        onToggle={toggleSeccion}
        darkMode={darkMode}
      >
        <div style={styles.filtroCampo}>
          <BuscadorInput
            darkMode={darkMode}
            valorInicial={busqueda}
            placeholder="Nombre, SKU, descripción…"
            onDebouncedChange={(v) => {
              setBusqueda(v);
              guardarFiltro("busqueda", v);
            }}
          />
        </div>

        <SelectorFiltro
          darkMode={darkMode}
          icono="🔤"
          label="Ordenar por"
          value={orden}
          onChange={(v) => {
            setOrden(v);
            guardarFiltro("orden", v);
          }}
          options={OPCIONES_ORDEN}
          placeholder="🎯 Relevancia"
        />
      </SeccionColapsable>

      <SeccionColapsable
        id="categoria"
        titulo="Categoría y tipo"
        subtitulo="Filtra por clasificación"
        icono="📂"
        badge={badgesSeccion.categoria}
        abierta={seccionesAbiertas.categoria}
        onToggle={toggleSeccion}
        darkMode={darkMode}
      >
        {/* Sugerencias rápidas */}
        {sugerencias.length > 0 && (
          <div style={styles.sugerenciasWrap(darkMode)}>
            <span style={styles.sugerenciasLabel(darkMode)}>💡 Populares</span>
            <div style={styles.sugerenciasChips}>
              {sugerencias.map((s) => (
                <button
                  key={s.nombre}
                  type="button"
                  onClick={() => {
                    setCategoriaSeleccionada(s.nombre);
                    guardarFiltro("categoria", s.nombre);
                    setSubcategoriaSeleccionada("");
                    guardarFiltro("subcategoria", "");
                    setTipoSeleccionado("");
                    guardarFiltro("tipo", "");
                  }}
                  style={styles.sugerenciaChip(darkMode)}
                >
                  {s.nombre}
                  <span style={styles.sugerenciaCount}>{s.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <SelectorFiltro
          darkMode={darkMode}
          icono="📂"
          label="Categoría"
          value={categoriaSeleccionada}
          onChange={(v) => {
            setCategoriaSeleccionada(v);
            guardarFiltro("categoria", v);
            setSubcategoriaSeleccionada("");
            guardarFiltro("subcategoria", "");
            setTipoSeleccionado("");
            guardarFiltro("tipo", "");
          }}
          options={categoriasDisponibles}
          contadores={contadores.categoria}
        />
        {subcategoriasDisponibles.length > 0 && (
          <SelectorFiltro
            darkMode={darkMode}
            icono="📁"
            label="Subcategoría"
            value={subcategoriaSeleccionada}
            onChange={(v) => {
              setSubcategoriaSeleccionada(v);
              guardarFiltro("subcategoria", v);
            }}
            options={subcategoriasDisponibles}
            contadores={contadores.subcategoria}
          />
        )}
        <SelectorFiltro
          darkMode={darkMode}
          icono="🏷️"
          label="Tipo de producto"
          value={tipoSeleccionado}
          onChange={(v) => {
            setTipoSeleccionado(v);
            guardarFiltro("tipo", v);
          }}
          options={opcionesTipoProducto}
          contadores={contadores.tipo}
        />
      </SeccionColapsable>

      <SeccionColapsable
        id="precio"
        titulo="Rango de precio"
        subtitulo="Ajusta tu presupuesto"
        icono="💰"
        badge={badgesSeccion.precio}
        abierta={seccionesAbiertas.precio}
        onToggle={toggleSeccion}
        darkMode={darkMode}
      >
        <div style={styles.precioRow}>
          <PrecioInput
            darkMode={darkMode}
            valorInicial={precioMin}
            placeholder="Mín"
            onCambio={(v) => {
              setPrecioMin(v);
              guardarFiltro("precio_min", v);
            }}
          />
          <span style={styles.precioSeparator}>—</span>
          <PrecioInput
            darkMode={darkMode}
            valorInicial={precioMax}
            placeholder="Máx"
            onCambio={(v) => {
              setPrecioMax(v);
              guardarFiltro("precio_max", v);
            }}
          />
        </div>
        <div style={styles.precioQuickRow}>
          {[
            { l: "< $50", min: "", max: "50" },
            { l: "$50–100", min: "50", max: "100" },
            { l: "$100–500", min: "100", max: "500" },
            { l: "> $500", min: "500", max: "" },
          ].map((q) => {
            const activo = precioMin === q.min && precioMax === q.max;
            return (
              <button
                key={q.l}
                type="button"
                onClick={() => {
                  setPrecioMin(q.min);
                  guardarFiltro("precio_min", q.min);
                  setPrecioMax(q.max);
                  guardarFiltro("precio_max", q.max);
                }}
                style={styles.precioQuickBtn(darkMode, activo)}
              >
                {q.l}
              </button>
            );
          })}
        </div>
      </SeccionColapsable>

      <SeccionColapsable
        id="rapidos"
        titulo="Filtros rápidos"
        subtitulo="Atajos comunes"
        icono="⚡"
        badge={badgesSeccion.rapidos}
        abierta={seccionesAbiertas.rapidos}
        onToggle={toggleSeccion}
        darkMode={darkMode}
      >
        <div style={styles.toggleList}>
          <ToggleSwitch
            darkMode={darkMode}
            icono="🔥"
            texto="Solo ofertas"
            activo={soloOfertas}
            count={contadoresRapidos.ofertas}
            onChange={() => { setSoloOfertas(!soloOfertas); guardarFiltro("ofertas", String(!soloOfertas)); }}
          />
          <ToggleSwitch
            darkMode={darkMode}
            icono="⭐"
            texto="Solo destacados"
            activo={soloDestacados}
            count={contadoresRapidos.destacados}
            onChange={() => { setSoloDestacados(!soloDestacados); guardarFiltro("destacados", String(!soloDestacados)); }}
          />
          <ToggleSwitch
            darkMode={darkMode}
            icono="🆕"
            texto="Solo nuevos"
            activo={soloNuevos}
            count={contadoresRapidos.nuevos}
            onChange={() => { setSoloNuevos(!soloNuevos); guardarFiltro("nuevos", String(!soloNuevos)); }}
          />
          <ToggleSwitch
            darkMode={darkMode}
            icono="🏷"
            texto="Solo rebajados"
            activo={soloRebajados}
            count={contadoresRapidos.rebajados}
            onChange={() => { setSoloRebajados(!soloRebajados); guardarFiltro("rebajados", String(!soloRebajados)); }}
          />
          <ToggleSwitch
            darkMode={darkMode}
            icono="📦"
            texto="Con stock"
            activo={soloConStock}
            count={contadoresRapidos.conStock}
            onChange={() => {
              const nuevo = !soloConStock;
              setSoloConStock(nuevo);
              if (nuevo) { setSoloSinStock(false); guardarFiltro("sin_stock", "false"); }
              guardarFiltro("con_stock", String(nuevo));
            }}
          />
          <ToggleSwitch
            darkMode={darkMode}
            icono="🚫"
            texto="Sin stock"
            activo={soloSinStock}
            count={contadoresRapidos.sinStock}
            onChange={() => {
              const nuevo = !soloSinStock;
              setSoloSinStock(nuevo);
              if (nuevo) { setSoloConStock(false); guardarFiltro("con_stock", "false"); }
              guardarFiltro("sin_stock", String(nuevo));
            }}
          />
          <ToggleSwitch
            darkMode={darkMode}
            icono="📄"
            texto="Con ficha técnica"
            activo={soloConFicha}
            count={contadoresRapidos.conFicha}
            onChange={() => { setSoloConFicha(!soloConFicha); guardarFiltro("con_ficha", String(!soloConFicha)); }}
          />
        </div>
      </SeccionColapsable>

      <SeccionColapsable
        id="medidas"
        titulo="Medidas"
        subtitulo="Dimensiones del producto"
        icono="📏"
        badge={badgesSeccion.medidas}
        abierta={seccionesAbiertas.medidas}
        onToggle={toggleSeccion}
        darkMode={darkMode}
      >
        <ChipsRango darkMode={darkMode} icono="↔️" label="Ancho" options={OPCIONES_ANCHO} selected={anchosSeleccionados} onToggle={(v) => toggleSeleccionArray(setAnchosSeleccionados, "anchos_seleccionados", v)} />
        <ChipsRango darkMode={darkMode} icono="↕️" label="Alto" options={OPCIONES_ALTO} selected={altosSeleccionados} onToggle={(v) => toggleSeleccionArray(setAltosSeleccionados, "altos_seleccionados", v)} />
        <ChipsRango darkMode={darkMode} icono="📏" label="Grueso" options={OPCIONES_GRUESO} selected={gruesosSeleccionados} onToggle={(v) => toggleSeleccionArray(setGruesosSeleccionados, "gruesos_seleccionados", v)} />
        <ChipsRango darkMode={darkMode} icono="📦" label="Cobertura" options={OPCIONES_COBERTURA} selected={coberturasSeleccionadas} onToggle={(v) => toggleSeleccionArray(setCoberturasSeleccionadas, "coberturas_seleccionadas", v)} />
        <ChipsRango darkMode={darkMode} icono="📐" label="m² del rollo" options={OPCIONES_M2} selected={metrosCuadradosSeleccionados} onToggle={(v) => toggleSeleccionArray(setMetrosCuadradosSeleccionados, "metros_cuadrados_seleccionados", v)} />
        <ChipsRango darkMode={darkMode} icono="📏" label="Metros lineales" options={OPCIONES_ML} selected={metrosLinealesSeleccionados} onToggle={(v) => toggleSeleccionArray(setMetrosLinealesSeleccionados, "metros_lineales_seleccionados", v)} />
        <ChipsRango darkMode={darkMode} icono="🔢" label="Piezas por caja" options={OPCIONES_PIEZAS} selected={piezasSeleccionadas} onToggle={(v) => toggleSeleccionArray(setPiezasSeleccionadas, "piezas_seleccionadas", v)} />
        <ChipsRango darkMode={darkMode} icono="📏" label="Espesor desgaste" options={OPCIONES_ESPESOR} selected={espesoresSeleccionados} onToggle={(v) => toggleSeleccionArray(setEspesoresSeleccionados, "espesores_seleccionados", v)} />
      </SeccionColapsable>

      <SeccionColapsable
        id="caracteristicas"
        titulo="Características"
        subtitulo="Propiedades del producto"
        icono="🎨"
        badge={badgesSeccion.caracteristicas}
        abierta={seccionesAbiertas.caracteristicas}
        onToggle={toggleSeccion}
        darkMode={darkMode}
      >
        {opcionesUso.length > 0 && (
          <SelectorFiltro darkMode={darkMode} icono="🏠" label="Uso" value={usoSeleccionado} onChange={(v) => { setUsoSeleccionado(v); guardarFiltro("uso", v); }} options={opcionesUso} contadores={contadores.uso} />
        )}
        {opcionesAplicacion.length > 0 && (
          <SelectorFiltro darkMode={darkMode} icono="📋" label="Aplicación" value={aplicacionSeleccionada} onChange={(v) => { setAplicacionSeleccionada(v); guardarFiltro("aplicacion", v); }} options={opcionesAplicacion} contadores={contadores.aplicacion} />
        )}
        {opcionesTipoDiseno.length > 0 && (
          <SelectorFiltro darkMode={darkMode} icono="🎨" label="Tipo de diseño" value={tipoDisenoSeleccionado} onChange={(v) => { setTipoDisenoSeleccionado(v); guardarFiltro("tipo_diseno", v); }} options={opcionesTipoDiseno} contadores={contadores.tipo_diseno} />
        )}
        {opcionesMaterial.length > 0 && (
          <SelectorFiltro darkMode={darkMode} icono="🧱" label="Material" value={materialSeleccionado} onChange={(v) => { setMaterialSeleccionado(v); guardarFiltro("material", v); }} options={opcionesMaterial} contadores={contadores.material} />
        )}
        {opcionesAcabado.length > 0 && (
          <SelectorFiltro darkMode={darkMode} icono="✨" label="Acabado" value={acabadoSeleccionado} onChange={(v) => { setAcabadoSeleccionado(v); guardarFiltro("acabado", v); }} options={opcionesAcabado} contadores={contadores.acabado} />
        )}
      </SeccionColapsable>

      <SeccionColapsable
        id="venta"
        titulo="Venta e instalación"
        subtitulo="Formato de venta"
        icono="🚚"
        badge={badgesSeccion.venta}
        abierta={seccionesAbiertas.venta}
        onToggle={toggleSeccion}
        darkMode={darkMode}
      >
        <SelectorFiltro
          darkMode={darkMode}
          icono="🚚" label="Tipo de venta" value={tipoVentaSeleccionado}
          onChange={(v) => { setTipoVentaSeleccionado(v); guardarFiltro("tipo_venta", v); }}
          options={OPCIONES_TIPO_VENTA}
          contadores={contadores.tipoVenta}
        />
        {opcionesTipoInstalacion.length > 0 && (
          <SelectorFiltro
            darkMode={darkMode}
            icono="🔧" label="Instalación" value={tipoInstalacionSeleccionado}
            onChange={(v) => { setTipoInstalacionSeleccionado(v); guardarFiltro("tipo_instalacion", v); }}
            options={opcionesTipoInstalacion} contadores={contadores.tipo_instalacion}
          />
        )}
      </SeccionColapsable>

      {filtrosActivos > 0 && (
        <button type="button" onClick={limpiarTodosLosFiltros} style={styles.btnResetFilters(darkMode)}>
          🔄 Restablecer {filtrosActivos} filtro{filtrosActivos !== 1 ? "s" : ""}
        </button>
      )}
    </>
  );

  /* ============================================================
     🏷️ CHIPS DE FILTROS ACTIVOS
     ============================================================ */
  const renderChipsActivos = () => {
    const simples = [
      categoriaSeleccionada && { key: "categoria", setter: setCategoriaSeleccionada, label: `📂 ${categoriaSeleccionada}`, grupo: "categoria" },
      subcategoriaSeleccionada && { key: "subcategoria", setter: setSubcategoriaSeleccionada, label: `📁 ${subcategoriaSeleccionada}`, grupo: "categoria" },
      tipoSeleccionado && { key: "tipo", setter: setTipoSeleccionado, label: `🏷️ ${tipoSeleccionado}`, grupo: "categoria" },
      usoSeleccionado && { key: "uso", setter: setUsoSeleccionado, label: `🏠 ${usoSeleccionado}`, grupo: "caracteristicas" },
      aplicacionSeleccionada && { key: "aplicacion", setter: setAplicacionSeleccionada, label: `📋 ${aplicacionSeleccionada}`, grupo: "caracteristicas" },
      tipoDisenoSeleccionado && { key: "tipo_diseno", setter: setTipoDisenoSeleccionado, label: `🎨 ${tipoDisenoSeleccionado}`, grupo: "caracteristicas" },
      materialSeleccionado && { key: "material", setter: setMaterialSeleccionado, label: `🧱 ${materialSeleccionado}`, grupo: "caracteristicas" },
      acabadoSeleccionado && { key: "acabado", setter: setAcabadoSeleccionado, label: `✨ ${acabadoSeleccionado}`, grupo: "caracteristicas" },
      tipoInstalacionSeleccionado && { key: "tipo_instalacion", setter: setTipoInstalacionSeleccionado, label: `🔧 ${tipoInstalacionSeleccionado}`, grupo: "venta" },
      tipoVentaSeleccionado && { key: "tipo_venta", setter: setTipoVentaSeleccionado, label: `🚚 ${tipoVentaSeleccionado}`, grupo: "venta" },
    ].filter(Boolean);

    const arrays = [
      ...anchosSeleccionados.map((v) => ({ tipo: "anchos_seleccionados", valor: v, label: `↔️ ${v}`, setter: setAnchosSeleccionados })),
      ...altosSeleccionados.map((v) => ({ tipo: "altos_seleccionados", valor: v, label: `↕️ ${v}`, setter: setAltosSeleccionados })),
      ...gruesosSeleccionados.map((v) => ({ tipo: "gruesos_seleccionados", valor: v, label: `📏 ${v}`, setter: setGruesosSeleccionados })),
      ...coberturasSeleccionadas.map((v) => ({ tipo: "coberturas_seleccionadas", valor: v, label: `📦 ${v}`, setter: setCoberturasSeleccionadas })),
      ...piezasSeleccionadas.map((v) => ({ tipo: "piezas_seleccionadas", valor: v, label: `🔢 ${v}`, setter: setPiezasSeleccionadas })),
      ...espesoresSeleccionados.map((v) => ({ tipo: "espesores_seleccionados", valor: v, label: `📏 ${v}`, setter: setEspesoresSeleccionados })),
      ...metrosCuadradosSeleccionados.map((v) => ({ tipo: "metros_cuadrados_seleccionados", valor: v, label: `📐 ${v}`, setter: setMetrosCuadradosSeleccionados })),
      ...metrosLinealesSeleccionados.map((v) => ({ tipo: "metros_lineales_seleccionados", valor: v, label: `📏 ${v}`, setter: setMetrosLinealesSeleccionados })),
    ];

    const hayChips =
      simples.length || arrays.length || soloOfertas || soloDestacados || busqueda || orden ||
      soloConStock || soloSinStock || soloNuevos || soloRebajados || soloConFicha || precioMin || precioMax;

    if (!hayChips) return null;

    return (
      <div style={styles.chipsActivosWrap(darkMode)}>
        <div style={styles.chipsHeader}>
          <span style={styles.chipsHeaderIcon}>🎯</span>
          <span style={styles.chipsHeaderText(darkMode)}>
            {filtrosActivos} filtro{filtrosActivos !== 1 ? "s" : ""} activo{filtrosActivos !== 1 ? "s" : ""}
          </span>
          <button type="button" onClick={limpiarTodosLosFiltros} style={styles.chipsLimpiarBtn}>
            🗑️ Limpiar
          </button>
        </div>
        <div style={styles.chipsRow}>
          {simples.map((f, i) => (
            <span key={i} style={styles.chipActivo(darkMode)}>
              {f.label}
              <button type="button" onClick={() => { f.setter(""); guardarFiltro(f.key, ""); }} style={styles.chipRemove}>✕</button>
            </span>
          ))}
          {arrays.map((f, i) => (
            <span key={`a-${i}`} style={styles.chipActivo(darkMode)}>
              {f.label}
              <button type="button" onClick={() => toggleSeleccionArray(f.setter, f.tipo, f.valor)} style={styles.chipRemove}>✕</button>
            </span>
          ))}
          {soloOfertas && <span style={styles.chipActivo(darkMode)}>🔥 Ofertas<button type="button" onClick={() => { setSoloOfertas(false); guardarFiltro("ofertas", "false"); }} style={styles.chipRemove}>✕</button></span>}
          {soloDestacados && <span style={styles.chipActivo(darkMode)}>⭐ Destacados<button type="button" onClick={() => { setSoloDestacados(false); guardarFiltro("destacados", "false"); }} style={styles.chipRemove}>✕</button></span>}
          {soloConStock && <span style={styles.chipActivo(darkMode)}>📦 Con stock<button type="button" onClick={() => { setSoloConStock(false); guardarFiltro("con_stock", "false"); }} style={styles.chipRemove}>✕</button></span>}
          {soloSinStock && <span style={styles.chipActivo(darkMode)}>🚫 Sin stock<button type="button" onClick={() => { setSoloSinStock(false); guardarFiltro("sin_stock", "false"); }} style={styles.chipRemove}>✕</button></span>}
          {soloNuevos && <span style={styles.chipActivo(darkMode)}>🆕 Nuevos<button type="button" onClick={() => { setSoloNuevos(false); guardarFiltro("nuevos", "false"); }} style={styles.chipRemove}>✕</button></span>}
          {soloRebajados && <span style={styles.chipActivo(darkMode)}>🏷 Rebajados<button type="button" onClick={() => { setSoloRebajados(false); guardarFiltro("rebajados", "false"); }} style={styles.chipRemove}>✕</button></span>}
          {soloConFicha && <span style={styles.chipActivo(darkMode)}>📄 Con ficha<button type="button" onClick={() => { setSoloConFicha(false); guardarFiltro("con_ficha", "false"); }} style={styles.chipRemove}>✕</button></span>}
          {(precioMin || precioMax) && (
            <span style={styles.chipActivo(darkMode)}>
              💰 ${precioMin || "0"} – ${precioMax || "∞"}
              <button type="button" onClick={() => { setPrecioMin(""); setPrecioMax(""); guardarFiltro("precio_min", ""); guardarFiltro("precio_max", ""); }} style={styles.chipRemove}>✕</button>
            </span>
          )}
          {busqueda && <span style={styles.chipActivo(darkMode)}>🔍 "{busqueda}"<button type="button" onClick={() => { setBusqueda(""); guardarFiltro("busqueda", ""); }} style={styles.chipRemove}>✕</button></span>}
          {orden && <span style={styles.chipActivo(darkMode)}>🔤 {orden}<button type="button" onClick={() => { setOrden(""); guardarFiltro("orden", ""); }} style={styles.chipRemove}>✕</button></span>}
        </div>
      </div>
    );
  };

  /* ============================================================
     🎨 RENDER PRINCIPAL
     ============================================================ */
  return (
    <div style={styles.page(darkMode)}>
      {notificacion && (
        <div style={styles.notificacion(notificacion.tipo)}>
          {notificacion.mensaje}
        </div>
      )}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

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
        <div style={styles.headerModern}>
          <div>
            <h1 style={styles.titleModern(darkMode)}>🛍️ Nuestros Productos</h1>
            <p style={styles.subtitleModern(darkMode)}>
              Descubre nuestra colección exclusiva
            </p>
            {desdePedido && (
              <div style={styles.pedidoIndicator}>
                <FaShoppingCart style={{ marginRight: "6px" }} />
                Selecciona un producto para agregar a tu pedido
              </div>
            )}
          </div>
          <div style={styles.headerStats}>
            <span style={styles.statBadge(darkMode)}>
              <span style={styles.statNumber}>{productosOrdenados.length}</span>
              <span style={styles.statLabel}>Productos</span>
            </span>
          </div>
        </div>

        {/* MÓVIL */}
        {isMobile && (
          <div style={styles.mobileFilters(darkMode)}>
            <div style={styles.mobileSearchRow}>
              <div style={{ flex: 1 }}>
                <BuscadorInput
                  darkMode={darkMode}
                  valorInicial={busqueda}
                  placeholder="Buscar productos…"
                  onDebouncedChange={(v) => {
                    setBusqueda(v);
                    guardarFiltro("busqueda", v);
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => setOpenFiltrosExtra(!openFiltrosExtra)}
                style={styles.mobileFilterBtn(darkMode, openFiltrosExtra)}
              >
                {openFiltrosExtra ? "✕" : `⚙️${filtrosActivos > 0 ? ` ${filtrosActivos}` : ""}`}
              </button>
            </div>

            {openFiltrosExtra && (
              <div style={styles.mobileFiltersContent(darkMode)}>
                {renderPanelFiltros()}
                <button type="button" onClick={() => setOpenFiltrosExtra(false)} style={styles.mobileApplyBtn}>
                  ✓ Ver {productosOrdenados.length} producto{productosOrdenados.length !== 1 ? "s" : ""}
                </button>
              </div>
            )}
          </div>
        )}

        {renderChipsActivos()}

        {/* DESKTOP */}
        {!isMobile && (
          <div style={styles.desktopLayout}>
            <aside style={styles.filtrosPanel(darkMode)}>
              <div style={styles.panelHeader(darkMode)}>
                <div style={styles.panelHeaderLeft}>
                  <span style={styles.panelIcon}>🎯</span>
                  <div>
                    <h3 style={styles.panelTitle(darkMode)}>Filtros</h3>
                    <span style={styles.panelSubtitle(darkMode)}>
                      Refina tu búsqueda
                    </span>
                  </div>
                </div>
                {filtrosActivos > 0 && (
                  <span style={styles.filterCountBadge}>{filtrosActivos}</span>
                )}
              </div>
              <div style={styles.panelScroll}>
                {renderPanelFiltros()}
              </div>
            </aside>

            <div style={styles.productosGridContainer}>
              <div style={styles.resultsBar(darkMode)}>
                <span style={styles.resultsText(darkMode)}>
                  <strong>{productosOrdenados.length}</strong> producto{productosOrdenados.length !== 1 ? "s" : ""} encontrado{productosOrdenados.length !== 1 ? "s" : ""}
                </span>
                <span style={styles.resultsBadge(darkMode)}>
                  Página {paginaActual} de {totalPaginas || 1}
                </span>
              </div>

              {productosPaginaActual.length === 0 ? (
                <div style={styles.emptyState(darkMode)}>
                  <span style={styles.emptyIcon}>🔍</span>
                  <h3 style={styles.emptyTitle(darkMode)}>Sin resultados</h3>
                  <p style={styles.emptyText(darkMode)}>
                    Prueba ajustando o quitando algunos filtros
                  </p>
                  {filtrosActivos > 0 && (
                    <button type="button" onClick={limpiarTodosLosFiltros} style={styles.emptyBtn}>
                      Limpiar filtros
                    </button>
                  )}
                </div>
              ) : (
                <div style={styles.gridModern(getGridColumns())}>
                  {productosPaginaActual.map((p) => (
                    <div key={p.id} style={styles.cardModern(darkMode)}>
                      <div
                        style={styles.cardImageWrapper}
                        onClick={() => {
                          const desdeCotizador = localStorage.getItem("seleccionandoCotizador");
                          if (desdeCotizador === "true") { agregarCotizador(p); navigate("/cotizador"); return; }
                          navigate(`/producto/${p.id}`);
                        }}
                      >
                        <img src={obtenerImagen(p)} alt={p.nombre} style={styles.cardImage} />
                        {(p.oferta === 1 || p.oferta === true) && <span style={styles.offerBadge}>🔥 OFERTA</span>}
                        {p.destacado === 1 && <span style={styles.featuredBadge}>⭐ DESTACADO</span>}
                        {p.nuevo === 1 && <span style={styles.newBadge}>🆕 NUEVO</span>}
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleFavorito(p); }}
                          style={{
                            ...styles.favBtnModern,
                            background: esFavorito(p.id) ? "#ef4444" : "rgba(255,255,255,0.9)",
                            color: esFavorito(p.id) ? "#fff" : "#333",
                          }}
                        >
                          {esFavorito(p.id) ? "❤️" : "🤍"}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => toggleComparador(p, e)}
                          style={{
                            ...styles.compareBtnModern,
                            background: estaComparando(p.id) ? "#6366f1" : "rgba(255,255,255,0.9)",
                            color: estaComparando(p.id) ? "#fff" : "#333",
                          }}
                          title={estaComparando(p.id) ? "Quitar del comparador" : "Agregar al comparador"}
                        >
                          {estaComparando(p.id) ? "✓" : "⚖️"}
                        </button>
                      </div>

                      <div style={styles.cardContent}>
                        <h3 style={styles.cardTitle(darkMode)}>{resaltarTexto(p.nombre)}</h3>
                        <p style={styles.cardDesc(darkMode)}>
                          {resaltarTexto(p.descripcion?.slice(0, 60) || "Sin descripción")}
                          {p.descripcion?.length > 60 && "..."}
                        </p>

                        <div style={styles.cardTags}>
                          {p.categoria && <span style={styles.cardTag}>📂 {p.categoria.slice(0, 10)}</span>}
                          {p.uso && <span style={styles.cardTag}>🏠 {p.uso}</span>}
                          {p.material && <span style={styles.cardTag}>🧱 {p.material}</span>}
                          {p.tipoVenta && (
                            <span style={{ ...styles.cardTag, background: p.tipoVenta === "metro_cuadrado" ? "#dbeafe" : p.tipoVenta === "metro_lineal" ? "#e0f2fe" : "#f1f5f9" }}>
                              🚚 {getTipoVentaAmigable(p.tipoVenta)}
                            </span>
                          )}
                          {p.tipo && <span style={styles.cardTag}>🏷️ {p.tipo}</span>}
                        </div>

                        <div style={styles.cardPrice}>
                          {p.oferta === 1 || p.oferta === true ? (
                            <div>
                              <span style={styles.oldPriceModern}>${p.precio}</span>
                              <span style={styles.offerPriceModern}>${p.precioOferta}</span>
                            </div>
                          ) : (
                            <span style={styles.priceModern}>${p.precio}</span>
                          )}
                        </div>

                        <div style={styles.cardActionsWrapper}>
                          <button
                            type="button"
                            onClick={(e) => agregarCotizador(p, e)}
                            style={{
                              ...styles.addToQuoteBtn,
                              background: estaEnCotizador(p.id)
                                ? "linear-gradient(135deg, #10b981, #059669)"
                                : "linear-gradient(135deg, #6366f1, #4f46e5)",
                            }}
                          >
                            {estaEnCotizador(p.id) ? "✓ En cotizador" : "📋 Agregar al cotizador"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => agregarAlPedido(p, e)}
                            style={{
                              ...styles.addToOrderBtn,
                              background: estaEnPedido(p.id)
                                ? "linear-gradient(135deg, #10b981, #059669)"
                                : "linear-gradient(135deg, #f59e0b, #d97706)",
                              boxShadow: estaEnPedido(p.id)
                                ? "0 4px 15px rgba(16, 185, 129, 0.3)"
                                : "0 4px 15px rgba(245, 158, 11, 0.3)",
                            }}
                          >
                            <FaShoppingCart style={{ marginRight: "6px" }} />
                            {estaEnPedido(p.id) ? "✓ En pedido (agregar +1)" : "🛒 Agregar al Pedido"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalPaginas > 1 && (
                <div style={styles.paginationModern}>
                  <button type="button" disabled={paginaActual === 1} onClick={() => cambiarPagina(paginaActual - 1)} style={styles.pageBtnModern(paginaActual === 1, darkMode)}>‹</button>
                  {getPaginasMostradas().map((num, index) =>
                    num === "..." ? (
                      <span key={`e-${index}`} style={styles.pageEllipsis(darkMode)}>…</span>
                    ) : (
                      <button type="button" key={num} onClick={() => cambiarPagina(num)} style={styles.pageBtnModern(false, darkMode, num === paginaActual)}>{num}</button>
                    )
                  )}
                  <button type="button" disabled={paginaActual === totalPaginas} onClick={() => cambiarPagina(paginaActual + 1)} style={styles.pageBtnModern(paginaActual === totalPaginas, darkMode)}>›</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MÓVIL GRID */}
        {isMobile && (
          <>
            <div style={styles.resultsBar(darkMode)}>
              <span style={styles.resultsText(darkMode)}>
                <strong>{productosOrdenados.length}</strong> productos
              </span>
            </div>
            {productosPaginaActual.length === 0 ? (
              <div style={styles.emptyState(darkMode)}>
                <span style={styles.emptyIcon}>🔍</span>
                <h3 style={styles.emptyTitle(darkMode)}>Sin resultados</h3>
                <p style={styles.emptyText(darkMode)}>Prueba ajustando los filtros</p>
              </div>
            ) : (
              <div style={styles.gridModern(getGridColumns())}>
                {productosPaginaActual.map((p) => (
                  <div key={p.id} style={styles.cardModern(darkMode)}>
                    <div
                      style={styles.cardImageWrapper}
                      onClick={() => {
                        const desdeCotizador = localStorage.getItem("seleccionandoCotizador");
                        if (desdeCotizador === "true") { agregarCotizador(p); navigate("/cotizador"); return; }
                        navigate(`/producto/${p.id}`);
                      }}
                    >
                      <img src={obtenerImagen(p)} alt={p.nombre} style={styles.cardImage} />
                      {(p.oferta === 1 || p.oferta === true) && (
                        <span style={{ ...styles.offerBadge, fontSize: "9px", padding: "2px 6px" }}>OFERTA</span>
                      )}
                      <div style={{ position: "absolute", top: "6px", right: "6px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleFavorito(p); }}
                          style={{
                            ...styles.favBtnModern, width: "28px", height: "28px", fontSize: "12px",
                            background: esFavorito(p.id) ? "#ef4444" : "rgba(255,255,255,0.9)",
                            color: esFavorito(p.id) ? "#fff" : "#333",
                            position: "relative", top: "0", right: "0",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                          }}
                        >
                          {esFavorito(p.id) ? "❤️" : "🤍"}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => toggleComparador(p, e)}
                          style={{
                            ...styles.compareBtnModern, width: "28px", height: "28px", fontSize: "12px",
                            background: estaComparando(p.id) ? "#6366f1" : "rgba(255,255,255,0.9)",
                            color: estaComparando(p.id) ? "#fff" : "#333",
                            position: "relative", top: "0", right: "0",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                          }}
                        >
                          {estaComparando(p.id) ? "✓" : "⚖️"}
                        </button>
                      </div>
                    </div>
                    <div style={styles.cardContent}>
                      <h3 style={{ ...styles.cardTitle(darkMode), fontSize: "13px" }}>{resaltarTexto(p.nombre)}</h3>
                      <div style={styles.cardTags}>
                        {p.categoria && <span style={{ ...styles.cardTag, fontSize: "8px" }}>📂 {p.categoria.slice(0, 8)}</span>}
                        {p.tipo && <span style={{ ...styles.cardTag, fontSize: "8px" }}>🏷️ {p.tipo.slice(0, 8)}</span>}
                      </div>
                      <div style={styles.cardPrice}>
                        {p.oferta === 1 || p.oferta === true ? (
                          <div>
                            <span style={{ ...styles.oldPriceModern, fontSize: "11px" }}>${p.precio}</span>
                            <span style={{ ...styles.offerPriceModern, fontSize: "14px" }}>${p.precioOferta}</span>
                          </div>
                        ) : (
                          <span style={{ ...styles.priceModern, fontSize: "16px" }}>${p.precio}</span>
                        )}
                      </div>
                      <div style={styles.cardActionsWrapperMobile}>
                        <button
                          type="button"
                          onClick={(e) => agregarCotizador(p, e)}
                          style={{
                            ...styles.addToQuoteBtn, fontSize: "11px", padding: "7px 10px",
                            background: estaEnCotizador(p.id)
                              ? "linear-gradient(135deg, #10b981, #059669)"
                              : "linear-gradient(135deg, #6366f1, #4f46e5)",
                          }}
                        >
                          {estaEnCotizador(p.id) ? "✓ En cotizador" : "📋 Cotizar"}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => agregarAlPedido(p, e)}
                          style={{
                            ...styles.addToOrderBtn, fontSize: "11px", padding: "7px 10px", marginTop: "6px",
                            background: estaEnPedido(p.id)
                              ? "linear-gradient(135deg, #10b981, #059669)"
                              : "linear-gradient(135deg, #f59e0b, #d97706)",
                            boxShadow: estaEnPedido(p.id)
                              ? "0 4px 15px rgba(16, 185, 129, 0.3)"
                              : "0 4px 15px rgba(245, 158, 11, 0.3)",
                          }}
                        >
                          <FaShoppingCart style={{ marginRight: "4px", fontSize: "11px" }} />
                          {estaEnPedido(p.id) ? "✓ En pedido (+1)" : "🛒 Agregar"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {totalPaginas > 1 && (
              <div style={styles.paginationModern}>
                <button type="button" disabled={paginaActual === 1} onClick={() => cambiarPagina(paginaActual - 1)} style={styles.pageBtnModern(paginaActual === 1, darkMode)}>‹</button>
                {getPaginasMostradas().map((num, index) =>
                  num === "..." ? (
                    <span key={`e-${index}`} style={styles.pageEllipsis(darkMode)}>…</span>
                  ) : (
                    <button type="button" key={num} onClick={() => cambiarPagina(num)} style={styles.pageBtnModern(false, darkMode, num === paginaActual)}>{num}</button>
                  )
                )}
                <button type="button" disabled={paginaActual === totalPaginas} onClick={() => cambiarPagina(paginaActual + 1)} style={styles.pageBtnModern(paginaActual === totalPaginas, darkMode)}>›</button>
              </div>
            )}
          </>
        )}

        {/* COMPARADOR FLOTANTE */}
        {comparador.length > 0 && (
          <div style={styles.compareBarModern(darkMode, isMobile)}>
            <div style={styles.compareItemsModern(isMobile)}>
              {comparador.map((p) => (
                <div key={p.id} style={styles.compareItemWrapModern(darkMode, isMobile)}>
                  <img src={p.imagen} alt={p.nombre} style={styles.compareImageModern(isMobile)} />
                  {!isMobile && <span style={styles.compareName}>{p.nombre.slice(0, 12)}...</span>}
                  <button type="button" onClick={(e) => quitarDelComparador(p.id, e)} style={styles.compareRemoveBtn(isMobile)} title="Quitar del comparador">✕</button>
                </div>
              ))}
            </div>
            <button type="button" style={styles.compareActionModern(isMobile)} onClick={() => navigate("/comparar")}>
              {isMobile ? `⚖️ Comparar (${comparador.length})` : `Comparar (${comparador.length})`}
            </button>
          </div>
        )}
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
}

/* ============================================================
   🎨 ESTILOS
   ============================================================ */
const styles = {
  page: (dark) => ({
    background: dark ? "#0a0a0f" : "#f8fafc",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflowX: "hidden",
  }),

  container: (isMobile) => ({
    padding: isMobile ? "80px 10px 20px 10px" : "130px 25px 40px 25px",
    maxWidth: "1600px",
    margin: "0 auto",
    boxSizing: "border-box",
  }),

  notificacion: (tipo) => ({
    position: "fixed", top: "90px", right: "20px",
    background: tipo === "warning"
      ? "linear-gradient(135deg, #f59e0b, #d97706)"
      : "linear-gradient(135deg, #10b981, #059669)",
    color: "#fff", padding: "14px 22px", borderRadius: "12px",
    fontSize: "14px", fontWeight: 600,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    zIndex: 9999, animation: "slideInRight 0.4s ease",
    maxWidth: "90%", display: "flex", alignItems: "center", gap: 8,
  }),

  headerModern: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: "25px", flexWrap: "wrap", gap: "15px",
  },
  titleModern: (dark) => ({
    fontSize: "38px", fontWeight: 800, color: dark ? "#fff" : "#0f172a",
    margin: "0 0 4px 0", letterSpacing: "-0.5px",
  }),
  subtitleModern: (dark) => ({
    fontSize: "19px", color: dark ? "#94a3b8" : "#64748b", margin: 0,
  }),
  pedidoIndicator: {
    background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(79,70,229,0.08))",
    color: "#a5b4fc", padding: "8px 16px", borderRadius: "10px",
    fontSize: "14px", fontWeight: 500, display: "inline-flex",
    alignItems: "center", marginTop: "6px",
    border: "1px solid rgba(99,102,241,0.2)",
  },
  headerStats: { display: "flex", gap: "12px", alignItems: "center" },
  statBadge: (dark) => ({
    background: dark ? "#1e293b" : "#fff",
    padding: "12px 22px", borderRadius: "12px",
    display: "flex", alignItems: "center", gap: "12px",
    boxShadow: dark ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.05)",
    border: dark ? "1px solid #2d2d3f" : "1px solid #f1f5f9",
  }),
  statNumber: { fontSize: "28px", fontWeight: 800, color: "#6366f1" },
  statLabel: { fontSize: "16px", color: "#94a3b8", fontWeight: 500 },

  desktopLayout: { display: "flex", gap: "24px", alignItems: "flex-start" },
  filtrosPanel: (dark) => ({
    width: "380px", minWidth: "380px",
    background: dark ? "#14141e" : "#fff",
    borderRadius: "18px",
    padding: "18px 16px",
    boxShadow: dark ? "0 10px 40px rgba(0,0,0,0.4)" : "0 10px 40px rgba(0,0,0,0.06)",
    border: dark ? "1px solid #2d2d3f" : "1px solid #eef2f7",
    position: "sticky", top: "100px",
    maxHeight: "calc(100vh - 120px)",
    display: "flex", flexDirection: "column",
  }),
  panelHeader: (dark) => ({
    display: "flex", alignItems: "center", justifyContent: "space-between",
    paddingBottom: "14px", marginBottom: "10px",
    borderBottom: dark ? "1px solid #2d2d3f" : "1px solid #eef2f7",
    flexShrink: 0,
  }),
  panelHeaderLeft: { display: "flex", alignItems: "center", gap: "12px" },
  panelIcon: { fontSize: "24px" },
  panelTitle: (dark) => ({
    fontSize: "20px", fontWeight: 800,
    color: dark ? "#fff" : "#0f172a", margin: 0,
  }),
  panelSubtitle: (dark) => ({
    fontSize: "12px", color: dark ? "#94a3b8" : "#64748b",
    fontWeight: 500,
  }),
  filterCountBadge: {
    background: "#6366f1", color: "#fff", fontSize: "12px", fontWeight: 700,
    padding: "4px 10px", borderRadius: "12px", minWidth: "24px", textAlign: "center",
  },
  panelScroll: {
    overflowY: "auto", flex: 1, paddingRight: "4px", marginRight: "-4px",
  },

  appliedHeader: (dark) => ({
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 14px",
    background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(79,70,229,0.06))",
    borderRadius: "12px",
    marginBottom: "10px",
    border: dark ? "1px solid rgba(99,102,241,0.35)" : "1px solid rgba(99,102,241,0.25)",
  }),
  appliedHeaderLeft: { display: "flex", alignItems: "center", gap: "10px" },
  appliedHeaderIcon: { fontSize: "20px" },
  appliedHeaderTitle: (dark) => ({
    display: "block", fontSize: "13px", fontWeight: 800,
    color: "#6366f1",
  }),
  appliedHeaderSub: (dark) => ({
    display: "block", fontSize: "11px", fontWeight: 600,
    color: dark ? "#94a3b8" : "#64748b",
  }),
  appliedClearBtn: {
    background: "transparent", border: "none",
    color: "#6366f1", cursor: "pointer",
    fontSize: "12px", fontWeight: 800,
    padding: "4px 8px", borderRadius: "6px",
  },

  seccionCard: (dark, abierta) => ({
    background: dark ? "#1a1a26" : "#fafbfc",
    borderRadius: "12px",
    marginBottom: "8px",
    border: dark
      ? `1px solid ${abierta ? "#3d3d5f" : "#252535"}`
      : `1px solid ${abierta ? "#e0e7ff" : "#eef2f7"}`,
    overflow: "hidden",
    transition: "all 0.2s ease",
  }),
  seccionHeader: {
    width: "100%", display: "flex", alignItems: "center", gap: "12px",
    padding: "12px 14px", background: "transparent",
    border: "none", cursor: "pointer", textAlign: "left",
  },
  seccionIconWrap: (dark, abierta) => ({
    width: "36px", height: "36px", borderRadius: "10px",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "18px",
    background: abierta
      ? "linear-gradient(135deg, #6366f1, #4f46e5)"
      : dark ? "#252535" : "#fff",
    color: abierta ? "#fff" : (dark ? "#94a3b8" : "#64748b"),
    boxShadow: abierta ? "0 4px 12px rgba(99,102,241,0.3)" : "none",
    flexShrink: 0,
    transition: "all 0.2s ease",
  }),
  seccionTitles: { flex: 1, display: "flex", flexDirection: "column", gap: "1px" },
  seccionTitulo: (dark) => ({
    fontSize: "14px", fontWeight: 700,
    color: dark ? "#fff" : "#0f172a",
  }),
  seccionSubtitulo: (dark) => ({
    fontSize: "11px", color: dark ? "#94a3b8" : "#94a3b8", fontWeight: 500,
  }),
  seccionBadge: {
    background: "#6366f1", color: "#fff", fontSize: "11px",
    fontWeight: 700, padding: "2px 8px", borderRadius: "10px", minWidth: "20px",
    textAlign: "center",
  },
  seccionArrow: (dark) => ({
    fontSize: "14px", color: dark ? "#94a3b8" : "#94a3b8",
    transition: "transform 0.2s ease",
  }),
  seccionContenido: {
    padding: "4px 14px 14px 14px",
    animation: "fadeIn 0.2s ease",
  },

  filtroCampo: { marginBottom: "12px" },
  filtroLabel: (dark, activo) => ({
    display: "flex", alignItems: "center", justifyContent: "space-between",
    fontSize: "12px", fontWeight: 700,
    color: activo ? "#6366f1" : (dark ? "#cbd5e1" : "#475569"),
    marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.4px",
  }),
  filtroLabelDot: {
    width: "6px", height: "6px", borderRadius: "50%",
    background: "#6366f1",
  },

  sugerenciasWrap: (dark) => ({
    background: dark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.06)",
    borderRadius: "10px",
    padding: "10px 12px",
    marginBottom: "12px",
    border: dark ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(245,158,11,0.2)",
  }),
  sugerenciasLabel: (dark) => ({
    display: "block", fontSize: "11px", fontWeight: 700,
    color: "#d97706", textTransform: "uppercase",
    letterSpacing: "0.4px", marginBottom: "8px",
  }),
  sugerenciasChips: { display: "flex", flexWrap: "wrap", gap: "6px" },
  sugerenciaChip: (dark) => ({
    display: "inline-flex", alignItems: "center", gap: "6px",
    padding: "6px 10px",
    background: dark ? "#1e293b" : "#fff",
    border: dark ? "1px solid #2d2d3f" : "1px solid #e2e8f0",
    color: dark ? "#e2e8f0" : "#334155",
    fontSize: "12px", fontWeight: 600,
    borderRadius: "8px", cursor: "pointer",
    transition: "all 0.15s ease",
  }),
  sugerenciaCount: {
    background: "#f59e0b", color: "#fff",
    fontSize: "10px", fontWeight: 800,
    padding: "1px 6px", borderRadius: "8px",
    minWidth: "18px", textAlign: "center",
  },

  searchWrap: {
    position: "relative", display: "flex", alignItems: "center", flex: 1,
    width: "100%",
  },
  searchIcon: {
    position: "absolute", left: "12px", fontSize: "14px",
    pointerEvents: "none", opacity: 0.6,
  },
  searchInput: (dark) => ({
    width: "100%",
    padding: "11px 36px 11px 38px",
    borderRadius: "10px",
    border: dark ? "1.5px solid #2d2d3f" : "1.5px solid #e2e8f0",
    background: dark ? "#0f0f18" : "#fff",
    color: dark ? "#fff" : "#0f172a",
    fontSize: "14px", outline: "none",
    boxSizing: "border-box",
    transition: "border 0.15s",
  }),
  searchClear: (dark) => ({
    position: "absolute", right: "8px",
    background: dark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)",
    border: "none", color: "#6366f1",
    cursor: "pointer", fontSize: "12px",
    padding: "4px 8px", borderRadius: "6px",
    fontWeight: 700,
  }),

  selectWrap: { position: "relative", display: "flex", alignItems: "center" },
  selectIconLeft: {
    position: "absolute", left: "12px", fontSize: "14px",
    pointerEvents: "none", opacity: 0.7,
  },
  selectStyled: (dark, activo) => ({
    width: "100%",
    padding: "11px 36px 11px 38px",
    borderRadius: "10px",
    border: activo ? "1.5px solid #6366f1" : (dark ? "1.5px solid #2d2d3f" : "1.5px solid #e2e8f0"),
    background: dark ? "#0f0f18" : "#fff",
    color: dark ? "#fff" : "#0f172a",
    fontWeight: activo ? 700 : 500,
    fontSize: "14px", outline: "none", cursor: "pointer",
    boxSizing: "border-box", appearance: "none",
    WebkitAppearance: "none", MozAppearance: "none",
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236366f1' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "right 12px center",
    backgroundSize: "12px",
  }),
  selectClearBtn: (dark) => ({
    position: "absolute", right: "32px",
    background: dark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.1)",
    border: "none", color: "#6366f1",
    cursor: "pointer", fontSize: "11px", fontWeight: 700,
    padding: "3px 7px", borderRadius: "6px", zIndex: 2,
  }),

  chipsWrap: {
    display: "flex", flexWrap: "wrap", gap: "6px",
  },
  chipBtn: (dark, activo) => ({
    display: "inline-flex", alignItems: "center", gap: "4px",
    padding: "6px 11px", borderRadius: "8px",
    fontSize: "12px", fontWeight: activo ? 700 : 500,
    background: activo
      ? "linear-gradient(135deg, #6366f1, #4f46e5)"
      : dark ? "#0f0f18" : "#fff",
    color: activo ? "#fff" : (dark ? "#cbd5e1" : "#475569"),
    border: activo
      ? "1px solid transparent"
      : `1px solid ${dark ? "#2d2d3f" : "#e2e8f0"}`,
    cursor: "pointer",
    transition: "all 0.15s ease",
  }),
  chipCheck: {
    fontSize: "10px", fontWeight: 900,
  },
  chipCountBadge: {
    background: "#6366f1", color: "#fff",
    fontSize: "10px", fontWeight: 700,
    padding: "1px 6px", borderRadius: "8px",
    marginLeft: "4px",
  },

  toggleList: { display: "flex", flexDirection: "column", gap: "6px" },
  toggleCard: (dark, activo) => ({
    display: "flex", alignItems: "center", gap: "10px",
    padding: "10px 12px", borderRadius: "10px",
    border: activo
      ? "1.5px solid #6366f1"
      : `1.5px solid ${dark ? "#2d2d3f" : "#eef2f7"}`,
    background: activo
      ? (dark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.06)")
      : (dark ? "#0f0f18" : "#fff"),
    cursor: "pointer", width: "100%", textAlign: "left",
    transition: "all 0.15s ease",
  }),
  toggleCardIcon: { fontSize: "16px" },
  toggleCardText: (dark, activo) => ({
    flex: 1, fontSize: "13px", fontWeight: 600,
    color: activo ? "#6366f1" : (dark ? "#cbd5e1" : "#334155"),
  }),
  toggleSwitchTrack: (activo) => ({
    width: "32px", height: "18px", borderRadius: "10px",
    background: activo ? "#6366f1" : "#cbd5e1",
    position: "relative", flexShrink: 0,
    transition: "background 0.2s ease",
  }),
  toggleSwitchThumb: (activo) => ({
    position: "absolute", top: "2px", left: activo ? "16px" : "2px",
    width: "14px", height: "14px", borderRadius: "50%",
    background: "#fff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
    transition: "left 0.2s ease",
  }),

  precioRow: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" },
  precioInputWrap: (dark) => ({
    flex: 1, display: "flex", alignItems: "center",
    padding: "0 12px", borderRadius: "10px",
    border: dark ? "1.5px solid #2d2d3f" : "1.5px solid #e2e8f0",
    background: dark ? "#0f0f18" : "#fff",
    transition: "border 0.15s",
  }),
  precioPrefix: { fontSize: "14px", color: "#94a3b8", fontWeight: 700, marginRight: "4px" },
  precioInputField: (dark) => ({
    flex: 1, padding: "11px 0", border: "none", outline: "none",
    background: "transparent", color: dark ? "#fff" : "#0f172a",
    fontSize: "14px", width: "100%",
  }),
  precioSeparator: { color: "#94a3b8", fontWeight: 700, fontSize: "14px" },
  precioQuickRow: { display: "flex", flexWrap: "wrap", gap: "6px" },
  precioQuickBtn: (dark, activo) => ({
    padding: "6px 11px", borderRadius: "8px",
    border: activo ? "1.5px solid #6366f1" : `1px solid ${dark ? "#2d2d3f" : "#eef2f7"}`,
    background: activo ? "rgba(99,102,241,0.1)" : "transparent",
    color: activo ? "#6366f1" : (dark ? "#cbd5e1" : "#475569"),
    fontSize: "12px", fontWeight: 600, cursor: "pointer",
    transition: "all 0.15s ease",
  }),

  btnResetFilters: (dark) => ({
    width: "100%", padding: "12px",
    borderRadius: "10px", border: "none",
    background: dark ? "#2d2d3f" : "#fef2f2",
    color: dark ? "#e2e8f0" : "#b91c1c",
    fontWeight: 700, fontSize: "13px", cursor: "pointer",
    marginTop: "10px",
    transition: "all 0.15s ease",
  }),

  chipsActivosWrap: (dark) => ({
    background: dark ? "#14141e" : "#fff",
    borderRadius: "14px",
    padding: "12px 14px",
    marginBottom: "16px",
    border: dark ? "1px solid #2d2d3f" : "1px solid #eef2f7",
    boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.2)" : "0 4px 20px rgba(0,0,0,0.03)",
  }),
  chipsHeader: {
    display: "flex", alignItems: "center", gap: "8px",
    marginBottom: "10px",
  },
  chipsHeaderIcon: { fontSize: "16px" },
  chipsHeaderText: (dark) => ({
    flex: 1, fontSize: "13px", fontWeight: 700,
    color: dark ? "#e2e8f0" : "#334155",
  }),
  chipsLimpiarBtn: {
    background: "transparent", border: "none",
    color: "#ef4444", cursor: "pointer",
    fontSize: "12px", fontWeight: 700,
    padding: "4px 8px", borderRadius: "6px",
  },
  chipsRow: { display: "flex", flexWrap: "wrap", gap: "6px" },
  chipActivo: (dark) => ({
    display: "inline-flex", alignItems: "center", gap: "6px",
    background: dark ? "#1e293b" : "#f1f5f9",
    color: dark ? "#e2e8f0" : "#334155",
    padding: "6px 10px 6px 12px", borderRadius: "20px",
    fontSize: "12px", fontWeight: 600,
    border: dark ? "1px solid #2d2d3f" : "1px solid #e2e8f0",
  }),
  chipRemove: {
    background: "transparent", border: "none",
    color: "#94a3b8", cursor: "pointer",
    fontSize: "12px", padding: "0 2px",
    fontWeight: 700,
  },

  productosGridContainer: { flex: 1, minWidth: 0 },
  resultsBar: (dark) => ({
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginBottom: "16px", padding: "12px 18px",
    background: dark ? "#14141e" : "#fff",
    borderRadius: "12px",
    border: dark ? "1px solid #2d2d3f" : "1px solid #eef2f7",
  }),
  resultsText: (dark) => ({ fontSize: "15px", color: dark ? "#94a3b8" : "#64748b" }),
  resultsBadge: (dark) => ({
    fontSize: "13px", color: dark ? "#94a3b8" : "#64748b",
    background: dark ? "#0a0a0f" : "#f8fafc",
    padding: "5px 14px", borderRadius: "20px",
    fontWeight: 600,
  }),

  emptyState: (dark) => ({
    background: dark ? "#14141e" : "#fff",
    borderRadius: "16px",
    padding: "60px 20px",
    textAlign: "center",
    border: dark ? "1px solid #2d2d3f" : "1px solid #eef2f7",
  }),
  emptyIcon: { fontSize: "56px", display: "block", marginBottom: "16px" },
  emptyTitle: (dark) => ({
    fontSize: "22px", fontWeight: 800,
    color: dark ? "#fff" : "#0f172a",
    margin: "0 0 8px 0",
  }),
  emptyText: (dark) => ({
    fontSize: "14px", color: dark ? "#94a3b8" : "#64748b",
    margin: "0 0 20px 0",
  }),
  emptyBtn: {
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    color: "#fff", border: "none",
    padding: "12px 24px", borderRadius: "10px",
    fontSize: "14px", fontWeight: 700, cursor: "pointer",
    boxShadow: "0 4px 15px rgba(99,102,241,0.35)",
  },

  gridModern: (columns) => ({
    display: "grid", gridTemplateColumns: columns, gap: "20px",
  }),
  cardModern: (dark) => ({
    background: dark ? "#14141e" : "#fff",
    borderRadius: "16px", overflow: "hidden",
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
    boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.04)",
    border: dark ? "1px solid #2d2d3f" : "1px solid #eef2f7",
  }),
  cardImageWrapper: {
    position: "relative", width: "100%", height: "180px",
    overflow: "hidden", background: "#f1f5f9", cursor: "pointer",
  },
  cardImage: { width: "100%", height: "100%", objectFit: "cover" },
  offerBadge: {
    position: "absolute", top: "10px", left: "10px",
    background: "#ef4444", color: "#fff", fontSize: "11px",
    fontWeight: 700, padding: "4px 12px", borderRadius: "20px",
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  featuredBadge: {
    position: "absolute", top: "42px", left: "10px",
    background: "#f59e0b", color: "#fff", fontSize: "11px",
    fontWeight: 700, padding: "4px 12px", borderRadius: "20px",
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  newBadge: {
    position: "absolute", top: "74px", left: "10px",
    background: "#10b981", color: "#fff", fontSize: "11px",
    fontWeight: 700, padding: "4px 12px", borderRadius: "20px",
    textTransform: "uppercase", letterSpacing: "0.5px",
  },
  favBtnModern: {
    position: "absolute", top: "10px", right: "10px",
    width: "36px", height: "36px", borderRadius: "50%",
    border: "none", cursor: "pointer", fontSize: "16px",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    backdropFilter: "blur(4px)",
  },
  compareBtnModern: {
    position: "absolute", top: "52px", right: "10px",
    width: "36px", height: "36px", borderRadius: "50%",
    border: "none", cursor: "pointer", fontSize: "16px",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    backdropFilter: "blur(4px)",
  },
  cardContent: { padding: "16px 18px 18px" },
  cardTitle: (dark) => ({
    fontSize: "16px", fontWeight: 700, margin: "0 0 6px 0",
    color: dark ? "#fff" : "#0f172a",
    display: "-webkit-box", WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: "1.3",
  }),
  cardDesc: (dark) => ({
    fontSize: "13px", color: dark ? "#94a3b8" : "#64748b",
    margin: "0 0 10px 0", display: "-webkit-box",
    WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
    overflow: "hidden", lineHeight: "1.4",
  }),
  cardTags: { display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" },
  cardTag: {
    background: "#f1f5f9", color: "#64748b",
    padding: "3px 10px", borderRadius: "12px",
    fontSize: "11px", fontWeight: 600,
  },
  cardPrice: { display: "flex", alignItems: "center", gap: "10px" },
  priceModern: { fontSize: "22px", fontWeight: 800, color: "#6366f1" },
  oldPriceModern: { textDecoration: "line-through", color: "#94a3b8", fontSize: "14px" },
  offerPriceModern: { fontSize: "22px", fontWeight: 800, color: "#ef4444" },
  highlight: () => ({
    background: "#6366f1", color: "#fff",
    padding: "2px 6px", borderRadius: "4px", fontWeight: 700,
  }),

  cardActionsWrapper: { display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" },
  cardActionsWrapperMobile: { display: "flex", flexDirection: "column", gap: "4px", marginTop: "8px" },
  addToQuoteBtn: {
    width: "100%", padding: "10px 14px", color: "#fff",
    border: "none", borderRadius: "10px",
    fontSize: "13px", fontWeight: 700, cursor: "pointer",
    boxShadow: "0 4px 15px rgba(99,102,241,0.3)",
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: "6px",
  },
  addToOrderBtn: {
    width: "100%", padding: "10px 14px", color: "#fff",
    border: "none", borderRadius: "10px",
    fontSize: "13px", fontWeight: 700, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
  },

  paginationModern: {
    display: "flex", justifyContent: "center", alignItems: "center",
    gap: "8px", marginTop: "30px", marginBottom: "10px",
  },
  pageBtnModern: (disabled, dark, active) => ({
    padding: "10px 18px", borderRadius: "10px", border: "none",
    fontWeight: 600, fontSize: "15px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    background: active ? "#6366f1" : (dark ? "#1e293b" : "#fff"),
    color: active ? "#fff" : (dark ? "#e2e8f0" : "#334155"),
    boxShadow: dark ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.04)",
  }),
  pageEllipsis: (dark) => ({
    color: "#94a3b8", fontSize: "18px", fontWeight: 600, padding: "0 4px",
  }),

  mobileFilters: (dark) => ({
    background: dark ? "#14141e" : "#fff",
    borderRadius: "14px", padding: "14px", marginBottom: "15px",
    border: dark ? "1px solid #2d2d3f" : "1px solid #eef2f7",
    boxShadow: dark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.04)",
  }),
  mobileSearchRow: { display: "flex", gap: "10px", alignItems: "center" },
  mobileFilterBtn: (dark, activo) => ({
    padding: "12px 16px", borderRadius: "10px", border: "none",
    fontWeight: 700, fontSize: "15px", cursor: "pointer",
    background: activo ? "#6366f1" : (dark ? "#2d2d3f" : "#f1f5f9"),
    color: activo ? "#fff" : (dark ? "#e2e8f0" : "#334155"),
    whiteSpace: "nowrap",
  }),
  mobileFiltersContent: (dark) => ({
    marginTop: "14px", paddingTop: "14px",
    borderTop: dark ? "1px solid #2d2d3f" : "1px solid #eef2f7",
  }),
  mobileApplyBtn: {
    width: "100%", padding: "16px", marginTop: "20px",
    background: "linear-gradient(135deg, #6366f1, #4f46e5)",
    color: "#fff", border: "none", borderRadius: "12px",
    fontSize: "15px", fontWeight: 700, cursor: "pointer",
    boxShadow: "0 4px 20px rgba(99,102,241,0.4)",
  },

  compareBarModern: (dark, isMobile) => ({
    position: "fixed", bottom: isMobile ? "10px" : "20px",
    left: "50%", transform: "translateX(-50%)",
    background: dark ? "#14141e" : "#fff",
    padding: isMobile ? "10px 14px" : "14px 24px",
    borderRadius: "16px", display: "flex", alignItems: "center",
    justifyContent: "space-between", gap: isMobile ? "12px" : "24px",
    width: isMobile ? "calc(100% - 20px)" : "auto", maxWidth: "95%",
    zIndex: 999, boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
    border: dark ? "1px solid #2d2d3f" : "1px solid #eef2f7",
  }),
  compareItemsModern: (isMobile) => ({
    display: "flex", gap: isMobile ? "8px" : "12px",
    overflowX: "auto", flex: 1, padding: "4px 0",
  }),
  compareItemWrapModern: (dark, isMobile) => ({
    display: "flex", alignItems: "center", gap: "6px",
    padding: "4px 6px 4px 4px", borderRadius: "12px",
    background: dark ? "#1e293b" : "#f8fafc",
    border: dark ? "1px solid #2d2d3f" : "1px solid #e2e8f0",
    flexShrink: 0, position: "relative",
  }),
  compareImageModern: (isMobile) => ({
    width: isMobile ? "34px" : "44px",
    height: isMobile ? "34px" : "44px",
    objectFit: "cover", borderRadius: "8px", flexShrink: 0,
  }),
  compareName: {
    fontSize: "13px", fontWeight: 600, maxWidth: "90px",
    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
  },
  compareRemoveBtn: (isMobile) => ({
    background: "linear-gradient(135deg, #ef4444, #dc2626)",
    color: "#fff", border: "none", borderRadius: "50%",
    width: isMobile ? "20px" : "22px",
    height: isMobile ? "20px" : "22px",
    fontSize: isMobile ? "10px" : "11px",
    fontWeight: 900, cursor: "pointer",
    display: "flex", alignItems: "center", justifyContent: "center",
    lineHeight: 1,
    boxShadow: "0 2px 6px rgba(239,68,68,0.4)",
  }),
  compareActionModern: (isMobile) => ({
    background: "#6366f1", color: "#fff", border: "none",
    padding: isMobile ? "10px 16px" : "12px 24px",
    borderRadius: "10px", cursor: "pointer",
    fontWeight: 700, fontSize: isMobile ? "14px" : "15px",
    whiteSpace: "nowrap", flexShrink: 0,
    boxShadow: "0 4px 15px rgba(99,102,241,0.35)",
  }),
};