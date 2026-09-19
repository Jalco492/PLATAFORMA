import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import jsPDF from "jspdf";
import api from "../services/api";

// 🔥 FUNCIÓN PARA GENERAR URL DE IMAGEN
const getImageUrl = (imagen) => {
  if (!imagen) return "https://via.placeholder.com/200?text=Sin+imagen";
  if (imagen.startsWith("http://") || imagen.startsWith("https://")) return imagen;
  const API_BASE = process.env.REACT_APP_API_URL || 'https://backend-zuib.onrender.com';
  if (imagen.startsWith("/")) return `${API_BASE}${imagen}`;
  return `${API_BASE}/${imagen}`;
};

const obtenerImagenProducto = (producto) => {
  if (!producto) return "https://via.placeholder.com/200?text=Sin+imagen";
  let imagenUrl = "";
  if (producto.imagenes && producto.imagenes.trim() !== "") {
    imagenUrl = producto.imagenes.split(",")[0].trim();
  } else if (producto.imagen && producto.imagen.trim() !== "") {
    imagenUrl = producto.imagen.trim();
  } else {
    return "https://via.placeholder.com/200?text=Sin+imagen";
  }
  return getImageUrl(imagenUrl);
};

const convertirImagenBase64 = async (url) => {
  try {
    if (!url) return null;
    if (url.includes("placeholder")) return null;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error convirtiendo imagen a base64:', error);
    return null;
  }
};

// 🔥 CONVERSIÓN DE UNIDADES
const convertirAMetrosConUnidad = (valor, unidad = 'cm') => {
  const num = Number(valor) || 0;
  if (num === 0) return 0;
  const u = (unidad || 'cm').toLowerCase().trim();
  if (u === 'm' || u === 'mt' || u === 'mts' || u === 'metro' || u === 'metros') return num;
  if (u === 'mm' || u === 'milimetro' || u === 'milimetros') return num / 1000;
  if (u === 'cm' || u === 'centimetro' || u === 'centimetros') return num / 100;
  return num / 100;
};

