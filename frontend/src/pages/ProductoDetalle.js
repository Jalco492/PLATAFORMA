import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Footer from "./Footer";
import Navbar from "./Navbar";


// 🔥 FUNCIÓN PARA GENERAR URL DE IMAGEN - VERSIÓN CORREGIDA
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

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ========== ESTADOS ==========
  const [producto, setProducto] = useState(null);
  const [indice, setIndice] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [relacionados, setRelacionados] = useState([]);
  const [sugeridos, setSugeridos] = useState([]);
  const [imagenGuiaZoom, setImagenGuiaZoom] = useState(null);
  const [perimetro, setPerimetro] = useState("");

  // 🔥 MODELOS DISPONIBLES - SOLO MISMO TIPO
  const [modelosDisponibles, setModelosDisponibles] = useState([]);
  const [modeloSeleccionado, setModeloSeleccionado] = useState(null);
  const [indiceCarrusel, setIndiceCarrusel] = useState(0);

  // ❤️ FAVORITOS
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos");
    return guardados ? JSON.parse(guardados) : [];
  });

  // 📋 DATOS DE NAVEGACIÓN (categorías, subcategorías, tipos)
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [tipos, setTipos] = useState([]);

  // 📦 PRODUCTOS (para el navbar y lógica)
  const [productos, setProductos] = useState([]);

  // 👤 CLIENTE
  const [cliente, setCliente] = useState({
    nombre: "",
    correo: "",
    celular: "",
  });

  const [enviando, setEnviando] = useState(false);
  const [mensajeEnviado, setMensajeEnviado] = useState("");

  // FICHA TÉCNICA ZOOM
  const [fichaZoom, setFichaZoom] = useState(false);

  // 🟢 COTIZADOR
  const [mostrarCotizador, setMostrarCotizador] = useState(false);
  const [medidas, setMedidas] = useState([{ largo: "", ancho: "" }]);
  const [desperdicio, setDesperdicio] = useState(0);
  const cotizadorRef = useRef();
  const imagenPDFRef = useRef();
  const carruselIntervalRef = useRef(null);
  const carruselScrollRef = useRef(null);

  // ========== EFECTO PARA EVITAR CORTE EN CELULAR ==========
  useEffect(() => {
    // Scroll al inicio cuando se carga la página
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // Asegurar que el body no tenga padding superior extra
    document.body.style.paddingTop = '0';
    document.body.style.marginTop = '0';
    
    return () => {
      document.body.style.paddingTop = '';
      document.body.style.marginTop = '';
    };
  }, []);

  // ========== EFECTOS ==========

  useEffect(() => {
    const cargarDatosNavegacion = async () => {
      try {
        const [catRes, subRes, tipoRes] = await Promise.all([
          api.get("/categorias"),
          api.get("/subcategorias"),
          api.get("/tipos"),
        ]);
        setCategorias(catRes.data);
        setSubcategorias(subRes.data);
        setTipos(tipoRes.data);
      } catch (error) {
        console.error("Error cargando datos de navegación:", error);
      }
    };
    cargarDatosNavegacion();
  }, []);

  useEffect(() => {
    api
      .get("/productos")
      .then((res) => setProductos(res.data))
      .catch((err) => console.error("Error cargando productos:", err));
  }, []);

  useEffect(() => {
    api
      .get(`/productos/${id}`)
      .then((res) => {
        setProducto(res.data);
        setIndice(0);
        setModeloSeleccionado(null);
        setIndiceCarrusel(0);
        setMedidas([{ largo: "", ancho: "" }]);
        setDesperdicio(0);
      })
      .catch((err) => console.error("Error cargando producto:", err));
  }, [id]);

  // ===== 🔥 MODELOS DISPONIBLES - SOLO MISMO TIPO =====
  useEffect(() => {
    if (!producto) {
      setModelosDisponibles([]);
      return;
    }

    const tipoId = producto.tipo_id;

    if (!tipoId) {
      setModelosDisponibles([]);
      return;
    }

    api
      .get(`/productos/tipo/${tipoId}`)
      .then((res) => {
        const filtrados = res.data.filter(p => p.id !== producto.id && p.visible === 1);
        setModelosDisponibles(filtrados);
        if (filtrados.length > 0 && !modeloSeleccionado) {
          setModeloSeleccionado(null);
        }
      })
      .catch((err) => {
        console.error("❌ Error cargando modelos disponibles:", err);
        filtrarModelosLocalmente();
      });

    const filtrarModelosLocalmente = () => {
      const tipoActual = producto.tipo?.toLowerCase().trim() || '';
      if (!tipoActual) {
        setModelosDisponibles([]);
        return;
      }

      api
        .get("/productos")
        .then((res) => {
          const filtrados = res.data.filter((p) => {
            if (p.id === producto.id) return false;
            const tipoP = p.tipo?.toLowerCase().trim() || '';
            return tipoP === tipoActual && p.visible === 1;
          });
          setModelosDisponibles(filtrados);
          if (filtrados.length > 0 && !modeloSeleccionado) {
            setModeloSeleccionado(null);
          }
        })
        .catch((err) => console.error("Error en fallback:", err));
    };
  }, [producto]);

  // ===== 🔥 CARRUSEL AUTOMÁTICO CON DESPLAZAMIENTO Y EFECTO 3D =====
  useEffect(() => {
    if (modelosDisponibles.length > 1 && carruselScrollRef.current) {
      const scrollContainer = carruselScrollRef.current;
      const items = scrollContainer.querySelectorAll('.modelo-carrusel-item-right');
      
      if (items.length === 0) return;

      carruselIntervalRef.current = setInterval(() => {
        setIndiceCarrusel((prev) => {
          const nextIndex = (prev + 1) % modelosDisponibles.length;
          
          if (scrollContainer && items[nextIndex]) {
            const itemWidth = items[nextIndex].offsetWidth + 12;
            const scrollPosition = nextIndex * itemWidth;
            
            scrollContainer.scrollTo({
              left: scrollPosition,
              behavior: 'smooth'
            });
          }
          
          return nextIndex;
        });
      }, 3500);
    }

    return () => {
      if (carruselIntervalRef.current) {
        clearInterval(carruselIntervalRef.current);
      }
    };
  }, [modelosDisponibles]);

  // ===== PRODUCTOS RELACIONADOS =====
  useEffect(() => {
    if (!producto) return;

    if (producto.subcategoria_id) {
      api
        .get(`/productos/subcategoria-id/${producto.subcategoria_id}`)
        .then((res) => {
          const filtrados = res.data.filter(p => p.id !== producto.id);
          setRelacionados(filtrados);
        })
        .catch((err) => {
          console.error("❌ Error cargando productos relacionados:", err);
          filtrarRelacionadosLocalmente();
        });
    } else {
      filtrarRelacionadosLocalmente();
    }

    const filtrarRelacionadosLocalmente = () => {
      const subcategoriaActual = producto.subcategoria?.toLowerCase().trim() || '';
      if (!subcategoriaActual) {
        setRelacionados([]);
        return;
      }

      api
        .get("/productos")
        .then((res) => {
          const filtrados = res.data.filter((p) => {
            if (p.id === producto.id) return false;
            const subcategoriaP = p.subcategoria?.toLowerCase().trim() || '';
            return subcategoriaP === subcategoriaActual && p.visible === 1;
          });
          setRelacionados(filtrados);
        })
        .catch((err) => console.error("Error en fallback:", err));
    };

    let idsSugeridos = [];
    try {
      idsSugeridos = producto.sugerencias ? JSON.parse(producto.sugerencias) : [];
    } catch {
      idsSugeridos = [];
    }
    api
      .get("/productos")
      .then((res) => {
        const listaSugeridos = res.data.filter((p) => 
          idsSugeridos.includes(String(p.id)) && p.id !== producto.id
        );
        setSugeridos(listaSugeridos);
      })
      .catch((err) => console.error("Error cargando sugeridos:", err));
  }, [producto]);

  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  // ========== FUNCIONES ==========

  const toggleFavorito = (producto) => {
    const existe = favoritos.find((fav) => fav.id === producto.id);
    if (existe) {
      setFavoritos(favoritos.filter((f) => f.id !== producto.id));
    } else {
      setFavoritos([...favoritos, producto]);
    }
  };

  const esFavorito = (id) => favoritos.some((f) => f.id === id);

  // 🔥 FUNCIÓN PARA OBTENER IMAGEN DEL PRODUCTO - VERSIÓN CORREGIDA
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

  // Aplica la función getImageUrl para obtener la URL completa
  return getImageUrl(imagenUrl);
};

  const imagenes = producto?.imagenes
    ? producto.imagenes.split(",")
    : producto?.imagen
    ? [producto.imagen]
    : [];

  const handleMouseMove = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
  };

  const seleccionarModelo = (modelo, index) => {
    if (carruselIntervalRef.current) {
      clearInterval(carruselIntervalRef.current);
      carruselIntervalRef.current = null;
    }
    
    setModeloSeleccionado(modelo);
    setIndiceCarrusel(index);
    setIndice(0);

    setTimeout(() => {
      if (carruselScrollRef.current) {
        const items = carruselScrollRef.current.querySelectorAll('.modelo-carrusel-item-right');
        if (items[index]) {
          const itemWidth = items[index].offsetWidth + 12;
          carruselScrollRef.current.scrollTo({
            left: index * itemWidth,
            behavior: 'smooth'
          });
        }
      }
    }, 50);
  };

  const navegarCarrusel = (direccion) => {
    if (modelosDisponibles.length === 0) return;
    
    if (carruselIntervalRef.current) {
      clearInterval(carruselIntervalRef.current);
      carruselIntervalRef.current = null;
    }

    const nuevoIndice = (indiceCarrusel + direccion + modelosDisponibles.length) % modelosDisponibles.length;
    setIndiceCarrusel(nuevoIndice);
    
    setTimeout(() => {
      if (carruselScrollRef.current) {
        const items = carruselScrollRef.current.querySelectorAll('.modelo-carrusel-item-right');
        if (items[nuevoIndice]) {
          const itemWidth = items[nuevoIndice].offsetWidth + 12;
          carruselScrollRef.current.scrollTo({
            left: nuevoIndice * itemWidth,
            behavior: 'smooth'
          });
        }
      }
    }, 50);
  };

  const reiniciarCarruselAutomatico = () => {
    if (carruselIntervalRef.current) {
      clearInterval(carruselIntervalRef.current);
    }
    if (modelosDisponibles.length > 1) {
      carruselIntervalRef.current = setInterval(() => {
        setIndiceCarrusel((prev) => {
          const nextIndex = (prev + 1) % modelosDisponibles.length;
          
          if (carruselScrollRef.current) {
            const items = carruselScrollRef.current.querySelectorAll('.modelo-carrusel-item-right');
            if (items[nextIndex]) {
              const itemWidth = items[nextIndex].offsetWidth + 12;
              carruselScrollRef.current.scrollTo({
                left: nextIndex * itemWidth,
                behavior: 'smooth'
              });
            }
          }
          
          return nextIndex;
        });
      }, 3500);
    }
  };

  // ========== FUNCIÓN PARA SELECCIONAR PRODUCTO RELACIONADO ==========
  const seleccionarProductoRelacionado = (productoRelacionado) => {
    navigate(`/producto/${productoRelacionado.id}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ========== FUNCIÓN PARA AGRUPAR PRODUCTOS POR TIPO ==========
  const agruparPorTipo = (productos) => {
    const grupos = {};
    productos.forEach(p => {
      let tipo = p.tipo || p.tipo_nombre || 'Sin tipo';
      if (tipo.toLowerCase() === 'sin nombre' || tipo.toLowerCase() === 'sin tipo') {
        tipo = 'Sin tipo';
      }
      if (!grupos[tipo]) {
        grupos[tipo] = [];
      }
      grupos[tipo].push(p);
    });
    return grupos;
  };

  // ========== OBTENER COLOR PARA CADA TIPO ==========
  const getTipoColor = (tipo) => {
    const colores = {
      'Sin tipo': '#94a3b8',
      'Piso': '#3b82f6',
      'PVC': '#8b5cf6',
      'Autoadherible': '#06b6d4',
      'Madera': '#d97706',
      'Cerámica': '#ef4444',
      'Laminado': '#10b981',
      'Porcelanato': '#6366f1',
      'Mármol': '#8b5cf6',
      'Granito': '#f59e0b',
      'Vinilico': '#14b8a6',
      'SPC': '#0ea5e9',
      'WPC': '#84cc16',
      'Linóleo': '#22d3ee',
    };
    for (const [key, color] of Object.entries(colores)) {
      if (tipo.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(tipo.toLowerCase())) {
        return color;
      }
    }
    return '#3b82f6';
  };

  // ========== FUNCIÓN PARA AGREGAR AL PEDIDO ==========
  const agregarAlPedido = (productoParaAgregar) => {
    const carritoGuardado = sessionStorage.getItem("carritoPedido");
    let carrito = carritoGuardado ? JSON.parse(carritoGuardado) : [];
    
    const existe = carrito.find(item => item.id === productoParaAgregar.id);
    
    if (existe) {
      carrito = carrito.map(item => 
        item.id === productoParaAgregar.id 
          ? { 
              ...item, 
              cantidad: item.cantidad + 1, 
              subtotal: item.precio * (item.cantidad + 1) 
            }
          : item
      );
    } else {
      const productoConImagen = {
        ...productoParaAgregar,
        imagen: obtenerImagen(productoParaAgregar),
        cantidad: 1,
        subtotal: productoParaAgregar.precio || 0
      };
      carrito.push(productoConImagen);
    }
    
    sessionStorage.setItem("carritoPedido", JSON.stringify(carrito));
    
    alert(`✅ "${productoParaAgregar.nombre}" agregado al pedido (${existe ? 'cantidad actualizada' : 'nuevo producto'})`);
    
    navigate("/pedido", { 
      state: { 
        productoAgregado: { 
          producto: productoParaAgregar, 
          cantidad: existe ? existe.cantidad + 1 : 1 
        } 
      } 
    });
  };

  // ========== COTIZADOR ==========

  const agregarMedida = () => {
    if (medidas.length >= 5) return;
    setMedidas([...medidas, { largo: "", ancho: "" }]);
  };

  const eliminarMedida = (index) => {
    if (medidas.length === 1) return;
    setMedidas(medidas.filter((_, i) => i !== index));
  };

  const actualizarMedida = (index, campo, valor) => {
    const nuevas = [...medidas];
    nuevas[index][campo] = valor;
    setMedidas(nuevas);
  };

  const limpiarCampos = () => {
    setMedidas([{ largo: "", ancho: "" }]);
  };

  const [modoCotizacion, setModoCotizacion] = useState("todas");
  const [areaSeleccionada, setAreaSeleccionada] = useState(0);

  // ========== CÁLCULOS ==========

  let areaIngresada = 0;
  if (producto?.tipoVenta === "otros") {
    areaIngresada = Number(medidas[0]?.area) || 0;
  } else {
    areaIngresada =
      modoCotizacion === "todas"
        ? medidas.reduce((total, item) => {
            const largo = Number(item.largo) || 0;
            const ancho = Number(item.ancho) || 0;
            return total + largo * ancho;
          }, 0)
        : (Number(medidas[areaSeleccionada]?.largo) || 0) *
          (Number(medidas[areaSeleccionada]?.ancho) || 0);
  }

  const areaConDesperdicio = areaIngresada * (1 + Number(desperdicio) / 100);

  const anchoM = (Number(producto?.ancho) || 0) / 100;
  const altoM = (Number(producto?.alto) || 0) / 100;
  const coberturaPorPieza = anchoM * altoM;
  const piezasCaja = Number(producto?.piezasCaja) || 1;

  let coberturaPorUnidad = 0;
  if (producto?.tipoVenta === "otros") {
    coberturaPorUnidad = Number(producto?.cobertura) || 0;
  } else {
    coberturaPorUnidad = producto?.tipoVenta === "caja" ? coberturaPorPieza * piezasCaja : coberturaPorPieza;
  }

  let metrosLineales = 0;
  let cantidadNecesaria = 0;
  let areaCubierta = 0;

  if (producto?.tipoVenta === "otros") {
    cantidadNecesaria = coberturaPorUnidad > 0 ? Math.ceil(areaIngresada / coberturaPorUnidad) : 0;
    areaCubierta = cantidadNecesaria * coberturaPorUnidad;
  } else if (producto?.tipoVenta === "unidad") {
    cantidadNecesaria = medidas.reduce((total, item) => total + (Number(item.cantidad) || 0), 0);
  } else if (producto?.tipoVenta === "tramo") {
    metrosLineales = medidas.reduce((total, item) => total + (Number(item.perimetro) || 0), 0);
    cantidadNecesaria = metrosLineales;
  } else if (producto?.tipoVenta === "rollo") {
    const anchoMaterial = Math.min(anchoM, altoM);
    metrosLineales = anchoMaterial > 0 ? areaConDesperdicio / anchoMaterial : 0;
    cantidadNecesaria = metrosLineales;
  } else {
    cantidadNecesaria =
      coberturaPorUnidad > 0 ? Math.ceil(areaConDesperdicio / coberturaPorUnidad) : 0;
  }

  const precioFinal = Number(producto?.oferta ? producto?.precioOferta : producto?.precio) || 0;
  let total = 0;
  if (producto?.tipoVenta === "rollo") {
    total = areaConDesperdicio * precioFinal;
  } else if (producto?.tipoVenta === "tramo" || producto?.tipoVenta === "unidad" || producto?.tipoVenta === "otros") {
    total = cantidadNecesaria * precioFinal;
  } else {
    total = cantidadNecesaria * precioFinal;
  }
  total = total.toFixed(2);

  // ========== PDF ==========

  const convertirImagenBase64 = async (url) => {
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
      const response = await fetch(fullUrl);
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

  const obtenerDetalleMedidas = () => {
    return medidas.map((item, index) => {
      if (producto?.tipoVenta === "unidad") {
        return { numero: index + 1, cantidad: Number(item.cantidad) || 0 };
      }
      if (producto?.tipoVenta === "tramo") {
        return { numero: index + 1, perimetro: Number(item.perimetro) || 0 };
      }
      if (producto?.tipoVenta === "otros") {
        return { numero: 1, area: Number(item.area) || 0 };
      }
      const largo = Number(item.largo) || 0;
      const ancho = Number(item.ancho) || 0;
      return { numero: index + 1, largo, ancho, area: largo * ancho };
    });
  };

  const generarPDF = async () => {
    try {
      setEnviando(true);
      const pdf = new jsPDF("p", "mm", "a4");
      const membrete1 = await convertirImagenBase64(
        window.location.origin + "/membreteuno.jpg"
      );
      const membrete2 = await convertirImagenBase64(
        window.location.origin + "/membretedos.jpg"
      );
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const ponerFondo = (pdf, img) => {
        if (!img) return;
        pdf.addImage(img, "JPEG", 0, 0, pageWidth, pageHeight);
      };

      ponerFondo(pdf, membrete1);
      let y = 50;
      const numeroCotizacion = Math.floor(100000 + Math.random() * 900000);
      const fechaActual = new Date().toLocaleDateString("es-MX");
      pdf.setFontSize(10);
      pdf.setTextColor(80);
      pdf.text(`Fecha: ${fechaActual}`, pageWidth - 60, 35);
      pdf.text(`Cotización #${numeroCotizacion}`, pageWidth - 60, 42);
      pdf.setDrawColor(200);
      pdf.line(15, 55, pageWidth - 15, 55);
      y = 70;

      const imagenBase64 = await convertirImagenBase64(getImagenActual());
      if (imagenBase64) {
        pdf.addImage(imagenBase64, "JPEG", 15, y, 60, 60);
      } else {
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text("Imagen no disponible", 15, y + 30);
      }

      pdf.setFontSize(14);
      pdf.setTextColor(40);
      pdf.text(`Producto: ${getNombreActual()}`, 85, y + 10);
      pdf.text(`Categoría: ${producto.categoria || "-"}`, 85, y + 20);
      pdf.text(`Subcategoría: ${producto.subcategoria || "-"}`, 85, y + 30);
      pdf.text(`SKU: ${producto.sku || "-"}`, 85, y + 40);
      pdf.setFontSize(20);
      pdf.setTextColor(22, 163, 74);
      pdf.text(`Total: $${total}`, 85, y + 55);

      y += 90;
      pdf.setFontSize(18);
      pdf.setTextColor(0);
      pdf.text("Resumen de Cotización", 15, y);
      y += 10;
      pdf.setFillColor(245, 247, 250);
      pdf.roundedRect(15, y, pageWidth - 30, 45, 3, 3, "F");
      pdf.setFontSize(11);
      pdf.setTextColor(60);

      if (producto?.tipoVenta === "otros") {
        pdf.text(`Área a cubrir: ${areaIngresada.toFixed(2)} m²`, 20, y + 8);
        pdf.text(`Cobertura por unidad: ${coberturaPorUnidad.toFixed(2)} m²`, 20, y + 18);
        pdf.text(`Unidades necesarias: ${cantidadNecesaria}`, 20, y + 28);
        pdf.text(`Área total cubierta: ${areaCubierta.toFixed(2)} m²`, 20, y + 38);
      } else if (producto?.tipoVenta === "unidad") {
        pdf.text(`Cantidad total de unidades: ${cantidadNecesaria}`, 20, y + 8);
      } else {
        pdf.text(
          `Modo de cotización: ${
            modoCotizacion === "todas" ? "Todas las áreas" : "Área seleccionada"
          }`,
          20,
          y + 8
        );
        pdf.text(`Área total: ${areaIngresada.toFixed(2)} m²`, 20, y + 18);
        pdf.text(`Desperdicio: ${desperdicio}%`, 20, y + 28);
        pdf.text(`Área final: ${areaConDesperdicio.toFixed(2)} m²`, 20, y + 38);
      }

      y += 60;
      pdf.setFontSize(14);
      pdf.setTextColor(30);
      pdf.text("Detalle de Medidas", 15, y);
      y += 10;
      const detalleMedidas = obtenerDetalleMedidas();
      detalleMedidas.forEach((item) => {
        pdf.setFontSize(11);
        if (producto.tipoVenta === "unidad") {
          pdf.text(`Cantidad ${item.numero}: ${item.cantidad}`, 20, y);
        } else if (producto.tipoVenta === "tramo") {
          pdf.text(`Perímetro ${item.numero}: ${item.perimetro} m`, 20, y);
        } else if (producto.tipoVenta === "otros") {
          pdf.text(`Área a cubrir: ${item.area.toFixed(2)} m²`, 20, y);
        } else {
          pdf.text(
            `Área ${item.numero}: ${item.largo} x ${item.ancho} = ${item.area.toFixed(2)} m²`,
            20,
            y
          );
        }
        y += 8;
      });

      let notaProducto = "";
      if (producto.tipoVenta === "rollo") {
        notaProducto =
          `Este producto se vende por rollo. ` +
          `Cada rollo mide ${formatMeters(producto.ancho)} m x ${formatMeters(
            producto.alto
          )} m y cubre ${coberturaPorUnidad.toFixed(2)} m². ` +
          `Para cubrir ${areaConDesperdicio.toFixed(2)} m² necesitas aproximadamente ${metrosLineales.toFixed(
            2
          )} metros lineales.`;
      } else if (producto.tipoVenta === "caja") {
        notaProducto =
          `Este producto se vende por caja. ` +
          `Cada caja contiene ${producto.piezasCaja} piezas y cubre ${coberturaPorUnidad.toFixed(
            2
          )} m². ` +
          `Para cubrir ${areaConDesperdicio.toFixed(2)} m² necesitas aproximadamente ${cantidadNecesaria} cajas.`;
      } else if (producto.tipoVenta === "pieza") {
        notaProducto =
          `Cada pieza cubre ${coberturaPorUnidad.toFixed(2)} m². ` +
          `Para cubrir ${areaConDesperdicio.toFixed(2)} m² necesitas aproximadamente ${cantidadNecesaria} piezas.`;
      } else if (producto.tipoVenta === "unidad") {
        notaProducto = `Se requieren aproximadamente ${cantidadNecesaria} unidades para este proyecto.`;
      } else if (producto.tipoVenta === "tramo") {
        notaProducto = `Para cubrir ${cantidadNecesaria.toFixed(2)} metros necesitas aproximadamente ${cantidadNecesaria.toFixed(
          2
        )} metros lineales.`;
      } else if (producto.tipoVenta === "otros") {
        notaProducto =
          `Este producto se vende por presentación (${producto.presentacion || "unidad"}). ` +
          `Cada unidad cubre ${coberturaPorUnidad.toFixed(2)} m². ` +
          `Para cubrir ${areaIngresada.toFixed(2)} m² necesitas aproximadamente ${cantidadNecesaria} unidades. ` +
          `Esto cubrirá ${areaCubierta.toFixed(2)} m².`;
      }

      const lineasNota = pdf.splitTextToSize(notaProducto, pageWidth - 45);
      const altoNota = lineasNota.length * 5 + 12;
      if (y + altoNota > pageHeight - 50) {
        pdf.addPage();
        ponerFondo(pdf, membrete2);
        y = 50;
      }
      pdf.setFillColor(255, 248, 200);
      pdf.roundedRect(15, y, pageWidth - 30, altoNota, 3, 3, "F");
      pdf.setFontSize(10);
      pdf.setTextColor(90);
      pdf.text(lineasNota, 20, y + 8);
      y += altoNota + 15;

      if (y > pageHeight - 90) {
        pdf.addPage();
        y = 20;
        if (membrete2) ponerFondo(pdf, membrete2);
      }
      pdf.setFontSize(14);
      pdf.setTextColor(30);
      pdf.text("Condiciones Comerciales", 15, y);
      y += 10;
      const condiciones = [
        "• Precios sujetos a cambios sin previo aviso.",
        "• Vigencia de la cotización: 15 días.",
        "• Material sujeto a disponibilidad.",
        "• No incluye instalación ni envío salvo indicación expresa.",
      ];
      pdf.setFontSize(10);
      pdf.setTextColor(90);
      condiciones.forEach((item) => {
        pdf.text(item, 20, y);
        y += 7;
      });
      y += 10;

      if (y > pageHeight - 80) {
        pdf.addPage();
        ponerFondo(pdf, membrete2);
        y = 50;
      }
      pdf.setFillColor(22, 163, 74);
      pdf.roundedRect(15, y, pageWidth - 30, 18, 3, 3, "F");
      pdf.setTextColor(255);
      pdf.setFontSize(18);
      pdf.text(`TOTAL ESTIMADO: $${total}`, 20, y + 12);
      y += 30;
      pdf.setFontSize(16);
      pdf.setTextColor(0);
      pdf.text("Datos del Cliente", 15, y);
      y += 12;
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(15, y, pageWidth - 30, 28, 3, 3, "F");
      pdf.setFontSize(11);
      pdf.setTextColor(0);
      pdf.text(`Nombre: ${cliente.nombre || "-"}`, 20, y + 8);
      pdf.text(`Correo: ${cliente.correo || "-"}`, 20, y + 16);
      pdf.text(`Celular: ${cliente.celular || "-"}`, 20, y + 24);
      y += 40;

      const pdfBase64 = pdf.output("datauristring");
      await api.post("/enviar-cotizacion", {
        nombre: cliente.nombre,
        correo: cliente.correo,
        celular: cliente.celular,
        producto: producto.nombre,
        total,
        pdf: pdfBase64,
      });
      setMensajeEnviado("La cotización fue enviada a tu correo");
    } catch (error) {
      console.error(error);
      alert("Error generando cotización");
    } finally {
      setEnviando(false);
    }
  };

  const formatMeters = (cm) => (Number(cm) / 100).toFixed(2);

  // ========== RENDER ==========

  if (!producto) return <h2 style={{ padding: "20px" }}>Cargando...</h2>;

  const getStockColor = (stock) => {
    if (stock <= 0) return "#dc2626";
    if (stock <= 3) return "#f59e0b";
    return "#16a34a";
  };

  const plural = (stock, tipo) => {
    if (stock === 1) return tipo;
    if (tipo === "unidad") return "unidades";
    if (tipo === "pieza") return "piezas";
    if (tipo === "tramo") return "tramos";
    if (tipo === "caja") return "cajas";
    return tipo + "s";
  };

  // 🔥 FUNCIÓN MODIFICADA - getImagenActual con getImageUrl
