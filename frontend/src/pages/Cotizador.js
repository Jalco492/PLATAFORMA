import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import jsPDF from "jspdf";
import api from "../services/api";

// 🔥 FUNCIÓN PARA GENERAR URL DE IMAGEN - CON DEPURACIÓN
const getImageUrl = (imagen) => {
  console.log("🔍 getImageUrl - imagen recibida:", imagen);
  
  if (!imagen) {
    console.log("⚠️ imagen vacía, usando placeholder");
    return "https://via.placeholder.com/200?text=Sin+imagen";
  }

  // Si ya viene con una URL completa la usa directamente
  if (imagen.startsWith("http://") || imagen.startsWith("https://")) {
    console.log("✅ imagen con URL completa:", imagen);
    return imagen;
  }

  // 🔥 USAR LA MISMA URL DEL BACKEND
  const API_BASE = process.env.REACT_APP_API_URL || 'https://backend-zuib.onrender.com';
  console.log("🔧 API_BASE:", API_BASE);
  
  let urlCompleta = "";
  
  // Si la imagen comienza con /, la concatena con el backend
  if (imagen.startsWith("/")) {
    urlCompleta = `${API_BASE}${imagen}`;
  } else {
    // Si no comienza con /, la agrega
    urlCompleta = `${API_BASE}/${imagen}`;
  }
  
  console.log("✅ URL completa generada:", urlCompleta);
  return urlCompleta;
};

// 🔥 FUNCIÓN PARA OBTENER LA IMAGEN DEL PRODUCTO - CON DEPURACIÓN
const obtenerImagenProducto = (producto) => {
  console.log("🔍 obtenerImagenProducto - producto:", producto?.nombre || "sin producto");
  
  if (!producto) {
    console.log("⚠️ producto es null/undefined");
    return "https://via.placeholder.com/200?text=Sin+imagen";
  }

  let imagenUrl = "";

  console.log("📸 producto.imagenes:", producto.imagenes);
  console.log("📸 producto.imagen:", producto.imagen);

  // Prioriza 'imagenes' (puede tener múltiples separadas por coma)
  if (producto.imagenes && producto.imagenes.trim() !== "") {
    imagenUrl = producto.imagenes.split(",")[0].trim();
    console.log("✅ usando imagenes[0]:", imagenUrl);
  } 
  // Si no tiene 'imagenes', usa 'imagen'
  else if (producto.imagen && producto.imagen.trim() !== "") {
    imagenUrl = producto.imagen.trim();
    console.log("✅ usando imagen:", imagenUrl);
  } 
  // Si no tiene ninguna, usa placeholder
  else {
    console.log("⚠️ no tiene imagen ni imagenes, usando placeholder");
    return "https://via.placeholder.com/200?text=Sin+imagen";
  }

  // Aplica la función getImageUrl para obtener la URL completa
  const urlFinal = getImageUrl(imagenUrl);
  console.log("✅ URL final:", urlFinal);
  return urlFinal;
};