export default function Cotizador() {
  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [mensajeEnviado, setMensajeEnviado] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [imagenGuiaZoom, setImagenGuiaZoom] = useState(null);

  const [cliente, setCliente] = useState({
    nombre: "",
    correo: "",
    celular: ""
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // ============================================================
  // 🔥 TIPOS QUE SOLO PERMITEN INGRESAR CANTIDAD
  // ============================================================
  const esSoloCantidad = (tipoVenta) => {
    return ["pieza", "paquete", "otros", "unidad", "presentacion"].includes(tipoVenta);
  };

  // ============================================================
  // 🔥 MODOS PERMITIDOS POR TIPO DE VENTA
  // ============================================================
  const getModosPermitidos = (tipoVenta) => {
    if (esSoloCantidad(tipoVenta)) return ["cantidad"];
    switch (tipoVenta) {
      case "metro_cuadrado":
        return ["largoAncho", "area"];
      case "metro_lineal":
        return ["largoAncho", "metrosLineales"];
      case "caja":
        return ["largoAncho", "area"];
      case "tramo":
        return ["metrosLineales"];
      default:
        return ["cantidad"];
    }
  };

  const crearAreaInicial = (tipoVenta) => {
    const modo = getModosPermitidos(tipoVenta)[0];
    if (modo === "cantidad") return { modo: "cantidad", cantidad: "", usar: true };
    if (modo === "metrosLineales") return { modo: "metrosLineales", metrosLineales: "", usar: true };
    if (modo === "area") return { modo: "area", area: "", usar: true };
    return { modo: "largoAncho", largo: "", ancho: "", usar: true };
  };

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const guardados = JSON.parse(localStorage.getItem("cotizador")) || [];
        if (guardados.length === 0) {
          setProductos([]);
          return;
        }

        const res = await api.get("/productos");

        const combinados = guardados
          .map((guardado) => {
            const productoBD = res.data.find((prod) => prod.id === guardado.id);
            if (!productoBD) return null;

            const areasForzadas = esSoloCantidad(productoBD.tipoVenta)
              ? [{ modo: "cantidad", cantidad: "", usar: true }]
              : (guardado.areas?.length
                  ? guardado.areas
                  : [crearAreaInicial(productoBD.tipoVenta)]);

            return {
              ...productoBD,
              desperdicio: esSoloCantidad(productoBD.tipoVenta) ? 0 : (guardado.desperdicio ?? 10),
              areas: areasForzadas
            };
          })
          .filter(Boolean);

        setProductos(combinados);
      } catch (error) {
        console.log(error);
      }
    };

    cargarProductos();
  }, []);

  useEffect(() => {
    api.get("/categorias").then((res) => setCategorias(res.data)).catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    api.get("/subcategorias").then((res) => setSubcategorias(res.data)).catch((err) => console.log(err));
  }, []);

  const guardar = (lista) => {
    setProductos(lista);
    localStorage.setItem("cotizador", JSON.stringify(lista));
  };

  // ============================================================
  // 🔥 ANCHO Y LARGO DEL ROLLO
  // ============================================================
  const obtenerAnchoRollo = (producto) => {
    if (!producto) return 0;

    if (producto.tipoVenta === "metro_cuadrado") {
      const alto = Number(producto.alto) || 0;
      if (alto > 0) {
        if (alto > 100) return alto / 100;
        return alto;
      }
      const anchoProd = Number(producto.anchoProducto) || 0;
      if (anchoProd > 0) return anchoProd;
      return convertirAMetrosConUnidad(producto.ancho, producto.unidadAncho || 'm');
    }

    if (producto.tipoVenta === "metro_lineal") {
      const anchoProd = Number(producto.anchoProducto) || 0;
      if (anchoProd > 0) return anchoProd;
      const ancho = Number(producto.ancho) || 0;
      if (ancho > 0) {
        if (ancho > 100) return ancho / 100;
        return ancho;
      }
      return convertirAMetrosConUnidad(producto.ancho, producto.unidadAncho || 'm');
    }

    return 0;
  };

  const obtenerLargoRollo = (producto) => {
    const metrosRollo = Number(producto?.metrosPorRollo) || 0;
    if (metrosRollo > 0) return metrosRollo;
    const metrosCuad = Number(producto?.metrosCuadrados) || 0;
    const ancho = obtenerAnchoRollo(producto);
    if (metrosCuad > 0 && ancho > 0) return metrosCuad / ancho;
    return 0;
  };

  // ============================================================
  // 🔥 INFO DE PRESENTACIÓN / RINDE POR UNIDAD
  // ============================================================
  /**
   * Devuelve un array de { icono, label, valor } con la info
   * relevante del producto (piezas, rinde, cobertura, etc.)
   */
  const obtenerInfoPresentacion = (p) => {
    if (!p) return [];
    const t = p.tipoVenta;
    const info = [];

    // 🔹 Piezas por caja/paquete
    if ((t === "caja" || t === "paquete") && p.piezasCaja) {
      info.push({
        icono: "📦",
        label: `Piezas por ${t}`,
        valor: `${p.piezasCaja} pz`
      });
    }

    // 🔹 Medidas por pieza (caja, paquete, pieza)
    if ((t === "caja" || t === "paquete" || t === "pieza") && p.ancho && p.alto) {
      const unidadA = p.unidadAncho || 'cm';
      const unidadAl = p.unidadAlto || 'cm';
      info.push({
        icono: "📐",
        label: "Medida por pieza",
        valor: `${p.ancho}${unidadA} × ${p.alto}${unidadAl}`
      });
    }

    // 🔹 Cobertura / rinde declarado
    if (p.cobertura && Number(p.cobertura) > 0) {
      const tipoUnidad = 
        t === "paquete" ? "paquete" :
        t === "caja" ? "caja" :
        t === "pieza" ? "pieza" :
        t === "unidad" ? "unidad" :
        t === "presentacion" ? "presentación" :
        p.presentacion || "unidad";
      info.push({
        icono: "📊",
        label: `Rinde por ${tipoUnidad}`,
        valor: `${Number(p.cobertura).toFixed(2)} m²`
      });
    }

    // 🔹 Presentación declarada
    if (p.presentacion) {
      info.push({
        icono: "🏷️",
        label: "Presentación",
        valor: p.presentacion
      });
    }

    // 🔹 Grosor
    if (p.grueso && (t === "pieza" || t === "paquete" || t === "caja" || t === "otros")) {
      info.push({
        icono: "📏",
        label: "Grosor",
        valor: `${p.grueso} ${p.unidadGrueso || 'mm'}`
      });
    }

    return info;
  };

  // ============================================================
  // 🔥 EXTRAER VALORES
  // ============================================================
  const extraerArea = (area) => {
    if (!area || area.usar === false) return 0;
    if (area.modo === "area") return Number(area.area) || 0;
    if (area.modo === "largoAncho") {
      const largo = Number(area.largo) || 0;
      const ancho = Number(area.ancho) || 0;
      return largo * ancho;
    }
    return 0;
  };

  const extraerMetrosLineales = (area) => {
    if (!area || area.usar === false) return 0;
    if (area.modo === "metrosLineales") return Number(area.metrosLineales) || 0;
    return 0;
  };

  const extraerCantidad = (area) => {
    if (!area || area.usar === false) return 0;
    if (area.modo === "cantidad") return Number(area.cantidad) || 0;
    return 0;
  };

  // ============================================================
  // 🔥 MOTOR DE CÁLCULO PRINCIPAL
  // ============================================================
  const calcular = (p) => {
    const tipo = p.tipoVenta || "otros";
    const precio = Number(p.oferta ? p.precioOferta : p.precio) || 0;
    const areas = p.areas || [];
    const desperdicio = esSoloCantidad(tipo) ? 0 : (parseFloat(p.desperdicio) || 0);

    // -------- TIPOS POR CANTIDAD --------
    if (esSoloCantidad(tipo)) {
      const cantidad = areas.reduce((acc, a) => acc + extraerCantidad(a), 0);
      const coberturaPorUnidad = Number(p.cobertura) || 0;
      const areaCubierta = cantidad * coberturaPorUnidad;
      const total = cantidad * precio;

      return {
        tipo,
        area: areaCubierta,
        desperdicio: 0,
        areaConDesc: areaCubierta,
        ancho: 0,
        alto: 0,
        piezasCaja: Number(p.piezasCaja) || 0,
        coberturaPieza: coberturaPorUnidad,
        coberturaUnidad: coberturaPorUnidad,
        cantidad,
        metrosLineales: 0,
        equivalenciaRollos: 0,
        precio,
        total
      };
    }

    // -------- TRAMO --------
    if (tipo === "tramo") {
      const metrosIngresados = areas.reduce((acc, a) => acc + extraerMetrosLineales(a), 0);
      const metrosConDesp = metrosIngresados * (1 + desperdicio / 100);
      const total = metrosConDesp * precio;

      return {
        tipo,
        area: 0,
        desperdicio,
        areaConDesc: 0,
        ancho: 0,
        alto: 0,
        piezasCaja: 1,
        coberturaPieza: 0,
        coberturaUnidad: 0,
        cantidad: metrosConDesp,
        metrosLineales: metrosConDesp,
        equivalenciaRollos: 0,
        precio,
        total
      };
    }

    // -------- METRO CUADRADO --------
    if (tipo === "metro_cuadrado") {
      const areaIngresada = areas.reduce((acc, a) => acc + extraerArea(a), 0);
      const areaConDesp = areaIngresada * (1 + desperdicio / 100);
      const anchoRollo = obtenerAnchoRollo(p);
      const metrosLineales = anchoRollo > 0 ? areaConDesp / anchoRollo : 0;
      const total = areaConDesp * precio;

      return {
        tipo,
        area: areaIngresada,
        desperdicio,
        areaConDesc: areaConDesp,
        ancho: anchoRollo,
        alto: obtenerLargoRollo(p),
        piezasCaja: 1,
        coberturaPieza: 0,
        coberturaUnidad: Number(p.metrosCuadrados) || 0,
        cantidad: metrosLineales,
        metrosLineales,
        equivalenciaRollos: 0,
        precio,
        total
      };
    }

    // -------- METRO LINEAL --------
    if (tipo === "metro_lineal") {
      const anchoRollo = obtenerAnchoRollo(p);
      let areaTotal = 0;
      let metrosDirectos = 0;

      areas.forEach((a) => {
        if (a.usar === false) return;
        if (a.modo === "metrosLineales") {
          metrosDirectos += Number(a.metrosLineales) || 0;
        } else if (a.modo === "largoAncho") {
          const largo = Number(a.largo) || 0;
          const ancho = Number(a.ancho) || 0;
          areaTotal += largo * ancho;
        }
      });

      let metrosDesdeArea = 0;
      if (areaTotal > 0 && anchoRollo > 0) {
        const areaConDesp = areaTotal * (1 + desperdicio / 100);
        metrosDesdeArea = areaConDesp / anchoRollo;
      }

      const metrosDirectosConDesp = metrosDirectos * (1 + desperdicio / 100);
      const metrosTotales = metrosDesdeArea + metrosDirectosConDesp;
      const total = metrosTotales * precio;

      return {
        tipo,
        area: areaTotal,
        desperdicio,
        areaConDesc: areaTotal * (1 + desperdicio / 100),
        ancho: anchoRollo,
        alto: 0,
        piezasCaja: 1,
        coberturaPieza: 0,
        coberturaUnidad: 0,
        cantidad: metrosTotales,
        metrosLineales: metrosTotales,
        equivalenciaRollos: 0,
        precio,
        total
      };
    }

    // -------- CAJA --------
    if (tipo === "caja") {
      const areaIngresada = areas.reduce((acc, a) => acc + extraerArea(a), 0);
      const areaConDesp = areaIngresada * (1 + desperdicio / 100);
      const anchoM = convertirAMetrosConUnidad(p.ancho, p.unidadAncho || 'cm');
      const altoM = convertirAMetrosConUnidad(p.alto, p.unidadAlto || 'cm');
      const coberturaPieza = anchoM * altoM;
      const piezas = Number(p.piezasCaja) || 1;
      const coberturaUnidad = coberturaPieza * piezas;
      const cantidad = coberturaUnidad > 0 ? Math.ceil(areaConDesp / coberturaUnidad) : 0;
      const total = cantidad * precio;

      return {
        tipo,
        area: areaIngresada,
        desperdicio,
        areaConDesc: areaConDesp,
        ancho: anchoM,
        alto: altoM,
        piezasCaja: piezas,
        coberturaPieza: coberturaPieza,
        coberturaUnidad,
        cantidad,
        metrosLineales: 0,
        equivalenciaRollos: 0,
        precio,
        total
      };
    }

    // Fallback
    const cantidadFallback = areas.reduce((acc, a) => acc + extraerCantidad(a), 0);
    return {
      tipo,
      area: 0,
      desperdicio: 0,
      areaConDesc: 0,
      ancho: 0,
      alto: 0,
      piezasCaja: 1,
      coberturaPieza: 0,
      coberturaUnidad: 0,
      cantidad: cantidadFallback,
      metrosLineales: 0,
      equivalenciaRollos: 0,
      precio,
      total: cantidadFallback * precio
    };
  };

  const eliminarProducto = (id) => {
    const nuevos = productos.filter((p) => p.id !== id);
    guardar(nuevos);
    window.dispatchEvent(new Event("cotizadorActualizado"));
  };

  const totalGeneral = productos.reduce((acc, p) => acc + calcular(p).total, 0);

  // 🔥 MEMBRETADOS
  const agregarMembretadoPortada = async (pdf) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    try {
      const fondo = await convertirImagenBase64(window.location.origin + "/membreteuno.jpg");
      if (fondo) pdf.addImage(fondo, "JPEG", 0, 0, pageWidth, pageHeight);
    } catch (error) {
      console.log("Error cargando membrete de portada:", error);
    }
  };

  const agregarMembretadoInterno = async (pdf) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    try {
      const fondo = await convertirImagenBase64(window.location.origin + "/membretedos.jpg");
      if (fondo) pdf.addImage(fondo, "JPEG", 0, 0, pageWidth, pageHeight);
    } catch (error) {
      console.log("Error cargando membrete interno:", error);
    }
  };

  const verificarSaltoPagina = async (pdf, y, espacioNecesario) => {
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (y + espacioNecesario > pageHeight - 25) {
      pdf.addPage();
      await agregarMembretadoInterno(pdf);
      return 65;
    }
    return y;
  };

  // ============================================================
  // 🔥 GENERAR PDF
  // ============================================================
  const generarPDF = async () => {
    try {
      setEnviando(true);
      const pdf = new jsPDF("p", "mm", "a4");

      await agregarMembretadoPortada(pdf);

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const numeroCotizacion = Math.floor(100000 + Math.random() * 900000);
      const fechaActual = new Date().toLocaleDateString("es-MX");

      pdf.text(`Cotización #${numeroCotizacion}`, pageWidth - 60, 23);
      let y = 65;
      pdf.setFontSize(10);
      pdf.setTextColor(80);
      pdf.text(`Fecha: ${fechaActual}`, pageWidth - 55, 58);

      pdf.setDrawColor(200);
      pdf.line(15, 55, pageWidth - 15, 55);
      y = 70;

      for (let i = 0; i < productos.length; i++) {
        const producto = productos[i];
        const r = calcular(producto);
        const tipo = producto.tipoVenta || "otros";

        if (y > 220) {
          pdf.addPage();
          await agregarMembretadoInterno(pdf);
          y = 20;
        }

        // IMAGEN
        try {
          const imagenBase64 = await convertirImagenBase64(obtenerImagenProducto(producto));
          if (imagenBase64) {
            pdf.addImage(imagenBase64, "JPEG", 15, y, 50, 50);
          } else {
            pdf.setFontSize(10);
            pdf.setTextColor(150);
            pdf.text("Imagen no disponible", 15, y + 25);
          }
        } catch {
          pdf.setFontSize(10);
          pdf.setTextColor(150);
          pdf.text("Imagen no disponible", 15, y + 25);
        }

        // DATOS PRODUCTO
        y = await verificarSaltoPagina(pdf, y, 70);
        pdf.setFontSize(14);
        pdf.setTextColor(40);
        pdf.text(`Producto: ${producto.nombre}`, 75, y + 10);
        pdf.text(`Categoría: ${producto.categoria || "-"}`, 75, y + 20);
        pdf.text(`Subcategoría: ${producto.subcategoria || "-"}`, 75, y + 30);
        pdf.text(`SKU: ${producto.sku || "-"}`, 75, y + 40);

        y = await verificarSaltoPagina(pdf, y, 70);
        pdf.setFontSize(20);
        pdf.setTextColor(22, 163, 74);
        pdf.text(`$${r.total.toFixed(2)}`, 75, y + 55);
        y += 65;

        // RESUMEN
        y = await verificarSaltoPagina(pdf, y, 70);
        pdf.setFontSize(18);
        pdf.setTextColor(0);
        pdf.text("Resumen de Cotización", 15, y);
        y += 10;

        pdf.setFillColor(245, 247, 250);
        pdf.roundedRect(15, y, pageWidth - 30, 55, 3, 3, "F");
        y = await verificarSaltoPagina(pdf, y, 70);
        pdf.setFontSize(11);
        pdf.setTextColor(60);

        if (esSoloCantidad(tipo)) {
          pdf.text(`Presentación: ${producto.presentacion || tipo}`, 20, y + 8);
          if (r.piezasCaja > 0) {
            pdf.text(`Piezas por ${tipo}: ${r.piezasCaja} pz`, 20, y + 18);
          }
          if (r.coberturaUnidad > 0) {
            pdf.text(`Rinde por ${tipo}: ${r.coberturaUnidad.toFixed(2)} m²`, 20, y + 28);
          }
          pdf.text(`Cantidad: ${r.cantidad} ${tipo}(s)`, 20, y + 38);
          if (r.areaConDesc > 0) {
            pdf.text(`Área total cubierta: ${r.areaConDesc.toFixed(2)} m²`, 20, y + 48);
          }
        } else if (tipo === "metro_cuadrado") {
          pdf.text(`Área a cubrir: ${r.area.toFixed(2)} m²`, 20, y + 8);
          pdf.text(`Desperdicio: ${r.desperdicio}%`, 20, y + 18);
          pdf.text(`Área final: ${r.areaConDesc.toFixed(2)} m²`, 20, y + 28);
          pdf.text(`Ancho del rollo: ${r.ancho.toFixed(2)} m`, 20, y + 38);
          pdf.text(`Material necesario: ${r.metrosLineales.toFixed(2)} ml`, 20, y + 48);
        } else if (tipo === "metro_lineal") {
          pdf.text(`Ancho del rollo: ${r.ancho.toFixed(2)} m`, 20, y + 8);
          if (r.area > 0) {
            pdf.text(`Área a cubrir: ${r.area.toFixed(2)} m²`, 20, y + 18);
            pdf.text(`Desperdicio: ${r.desperdicio}%`, 20, y + 28);
            pdf.text(`Material necesario: ${r.metrosLineales.toFixed(2)} ml`, 20, y + 38);
          } else {
            pdf.text(`Desperdicio: ${r.desperdicio}%`, 20, y + 18);
            pdf.text(`Material necesario: ${r.metrosLineales.toFixed(2)} ml`, 20, y + 28);
          }
        } else if (tipo === "caja") {
          pdf.text(`Área a cubrir: ${r.area.toFixed(2)} m²`, 20, y + 8);
          pdf.text(`Desperdicio: ${r.desperdicio}%`, 20, y + 18);
          pdf.text(`Piezas por caja: ${r.piezasCaja}`, 20, y + 28);
          pdf.text(`Cobertura por caja: ${r.coberturaUnidad.toFixed(2)} m²`, 20, y + 38);
          pdf.text(`Material necesario: ${r.cantidad} cajas`, 20, y + 48);
        } else if (tipo === "tramo") {
          pdf.text(`Material necesario: ${r.cantidad.toFixed(2)} m`, 20, y + 8);
        }
        y += 70;

        // DETALLE
        pdf.setFontSize(14);
        pdf.setTextColor(30);
        pdf.text("Detalle", 15, y);
        y += 4;
        y = await verificarSaltoPagina(pdf, y, 70);
        pdf.setFontSize(11);
        pdf.setTextColor(70);

        const areasActivas = (producto.areas || []).filter(a => a.usar !== false);

        if (areasActivas.length > 0) {
          areasActivas.forEach((area, index) => {
            if (area.modo === "cantidad") {
              pdf.text(`Cantidad ${index + 1}: ${Number(area.cantidad || 0)} unidades`, 20, y);
            } else if (area.modo === "metrosLineales") {
              pdf.text(`Tramo ${index + 1}: ${Number(area.metrosLineales || 0).toFixed(2)} ml`, 20, y);
            } else if (area.modo === "area") {
              pdf.text(`Área ${index + 1}: ${Number(area.area || 0).toFixed(2)} m²`, 20, y);
            } else if (area.modo === "largoAncho") {
              const largo = Number(area.largo || 0);
              const ancho = Number(area.ancho || 0);
              pdf.text(`Área ${index + 1}: ${largo}m × ${ancho}m = ${(largo * ancho).toFixed(2)} m²`, 20, y);
            }
            y += 8;
          });
        } else {
          pdf.text("No hay cantidades ingresadas.", 20, y);
          y += 8;
        }
        y += 5;

        // NOTA
        let notaProducto = "";
        if (esSoloCantidad(tipo)) {
          let detalle = `Producto por ${tipo}`;
          if (producto.presentacion) detalle += ` (${producto.presentacion})`;
          detalle += `. Se cotizan ${r.cantidad} unidades a $${r.precio.toFixed(2)} c/u.`;
          if (r.coberturaUnidad > 0 && r.areaConDesc > 0) {
            detalle += ` Rinde por unidad: ${r.coberturaUnidad.toFixed(2)} m². Cobertura total: ${r.areaConDesc.toFixed(2)} m².`;
          }
          notaProducto = detalle;
        } else if (tipo === "metro_cuadrado") {
          notaProducto =
            `Producto por metro cuadrado (rollo). Ancho del rollo: ${r.ancho.toFixed(2)} m. ` +
            `Para cubrir ${r.areaConDesc.toFixed(2)} m² necesitas ${r.metrosLineales.toFixed(2)} metros lineales.`;
        } else if (tipo === "metro_lineal") {
          if (r.area > 0 && r.ancho > 0) {
            notaProducto =
              `Producto por metro lineal. Área a cubrir: ${r.area.toFixed(2)} m². ` +
              `Ancho del rollo: ${r.ancho.toFixed(2)} m. ` +
              `Total de metros lineales a cotizar: ${r.metrosLineales.toFixed(2)} ml.`;
          } else {
            notaProducto = `Producto por metro lineal. Total: ${r.metrosLineales.toFixed(2)} ml.`;
          }
        } else if (tipo === "caja") {
          notaProducto = `Cada caja contiene ${r.piezasCaja} piezas y cubre ${r.coberturaUnidad.toFixed(2)} m². Necesitas ${r.cantidad} cajas.`;
        } else if (tipo === "tramo") {
          notaProducto = `Venta por tramo. Total: ${r.cantidad.toFixed(2)} m.`;
        }

        const lineasNota = pdf.splitTextToSize(notaProducto, pageWidth - 45);
        const altoNota = lineasNota.length * 5 + 12;

        if (y + altoNota > pageHeight - 50) {
          pdf.addPage();
          await agregarMembretadoInterno(pdf);
          y = 50;
        }

        pdf.setFillColor(255, 248, 200);
        pdf.roundedRect(15, y, pageWidth - 30, altoNota, 3, 3, "F");
        y = await verificarSaltoPagina(pdf, y, 70);
        pdf.setFontSize(10);
        pdf.setTextColor(90);
        pdf.text(lineasNota, 20, y + 8);
        y += altoNota + 15;

        // CONDICIONES
        y = await verificarSaltoPagina(pdf, y, 70);
        pdf.setFontSize(14);
        pdf.setTextColor(30);
        pdf.text("Condiciones Comerciales", 15, y);
        y += 10;
        const condiciones = [
          "• Precios sujetos a cambios sin previo aviso.",
          "• Vigencia de la cotización: 15 días.",
          "• Material sujeto a disponibilidad.",
          "• No incluye instalación ni envío salvo indicación expresa."
        ];
        pdf.setFontSize(10);
        pdf.setTextColor(90);
        condiciones.forEach(item => {
          pdf.text(item, 20, y);
          y += 7;
        });
        y += 10;

        pdf.setDrawColor(220);
        pdf.line(15, y, pageWidth - 15, y);
        y += 12;
      }

      // TOTAL GENERAL
      const totalGeneralCalc = productos.reduce((acc, p) => acc + calcular(p).total, 0);
      if (y > pageHeight - 80) {
        pdf.addPage();
        await agregarMembretadoInterno(pdf);
        y = 20;
      }

      pdf.setFillColor(22, 163, 74);
      pdf.roundedRect(15, y, pageWidth - 30, 18, 3, 3, "F");
      pdf.setTextColor(255);
      y = await verificarSaltoPagina(pdf, y, 70);
      pdf.setFontSize(18);
      pdf.text(`TOTAL ESTIMADO: $${totalGeneralCalc.toFixed(2)}`, 20, y + 12);
      y += 35;

      // DATOS CLIENTE
      y = await verificarSaltoPagina(pdf, y, 70);
      pdf.setFontSize(16);
      pdf.setTextColor(0);
      pdf.text("Datos del Cliente", 15, y);
      y += 12;
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(15, y, pageWidth - 30, 28, 3, 3, "F");
      pdf.setFontSize(11);
      pdf.text(`Nombre: ${cliente.nombre || "-"}`, 20, y + 8);
      pdf.text(`Correo: ${cliente.correo || "-"}`, 20, y + 16);
      pdf.text(`Celular: ${cliente.celular || "-"}`, 20, y + 24);

      const pdfBase64 = pdf.output("datauristring");
      await api.post("/enviar-cotizacion", {
        nombre: cliente.nombre,
        correo: cliente.correo,
        celular: cliente.celular,
        producto: "Cotización múltiple",
        total: totalGeneralCalc,
        pdf: pdfBase64
      });

      setMensajeEnviado("✅ La cotización fue enviada a tu correo");
      setCliente({ nombre: "", correo: "", celular: "" });

      setTimeout(() => {
        setMostrarFormulario(false);
        setMensajeEnviado("");
      }, 3000);

    } catch (error) {
      console.error("❌ Error generando cotización:", error);
      alert("❌ Error generando cotización. Por favor, intenta de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  const agregarArea = (indexProducto) => {
    const copia = [...productos];
    const tipo = copia[indexProducto].tipoVenta;
    copia[indexProducto].areas.push(crearAreaInicial(tipo));
    guardar(copia);
  };

  const eliminarArea = (indexProducto, indexArea) => {
    const copia = [...productos];
    copia[indexProducto].areas = copia[indexProducto].areas.filter((_, i) => i !== indexArea);
    if (copia[indexProducto].areas.length === 0) {
      copia[indexProducto].areas = [crearAreaInicial(copia[indexProducto].tipoVenta)];
    }
    guardar(copia);
  };

  const actualizarArea = (indexProducto, indexArea, campo, valor) => {
    const copia = [...productos];
    copia[indexProducto].areas[indexArea][campo] = valor;
    guardar(copia);
  };

  const cambiarModo = (indexProducto, indexArea, nuevoModo) => {
    const copia = [...productos];
    const areaActual = copia[indexProducto].areas[indexArea];
    let nuevaArea = { modo: nuevoModo, usar: areaActual.usar ?? true };
    if (nuevoModo === "cantidad") nuevaArea.cantidad = "";
    else if (nuevoModo === "metrosLineales") nuevaArea.metrosLineales = "";
    else if (nuevoModo === "area") nuevaArea.area = "";
    else if (nuevoModo === "largoAncho") { nuevaArea.largo = ""; nuevaArea.ancho = ""; }
    copia[indexProducto].areas[indexArea] = nuevaArea;
    guardar(copia);
  };

  const irAProductos = () => navigate("/productos");

  // ============================================================
  // 🎨 RENDER
  // ============================================================
  return (
    <div
      style={{
        minHeight: "100vh",
        background: darkMode ? "#111827" : "#f4f6f9",
        padding: "0 0 1px 0"
      }}
    >
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        productos={productos}
        favoritos={[]}
        toggleFavorito={() => {}}
        esFavorito={() => false}
        categorias={categorias}
        subcategorias={subcategorias}
      />

      <div
        className="cotizador-container"
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "90px 16px 40px"
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "30px",
            color: darkMode ? "#fff" : "#111827",
            fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
            fontWeight: "700"
          }}
        >
          Cotizador de Productos
        </h1>

        {/* GUÍA */}
        <div
          style={{
            background: darkMode ? "#1f2937" : "#fff",
            padding: "20px",
            borderRadius: "18px",
            marginBottom: "20px",
            boxShadow: "0 6px 20px rgba(0,0,0,.08)"
          }}
        >
          <h2 style={{ color: darkMode ? "#fff" : "#111827", fontSize: "clamp(1.1rem, 2.5vw, 1.5rem)" }}>
            📏 ¿Cómo se calculan los metros cuadrados?
          </h2>
          <p style={{ color: darkMode ? "#d1d5db" : "#374151", fontSize: "clamp(0.9rem, 1.8vw, 1rem)" }}>
            Para productos por <strong>metro cuadrado</strong> o <strong>metro lineal</strong> puedes ingresar largo × ancho o el área directa.
            Para productos por <strong>pieza</strong>, <strong>paquete</strong>, <strong>unidad</strong> u <strong>otros</strong>, solo ingresa la cantidad.
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "15px",
              marginTop: "15px"
            }}
          >
            <img
              src="/areasplanas.png"
              alt="Ejemplo cálculo 1"
              style={{
                width: "100%",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                maxHeight: "200px",
                objectFit: "contain",
                cursor: "zoom-in"
              }}
              onClick={() => setImagenGuiaZoom("/areasplanas.png")}
            />
            <img
              src="/paredes.png"
              alt="Ejemplo cálculo 2"
              style={{
                width: "100%",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                maxHeight: "200px",
                objectFit: "contain",
                cursor: "zoom-in"
              }}
              onClick={() => setImagenGuiaZoom("/paredes.png")}
            />
          </div>
        </div>

        <button
          style={{
            background: "#16a34a",
            color: "#fff",
            border: "none",
            padding: "16px 24px",
            borderRadius: "14px",
            fontWeight: "bold",
            fontSize: "clamp(1rem, 2vw, 1.1rem)",
            cursor: "pointer",
            display: "block",
            margin: "0 auto 30px auto",
            width: "100%",
            maxWidth: "320px",
            touchAction: "manipulation"
          }}
          onClick={irAProductos}
        >
          ➕ Agregar productos
        </button>

        {/* LISTA DE PRODUCTOS */}
        {productos.map((p, i) => {
          const r = calcular(p);
          const imagenUrl = obtenerImagenProducto(p);
          const tipo = p.tipoVenta || "otros";
          const soloCantidad = esSoloCantidad(tipo);
          const infoPresentacion = obtenerInfoPresentacion(p);

          const tipoAmigable =
            tipo === "metro_cuadrado" ? "Metro cuadrado" :
            tipo === "metro_lineal" ? "Metro lineal" :
            tipo === "caja" ? "Caja" :
            tipo === "paquete" ? "Paquete" :
            tipo === "pieza" ? "Pieza" :
            tipo === "unidad" ? "Unidad" :
            tipo === "presentacion" ? "Presentación" :
            tipo === "tramo" ? "Tramo" : "Otros";

          const modosPermitidos = getModosPermitidos(tipo);

          return (
            <div
              key={p.id}
              style={{
                background: darkMode ? "#1f2937" : "#fff",
                borderRadius: "18px",
                padding: "clamp(16px, 2.5vw, 25px)",
                marginBottom: "20px",
                boxShadow: "0 6px 20px rgba(0,0,0,.08)",
                border: darkMode ? "1px solid #374151" : "1px solid #e5e7eb"
              }}
            >
              {/* HEADER */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "15px",
                  marginBottom: "15px",
                  flexWrap: "wrap"
                }}
              >
                <img
                  src={imagenUrl}
                  alt={p.nombre}
                  style={{
                    width: "clamp(70px, 12vw, 90px)",
                    height: "clamp(70px, 12vw, 90px)",
                    objectFit: "cover",
                    borderRadius: "12px",
                    border: darkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                    flexShrink: 0,
                    backgroundColor: "#f3f4f6"
                  }}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/90x90?text=Sin+imagen";
                  }}
                />
                <div style={{ flex: 1, minWidth: "140px" }}>
                  <h3
                    style={{
                      color: darkMode ? "#fff" : "#111827",
                      margin: 0,
                      fontSize: "clamp(1.1rem, 2.2vw, 1.4rem)"
                    }}
                  >
                    {p.nombre}
                  </h3>
                  {p.sku && (
                    <p
                      style={{
                        margin: "5px 0 0",
                        color: darkMode ? "#9ca3af" : "#6b7280",
                        fontSize: "clamp(0.75rem, 1.4vw, 0.9rem)"
                      }}
                    >
                      SKU: {p.sku}
                    </p>
                  )}
                  <p
                    style={{
                      margin: "5px 0 0",
                      color: "#2563eb",
                      fontWeight: "600",
                      fontSize: "clamp(0.75rem, 1.4vw, 0.9rem)"
                    }}
                  >
                    🚚 Tipo de venta: {tipoAmigable}
                  </p>
                  {(tipo === "metro_cuadrado" || tipo === "metro_lineal") && (
                    <p
                      style={{
                        margin: "5px 0 0",
                        color: darkMode ? "#9ca3af" : "#6b7280",
                        fontSize: "clamp(0.75rem, 1.4vw, 0.9rem)"
                      }}
                    >
                      Ancho del rollo: {obtenerAnchoRollo(p).toFixed(2)} m
                    </p>
                  )}
                </div>
              </div>

              {/* 🔥 INFO DE PRESENTACIÓN / RINDE */}
              {soloCantidad && infoPresentacion.length > 0 && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "10px",
                    marginBottom: "18px",
                    padding: "14px",
                    background: darkMode ? "#0f172a" : "#f0f9ff",
                    borderRadius: "12px",
                    border: darkMode ? "1px solid #1e3a8a" : "1px solid #bae6fd"
                  }}
                >
                  {infoPresentacion.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px"
                      }}
                    >
                      <span style={{ fontSize: "20px" }}>{item.icono}</span>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "11px",
                            fontWeight: "600",
                            color: darkMode ? "#94a3b8" : "#64748b",
                            textTransform: "uppercase",
                            letterSpacing: "0.4px"
                          }}
                        >
                          {item.label}
                        </p>
                        <p
                          style={{
                            margin: "2px 0 0 0",
                            fontSize: "15px",
                            fontWeight: "700",
                            color: darkMode ? "#fff" : "#0f172a"
                          }}
                        >
                          {item.valor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* ÁREAS / CANTIDADES */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                  marginBottom: "20px"
                }}
              >
                {(p.areas || []).map((area, areaIndex) => {
                  const modos = modosPermitidos;
                  return (
                    <div
                      key={areaIndex}
                      style={{
                        background: area.usar === false ? "#fee2e2" : darkMode ? "#111827" : "#f9fafb",
                        padding: "clamp(12px, 2vw, 18px)",
                        borderRadius: "12px"
                      }}
                    >
                      <h4 style={{ fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)" }}>
                        {soloCantidad ? `Cantidad ${areaIndex + 1}` :
                         tipo === "tramo" ? `Tramo ${areaIndex + 1}` :
                         `Área ${areaIndex + 1}`}
                      </h4>

                      <div style={{ marginBottom: "10px" }}>
                        <label
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            fontWeight: "bold",
                            color: darkMode ? "#fff" : "#111827",
                            fontSize: "clamp(0.85rem, 1.5vw, 1rem)"
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={area.usar ?? true}
                            onChange={(e) => {
                              const copia = [...productos];
                              copia[i].areas[areaIndex].usar = e.target.checked;
                              guardar(copia);
                            }}
                          />
                          Incluir este elemento en la cotización
                        </label>
                      </div>

                      {modos.length > 1 && (
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            marginBottom: "12px",
                            flexWrap: "wrap"
                          }}
                        >
                          {modos.map((modo) => {
                            const activo = (area.modo || modos[0]) === modo;
                            const label =
                              modo === "largoAncho" ? "📏 Largo × Ancho" :
                              modo === "area" ? "📐 Área (m²)" :
                              modo === "metrosLineales" ? "📏 Metros lineales" :
                              modo === "cantidad" ? "🔢 Cantidad" : modo;
                            return (
                              <button
                                key={modo}
                                onClick={() => cambiarModo(i, areaIndex, modo)}
                                style={{
                                  padding: "8px 14px",
                                  borderRadius: "10px",
                                  border: activo ? "2px solid #2563eb" : `1px solid ${darkMode ? "#374151" : "#d1d5db"}`,
                                  background: activo ? (darkMode ? "#1e3a8a" : "#dbeafe") : (darkMode ? "#111827" : "#fff"),
                                  color: activo ? (darkMode ? "#fff" : "#1d4ed8") : (darkMode ? "#e5e7eb" : "#374151"),
                                  fontWeight: "600",
                                  fontSize: "clamp(0.8rem, 1.3vw, 0.9rem)",
                                  cursor: "pointer"
                                }}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: area.modo === "largoAncho" ? "1fr 1fr" : "1fr",
                          gap: "10px"
                        }}
                      >
                        {area.modo === "largoAncho" && (
                          <>
                            <input
                              type="number"
                              placeholder="Largo (m)"
                              value={area.largo || ""}
                              onChange={(e) => actualizarArea(i, areaIndex, "largo", e.target.value)}
                              style={{
                                padding: "clamp(10px, 1.8vw, 14px)",
                                borderRadius: "10px",
                                border: "1px solid #d1d5db",
                                fontSize: "clamp(0.9rem, 1.6vw, 1rem)",
                                width: "100%",
                                boxSizing: "border-box"
                              }}
                            />
                            <input
                              type="number"
                              placeholder="Ancho (m)"
                              value={area.ancho || ""}
                              onChange={(e) => actualizarArea(i, areaIndex, "ancho", e.target.value)}
                              style={{
                                padding: "clamp(10px, 1.8vw, 14px)",
                                borderRadius: "10px",
                                border: "1px solid #d1d5db",
                                fontSize: "clamp(0.9rem, 1.6vw, 1rem)",
                                width: "100%",
                                boxSizing: "border-box"
                              }}
                            />
                          </>
                        )}

                        {area.modo === "area" && (
                          <input
                            type="number"
                            placeholder="Área a cubrir (m²)"
                            value={area.area || ""}
                            onChange={(e) => actualizarArea(i, areaIndex, "area", e.target.value)}
                            style={{
                              padding: "clamp(10px, 1.8vw, 14px)",
                              borderRadius: "10px",
                              border: "1px solid #d1d5db",
                              fontSize: "clamp(0.9rem, 1.6vw, 1rem)",
                              width: "100%",
                              boxSizing: "border-box"
                            }}
                          />
                        )}

                        {area.modo === "metrosLineales" && (
                          <input
                            type="number"
                            placeholder="Metros lineales (ml)"
                            value={area.metrosLineales || ""}
                            onChange={(e) => actualizarArea(i, areaIndex, "metrosLineales", e.target.value)}
                            style={{
                              padding: "clamp(10px, 1.8vw, 14px)",
                              borderRadius: "10px",
                              border: "1px solid #d1d5db",
                              fontSize: "clamp(0.9rem, 1.6vw, 1rem)",
                              width: "100%",
                              boxSizing: "border-box"
                            }}
                          />
                        )}

                        {area.modo === "cantidad" && (
                          <input
                            type="number"
                            placeholder="Cantidad"
                            value={area.cantidad || ""}
                            onChange={(e) => actualizarArea(i, areaIndex, "cantidad", e.target.value)}
                            style={{
                              padding: "clamp(10px, 1.8vw, 14px)",
                              borderRadius: "10px",
                              border: "1px solid #d1d5db",
                              fontSize: "clamp(0.9rem, 1.6vw, 1rem)",
                              width: "100%",
                              boxSizing: "border-box"
                            }}
                          />
                        )}
                      </div>

                      {!soloCantidad && (
                        <p
                          style={{
                            marginTop: "10px",
                            fontWeight: "bold",
                            color: "#16a34a",
                            fontSize: "clamp(0.85rem, 1.5vw, 1rem)"
                          }}
                        >
                          {area.modo === "metrosLineales"
                            ? `Metros lineales: ${Number(area.metrosLineales || 0).toFixed(2)} ml`
                            : area.modo === "area"
                            ? `Área: ${Number(area.area || 0).toFixed(2)} m²`
                            : `Área: ${((Number(area.largo) || 0) * (Number(area.ancho) || 0)).toFixed(2)} m²`}
                        </p>
                      )}

                      {(p.areas || []).length > 1 && (
                        <button
                          onClick={() => eliminarArea(i, areaIndex)}
                          style={{
                            background: "#dc2626",
                            color: "#fff",
                            border: "none",
                            padding: "8px 14px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "clamp(0.8rem, 1.3vw, 0.9rem)",
                            fontWeight: "600",
                            touchAction: "manipulation",
                            marginTop: "8px"
                          }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  );
                })}

                <button
                  onClick={() => agregarArea(i)}
                  style={{
                    background: "#2563eb",
                    color: "#fff",
                    border: "none",
                    padding: "clamp(12px, 2vw, 16px)",
                    borderRadius: "10px",
                    fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
                    fontWeight: "600",
                    cursor: "pointer",
                    touchAction: "manipulation"
                  }}
                >
                  ➕ Agregar {soloCantidad ? "otra cantidad" : "otra área"}
                </button>
              </div>

              {/* DESPERDICIO — solo para tipos que lo usan */}
              {!soloCantidad && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "20px"
                  }}
                >
                  <span style={{ width: "100%", fontWeight: "600", color: darkMode ? "#e5e7eb" : "#374151", fontSize: "0.9rem" }}>
                    Desperdicio sugerido:
                  </span>
                  {[0, 10, 15, 20].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        const copia = [...productos];
                        copia[i].desperdicio = d;
                        guardar(copia);
                      }}
                      style={{
                        padding: "clamp(8px, 1.4vw, 12px) clamp(14px, 2vw, 22px)",
                        border: "none",
                        borderRadius: "30px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "clamp(0.8rem, 1.3vw, 0.95rem)",
                        background: p.desperdicio === d ? "#2563eb" : darkMode ? "#374151" : "#e5e7eb",
                        color: p.desperdicio === d ? "#fff" : darkMode ? "#fff" : "#111827",
                        flex: "1 1 auto",
                        minWidth: "70px",
                        touchAction: "manipulation"
                      }}
                    >
                      {d}%
                    </button>
                  ))}
                </div>
              )}

              {/* RESULTADOS */}
              <div
                style={{
                  background: darkMode ? "#111827" : "#f9fafb",
                  padding: "clamp(14px, 2vw, 20px)",
                  borderRadius: "12px",
                  border: darkMode ? "1px solid #374151" : "1px solid #e5e7eb"
                }}
              >
                <h3
                  style={{
                    margin: "0 0 12px 0",
                    color: darkMode ? "#fff" : "#111827",
                    fontSize: "clamp(1rem, 1.8vw, 1.15rem)"
                  }}
                >
                  🧾 Resumen
                </h3>

                {soloCantidad ? (
                  <>
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Presentación:</strong> {p.presentacion || tipoAmigable}
                    </p>
                    {r.piezasCaja > 0 && (
                      <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                        <strong>Piezas por {tipoAmigable.toLowerCase()}:</strong> {r.piezasCaja} pz
                      </p>
                    )}
                    {r.coberturaUnidad > 0 && (
                      <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                        <strong>Rinde por {tipoAmigable.toLowerCase()}:</strong> {r.coberturaUnidad.toFixed(2)} m²
                      </p>
                    )}
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Cantidad:</strong> {r.cantidad}
                    </p>
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Precio unitario:</strong> ${r.precio.toFixed(2)}
                    </p>
                    {r.areaConDesc > 0 && (
                      <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                        <strong>Cobertura total:</strong> {r.areaConDesc.toFixed(2)} m²
                      </p>
                    )}
                    <hr style={{ border: "none", borderTop: darkMode ? "1px solid #374151" : "1px solid #e5e7eb", margin: "12px 0" }} />
                    <p style={{ color: "#2563eb", fontWeight: "700", marginBottom: "8px", fontSize: "clamp(1rem, 1.7vw, 1.15rem)" }}>
                      📦 Pedido: {r.cantidad} {tipoAmigable.toLowerCase()}{r.cantidad === 1 ? "" : "s"}
                    </p>
                  </>
                ) : tipo === "metro_cuadrado" ? (
                  <>
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Ancho del rollo:</strong> {r.ancho.toFixed(2)} m
                    </p>
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Área a cubrir:</strong> {r.area.toFixed(2)} m²
                    </p>
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Desperdicio:</strong> {r.desperdicio}%
                    </p>
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Área final:</strong> {r.areaConDesc.toFixed(2)} m²
                    </p>
                    <hr style={{ border: "none", borderTop: darkMode ? "1px solid #374151" : "1px solid #e5e7eb", margin: "12px 0" }} />
                    <p style={{ color: "#2563eb", fontWeight: "700", marginBottom: "8px", fontSize: "clamp(1rem, 1.7vw, 1.15rem)" }}>
                      📦 Necesitas: {r.metrosLineales.toFixed(2)} metros lineales
                    </p>
                  </>
                ) : tipo === "metro_lineal" ? (
                  <>
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Ancho del rollo:</strong> {r.ancho.toFixed(2)} m
                    </p>
                    {r.area > 0 && (
                      <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                        <strong>Área a cubrir:</strong> {r.area.toFixed(2)} m²
                      </p>
                    )}
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Desperdicio:</strong> {r.desperdicio}%
                    </p>
                    <hr style={{ border: "none", borderTop: darkMode ? "1px solid #374151" : "1px solid #e5e7eb", margin: "12px 0" }} />
                    <p style={{ color: "#2563eb", fontWeight: "700", marginBottom: "8px", fontSize: "clamp(1rem, 1.7vw, 1.15rem)" }}>
                      📦 Necesitas: {r.metrosLineales.toFixed(2)} metros lineales
                    </p>
                  </>
                ) : tipo === "caja" ? (
                  <>
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Piezas por caja:</strong> {r.piezasCaja} pz
                    </p>
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Cobertura por caja:</strong> {r.coberturaUnidad.toFixed(2)} m²
                    </p>
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Área a cubrir:</strong> {r.area.toFixed(2)} m²
                    </p>
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Desperdicio:</strong> {r.desperdicio}%
                    </p>
                    <hr style={{ border: "none", borderTop: darkMode ? "1px solid #374151" : "1px solid #e5e7eb", margin: "12px 0" }} />
                    <p style={{ color: "#2563eb", fontWeight: "700", marginBottom: "8px", fontSize: "clamp(1rem, 1.7vw, 1.15rem)" }}>
                      📦 Necesitas: {r.cantidad} cajas
                    </p>
                  </>
                ) : tipo === "tramo" ? (
                  <>
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Desperdicio:</strong> {r.desperdicio}%
                    </p>
                    <hr style={{ border: "none", borderTop: darkMode ? "1px solid #374151" : "1px solid #e5e7eb", margin: "12px 0" }} />
                    <p style={{ color: "#2563eb", fontWeight: "700", marginBottom: "8px", fontSize: "clamp(1rem, 1.7vw, 1.15rem)" }}>
                      📦 Necesitas: {r.cantidad.toFixed(2)} metros
                    </p>
                  </>
                ) : null}

                <p
                  style={{
                    fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)",
                    fontWeight: "700",
                    color: "#16a34a",
                    marginTop: "14px"
                  }}
                >
                  Total: ${r.total.toFixed(2)}
                </p>
              </div>

              <button
                onClick={() => eliminarProducto(p.id)}
                style={{
                  marginTop: "15px",
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  padding: "clamp(10px, 1.6vw, 14px) clamp(16px, 2.5vw, 22px)",
                  borderRadius: "10px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "clamp(0.9rem, 1.5vw, 1rem)",
                  width: "100%",
                  touchAction: "manipulation"
                }}
              >
                Eliminar producto
              </button>
            </div>
          );
        })}

        {/* TOTAL GENERAL */}
        {productos.length > 0 && (
          <div
            style={{
              background: darkMode ? "#1f2937" : "#fff",
              padding: "clamp(20px, 3vw, 30px)",
              borderRadius: "18px",
              textAlign: "center",
              marginTop: "30px",
              boxShadow: "0 6px 20px rgba(0,0,0,.08)"
            }}
          >
            <h2
              style={{
                color: "#16a34a",
                marginBottom: "20px",
                fontSize: "clamp(1.5rem, 3.5vw, 2.2rem)"
              }}
            >
              Total General: ${totalGeneral.toFixed(2)}
            </h2>
            <button
              onClick={() => setMostrarFormulario(true)}
              style={{
                background: "#2563eb",
                color: "#fff",
                border: "none",
                padding: "clamp(14px, 2vw, 18px) clamp(24px, 4vw, 40px)",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "clamp(1rem, 1.8vw, 1.2rem)",
                width: "100%",
                maxWidth: "360px",
                touchAction: "manipulation"
              }}
            >
              Solicitar Cotización
            </button>
          </div>
        )}

        {/* MODAL FORMULARIO */}
        {mostrarFormulario && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,.65)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 9999,
              padding: "16px"
            }}
          >
            <div
              style={{
                background: darkMode ? "#1f2937" : "#fff",
                width: "100%",
                maxWidth: "450px",
                padding: "clamp(24px, 4vw, 36px)",
                borderRadius: "18px",
                boxShadow: "0 10px 30px rgba(0,0,0,.25)",
                margin: "auto"
              }}
            >
              <h2
                style={{
                  textAlign: "center",
                  marginBottom: "20px",
                  color: darkMode ? "#fff" : "#111827",
                  fontSize: "clamp(1.3rem, 2.5vw, 1.6rem)"
                }}
              >
                Datos del Cliente
              </h2>

              {mensajeEnviado ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    background: "#dcfce7",
                    borderRadius: "12px",
                    color: "#166534",
                    fontWeight: "600",
                    fontSize: "clamp(1rem, 1.6vw, 1.1rem)"
                  }}
                >
                  {mensajeEnviado}
                </div>
              ) : (
                <>
                  <input
                    placeholder="Nombre"
                    value={cliente.nombre}
                    onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "clamp(12px, 1.8vw, 16px)",
                      marginBottom: "12px",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                      fontSize: "clamp(0.95rem, 1.6vw, 1rem)",
                      boxSizing: "border-box"
                    }}
                  />
                  <input
                    placeholder="Correo"
                    value={cliente.correo}
                    onChange={(e) => setCliente({ ...cliente, correo: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "clamp(12px, 1.8vw, 16px)",
                      marginBottom: "12px",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                      fontSize: "clamp(0.95rem, 1.6vw, 1rem)",
                      boxSizing: "border-box"
                    }}
                  />
                  <input
                    placeholder="Celular"
                    value={cliente.celular}
                    onChange={(e) => setCliente({ ...cliente, celular: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "clamp(12px, 1.8vw, 16px)",
                      marginBottom: "20px",
                      borderRadius: "10px",
                      border: "1px solid #d1d5db",
                      fontSize: "clamp(0.95rem, 1.6vw, 1rem)",
                      boxSizing: "border-box"
                    }}
                  />

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      flexDirection: window.innerWidth < 480 ? "column" : "row"
                    }}
                  >
                    <button
                      onClick={() => {
                        setMostrarFormulario(false);
                        setMensajeEnviado("");
                      }}
                      style={{
                        flex: 1,
                        padding: "clamp(12px, 1.8vw, 16px)",
                        border: "none",
                        borderRadius: "10px",
                        background: "#6b7280",
                        color: "#fff",
                        cursor: "pointer",
                        fontSize: "clamp(0.95rem, 1.6vw, 1rem)",
                        fontWeight: "600"
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={generarPDF}
                      disabled={enviando}
                      style={{
                        flex: 1,
                        padding: "clamp(12px, 1.8vw, 16px)",
                        border: "none",
                        borderRadius: "10px",
                        background: "#16a34a",
                        color: "#fff",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "clamp(0.95rem, 1.6vw, 1rem)",
                        opacity: enviando ? 0.7 : 1
                      }}
                    >
                      {enviando ? "Enviando..." : "Enviar Cotización"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ZOOM GUÍA */}
        {imagenGuiaZoom && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 10000,
              cursor: "zoom-out"
            }}
            onClick={() => setImagenGuiaZoom(null)}
          >
            <img
              src={imagenGuiaZoom}
              alt="Guía ampliada"
              style={{
                maxWidth: "90%",
                maxHeight: "90%",
                borderRadius: "10px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                objectFit: "contain"
              }}
            />
          </div>
        )}
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
}