const getImagenActual = () => {
  let imgUrl = '';
  if (modeloSeleccionado) {
    const img = modeloSeleccionado.imagenes 
      ? modeloSeleccionado.imagenes.split(",") 
      : [modeloSeleccionado.imagen];
    imgUrl = img[indice] || img[0] || '';
  } else {
    imgUrl = imagenes[indice] || imagenes[0] || '';
  }
  // Si no hay imagen, retorna placeholder
  if (!imgUrl) {
    return "https://via.placeholder.com/200";
  }
  return getImageUrl(imgUrl);
};

  const getNombreActual = () => {
    if (modeloSeleccionado) {
      return modeloSeleccionado.nombre;
    }
    return producto.nombre;
  };

  const getPrecioActual = () => {
    if (modeloSeleccionado) {
      return modeloSeleccionado.oferta ? modeloSeleccionado.precioOferta : modeloSeleccionado.precio;
    }
    return producto.oferta ? producto.precioOferta : producto.precio;
  };

  const getUnidadVenta = () => {
    const tipoVenta = producto?.tipoVenta || '';
    const unidadMap = {
      'caja': 'por caja',
      'pieza': 'por pieza',
      'tramo': 'por tramo',
      'rollo': 'por rollo',
      'unidad': 'por unidad',
      'otros': producto?.presentacion ? `por ${producto.presentacion}` : 'por unidad'
    };
    return unidadMap[tipoVenta] || '';
  };

  // Agrupar productos relacionados por tipo
  const relacionadosAgrupados = agruparPorTipo(relacionados);
  const sugeridosAgrupados = agruparPorTipo(sugeridos);

  return (
    <div className="producto-detalle-page">
      <Navbar
        productos={productos}
        categorias={categorias}
        subcategorias={subcategorias}
        tipos={tipos}
        favoritos={favoritos}
        toggleFavorito={toggleFavorito}
        esFavorito={esFavorito}
      />

      <div className="producto-detalle-container">
        {/* ===== LADO IZQUIERDO - GALERÍA Y COTIZADOR ===== */}
        <div className="producto-detalle-left">
          {/* GALERÍA */}
          <div className="producto-detalle-gallery">
            <div className="badges-container">
              {(producto.rebaja === 1 || producto.rebaja === true) && (
                <span className="badge rebaja">🔥 REBAJA</span>
              )}
              {(producto.destacado === 1 || producto.destacado === true) && (
                <span className="badge destacado">⭐ DESTACADO</span>
              )}
            </div>

            <button
              className="fav-btn"
              onClick={() => toggleFavorito(producto)}
              style={{
                background: esFavorito(producto.id) ? "#dc2626" : "#fff",
                color: esFavorito(producto.id) ? "#fff" : "#111",
              }}
            >
              ❤️
            </button>

            <div
              className="main-image-container"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setZoom(true)}
              onMouseLeave={() => setZoom(false)}
            >
              <img
                ref={imagenPDFRef}
                src={getImagenActual()}
                alt={getNombreActual()}
                className="main-image"
                style={{
                  transform: zoom ? "scale(2)" : "scale(1)",
                  transformOrigin: `${pos.x}% ${pos.y}%`,
                  transition: "transform 0.1s",
                }}
              />
            </div>

            {/* 🔥 THUMBNAILS MODIFICADOS */}
            <div className="thumbs-container">
              {(modeloSeleccionado 
                ? (modeloSeleccionado.imagenes ? modeloSeleccionado.imagenes.split(",") : [modeloSeleccionado.imagen])
                : imagenes
              ).map((img, i) => {
                const thumbUrl = getImageUrl(img);
                return (
                  <img
                    key={i}
                    src={thumbUrl}
                    alt={`miniatura-${i}`}
                    className="thumb"
                    onClick={() => setIndice(i)}
                    style={{
                      border: i === indice ? "2px solid #111" : "1px solid #ddd",
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* COTIZADOR */}
          <div className="cotizador-box">
            {producto.tipoVenta !== "unidad" && producto.tipoVenta !== "tramo" && producto.tipoVenta !== "otros" && (
              <div className="guia-medicion">
                <h3 className="guia-titulo">📏 ¿Cómo calcular los m²?</h3>
                <div className="guia-grid">
                  <div className="guia-card">
                    <img
                      src="/areasplanas.png"
                      alt="Cómo medir piso"
                      className="guia-img"
                      onClick={() => setImagenGuiaZoom("/areasplanas.png")}
                    />
                    <h4>Áreas planas (Pisos)</h4>
                    <p>Da clic en la imagen para ampliar.</p>
                  </div>
                  <div className="guia-card">
                    <img
                      src="/paredes.png"
                      alt="Cómo medir muro"
                      className="guia-img"
                      onClick={() => setImagenGuiaZoom("/paredes.png")}
                    />
                    <h4>Muros (Paredes)</h4>
                    <p>Da clic en la imagen para ampliar.</p>
                  </div>
                </div>
              </div>
            )}

            <h3 className="cotizador-title">🧮 Calcula cuánto necesitas</h3>

            {producto.tipoVenta !== "unidad" && producto.tipoVenta !== "tramo" && producto.tipoVenta !== "otros" && (
              <div className="selector-modo">
                <label>
                  <input
                    type="radio"
                    checked={modoCotizacion === "todas"}
                    onChange={() => setModoCotizacion("todas")}
                  />
                  Cotizar todas las áreas
                </label>
                <label>
                  <input
                    type="radio"
                    checked={modoCotizacion === "una"}
                    onChange={() => setModoCotizacion("una")}
                  />
                  Cotizar una sola área
                </label>
                <div className="resumen-area">
                  {modoCotizacion === "todas"
                    ? `📐 Área total: ${areaIngresada.toFixed(2)} m²`
                    : `📐 Área seleccionada: ${areaIngresada.toFixed(2)} m²`}
                </div>
              </div>
            )}

            <div className="medidas-container">
              {producto.tipoVenta === "otros" ? (
                <div className="medida-card">
                  <h4>Área a cubrir</h4>
                  <input
                    type="number"
                    placeholder="Ingresa los m² que deseas cubrir"
                    value={medidas[0]?.area || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setMedidas([{ area: val }]);
                    }}
                    className="input-field"
                    step="0.01"
                  />
                  <p className="resultado-medida">
                    Área ingresada: {areaIngresada.toFixed(2)} m²
                  </p>
                </div>
              ) : (
                medidas.map((item, index) => (
                  <div key={index} className="medida-card">
                    <h4>
                      {producto.tipoVenta === "unidad"
                        ? `Unidad ${index + 1}`
                        : producto.tipoVenta === "tramo"
                        ? `Perímetro ${index + 1}`
                        : `Área ${index + 1}`}
                    </h4>

                    {modoCotizacion === "una" && producto.tipoVenta !== "unidad" && producto.tipoVenta !== "tramo" && (
                      <label className="radio-label">
                        <input
                          type="radio"
                          checked={areaSeleccionada === index}
                          onChange={() => setAreaSeleccionada(index)}
                        />
                        Utilizar esta área
                      </label>
                    )}

                    {producto.tipoVenta === "unidad" ? (
                      <input
                        type="number"
                        placeholder="Cantidad de unidades"
                        value={item.cantidad || ""}
                        onChange={(e) =>
                          actualizarMedida(index, "cantidad", e.target.value)
                        }
                        className="input-field"
                      />
                    ) : producto.tipoVenta === "tramo" ? (
                      <input
                        type="number"
                        placeholder="Perímetro en metros"
                        value={item.perimetro || ""}
                        onChange={(e) =>
                          actualizarMedida(index, "perimetro", e.target.value)
                        }
                        className="input-field"
                      />
                    ) : (
                      <div className="medidas-grid">
                        <input
                          type="number"
                          placeholder="Largo (m)"
                          value={item.largo}
                          onChange={(e) =>
                            actualizarMedida(index, "largo", e.target.value)
                          }
                          className="input-field"
                        />
                        <input
                          type="number"
                          placeholder="Ancho (m)"
                          value={item.ancho}
                          onChange={(e) =>
                            actualizarMedida(index, "ancho", e.target.value)
                          }
                          className="input-field"
                        />
                      </div>
                    )}

                    <p className="resultado-medida">
                      {producto.tipoVenta === "unidad" ? (
                        <>Cantidad: {Number(item.cantidad || 0)}</>
                      ) : producto.tipoVenta === "tramo" ? (
                        <>Perímetro: {Number(item.perimetro || 0)} m</>
                      ) : (
                        <>
                          Área:{" "}
                          {(
                            (Number(item.largo) || 0) * (Number(item.ancho) || 0)
                          ).toFixed(2)}{" "}
                          m²
                        </>
                      )}
                    </p>

                    {producto.tipoVenta !== "unidad" && medidas.length > 1 && (
                      <button
                        className="btn-eliminar"
                        onClick={() => eliminarMedida(index)}
                      >
                        {producto.tipoVenta === "tramo"
                          ? "🗑 Eliminar perímetro"
                          : "🗑 Eliminar medida"}
                      </button>
                    )}
                  </div>
                ))
              )}

              {producto.tipoVenta !== "unidad" && producto.tipoVenta !== "otros" && (
                <div className="botones-medidas">
                  {medidas.length < 5 && (
                    <button className="btn-agregar" onClick={agregarMedida}>
                      {producto.tipoVenta === "tramo"
                        ? "➕ Agregar perímetro"
                        : "➕ Agregar medida"}
                    </button>
                  )}
                  <button className="btn-limpiar" onClick={limpiarCampos}>
                    🧹 Limpiar campos
                  </button>
                </div>
              )}
            </div>

            {producto.tipoVenta !== "unidad" && producto.tipoVenta !== "tramo" && producto.tipoVenta !== "otros" && (
              <div className="desperdicio-box">
                <span className="desperdicio-label">Desperdicio:</span>
                {[0, 10, 15, 20].map((p) => (
                  <button
                    key={p}
                    className={`des-btn ${desperdicio === p ? "active" : ""}`}
                    onClick={() => setDesperdicio(p)}
                  >
                    {p}%
                  </button>
                ))}
              </div>
            )}

            {(
              (producto.tipoVenta === "otros" && areaIngresada > 0) ||
              (producto.tipoVenta === "unidad" && medidas.some(m => Number(m.cantidad) > 0)) ||
              (producto.tipoVenta === "tramo" && medidas.some(m => Number(m.perimetro) > 0)) ||
              (producto.tipoVenta !== "unidad" && producto.tipoVenta !== "tramo" && producto.tipoVenta !== "otros" && areaIngresada > 0)
            ) && (
              <div className="resultado-cotizacion" ref={cotizadorRef}>
                {producto.tipoVenta === "tramo" ? (
                  <p>
                    <strong>Perímetro total:</strong> {metrosLineales.toFixed(2)} m
                  </p>
                ) : producto.tipoVenta === "unidad" ? (
                  <>
                    <p>
                      <strong>Cantidad de unidades:</strong> {cantidadNecesaria}
                    </p>
                  </>
                ) : producto.tipoVenta === "otros" ? (
                  <>
                    <p>
                      <strong>Área a cubrir:</strong> {areaIngresada.toFixed(2)} m²
                    </p>
                    <p>
                      <strong>Cobertura por {producto.presentacion || "unidad"}:</strong> {coberturaPorUnidad.toFixed(2)} m²
                    </p>
                    <p>
                      <strong>Unidades necesarias:</strong> {cantidadNecesaria}
                    </p>
                    <p>
                      <strong>Área total cubierta:</strong> {areaCubierta.toFixed(2)} m²
                    </p>
                  </>
                ) : (
                  <>
                    <p>
                      <strong>Área ingresada:</strong> {areaIngresada.toFixed(2)} m²
                    </p>
                    <p>
                      <strong>Área con desperdicio:</strong>{" "}
                      {areaConDesperdicio.toFixed(2)} m²
                    </p>
                  </>
                )}

                <p>
                  <strong>Necesitas:</strong>{" "}
                  {producto.tipoVenta === "unidad" || producto.tipoVenta === "otros" ? (
                    <>
                      <strong>{cantidadNecesaria}</strong> unidades
                    </>
                  ) : producto.tipoVenta === "tramo" || producto.tipoVenta === "rollo" ? (
                    <>
                      <strong>{metrosLineales.toFixed(2)}</strong> metros lineales
                    </>
                  ) : (
                    <>
                      <strong>{cantidadNecesaria}</strong> {producto.tipoVenta}s
                    </>
                  )}
                </p>

                <p className="total-estimado">Total estimado: ${total.toLocaleString()}</p>

                <div className="nota-producto">
                  ℹ️ Este producto se vende por <strong>{producto.tipoVenta}</strong>.
                  {producto.tipoVenta === "caja" && (
                    <>
                      {" "}
                      Cada caja contiene{" "}
                      <strong>{producto.piezasCaja} piezas</strong> y cubre{" "}
                      <strong>{coberturaPorUnidad.toFixed(2)} m²</strong>.
                      <br />
                      <br />
                      Para cubrir{" "}
                      <strong>{areaConDesperdicio.toFixed(2)} m²</strong> necesitas
                      aproximadamente <strong>{cantidadNecesaria} cajas</strong>.
                    </>
                  )}
                  {producto.tipoVenta === "pieza" && (
                    <>
                      {" "}
                      Cada pieza cubre{" "}
                      <strong>{coberturaPorUnidad.toFixed(2)} m²</strong>.
                      <br />
                      <br />
                      Para cubrir{" "}
                      <strong>{areaConDesperdicio.toFixed(2)} m²</strong> necesitas
                      aproximadamente <strong>{cantidadNecesaria} piezas</strong>.
                    </>
                  )}
                  {producto.tipoVenta === "rollo" && (
                    <>
                      {" "}
                      Cada rollo mide {(Number(producto.ancho) / 100).toFixed(2)} m x{" "}
                      {(Number(producto.alto) / 100).toFixed(2)} m y cubre{" "}
                      <strong>{coberturaPorUnidad.toFixed(2)} m²</strong>.
                      <br />
                      <br />
                      Para cubrir{" "}
                      <strong>{areaConDesperdicio.toFixed(2)} m²</strong> necesitas
                      aproximadamente{" "}
                      <strong>{metrosLineales.toFixed(2)} metros lineales</strong>.
                    </>
                  )}
                  {producto.tipoVenta === "tramo" && (
                    <>
                      {" "}
                      La cotización se realiza con base en la suma de los perímetros
                      capturados.
                      <br />
                      <br />
                      <strong>Perímetro total:</strong> {metrosLineales.toFixed(2)} m
                      <br />
                      <strong>Material requerido:</strong> {metrosLineales.toFixed(2)} metros
                      lineales.
                    </>
                  )}
                  {producto.tipoVenta === "unidad" && (
                    <>
                      {" "}
                      La cotización se realiza con base en la cantidad de unidades
                      capturadas.
                      <br />
                      <br />
                      <strong>Cantidad requerida:</strong> {cantidadNecesaria} unidades.
                    </>
                  )}
                  {producto.tipoVenta === "otros" && (
                    <>
                      {" "}
                      La cotización se realiza con base en el área que deseas cubrir.
                      Cada unidad ({producto.presentacion || "presentación"}) cubre{" "}
                      <strong>{coberturaPorUnidad.toFixed(2)} m²</strong>.
                      <br />
                      <br />
                      <strong>Área a cubrir:</strong> {areaIngresada.toFixed(2)} m²
                      <br />
                      <strong>Cantidad requerida:</strong> {cantidadNecesaria} unidades.
                      <br />
                      <strong>Área total cubierta:</strong> {areaCubierta.toFixed(2)} m².
                    </>
                  )}
                </div>

                <div className="form-cliente">
                  <h3>Solicitar cotización</h3>
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={cliente.nombre}
                    onChange={(e) =>
                      setCliente({ ...cliente, nombre: e.target.value })
                    }
                    className="input-field"
                  />
                  <input
                    type="email"
                    placeholder="Correo"
                    value={cliente.correo}
                    onChange={(e) =>
                      setCliente({ ...cliente, correo: e.target.value })
                    }
                    className="input-field"
                  />
                  <input
                    type="text"
                    placeholder="Celular"
                    value={cliente.celular}
                    onChange={(e) =>
                      setCliente({ ...cliente, celular: e.target.value })
                    }
                    className="input-field"
                  />
                  <button
                    className="btn-enviar"
                    onClick={generarPDF}
                    disabled={enviando}
                  >
                    {enviando ? "Enviando..." : "Solicitar cotización"}
                  </button>
                  {mensajeEnviado && (
                    <p className="mensaje-exito">{mensajeEnviado}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ===== LADO DERECHO - INFORMACIÓN ===== */}
        <div className="producto-detalle-right">
          <h1 className="product-title">{getNombreActual()}</h1>

          {/* ===== 🔥 CARRUSEL DE MODELOS CON ANIMACIÓN 3D ===== */}
          {modelosDisponibles.length > 0 && (
            <div className="modelos-carrusel-right">
              <div className="modelos-carrusel-header-right">
                <h3 className="modelos-carrusel-title-right">
                  <span className="title-icon">🔄</span> Modelos disponibles
                  <span className="title-badge">¡Explora!</span>
                </h3>
                <div className="carrusel-controls-right">
                  <button 
                    className="carrusel-btn-right prev"
                    onClick={() => navegarCarrusel(-1)}
                  >
                    ◀
                  </button>
                  <span className="carrusel-indicador-right">
                    {indiceCarrusel + 1} / {modelosDisponibles.length}
                  </span>
                  <button 
                    className="carrusel-btn-right next"
                    onClick={() => navegarCarrusel(1)}
                  >
                    ▶
                  </button>
                  <button 
                    className="carrusel-btn-right play"
                    onClick={reiniciarCarruselAutomatico}
                    title="Reiniciar reproducción automática"
                  >
                    ▶▶
                  </button>
                </div>
              </div>
              <div className="modelos-carrusel-container-right">
                <div 
                  className="modelos-carrusel-scroll-right" 
                  ref={carruselScrollRef}
                  style={{
                    scrollBehavior: 'smooth',
                    overflowX: 'auto',
                    display: 'flex',
                    gap: '16px',
                    padding: '12px 4px 16px 4px',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'thin',
                    scrollSnapType: 'x mandatory'
                  }}
                >
                  {modelosDisponibles.map((modelo, index) => (
                    <div
                      key={modelo.id}
                      className={`modelo-carrusel-item-right ${modeloSeleccionado?.id === modelo.id ? 'active' : ''}`}
                      onClick={() => seleccionarModelo(modelo, index)}
                      style={{
                        minWidth: '160px',
                        maxWidth: '190px',
                        flexShrink: 0,
                        scrollSnapAlign: 'start',
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '14px',
                        cursor: 'pointer',
                        transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        border: modeloSeleccionado?.id === modelo.id ? '3px solid #0ea5e9' : '2px solid transparent',
                        textAlign: 'center',
                        transform: modeloSeleccionado?.id === modelo.id ? 'scale(1.05) translateY(-8px)' : 'scale(1) translateY(0)',
                        boxShadow: modeloSeleccionado?.id === modelo.id 
                          ? '0 20px 40px rgba(14, 165, 233, 0.3), 0 0 60px rgba(14, 165, 233, 0.1)' 
                          : '0 4px 15px rgba(0,0,0,0.08)',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <div className="modelo-glow-effect"></div>
                      
                      {modeloSeleccionado?.id === modelo.id && (
                        <div className="modelo-selected-badge">
                          <span>✓ Seleccionado</span>
                        </div>
                      )}
                      
                      <img
                        src={obtenerImagen(modelo)}
                        alt={modelo.nombre}
                        style={{
                          width: '100%',
                          height: '120px',
                          objectFit: 'contain',
                          borderRadius: '10px',
                          background: '#fafafa',
                          padding: '6px',
                          transition: 'transform 0.4s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'scale(1.08)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                      />
                      <div className="modelo-carrusel-info-right">
                        <p className="modelo-carrusel-nombre-right">{modelo.nombre}</p>
                        <p className="modelo-carrusel-precio-right">
                          ${modelo.oferta ? modelo.precioOferta : modelo.precio}
                          {modelo.oferta && (
                            <span className="oferta-tag">Oferta</span>
                          )}
                        </p>
                        {modelo.stock <= 3 && modelo.stock > 0 && (
                          <span className="stock-badge-right">🔥 ¡Últimas unidades!</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="carrusel-progress-container">
                <div className="carrusel-progress-track">
                  {modelosDisponibles.map((_, index) => (
                    <div
                      key={index}
                      className={`carrusel-progress-dot ${index === indiceCarrusel ? 'active' : ''}`}
                      onClick={() => {
                        const newIndex = index;
                        setIndiceCarrusel(newIndex);
                        if (carruselScrollRef.current) {
                          const items = carruselScrollRef.current.querySelectorAll('.modelo-carrusel-item-right');
                          if (items[newIndex]) {
                            const itemWidth = items[newIndex].offsetWidth + 16;
                            carruselScrollRef.current.scrollTo({
                              left: newIndex * itemWidth,
                              behavior: 'smooth'
                            });
                          }
                        }
                      }}
                      style={{
                        width: index === indiceCarrusel ? '32px' : '10px',
                        height: '10px',
                        borderRadius: '999px',
                        background: index === indiceCarrusel 
                          ? 'linear-gradient(90deg, #0ea5e9, #38bdf8)' 
                          : '#e2e8f0',
                        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        cursor: 'pointer',
                        boxShadow: index === indiceCarrusel 
                          ? '0 0 20px rgba(14, 165, 233, 0.4)' 
                          : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>

              <button 
                className="btn-ver-todos-modelos-right"
                onClick={() => {
                  if (producto.tipo_id) {
                    navigate(`/productos/tipo/${producto.tipo_id}`);
                  } else if (producto.tipo) {
                    navigate(`/productos/tipo-nombre/${encodeURIComponent(producto.tipo)}`);
                  }
                }}
              >
                <span className="btn-icon">🔍</span> Ver todos los modelos disponibles ({modelosDisponibles.length})
                <span className="btn-arrow">→</span>
              </button>
            </div>
          )}

          {/* CATEGORÍA, SUBCATEGORÍA, TIPO */}
          <div className="category-box">
            {producto.categoria && (
              <span className="category-tag">Categoría: {producto.categoria}</span>
            )}
            {producto.subcategoria && (
              <span className="subcategory-tag">Subcategoría: {producto.subcategoria}</span>
            )}
            {producto.tipo && (
              <span className="type-tag">Tipo: {producto.tipo}</span>
            )}
          </div>

          {/* ===== 🔥 PRECIO GRANDE CON EFECTO BRILLO ===== */}
          {producto.oferta === 1 || producto.oferta === true ? (
            <div className="precio-container">
              <span className="precio-anterior">${producto.precio}</span>
              <div className="precio-brillante-wrapper">
                <h2 className="precio-oferta-brillante">
                  ${getPrecioActual()} 
                  <span className="precio-unidad-brillante">{getUnidadVenta()}</span>
                </h2>
              </div>
            </div>
          ) : (
            <div className="precio-brillante-wrapper">
              <h2 className="precio-normal-brillante">
                ${getPrecioActual()} 
                <span className="precio-unidad-brillante">{getUnidadVenta()}</span>
              </h2>
            </div>
          )}

          {/* SKU */}
          {producto.sku && (
            <p className="data-item sku-item">
              <strong>SKU:</strong> {producto.sku}
            </p>
          )}

          {/* DATOS DEL PRODUCTO */}
          <div className="data-box">
            {producto.tipoVenta && (
              <p className="data-item">
                <strong>Venta por:</strong> {producto.tipoVenta}
              </p>
            )}
            {producto.presentacion ? (
              <p className="data-item">
                <strong>Presentación:</strong> {producto.presentacion}
              </p>
            ) : (
              (producto.ancho || producto.alto) && (
                <p className="data-item">
                  <strong>Medidas:</strong>{" "}
                  {producto.ancho ? `${(Number(producto.ancho) / 100).toFixed(2)} m` : "-"} x{" "}
                  {producto.alto ? `${(Number(producto.alto) / 100).toFixed(2)} m` : "-"}
                </p>
              )
            )}

            {producto.tipoVenta === "caja" && (
              <p className="data-item">
                <strong>Piezas por caja:</strong> {producto.piezasCaja}
              </p>
            )}
            {coberturaPorUnidad > 0 && producto.tipoVenta === "caja" && (
              <p className="data-item">
                <strong>Cobertura por caja:</strong> {coberturaPorUnidad.toFixed(2)} m²
              </p>
            )}
            {producto.tipoVenta === "caja" && (
              <div className="caja-info">
                📦 Caja con <strong>{producto.piezasCaja}</strong> piezas
              </div>
            )}

            {producto.tipoVenta === "otros" && producto.cobertura && (
              <p className="data-item">
                <strong>Cobertura por {producto.presentacion || "unidad"}:</strong> {producto.cobertura}{" "}
                {producto.tipoCobertura === "m2" ? "m²" : producto.tipoCobertura}
              </p>
            )}

            {producto.grueso && (
              <p className="data-item">
                <strong>Grosor:</strong> {producto.grueso} mm
              </p>
            )}
          </div>

          {/* STOCK */}
          <div className="stock-box" style={{ borderColor: getStockColor(producto.stock) }}>
            <span className="stock-dot" style={{ background: getStockColor(producto.stock) }} />
            <div>
              <p className="stock-title" style={{ color: getStockColor(producto.stock) }}>
                {producto.stock <= 3 && producto.stock > 0
                  ? `Solo quedan ${producto.stock} ${plural(producto.stock, producto.tipoVenta)}`
                  : producto.stock <= 0
                  ? "Agotado"
                  : "Stock disponible"}
              </p>
              <p className="stock-sub">
                {producto.stock} {plural(producto.stock, producto.tipoVenta)}
              </p>
            </div>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="box">
            <h3 className="box-title">Descripción</h3>
            <p className="description">{producto.descripcion}</p>
          </div>

          {/* ESPECIFICACIONES */}
          {producto.especificaciones && (
            <div className="box">
              <h3 className="box-title">Especificaciones</h3>
              <p className="description" style={{ whiteSpace: "pre-wrap" }}>
                {producto.especificaciones}
              </p>
            </div>
          )}

          {/* INFORMACIÓN ADICIONAL */}
          {producto.informacionAdicional && (
            <div className="box">
              <h3 className="box-title">Información adicional</h3>
              <p className="description" style={{ whiteSpace: "pre-wrap" }}>
                {producto.informacionAdicional}
              </p>
            </div>
          )}

          {/* BOTONES DE ACCIÓN: VER FICHA TÉCNICA, AGREGAR AL COTIZADOR, AGREGAR AL PEDIDO */}
          <div className="botones-acciones">
            {producto.fichaTecnica && (
              <button
                className="btn-ficha-tecnica"
                onClick={() => setFichaZoom(true)}
              >
                📄 Ver ficha técnica
              </button>
            )}
            <button
              className="btn-agregar-cotizador"
              onClick={() => {
                const guardados = JSON.parse(localStorage.getItem("cotizador")) || [];
                const existe = guardados.find((p) => p.id === producto.id);
                if (!existe) {
                  guardados.push(producto);
                  localStorage.setItem("cotizador", JSON.stringify(guardados));
                }
              }}
            >
              ➕ Agregar al cotizador
            </button>
            <button
              className="btn-agregar-pedido"
              onClick={() => agregarAlPedido(producto)}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #16a34a, #15803d)',
                color: '#fff',
                border: 'none',
                padding: '14px 20px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '700',
                fontSize: '15px',
                boxShadow: '0 6px 15px rgba(22, 163, 74, 0.3)',
                transition: 'all 0.25s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(22, 163, 74, 0.4)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #15803d, #166534)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 6px 15px rgba(22, 163, 74, 0.3)';
                e.currentTarget.style.background = 'linear-gradient(135deg, #16a34a, #15803d)';
              }}
            >
              🛒 Agregar al pedido
            </button>
          </div>
        </div>

        {/* MODALES ZOOM */}
        {fichaZoom && (
          <div className="modal-overlay" onClick={() => setFichaZoom(false)}>
            <img src={getImageUrl(producto.fichaTecnica)} alt="Ficha técnica ampliada" className="modal-image" />
          </div>
        )}
        {imagenGuiaZoom && (
          <div className="modal-overlay" onClick={() => setImagenGuiaZoom(null)}>
            <img src={imagenGuiaZoom} alt="Imagen ampliada" className="modal-image" />
          </div>
        )}
      </div>

      {/* ========== 🔥 PRODUCTOS RELACIONADOS AGRUPADOS POR TIPO ========== */}
      <div className="full-width-related-wrapper">
        {/* PRODUCTOS SUGERIDOS (RECOMENDADOS) AGRUPADOS POR TIPO */}
        {sugeridos.length > 0 && (
          <div className="full-width-related-section">
            <div className="sugeridos-banner">
              <div>
                <span className="sugeridos-label">PRODUCTOS RECOMENDADOS</span>
                <h2 className="sugeridos-title">
                  Para instalar este producto también necesitarás
                </h2>
                <p className="sugeridos-subtitle">
                  Estos complementos son utilizados frecuentemente junto con
                  <strong> {producto.nombre}</strong>
                </p>
              </div>
            </div>

            {Object.keys(sugeridosAgrupados).map((tipo) => (
              <div key={tipo} className="tipo-grupo">
                <div className="tipo-grupo-header" style={{ borderLeftColor: getTipoColor(tipo) }}>
                  <span className="tipo-grupo-icon">🏷️</span>
                  <h3 className="tipo-grupo-title">{tipo}</h3>
                  <span className="tipo-grupo-count">{sugeridosAgrupados[tipo].length} productos</span>
                </div>
                <div className="related-grid full-width-grid">
                  {sugeridosAgrupados[tipo].map((p) => (
                    <div
                      key={p.id}
                      className="sugerido-card"
                      onClick={() => seleccionarProductoRelacionado(p)}
                    >
                      <div className="sugerido-badge">Recomendado</div>
                      <button
                        className="fav-btn-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorito(p);
                        }}
                        style={{
                          background: esFavorito(p.id) ? "#dc2626" : "#fff",
                          color: esFavorito(p.id) ? "#fff" : "#111",
                        }}
                      >
                        ❤️
                      </button>
                      <img
                        src={obtenerImagen(p)}
                        alt={p.nombre}
                        className="related-image"
                      />
                      <h4>{p.nombre}</h4>
                      <p className="related-sub">Ideal para instalación</p>
                      {p.oferta === 1 || p.oferta === true ? (
                        <div>
                          <span className="precio-ant">${p.precio}</span>
                          <p className="precio-of">${p.precioOferta}</p>
                        </div>
                      ) : (
                        <p className="related-price">${p.precio}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PRODUCTOS RELACIONADOS POR SUBCATEGORÍA AGRUPADOS POR TIPO */}
        {relacionados.length > 0 ? (
          <div className="full-width-related-section">
            <div className="related-header">
              <h2 className="section-title">
                🏷️ Productos en <span className="highlight">{producto.subcategoria}</span>
              </h2>
              <span className="related-count">{relacionados.length} productos</span>
            </div>

            {Object.keys(relacionadosAgrupados).map((tipo) => (
              <div key={tipo} className="tipo-grupo">
                <div className="tipo-grupo-header" style={{ borderLeftColor: getTipoColor(tipo) }}>
                  <span className="tipo-grupo-icon">📦</span>
                  <h3 className="tipo-grupo-title">{tipo}</h3>
                  <span className="tipo-grupo-count">{relacionadosAgrupados[tipo].length} productos</span>
                </div>
                <div className="related-grid full-width-grid">
                  {relacionadosAgrupados[tipo].map((p) => (
                    <div
                      key={p.id}
                      className="related-card"
                      onClick={() => seleccionarProductoRelacionado(p)}
                    >
                      <button
                        className="fav-btn-small"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorito(p);
                        }}
                        style={{
                          background: esFavorito(p.id) ? "#dc2626" : "#fff",
                          color: esFavorito(p.id) ? "#fff" : "#111",
                        }}
                      >
                        ❤️
                      </button>
                      <img
                        src={obtenerImagen(p)}
                        alt={p.nombre}
                        className="related-image"
                      />
                      <h4>{p.nombre}</h4>
                      {p.oferta === 1 || p.oferta === true ? (
                        <div>
                          <span className="precio-ant">${p.precio}</span>
                          <p className="precio-of">${p.precioOferta}</p>
                        </div>
                      ) : (
                        <p className="related-price">${p.precio}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="full-width-related-section">
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px',
              background: '#f9fafb',
              borderRadius: '16px',
              color: '#6b7280'
            }}>
              <p style={{ fontSize: '18px', marginBottom: '10px' }}>🔍 No hay productos en esta subcategoría</p>
              <p style={{ fontSize: '14px' }}>
                No se encontraron más productos en <strong>{producto.subcategoria || 'esta subcategoría'}</strong>
              </p>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

// ============================================================
// ESTILOS CSS (completos con animaciones mejoradas y responsive)
// ============================================================
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    /* ----- PÁGINA ----- */
    .producto-detalle-page {
      background: #f3f4f6;
      min-height: 100vh;
      font-family: Arial, sans-serif;
      overflow-x: hidden;
      padding-top: 0;
      margin-top: 0;
    }

    /* ----- CONTENEDOR PRINCIPAL ----- */
    .producto-detalle-container {
      display: flex;
      flex-wrap: wrap;
      gap: 30px;
      background: #fff;
      border-radius: 25px;
      padding: 25px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
      box-sizing: border-box;
    }

    .producto-detalle-left {
      flex: 1 1 55%;
      max-width: 55%;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .producto-detalle-right {
      flex: 1 1 40%;
      max-width: 40%;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    /* ----- GALERÍA ----- */
    .producto-detalle-gallery {
      position: relative;
      width: 100%;
    }

    /* ----- BADGES ----- */
    .badges-container {
      position: absolute;
      top: 15px;
      left: 15px;
      z-index: 20;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .badge {
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: bold;
      color: #fff;
      animation: badgePulse 2s ease-in-out infinite;
    }
    .rebaja { background: #dc2626; }
    .destacado { background: #111; }

    @keyframes badgePulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    /* ----- FAVORITOS ----- */
    .fav-btn {
      position: absolute;
      top: 15px;
      right: 15px;
      width: 50px;
      height: 50px;
      border-radius: 50%;
      border: none;
      font-size: 22px;
      cursor: pointer;
      z-index: 30;
      box-shadow: 0 5px 15px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    }
    .fav-btn:hover {
      transform: scale(1.1);
    }
    .fav-btn-small {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: none;
      font-size: 18px;
      cursor: pointer;
      z-index: 5;
      transition: all 0.3s ease;
    }
    .fav-btn-small:hover {
      transform: scale(1.1);
    }

    /* ----- IMAGEN PRINCIPAL ----- */
    .main-image-container {
      width: 100%;
      max-width: 100%;
      height: 400px;
      overflow: hidden;
      border-radius: 20px;
      background: #fafafa;
      position: relative;
    }
    .main-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }

    /* ----- THUMBNAILS ----- */
    .thumbs-container {
      display: flex;
      gap: 12px;
      margin-top: 20px;
      flex-wrap: wrap;
    }
    .thumb {
      width: 70px;
      height: 70px;
      object-fit: cover;
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .thumb:hover {
      transform: scale(1.05);
    }

    /* ----- TÍTULOS Y PRECIOS ----- */
    .product-title {
      font-size: 28px;
      font-weight: 800;
      color: #111827;
      line-height: 1.1;
      letter-spacing: -1px;
      margin: 0 0 5px 0;
    }
    .precio-normal {
      color: #16a34a;
      font-size: 40px;
      font-weight: 900;
      margin: 0;
    }
    .precio-oferta {
      color: #dc2626;
      font-size: 40px;
      font-weight: 900;
      margin-top: 5px;
    }
    .precio-anterior {
      text-decoration: line-through;
      color: #9ca3af;
      font-size: 24px;
      font-weight: 600;
      display: block;
      margin-bottom: 5px;
    }

    /* ----- PRECIO BRILLANTE ----- */
    .precio-brillante-wrapper {
      display: inline-block;
      position: relative;
      padding: 8px 20px;
      background: linear-gradient(135deg, #1a1a2e, #16213e, #0f3460);
      border-radius: 20px;
      box-shadow: 0 0 40px rgba(22, 163, 74, 0.3);
      transition: all 0.3s ease;
      width: 100%;
      box-sizing: border-box;
    }
    .precio-brillante-wrapper:hover {
      transform: scale(1.02);
      box-shadow: 0 0 60px rgba(22, 163, 74, 0.5);
    }
    .precio-normal-brillante {
      font-size: 48px;
      font-weight: 900;
      color: #ffffff;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      text-shadow: 0 0 20px rgba(22, 163, 74, 0.3);
      background: linear-gradient(90deg, #4ade80, #22c55e, #16a34a);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: brillo 2s ease-in-out infinite;
    }
    .precio-oferta-brillante {
      font-size: 48px;
      font-weight: 900;
      margin: 5px 0 0 0;
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
      background: linear-gradient(90deg, #f87171, #ef4444, #dc2626);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      animation: brillo 2s ease-in-out infinite;
    }
    .precio-unidad-brillante {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      padding: 4px 18px;
      border-radius: 999px;
      -webkit-text-fill-color: #ffffff;
      border: 1px solid rgba(255, 255, 255, 0.2);
      box-shadow: 0 0 20px rgba(255, 255, 255, 0.1);
      animation: pulse-unidad 2s ease-in-out infinite;
    }
    @keyframes brillo {
      0%, 100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    @keyframes pulse-unidad {
      0%, 100% { transform: scale(1); box-shadow: 0 0 20px rgba(255, 255, 255, 0.1); }
      50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(255, 255, 255, 0.25); }
    }

    /* ----- CAJA DE DATOS ----- */
    .data-box {
      background: linear-gradient(135deg,#ffffff,#f8fafc);
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.05);
    }
    .data-item {
      margin: 8px 0;
      font-size: 15px;
      color: #333;
    }
    .sku-item {
      font-size: 14px;
      color: #6b7280;
      margin: -5px 0 0 0;
    }
    .caja-info {
      background: #eff6ff;
      color: #1e3a8a;
      padding: 12px 15px;
      border-radius: 12px;
      font-weight: bold;
      width: fit-content;
      margin-top: 8px;
    }

    /* ----- STOCK ----- */
    .stock-box {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 14px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      width: 100%;
      box-shadow: 0 6px 18px rgba(0,0,0,0.06);
      box-sizing: border-box;
    }
    .stock-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
    .stock-title {
      font-size: 16px;
      font-weight: 800;
      margin: 0;
    }
    .stock-sub {
      font-size: 13px;
      margin: 0;
      color: #6b7280;
      font-weight: 600;
    }

    /* ----- CAJAS DE TEXTO ----- */
    .box {
      background: #fafafa;
      border: 1px solid #eee;
      padding: 18px;
      border-radius: 15px;
    }
    .box-title {
      margin-bottom: 12px;
      font-size: 16px;
      font-weight: 700;
    }
    .description {
      color: #555;
      line-height: 1.9;
      margin: 0;
    }

    /* ----- CATEGORÍAS ----- */
    .category-box {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin: 0;
    }
    .category-tag {
      background: #111827;
      color: #fff;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: bold;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
    }
    .category-tag:hover {
      transform: scale(1.05);
    }
    .subcategory-tag {
      background: #e5e7eb;
      color: #111;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: bold;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
    }
    .subcategory-tag:hover {
      transform: scale(1.05);
    }
    .type-tag {
      background: #38bdf8;
      color: #fff;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: bold;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
    }
    .type-tag:hover {
      transform: scale(1.05);
    }

    /* ----- BOTONES DE ACCIÓN ----- */
    .botones-acciones {
      display: flex;
      gap: 12px;
      width: 100%;
      margin-top: 5px;
      flex-wrap: wrap;
    }
    .btn-ficha-tecnica {
      flex: 1;
      min-width: 100px;
      background: linear-gradient(135deg, #2563eb, #1d4ed8);
      color: #fff;
      border: none;
      padding: 14px 20px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 6px 15px rgba(37, 99, 235, 0.3);
      transition: all 0.25s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-ficha-tecnica:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(37, 99, 235, 0.4);
      background: linear-gradient(135deg, #1d4ed8, #1e40af);
    }
    .btn-agregar-cotizador {
      flex: 1;
      min-width: 100px;
      background: linear-gradient(135deg, #111, #1f2937);
      color: #fff;
      border: none;
      padding: 14px 20px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      font-size: 15px;
      box-shadow: 0 6px 15px rgba(0,0,0,0.15);
      transition: all 0.25s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-agregar-cotizador:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(0,0,0,0.25);
    }
    .btn-agregar-pedido {
      flex: 1;
      min-width: 100px;
      background: linear-gradient(135deg, #16a34a, #15803d);
      color: #fff;
      border: none;
      padding: 14px 20px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 700;
      font-size: 15px;
      box-shadow: 0 6px 15px rgba(22, 163, 74, 0.3);
      transition: all 0.25s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-agregar-pedido:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 25px rgba(22, 163, 74, 0.4);
      background: linear-gradient(135deg, #15803d, #166534);
    }

    /* ----- COTIZADOR ----- */
    .cotizador-box {
      background: #fafafa;
      border: 1px solid #eee;
      padding: 20px;
      border-radius: 20px;
    }
    .cotizador-title {
      margin-bottom: 20px;
      color: #111;
      font-size: 18px;
    }

    .guia-medicion {
      margin-bottom: 25px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      padding: 20px;
    }
    .guia-titulo {
      text-align: center;
      margin-bottom: 20px;
      color: #111827;
      font-size: 18px;
      font-weight: 700;
    }
    .guia-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 20px;
    }
    .guia-card {
      background: #f9fafb;
      border-radius: 16px;
      padding: 15px;
      text-align: center;
      border: 1px solid #e5e7eb;
      transition: all 0.3s ease;
    }
    .guia-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.1);
    }
    .guia-img {
      width: 100%;
      height: 150px;
      object-fit: contain;
      margin-bottom: 15px;
      cursor: zoom-in;
      transition: all 0.3s ease;
    }
    .guia-img:hover {
      transform: scale(1.05);
    }

    .selector-modo {
      display: flex;
      gap: 15px;
      flex-wrap: wrap;
      margin-bottom: 20px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 12px;
    }
    .resumen-area {
      background: #ecfdf5;
      border: 1px solid #16a34a;
      color: #166534;
      padding: 12px;
      border-radius: 12px;
      text-align: center;
      font-weight: 700;
      margin-bottom: 20px;
    }

    .medidas-container {
      margin-bottom: 20px;
    }
    .medida-card {
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 15px;
      padding: 15px;
      margin-bottom: 15px;
      transition: all 0.3s ease;
    }
    .medida-card:hover {
      box-shadow: 0 4px 15px rgba(0,0,0,0.06);
    }
    .medidas-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-top: 10px;
    }
    .input-field {
      width: 100%;
      padding: 12px;
      border-radius: 10px;
      border: 1px solid #d1d5db;
      box-sizing: border-box;
      font-size: 16px;
      margin-bottom: 10px;
      transition: all 0.3s ease;
    }
    .input-field:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      outline: none;
    }
    .resultado-medida {
      font-weight: bold;
      color: #16a34a;
      margin: 10px 0;
    }
    .radio-label {
      display: block;
      margin-bottom: 10px;
      font-weight: 600;
    }

    .botones-medidas {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btn-agregar {
      background: #16a34a;
      color: #fff;
      border: none;
      padding: 10px 16px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: bold;
      flex: 1;
      transition: all 0.3s ease;
    }
    .btn-agregar:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
    }
    .btn-limpiar {
      background: #f59e0b;
      color: #fff;
      border: none;
      padding: 10px 16px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: bold;
      flex: 1;
      transition: all 0.3s ease;
    }
    .btn-limpiar:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }
    .btn-eliminar {
      background: #dc2626;
      color: #fff;
      border: none;
      padding: 10px 15px;
      border-radius: 10px;
      cursor: pointer;
      margin-top: 10px;
      width: 100%;
      transition: all 0.3s ease;
    }
    .btn-eliminar:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }

    .desperdicio-box {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      flex-wrap: wrap;
      align-items: center;
    }
    .desperdicio-label {
      font-weight: 600;
      color: #333;
      margin-right: 5px;
    }
    .des-btn {
      border: 1px solid #ddd;
      padding: 10px 15px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: bold;
      flex: 1;
      min-width: 60px;
      background: #fff;
      color: #111;
      transition: all 0.3s ease;
    }
    .des-btn.active {
      background: #111;
      color: #fff;
      border-color: #111;
    }
    .des-btn:hover {
      transform: scale(1.05);
    }

    .resultado-cotizacion {
      background: #fff;
      border-radius: 15px;
      padding: 20px;
      border: 1px solid #eee;
    }
    .total-estimado {
      font-size: 24px;
      font-weight: bold;
      color: #16a34a;
    }
    .nota-producto {
      margin-top: 15px;
      background: #eff6ff;
      padding: 15px;
      border-radius: 12px;
      color: #1e3a8a;
      line-height: 1.7;
    }

    .form-cliente {
      margin-top: 25px;
      background: #fff;
      padding: 20px;
      border-radius: 15px;
      border: 1px solid #eee;
    }
    .btn-enviar {
      margin-top: 10px;
      background: #dc2626;
      color: #fff;
      border: none;
      padding: 14px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: bold;
      width: 100%;
      transition: all 0.3s ease;
    }
    .btn-enviar:hover {
      background: #b91c1c;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(220, 38, 38, 0.3);
    }
    .btn-enviar:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
    .mensaje-exito {
      margin-top: 15px;
      color: #16a34a;
      font-weight: bold;
      text-align: center;
      animation: fadeIn 0.5s ease;
    }

    /* ========================================================= */
    /* 🔥 CARRUSEL DE MODELOS CON ANIMACIONES MEJORADAS */
    /* ========================================================= */
    .modelos-carrusel-right {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 2px solid #38bdf8;
      border-radius: 20px;
      padding: 20px;
      box-shadow: 0 8px 25px rgba(56, 189, 248, 0.15);
      width: 100%;
      box-sizing: border-box;
      animation: slideIn 0.6s ease;
      margin-top: 0;
      margin-bottom: 15px;
      position: relative;
      overflow: hidden;
    }
    .modelos-carrusel-right::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at 30% 50%, rgba(56, 189, 248, 0.05) 0%, transparent 70%);
      animation: rotateBg 20s linear infinite;
      pointer-events: none;
    }
    @keyframes rotateBg {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .modelos-carrusel-header-right {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      flex-wrap: wrap;
      gap: 10px;
      position: relative;
      z-index: 1;
    }
    .modelos-carrusel-title-right {
      font-size: 16px;
      font-weight: 700;
      color: #0c4a6e;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .title-icon {
      font-size: 20px;
      animation: floatIcon 3s ease-in-out infinite;
    }
    @keyframes floatIcon {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    .title-badge {
      font-size: 10px;
      background: linear-gradient(135deg, #0ea5e9, #38bdf8);
      color: #fff;
      padding: 2px 10px;
      border-radius: 999px;
      font-weight: 600;
      animation: pulseBadge 2s ease-in-out infinite;
    }
    @keyframes pulseBadge {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    .carrusel-controls-right {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .carrusel-btn-right {
      background: #fff;
      border: 1px solid #38bdf8;
      border-radius: 50%;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.3s ease;
      color: #0c4a6e;
      font-weight: bold;
      position: relative;
      z-index: 1;
    }
    .carrusel-btn-right:hover {
      background: #38bdf8;
      color: #fff;
      transform: scale(1.1) rotate(360deg);
      box-shadow: 0 4px 15px rgba(56, 189, 248, 0.3);
    }
    .carrusel-btn-right.play {
      background: #0c4a6e;
      color: #fff;
      border-color: #0c4a6e;
    }
    .carrusel-btn-right.play:hover {
      background: #0ea5e9;
      border-color: #0ea5e9;
      transform: scale(1.1);
    }
    .carrusel-indicador-right {
      font-size: 13px;
      font-weight: 600;
      color: #0c4a6e;
      min-width: 50px;
      text-align: center;
    }

    .modelos-carrusel-container-right {
      overflow: hidden;
      position: relative;
      width: 100%;
      z-index: 1;
    }

    .modelos-carrusel-scroll-right {
      scroll-behavior: smooth;
      overflow-x: auto;
      display: flex;
      gap: 16px;
      padding: 12px 4px 16px 4px;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: #38bdf8 #e0f2fe;
      scroll-snap-type: x mandatory;
    }
    .modelos-carrusel-scroll-right::-webkit-scrollbar {
      height: 6px;
    }
    .modelos-carrusel-scroll-right::-webkit-scrollbar-track {
      background: #e0f2fe;
      border-radius: 10px;
    }
    .modelos-carrusel-scroll-right::-webkit-scrollbar-thumb {
      background: #38bdf8;
      border-radius: 10px;
    }

    .modelo-carrusel-item-right {
      min-width: 160px;
      max-width: 190px;
      flex-shrink: 0;
      scroll-snap-align: start;
      background: #fff;
      border-radius: 16px;
      padding: 14px;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      border: 2px solid transparent;
      text-align: center;
      animation: slideInFromRight 0.6s ease forwards;
      position: relative;
      overflow: hidden;
    }
    .modelo-carrusel-item-right:hover {
      transform: translateY(-8px) scale(1.03);
      box-shadow: 0 12px 35px rgba(56, 189, 248, 0.25);
    }
    .modelo-carrusel-item-right.active {
      border-color: #0ea5e9;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.3), 0 20px 40px rgba(14, 165, 233, 0.3);
      background: #f0f9ff;
      transform: translateY(-8px) scale(1.05);
    }

    .modelo-glow-effect {
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle at center, rgba(14, 165, 233, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.4s ease;
      pointer-events: none;
    }
    .modelo-carrusel-item-right:hover .modelo-glow-effect {
      opacity: 1;
    }

    .modelo-selected-badge {
      position: absolute;
      top: 8px;
      left: 8px;
      background: linear-gradient(135deg, #0ea5e9, #38bdf8);
      color: #fff;
      font-size: 9px;
      font-weight: 700;
      padding: 2px 10px;
      border-radius: 999px;
      animation: fadeIn 0.3s ease;
      z-index: 2;
    }

    @keyframes slideInFromRight {
      from {
        opacity: 0;
        transform: translateX(50px) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }

    .modelo-carrusel-img-right {
      width: 100%;
      height: 120px;
      object-fit: contain;
      border-radius: 10px;
      background: #fafafa;
      padding: 6px;
      transition: transform 0.4s ease;
    }
    .modelo-carrusel-info-right {
      margin-top: 8px;
    }
    .modelo-carrusel-nombre-right {
      font-size: 12px;
      font-weight: 600;
      color: #0c4a6e;
      margin: 0;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      height: 30px;
    }
    .modelo-carrusel-precio-right {
      font-size: 14px;
      font-weight: 700;
      color: #16a34a;
      margin: 4px 0 0 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }
    .oferta-tag {
      font-size: 9px;
      background: #dc2626;
      color: #fff;
      padding: 1px 8px;
      border-radius: 999px;
      font-weight: 600;
    }
    .stock-badge-right {
      font-size: 10px;
      background: #f59e0b;
      color: #fff;
      padding: 2px 8px;
      border-radius: 999px;
      display: inline-block;
      margin-top: 4px;
      font-weight: 600;
      animation: pulseBadge 2s ease-in-out infinite;
    }

    .carrusel-progress-container {
      display: flex;
      justify-content: center;
      margin-top: 14px;
      z-index: 1;
      position: relative;
    }
    .carrusel-progress-track {
      display: flex;
      gap: 6px;
      align-items: center;
    }
    .carrusel-progress-dot {
      width: 10px;
      height: 10px;
      border-radius: 999px;
      background: #e2e8f0;
      transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;
    }
    .carrusel-progress-dot.active {
      width: 32px;
      background: linear-gradient(90deg, #0ea5e9, #38bdf8);
      box-shadow: 0 0 20px rgba(14, 165, 233, 0.4);
    }
    .carrusel-progress-dot:hover {
      transform: scale(1.2);
    }

    .btn-ver-todos-modelos-right {
      width: 100%;
      margin-top: 15px;
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
      color: #fff;
      border: none;
      padding: 12px 18px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      position: relative;
      z-index: 1;
    }
    .btn-ver-todos-modelos-right:hover {
      transform: translateY(-2px) scale(1.01);
      box-shadow: 0 8px 30px rgba(14, 165, 233, 0.4);
    }
    .btn-ver-todos-modelos-right .btn-icon {
      font-size: 16px;
    }
    .btn-ver-todos-modelos-right .btn-arrow {
      transition: transform 0.3s ease;
    }
    .btn-ver-todos-modelos-right:hover .btn-arrow {
      transform: translateX(4px);
    }

    /* ----- GRUPOS POR TIPO ----- */
    .tipo-grupo {
      margin-bottom: 30px;
    }
    .tipo-grupo:last-child {
      margin-bottom: 0;
    }
    .tipo-grupo-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      background: linear-gradient(135deg, #f8fafc, #eef2ff);
      border-radius: 14px;
      border-left: 4px solid #3b82f6;
      margin-bottom: 16px;
    }
    .tipo-grupo-icon {
      font-size: 20px;
    }
    .tipo-grupo-title {
      font-size: 16px;
      font-weight: 700;
      color: #1e293b;
      margin: 0;
      flex: 1;
    }
    .tipo-grupo-count {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      background: #fff;
      padding: 4px 12px;
      border-radius: 999px;
      border: 1px solid #e2e8f0;
    }

    /* ----- SECCIÓN DE PRODUCTOS ----- */
    .full-width-related-wrapper {
      width: 100%;
      max-width: 100vw;
      overflow-x: hidden;
      padding: 0 20px;
      box-sizing: border-box;
      margin: 0 auto;
    }
    .full-width-related-section {
      max-width: 1400px;
      margin: 40px auto 0 auto;
      padding: 0 10px;
      box-sizing: border-box;
      width: 100%;
    }
    .full-width-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 16px;
      width: 100%;
    }
    .section-title {
      font-size: 22px;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0;
    }
    .related-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding: 0 4px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .related-count {
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      background: #f1f5f9;
      padding: 6px 16px;
      border-radius: 999px;
    }
    .highlight {
      color: #3b82f6;
    }

    .related-card {
      background: #fff;
      border-radius: 22px;
      padding: 12px;
      text-align: center;
      cursor: pointer;
      position: relative;
      border: 1px solid #e5e7eb;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      transition: all .3s ease;
    }
    .related-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 15px 40px rgba(0,0,0,0.15);
    }
    .related-image {
      width: 100%;
      height: 130px;
      object-fit: cover;
      border-radius: 15px;
      margin-bottom: 10px;
    }
    .related-price {
      color: green;
      font-weight: bold;
      font-size: 16px;
    }
    .precio-ant {
      text-decoration: line-through;
      color: #999;
      font-size: 14px;
    }
    .precio-of {
      color: #dc2626;
      font-weight: bold;
      font-size: 18px;
    }

    .sugerido-card {
      background: #fff;
      border-radius: 24px;
      padding: 12px;
      position: relative;
      cursor: pointer;
      overflow: hidden;
      border: 1px solid #e5e7eb;
      box-shadow: 0 15px 35px rgba(0,0,0,0.08);
      transition: all .3s ease;
      text-align: center;
    }
    .sugerido-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 20px 45px rgba(0,0,0,0.15);
    }
    .sugerido-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      background: #111;
      color: #fff;
      font-size: 11px;
      padding: 5px 10px;
      border-radius: 999px;
      font-weight: bold;
      z-index: 5;
    }
    .related-sub {
      font-size: 13px;
      color: #666;
    }

    .sugeridos-banner {
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      border-left: 6px solid #111827;
      padding: 18px 24px;
      border-radius: 16px;
      margin-bottom: 24px;
      box-shadow: 0 6px 18px rgba(0,0,0,0.05);
      width: 100%;
      box-sizing: border-box;
    }
    .sugeridos-label {
      display: inline-block;
      background: #111827;
      color: #fff;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 1.5px;
      padding: 6px 18px;
      border-radius: 999px;
      text-transform: uppercase;
      margin-bottom: 10px;
    }
    .sugeridos-title {
      font-size: 24px;
      font-weight: 700;
      color: #111827;
      margin: 8px 0 12px 0;
      line-height: 1.2;
    }
    .sugeridos-subtitle {
      font-size: 16px;
      color: #4b5563;
      margin: 0;
    }

    /* ----- MODALES ZOOM ----- */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      cursor: zoom-out;
      animation: fadeIn 0.3s ease;
    }
    .modal-image {
      max-width: 90%;
      max-height: 90%;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      animation: zoomIn 0.3s ease;
    }
    @keyframes zoomIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    /* ----- ANIMACIONES ----- */
    @keyframes pulse {
      0% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.6; }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(30px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* ========================================================= */
    /* 🔥 RESPONSIVE: ESCRITORIO (≥1024px) - MÁS GRANDE */
    /* ========================================================= */
    @media (min-width: 1024px) {
      .producto-detalle-container {
        padding: 50px 60px;
        gap: 60px;
        border-radius: 30px;
        max-width: 1600px;
      }
      
      .producto-detalle-left {
        flex: 0 0 55%;
        max-width: 55%;
      }
      
      .producto-detalle-right {
        flex: 0 0 40%;
        max-width: 40%;
      }
      
      .main-image-container {
        height: 500px;
        border-radius: 25px;
      }
      
      .thumb {
        width: 100px;
        height: 100px;
        border-radius: 15px;
      }
      
      .thumbs-container {
        gap: 15px;
        margin-top: 25px;
      }
      
      .product-title {
        font-size: 38px;
        margin: 0 0 10px 0;
      }
      
      .precio-normal-brillante,
      .precio-oferta-brillante {
        font-size: 52px;
        gap: 20px;
      }
      
      .precio-unidad-brillante {
        font-size: 22px;
        padding: 6px 24px;
      }
      
      .precio-anterior {
        font-size: 28px;
      }
      
      .precio-brillante-wrapper {
        padding: 12px 28px;
        border-radius: 24px;
      }
      
      .data-box {
        padding: 28px;
        border-radius: 24px;
      }
      
      .data-item {
        font-size: 18px;
        margin: 10px 0;
      }
      
      .sku-item {
        font-size: 16px;
      }
      
      .box {
        padding: 24px;
        border-radius: 20px;
      }
      
      .box-title {
        font-size: 20px;
        margin-bottom: 16px;
      }
      
      .description {
        font-size: 16px;
        line-height: 2;
      }
      
      .stock-box {
        padding: 18px 24px;
        border-radius: 18px;
        gap: 16px;
      }
      
      .stock-title {
        font-size: 20px;
      }
      
      .stock-sub {
        font-size: 16px;
      }
      
      .stock-dot {
        width: 16px;
        height: 16px;
      }
      
      .category-tag,
      .subcategory-tag,
      .type-tag {
        font-size: 14px;
        padding: 8px 16px;
      }
      
      .category-box {
        gap: 14px;
      }
      
      .btn-ficha-tecnica,
      .btn-agregar-cotizador,
      .btn-agregar-pedido {
        padding: 18px 28px;
        font-size: 18px;
        border-radius: 16px;
        min-width: 150px;
      }
      
      .botones-acciones {
        gap: 16px;
      }
      
      .cotizador-box {
        padding: 30px;
        border-radius: 24px;
      }
      
      .cotizador-title {
        font-size: 22px;
        margin-bottom: 25px;
      }
      
      .input-field {
        padding: 16px;
        font-size: 18px;
        border-radius: 12px;
      }
      
      .resultado-medida {
        font-size: 16px;
      }
      
      .total-estimado {
        font-size: 30px;
      }
      
      .guia-medicion {
        padding: 28px;
        border-radius: 24px;
      }
      
      .guia-titulo {
        font-size: 22px;
      }
      
      .guia-img {
        height: 200px;
      }
      
      .full-width-grid {
        grid-template-columns: repeat(5, 1fr);
        gap: 30px;
      }
      
      .related-image {
        height: 200px;
        border-radius: 18px;
      }
      
      .related-card,
      .sugerido-card {
        padding: 18px;
        border-radius: 28px;
      }
      
      .related-card h4,
      .sugerido-card h4 {
        font-size: 16px;
      }
      
      .related-price {
        font-size: 20px;
      }
      
      .precio-ant {
        font-size: 16px;
      }
      
      .precio-of {
        font-size: 20px;
      }
      
      .sugeridos-title {
        font-size: 32px;
      }
      
      .sugeridos-subtitle {
        font-size: 20px;
      }
      
      .sugeridos-banner {
        padding: 28px 36px;
        border-radius: 20px;
      }
      
      .sugeridos-label {
        font-size: 14px;
        padding: 8px 24px;
      }
      
      .modelos-carrusel-right {
        padding: 28px;
        border-radius: 24px;
      }
      
      .modelos-carrusel-title-right {
        font-size: 20px;
      }
      
      .modelo-carrusel-item-right {
        min-width: 200px;
        max-width: 240px;
        padding: 18px;
        border-radius: 20px;
      }
      
      .modelo-carrusel-img-right {
        height: 160px;
      }
      
      .modelo-carrusel-nombre-right {
        font-size: 15px;
        height: 36px;
      }
      
      .modelo-carrusel-precio-right {
        font-size: 18px;
      }
      
      .section-title {
        font-size: 28px;
      }
      
      .related-count {
        font-size: 16px;
        padding: 8px 20px;
      }
      
      .tipo-grupo-header {
        padding: 16px 24px;
        border-radius: 16px;
      }
      
      .tipo-grupo-title {
        font-size: 20px;
      }
      
      .tipo-grupo-count {
        font-size: 14px;
        padding: 6px 16px;
      }
      
      .btn-ver-todos-modelos-right {
        padding: 16px 24px;
        font-size: 16px;
        border-radius: 16px;
      }
      
      .carrusel-btn-right {
        width: 40px;
        height: 40px;
        font-size: 16px;
      }
      
      .carrusel-indicador-right {
        font-size: 16px;
        min-width: 60px;
      }
      
      .carrusel-progress-dot {
        width: 14px;
        height: 14px;
      }
      
      .carrusel-progress-dot.active {
        width: 40px;
      }
      
      .full-width-related-wrapper {
        padding: 0 60px;
      }
      
      .full-width-related-section {
        max-width: 1600px;
        margin: 60px auto 0 auto;
      }
    }

    /* ========================================================= */
    /* 🔥 RESPONSIVE: PANTALLAS MUY GRANDES (≥1440px) */
    /* ========================================================= */
    @media (min-width: 1440px) {
      .producto-detalle-container {
        max-width: 1800px;
        padding: 60px 80px;
        gap: 80px;
      }
      
      .producto-detalle-left {
        flex: 0 0 52%;
        max-width: 52%;
      }
      
      .producto-detalle-right {
        flex: 0 0 42%;
        max-width: 42%;
      }
      
      .main-image-container {
        height: 600px;
      }
      
      .thumb {
        width: 120px;
        height: 120px;
      }
      
      .product-title {
        font-size: 44px;
      }
      
      .precio-normal-brillante,
      .precio-oferta-brillante {
        font-size: 58px;
      }
      
      .precio-unidad-brillante {
        font-size: 26px;
        padding: 8px 30px;
      }
      
      .data-item {
        font-size: 20px;
      }
      
      .description {
        font-size: 18px;
      }
      
      .full-width-grid {
        grid-template-columns: repeat(6, 1fr);
        gap: 35px;
      }
      
      .related-image {
        height: 220px;
      }
      
      .modelo-carrusel-item-right {
        min-width: 220px;
        max-width: 260px;
      }
      
      .modelo-carrusel-img-right {
        height: 180px;
      }
    }

    /* ========================================================= */
    /* 🔥 RESPONSIVE: MÓVILES (<768px) - CORREGIDO */
    /* ========================================================= */
    @media (max-width: 767px) {
      /* Ajuste general de la página */
      .producto-detalle-page {
        padding-top: 0;
        margin-top: 0;
        overflow-x: hidden;
      }

      /* Contenedor principal - con padding superior suficiente */
      .producto-detalle-container {
        flex-direction: column;
        padding: 20px 12px 20px 12px;
        gap: 16px;
        border-radius: 12px;
        margin: 10px 5px 10px 5px;
        margin-top: 10px;
      }

      .producto-detalle-left {
        flex: 1 1 100%;
        max-width: 100%;
        order: 1;
        gap: 12px;
      }

      .producto-detalle-right {
        flex: 1 1 100%;
        max-width: 100%;
        order: 2;
        gap: 12px;
      }

      /* GALERÍA - más compacta pero visible */
      .main-image-container {
        height: 280px;
        border-radius: 12px;
        margin-top: 5px;
      }

      .main-image {
        object-fit: contain;
      }

      .thumb {
        width: 60px;
        height: 60px;
        border-radius: 10px;
      }

      .thumbs-container {
        gap: 10px;
        margin-top: 12px;
        justify-content: center;
      }

      /* BADGES - más pequeños y mejor posicionados */
      .badges-container {
        top: 10px;
        left: 10px;
        gap: 6px;
        z-index: 20;
      }

      .badge {
        padding: 4px 10px;
        font-size: 11px;
        border-radius: 6px;
      }

      .fav-btn {
        width: 40px;
        height: 40px;
        font-size: 18px;
        top: 10px;
        right: 10px;
        z-index: 30;
      }

      .fav-btn-small {
        width: 34px;
        height: 34px;
        font-size: 14px;
        top: 8px;
        right: 8px;
      }

      /* TÍTULOS */
      .product-title {
        font-size: 22px;
        margin: 0 0 5px 0;
        padding-top: 0;
      }

      /* PRECIOS */
      .precio-brillante-wrapper {
        padding: 8px 16px;
        border-radius: 14px;
      }

      .precio-normal-brillante,
      .precio-oferta-brillante {
        font-size: 28px;
        gap: 10px;
      }

      .precio-unidad-brillante {
        font-size: 13px;
        padding: 3px 12px;
      }

      .precio-anterior {
        font-size: 18px;
      }

      /* CATEGORÍAS */
      .category-box {
        gap: 6px;
        flex-wrap: wrap;
      }

      .category-tag,
      .subcategory-tag,
      .type-tag {
        font-size: 11px;
        padding: 5px 10px;
      }

      /* CAJAS DE INFORMACIÓN */
      .data-box {
        padding: 14px;
        border-radius: 12px;
      }

      .data-item {
        font-size: 14px;
        margin: 5px 0;
      }

      .sku-item {
        font-size: 13px;
      }

      .box {
        padding: 14px;
        border-radius: 12px;
      }

      .box-title {
        font-size: 15px;
        margin-bottom: 8px;
      }

      .description {
        font-size: 14px;
        line-height: 1.7;
      }

      /* STOCK */
      .stock-box {
        padding: 12px 16px;
        border-radius: 12px;
        gap: 10px;
      }

      .stock-title {
        font-size: 15px;
      }

      .stock-sub {
        font-size: 13px;
      }

      .stock-dot {
        width: 10px;
        height: 10px;
      }

      /* BOTONES DE ACCIÓN */
      .botones-acciones {
        flex-direction: column;
        gap: 10px;
      }

      .btn-ficha-tecnica,
      .btn-agregar-cotizador,
      .btn-agregar-pedido {
        flex: 1 1 100%;
        min-width: 100%;
        padding: 14px 18px;
        font-size: 15px;
        border-radius: 10px;
      }

      /* COTIZADOR */
      .cotizador-box {
        padding: 14px;
        border-radius: 14px;
      }

      .cotizador-title {
        font-size: 17px;
        margin-bottom: 14px;
      }

      /* GUÍA DE MEDICIÓN */
      .guia-medicion {
        padding: 14px;
        border-radius: 12px;
        margin-bottom: 14px;
      }

      .guia-titulo {
        font-size: 16px;
        margin-bottom: 14px;
      }

      .guia-grid {
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }

      .guia-card {
        padding: 10px;
      }

      .guia-img {
        height: 100px;
      }

      .guia-card h4 {
        font-size: 13px;
        margin: 6px 0 3px 0;
      }

      .guia-card p {
        font-size: 11px;
      }

      /* SELECTOR DE MODO */
      .selector-modo {
        flex-direction: column;
        gap: 8px;
        padding: 12px;
      }

      .selector-modo label {
        font-size: 13px;
      }

      .resumen-area {
        font-size: 13px;
        padding: 10px;
      }

      /* MEDIDAS */
      .medida-card {
        padding: 12px;
        margin-bottom: 10px;
        border-radius: 10px;
      }

      .medida-card h4 {
        font-size: 14px;
        margin: 0 0 8px 0;
      }

      .medidas-grid {
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .input-field {
        padding: 12px;
        font-size: 15px;
        border-radius: 8px;
        margin-bottom: 8px;
      }

      .resultado-medida {
        font-size: 13px;
        margin: 6px 0;
      }

      .radio-label {
        font-size: 13px;
        margin-bottom: 8px;
      }

      /* BOTONES DE MEDIDAS */
      .botones-medidas {
        flex-direction: row;
        gap: 8px;
      }

      .btn-agregar,
      .btn-limpiar {
        padding: 10px 14px;
        font-size: 13px;
        border-radius: 8px;
      }

      .btn-eliminar {
        padding: 8px 12px;
        font-size: 13px;
        border-radius: 8px;
      }

      /* DESPERDICIO */
      .desperdicio-box {
        gap: 6px;
        flex-wrap: wrap;
      }

      .desperdicio-label {
        font-size: 13px;
      }

      .des-btn {
        padding: 8px 14px;
        font-size: 13px;
        min-width: 45px;
        border-radius: 8px;
      }

      /* RESULTADO COTIZACIÓN */
      .resultado-cotizacion {
        padding: 14px;
        border-radius: 12px;
      }

      .resultado-cotizacion p {
        font-size: 14px;
        margin: 5px 0;
      }

      .total-estimado {
        font-size: 22px;
      }

      .nota-producto {
        font-size: 13px;
        padding: 12px;
        border-radius: 8px;
        line-height: 1.6;
      }

      /* FORMULARIO CLIENTE */
      .form-cliente {
        padding: 14px;
        border-radius: 12px;
      }

      .form-cliente h3 {
        font-size: 16px;
        margin: 0 0 10px 0;
      }

      .btn-enviar {
        padding: 13px;
        font-size: 15px;
        border-radius: 8px;
      }

      .mensaje-exito {
        font-size: 13px;
      }

      /* CARRUSEL DE MODELOS - MÓVIL */
      .modelos-carrusel-right {
        padding: 14px;
        border-radius: 14px;
        border-width: 2px;
        margin-bottom: 10px;
      }

      .modelos-carrusel-header-right {
        flex-direction: row;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }

      .modelos-carrusel-title-right {
        font-size: 14px;
        gap: 6px;
      }

      .title-icon {
        font-size: 16px;
      }

      .title-badge {
        font-size: 9px;
        padding: 2px 8px;
      }

      .carrusel-controls-right {
        gap: 4px;
      }

      .carrusel-btn-right {
        width: 30px;
        height: 30px;
        font-size: 11px;
      }

      .carrusel-indicador-right {
        font-size: 12px;
        min-width: 40px;
      }

      .modelo-carrusel-scroll-right {
        gap: 10px;
        padding: 8px 2px 12px 2px;
      }

      .modelo-carrusel-item-right {
        min-width: 120px;
        max-width: 140px;
        padding: 10px;
        border-radius: 12px;
      }

      .modelo-carrusel-item-right.active {
        transform: translateY(-4px) scale(1.04);
      }

      .modelo-carrusel-img-right {
        height: 90px;
      }

      .modelo-carrusel-nombre-right {
        font-size: 11px;
        height: 26px;
      }

      .modelo-carrusel-precio-right {
        font-size: 13px;
        gap: 4px;
      }

      .oferta-tag {
        font-size: 7px;
        padding: 1px 6px;
      }

      .stock-badge-right {
        font-size: 8px;
        padding: 1px 6px;
      }

      .modelo-selected-badge {
        font-size: 7px;
        padding: 2px 8px;
        top: 4px;
        left: 4px;
      }

      .carrusel-progress-container {
        margin-top: 10px;
      }

      .carrusel-progress-dot {
        width: 8px;
        height: 8px;
      }

      .carrusel-progress-dot.active {
        width: 24px;
      }

      .btn-ver-todos-modelos-right {
        padding: 10px 14px;
        font-size: 13px;
        border-radius: 10px;
        margin-top: 10px;
      }

      /* PRODUCTOS RELACIONADOS - MÓVIL */
      .full-width-related-wrapper {
        padding: 0 10px;
      }

      .full-width-related-section {
        margin: 25px auto 0 auto;
        padding: 0 5px;
      }

      .full-width-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }

      .sugeridos-banner {
        padding: 14px 16px;
        border-left-width: 4px;
        border-radius: 12px;
        margin-bottom: 16px;
      }

      .sugeridos-label {
        font-size: 10px;
        padding: 4px 14px;
      }

      .sugeridos-title {
        font-size: 17px;
        margin: 6px 0 8px 0;
      }

      .sugeridos-subtitle {
        font-size: 13px;
      }

      .related-card,
      .sugerido-card {
        padding: 10px;
        border-radius: 16px;
      }

      .related-image {
        height: 100px;
        border-radius: 10px;
        margin-bottom: 6px;
      }

      .related-card h4,
      .sugerido-card h4 {
        font-size: 12px;
        margin: 4px 0;
        line-height: 1.2;
      }

      .related-price {
        font-size: 15px;
      }

      .precio-ant {
        font-size: 12px;
      }

      .precio-of {
        font-size: 15px;
      }

      .related-sub {
        font-size: 11px;
      }

      .sugerido-badge {
        font-size: 9px;
        padding: 3px 8px;
        top: 8px;
        left: 8px;
      }

      .section-title {
        font-size: 18px;
      }

      .related-header {
        margin-bottom: 14px;
      }

      .related-count {
        font-size: 12px;
        padding: 4px 12px;
      }

      .tipo-grupo-header {
        padding: 10px 14px;
        border-radius: 10px;
        margin-bottom: 12px;
      }

      .tipo-grupo-icon {
        font-size: 16px;
      }

      .tipo-grupo-title {
        font-size: 14px;
      }

      .tipo-grupo-count {
        font-size: 10px;
        padding: 2px 10px;
      }

      /* MODALES */
      .modal-image {
        max-width: 95%;
        max-height: 80%;
      }
    }

    /* ========================================================= */
    /* 🔥 RESPONSIVE: MÓVILES MUY PEQUEÑOS (<400px) */
    /* ========================================================= */
    @media (max-width: 400px) {
      .producto-detalle-container {
        padding: 15px 8px 15px 8px;
        gap: 10px;
        margin: 5px 3px;
      }

      .main-image-container {
        height: 220px;
      }

      .thumb {
        width: 50px;
        height: 50px;
      }

      .product-title {
        font-size: 19px;
      }

      .precio-normal-brillante,
      .precio-oferta-brillante {
        font-size: 24px;
        gap: 8px;
      }

      .precio-unidad-brillante {
        font-size: 11px;
        padding: 2px 10px;
      }

      .full-width-grid {
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }

      .related-image {
        height: 80px;
      }

      .modelo-carrusel-item-right {
        min-width: 100px;
        max-width: 120px;
        padding: 8px;
      }

      .modelo-carrusel-img-right {
        height: 75px;
      }

      .modelo-carrusel-nombre-right {
        font-size: 10px;
        height: 22px;
      }

      .modelo-carrusel-precio-right {
        font-size: 11px;
      }

      .cotizador-box {
        padding: 10px;
      }

      .input-field {
        padding: 10px;
        font-size: 14px;
      }

      .medidas-grid {
        grid-template-columns: 1fr;
        gap: 6px;
      }

      .btn-ficha-tecnica,
      .btn-agregar-cotizador,
      .btn-agregar-pedido {
        padding: 12px 14px;
        font-size: 14px;
      }

      .sugeridos-title {
        font-size: 15px;
      }

      .sugeridos-subtitle {
        font-size: 12px;
      }

      .guia-grid {
        grid-template-columns: 1fr;
      }

      .guia-img {
        height: 90px;
      }

      .botones-medidas {
        flex-direction: column;
      }

      .selector-modo {
        flex-direction: column;
      }

      .badges-container {
        top: 8px;
        left: 8px;
      }

      .badge {
        font-size: 10px;
        padding: 3px 8px;
      }

      .fav-btn {
        width: 36px;
        height: 36px;
        font-size: 16px;
        top: 8px;
        right: 8px;
      }
    }
  `;
  document.head.appendChild(styleSheet);
}