// 🔥 FUNCIÓN PARA CONVERTIR IMAGEN A BASE64
const convertirImagenBase64 = async (url) => {
  try {
    console.log("🔍 convertirImagenBase64 - url:", url);
    
    if (!url) return null;
    
    // Si la URL es placeholder, retorna null
    if (url.includes("placeholder")) {
      console.log("⚠️ es placeholder, retornando null");
      return null;
    }
    
    console.log("🌐 haciendo fetch a:", url);
    const response = await fetch(url);
    console.log("📡 response status:", response.status);
    
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`);
    }
    const blob = await response.blob();
    console.log("📦 blob recibido, tamaño:", blob.size);
    
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log("✅ imagen convertida a base64 correctamente");
        resolve(reader.result);
      };
      reader.onerror = (err) => {
        console.error("❌ error en FileReader:", err);
        reject(err);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('❌ Error convirtiendo imagen a base64:', error);
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

  const [medidas, setMedidas] = useState([
    {
      largo: "",
      ancho: ""
    }
  ]);

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

        console.log("📦 Productos guardados en localStorage:", guardados);

        const res = await api.get("/productos");
        console.log("📦 Productos desde API:", res.data);

        const combinados = guardados
          .map((guardado) => {
            const productoBD = res.data.find(
              (prod) => prod.id === guardado.id
            );

            if (!productoBD) {
              console.log(`⚠️ Producto ${guardado.id} no encontrado en BD`);
              return null;
            }

            console.log(`✅ Producto encontrado: ${productoBD.nombre}`);
            console.log(`📸 imagenes: ${productoBD.imagenes}`);
            console.log(`📸 imagen: ${productoBD.imagen}`);

            // INICIALIZACIÓN DE ÁREAS SEGÚN TIPO DE VENTA
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

        console.log("✅ Productos combinados:", combinados);
        setProductos(combinados);
      } catch (error) {
        console.error("❌ Error cargando productos:", error);
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
    // CÁLCULO PARA "OTROS"
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

    // CÁLCULO PARA LOS DEMÁS TIPOS
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
      console.log("🖼️ Cargando membrete portada:", fondoUrl);
      const fondo = await convertirImagenBase64(fondoUrl);
      if (fondo) {
        pdf.addImage(fondo, "JPEG", 0, 0, pageWidth, pageHeight);
        console.log("✅ Membrete portada agregado");
      }
    } catch (error) {
      console.log("❌ Error cargando membrete de portada:", error);
    }
  };

  // 🔥 FUNCIÓN PARA AGREGAR MEMBRETADO INTERNO
  const agregarMembretadoInterno = async (pdf) => {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    try {
      const fondoUrl = window.location.origin + "/membretedos.jpg";
      console.log("🖼️ Cargando membrete interno:", fondoUrl);
      const fondo = await convertirImagenBase64(fondoUrl);
      if (fondo) {
        pdf.addImage(fondo, "JPEG", 0, 0, pageWidth, pageHeight);
        console.log("✅ Membrete interno agregado");
      }
    } catch (error) {
      console.log("❌ Error cargando membrete interno:", error);
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

  // 🔥 FUNCIÓN GENERAR PDF
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

        if (y > 220) {
          pdf.addPage();
          await agregarMembretadoInterno(pdf);
          y = 20;
        }

        // 🔥 IMAGEN DEL PRODUCTO - CON DEPURACIÓN
        try {
          const imgUrl = obtenerImagenProducto(producto);
          console.log(`📸 Producto ${producto.nombre} - URL imagen:`, imgUrl);
          
          const imagenBase64 = await convertirImagenBase64(imgUrl);
          if (imagenBase64) {
            pdf.addImage(imagenBase64, "JPEG", 15, y, 50, 50);
            console.log(`✅ Imagen agregada para ${producto.nombre}`);
          } else {
            console.log(`⚠️ No se pudo obtener imagen para ${producto.nombre}`);
            pdf.setFontSize(10);
            pdf.setTextColor(150);
            pdf.text("Imagen no disponible", 15, y + 25);
          }
        } catch (error) {
          console.error(`❌ Error con imagen de ${producto.nombre}:`, error);
          pdf.setFontSize(10);
          pdf.setTextColor(150);
          pdf.text("Imagen no disponible", 15, y + 25);
        }

        // DATOS DEL PRODUCTO
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

        // ... (resto del PDF igual)
        y += 60;
      }

      // ENVIAR POR CORREO
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
          
          // 🔥 Obtener la URL de la imagen para este producto
          const imagenUrl = obtenerImagenProducto(p);
          console.log(`🖼️ Renderizando ${p.nombre} - imagenUrl:`, imagenUrl);

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
              {/* HEADER PRODUCTO - CON IMAGEN */}
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
                    console.error(`❌ Error cargando imagen de ${p.nombre}:`, imagenUrl);
                    e.target.src = "https://via.placeholder.com/90x90?text=Sin+imagen";
                  }}
                  onLoad={() => {
                    console.log(`✅ Imagen cargada correctamente para ${p.nombre}`);
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

              {/* El resto del componente sigue igual... */}
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