import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";
import { FaShoppingCart } from "react-icons/fa";

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Detectar si viene desde la página de Pedido
  const desdePedido = location.state?.desdePedido || false;

  // 🌙 DARKMODE
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

  // 🔍 FILTROS - CON PERSISTENCIA EN localStorage
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

  // Estados para filtros de tipo checkbox (arrays de valores seleccionados)
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState(() => 
    getFiltroArray("categorias_seleccionadas", [])
  );
  const [subcategoriasSeleccionadas, setSubcategoriasSeleccionadas] = useState(() => 
    getFiltroArray("subcategorias_seleccionadas", [])
  );
  const [tiposSeleccionados, setTiposSeleccionados] = useState(() => 
    getFiltroArray("tipos_seleccionados", [])
  );
  const [usosSeleccionados, setUsosSeleccionados] = useState(() => 
    getFiltroArray("usos_seleccionados", [])
  );
  const [aplicacionesSeleccionadas, setAplicacionesSeleccionadas] = useState(() => 
    getFiltroArray("aplicaciones_seleccionadas", [])
  );
  const [tiposDisenoSeleccionados, setTiposDisenoSeleccionados] = useState(() => 
    getFiltroArray("tipos_diseno_seleccionados", [])
  );
  const [materialesSeleccionados, setMaterialesSeleccionados] = useState(() => 
    getFiltroArray("materiales_seleccionados", [])
  );
  const [acabadosSeleccionados, setAcabadosSeleccionados] = useState(() => 
    getFiltroArray("acabados_seleccionados", [])
  );
  const [tiposInstalacionSeleccionados, setTiposInstalacionSeleccionados] = useState(() => 
    getFiltroArray("tipos_instalacion_seleccionados", [])
  );
  const [tiposVentaSeleccionados, setTiposVentaSeleccionados] = useState(() => 
    getFiltroArray("tipos_venta_seleccionados", [])
  );

  // NUEVOS FILTROS - RANGOS COMO CHECKBOXES
  const [anchosSeleccionados, setAnchosSeleccionados] = useState(() => 
    getFiltroArray("anchos_seleccionados", [])
  );
  const [altosSeleccionados, setAltosSeleccionados] = useState(() => 
    getFiltroArray("altos_seleccionados", [])
  );
  const [gruesosSeleccionados, setGruesosSeleccionados] = useState(() => 
    getFiltroArray("gruesos_seleccionados", [])
  );
  const [coberturasSeleccionadas, setCoberturasSeleccionadas] = useState(() => 
    getFiltroArray("coberturas_seleccionadas", [])
  );
  const [piezasSeleccionadas, setPiezasSeleccionadas] = useState(() => 
    getFiltroArray("piezas_seleccionadas", [])
  );
  const [espesoresSeleccionados, setEspesoresSeleccionados] = useState(() => 
    getFiltroArray("espesores_seleccionados", [])
  );

  // Filtros booleanos simples
  const [busqueda, setBusqueda] = useState(() => getFiltro("busqueda", ""));
  const [orden, setOrden] = useState(() => getFiltro("orden", ""));
  const [soloOfertas, setSoloOfertas] = useState(() => getFiltroBooleano("ofertas", false));
  const [soloDestacados, setSoloDestacados] = useState(() => getFiltroBooleano("destacados", false));

  // Opciones predefinidas para rangos
  const opcionesAncho = ["50cm", "100cm", "150cm", "200cm", "300cm", "500cm", "800cm", "1m", "1.5m", "2m"];
  const opcionesAlto = ["50cm", "100cm", "150cm", "200cm", "300cm", "500cm", "800cm", "1m", "1.5m", "2m"];
  const opcionesGrueso = ["2mm", "3mm", "5mm", "8mm", "10mm", "15mm", "20mm", "30mm", "50mm"];
  const opcionesCobertura = ["0.5m²", "1m²", "2m²", "3m²", "5m²", "8m²", "10m²", "15m²", "20m²", "30m²", "50m²"];
  const opcionesPiezasCaja = ["4", "6", "8", "10", "12", "16", "20", "24", "30", "36", "40", "48", "50", "60", "72", "80", "96", "100"];
  const opcionesEspesorDesgaste = ["0.3mm", "0.5mm", "0.7mm", "1.0mm", "1.5mm", "2.0mm", "2.5mm", "3.0mm", "4.0mm", "5.0mm"];

  const opcionesTipoVentaCompleto = ["Caja", "Rollo", "Tramo", "Pieza", "Unidad", "Otros"];

  // 🔽 DROPDOWNS
  const [openFiltrosExtra, setOpenFiltrosExtra] = useState(false);

  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [tipos, setTipos] = useState([]);

  // 📱 DETECTOR RESPONSIVO
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
    if (windowWidth >= 1280 && windowWidth < 1536) return "repeat(4, 1fr)";
    return "repeat(4, 1fr)";
  };

  // 📄 PAGINACIÓN
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

  // 💾 FUNCIONES PARA GUARDAR FILTROS
  const guardarFiltro = (key, value) => {
    localStorage.setItem(`filtro_${key}`, value);
  };

  const guardarFiltroArray = (key, value) => {
    localStorage.setItem(`filtro_${key}`, JSON.stringify(value));
  };

  const toggleSeleccion = (setter, key, value) => {
    setter(prev => {
      const nuevos = prev.includes(value) 
        ? prev.filter(v => v !== value)
        : [...prev, value];
      guardarFiltroArray(key, nuevos);
      return nuevos;
    });
  };

  const eliminarFiltro = (tipo, valor) => {
    const handlers = {
      'categoria': { setter: setCategoriasSeleccionadas, key: "categorias_seleccionadas" },
      'subcategoria': { setter: setSubcategoriasSeleccionadas, key: "subcategorias_seleccionadas" },
      'tipo': { setter: setTiposSeleccionados, key: "tipos_seleccionados" },
      'uso': { setter: setUsosSeleccionados, key: "usos_seleccionados" },
      'aplicacion': { setter: setAplicacionesSeleccionadas, key: "aplicaciones_seleccionadas" },
      'tipo_diseno': { setter: setTiposDisenoSeleccionados, key: "tipos_diseno_seleccionados" },
      'material': { setter: setMaterialesSeleccionados, key: "materiales_seleccionados" },
      'acabado': { setter: setAcabadosSeleccionados, key: "acabados_seleccionados" },
      'tipo_instalacion': { setter: setTiposInstalacionSeleccionados, key: "tipos_instalacion_seleccionados" },
      'tipo_venta': { setter: setTiposVentaSeleccionados, key: "tipos_venta_seleccionados" },
      'ancho': { setter: setAnchosSeleccionados, key: "anchos_seleccionados" },
      'alto': { setter: setAltosSeleccionados, key: "altos_seleccionados" },
      'grueso': { setter: setGruesosSeleccionados, key: "gruesos_seleccionados" },
      'cobertura': { setter: setCoberturasSeleccionadas, key: "coberturas_seleccionadas" },
      'piezas': { setter: setPiezasSeleccionadas, key: "piezas_seleccionadas" },
      'espesor': { setter: setEspesoresSeleccionados, key: "espesores_seleccionados" },
    };

    const handler = handlers[tipo];
    if (handler) {
      handler.setter(prev => {
        const nuevos = prev.filter(v => v !== valor);
        guardarFiltroArray(handler.key, nuevos);
        return nuevos;
      });
    }
  };

  const limpiarTodosLosFiltros = () => {
    const filtrosArrays = [
      "categorias_seleccionadas", "subcategorias_seleccionadas", "tipos_seleccionados",
      "usos_seleccionados", "aplicaciones_seleccionadas", "tipos_diseno_seleccionados",
      "materiales_seleccionados", "acabados_seleccionados", "tipos_instalacion_seleccionados",
      "tipos_venta_seleccionados", "anchos_seleccionados", "altos_seleccionados",
      "gruesos_seleccionados", "coberturas_seleccionadas", "piezas_seleccionadas",
      "espesores_seleccionados"
    ];
    filtrosArrays.forEach(key => localStorage.removeItem(`filtro_${key}`));
    
    const filtrosSimples = [
      "busqueda", "orden", "ofertas", "destacados"
    ];
    filtrosSimples.forEach(key => localStorage.removeItem(`filtro_${key}`));
    localStorage.removeItem("pagina_actual");

    setCategoriasSeleccionadas([]);
    setSubcategoriasSeleccionadas([]);
    setTiposSeleccionados([]);
    setUsosSeleccionados([]);
    setAplicacionesSeleccionadas([]);
    setTiposDisenoSeleccionados([]);
    setMaterialesSeleccionados([]);
    setAcabadosSeleccionados([]);
    setTiposInstalacionSeleccionados([]);
    setTiposVentaSeleccionados([]);
    setAnchosSeleccionados([]);
    setAltosSeleccionados([]);
    setGruesosSeleccionados([]);
    setCoberturasSeleccionadas([]);
    setPiezasSeleccionadas([]);
    setEspesoresSeleccionados([]);
    setBusqueda("");
    setOrden("");
    setSoloOfertas(false);
    setSoloDestacados(false);
    setPaginaActual(1);
  };

  useEffect(() => {
    setPaginaActual(1);
  }, [
    busqueda, soloOfertas, soloDestacados, orden,
    categoriasSeleccionadas, subcategoriasSeleccionadas, tiposSeleccionados,
    usosSeleccionados, aplicacionesSeleccionadas, tiposDisenoSeleccionados,
    materialesSeleccionados, acabadosSeleccionados, tiposInstalacionSeleccionados,
    tiposVentaSeleccionados, anchosSeleccionados, altosSeleccionados,
    gruesosSeleccionados, coberturasSeleccionadas, piezasSeleccionadas,
    espesoresSeleccionados
  ]);

  // 🔥 CARGAR DATA
  useEffect(() => {
    api.get("/productos").then((res) => setProductos(res.data)).catch((err) => console.log(err));
    api.get("/categorias").then((res) => setCategorias(res.data)).catch((err) => console.log(err));
    api.get("/subcategorias").then((res) => setSubcategorias(res.data)).catch((err) => console.log(err));
    api.get("/tipos").then((res) => setTipos(res.data)).catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  const [searchParams] = useSearchParams();

  // 🔄 LIMPIAR FILTROS SOLO CUANDO SE CARGA CON ?all=true (SOLO UNA VEZ)
  const [filtrosInicializados, setFiltrosInicializados] = useState(false);

  useEffect(() => {
    const all = searchParams.get("all");
    
    if (!filtrosInicializados) {
      if (all === "true") {
        limpiarTodosLosFiltros();
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);
      }
      setFiltrosInicializados(true);
    }
  }, [searchParams, filtrosInicializados]);

  useEffect(() => {
    const buscar = searchParams.get("buscar");
    if (buscar) {
      setBusqueda(buscar);
      guardarFiltro("busqueda", buscar);
    }
  }, [searchParams]);

  useEffect(() => {
    guardarFiltroArray("categorias_seleccionadas", categoriasSeleccionadas);
    guardarFiltroArray("subcategorias_seleccionadas", subcategoriasSeleccionadas);
    guardarFiltroArray("tipos_seleccionados", tiposSeleccionados);
    guardarFiltroArray("usos_seleccionados", usosSeleccionados);
    guardarFiltroArray("aplicaciones_seleccionadas", aplicacionesSeleccionadas);
    guardarFiltroArray("tipos_diseno_seleccionados", tiposDisenoSeleccionados);
    guardarFiltroArray("materiales_seleccionados", materialesSeleccionados);
    guardarFiltroArray("acabados_seleccionados", acabadosSeleccionados);
    guardarFiltroArray("tipos_instalacion_seleccionados", tiposInstalacionSeleccionados);
    guardarFiltroArray("tipos_venta_seleccionados", tiposVentaSeleccionados);
    guardarFiltroArray("anchos_seleccionados", anchosSeleccionados);
    guardarFiltroArray("altos_seleccionados", altosSeleccionados);
    guardarFiltroArray("gruesos_seleccionados", gruesosSeleccionados);
    guardarFiltroArray("coberturas_seleccionadas", coberturasSeleccionadas);
    guardarFiltroArray("piezas_seleccionadas", piezasSeleccionadas);
    guardarFiltroArray("espesores_seleccionados", espesoresSeleccionados);
    guardarFiltro("busqueda", busqueda);
    guardarFiltro("orden", orden);
    guardarFiltro("ofertas", soloOfertas);
    guardarFiltro("destacados", soloDestacados);
    localStorage.setItem("pagina_actual", String(paginaActual));
  }, [
    categoriasSeleccionadas,
    subcategoriasSeleccionadas,
    tiposSeleccionados,
    usosSeleccionados,
    aplicacionesSeleccionadas,
    tiposDisenoSeleccionados,
    materialesSeleccionados,
    acabadosSeleccionados,
    tiposInstalacionSeleccionados,
    tiposVentaSeleccionados,
    anchosSeleccionados,
    altosSeleccionados,
    gruesosSeleccionados,
    coberturasSeleccionadas,
    piezasSeleccionadas,
    espesoresSeleccionados,
    busqueda,
    orden,
    soloOfertas,
    soloDestacados,
    paginaActual
  ]);

  const obtenerImagen = (producto) => {
  let imagen = "";

  if (producto.imagenes && producto.imagenes.trim() !== "") {
    const imagenes = producto.imagenes.split(",");
    imagen = imagenes[0].trim();
  } else {
    imagen = producto.imagen;
  }

  if (!imagen) {
    return "https://via.placeholder.com/200";
  }

  return `https://backend-zuib.onrender.com${imagen}`;
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

    if (existe) {
      setFavoritos(favoritos.filter(f => Number(f.id) !== Number(producto.id)));
    } else {
      setFavoritos([...favoritos, productoCompleto]);
    }
  };

  const [comparador, setComparador] = useState(() => {
    const guardados = localStorage.getItem("comparador");
    return guardados ? JSON.parse(guardados) : [];
  });

  useEffect(() => {
    localStorage.setItem("comparador", JSON.stringify(comparador));
  }, [comparador]);

  const toggleComparador = (producto) => {
    const productoCompleto = { ...producto, imagen: obtenerImagen(producto) };
    const existe = comparador.find(p => Number(p.id) === Number(producto.id));

    if (existe) {
      setComparador(comparador.filter(p => Number(p.id) !== Number(producto.id)));
    } else {
      if (comparador.length >= 3) {
        alert("Máximo 3 productos");
        return;
      }
      setComparador([...comparador, productoCompleto]);
    }
  };

  const esFavorito = (id) => favoritos.some(f => Number(f.id) === Number(id));
  const estaComparando = (id) => comparador.some(p => Number(p.id) === Number(id));

  const agregarCotizador = (producto) => {
    const cotizador = JSON.parse(localStorage.getItem("cotizador")) || [];
    const existe = cotizador.find(p => Number(p.id) === Number(producto.id));
    if (existe) return;

    cotizador.push({ ...producto, imagen: obtenerImagen(producto) });
    localStorage.setItem("cotizador", JSON.stringify(cotizador));
    alert("Producto agregado al cotizador");
  };

  // 🛒 FUNCIÓN PARA AGREGAR AL PEDIDO
  const agregarAlPedido = (producto, e) => {
    e.stopPropagation();
    if (desdePedido) {
      navigate("/pedido", { 
        state: { 
          productoAgregado: { producto, cantidad: 1 } 
        } 
      });
    } else {
      alert("Para agregar al pedido, por favor ve a la sección de Pedidos");
      navigate("/pedido");
    }
  };

  const resaltarTexto = (texto) => {
    if (!busqueda.trim()) return texto;
    const regex = new RegExp(`(${busqueda})`, "gi");
    return texto?.split(regex).map((parte, index) => (
      parte.toLowerCase() === busqueda.toLowerCase() ? (
        <span key={index} style={styles.highlight(darkMode)}>{parte}</span>
      ) : parte
    ));
  };

  const parseValorRango = (valor) => {
    if (!valor) return null;
    const limpio = String(valor).toLowerCase().replace(/[^0-9.]/g, '');
    const num = parseFloat(limpio);
    return isNaN(num) ? null : num;
  };

  const estaEnRangoSeleccionado = (valorProducto, opcionesSeleccionadas) => {
    if (!valorProducto) return false;
    if (opcionesSeleccionadas.length === 0) return true;

    const valorNum = parseValorRango(valorProducto);
    if (valorNum === null) return false;

    const valoresSeleccionados = opcionesSeleccionadas
      .map(v => parseValorRango(v))
      .filter(v => v !== null)
      .sort((a, b) => a - b);

    if (valoresSeleccionados.length === 0) return true;

    for (let i = 0; i < valoresSeleccionados.length; i++) {
      const actual = valoresSeleccionados[i];
      const siguiente = i < valoresSeleccionados.length - 1 ? valoresSeleccionados[i + 1] : null;
      const anterior = i > 0 ? valoresSeleccionados[i - 1] : null;

      if (valoresSeleccionados.length === 1) {
        const margen = actual * 0.1;
        if (Math.abs(valorNum - actual) <= margen) return true;
      }
      
      if (i === 0 && siguiente !== null) {
        if (valorNum >= actual && valorNum <= siguiente) return true;
      }
      else if (i === valoresSeleccionados.length - 1 && anterior !== null) {
        if (valorNum >= anterior && valorNum <= actual) return true;
      }
      else if (anterior !== null && siguiente !== null) {
        if (valorNum >= anterior && valorNum <= siguiente) return true;
      }
    }

    return false;
  };

  const productosFiltrados = [...productos]
    .filter(p => {
      const texto = busqueda.toLowerCase();
      return (
        (p.nombre || "").toLowerCase().includes(texto) ||
        (p.descripcion || "").toLowerCase().includes(texto) ||
        (p.categoria || "").toLowerCase().includes(texto) ||
        (p.subcategoria || "").toLowerCase().includes(texto) ||
        (p.sku || "").toLowerCase().includes(texto) ||
        (p.tipo || "").toLowerCase().includes(texto)
      );
    })
    .filter(p => {
      if (categoriasSeleccionadas.length === 0) return true;
      return categoriasSeleccionadas.includes(p.categoria);
    })
    .filter(p => {
      if (subcategoriasSeleccionadas.length === 0) return true;
      return subcategoriasSeleccionadas.includes(p.subcategoria);
    })
    .filter(p => {
      if (tiposSeleccionados.length === 0) return true;
      return tiposSeleccionados.includes(p.tipo);
    })
    .filter(p => soloOfertas ? (p.oferta === 1 || p.oferta === true) : true)
    .filter(p => soloDestacados ? (p.destacado === 1 || p.destacado === true) : true)
    .filter(p => {
      if (usosSeleccionados.length === 0) return true;
      return usosSeleccionados.includes(p.uso);
    })
    .filter(p => {
      if (aplicacionesSeleccionadas.length === 0) return true;
      return aplicacionesSeleccionadas.includes(p.aplicacion);
    })
    .filter(p => {
      if (tiposDisenoSeleccionados.length === 0) return true;
      return tiposDisenoSeleccionados.includes(p.tipo_diseno);
    })
    .filter(p => {
      if (materialesSeleccionados.length === 0) return true;
      return materialesSeleccionados.includes(p.material);
    })
    .filter(p => {
      if (acabadosSeleccionados.length === 0) return true;
      return acabadosSeleccionados.includes(p.acabado);
    })
    .filter(p => {
      if (tiposInstalacionSeleccionados.length === 0) return true;
      return tiposInstalacionSeleccionados.includes(p.tipo_instalacion);
    })
    .filter(p => {
      if (tiposVentaSeleccionados.length === 0) return true;
      return tiposVentaSeleccionados.includes(p.tipoVenta);
    })
    .filter(p => {
      if (anchosSeleccionados.length === 0) return true;
      return estaEnRangoSeleccionado(p.ancho, anchosSeleccionados);
    })
    .filter(p => {
      if (altosSeleccionados.length === 0) return true;
      return estaEnRangoSeleccionado(p.alto, altosSeleccionados);
    })
    .filter(p => {
      if (gruesosSeleccionados.length === 0) return true;
      return estaEnRangoSeleccionado(p.grueso, gruesosSeleccionados);
    })
    .filter(p => {
      if (coberturasSeleccionadas.length === 0) return true;
      return estaEnRangoSeleccionado(p.cobertura, coberturasSeleccionadas);
    })
    .filter(p => {
      if (piezasSeleccionadas.length === 0) return true;
      const piezasNum = parseValorRango(p.piezasCaja);
      if (piezasNum === null) return false;
      return piezasSeleccionadas.some(sel => {
        const selNum = parseValorRango(sel);
        if (selNum === null) return false;
        if (sel.includes('+')) {
          const min = parseValorRango(sel.replace('+', ''));
          return min !== null && piezasNum >= min;
        }
        const margen = selNum * 0.05;
        return Math.abs(piezasNum - selNum) <= margen;
      });
    })
    .filter(p => {
      if (espesoresSeleccionados.length === 0) return true;
      const espesorNum = parseValorRango(p.espesor_capa_desgaste);
      if (espesorNum === null) return false;
      return espesoresSeleccionados.some(sel => {
        const selNum = parseValorRango(sel);
        if (selNum === null) return false;
        const margen = selNum * 0.05;
        return Math.abs(espesorNum - selNum) <= margen;
      });
    });

  const productosOrdenados = [...productosFiltrados].sort((a, b) => {
    if (orden === "A-Z") {
      return (a.nombre || "").localeCompare(b.nombre || "");
    }
    if (orden === "Z-A") {
      return (b.nombre || "").localeCompare(a.nombre || "");
    }
    if (orden === "Menor precio") {
      const precioA = Number(a.precioOferta) || Number(a.precio);
      const precioB = Number(b.precioOferta) || Number(b.precio);
      return precioA - precioB;
    }
    if (orden === "Mayor precio") {
      const precioA = Number(a.precioOferta) || Number(a.precio);
      const precioB = Number(b.precioOferta) || Number(b.precio);
      return precioB - precioA;
    }
    if (orden === "SKU") {
      return (a.sku || "").localeCompare(b.sku || "");
    }
    return 0;
  });

  const getOpcionesFiltro = (campo) => {
    let productosBase = productos;
    
    if (categoriasSeleccionadas.length > 0) {
      productosBase = productosBase.filter(p => categoriasSeleccionadas.includes(p.categoria));
    }
    
    if (subcategoriasSeleccionadas.length > 0) {
      productosBase = productosBase.filter(p => subcategoriasSeleccionadas.includes(p.subcategoria));
    }
    
    const valores = [...new Set(productosBase.map(p => p[campo]).filter(Boolean))];
    return valores.sort();
  };

  const opcionesUso = getOpcionesFiltro("uso");
  const opcionesAplicacion = getOpcionesFiltro("aplicacion");
  const opcionesTipoDiseno = getOpcionesFiltro("tipo_diseno");
  const opcionesMaterial = getOpcionesFiltro("material");
  const opcionesAcabado = getOpcionesFiltro("acabado");
  const opcionesTipoInstalacion = getOpcionesFiltro("tipo_instalacion");
  
  const opcionesTipoProducto = tipos
    .filter(t => {
      if (categoriasSeleccionadas.length > 0) {
        const productosEnCategoria = productos.filter(p => categoriasSeleccionadas.includes(p.categoria));
        const tiposEnCategoria = new Set(productosEnCategoria.map(p => p.tipo).filter(Boolean));
        return tiposEnCategoria.has(t.nombre);
      }
      return true;
    })
    .filter(t => {
      if (subcategoriasSeleccionadas.length > 0) {
        const productosEnSubcategoria = productos.filter(p => subcategoriasSeleccionadas.includes(p.subcategoria));
        const tiposEnSubcategoria = new Set(productosEnSubcategoria.map(p => p.tipo).filter(Boolean));
        return tiposEnSubcategoria.has(t.nombre);
      }
      return true;
    })
    .map(t => t.nombre)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort();

  const categoriasDisponibles = [...new Set(productos.map(p => p.categoria).filter(Boolean))].sort();
  
  const subcategoriasDisponibles = categoriasSeleccionadas.length > 0
    ? [...new Set(productos.filter(p => categoriasSeleccionadas.includes(p.categoria)).map(p => p.subcategoria).filter(Boolean))].sort()
    : [...new Set(productos.map(p => p.subcategoria).filter(Boolean))].sort();

  const totalPaginas = Math.ceil(productosOrdenados.length / productosPorPagina);
  const indiceUltimoProducto = paginaActual * productosPorPagina;
  const indicePrimerProducto = indiceUltimoProducto - productosPorPagina;
  const productosPaginaActual = productosOrdenados.slice(indicePrimerProducto, indiceUltimoProducto);

  const cambiarPagina = (numeroPagina) => {
    setPaginaActual(numeroPagina);
    localStorage.setItem("pagina_actual", String(numeroPagina));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getPaginasMostradas = () => {
    if (isMobile) {
      const paginas = [];
      if (totalPaginas <= 5) {
        for (let i = 1; i <= totalPaginas; i++) paginas.push(i);
      } else {
        paginas.push(1);
        if (paginaActual > 3) paginas.push('...');
        const start = Math.max(2, paginaActual - 1);
        const end = Math.min(totalPaginas - 1, paginaActual + 1);
        for (let i = start; i <= end; i++) paginas.push(i);
        if (paginaActual < totalPaginas - 2) paginas.push('...');
        paginas.push(totalPaginas);
      }
      return paginas;
    }
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  };

  const contarFiltrosActivos = () => {
    let count = 0;
    count += categoriasSeleccionadas.length;
    count += subcategoriasSeleccionadas.length;
    count += tiposSeleccionados.length;
    count += usosSeleccionados.length;
    count += aplicacionesSeleccionadas.length;
    count += tiposDisenoSeleccionados.length;
    count += materialesSeleccionados.length;
    count += acabadosSeleccionados.length;
    count += tiposInstalacionSeleccionados.length;
    count += tiposVentaSeleccionados.length;
    count += anchosSeleccionados.length;
    count += altosSeleccionados.length;
    count += gruesosSeleccionados.length;
    count += coberturasSeleccionadas.length;
    count += piezasSeleccionadas.length;
    count += espesoresSeleccionados.length;
    if (soloOfertas) count++;
    if (soloDestacados) count++;
    if (orden) count++;
    if (busqueda) count++;
    return count;
  };

  const filtrosActivos = contarFiltrosActivos();

  const FiltrosActivosChips = () => {
    const todosLosFiltros = [
      ...categoriasSeleccionadas.map(v => ({ tipo: 'categoria', valor: v, label: `📂 ${v}` })),
      ...subcategoriasSeleccionadas.map(v => ({ tipo: 'subcategoria', valor: v, label: `📁 ${v}` })),
      ...tiposSeleccionados.map(v => ({ tipo: 'tipo', valor: v, label: `🏷️ ${v}` })),
      ...usosSeleccionados.map(v => ({ tipo: 'uso', valor: v, label: `🏠 ${v}` })),
      ...aplicacionesSeleccionadas.map(v => ({ tipo: 'aplicacion', valor: v, label: `📋 ${v}` })),
      ...tiposDisenoSeleccionados.map(v => ({ tipo: 'tipo_diseno', valor: v, label: `🎨 ${v}` })),
      ...materialesSeleccionados.map(v => ({ tipo: 'material', valor: v, label: `🧱 ${v}` })),
      ...acabadosSeleccionados.map(v => ({ tipo: 'acabado', valor: v, label: `✨ ${v}` })),
      ...tiposInstalacionSeleccionados.map(v => ({ tipo: 'tipo_instalacion', valor: v, label: `🔧 ${v}` })),
      ...tiposVentaSeleccionados.map(v => ({ tipo: 'tipo_venta', valor: v, label: `🚚 ${v}` })),
      ...anchosSeleccionados.map(v => ({ tipo: 'ancho', valor: v, label: `📏 Ancho: ${v}` })),
      ...altosSeleccionados.map(v => ({ tipo: 'alto', valor: v, label: `📏 Alto: ${v}` })),
      ...gruesosSeleccionados.map(v => ({ tipo: 'grueso', valor: v, label: `📏 Grueso: ${v}` })),
      ...coberturasSeleccionadas.map(v => ({ tipo: 'cobertura', valor: v, label: `📦 Cobertura: ${v}` })),
      ...piezasSeleccionadas.map(v => ({ tipo: 'piezas', valor: v, label: `📦 Piezas: ${v}` })),
      ...espesoresSeleccionados.map(v => ({ tipo: 'espesor', valor: v, label: `📏 Espesor: ${v}` })),
    ];

    if (todosLosFiltros.length === 0 && !soloOfertas && !soloDestacados && !busqueda && !orden) return null;

    return (
      <div style={styles.filtrosActivosContainer}>
        {todosLosFiltros.map((f, i) => (
          <span key={i} style={styles.filtroChip(darkMode)}>
            {f.label}
            <button
              onClick={() => eliminarFiltro(f.tipo, f.valor)}
              style={styles.filtroChipRemove}
            >
              ✕
            </button>
          </span>
        ))}
        {soloOfertas && (
          <span style={styles.filtroChip(darkMode)}>
            🔥 Ofertas
            <button
              onClick={() => {
                setSoloOfertas(false);
                guardarFiltro("ofertas", "false");
              }}
              style={styles.filtroChipRemove}
            >
              ✕
            </button>
          </span>
        )}
        {soloDestacados && (
          <span style={styles.filtroChip(darkMode)}>
            ⭐ Destacados
            <button
              onClick={() => {
                setSoloDestacados(false);
                guardarFiltro("destacados", "false");
              }}
              style={styles.filtroChipRemove}
            >
              ✕
            </button>
          </span>
        )}
        {busqueda && (
          <span style={styles.filtroChip(darkMode)}>
            🔍 "{busqueda}"
            <button
              onClick={() => {
                setBusqueda("");
                guardarFiltro("busqueda", "");
              }}
              style={styles.filtroChipRemove}
            >
              ✕
            </button>
          </span>
        )}
        {orden && (
          <span style={styles.filtroChip(darkMode)}>
            🔤 {orden}
            <button
              onClick={() => {
                setOrden("");
                guardarFiltro("orden", "");
              }}
              style={styles.filtroChipRemove}
            >
              ✕
            </button>
          </span>
        )}
        {todosLosFiltros.length > 0 && (
          <button
            onClick={limpiarTodosLosFiltros}
            style={styles.limpiarTodosBtn(darkMode)}
          >
            Limpiar todos ✕
          </button>
        )}
      </div>
    );
  };

  const renderRangoCheckboxGroup = (options, selected, setter, key, label, icon) => {
    if (options.length === 0) return null;

    return (
      <div style={styles.rangoCheckboxGroup}>
        <div style={styles.rangoCheckboxLabel(darkMode)}>
          {icon} {label}
        </div>
        <div style={styles.rangoCheckboxOptions}>
          {options.map((opt) => (
            <label key={opt} style={styles.rangoCheckboxOption(darkMode)}>
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => toggleSeleccion(setter, key, opt)}
                style={styles.checkboxInputSmall}
              />
              <span style={styles.rangoCheckboxOptionLabel}>{opt}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.page(darkMode)}>
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
        {/* HEADER CON INDICADOR DE PEDIDO */}
        <div style={styles.headerModern}>
          <div>
            <h1 style={styles.titleModern(darkMode)}>🛍️ Nuestros Productos</h1>
            <p style={styles.subtitleModern(darkMode)}>Descubre nuestra colección exclusiva</p>
            {desdePedido && (
              <div style={styles.pedidoIndicator}>
                <FaShoppingCart style={{ marginRight: '6px' }} />
                Selecciona un producto para agregar a tu pedido
              </div>
            )}
          </div>
          <div style={styles.headerStats(darkMode)}>
            <span style={styles.statBadge(darkMode)}>
              <span style={styles.statNumber}>{productosOrdenados.length}</span>
              <span style={styles.statLabel}>Productos</span>
            </span>
            {filtrosActivos > 0 && (
              <span style={styles.filterBadge(darkMode)}>
                🔍 {filtrosActivos} filtros activos
              </span>
            )}
          </div>
        </div>

        {/* FILTROS ACTIVOS - CHIPS */}
        <FiltrosActivosChips />

        {/* 📱 MÓVIL - FILTROS COMPACTOS */}
        {isMobile && (
          <div style={styles.mobileFiltersModern(darkMode)}>
            <div style={styles.mobileSearchRow}>
              <input
                type="text"
                placeholder="🔍 Buscar productos..."
                value={busqueda}
                onChange={(e) => {
                  setBusqueda(e.target.value);
                  guardarFiltro("busqueda", e.target.value);
                }}
                style={styles.searchModern(darkMode, true)}
              />
              <button
                onClick={() => setOpenFiltrosExtra(!openFiltrosExtra)}
                style={{
                  ...styles.mobileFilterBtnModern(darkMode),
                  background: openFiltrosExtra ? "#6366f1" : (darkMode ? "#2d2d3f" : "#f1f5f9"),
                  color: openFiltrosExtra ? "#fff" : (darkMode ? "#e2e8f0" : "#334155")
                }}
              >
                {openFiltrosExtra ? "✕" : "⚙️"}
              </button>
            </div>

            {openFiltrosExtra && (
              <div style={styles.mobileFiltersContent(darkMode)}>
                <div style={styles.mobileFilterSection}>
                  <div style={styles.mobileFilterLabel}>📂 Categorías</div>
                  <div style={styles.mobileCheckboxGrid}>
                    {categoriasDisponibles.map((cat) => (
                      <label key={cat} style={styles.mobileCheckboxLabel(darkMode)}>
                        <input
                          type="checkbox"
                          checked={categoriasSeleccionadas.includes(cat)}
                          onChange={() => toggleSeleccion(setCategoriasSeleccionadas, "categorias_seleccionadas", cat)}
                        />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={styles.mobileFilterSection}>
                  <div style={styles.mobileFilterLabel}>📁 Subcategorías</div>
                  <div style={styles.mobileCheckboxGrid}>
                    {subcategoriasDisponibles.map((sub) => (
                      <label key={sub} style={styles.mobileCheckboxLabel(darkMode)}>
                        <input
                          type="checkbox"
                          checked={subcategoriasSeleccionadas.includes(sub)}
                          onChange={() => toggleSeleccion(setSubcategoriasSeleccionadas, "subcategorias_seleccionadas", sub)}
                        />
                        {sub}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={styles.mobileFilterSection}>
                  <div style={styles.mobileFilterLabel}>🏷️ Tipos</div>
                  <div style={styles.mobileCheckboxGrid}>
                    {opcionesTipoProducto.map((tipo) => (
                      <label key={tipo} style={styles.mobileCheckboxLabel(darkMode)}>
                        <input
                          type="checkbox"
                          checked={tiposSeleccionados.includes(tipo)}
                          onChange={() => toggleSeleccion(setTiposSeleccionados, "tipos_seleccionados", tipo)}
                        />
                        {tipo}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={styles.mobileFilterGrid}>
                  <select
                    value={orden}
                    onChange={(e) => {
                      setOrden(e.target.value);
                      guardarFiltro("orden", e.target.value);
                    }}
                    style={styles.mobileSelectModern(darkMode, !!orden)}
                  >
                    <option value="">🔤 Ordenar</option>
                    <option value="A-Z">A-Z</option>
                    <option value="Z-A">Z-A</option>
                    <option value="Menor precio">💰 Menor precio</option>
                    <option value="Mayor precio">💰 Mayor precio</option>
                    <option value="SKU">🔢 SKU</option>
                  </select>
                </div>

                <div style={styles.mobileCheckboxGroup}>
                  <label style={styles.checkboxModern(darkMode)}>
                    <input type="checkbox" checked={soloOfertas} onChange={() => {
                      setSoloOfertas(!soloOfertas);
                      guardarFiltro("ofertas", String(!soloOfertas));
                    }} />
                    🔥 Ofertas
                  </label>
                  <label style={styles.checkboxModern(darkMode)}>
                    <input type="checkbox" checked={soloDestacados} onChange={() => {
                      setSoloDestacados(!soloDestacados);
                      guardarFiltro("destacados", String(!soloDestacados));
                    }} />
                    ⭐ Destacados
                  </label>
                </div>

                <details style={styles.mobileDetails(darkMode)}>
                  <summary style={styles.mobileSummary(darkMode)}>🔧 Más filtros</summary>
                  <div style={styles.mobileDetailsContent}>
                    {opcionesUso.length > 0 && (
                      <div style={styles.mobileFilterSection}>
                        <div style={styles.mobileFilterLabel}>🏠 Uso</div>
                        <div style={styles.mobileCheckboxGrid}>
                          {opcionesUso.map((opt) => (
                            <label key={opt} style={styles.mobileCheckboxLabel(darkMode)}>
                              <input
                                type="checkbox"
                                checked={usosSeleccionados.includes(opt)}
                                onChange={() => toggleSeleccion(setUsosSeleccionados, "usos_seleccionados", opt)}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {opcionesAplicacion.length > 0 && (
                      <div style={styles.mobileFilterSection}>
                        <div style={styles.mobileFilterLabel}>📋 Aplicación</div>
                        <div style={styles.mobileCheckboxGrid}>
                          {opcionesAplicacion.map((opt) => (
                            <label key={opt} style={styles.mobileCheckboxLabel(darkMode)}>
                              <input
                                type="checkbox"
                                checked={aplicacionesSeleccionadas.includes(opt)}
                                onChange={() => toggleSeleccion(setAplicacionesSeleccionadas, "aplicaciones_seleccionadas", opt)}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {opcionesMaterial.length > 0 && (
                      <div style={styles.mobileFilterSection}>
                        <div style={styles.mobileFilterLabel}>🧱 Material</div>
                        <div style={styles.mobileCheckboxGrid}>
                          {opcionesMaterial.map((opt) => (
                            <label key={opt} style={styles.mobileCheckboxLabel(darkMode)}>
                              <input
                                type="checkbox"
                                checked={materialesSeleccionados.includes(opt)}
                                onChange={() => toggleSeleccion(setMaterialesSeleccionados, "materiales_seleccionados", opt)}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {opcionesAcabado.length > 0 && (
                      <div style={styles.mobileFilterSection}>
                        <div style={styles.mobileFilterLabel}>✨ Acabado</div>
                        <div style={styles.mobileCheckboxGrid}>
                          {opcionesAcabado.map((opt) => (
                            <label key={opt} style={styles.mobileCheckboxLabel(darkMode)}>
                              <input
                                type="checkbox"
                                checked={acabadosSeleccionados.includes(opt)}
                                onChange={() => toggleSeleccion(setAcabadosSeleccionados, "acabados_seleccionados", opt)}
                              />
                              {opt}
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={styles.mobileFilterSection}>
                      <div style={styles.mobileFilterLabel}>🚚 Tipo venta</div>
                      <div style={styles.mobileCheckboxGrid}>
                        {opcionesTipoVentaCompleto.map((opt) => (
                          <label key={opt} style={styles.mobileCheckboxLabel(darkMode)}>
                            <input
                              type="checkbox"
                              checked={tiposVentaSeleccionados.includes(opt)}
                              onChange={() => toggleSeleccion(setTiposVentaSeleccionados, "tipos_venta_seleccionados", opt)}
                            />
                            {opt}
                          </label>
                        ))}
                      </div>
                    </div>

                    {renderRangoCheckboxGroup(opcionesAncho, anchosSeleccionados, setAnchosSeleccionados, "anchos_seleccionados", "Ancho", "📏")}
                    {renderRangoCheckboxGroup(opcionesAlto, altosSeleccionados, setAltosSeleccionados, "altos_seleccionados", "Alto", "📏")}
                    {renderRangoCheckboxGroup(opcionesGrueso, gruesosSeleccionados, setGruesosSeleccionados, "gruesos_seleccionados", "Grueso", "📏")}
                    {renderRangoCheckboxGroup(opcionesCobertura, coberturasSeleccionadas, setCoberturasSeleccionadas, "coberturas_seleccionadas", "Cobertura", "📦")}
                    {renderRangoCheckboxGroup(opcionesPiezasCaja, piezasSeleccionadas, setPiezasSeleccionadas, "piezas_seleccionadas", "Piezas/caja", "📦")}
                    {renderRangoCheckboxGroup(opcionesEspesorDesgaste, espesoresSeleccionados, setEspesoresSeleccionados, "espesores_seleccionados", "Espesor desgaste", "📏")}

                    <button
                      onClick={limpiarTodosLosFiltros}
                      style={styles.btnResetFilters(darkMode)}
                    >
                      🔄 Restablecer filtros
                    </button>
                  </div>
                </details>
              </div>
            )}
          </div>
        )}

        {/* 🖥️ ESCRITORIO - LAYOUT DE DOS COLUMNAS */}
        {!isMobile && (
          <div style={styles.desktopLayoutModern}>
            <div style={styles.filtrosPanelModern(darkMode)}>
              <div style={styles.panelHeader(darkMode)}>
                <span style={styles.panelIcon}>🎯</span>
                <h3 style={styles.panelTitle(darkMode)}>Filtros</h3>
                {filtrosActivos > 0 && (
                  <span style={styles.filterCountBadge}>{filtrosActivos}</span>
                )}
                <button
                  onClick={limpiarTodosLosFiltros}
                  style={styles.clearFiltersBtn(darkMode)}
                  title="Limpiar todos los filtros"
                >
                  ✕
                </button>
              </div>

              <div style={styles.searchWrapper}>
                <span style={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={busqueda}
                  onChange={(e) => {
                    setBusqueda(e.target.value);
                    guardarFiltro("busqueda", e.target.value);
                  }}
                  style={styles.searchModern(darkMode, false)}
                />
                {busqueda && (
                  <button 
                    onClick={() => {
                      setBusqueda("");
                      guardarFiltro("busqueda", "");
                    }}
                    style={styles.clearSearchBtn(darkMode)}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div style={styles.filterSection}>
                <div style={styles.filterGroup}>
                  <div style={styles.filterLabel(darkMode)}>📂 Categorías</div>
                  <div style={styles.checkboxOptionsDesktop}>
                    {categoriasDisponibles.map((cat) => (
                      <label key={cat} style={styles.checkboxOptionDesktop(darkMode)}>
                        <input
                          type="checkbox"
                          checked={categoriasSeleccionadas.includes(cat)}
                          onChange={() => toggleSeleccion(setCategoriasSeleccionadas, "categorias_seleccionadas", cat)}
                          style={styles.checkboxInput}
                        />
                        {cat}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={styles.filterGroup}>
                  <div style={styles.filterLabel(darkMode)}>📁 Subcategorías</div>
                  <div style={styles.checkboxOptionsDesktop}>
                    {subcategoriasDisponibles.map((sub) => (
                      <label key={sub} style={styles.checkboxOptionDesktop(darkMode)}>
                        <input
                          type="checkbox"
                          checked={subcategoriasSeleccionadas.includes(sub)}
                          onChange={() => toggleSeleccion(setSubcategoriasSeleccionadas, "subcategorias_seleccionadas", sub)}
                          style={styles.checkboxInput}
                        />
                        {sub}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={styles.filterGroup}>
                  <div style={styles.filterLabel(darkMode)}>🏷️ Tipos</div>
                  <div style={styles.checkboxOptionsDesktop}>
                    {opcionesTipoProducto.map((tipo) => (
                      <label key={tipo} style={styles.checkboxOptionDesktop(darkMode)}>
                        <input
                          type="checkbox"
                          checked={tiposSeleccionados.includes(tipo)}
                          onChange={() => toggleSeleccion(setTiposSeleccionados, "tipos_seleccionados", tipo)}
                          style={styles.checkboxInput}
                        />
                        {tipo}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={styles.filterGroup}>
                  <div style={styles.filterLabel(darkMode)}>🔤 Ordenar</div>
                  <select
                    value={orden}
                    onChange={(e) => {
                      setOrden(e.target.value);
                      guardarFiltro("orden", e.target.value);
                    }}
                    style={styles.selectModern(darkMode, !!orden)}
                  >
                    <option value="">Seleccionar</option>
                    <option value="A-Z">A-Z</option>
                    <option value="Z-A">Z-A</option>
                    <option value="Menor precio">💰 Menor precio</option>
                    <option value="Mayor precio">💰 Mayor precio</option>
                    <option value="SKU">🔢 SKU</option>
                  </select>
                </div>
              </div>

              <div style={styles.filterDivider(darkMode)} />

              <div style={styles.checkboxGroupModern}>
                <label style={styles.checkboxModern(darkMode)}>
                  <input type="checkbox" checked={soloOfertas} onChange={() => {
                    setSoloOfertas(!soloOfertas);
                    guardarFiltro("ofertas", String(!soloOfertas));
                  }} />
                  <span style={styles.checkboxLabel}>🔥 Ofertas</span>
                </label>
                <label style={styles.checkboxModern(darkMode)}>
                  <input type="checkbox" checked={soloDestacados} onChange={() => {
                    setSoloDestacados(!soloDestacados);
                    guardarFiltro("destacados", String(!soloDestacados));
                  }} />
                  <span style={styles.checkboxLabel}>⭐ Destacados</span>
                </label>
              </div>

              <div style={styles.filterDivider(darkMode)} />

              <div style={styles.filterGridCompact}>
                {opcionesUso.length > 0 && (
                  <div style={styles.filterGroupCompact}>
                    <div style={styles.filterLabelSmall(darkMode)}>🏠 Uso</div>
                    <div style={styles.checkboxOptionsCompact}>
                      {opcionesUso.map((opt) => (
                        <label key={opt} style={styles.checkboxOptionCompact(darkMode)}>
                          <input
                            type="checkbox"
                            checked={usosSeleccionados.includes(opt)}
                            onChange={() => toggleSeleccion(setUsosSeleccionados, "usos_seleccionados", opt)}
                            style={styles.checkboxInputSmall}
                          />
                          <span style={styles.checkboxOptionLabelSmall}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {opcionesAplicacion.length > 0 && (
                  <div style={styles.filterGroupCompact}>
                    <div style={styles.filterLabelSmall(darkMode)}>📋 Aplicación</div>
                    <div style={styles.checkboxOptionsCompact}>
                      {opcionesAplicacion.map((opt) => (
                        <label key={opt} style={styles.checkboxOptionCompact(darkMode)}>
                          <input
                            type="checkbox"
                            checked={aplicacionesSeleccionadas.includes(opt)}
                            onChange={() => toggleSeleccion(setAplicacionesSeleccionadas, "aplicaciones_seleccionadas", opt)}
                            style={styles.checkboxInputSmall}
                          />
                          <span style={styles.checkboxOptionLabelSmall}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {opcionesMaterial.length > 0 && (
                  <div style={styles.filterGroupCompact}>
                    <div style={styles.filterLabelSmall(darkMode)}>🧱 Material</div>
                    <div style={styles.checkboxOptionsCompact}>
                      {opcionesMaterial.map((opt) => (
                        <label key={opt} style={styles.checkboxOptionCompact(darkMode)}>
                          <input
                            type="checkbox"
                            checked={materialesSeleccionados.includes(opt)}
                            onChange={() => toggleSeleccion(setMaterialesSeleccionados, "materiales_seleccionados", opt)}
                            style={styles.checkboxInputSmall}
                          />
                          <span style={styles.checkboxOptionLabelSmall}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {opcionesAcabado.length > 0 && (
                  <div style={styles.filterGroupCompact}>
                    <div style={styles.filterLabelSmall(darkMode)}>✨ Acabado</div>
                    <div style={styles.checkboxOptionsCompact}>
                      {opcionesAcabado.map((opt) => (
                        <label key={opt} style={styles.checkboxOptionCompact(darkMode)}>
                          <input
                            type="checkbox"
                            checked={acabadosSeleccionados.includes(opt)}
                            onChange={() => toggleSeleccion(setAcabadosSeleccionados, "acabados_seleccionados", opt)}
                            style={styles.checkboxInputSmall}
                          />
                          <span style={styles.checkboxOptionLabelSmall}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {opcionesTipoInstalacion.length > 0 && (
                  <div style={styles.filterGroupCompact}>
                    <div style={styles.filterLabelSmall(darkMode)}>🔧 Instalación</div>
                    <div style={styles.checkboxOptionsCompact}>
                      {opcionesTipoInstalacion.map((opt) => (
                        <label key={opt} style={styles.checkboxOptionCompact(darkMode)}>
                          <input
                            type="checkbox"
                            checked={tiposInstalacionSeleccionados.includes(opt)}
                            onChange={() => toggleSeleccion(setTiposInstalacionSeleccionados, "tipos_instalacion_seleccionados", opt)}
                            style={styles.checkboxInputSmall}
                          />
                          <span style={styles.checkboxOptionLabelSmall}>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div style={styles.filterGroupCompact}>
                  <div style={styles.filterLabelSmall(darkMode)}>🚚 Tipo venta</div>
                  <div style={styles.checkboxOptionsCompact}>
                    {opcionesTipoVentaCompleto.map((opt) => (
                      <label key={opt} style={styles.checkboxOptionCompact(darkMode)}>
                        <input
                          type="checkbox"
                          checked={tiposVentaSeleccionados.includes(opt)}
                          onChange={() => toggleSeleccion(setTiposVentaSeleccionados, "tipos_venta_seleccionados", opt)}
                          style={styles.checkboxInputSmall}
                        />
                        <span style={styles.checkboxOptionLabelSmall}>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div style={styles.filterDivider(darkMode)} />

              <div style={styles.rangosContainer}>
                {renderRangoCheckboxGroup(opcionesAncho, anchosSeleccionados, setAnchosSeleccionados, "anchos_seleccionados", "Ancho", "📏")}
                {renderRangoCheckboxGroup(opcionesAlto, altosSeleccionados, setAltosSeleccionados, "altos_seleccionados", "Alto", "📏")}
                {renderRangoCheckboxGroup(opcionesGrueso, gruesosSeleccionados, setGruesosSeleccionados, "gruesos_seleccionados", "Grueso", "📏")}
                {renderRangoCheckboxGroup(opcionesCobertura, coberturasSeleccionadas, setCoberturasSeleccionadas, "coberturas_seleccionadas", "Cobertura", "📦")}
                {renderRangoCheckboxGroup(opcionesPiezasCaja, piezasSeleccionadas, setPiezasSeleccionadas, "piezas_seleccionadas", "Piezas/caja", "📦")}
                {renderRangoCheckboxGroup(opcionesEspesorDesgaste, espesoresSeleccionados, setEspesoresSeleccionados, "espesores_seleccionados", "Espesor desgaste", "📏")}
              </div>

              <div style={styles.filterDivider(darkMode)} />

              <button
                onClick={limpiarTodosLosFiltros}
                style={styles.btnResetFilters(darkMode)}
              >
                🔄 Restablecer todos los filtros
              </button>
            </div>

            <div style={styles.productosGridContainer}>
              <div style={styles.resultsBar(darkMode)}>
                <span style={styles.resultsText(darkMode)}>
                  <strong>{productosOrdenados.length}</strong> productos encontrados
                </span>
                <span style={styles.resultsBadge(darkMode)}>
                  Página {paginaActual} de {totalPaginas || 1}
                </span>
              </div>

              <div style={styles.gridModern(getGridColumns())}>
                {productosPaginaActual.map(p => (
                  <div
                    key={p.id}
                    style={styles.cardModern(darkMode)}
                  >
                    <div 
                      style={styles.cardImageWrapper}
                      onClick={() => {
                        const desdeCotizador = localStorage.getItem("seleccionandoCotizador");
                        if (desdeCotizador === "true") {
                          agregarCotizador(p);
                          navigate("/cotizador");
                          return;
                        }
                        navigate(`/producto/${p.id}`);
                      }}
                    >
                      <img src={obtenerImagen(p)} alt={p.nombre} style={styles.cardImage} />
                      {(p.oferta === 1 || p.oferta === true) && (
                        <span style={styles.offerBadge}>🔥 OFERTA</span>
                      )}
                      {p.destacado === 1 && (
                        <span style={styles.featuredBadge}>⭐ DESTACADO</span>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleFavorito(p); }}
                        style={{
                          ...styles.favBtnModern,
                          background: esFavorito(p.id) ? "#ef4444" : "rgba(255,255,255,0.9)",
                          color: esFavorito(p.id) ? "#fff" : "#333"
                        }}
                      >
                        {esFavorito(p.id) ? "❤️" : "🤍"}
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleComparador(p); }}
                        style={{
                          ...styles.compareBtnModern,
                          background: estaComparando(p.id) ? "#6366f1" : "rgba(255,255,255,0.9)",
                          color: estaComparando(p.id) ? "#fff" : "#333"
                        }}
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
                        {p.tipoVenta && <span style={styles.cardTag}>🚚 {p.tipoVenta}</span>}
                        {p.tipo && <span style={styles.cardTag}>🏷️ {p.tipo}</span>}
                      </div>

                      <div style={styles.cardPrice}>
                        {(p.oferta === 1 || p.oferta === true) ? (
                          <div>
                            <span style={styles.oldPriceModern}>${p.precio}</span>
                            <span style={styles.offerPriceModern}>${p.precioOferta}</span>
                          </div>
                        ) : (
                          <span style={styles.priceModern}>${p.precio}</span>
                        )}
                      </div>

                      {/* 🛒 BOTÓN AGREGAR AL PEDIDO - SOLO SI VIENE DESDE PEDIDO */}
                      {desdePedido && (
                        <button
                          onClick={(e) => agregarAlPedido(p, e)}
                          style={styles.addToOrderBtn}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 4px 20px rgba(99, 102, 241, 0.5)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(99, 102, 241, 0.3)';
                          }}
                        >
                          <FaShoppingCart style={{ marginRight: '6px' }} /> Agregar al Pedido
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {totalPaginas > 1 && (
                <div style={styles.paginationModern}>
                  <button
                    disabled={paginaActual === 1}
                    onClick={() => cambiarPagina(paginaActual - 1)}
                    style={styles.pageBtnModern(paginaActual === 1, darkMode)}
                  >
                    ‹
                  </button>
                  {getPaginasMostradas().map((num, index) => (
                    num === '...' ? (
                      <span key={`ellipsis-${index}`} style={styles.pageEllipsis(darkMode)}>…</span>
                    ) : (
                      <button
                        key={num}
                        onClick={() => cambiarPagina(num)}
                        style={styles.pageBtnModern(false, darkMode, num === paginaActual)}
                      >
                        {num}
                      </button>
                    )
                  ))}
                  <button
                    disabled={paginaActual === totalPaginas}
                    onClick={() => cambiarPagina(paginaActual + 1)}
                    style={styles.pageBtnModern(paginaActual === totalPaginas, darkMode)}
                  >
                    ›
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {isMobile && (
          <>
            <div style={styles.resultsBar(darkMode)}>
              <span style={styles.resultsText(darkMode)}>
                <strong>{productosOrdenados.length}</strong> productos
              </span>
            </div>
            <div style={styles.gridModern(getGridColumns())}>
              {productosPaginaActual.map(p => (
                <div
                  key={p.id}
                  style={styles.cardModern(darkMode)}
                >
                  <div 
                    style={styles.cardImageWrapper}
                    onClick={() => {
                      const desdeCotizador = localStorage.getItem("seleccionandoCotizador");
                      if (desdeCotizador === "true") {
                        agregarCotizador(p);
                        navigate("/cotizador");
                        return;
                      }
                      navigate(`/producto/${p.id}`);
                    }}
                  >
                    <img src={obtenerImagen(p)} alt={p.nombre} style={styles.cardImage} />
                    {(p.oferta === 1 || p.oferta === true) && (
                      <span style={{...styles.offerBadge, fontSize: "9px", padding: "2px 6px" }}>OFERTA</span>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorito(p); }}
                      style={{
                        ...styles.favBtnModern,
                        top: "6px",
                        right: "6px",
                        width: "28px",
                        height: "28px",
                        fontSize: "12px",
                        background: esFavorito(p.id) ? "#ef4444" : "rgba(255,255,255,0.9)",
                        color: esFavorito(p.id) ? "#fff" : "#333"
                      }}
                    >
                      {esFavorito(p.id) ? "❤️" : "🤍"}
                    </button>
                  </div>
                  <div style={styles.cardContent}>
                    <h3 style={{...styles.cardTitle(darkMode), fontSize: "13px" }}>{resaltarTexto(p.nombre)}</h3>
                    <div style={styles.cardTags}>
                      {p.categoria && <span style={{...styles.cardTag, fontSize: "8px" }}>📂 {p.categoria.slice(0, 8)}</span>}
                      {p.tipo && <span style={{...styles.cardTag, fontSize: "8px" }}>🏷️ {p.tipo.slice(0, 8)}</span>}
                    </div>
                    <div style={styles.cardPrice}>
                      {(p.oferta === 1 || p.oferta === true) ? (
                        <div>
                          <span style={{...styles.oldPriceModern, fontSize: "11px" }}>${p.precio}</span>
                          <span style={{...styles.offerPriceModern, fontSize: "14px" }}>${p.precioOferta}</span>
                        </div>
                      ) : (
                        <span style={{...styles.priceModern, fontSize: "16px" }}>${p.precio}</span>
                      )}
                    </div>

                    {/* 🛒 BOTÓN AGREGAR AL PEDIDO MÓVIL */}
                    {desdePedido && (
                      <button
                        onClick={(e) => agregarAlPedido(p, e)}
                        style={{
                          ...styles.addToOrderBtn,
                          fontSize: '11px',
                          padding: '6px 10px',
                          marginTop: '8px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.05)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        <FaShoppingCart style={{ marginRight: '4px', fontSize: '12px' }} /> Agregar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {totalPaginas > 1 && (
              <div style={styles.paginationModern}>
                <button
                  disabled={paginaActual === 1}
                  onClick={() => cambiarPagina(paginaActual - 1)}
                  style={styles.pageBtnModern(paginaActual === 1, darkMode)}
                >
                  ‹
                </button>
                {getPaginasMostradas().map((num, index) => (
                  num === '...' ? (
                    <span key={`ellipsis-${index}`} style={styles.pageEllipsis(darkMode)}>…</span>
                  ) : (
                    <button
                      key={num}
                      onClick={() => cambiarPagina(num)}
                      style={styles.pageBtnModern(false, darkMode, num === paginaActual)}
                    >
                      {num}
                    </button>
                  )
                ))}
                <button
                  disabled={paginaActual === totalPaginas}
                  onClick={() => cambiarPagina(paginaActual + 1)}
                  style={styles.pageBtnModern(paginaActual === totalPaginas, darkMode)}
                >
                  ›
                </button>
              </div>
            )}
          </>
        )}

        {comparador.length > 0 && (
          <div style={styles.compareBarModern(darkMode, isMobile)}>
            <div style={styles.compareItemsModern(isMobile)}>
              {comparador.map((p) => (
                <div key={p.id} style={styles.compareItemModern(darkMode)}>
                  <img src={p.imagen} alt={p.nombre} style={styles.compareImageModern(isMobile)} />
                  {!isMobile && <span style={styles.compareName}>{p.nombre.slice(0, 12)}...</span>}
                </div>
              ))}
            </div>
            <button style={styles.compareActionModern(isMobile)} onClick={() => navigate("/comparar")}>
              {isMobile ? `⚖️ ${comparador.length}` : `Comparar (${comparador.length})`}
            </button>
          </div>
        )}
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
}

// ============================================================
// 📦 ESTILOS COMPLETOS
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

  headerModern: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "25px",
    flexWrap: "wrap",
    gap: "15px"
  },

  titleModern: (darkMode) => ({
    fontSize: "38px",
    fontWeight: "800",
    color: darkMode ? "#fff" : "#0f172a",
    margin: "0 0 4px 0",
    letterSpacing: "-0.5px"
  }),

  subtitleModern: (darkMode) => ({
    fontSize: "19px",
    color: darkMode ? "#94a3b8" : "#64748b",
    margin: 0
  }),

  pedidoIndicator: {
    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(79, 70, 229, 0.08))',
    color: '#a5b4fc',
    padding: '8px 16px',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    marginTop: '6px',
    border: '1px solid rgba(99, 102, 241, 0.2)'
  },

  headerStats: (darkMode) => ({
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flexWrap: "wrap"
  }),

  statBadge: (darkMode) => ({
    background: darkMode ? "#1e293b" : "#fff",
    padding: "12px 22px",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.05)",
    border: darkMode ? "1px solid #2d2d3f" : "1px solid #f1f5f9"
  }),

  statNumber: {
    fontSize: "28px",
    fontWeight: "800",
    color: "#6366f1"
  },

  statLabel: {
    fontSize: "16px",
    color: "#94a3b8",
    fontWeight: "500"
  },

  filterBadge: (darkMode) => ({
    background: darkMode ? "#1e293b" : "#fff",
    padding: "12px 22px",
    borderRadius: "12px",
    fontSize: "16px",
    color: darkMode ? "#e2e8f0" : "#334155",
    border: darkMode ? "1px solid #2d2d3f" : "1px solid #f1f5f9",
    boxShadow: darkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.05)"
  }),

  filtrosActivosContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginBottom: "16px",
    padding: "8px 0",
    alignItems: "center"
  },

  filtroChip: (darkMode) => ({
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: darkMode ? "#1e293b" : "#f1f5f9",
    color: darkMode ? "#e2e8f0" : "#334155",
    padding: "6px 12px 6px 14px",
    borderRadius: "20px",
    fontSize: "14px",
    fontWeight: "500",
    border: darkMode ? "1px solid #2d2d3f" : "1px solid #e2e8f0",
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
  }),

  filtroChipRemove: {
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: "14px",
    padding: "2px 4px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    transition: "background 0.15s, color 0.15s",
    "&:hover": {
      background: "rgba(0,0,0,0.1)",
      color: "#ef4444"
    }
  },

  limpiarTodosBtn: (darkMode) => ({
    background: "transparent",
    border: "none",
    color: "#6366f1",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "600",
    padding: "6px 12px",
    borderRadius: "20px",
    transition: "background 0.15s",
    "&:hover": {
      background: darkMode ? "#1e293b" : "#f1f5f9"
    }
  }),

  desktopLayoutModern: {
    display: "flex",
    gap: "25px",
    alignItems: "flex-start"
  },

  filtrosPanelModern: (darkMode) => ({
    width: "320px",
    minWidth: "320px",
    background: darkMode ? "#14141e" : "#fff",
    borderRadius: "16px",
    padding: "22px",
    boxShadow: darkMode ? "0 8px 30px rgba(0,0,0,0.4)" : "0 8px 30px rgba(0,0,0,0.06)",
    border: darkMode ? "1px solid #2d2d3f" : "1px solid #f1f5f9",
    position: "sticky",
    top: "100px",
    overflow: "visible"
  }),

  panelHeader: (darkMode) => ({
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
    paddingBottom: "14px",
    borderBottom: darkMode ? "1px solid #2d2d3f" : "1px solid #f1f5f9"
  }),

  panelIcon: {
    fontSize: "24px"
  },

  panelTitle: (darkMode) => ({
    fontSize: "22px",
    fontWeight: "700",
    color: darkMode ? "#fff" : "#0f172a",
    margin: 0,
    flex: 1
  }),

  filterCountBadge: {
    background: "#6366f1",
    color: "#fff",
    fontSize: "13px",
    fontWeight: "700",
    padding: "3px 10px",
    borderRadius: "12px",
    minWidth: "24px",
    textAlign: "center"
  },

  clearFiltersBtn: (darkMode) => ({
    background: "transparent",
    border: "none",
    color: darkMode ? "#94a3b8" : "#94a3b8",
    fontSize: "18px",
    cursor: "pointer",
    padding: "4px 10px",
    borderRadius: "6px",
    transition: "background 0.2s",
    "&:hover": {
      background: darkMode ? "#2d2d3f" : "#f1f5f9"
    }
  }),

  searchWrapper: {
    position: "relative",
    width: "100%",
    marginBottom: "16px",
    display: "flex",
    alignItems: "center"
  },

  searchIcon: {
    position: "absolute",
    left: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    fontSize: "16px",
    opacity: 0.5,
    zIndex: 1
  },

  searchModern: (darkMode, isMobile) => ({
    width: "100%",
    padding: isMobile ? "14px 40px 14px 40px" : "14px 45px 14px 40px",
    borderRadius: "10px",
    border: darkMode ? "1px solid #2d2d3f" : "1px solid #e2e8f0",
    outline: "none",
    fontSize: isMobile ? "16px" : "16px",
    background: darkMode ? "#0a0a0f" : "#fff",
    color: darkMode ? "#fff" : "#0f172a",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    "&:focus": {
      borderColor: "#6366f1"
    },
    "&::placeholder": {
      fontSize: isMobile ? "15px" : "15px"
    }
  }),

  clearSearchBtn: (darkMode) => ({
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "transparent",
    border: "none",
    color: darkMode ? "#94a3b8" : "#94a3b8",
    cursor: "pointer",
    fontSize: "16px",
    padding: "4px",
    zIndex: 1
  }),

  filterSection: {
    marginBottom: "14px"
  },

  filterGroup: {
    marginBottom: "12px"
  },

  filterLabel: (darkMode) => ({
    fontSize: "14px",
    fontWeight: "600",
    color: darkMode ? "#94a3b8" : "#64748b",
    marginBottom: "6px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  }),

  filterDivider: (darkMode) => ({
    border: "none",
    borderTop: darkMode ? "1px solid #2d2d3f" : "1px solid #f1f5f9",
    margin: "14px 0"
  }),

  checkboxOptionsDesktop: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    maxHeight: "150px",
    overflowY: "auto",
    paddingRight: "4px"
  },

  checkboxOptionDesktop: (darkMode) => ({
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "15px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "6px",
    color: darkMode ? "#e2e8f0" : "#334155",
    transition: "background 0.15s",
    "&:hover": {
      background: darkMode ? "#2d2d3f" : "#f1f5f9"
    }
  }),

  checkboxInput: {
    width: "18px",
    height: "18px",
    accentColor: "#6366f1",
    cursor: "pointer",
    flexShrink: 0
  },

  checkboxInputSmall: {
    width: "15px",
    height: "15px",
    accentColor: "#6366f1",
    cursor: "pointer",
    flexShrink: 0
  },

  checkboxGroupModern: {
    display: "flex",
    gap: "18px",
    marginBottom: "4px",
    flexWrap: "wrap"
  },

  checkboxModern: (darkMode) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontWeight: "500",
    fontSize: "16px",
    cursor: "pointer",
    color: darkMode ? "#e2e8f0" : "#334155",
    "& input[type='checkbox']": {
      width: "20px",
      height: "20px",
      accentColor: "#6366f1",
      cursor: "pointer"
    }
  }),

  checkboxLabel: {
    color: "inherit",
    fontSize: "15px"
  },

  filterGridCompact: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px"
  },

  filterGroupCompact: {
    marginBottom: "6px"
  },

  filterLabelSmall: (darkMode) => ({
    fontSize: "12px",
    fontWeight: "600",
    color: darkMode ? "#94a3b8" : "#64748b",
    marginBottom: "2px",
    textTransform: "uppercase",
    letterSpacing: "0.3px"
  }),

  checkboxOptionsCompact: {
    display: "flex",
    flexDirection: "column",
    gap: "2px"
  },

  checkboxOptionCompact: (darkMode) => ({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "13px",
    cursor: "pointer",
    padding: "2px 6px",
    borderRadius: "4px",
    color: darkMode ? "#e2e8f0" : "#334155",
    transition: "background 0.15s",
    "&:hover": {
      background: darkMode ? "#2d2d3f" : "#f1f5f9"
    }
  }),

  checkboxOptionLabelSmall: {
    fontSize: "13px"
  },

  selectModern: (darkMode, hasValue) => ({
    width: "100%",
    padding: "12px 14px",
    borderRadius: "10px",
    border: darkMode 
      ? (hasValue ? "2px solid #6366f1" : "1px solid #2d2d3f")
      : (hasValue ? "2px solid #6366f1" : "1px solid #e2e8f0"),
    background: darkMode ? "#0a0a0f" : "#fff",
    color: darkMode ? "#fff" : "#0f172a",
    fontWeight: hasValue ? "600" : "400",
    fontSize: "16px",
    outline: "none",
    cursor: "pointer",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
    "&:focus": {
      borderColor: "#6366f1"
    }
  }),

  rangosContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "12px"
  },

  rangoCheckboxGroup: {
    marginBottom: "4px"
  },

  rangoCheckboxLabel: (darkMode) => ({
    fontSize: "14px",
    fontWeight: "600",
    color: darkMode ? "#94a3b8" : "#64748b",
    marginBottom: "4px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  }),

  rangoCheckboxOptions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    maxHeight: "100px",
    overflowY: "auto"
  },

  rangoCheckboxOption: (darkMode) => ({
    display: "flex",
    alignItems: "center",
    gap: "4px",
    fontSize: "12px",
    cursor: "pointer",
    padding: "2px 8px",
    borderRadius: "4px",
    color: darkMode ? "#e2e8f0" : "#334155",
    transition: "background 0.15s",
    "&:hover": {
      background: darkMode ? "#2d2d3f" : "#f1f5f9"
    },
    "& input[type='checkbox']": {
      width: "14px",
      height: "14px",
      accentColor: "#6366f1",
      cursor: "pointer"
    }
  }),

  rangoCheckboxOptionLabel: {
    fontSize: "12px"
  },

  btnResetFilters: (darkMode) => ({
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: "none",
    background: darkMode ? "#2d2d3f" : "#f1f5f9",
    color: darkMode ? "#e2e8f0" : "#334155",
    fontWeight: "600",
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 0.2s",
    marginTop: "6px",
    "&:hover": {
      background: darkMode ? "#3d3d4f" : "#e2e8f0"
    }
  }),

  addToOrderBtn: {
    width: '100%',
    marginTop: '10px',
    padding: '8px 14px',
    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 4px 15px rgba(99, 102, 241, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  productosGridContainer: {
    flex: 1,
    minWidth: 0
  },

  resultsBar: (darkMode) => ({
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px",
    padding: "12px 18px",
    background: darkMode ? "#14141e" : "#fff",
    borderRadius: "12px",
    border: darkMode ? "1px solid #2d2d3f" : "1px solid #f1f5f9"
  }),

  resultsText: (darkMode) => ({
    fontSize: "16px",
    color: darkMode ? "#94a3b8" : "#64748b",
    "& strong": {
      color: darkMode ? "#fff" : "#0f172a",
      fontWeight: "700"
    }
  }),

  resultsBadge: (darkMode) => ({
    fontSize: "15px",
    color: darkMode ? "#94a3b8" : "#64748b",
    background: darkMode ? "#0a0a0f" : "#f8fafc",
    padding: "4px 14px",
    borderRadius: "20px"
  }),

  gridModern: (columns) => ({
    display: "grid",
    gridTemplateColumns: columns,
    gap: "20px"
  }),

  cardModern: (darkMode) => ({
    background: darkMode ? "#14141e" : "#fff",
    borderRadius: "16px",
    overflow: "hidden",
    cursor: "default",
    transition: "transform 0.25s ease, box-shadow 0.25s ease",
    boxShadow: darkMode ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.04)",
    border: darkMode ? "1px solid #2d2d3f" : "1px solid #f1f5f9",
    "&:hover": {
      transform: "translateY(-6px)",
      boxShadow: darkMode ? "0 12px 40px rgba(0,0,0,0.4)" : "0 12px 40px rgba(0,0,0,0.08)"
    }
  }),

  cardImageWrapper: {
    position: "relative",
    width: "100%",
    height: "180px",
    overflow: "hidden",
    background: "#f1f5f9",
    cursor: "pointer"
  },

  cardImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.3s ease",
    "&:hover": {
      transform: "scale(1.05)"
    }
  },

  offerBadge: {
    position: "absolute",
    top: "10px",
    left: "10px",
    background: "#ef4444",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "700",
    padding: "4px 12px",
    borderRadius: "20px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },

  featuredBadge: {
    position: "absolute",
    top: "42px",
    left: "10px",
    background: "#f59e0b",
    color: "#fff",
    fontSize: "11px",
    fontWeight: "700",
    padding: "4px 12px",
    borderRadius: "20px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },

  favBtnModern: {
    position: "absolute",
    top: "10px",
    right: "10px",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    transition: "all 0.2s",
    backdropFilter: "blur(4px)",
    "&:hover": {
      transform: "scale(1.1)"
    }
  },

  compareBtnModern: {
    position: "absolute",
    top: "52px",
    right: "10px",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
    transition: "all 0.2s",
    backdropFilter: "blur(4px)",
    "&:hover": {
      transform: "scale(1.1)"
    }
  },

  cardContent: {
    padding: "16px 18px 18px"
  },

  cardTitle: (darkMode) => ({
    fontSize: "17px",
    fontWeight: "700",
    margin: "0 0 6px 0",
    color: darkMode ? "#fff" : "#0f172a",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    lineHeight: "1.3"
  }),

  cardDesc: (darkMode) => ({
    fontSize: "14px",
    color: darkMode ? "#94a3b8" : "#64748b",
    margin: "0 0 10px 0",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    lineHeight: "1.4"
  }),

  cardTags: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px",
    marginBottom: "10px"
  },

  cardTag: {
    background: "#f1f5f9",
    color: "#64748b",
    padding: "3px 10px",
    borderRadius: "12px",
    fontSize: "11px",
    fontWeight: "600"
  },

  cardPrice: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  priceModern: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#6366f1"
  },

  oldPriceModern: {
    textDecoration: "line-through",
    color: "#94a3b8",
    fontSize: "14px"
  },

  offerPriceModern: {
    fontSize: "22px",
    fontWeight: "800",
    color: "#ef4444"
  },

  highlight: (darkMode) => ({
    background: "#6366f1",
    color: "#fff",
    padding: "2px 6px",
    borderRadius: "4px",
    fontWeight: "700"
  }),

  paginationModern: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    marginTop: "30px",
    marginBottom: "10px"
  },

  pageBtnModern: (disabled, darkMode, active) => ({
    padding: "10px 18px",
    borderRadius: "10px",
    border: "none",
    fontWeight: "600",
    fontSize: "16px",
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1,
    background: active ? "#6366f1" : (darkMode ? "#1e293b" : "#fff"),
    color: active ? "#fff" : (darkMode ? "#e2e8f0" : "#334155"),
    boxShadow: darkMode ? "0 2px 8px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.04)",
    transition: "all 0.2s",
    "&:hover": !disabled && !active ? {
      background: darkMode ? "#2d2d3f" : "#f1f5f9"
    } : {}
  }),

  pageEllipsis: (darkMode) => ({
    color: darkMode ? "#94a3b8" : "#94a3b8",
    fontSize: "18px",
    fontWeight: "600",
    padding: "0 4px"
  }),

  mobileFiltersModern: (darkMode) => ({
    background: darkMode ? "#14141e" : "#fff",
    borderRadius: "14px",
    padding: "14px",
    marginBottom: "15px",
    border: darkMode ? "1px solid #2d2d3f" : "1px solid #f1f5f9",
    boxShadow: darkMode ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.04)"
  }),

  mobileSearchRow: {
    display: "flex",
    gap: "10px"
  },

  mobileFilterBtnModern: (darkMode) => ({
    padding: "12px 16px",
    borderRadius: "10px",
    border: "none",
    fontWeight: "600",
    fontSize: "18px",
    cursor: "pointer",
    transition: "all 0.2s",
    whiteSpace: "nowrap"
  }),

  mobileFiltersContent: (darkMode) => ({
    marginTop: "14px",
    paddingTop: "14px",
    borderTop: darkMode ? "1px solid #2d2d3f" : "1px solid #f1f5f9"
  }),

  mobileFilterSection: {
    marginBottom: "12px"
  },

  mobileFilterLabel: {
    fontSize: "14px",
    fontWeight: "600",
    color: "#64748b",
    marginBottom: "6px"
  },

  mobileCheckboxGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "4px"
  },

  mobileCheckboxLabel: (darkMode) => ({
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "14px",
    cursor: "pointer",
    padding: "4px 8px",
    borderRadius: "6px",
    color: darkMode ? "#e2e8f0" : "#334155",
    "& input[type='checkbox']": {
      width: "16px",
      height: "16px",
      accentColor: "#6366f1",
      cursor: "pointer"
    }
  }),

  mobileFilterGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "10px",
    marginBottom: "12px"
  },

  mobileSelectModern: (darkMode, hasValue) => ({
    width: "100%",
    padding: "12px",
    borderRadius: "10px",
    border: darkMode 
      ? (hasValue ? "2px solid #6366f1" : "1px solid #2d2d3f")
      : (hasValue ? "2px solid #6366f1" : "1px solid #e2e8f0"),
    background: darkMode ? "#0a0a0f" : "#fff",
    color: darkMode ? "#fff" : "#0f172a",
    fontWeight: hasValue ? "600" : "400",
    fontSize: "15px",
    outline: "none",
    cursor: "pointer",
    boxSizing: "border-box",
    "&:focus": {
      borderColor: "#6366f1"
    }
  }),

  mobileCheckboxGroup: {
    display: "flex",
    gap: "15px",
    marginTop: "8px",
    marginBottom: "12px"
  },

  mobileDetails: (darkMode) => ({
    marginTop: "10px",
    border: darkMode ? "1px solid #2d2d3f" : "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "6px 10px"
  }),

  mobileSummary: (darkMode) => ({
    fontWeight: "600",
    cursor: "pointer",
    color: darkMode ? "#e2e8f0" : "#334155",
    fontSize: "15px",
    padding: "8px 0",
    "&:hover": {
      color: "#6366f1"
    }
  }),

  mobileDetailsContent: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    padding: "10px 0"
  },

  compareBarModern: (darkMode, isMobile) => ({
    position: "fixed",
    bottom: isMobile ? "10px" : "20px",
    left: "50%",
    transform: "translateX(-50%)",
    background: darkMode ? "#14141e" : "#fff",
    padding: isMobile ? "10px 14px" : "14px 24px",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: isMobile ? "12px" : "24px",
    width: isMobile ? "calc(100% - 20px)" : "auto",
    maxWidth: "95%",
    zIndex: 999,
    boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
    border: darkMode ? "1px solid #2d2d3f" : "1px solid #f1f5f9"
  }),

  compareItemsModern: (isMobile) => ({
    display: "flex",
    gap: isMobile ? "8px" : "12px",
    overflowX: "auto",
    flex: 1,
    padding: "4px 0"
  }),

  compareItemModern: (darkMode) => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: darkMode ? "#fff" : "#0f172a",
    flexShrink: 0
  }),

  compareImageModern: (isMobile) => ({
    width: isMobile ? "34px" : "44px",
    height: isMobile ? "34px" : "44px",
    objectFit: "cover",
    borderRadius: "8px",
    border: "1px solid #f1f5f9",
    flexShrink: 0
  }),

  compareName: {
    fontSize: "14px",
    fontWeight: "500"
  },

  compareActionModern: (isMobile) => ({
    background: "#6366f1",
    color: "#fff",
    border: "none",
    padding: isMobile ? "10px 16px" : "12px 24px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: "700",
    fontSize: isMobile ? "14px" : "16px",
    whiteSpace: "nowrap",
    flexShrink: 0,
    transition: "all 0.2s",
    "&:hover": {
      background: "#4f46e5"
    }
  })
};