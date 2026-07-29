import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import jsPDF from "jspdf";
import api from "../services/api";

// 🔥 FUNCIÓN PARA GENERAR URL DE IMAGEN
const getImageUrl = (imagen) => {
  if (!imagen) {
    return "https://via.placeholder.com/200?text=Sin+imagen";
  }

  if (imagen.startsWith("http://") || imagen.startsWith("https://")) {
    return imagen;
  }

  const API_BASE = process.env.REACT_APP_API_URL || 'https://backend-zuib.onrender.com';
  
  if (imagen.startsWith("/")) {
    return `${API_BASE}${imagen}`;
  }

  return `${API_BASE}/${imagen}`;
};

// 🔥 FUNCIÓN PARA OBTENER LA IMAGEN DEL PRODUCTO
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

// 🔥 FUNCIÓN PARA CONVERTIR IMAGEN A BASE64
const convertirImagenBase64 = async (url) => {
  try {
    if (!url) return null;
    if (url.includes("placeholder")) return null;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
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
            const productoBD = res.data.find(
              (prod) => prod.id === guardado.id
            );

            if (!productoBD) return null;

            let areasIniciales = [];
            if (productoBD.tipoVenta === "tramo") {
              areasIniciales = [{ perimetro: "", usar: true }];
            } else if (productoBD.tipoVenta === "unidad") {
              areasIniciales = [{ cantidad: "", usar: true }];
            } else if (productoBD.tipoVenta === "otros") {
              areasIniciales = [{ area: "", usar: true }];
            } else {
              areasIniciales = [{ largo: "", ancho: "", usar: true }];
            }

            return {
              ...productoBD,
              desperdicio: guardado.desperdicio ?? 10,
              areas: guardado.areas?.length
                ? guardado.areas
                : areasIniciales
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
    api.get("/categorias")
      .then((res) => setCategorias(res.data))
      .catch((err) => console.log(err));
  }, []);

  useEffect(() => {
    api.get("/subcategorias")
      .then((res) => setSubcategorias(res.data))
      .catch((err) => console.log(err));
  }, []);

  const guardar = (lista) => {
    setProductos(lista);
    localStorage.setItem("cotizador", JSON.stringify(lista));
  };

  const calcular = (p) => {
    if (p.tipoVenta === "otros") {
      const areaTotal = (p.areas || []).reduce((acc, a) => {
        if (!a.usar) return acc;
        return acc + (Number(a.area) || 0);
      }, 0);

      const coberturaPorUnidad = Number(p.cobertura) || 0;
      const cantidad = coberturaPorUnidad > 0 ? Math.ceil(areaTotal / coberturaPorUnidad) : 0;
      const precio = Number(p.oferta ? p.precioOferta : p.precio) || 0;
      const total = cantidad * precio;

      return {
        area: areaTotal,
        desperdicio: 0,
        areaConDesc: areaTotal,
        ancho: 0,
        alto: 0,
        piezasCaja: 1,
        coberturaPieza: coberturaPorUnidad,
        coberturaUnidad: coberturaPorUnidad,
        cantidad,
        metrosLineales: 0,
        equivalenciaRollos: 0,
        precio,
        total
      };
    }

    const area = (p.areas || []).reduce((acc, a) => {
      if (!a.usar) return acc;
      return acc + ((Number(a.largo) || 0) * (Number(a.ancho) || 0));
    }, 0);

    const desperdicio = parseFloat(p.desperdicio) || 0;
    const areaConDesc = area * (1 + desperdicio / 100);
    const ancho = (parseFloat(p.ancho) || 0) / 100;
    const alto = (parseFloat(p.alto) || 0) / 100;
    const piezasCaja = parseInt(p.piezasCaja) || 1;
    const coberturaPieza = ancho > 0 && alto > 0 ? ancho * alto : 0;
    const coberturaUnidad = p.tipoVenta === "caja" ? coberturaPieza * piezasCaja : coberturaPieza;

    let cantidad = 0;
    let metrosLineales = 0;
    let equivalenciaRollos = 0;

    if (p.tipoVenta === "unidad") {
      cantidad = (p.areas || []).reduce((total, a) => {
        if (!a.usar) return total;
        return total + (Number(a.cantidad) || 0);
      }, 0);
    } else if (p.tipoVenta === "tramo") {
      metrosLineales = (p.areas || []).reduce((total, a) => {
        if (!a.usar) return total;
        return total + (Number(a.perimetro) || 0);
      }, 0);
      cantidad = metrosLineales;
    } else if (p.tipoVenta === "rollo") {
      const anchoMaterial = Math.min(ancho, alto);
      const largoMaterial = Math.max(ancho, alto);
      metrosLineales = anchoMaterial > 0 ? areaConDesc / anchoMaterial : 0;
      equivalenciaRollos = largoMaterial > 0 ? metrosLineales / largoMaterial : 0;
      cantidad = metrosLineales;
    } else {
      cantidad = coberturaUnidad > 0 ? Math.ceil(areaConDesc / coberturaUnidad) : 0;
    }

    const precio = Number(p.oferta ? p.precioOferta : p.precio) || 0;
    let total = 0;

    if (p.tipoVenta === "rollo") {
      total = areaConDesc * precio;
    } else if (p.tipoVenta === "tramo" || p.tipoVenta === "unidad") {
      total = cantidad * precio;
    } else {
      total = cantidad * precio;
    }

    return {
      area,
      desperdicio,
      areaConDesc,
      ancho,
      alto,
      piezasCaja,
      coberturaPieza,
      coberturaUnidad,
      cantidad,
      metrosLineales,
      equivalenciaRollos,
      precio,
      total
    };
  };

  const eliminarProducto = (id) => {
    const nuevos = productos.filter((p) => p.id !== id);
    guardar(nuevos);
  };

  const totalGeneral = productos.reduce((acc, p) => {
    return acc + calcular(p).total;
  }, 0);

  // 🔥 FUNCIÓN PARA AGREGAR MEMBRETADO DE PORTADA
  const agregarMembretadoPortada = async (pdf) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    try {
      const fondoUrl = window.location.origin + "/membreteuno.jpg";
      const fondo = await convertirImagenBase64(fondoUrl);
      if (fondo) {
        pdf.addImage(fondo, "JPEG", 0, 0, pageWidth, pageHeight);
      }
    } catch (error) {
      console.log("Error cargando membrete de portada:", error);
    }
  };

  // 🔥 FUNCIÓN PARA AGREGAR MEMBRETADO INTERNO
  const agregarMembretadoInterno = async (pdf) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    try {
      const fondoUrl = window.location.origin + "/membretedos.jpg";
      const fondo = await convertirImagenBase64(fondoUrl);
      if (fondo) {
        pdf.addImage(fondo, "JPEG", 0, 0, pageWidth, pageHeight);
      }
    } catch (error) {
      console.log("Error cargando membrete interno:", error);
    }
  };

  // 🔥 FUNCIÓN PARA VERIFICAR SALTO DE PÁGINA
  const verificarSaltoPagina = async (pdf, y, espacioNecesario) => {
    const pageHeight = pdf.internal.pageSize.getHeight();
    if (y + espacioNecesario > pageHeight - 25) {
      pdf.addPage();
      await agregarMembretadoInterno(pdf);
      return 65;
    }
    return y;
  };

  const formatMeters = (cm) => {
    return (Number(cm) / 100).toFixed(2);
  };

  // 🔥 FUNCIÓN GENERAR PDF - COMPLETA CON TODOS LOS DETALLES
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

      // 🔥 RECORRER CADA PRODUCTO
      for (let i = 0; i < productos.length; i++) {
        const producto = productos[i];
        const r = calcular(producto);

        if (y > 220) {
          pdf.addPage();
          await agregarMembretadoInterno(pdf);
          y = 20;
        }

        // 🔥 IMAGEN DEL PRODUCTO
        try {
          const imgUrl = obtenerImagenProducto(producto);
          const imagenBase64 = await convertirImagenBase64(imgUrl);
          if (imagenBase64) {
            pdf.addImage(imagenBase64, "JPEG", 15, y, 50, 50);
          } else {
            pdf.setFontSize(10);
            pdf.setTextColor(150);
            pdf.text("Imagen no disponible", 15, y + 25);
          }
        } catch (error) {
          console.log("Error imagen producto", error);
          pdf.setFontSize(10);
          pdf.setTextColor(150);
          pdf.text("Imagen no disponible", 15, y + 25);
        }

        // 🔥 DATOS DEL PRODUCTO
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

        // 🔥 RESUMEN DE COTIZACIÓN - MEJORADO PARA "OTROS"
        y = await verificarSaltoPagina(pdf, y, 70);
        pdf.setFontSize(18);
        pdf.setTextColor(0);
        pdf.text("Resumen de Cotización", 15, y);
        y += 10;
        
        // Fondo para el resumen
        pdf.setFillColor(245, 247, 250);
        pdf.roundedRect(15, y, pageWidth - 30, 55, 3, 3, "F");
        y = await verificarSaltoPagina(pdf, y, 70);
        pdf.setFontSize(11);
        pdf.setTextColor(60);

        if (producto.tipoVenta === "otros") {
          // 🔥 MOSTRAR TODOS LOS DETALLES PARA "OTROS"
          pdf.text(`Presentación: ${producto.presentacion || "No definida"}`, 20, y + 8);
          pdf.text(`Cobertura por ${producto.presentacion || "unidad"}: ${r.coberturaUnidad.toFixed(2)} m²`, 20, y + 18);
          pdf.text(`Área a cubrir: ${r.area.toFixed(2)} m²`, 20, y + 28);
          pdf.text(`Unidades necesarias: ${r.cantidad}`, 20, y + 38);
          pdf.text(`Área total cubierta: ${(r.cantidad * r.coberturaUnidad).toFixed(2)} m²`, 20, y + 48);
        } else if (producto.tipoVenta === "unidad") {
          pdf.text(`Cantidad total de unidades: ${r.cantidad}`, 20, y + 8);
        } else if (producto.tipoVenta === "tramo") {
          pdf.text(`Perímetro total: ${r.metrosLineales.toFixed(2)} m`, 20, y + 8);
          pdf.text(`Metros lineales requeridos: ${r.metrosLineales.toFixed(2)} m`, 20, y + 18);
        } else {
          pdf.text(`Modo de cotización: Todas las áreas`, 20, y + 8);
          pdf.text(`Área total calculada: ${r.area.toFixed(2)} m²`, 20, y + 18);
          pdf.text(`Desperdicio aplicado: ${producto.desperdicio || 0}%`, 20, y + 28);
          pdf.text(`Área final: ${r.areaConDesc.toFixed(2)} m²`, 20, y + 38);
          pdf.text(
            producto.tipoVenta === "rollo"
              ? `Cantidad requerida: ${r.metrosLineales.toFixed(2)} metros lineales`
              : `Cantidad requerida: ${r.cantidad} ${producto.tipoVenta}s`,
            110,
            y + 18
          );
        }
        y += 70;

        // 🔥 DETALLE DE MEDIDAS - MEJORADO PARA "OTROS"
        pdf.setFontSize(14);
        pdf.setTextColor(30);
        pdf.text("Detalle de Medidas", 15, y);
        y += 4;
        y = await verificarSaltoPagina(pdf, y, 70);
        pdf.setFontSize(11);
        pdf.setTextColor(70);

        const areasActivas = (producto.areas || []).filter(a => a.usar !== false);

        if (areasActivas.length > 0) {
          areasActivas.forEach((area, index) => {
            if (producto.tipoVenta === "tramo") {
              pdf.text(`Perímetro ${index + 1}: ${Number(area.perimetro || 0).toFixed(2)} m`, 20, y);
            } else if (producto.tipoVenta === "unidad") {
              pdf.text(`Cantidad ${index + 1}: ${Number(area.cantidad || 0)} unidades`, 20, y);
            } else if (producto.tipoVenta === "otros") {
              // 🔥 MOSTRAR EL DETALLE DE ÁREA PARA "OTROS"
              pdf.text(`Área ${index + 1}: ${Number(area.area || 0).toFixed(2)} m²`, 20, y);
            } else {
              const largo = Number(area.largo || 0);
              const ancho = Number(area.ancho || 0);
              const areaTotal = largo * ancho;
              pdf.text(`Área ${index + 1}: ${largo}m x ${ancho}m = ${areaTotal.toFixed(2)} m²`, 20, y);
            }
            y += 8;
          });
        } else {
          pdf.text("No hay áreas seleccionadas para este producto.", 20, y);
          y += 8;
        }
        y += 5;

        // 🔥 NOTA DEL PRODUCTO - MEJORADA PARA "OTROS"
        let notaProducto = "";
        if (producto.tipoVenta === "rollo") {
          const anchoRollo = Math.min(Number(producto.ancho || 0), Number(producto.alto || 0)) / 100;
          const largoRollo = Math.max(Number(producto.ancho || 0), Number(producto.alto || 0)) / 100;
          const coberturaRollo = anchoRollo * largoRollo;
          const metrosLineales = anchoRollo > 0 ? r.areaConDesc / anchoRollo : 0;
          notaProducto =
            `Este producto se vende por rollo. ` +
            `Cada rollo mide ${largoRollo.toFixed(2)} m x ${anchoRollo.toFixed(2)} m y cubre ${coberturaRollo.toFixed(2)} m². ` +
            `Para cubrir ${r.areaConDesc.toFixed(2)} m² necesitas aproximadamente ${metrosLineales.toFixed(2)} metros lineales.`;
        } else if (producto.tipoVenta === "caja") {
          notaProducto =
            `Cada caja contiene ${producto.piezasCaja || 1} piezas y cubre ${r.coberturaUnidad.toFixed(2)} m². ` +
            `Para cubrir ${r.areaConDesc.toFixed(2)} m² necesitas aproximadamente ${r.cantidad} cajas.`;
        } else if (producto.tipoVenta === "pieza") {
          notaProducto =
            `Cada pieza cubre ${r.coberturaUnidad.toFixed(2)} m². ` +
            `Para cubrir ${r.areaConDesc.toFixed(2)} m² necesitas aproximadamente ${r.cantidad} piezas.`;
        } else if (producto.tipoVenta === "unidad") {
          notaProducto = `Se requieren aproximadamente ${r.cantidad} unidades para este proyecto.`;
        } else if (producto.tipoVenta === "tramo") {
          notaProducto =
            `Para cubrir ${r.cantidad.toFixed(2)} metros necesitas aproximadamente ${r.cantidad.toFixed(2)} metros lineales.`;
        } else if (producto.tipoVenta === "otros") {
          // 🔥 NOTA MEJORADA PARA "OTROS"
          notaProducto =
            `Este producto se vende por presentación (${producto.presentacion || "unidad"}). ` +
            `Cada ${producto.presentacion || "unidad"} cubre ${r.coberturaUnidad.toFixed(2)} m². ` +
            `Para cubrir ${r.area.toFixed(2)} m² necesitas aproximadamente ${r.cantidad} unidades. ` +
            `Esto cubrirá ${(r.cantidad * r.coberturaUnidad).toFixed(2)} m².`;
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

        // 🔥 CONDICIONES COMERCIALES
        if (y > pageHeight - 90) {
          pdf.addPage();
          await agregarMembretadoInterno(pdf);
          y = 20;
        }
        
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
        y = await verificarSaltoPagina(pdf, y, 70);
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

      // 🔥 TOTAL GENERAL
      const totalGeneral = productos.reduce((acc, p) => acc + calcular(p).total, 0);
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
      pdf.text(`TOTAL ESTIMADO: $${totalGeneral.toFixed(2)}`, 20, y + 12);
      y += 35;

      // 🔥 DATOS DEL CLIENTE
      if (y > pageHeight - 80) {
        pdf.addPage();
        await agregarMembretadoInterno(pdf);
        y = 20;
      }
      
      y = await verificarSaltoPagina(pdf, y, 70);
      pdf.setFontSize(16);
      pdf.setTextColor(0);
      pdf.text("Datos del Cliente", 15, y);
      y += 12;
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(15, y, pageWidth - 30, 28, 3, 3, "F");
      y = await verificarSaltoPagina(pdf, y, 70);
      pdf.setFontSize(11);
      pdf.text(`Nombre: ${cliente.nombre || "-"}`, 20, y + 8);
      pdf.text(`Correo: ${cliente.correo || "-"}`, 20, y + 16);
      pdf.text(`Celular: ${cliente.celular || "-"}`, 20, y + 24);
      y += 40;

      // 🔥 ENVIAR POR CORREO
      const pdfBase64 = pdf.output("datauristring");
      await api.post("/enviar-cotizacion", {
        nombre: cliente.nombre,
        correo: cliente.correo,
        celular: cliente.celular,
        producto: "Cotización múltiple",
        total: totalGeneral,
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
    let nuevaArea = { usar: true };
    if (tipo === "tramo") nuevaArea.perimetro = "";
    else if (tipo === "unidad") nuevaArea.cantidad = "";
    else if (tipo === "otros") nuevaArea.area = "";
    else {
      nuevaArea.largo = "";
      nuevaArea.ancho = "";
    }
    copia[indexProducto].areas.push(nuevaArea);
    guardar(copia);
  };

  const eliminarArea = (indexProducto, indexArea) => {
    const copia = [...productos];
    copia[indexProducto].areas = copia[indexProducto].areas.filter((_, i) => i !== indexArea);
    if (copia[indexProducto].areas.length === 0) {
      const tipo = copia[indexProducto].tipoVenta;
      if (tipo === "tramo") {
        copia[indexProducto].areas = [{ perimetro: "", usar: true }];
      } else if (tipo === "unidad") {
        copia[indexProducto].areas = [{ cantidad: "", usar: true }];
      } else if (tipo === "otros") {
        copia[indexProducto].areas = [{ area: "", usar: true }];
      } else {
        copia[indexProducto].areas = [{ largo: "", ancho: "", usar: true }];
      }
    }
    guardar(copia);
  };

  const actualizarArea = (indexProducto, indexArea, campo, valor) => {
    const copia = [...productos];
    copia[indexProducto].areas[indexArea][campo] = valor;
    guardar(copia);
  };

  const irAProductos = () => {
    navigate("/productos");
  };

  // ========== RENDER ==========
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

        {/* GUÍA DE MEDICIÓN */}
        <div
          className="guia-card"
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
            Multiplica el largo × ancho de cada área y se suman todas las áreas. Da clic en las imágenes para ampliarlas.
          </p>
          <div
            className="guia-grid"
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

        {/* BOTÓN AGREGAR PRODUCTOS */}
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
          const areasActivas = (p.areas || []).filter(a => a.usar !== false);
          const imagenUrl = obtenerImagenProducto(p);

          return (
            <div
              key={p.id}
              className="producto-card"
              style={{
                background: darkMode ? "#1f2937" : "#fff",
                borderRadius: "18px",
                padding: "clamp(16px, 2.5vw, 25px)",
                marginBottom: "20px",
                boxShadow: "0 6px 20px rgba(0,0,0,.08)",
                border: darkMode ? "1px solid #374151" : "1px solid #e5e7eb"
              }}
            >
              {/* HEADER PRODUCTO */}
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
                  {p.tipoVenta === "otros" && p.presentacion && (
                    <p
                      style={{
                        margin: "5px 0 0",
                        color: darkMode ? "#9ca3af" : "#6b7280",
                        fontSize: "clamp(0.75rem, 1.4vw, 0.9rem)"
                      }}
                    >
                      Presentación: {p.presentacion} · Cobertura: {p.cobertura} m²
                    </p>
                  )}
                </div>
              </div>

              {/* ÁREAS */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                  marginBottom: "20px"
                }}
              >
                {(p.areas || []).map((area, areaIndex) => (
                  <div
                    key={areaIndex}
                    style={{
                      background: area.usar === false ? "#fee2e2" : darkMode ? "#111827" : "#f9fafb",
                      padding: "clamp(12px, 2vw, 18px)",
                      borderRadius: "12px"
                    }}
                  >
                    <h4 style={{ fontSize: "clamp(0.95rem, 1.8vw, 1.1rem)" }}>Área {areaIndex + 1}</h4>
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
                        Utilizar esta área
                      </label>
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          p.tipoVenta === "unidad" || p.tipoVenta === "tramo" || p.tipoVenta === "otros"
                            ? "1fr"
                            : "1fr 1fr",
                        gap: "10px"
                      }}
                    >
                      {p.tipoVenta === "unidad" && (
                        <input
                          type="number"
                          placeholder="Cantidad"
                          value={area.cantidad || ""}
                          onChange={(e) =>
                            actualizarArea(i, areaIndex, "cantidad", e.target.value)
                          }
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
                      {p.tipoVenta === "tramo" && (
                        <input
                          type="number"
                          placeholder="Perímetro (m)"
                          value={area.perimetro || ""}
                          onChange={(e) =>
                            actualizarArea(i, areaIndex, "perimetro", e.target.value)
                          }
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
                      {p.tipoVenta === "otros" && (
                        <input
                          type="number"
                          placeholder="Área a cubrir (m²)"
                          value={area.area || ""}
                          onChange={(e) =>
                            actualizarArea(i, areaIndex, "area", e.target.value)
                          }
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
                      {p.tipoVenta !== "unidad" && p.tipoVenta !== "tramo" && p.tipoVenta !== "otros" && (
                        <>
                          <input
                            type="number"
                            placeholder="Largo (m)"
                            value={area.largo || ""}
                            onChange={(e) =>
                              actualizarArea(i, areaIndex, "largo", e.target.value)
                            }
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
                            onChange={(e) =>
                              actualizarArea(i, areaIndex, "ancho", e.target.value)
                            }
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
                    </div>
                    <p
                      style={{
                        marginTop: "10px",
                        fontWeight: "bold",
                        color: "#16a34a",
                        fontSize: "clamp(0.85rem, 1.5vw, 1rem)"
                      }}
                    >
                      {p.tipoVenta === "unidad"
                        ? `Cantidad: ${Number(area.cantidad || 0)}`
                        : p.tipoVenta === "tramo"
                        ? `Perímetro: ${Number(area.perimetro || 0)} m`
                        : p.tipoVenta === "otros"
                        ? `Área a cubrir: ${Number(area.area || 0).toFixed(2)} m²`
                        : `Área: ${((Number(area.largo) || 0) * (Number(area.ancho) || 0)).toFixed(2)} m²`}
                    </p>
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
                          touchAction: "manipulation"
                        }}
                      >
                        Eliminar área
                      </button>
                    )}
                  </div>
                ))}
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
                  ➕ Agregar área
                </button>
              </div>

              {/* DESPERDICIO */}
              {p.tipoVenta !== "otros" && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    marginBottom: "20px"
                  }}
                >
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
                      {d}% Desperdicio
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
                {p.tipoVenta === "otros" ? (
                  <>
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Presentación:</strong> {p.presentacion || "No definida"}
                    </p>
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Cobertura por {p.presentacion || "unidad"}:</strong> {Number(p.cobertura || 0).toFixed(2)} m²
                    </p>
                    <hr style={{ border: "none", borderTop: darkMode ? "1px solid #374151" : "1px solid #e5e7eb", margin: "12px 0" }} />
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Área a cubrir:</strong> {r.area.toFixed(2)} m²
                    </p>
                    <p style={{ color: "#2563eb", fontWeight: "600", marginBottom: "8px", fontSize: "clamp(0.95rem, 1.6vw, 1.05rem)" }}>
                      <strong>Unidades necesarias:</strong> {r.cantidad}
                    </p>
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Área total cubierta:</strong> {(r.cantidad * r.coberturaUnidad).toFixed(2)} m²
                    </p>
                  </>
                ) : (
                  <>
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Medida:</strong> {(Number(p.ancho || 0) / 100).toFixed(2)} m × {(Number(p.alto || 0) / 100).toFixed(2)} m
                    </p>
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Tipo de venta:</strong>{" "}
                      {p.tipoVenta === "caja" ? "Caja" :
                       p.tipoVenta === "pieza" ? "Pieza" :
                       p.tipoVenta === "rollo" ? "Rollo" :
                       p.tipoVenta === "tramo" ? "Tramo" :
                       p.tipoVenta === "unidad" ? "Unidad" : "No definido"}
                    </p>
                    {p.tipoVenta === "caja" && (
                      <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                        <strong>Piezas por caja:</strong> {p.piezasCaja || 1}
                      </p>
                    )}
                    <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                      <strong>Cobertura por {p.tipoVenta === "caja" ? "caja" :
                        p.tipoVenta === "pieza" ? "pieza" :
                        p.tipoVenta === "rollo" ? "rollo" :
                        p.tipoVenta === "tramo" ? "tramo" : "unidad"}:</strong>{" "}
                      {r.coberturaUnidad.toFixed(2)} m²
                    </p>
                    <hr style={{ border: "none", borderTop: darkMode ? "1px solid #374151" : "1px solid #e5e7eb", margin: "12px 0" }} />

                    {p.tipoVenta !== "unidad" && p.tipoVenta !== "tramo" && (
                      <>
                        <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                          <strong>Área:</strong> {r.area.toFixed(2)} m²
                        </p>
                        <p style={{ color: darkMode ? "#d1d5db" : "#374151", marginBottom: "8px", fontSize: "clamp(0.85rem, 1.5vw, 1rem)" }}>
                          <strong>Área con desperdicio:</strong> {r.areaConDesc.toFixed(2)} m²
                        </p>
                      </>
                    )}

                    {(p.tipoVenta === "rollo" || p.tipoVenta === "tramo") ? (
                      <p style={{ color: "#2563eb", fontWeight: "600", marginBottom: "8px", fontSize: "clamp(0.95rem, 1.6vw, 1.05rem)" }}>
                        <strong>Material requerido:</strong> {r.metrosLineales.toFixed(2)} ml
                      </p>
                    ) : (
                      <p style={{ color: "#2563eb", fontWeight: "600", marginBottom: "8px", fontSize: "clamp(0.95rem, 1.6vw, 1.05rem)" }}>
                        <strong>
                          {p.tipoVenta === "caja" ? "Cajas necesarias" :
                           p.tipoVenta === "unidad" ? "Unidades necesarias" : "Piezas necesarias"}:
                        </strong> {r.cantidad}
                      </p>
                    )}
                  </>
                )}

                <hr style={{ border: "none", borderTop: darkMode ? "1px solid #374151" : "1px solid #e5e7eb", margin: "12px 0" }} />

                <strong style={{ color: darkMode ? "#fff" : "#111827", fontSize: "clamp(0.9rem, 1.5vw, 1rem)" }}>
                  Datos guardados (solo áreas activas):
                </strong>
                {areasActivas.length > 0 ? (
                  p.tipoVenta === "tramo" ? (
                    areasActivas.map((a, idx) => (
                      <p key={idx} style={{ fontSize: "clamp(0.8rem, 1.3vw, 0.9rem)" }}>
                        Perímetro {idx + 1}: {Number(a.perimetro || 0).toFixed(2)} m
                      </p>
                    ))
                  ) : p.tipoVenta === "unidad" ? (
                    areasActivas.map((a, idx) => (
                      <p key={idx} style={{ fontSize: "clamp(0.8rem, 1.3vw, 0.9rem)" }}>
                        Cantidad {idx + 1}: {Number(a.cantidad || 0)}
                      </p>
                    ))
                  ) : p.tipoVenta === "otros" ? (
                    areasActivas.map((a, idx) => (
                      <p key={idx} style={{ fontSize: "clamp(0.8rem, 1.3vw, 0.9rem)" }}>
                        Área {idx + 1}: {Number(a.area || 0).toFixed(2)} m²
                      </p>
                    ))
                  ) : (
                    areasActivas.map((a, idx) => (
                      <p key={idx} style={{ fontSize: "clamp(0.8rem, 1.3vw, 0.9rem)" }}>
                        Área {idx + 1}: {((Number(a.largo) || 0) * (Number(a.ancho) || 0)).toFixed(2)} m²
                      </p>
                    ))
                  )
                ) : (
                  <p style={{ fontSize: "clamp(0.8rem, 1.3vw, 0.9rem)", color: "#6b7280" }}>
                    Ninguna área seleccionada
                  </p>
                )}

                <p
                  style={{
                    fontSize: "clamp(1.1rem, 2.2vw, 1.5rem)",
                    fontWeight: "700",
                    color: "#16a34a",
                    marginTop: "10px"
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
                    onChange={(e) =>
                      setCliente({ ...cliente, nombre: e.target.value })
                    }
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
                    onChange={(e) =>
                      setCliente({ ...cliente, correo: e.target.value })
                    }
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
                    onChange={(e) =>
                      setCliente({ ...cliente, celular: e.target.value })
                    }
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
                        fontWeight: "600",
                        touchAction: "manipulation"
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
                        touchAction: "manipulation",
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

        {/* MODAL DE ZOOM */}
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