import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Footer from "./Footer";
import Navbar from "./Navbar";

// 🔥 FUNCIÓN PARA GENERAR URL DE IMAGEN
const BACKEND_URL = "https://backend-zuib.onrender.com";

const getImageUrl = (imagen) => {
  if (!imagen) return "https://via.placeholder.com/200";
  if (typeof imagen !== "string") return "https://via.placeholder.com/200";
  
  if (imagen.startsWith("http://") || imagen.startsWith("https://")) return imagen;
  if (imagen.startsWith("blob:")) return imagen;
  if (imagen.startsWith("data:")) return imagen;
  if (imagen.startsWith("/")) return `${BACKEND_URL}${imagen}`;
  return `${BACKEND_URL}/${imagen}`;
};


export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [producto, setProducto] = useState(null);
  const [indice, setIndice] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [relacionados, setRelacionados] = useState([]);
  const [sugeridos, setSugeridos] = useState([]);
  const [imagenGuiaZoom, setImagenGuiaZoom] = useState(null);
  const [modelosDisponibles, setModelosDisponibles] = useState([]);
  const [modeloSeleccionado, setModeloSeleccionado] = useState(null);
  const [indiceCarrusel, setIndiceCarrusel] = useState(0);
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos");
    return guardados ? JSON.parse(guardados) : [];
  });
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cliente, setCliente] = useState({ nombre: "", correo: "", celular: "" });
  const [enviando, setEnviando] = useState(false);
  const [mensajeEnviado, setMensajeEnviado] = useState("");
  const [fichaZoom, setFichaZoom] = useState(false);

  const [medidas, setMedidas] = useState([
    { largo: "", ancho: "", area: "" },
    { largo: "", ancho: "", area: "" },
    { largo: "", ancho: "", area: "" }
  ]);

  const [modoEntrada, setModoEntrada] = useState("largoAncho");
  const [areaDirecta, setAreaDirecta] = useState("");
  const [desperdicio, setDesperdicio] = useState(0);
  const [modoCotizacion, setModoCotizacion] = useState("todas");
  const [areaSeleccionada, setAreaSeleccionada] = useState(0);
  const [mostrarNotificacion, setMostrarNotificacion] = useState(false);
  const [notificacionMensaje, setNotificacionMensaje] = useState("");

  const cotizadorRef = useRef();
  const imagenPDFRef = useRef();
  const carruselIntervalRef = useRef(null);
  const carruselScrollRef = useRef(null);

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
    api.get("/productos")
      .then((res) => setProductos(res.data))
      .catch((err) => console.error("Error cargando productos:", err));
  }, []);

  useEffect(() => {
    api.get(`/productos/${id}`)
      .then((res) => {
        setProducto(res.data);
        setIndice(0);
        setModeloSeleccionado(null);
        setIndiceCarrusel(0);
        setMedidas([
          { largo: "", ancho: "", area: "" },
          { largo: "", ancho: "", area: "" },
          { largo: "", ancho: "", area: "" }
        ]);
        setAreaDirecta("");
        setModoEntrada("largoAncho");
        setDesperdicio(0);
      })
      .catch((err) => console.error("Error cargando producto:", err));
  }, [id]);

  useEffect(() => {
    const adjustForNavbar = () => {
      const navbar = document.querySelector('.navbar');
      const page = document.querySelector('.producto-detalle-page');
      if (navbar && page && window.innerWidth <= 767) {
        const height = navbar.offsetHeight;
        page.style.paddingTop = `${height + 40}px`;
      } else if (page) {
        page.style.paddingTop = '0px';
      }
    };
    adjustForNavbar();
    window.addEventListener('resize', adjustForNavbar);
    return () => window.removeEventListener('resize', adjustForNavbar);
  }, []);

  // ===== MODELOS DISPONIBLES =====
  useEffect(() => {
    if (!producto) { setModelosDisponibles([]); return; }
    const tipoId = producto.tipo_id;
    if (!tipoId) { setModelosDisponibles([]); return; }

    const filtrarModelosLocalmente = () => {
      const tipoActual = producto.tipo?.toLowerCase().trim() || '';
      if (!tipoActual) { setModelosDisponibles([]); return; }
      api.get("/productos")
        .then((res) => {
          const filtrados = res.data.filter((p) => {
            if (p.id === producto.id) return false;
            const tipoP = p.tipo?.toLowerCase().trim() || '';
            return tipoP === tipoActual && p.visible === 1;
          });
          setModelosDisponibles(filtrados);
        })
        .catch((err) => console.error("Error en fallback:", err));
    };

    api.get(`/productos/tipo/${tipoId}`)
      .then((res) => {
        const filtrados = res.data.filter(p => p.id !== producto.id && p.visible === 1);
        setModelosDisponibles(filtrados);
      })
      .catch(() => filtrarModelosLocalmente());
  }, [producto, modeloSeleccionado]);

  // ===== CARRUSEL AUTOMÁTICO =====
  useEffect(() => {
    if (modelosDisponibles.length > 1 && carruselScrollRef.current) {
      const scrollContainer = carruselScrollRef.current;
      if (carruselIntervalRef.current) clearInterval(carruselIntervalRef.current);

      carruselIntervalRef.current = setInterval(() => {
        setIndiceCarrusel((prev) => {
          const nextIndex = (prev + 1) % modelosDisponibles.length;
          if (scrollContainer) {
            const items = scrollContainer.querySelectorAll('.modelo-carrusel-item');
            if (items[nextIndex]) {
              const itemWidth = items[nextIndex].offsetWidth + 20;
              scrollContainer.scrollTo({ left: nextIndex * itemWidth, behavior: 'smooth' });
            }
          }
          return nextIndex;
        });
      }, 3500);
    }
    return () => { if (carruselIntervalRef.current) clearInterval(carruselIntervalRef.current); };
  }, [modelosDisponibles]);

  // ===== RELACIONADOS =====
  useEffect(() => {
    if (!producto) return;
    const filtrarRelacionadosLocalmente = () => {
      const subcategoriaActual = producto.subcategoria?.toLowerCase().trim() || '';
      if (!subcategoriaActual) { setRelacionados([]); return; }
      api.get("/productos")
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

    if (producto.subcategoria_id) {
      api.get(`/productos/subcategoria-id/${producto.subcategoria_id}`)
        .then((res) => setRelacionados(res.data.filter(p => p.id !== producto.id)))
        .catch(() => filtrarRelacionadosLocalmente());
    } else {
      filtrarRelacionadosLocalmente();
    }

    let idsSugeridos = [];
    try { idsSugeridos = producto.sugerencias ? JSON.parse(producto.sugerencias) : []; } catch { idsSugeridos = []; }
    api.get("/productos")
      .then((res) => {
        const listaSugeridos = res.data.filter((p) => idsSugeridos.includes(String(p.id)) && p.id !== producto.id);
        setSugeridos(listaSugeridos);
      })
      .catch((err) => console.error("Error cargando sugeridos:", err));
  }, [producto]);

  useEffect(() => { localStorage.setItem("favoritos", JSON.stringify(favoritos)); }, [favoritos]);

  // ========== HELPERS ==========
  const toggleFavorito = (producto) => {
    const existe = favoritos.find((fav) => fav.id === producto.id);
    if (existe) {
      setFavoritos(favoritos.filter((f) => f.id !== producto.id));
      mostrarNotificacionCustom("❤️ Producto eliminado de favoritos");
    } else {
      setFavoritos([...favoritos, producto]);
      mostrarNotificacionCustom("❤️ Producto agregado a favoritos");
    }
  };

  const esFavorito = (id) => favoritos.some((f) => f.id === id);

  const mostrarNotificacionCustom = (mensaje) => {
    setNotificacionMensaje(mensaje);
    setMostrarNotificacion(true);
    setTimeout(() => setMostrarNotificacion(false), 3000);
  };

  const obtenerImagen = (producto) => {
    if (!producto) return "https://via.placeholder.com/200";
    let imagenUrl = "";
    if (producto.imagenes && producto.imagenes.trim() !== "") {
      imagenUrl = producto.imagenes.split(",")[0].trim();
    } else if (producto.imagen && producto.imagen.trim() !== "") {
      imagenUrl = producto.imagen.trim();
    } else {
      return "https://via.placeholder.com/200";
    }
    return getImageUrl(imagenUrl);
  };

  const imagenes = producto?.imagenes
    ? producto.imagenes.split(",")
    : producto?.imagen ? [producto.imagen] : [];

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
        const items = carruselScrollRef.current.querySelectorAll('.modelo-carrusel-item');
        if (items[index]) {
          const itemWidth = items[index].offsetWidth + 20;
          carruselScrollRef.current.scrollTo({ left: index * itemWidth, behavior: 'smooth' });
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
        const items = carruselScrollRef.current.querySelectorAll('.modelo-carrusel-item');
        if (items[nuevoIndice]) {
          const itemWidth = items[nuevoIndice].offsetWidth + 20;
          carruselScrollRef.current.scrollTo({ left: nuevoIndice * itemWidth, behavior: 'smooth' });
        }
      }
    }, 50);
  };

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
    if (!imgUrl) return "https://via.placeholder.com/200";
    return getImageUrl(imgUrl);
  };

  const getNombreActual = () => modeloSeleccionado ? modeloSeleccionado.nombre : producto.nombre;
  const getPrecioActual = () => {
    const p = modeloSeleccionado || producto;
    return p.oferta ? p.precioOferta : p.precio;
  };

  const getUnidadVenta = () => {
    const tipoVenta = producto?.tipoVenta || '';
    const unidadMap = {
      'pieza': 'por pieza',
      'caja': 'por caja',
      'paquete': 'por paquete',
      'metro_cuadrado': 'por metro cuadrado',
      'metro_lineal': 'por metro lineal',
      'presentacion': producto?.presentacion ? `por ${producto.presentacion}` : 'por presentación'
    };
    return unidadMap[tipoVenta] || '';
  };

  const agruparPorTipo = (productos) => {
    const grupos = {};
    productos.forEach(p => {
      let tipo = p.tipo || p.tipo_nombre || 'Sin tipo';
      if (tipo.toLowerCase() === 'sin nombre' || tipo.toLowerCase() === 'sin tipo') tipo = 'Sin tipo';
      if (!grupos[tipo]) grupos[tipo] = [];
      grupos[tipo].push(p);
    });
    return grupos;
  };

  const getTipoColor = (tipo) => {
    const colores = {
      'Sin tipo': '#94a3b8', 'Piso': '#2563eb', 'PVC': '#7c3aed',
      'Autoadherible': '#0891b2', 'Madera': '#b45309', 'Cerámica': '#dc2626',
      'Laminado': '#059669', 'Porcelanato': '#4f46e5', 'Mármol': '#7c3aed',
      'Granito': '#d97706', 'Vinilico': '#0d9488', 'SPC': '#0284c7',
      'WPC': '#65a30d', 'Linóleo': '#0891b2',
    };
    for (const [key, color] of Object.entries(colores)) {
      if (tipo.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(tipo.toLowerCase())) {
        return color;
      }
    }
    return '#2563eb';
  };

  const agregarAlPedido = (productoParaAgregar) => {
    const carritoGuardado = sessionStorage.getItem("carritoPedido");
    let carrito = carritoGuardado ? JSON.parse(carritoGuardado) : [];
    const existe = carrito.find(item => item.id === productoParaAgregar.id);
    if (existe) {
      carrito = carrito.map(item =>
        item.id === productoParaAgregar.id
          ? { ...item, cantidad: item.cantidad + 1, subtotal: item.precio * (item.cantidad + 1) }
          : item
      );
    } else {
      carrito.push({
        ...productoParaAgregar,
        imagen: obtenerImagen(productoParaAgregar),
        cantidad: 1,
        subtotal: productoParaAgregar.precio || 0
      });
    }
    sessionStorage.setItem("carritoPedido", JSON.stringify(carrito));
    mostrarNotificacionCustom(`✅ "${productoParaAgregar.nombre}" agregado al pedido`);
    setTimeout(() => navigate("/pedido"), 1500);
  };

  const agregarMedida = () => {
    if (medidas.length < 5) setMedidas([...medidas, { largo: "", ancho: "", area: "" }]);
  };
  const eliminarMedida = (index) => {
    if (medidas.length > 1) setMedidas(medidas.filter((_, i) => i !== index));
  };

  const actualizarMedida = (index, campo, valor) => {
    const nuevas = [...medidas];
    nuevas[index][campo] = valor;

    if (campo === "largo" || campo === "ancho") {
      const largo = Number(nuevas[index].largo) || 0;
      const ancho = Number(nuevas[index].ancho) || 0;
      if (largo > 0 && ancho > 0) {
        nuevas[index].area = (largo * ancho).toFixed(2);
      } else {
        nuevas[index].area = "";
      }
    }
    setMedidas(nuevas);
  };

  const limpiarCampos = () => {
    setMedidas([
      { largo: "", ancho: "", area: "" },
      { largo: "", ancho: "", area: "" },
      { largo: "", ancho: "", area: "" }
    ]);
    setAreaDirecta("");
  };

  const convertirAMetrosConUnidad = (valor, unidad = 'cm') => {
    const num = Number(valor) || 0;
    if (num === 0) return 0;
    const u = (unidad || 'cm').toLowerCase().trim();
    if (u === 'm' || u === 'mt' || u === 'mts' || u === 'metro' || u === 'metros') return num;
    if (u === 'mm' || u === 'milimetro' || u === 'milimetros') return num / 1000;
    if (u === 'cm' || u === 'centimetro' || u === 'centimetros') return num / 100;
    return num / 100;
  };

  const convertirAMetros = (valor, unidad = 'cm') => convertirAMetrosConUnidad(valor, unidad);

  const esProductoTipoRollo = () => {
    return producto?.tipoVenta === "metro_cuadrado" || producto?.tipoVenta === "metro_lineal";
  };

  const obtenerAnchoRollo = () => {
    if (esProductoTipoRollo()) {
      const alto = Number(producto?.alto) || 0;
      if (alto > 0) {
        if (alto > 100) return alto / 100;
        return alto;
      }
      const anchoProd = Number(producto?.anchoProducto) || 0;
      if (anchoProd > 0) return anchoProd;
      return convertirAMetros(producto?.ancho, producto?.unidadAncho || 'm');
    }
    return 0;
  };

  const obtenerLargoRollo = () => {
    const metrosRollo = Number(producto?.metrosPorRollo) || 0;
    if (metrosRollo > 0) return metrosRollo;
    const metrosCuad = Number(producto?.metrosCuadrados) || 0;
    const ancho = obtenerAnchoRollo();
    if (metrosCuad > 0 && ancho > 0) return metrosCuad / ancho;
    return 0;
  };

  const obtenerCoberturaRollo = () => {
    const metrosCuad = Number(producto?.metrosCuadrados) || 0;
    if (metrosCuad > 0) return metrosCuad;
    return obtenerAnchoRollo() * obtenerLargoRollo();
  };

  const getTipoVentaAmigable = () => {
    const t = (producto?.tipoVenta || '').toLowerCase();
    const map = {
      'metro_cuadrado': 'Metro cuadrado',
      'metro_lineal': 'Metro lineal',
      'caja': 'Caja',
      'paquete': 'Paquete',
      'pieza': 'Pieza',
      'presentacion': 'Unidad',
      'unidad': 'Unidad',
      'tramo': 'Tramo',
    };
    return map[t] || (producto?.tipoVenta
      ? producto.tipoVenta.charAt(0).toUpperCase() + producto.tipoVenta.slice(1)
      : 'Otros');
  };

  const calcularCoberturaPorUnidad = () => {
    if (!producto) return 0;
    const t = producto.tipoVenta;

    if (t === "metro_lineal") {
      const anchoM = obtenerAnchoRollo();
      const metrosRollo = Number(producto.metrosPorRollo) || 0;
      return anchoM * metrosRollo;
    }
    if (t === "metro_cuadrado") {
      return obtenerCoberturaRollo();
    }
    if (t === "presentacion") {
      return Number(producto.cobertura) || 0;
    }

    const unidadAncho = producto.unidadAncho || 'cm';
    const unidadAlto = producto.unidadAlto || 'cm';
    const anchoM = convertirAMetrosConUnidad(producto.ancho, unidadAncho);
    const altoM = convertirAMetrosConUnidad(producto.alto, unidadAlto);
    const coberturaPorPieza = anchoM * altoM;

    if (t === "caja" || t === "paquete") {
      const piezas = Number(producto.piezasCaja) || 1;
      return coberturaPorPieza * piezas;
    }
    return coberturaPorPieza;
  };

  const coberturaPorUnidad = calcularCoberturaPorUnidad();

  const obtenerMedidasValidas = () => medidas.filter(item => {
    const largo = Number(item.largo) || 0;
    const ancho = Number(item.ancho) || 0;
    const area = Number(item.area) || 0;
    return area > 0 || (largo > 0 && ancho > 0);
  });

  const calcularAreaTotal = () => {
    if (modoEntrada === "area") {
      const area = Number(areaDirecta) || 0;
      return area > 0 ? area : 0;
    } else {
      const medidasValidas = obtenerMedidasValidas();
      if (modoCotizacion === "todas") {
        return medidasValidas.reduce((total, item) => {
          const largo = Number(item.largo) || 0;
          const ancho = Number(item.ancho) || 0;
          const area = Number(item.area) || 0;
          return total + (area > 0 ? area : largo * ancho);
        }, 0);
      } else {
        const medidaSeleccionada = medidasValidas[areaSeleccionada] || medidasValidas[0];
        if (!medidaSeleccionada) return 0;
        const largo = Number(medidaSeleccionada.largo) || 0;
        const ancho = Number(medidaSeleccionada.ancho) || 0;
        const area = Number(medidaSeleccionada.area) || 0;
        return area > 0 ? area : largo * ancho;
      }
    }
  };

  let areaIngresada = calcularAreaTotal();
  let anchoRollo = obtenerAnchoRollo();

  const areaConDesperdicio = areaIngresada * (1 + Number(desperdicio) / 100);

  let metrosLineales = 0;
  let cantidadNecesaria = 0;
  let areaCubierta = 0;

  if (esProductoTipoRollo()) {
    if (anchoRollo > 0 && areaIngresada > 0) {
      metrosLineales = areaConDesperdicio / anchoRollo;
    }
    cantidadNecesaria = metrosLineales;
    areaCubierta = areaConDesperdicio;
  } else if (producto?.tipoVenta === "presentacion") {
    cantidadNecesaria = coberturaPorUnidad > 0 ? Math.ceil(areaIngresada / coberturaPorUnidad) : 0;
    areaCubierta = cantidadNecesaria * coberturaPorUnidad;
  } else {
    cantidadNecesaria = coberturaPorUnidad > 0 ? Math.ceil(areaConDesperdicio / coberturaPorUnidad) : 0;
    areaCubierta = cantidadNecesaria * coberturaPorUnidad;
  }

  const precioFinal = Number(producto?.oferta ? producto?.precioOferta : producto?.precio) || 0;
  let total = 0;

  if (producto?.tipoVenta === "metro_lineal") {
    total = metrosLineales * (Number(producto.precio) || 0);
  } else if (producto?.tipoVenta === "metro_cuadrado") {
    total = areaConDesperdicio * (Number(producto.precio) || 0);
  } else {
    total = cantidadNecesaria * precioFinal;
  }
  total = total.toFixed(2);

  const precioPorMetroCuadrado = Number(producto?.precio) || 0;

  const convertirImagenBase64 = async (url) => {
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch { return null; }
  };

  const obtenerDetalleMedidas = () => {
    if (modoEntrada === "area") return [{ numero: 1, area: areaIngresada }];
    const medidasValidas = obtenerMedidasValidas();
    return medidasValidas.map((item, index) => {
      const largo = Number(item.largo) || 0;
      const ancho = Number(item.ancho) || 0;
      const area = Number(item.area) || 0;
      return { numero: index + 1, largo, ancho, area: area > 0 ? area : largo * ancho };
    });
  };

  const generarPDF = async () => {
    try {
      setEnviando(true);
      const pdf = new jsPDF("p", "mm", "a4");
      const membrete1 = await convertirImagenBase64(window.location.origin + "/membreteuno.jpg");
      const membrete2 = await convertirImagenBase64(window.location.origin + "/membretedos.jpg");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const ponerFondo = (pdf, img) => { if (img) pdf.addImage(img, "JPEG", 0, 0, pageWidth, pageHeight); };

      ponerFondo(pdf, membrete1);
      let y = 50;
      const numeroCotizacion = Math.floor(100000 + Math.random() * 900000);
      const fechaActual = new Date().toLocaleDateString("es-MX");
      pdf.setFontSize(10); pdf.setTextColor(80);
      pdf.text(`Fecha: ${fechaActual}`, pageWidth - 60, 35);
      pdf.text(`Cotización #${numeroCotizacion}`, pageWidth - 60, 42);
      pdf.setDrawColor(200); pdf.line(15, 55, pageWidth - 15, 55);
      y = 70;

      const imagenBase64 = await convertirImagenBase64(getImagenActual());
      if (imagenBase64) pdf.addImage(imagenBase64, "JPEG", 15, y, 60, 60);

      pdf.setFontSize(14); pdf.setTextColor(40);
      pdf.text(`Producto: ${getNombreActual()}`, 85, y + 10);
      pdf.text(`Categoría: ${producto.categoria || "-"}`, 85, y + 20);
      pdf.text(`Subcategoría: ${producto.subcategoria || "-"}`, 85, y + 30);
      pdf.text(`SKU: ${producto.sku || "-"}`, 85, y + 40);
      pdf.setFontSize(20); pdf.setTextColor(22, 163, 74);
      pdf.text(`Total: $${total}`, 85, y + 55);

      y += 90;
      pdf.setFontSize(18); pdf.setTextColor(0);
      pdf.text("Resumen de Cotización", 15, y);
      y += 10;
      pdf.setFillColor(245, 247, 250);
      pdf.roundedRect(15, y, pageWidth - 30, 55, 3, 3, "F");
      pdf.setFontSize(11); pdf.setTextColor(60);

      if (esProductoTipoRollo()) {
        pdf.text(`Área a cubrir: ${areaIngresada.toFixed(2)} m²`, 20, y + 8);
        pdf.text(`Desperdicio: ${desperdicio}%`, 20, y + 18);
        pdf.text(`Área final: ${areaConDesperdicio.toFixed(2)} m²`, 20, y + 28);
        pdf.text(`Metros lineales necesarios: ${metrosLineales.toFixed(2)} ml`, 20, y + 38);
        pdf.text(`Ancho del rollo: ${anchoRollo.toFixed(2)} m`, 20, y + 48);
      } else {
        pdf.text(`Área total: ${areaIngresada.toFixed(2)} m²`, 20, y + 8);
        pdf.text(`Desperdicio: ${desperdicio}%`, 20, y + 18);
        pdf.text(`Área final: ${areaConDesperdicio.toFixed(2)} m²`, 20, y + 28);
        pdf.text(`Cantidad necesaria: ${cantidadNecesaria}`, 20, y + 38);
      }

      y += 70;
      pdf.setFontSize(14); pdf.setTextColor(30);
      pdf.text("Detalle de Medidas", 15, y);
      y += 10;
      const detalleMedidas = obtenerDetalleMedidas();
      detalleMedidas.forEach((item) => {
        pdf.setFontSize(11);
        if (item.largo > 0 && item.ancho > 0) {
          pdf.text(`Área ${item.numero}: ${item.largo} x ${item.ancho} = ${item.area.toFixed(2)} m²`, 20, y);
        } else {
          pdf.text(`Área ${item.numero}: ${item.area.toFixed(2)} m²`, 20, y);
        }
        y += 8;
      });

      const pdfBase64 = pdf.output("datauristring");
      await api.post("/enviar-cotizacion", {
        nombre: cliente.nombre, correo: cliente.correo, celular: cliente.celular,
        producto: producto.nombre, total, pdf: pdfBase64,
      });
      setMensajeEnviado("✅ La cotización fue enviada a tu correo");
      mostrarNotificacionCustom("📧 Cotización enviada exitosamente");
    } catch (error) {
      console.error(error);
      alert("❌ Error generando cotización");
    } finally { setEnviando(false); }
  };

  if (!producto) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Cargando producto...</p>
    </div>
  );

  const getStockColor = (stock) => {
    if (stock <= 0) return "#dc2626";
    if (stock <= 3) return "#f59e0b";
    return "#16a34a";
  };

  const getStockText = (stock) => {
    if (stock <= 0) return "Agotado";
    if (stock <= 3) return "¡Últimas unidades!";
    if (stock <= 10) return "Poco stock";
    return "Disponible";
  };

  const plural = (stock, tipo) => {
    if (stock === 1) return tipo;
    if (tipo === "unidad") return "unidades";
    if (tipo === "pieza") return "piezas";
    if (tipo === "tramo") return "tramos";
    if (tipo === "caja") return "cajas";
    if (tipo === "paquete") return "paquetes";
    return tipo + "s";
  };

  const relacionadosAgrupados = agruparPorTipo(relacionados);
  const sugeridosAgrupados = agruparPorTipo(sugeridos);
  const tieneCobertura = producto && (Number(producto.mostrarCobertura) === 1) && producto.cobertura && producto.cobertura.trim() !== '';

  const mostrarGuiaMedicion = () => esProductoTipoRollo();
  const mostrarSelectorModo = () => esProductoTipoRollo();
  const mostrarDesperdicio = () => esProductoTipoRollo();

  const tieneDetallesAdicionales = () => (
    (producto.uso && producto.uso.trim() !== "") ||
    (producto.aplicacion && producto.aplicacion.trim() !== "") ||
    (producto.tipo_diseno && producto.tipo_diseno.trim() !== "") ||
    (producto.material && producto.material.trim() !== "") ||
    (producto.acabado && producto.acabado.trim() !== "") ||
    (producto.tipo_instalacion && producto.tipo_instalacion.trim() !== "") ||
    (producto.espesor_capa_desgaste && producto.espesor_capa_desgaste.trim() !== "") ||
    (producto.variante && producto.variante.trim() !== "")
  );

  const getTextoExplicativoProducto = () => {
    const t = (producto?.tipoVenta || '').toLowerCase();

    if (t === "metro_cuadrado" || t === "metro_lineal") {
      const ancho = obtenerAnchoRollo().toFixed(2);
      const largo = obtenerLargoRollo().toFixed(2);
      const cobertura = obtenerCoberturaRollo().toFixed(2);
      return (
        <>
          Este <strong>rollo</strong> mide <strong>{ancho} metros de ancho</strong> por{" "}
          <strong>{largo} metros de largo</strong>, cubriendo un total de{" "}
          <strong>{cobertura} metros cuadrados</strong> por rollo completo.
        </>
      );
    }

    if (t === "caja") {
      const piezas = producto.piezasCaja || 1;
      const ancho = Number(producto.ancho) || 0;
      const alto = Number(producto.alto) || 0;
      const unidadA = producto.unidadAncho || 'cm';
      const unidadAl = producto.unidadAlto || 'cm';
      const coberturaCaja = coberturaPorUnidad.toFixed(2);
      return (
        <>
          Este producto se vende <strong>por caja</strong>. Cada caja contiene{" "}
          <strong>{piezas} piezas</strong>
          {ancho > 0 && alto > 0 && (
            <> y cada pieza mide <strong>{ancho} {unidadA} × {alto} {unidadAl}</strong></>
          )}
          , cubriendo un total de <strong>{coberturaCaja} m²</strong> por caja.
        </>
      );
    }

    if (t === "paquete") {
      const piezas = producto.piezasCaja || 1;
      const ancho = Number(producto.ancho) || 0;
      const alto = Number(producto.alto) || 0;
      const unidadA = producto.unidadAncho || 'cm';
      const unidadAl = producto.unidadAlto || 'cm';
      const coberturaPaq = coberturaPorUnidad.toFixed(2);
      return (
        <>
          Este producto se vende <strong>por paquete</strong>. Cada paquete contiene{" "}
          <strong>{piezas} piezas</strong>
          {ancho > 0 && alto > 0 && (
            <> y cada pieza mide <strong>{ancho} {unidadA} × {alto} {unidadAl}</strong></>
          )}
          , cubriendo un total de <strong>{coberturaPaq} m²</strong> por paquete.
        </>
      );
    }

    if (t === "pieza") {
      const ancho = Number(producto.ancho) || 0;
      const alto = Number(producto.alto) || 0;
      const unidadA = producto.unidadAncho || 'cm';
      const unidadAl = producto.unidadAlto || 'cm';
      const cobertura = coberturaPorUnidad.toFixed(2);
      return (
        <>
          Este producto se vende <strong>por pieza</strong>
          {ancho > 0 && alto > 0 && (
            <> y cada pieza mide <strong>{ancho} {unidadA} × {alto} {unidadAl}</strong></>
          )}
          , cubriendo aproximadamente <strong>{cobertura} m²</strong> por pieza.
        </>
      );
    }

    if (t === "presentacion" || t === "unidad") {
      const presentacion = producto.presentacion || 'unidad';
      const cobertura = coberturaPorUnidad.toFixed(2);
      return (
        <>
          Este producto se vende <strong>por unidad ({presentacion})</strong>. Cada unidad
          cubre aproximadamente <strong>{cobertura} m²</strong>.
        </>
      );
    }

    if (t === "tramo") {
      const ancho = Number(producto.ancho) || 0;
      const alto = Number(producto.alto) || 0;
      const unidadA = producto.unidadAncho || 'cm';
      const unidadAl = producto.unidadAlto || 'cm';
      return (
        <>
          Este producto se vende <strong>por tramo</strong>
          {ancho > 0 && alto > 0 && (
            <> y cada tramo mide <strong>{ancho} {unidadA} × {alto} {unidadAl}</strong></>
          )}
          .
        </>
      );
    }

    const ancho = Number(producto.ancho) || 0;
    const alto = Number(producto.alto) || 0;
    const grupo = Number(producto.grueso) || 0;
    const unidadA = producto.unidadAncho || 'cm';
    const unidadAl = producto.unidadAlto || 'cm';
    const unidadG = producto.unidadGrueso || 'mm';

    if (ancho > 0 || alto > 0 || grupo > 0) {
      return (
        <>
          Este producto tiene las siguientes medidas:
          {ancho > 0 && <> <strong>Ancho {ancho} {unidadA}</strong></>}
          {alto > 0 && <>, <strong>Alto {alto} {unidadAl}</strong></>}
          {grupo > 0 && <>, <strong>Grosor {grupo} {unidadG}</strong></>}.
        </>
      );
    }

    return <>Producto con especificaciones variables. Consulta la ficha técnica para más detalles.</>;
  };

  return (
    <div className="producto-detalle-page">
      <Navbar
        productos={productos} categorias={categorias} subcategorias={subcategorias}
        tipos={tipos} favoritos={favoritos} toggleFavorito={toggleFavorito} esFavorito={esFavorito}
      />

      {mostrarNotificacion && (
        <div className="notificacion-flotante"><span>{notificacionMensaje}</span></div>
      )}

      <div className="producto-detalle-wrapper">
        <div className="producto-detalle-left-col">
          <div className="producto-detalle-gallery">
            <div className="badges-container">
              {(producto.rebaja === 1 || producto.rebaja === true) && <span className="badge rebaja">🔥 REBAJA</span>}
              {(producto.destacado === 1 || producto.destacado === true) && <span className="badge destacado">⭐ DESTACADO</span>}
              {producto.stock <= 3 && producto.stock > 0 && <span className="badge ultimas">⚡ ÚLTIMAS UNIDADES</span>}
            </div>

            <button className="fav-btn" onClick={() => toggleFavorito(producto)} aria-label="Favorito">
              {esFavorito(producto.id) ? '❤️' : '🤍'}
            </button>

            <div className="main-image-container" onMouseMove={handleMouseMove}
              onMouseEnter={() => setZoom(true)} onMouseLeave={() => setZoom(false)}>
              <img ref={imagenPDFRef} src={getImagenActual()} alt={getNombreActual()}
                className="main-image"
                style={{
                  transform: zoom ? "scale(2)" : "scale(1)",
                  transformOrigin: `${pos.x}% ${pos.y}%`,
                  transition: "transform 0.1s",
                }}
                loading="lazy"
              />
              {zoom && <div className="zoom-indicator">🔍 Zoom</div>}
            </div>

            <div className="thumbs-container">
              {(modeloSeleccionado
                ? (modeloSeleccionado.imagenes ? modeloSeleccionado.imagenes.split(",") : [modeloSeleccionado.imagen])
                : imagenes
              ).map((img, i) => (
                <img key={i} src={getImageUrl(img)} alt={`miniatura-${i}`}
                  className={`thumb ${i === indice ? 'active' : ''}`}
                  onClick={() => setIndice(i)}
                />
              ))}
            </div>
          </div>

          {producto?.tipoVenta && (
            <div className="cotizador-wrapper">
              <div className="cotizador-box" ref={cotizadorRef}>
                <div className="cotizador-header">
                  <span className="cotizador-icon">🧮</span>
                  <div>
                    <h3 className="cotizador-title">Calcula cuánto necesitas</h3>
                    <p className="cotizador-subtitle">Ingresa largo, ancho o el área directamente</p>
                  </div>
                </div>

                <div className="selector-modo-entrada">
                  <label className={modoEntrada === "largoAncho" ? "active" : ""}>
                    <input type="radio" checked={modoEntrada === "largoAncho"} onChange={() => setModoEntrada("largoAncho")} />
                    📏 Largo y Ancho
                  </label>
                  <label className={modoEntrada === "area" ? "active" : ""}>
                    <input type="radio" checked={modoEntrada === "area"} onChange={() => setModoEntrada("area")} />
                    📐 Área en m²
                  </label>
                </div>

                {mostrarGuiaMedicion() && modoEntrada === "largoAncho" && (
                  <div className="guia-medicion">
                    <h4 className="guia-titulo">📏 ¿Cómo calcular los m²?</h4>
                    <div className="guia-grid">
                      <div className="guia-card">
                        <img src="/areasplanas.png" alt="Cómo medir piso" className="guia-img" onClick={() => setImagenGuiaZoom("/areasplanas.png")} />
                        <h4>Áreas planas (Pisos)</h4>
                        <p>Da clic en la imagen para ampliar.</p>
                      </div>
                      <div className="guia-card">
                        <img src="/paredes.png" alt="Cómo medir muro" className="guia-img" onClick={() => setImagenGuiaZoom("/paredes.png")} />
                        <h4>Muros (Paredes)</h4>
                        <p>Da clic en la imagen para ampliar.</p>
                      </div>
                    </div>
                  </div>
                )}

                {modoEntrada === "area" && (
                  <div className="medida-card area-directa-card">
                    <h4>📐 Ingresa el área en metros cuadrados</h4>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                      Si ya sabes cuántos metros cuadrados necesitas, ingrésalos directamente.
                    </p>
                    <input type="number" placeholder="Ej: 15.5" value={areaDirecta}
                      onChange={(e) => setAreaDirecta(e.target.value)}
                      className="input-field" step="0.01" min="0" />
                    {Number(areaDirecta) > 0 && (
                      <p className="resultado-medida">
                        📐 Área ingresada: <strong>{Number(areaDirecta).toFixed(2)} m²</strong>
                      </p>
                    )}
                  </div>
                )}

                {modoEntrada === "largoAncho" && (
                  <>
                    {mostrarSelectorModo() && (
                      <div className="selector-modo">
                        <label>
                          <input type="radio" checked={modoCotizacion === "todas"} onChange={() => setModoCotizacion("todas")} />
                          Cotizar todas las áreas
                        </label>
                        <label>
                          <input type="radio" checked={modoCotizacion === "una"} onChange={() => setModoCotizacion("una")} />
                          Cotizar una sola área
                        </label>
                        <div className="resumen-area">
                          {modoCotizacion === "todas" ? `📐 Área total: ${calcularAreaTotal().toFixed(2)} m²` : `📐 Área seleccionada: ${calcularAreaTotal().toFixed(2)} m²`}
                        </div>
                      </div>
                    )}

                    <div className="medidas-container">
                      {medidas.map((item, index) => {
                        const largo = Number(item.largo) || 0;
                        const ancho = Number(item.ancho) || 0;
                        const areaItem = Number(item.area) || 0;
                        const areaCalculada = areaItem > 0 ? areaItem : largo * ancho;
                        return (
                          <div key={index} className="medida-card">
                            <div className="medida-card-header">
                              <h4>📐 Área {index + 1}</h4>
                              {areaCalculada > 0 && (
                                <span className="medida-badge">{areaCalculada.toFixed(2)} m²</span>
                              )}
                            </div>
                            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>
                              Ingresa <strong>largo</strong>, <strong>ancho</strong> o directamente el <strong>área</strong>.
                            </p>
                            {modoCotizacion === "una" && (
                              <label className="radio-label">
                                <input type="radio" checked={areaSeleccionada === index} onChange={() => setAreaSeleccionada(index)} />
                                Utilizar esta área
                              </label>
                            )}
                            <div className="medidas-grid-3">
                              <div className="input-group">
                                <label className="input-mini-label">Largo (m)</label>
                                <input type="number" placeholder="0.00" value={item.largo}
                                  onChange={(e) => actualizarMedida(index, "largo", e.target.value)}
                                  className="input-field" step="0.01" min="0" />
                              </div>
                              <div className="input-group">
                                <label className="input-mini-label">Ancho (m)</label>
                                <input type="number" placeholder="0.00" value={item.ancho}
                                  onChange={(e) => actualizarMedida(index, "ancho", e.target.value)}
                                  className="input-field" step="0.01" min="0" />
                              </div>
                              <div className="input-group">
                                <label className="input-mini-label">Área (m²)</label>
                                <input type="number" placeholder="Auto" value={item.area}
                                  onChange={(e) => actualizarMedida(index, "area", e.target.value)}
                                  className="input-field input-area-auto" step="0.01" min="0" />
                              </div>
                            </div>
                            {medidas.length > 1 && (
                              <button className="btn-eliminar" onClick={() => eliminarMedida(index)}>🗑 Eliminar</button>
                            )}
                          </div>
                        );
                      })}

                      <div className="botones-medidas">
                        {medidas.length < 5 && (
                          <button className="btn-agregar" onClick={agregarMedida}>➕ Agregar medida</button>
                        )}
                        <button className="btn-limpiar" onClick={limpiarCampos}>🧹 Limpiar campos</button>
                      </div>
                    </div>
                  </>
                )}

                {mostrarDesperdicio() && (
                  <div className="desperdicio-box">
                    <span className="desperdicio-label">Desperdicio:</span>
                    {[0, 5, 10, 15, 20].map((p) => (
                      <button key={p} className={`des-btn ${desperdicio === p ? "active" : ""}`}
                        onClick={() => setDesperdicio(p)}>{p}%</button>
                    ))}
                  </div>
                )}

                {calcularAreaTotal() > 0 && (
                  <div className="resultado-cotizacion">
                    {esProductoTipoRollo() ? (
                      <>
                        <div className="resultado-grid">
                          <div className="resultado-item">
                            <span className="resultado-label">📐 Área a cubrir</span>
                            <span className="resultado-valor">{areaIngresada.toFixed(2)} m²</span>
                          </div>
                          <div className="resultado-item">
                            <span className="resultado-label">📏 Ancho del rollo</span>
                            <span className="resultado-valor">{anchoRollo.toFixed(2)} m</span>
                          </div>
                          <div className="resultado-item">
                            <span className="resultado-label">📈 Desperdicio</span>
                            <span className="resultado-valor">{desperdicio}%</span>
                          </div>
                          <div className="resultado-item">
                            <span className="resultado-label">📐 Área con desperdicio</span>
                            <span className="resultado-valor">{areaConDesperdicio.toFixed(2)} m²</span>
                          </div>
                          <div className="resultado-item destacado">
                            <span className="resultado-label">📏 Metros lineales necesarios</span>
                            <span className="resultado-valor principal">{metrosLineales.toFixed(2)} ml</span>
                          </div>
                          <div className="resultado-item">
                            <span className="resultado-label">💰 Precio por m²</span>
                            <span className="resultado-valor">${Number(precioPorMetroCuadrado).toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="total-box">
                          <span className="total-label">Total estimado</span>
                          <span className="total-valor">${Number(total).toLocaleString()}</span>
                        </div>

                        <div className="detalle-calculo">
                          <p className="detalle-titulo">💡 Detalle del cálculo</p>
                          <p>{areaConDesperdicio.toFixed(2)} m² ÷ {anchoRollo.toFixed(2)} m = {metrosLineales.toFixed(2)} metros lineales a cortar</p>
                          <p>{areaConDesperdicio.toFixed(2)} m² × ${Number(precioPorMetroCuadrado).toLocaleString()} = <strong>${Number(total).toLocaleString()}</strong></p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="resultado-grid">
                          <div className="resultado-item">
                            <span className="resultado-label">📐 Área a cubrir</span>
                            <span className="resultado-valor">{areaIngresada.toFixed(2)} m²</span>
                          </div>
                          {coberturaPorUnidad > 0 && (
                            <div className="resultado-item">
                              <span className="resultado-label">📦 Cobertura por {getTipoVentaAmigable().toLowerCase()}</span>
                              <span className="resultado-valor">{coberturaPorUnidad.toFixed(2)} m²</span>
                            </div>
                          )}
                          <div className="resultado-item destacado">
                            <span className="resultado-label">📦 Cantidad necesaria</span>
                            <span className="resultado-valor principal">
                              {cantidadNecesaria} {
                                producto.tipoVenta === "caja" ? "cajas" :
                                producto.tipoVenta === "paquete" ? "paquetes" :
                                producto.tipoVenta === "presentacion" ? "unidades" :
                                producto.tipoVenta === "tramo" ? "tramos" :
                                producto.tipoVenta === "pieza" ? "piezas" : "unidades"
                              }
                            </span>
                          </div>
                        </div>

                        <div className="total-box">
                          <span className="total-label">Total estimado</span>
                          <span className="total-valor">${Number(total).toLocaleString()}</span>
                        </div>

                        <div className="detalle-calculo">
                          <p className="detalle-titulo">📌 Detalle del cálculo</p>
                          <p>Área a cubrir: <strong>{areaIngresada.toFixed(2)} m²</strong></p>
                          {coberturaPorUnidad > 0 && (
                            <p>Cobertura por {getTipoVentaAmigable().toLowerCase()}: <strong>{coberturaPorUnidad.toFixed(2)} m²</strong></p>
                          )}
                          <p>Cantidad necesaria: <strong>{cantidadNecesaria}</strong></p>
                          <p style={{ color: '#16a34a', fontSize: '1.1rem', marginTop: '6px' }}>
                            💰 {cantidadNecesaria} × ${Number(precioFinal).toLocaleString()} = <strong>${Number(total).toLocaleString()}</strong>
                          </p>
                        </div>
                      </>
                    )}

                    <div className="necesitas-box">
                      <span className="necesitas-label">Necesitas</span>
                      <span className="necesitas-valor">
                        {esProductoTipoRollo() ? (
                          <>{metrosLineales.toFixed(2)} metros lineales</>
                        ) : producto.tipoVenta === "presentacion" ? (
                          <>{cantidadNecesaria} unidades</>
                        ) : producto.tipoVenta === "caja" ? (
                          <>{cantidadNecesaria} cajas</>
                        ) : producto.tipoVenta === "paquete" ? (
                          <>{cantidadNecesaria} paquetes</>
                        ) : producto.tipoVenta === "pieza" ? (
                          <>{cantidadNecesaria} piezas</>
                        ) : (
                          <>{cantidadNecesaria}</>
                        )}
                      </span>
                    </div>

                    <div className="form-cliente">
                      <h3>📨 Solicitar cotización</h3>
                      <input type="text" placeholder="Nombre" value={cliente.nombre}
                        onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })} className="input-field" />
                      <input type="email" placeholder="Correo" value={cliente.correo}
                        onChange={(e) => setCliente({ ...cliente, correo: e.target.value })} className="input-field" />
                      <input type="text" placeholder="Celular" value={cliente.celular}
                        onChange={(e) => setCliente({ ...cliente, celular: e.target.value })} className="input-field" />
                      <button className="btn-enviar" onClick={generarPDF} disabled={enviando}>
                        {enviando ? "Enviando..." : "Solicitar cotización"}
                      </button>
                      {mensajeEnviado && <p className="mensaje-exito">{mensajeEnviado}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="producto-detalle-right-col">
          <div className="breadcrumb">
            <span onClick={() => navigate('/')}>Inicio</span>
            <span>/</span>
            <span onClick={() => navigate('/productos')}>Productos</span>
            <span>/</span>
            <span className="breadcrumb-actual">{producto.nombre}</span>
          </div>

          <h1 className="product-title">{getNombreActual()}</h1>

          {modelosDisponibles.length > 0 && (
            <div className="modelos-carrusel">
              <div className="modelos-carrusel-header">
                <h3 className="modelos-carrusel-title">
                  <span className="title-icon">✨</span>
                  <span className="title-text">Modelos disponibles</span>
                  <span className="title-badge">¡Explora!</span>
                </h3>
                <div className="carrusel-controls">
                  <button className="carrusel-btn prev" onClick={() => navegarCarrusel(-1)} aria-label="Anterior">◀</button>
                  <span className="carrusel-indicador">
                    <strong>{indiceCarrusel + 1}</strong> / {modelosDisponibles.length}
                  </span>
                  <button className="carrusel-btn next" onClick={() => navegarCarrusel(1)} aria-label="Siguiente">▶</button>
                </div>
              </div>

              <div className="modelos-carrusel-container">
                <div className="modelos-carrusel-scroll" ref={carruselScrollRef}>
                  {modelosDisponibles.map((modelo, index) => (
                    <div
                      key={modelo.id}
                      className={`modelo-carrusel-item ${modeloSeleccionado?.id === modelo.id ? 'active' : ''} ${index === indiceCarrusel ? 'is-current' : ''}`}
                      onClick={() => seleccionarModelo(modelo, index)}
                    >
                      {modeloSeleccionado?.id === modelo.id && (
                        <div className="modelo-selected-badge">
                          <span className="check-icon">✓</span> Seleccionado
                        </div>
                      )}
                      {modelo.oferta === 1 || modelo.oferta === true ? (
                        <div className="modelo-oferta-badge">🔥 OFERTA</div>
                      ) : null}
                      <div className="modelo-img-wrapper">
                        <img
                          src={obtenerImagen(modelo)}
                          alt={modelo.nombre}
                          className="modelo-carrusel-img"
                          loading="lazy"
                        />
                        <div className="modelo-img-glow"></div>
                      </div>
                      <div className="modelo-carrusel-info">
                        <p className="modelo-carrusel-nombre">{modelo.nombre}</p>
                        <div className="modelo-precio-row">
                          <p className="modelo-carrusel-precio">
                            ${modelo.oferta ? modelo.precioOferta : modelo.precio}
                          </p>
                          {modelo.oferta && (
                            <span className="modelo-precio-ant">${modelo.precio}</span>
                          )}
                        </div>
                        {modelo.stock <= 3 && modelo.stock > 0 && (
                          <span className="stock-badge">⚡ ¡Últimas unidades!</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="carrusel-progress">
                {modelosDisponibles.map((_, index) => (
                  <div
                    key={index}
                    className={`carrusel-dot ${index === indiceCarrusel ? 'active' : ''}`}
                    onClick={() => {
                      setIndiceCarrusel(index);
                      if (carruselScrollRef.current) {
                        const items = carruselScrollRef.current.querySelectorAll('.modelo-carrusel-item');
                        if (items[index]) {
                          const itemWidth = items[index].offsetWidth + 20;
                          carruselScrollRef.current.scrollTo({ left: index * itemWidth, behavior: 'smooth' });
                        }
                      }
                    }}
                  />
                ))}
              </div>

              <button
                className="btn-ver-todos"
                onClick={() => {
                  if (producto.tipo_id) navigate(`/productos/tipo/${producto.tipo_id}`);
                  else if (producto.tipo) navigate(`/productos/tipo-nombre/${encodeURIComponent(producto.tipo)}`);
                }}
              >
                <span>🔍</span>
                Ver todos los modelos disponibles
                <span className="btn-count-badge">{modelosDisponibles.length}</span>
              </button>
            </div>
          )}

          <div className="category-box">
            {producto.categoria && <span className="category-tag">📁 {producto.categoria}</span>}
            {producto.subcategoria && <span className="subcategory-tag">📂 {producto.subcategoria}</span>}
            {producto.tipo && <span className="type-tag">🏷️ {producto.tipo}</span>}
          </div>

          <div className="precio-section">
            {producto.oferta === 1 || producto.oferta === true ? (
              <div className="precio-container">
                <span className="precio-anterior">${producto.precio}</span>
                <h2 className="precio-oferta">
                  ${getPrecioActual()}
                  <span className="precio-unidad">{getUnidadVenta()}</span>
                </h2>
                <span className="descuento-badge">
                  -{Math.round(((producto.precio - producto.precioOferta) / producto.precio) * 100)}%
                </span>
              </div>
            ) : (
              <h2 className="precio-normal">
                ${getPrecioActual()}
                <span className="precio-unidad">{getUnidadVenta()}</span>
              </h2>
            )}
          </div>

          {producto.sku && <p className="sku-item"><strong>SKU:</strong> {producto.sku}</p>}

          <div className="stock-box-modern" style={{ borderColor: getStockColor(producto.stock) }}>
            <div className="stock-status">
              <span className={`stock-indicator ${producto.stock <= 0 ? 'agotado' : producto.stock <= 3 ? 'poco' : 'disponible'}`}></span>
              <span className="stock-text" style={{ color: getStockColor(producto.stock) }}>
                {getStockText(producto.stock)}
              </span>
            </div>
            {producto.stock > 0 && (
              <span className="stock-cantidad">{producto.stock} {plural(producto.stock, producto.tipoVenta)}</span>
            )}
          </div>

          <div className="ficha-tecnica-visual-box">
            <div className="ficha-tecnica-header">
              <span className="ficha-tecnica-icon">
                {getTipoVentaAmigable() === 'Metro cuadrado' || getTipoVentaAmigable() === 'Metro lineal' ? '🧵' :
                 getTipoVentaAmigable() === 'Caja' ? '📦' :
                 getTipoVentaAmigable() === 'Paquete' ? '📦' :
                 getTipoVentaAmigable() === 'Pieza' ? '🧩' :
                 getTipoVentaAmigable() === 'Tramo' ? '📏' :
                 getTipoVentaAmigable() === 'Unidad' ? '🧴' : '🏷️'}
              </span>
              <div>
                <h3 className="ficha-tecnica-titulo">Especificaciones del producto</h3>
                <p className="ficha-tecnica-subtitulo">Tipo de venta: <strong>{getTipoVentaAmigable()}</strong></p>
              </div>
            </div>

            {esProductoTipoRollo() && (
              <div className="ficha-tecnica-visual">
                <div className="rollo-visual">
                  <div className="rollo-dimension rollo-alto">
                    <span className="rollo-dimension-label">Ancho del rollo</span>
                    <span className="rollo-dimension-valor">{obtenerAnchoRollo().toFixed(2)} m</span>
                  </div>
                  <div className="rollo-rect">
                    <div className="rollo-rect-inner">
                      <span className="rollo-rect-text">ROLLO</span>
                    </div>
                  </div>
                  <div className="rollo-dimension rollo-largo">
                    <span className="rollo-dimension-label">Largo</span>
                    <span className="rollo-dimension-valor">{obtenerLargoRollo().toFixed(2)} m</span>
                  </div>
                </div>

                <div className="ficha-formula">
                  <span className="formula-item">{obtenerAnchoRollo().toFixed(2)} m</span>
                  <span className="formula-signo">×</span>
                  <span className="formula-item">{obtenerLargoRollo().toFixed(2)} m</span>
                  <span className="formula-signo">=</span>
                  <span className="formula-item formula-resultado">
                    {obtenerCoberturaRollo().toFixed(2)} m²
                  </span>
                </div>
                <p className="ficha-formula-desc">Cobertura total del rollo completo</p>
              </div>
            )}

            <div className="ficha-grid">
              {esProductoTipoRollo() && (
                <>
                  <div className="ficha-grid-item">
                    <span className="ficha-grid-icon">📏</span>
                    <div>
                      <span className="ficha-grid-label">Ancho del rollo</span>
                      <span className="ficha-grid-value">{obtenerAnchoRollo().toFixed(2)} m</span>
                    </div>
                  </div>
                  <div className="ficha-grid-item">
                    <span className="ficha-grid-icon">📐</span>
                    <div>
                      <span className="ficha-grid-label">Largo total</span>
                      <span className="ficha-grid-value">{obtenerLargoRollo().toFixed(2)} m</span>
                    </div>
                  </div>
                  <div className="ficha-grid-item">
                    <span className="ficha-grid-icon">📊</span>
                    <div>
                      <span className="ficha-grid-label">Cobertura del rollo</span>
                      <span className="ficha-grid-value">{obtenerCoberturaRollo().toFixed(2)} m²</span>
                    </div>
                  </div>
                  {producto.grueso && (
                    <div className="ficha-grid-item">
                      <span className="ficha-grid-icon">📊</span>
                      <div>
                        <span className="ficha-grid-label">Grosor</span>
                        <span className="ficha-grid-value">{producto.grueso} {producto.unidadGrueso || 'mm'}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {(producto.tipoVenta === "caja" || producto.tipoVenta === "paquete") && (
                <>
                  <div className="ficha-grid-item">
                    <span className="ficha-grid-icon">📦</span>
                    <div>
                      <span className="ficha-grid-label">Piezas por {producto.tipoVenta}</span>
                      <span className="ficha-grid-value">{producto.piezasCaja || 1}</span>
                    </div>
                  </div>
                  {producto.ancho && producto.alto && (
                    <div className="ficha-grid-item">
                      <span className="ficha-grid-icon">📐</span>
                      <div>
                        <span className="ficha-grid-label">Medida por pieza</span>
                        <span className="ficha-grid-value">
                          {producto.ancho}{producto.unidadAncho || 'cm'} × {producto.alto}{producto.unidadAlto || 'cm'}
                        </span>
                      </div>
                    </div>
                  )}
                  {coberturaPorUnidad > 0 && (
                    <div className="ficha-grid-item">
                      <span className="ficha-grid-icon">📊</span>
                      <div>
                        <span className="ficha-grid-label">Cobertura por {producto.tipoVenta}</span>
                        <span className="ficha-grid-value">{coberturaPorUnidad.toFixed(2)} m²</span>
                      </div>
                    </div>
                  )}
                  {producto.grueso && (
                    <div className="ficha-grid-item">
                      <span className="ficha-grid-icon">📊</span>
                      <div>
                        <span className="ficha-grid-label">Grosor</span>
                        <span className="ficha-grid-value">{producto.grueso} {producto.unidadGrueso || 'mm'}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {producto.tipoVenta === "pieza" && (
                <>
                  {producto.ancho && producto.alto && (
                    <div className="ficha-grid-item">
                      <span className="ficha-grid-icon">📐</span>
                      <div>
                        <span className="ficha-grid-label">Medidas</span>
                        <span className="ficha-grid-value">
                          {producto.ancho}{producto.unidadAncho || 'cm'} × {producto.alto}{producto.unidadAlto || 'cm'}
                        </span>
                      </div>
                    </div>
                  )}
                  {coberturaPorUnidad > 0 && (
                    <div className="ficha-grid-item">
                      <span className="ficha-grid-icon">📊</span>
                      <div>
                        <span className="ficha-grid-label">Cobertura por pieza</span>
                        <span className="ficha-grid-value">{coberturaPorUnidad.toFixed(2)} m²</span>
                      </div>
                    </div>
                  )}
                  {producto.grueso && (
                    <div className="ficha-grid-item">
                      <span className="ficha-grid-icon">📊</span>
                      <div>
                        <span className="ficha-grid-label">Grosor</span>
                        <span className="ficha-grid-value">{producto.grueso} {producto.unidadGrueso || 'mm'}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {producto.tipoVenta === "presentacion" && (
                <>
                  <div className="ficha-grid-item">
                    <span className="ficha-grid-icon">🧴</span>
                    <div>
                      <span className="ficha-grid-label">Presentación</span>
                      <span className="ficha-grid-value">{producto.presentacion || 'Unidad'}</span>
                    </div>
                  </div>
                  {coberturaPorUnidad > 0 && (
                    <div className="ficha-grid-item">
                      <span className="ficha-grid-icon">📊</span>
                      <div>
                        <span className="ficha-grid-label">Cobertura por unidad</span>
                        <span className="ficha-grid-value">{coberturaPorUnidad.toFixed(2)} m²</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {producto.tipoVenta === "tramo" && (
                <>
                  {producto.ancho && producto.alto && (
                    <div className="ficha-grid-item">
                      <span className="ficha-grid-icon">📐</span>
                      <div>
                        <span className="ficha-grid-label">Medidas del tramo</span>
                        <span className="ficha-grid-value">
                          {producto.ancho}{producto.unidadAncho || 'cm'} × {producto.alto}{producto.unidadAlto || 'cm'}
                        </span>
                      </div>
                    </div>
                  )}
                  {producto.grueso && (
                    <div className="ficha-grid-item">
                      <span className="ficha-grid-icon">📊</span>
                      <div>
                        <span className="ficha-grid-label">Grosor</span>
                        <span className="ficha-grid-value">{producto.grueso} {producto.unidadGrueso || 'mm'}</span>
                      </div>
                    </div>
                  )}
                </>
              )}

              {!esProductoTipoRollo() &&
                producto.tipoVenta !== "caja" &&
                producto.tipoVenta !== "paquete" &&
                producto.tipoVenta !== "pieza" &&
                producto.tipoVenta !== "presentacion" &&
                producto.tipoVenta !== "tramo" && (
                <>
                  {(producto.ancho || producto.anchoProducto) && (
                    <div className="ficha-grid-item">
                      <span className="ficha-grid-icon">📏</span>
                      <div>
                        <span className="ficha-grid-label">Ancho</span>
                        <span className="ficha-grid-value">
                          {producto.anchoProducto ? `${producto.anchoProducto} m` : `${producto.ancho} ${producto.unidadAncho || 'cm'}`}
                        </span>
                      </div>
                    </div>
                  )}
                  {producto.alto && (
                    <div className="ficha-grid-item">
                      <span className="ficha-grid-icon">📐</span>
                      <div>
                        <span className="ficha-grid-label">Alto</span>
                        <span className="ficha-grid-value">{producto.alto} {producto.unidadAlto || 'cm'}</span>
                      </div>
                    </div>
                  )}
                  {producto.grueso && (
                    <div className="ficha-grid-item">
                      <span className="ficha-grid-icon">📊</span>
                      <div>
                        <span className="ficha-grid-label">Grosor</span>
                        <span className="ficha-grid-value">{producto.grueso} {producto.unidadGrueso || 'mm'}</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            <div className="ficha-nota">
              <span className="ficha-nota-icon">💡</span>
              <p className="ficha-nota-texto">
                {getTextoExplicativoProducto()}
              </p>
            </div>
          </div>

          {tieneDetallesAdicionales() && (
            <div className="box-modern" style={{ background: '#f0f9ff', border: '1px solid #7dd3fc' }}>
              <h3 className="box-title">📋 Detalles adicionales</h3>
              <div className="detalles-adicionales-grid">
                {producto.variante && <p className="detalle-adicional"><strong>🔖 Variante:</strong> {producto.variante}</p>}
                {producto.uso && <p className="detalle-adicional"><strong>🏠 Uso:</strong> {producto.uso}</p>}
                {producto.aplicacion && <p className="detalle-adicional"><strong>📋 Aplicación:</strong> {producto.aplicacion}</p>}
                {producto.tipo_diseno && <p className="detalle-adicional"><strong>🎨 Diseño:</strong> {producto.tipo_diseno}</p>}
                {producto.material && <p className="detalle-adicional"><strong>🧱 Material:</strong> {producto.material}</p>}
                {producto.acabado && <p className="detalle-adicional"><strong>✨ Acabado:</strong> {producto.acabado}</p>}
                {producto.tipo_instalacion && <p className="detalle-adicional"><strong>🔧 Instalación:</strong> {producto.tipo_instalacion}</p>}
                {producto.espesor_capa_desgaste && <p className="detalle-adicional"><strong>📏 Espesor capa desgaste:</strong> {producto.espesor_capa_desgaste} mm</p>}
              </div>
            </div>
          )}

          <div className="box-modern">
            <h3 className="box-title">📝 Descripción</h3>
            <p className="description">{producto.descripcion}</p>
          </div>

          {producto.especificaciones && (
            <div className="box-modern">
              <h3 className="box-title">⚙️ Especificaciones</h3>
              <p className="description" style={{ whiteSpace: "pre-wrap" }}>{producto.especificaciones}</p>
            </div>
          )}

          {producto.informacionAdicional && (
            <div className="box-modern">
              <h3 className="box-title">📋 Información adicional</h3>
              <p className="description" style={{ whiteSpace: "pre-wrap" }}>{producto.informacionAdicional}</p>
            </div>
          )}

          <div className="botones-acciones">
            {producto.fichaTecnica && (
              <button className="btn-ficha-tecnica" onClick={() => setFichaZoom(true)}>
                📄 Ver ficha técnica
              </button>
            )}
            <button className="btn-agregar-pedido" onClick={() => agregarAlPedido(producto)}>
              🛒 Agregar al pedido
            </button>
          </div>
        </div>
      </div>

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

      {/* ============ SECCIÓN RECOMENDADOS Y RELACIONADOS (REDISEÑADA) ============ */}
      <div className="full-width-related-wrapper">
        {sugeridos.length > 0 && (
          <div className="full-width-related-section">
            <div className="sugeridos-banner">
              <span className="sugeridos-label">PRODUCTOS RECOMENDADOS</span>
              <h2 className="sugeridos-title">Para instalar este producto también necesitarás</h2>
              <p className="sugeridos-subtitle">Estos complementos son utilizados frecuentemente junto con <strong>{producto.nombre}</strong></p>
            </div>

            {Object.keys(sugeridosAgrupados).map((tipo) => (
              <div key={tipo} className="tipo-grupo">
                <div className="tipo-grupo-header" style={{ '--tipo-color': getTipoColor(tipo) }}>
                  <span className="tipo-grupo-icon">🛠️</span>
                  <h3 className="tipo-grupo-title">{tipo}</h3>
                  <span className="tipo-grupo-count">{sugeridosAgrupados[tipo].length} productos</span>
                </div>
                <div className="related-grid">
                  {sugeridosAgrupados[tipo].map((p) => (
                    <div
                      key={p.id}
                      className="producto-card sugerido-card"
                      onClick={() => { navigate(`/producto/${p.id}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      <div className="producto-card-badges">
                        <span className="card-badge recomendado">⭐ Recomendado</span>
                        {(p.oferta === 1 || p.oferta === true) && (
                          <span className="card-badge oferta">🔥 Oferta</span>
                        )}
                        {p.stock <= 3 && p.stock > 0 && (
                          <span className="card-badge stock-bajo">⚡ Últimas</span>
                        )}
                      </div>

                      <button
                        className={`fav-btn-card ${esFavorito(p.id) ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleFavorito(p); }}
                        aria-label="Favorito"
                      >
                        {esFavorito(p.id) ? '❤️' : '🤍'}
                      </button>

                      <div className="producto-card-image-wrapper">
                        <img src={obtenerImagen(p)} alt={p.nombre} className="producto-card-image" loading="lazy" />
                        <div className="producto-card-overlay">
                          <span className="overlay-text">Ver detalles</span>
                        </div>
                      </div>

                      <div className="producto-card-info">
                        <h4 className="producto-card-title">{p.nombre}</h4>
                        <p className="producto-card-sub">Ideal para instalación</p>

                        <div className="producto-card-precio">
                          {p.oferta === 1 || p.oferta === true ? (
                            <>
                              <span className="precio-actual oferta">${p.precioOferta}</span>
                              <span className="precio-tachado">${p.precio}</span>
                            </>
                          ) : (
                            <span className="precio-actual">${p.precio}</span>
                          )}
                        </div>

                        <button className="producto-card-btn" onClick={(e) => { e.stopPropagation(); navigate(`/producto/${p.id}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                          Ver producto →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {relacionados.length > 0 && (
          <div className="full-width-related-section">
            <div className="related-header">
              <div className="related-header-left">
                <span className="related-header-label">PRODUCTOS SIMILARES</span>
                <h2 className="section-title">
                  Más de <span className="highlight">{producto.subcategoria || 'esta categoría'}</span>
                </h2>
              </div>
              <span className="related-count">{relacionados.length} productos</span>
            </div>

            {Object.keys(relacionadosAgrupados).map((tipo) => (
              <div key={tipo} className="tipo-grupo">
                <div className="tipo-grupo-header" style={{ '--tipo-color': getTipoColor(tipo) }}>
                  <span className="tipo-grupo-icon">📦</span>
                  <h3 className="tipo-grupo-title">{tipo}</h3>
                  <span className="tipo-grupo-count">{relacionadosAgrupados[tipo].length} productos</span>
                </div>
                <div className="related-grid">
                  {relacionadosAgrupados[tipo].map((p) => (
                    <div
                      key={p.id}
                      className="producto-card"
                      onClick={() => { navigate(`/producto/${p.id}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    >
                      <div className="producto-card-badges">
                        {(p.oferta === 1 || p.oferta === true) && (
                          <span className="card-badge oferta">🔥 Oferta</span>
                        )}
                        {p.stock <= 3 && p.stock > 0 && (
                          <span className="card-badge stock-bajo">⚡ Últimas</span>
                        )}
                      </div>

                      <button
                        className={`fav-btn-card ${esFavorito(p.id) ? 'active' : ''}`}
                        onClick={(e) => { e.stopPropagation(); toggleFavorito(p); }}
                        aria-label="Favorito"
                      >
                        {esFavorito(p.id) ? '❤️' : '🤍'}
                      </button>

                      <div className="producto-card-image-wrapper">
                        <img src={obtenerImagen(p)} alt={p.nombre} className="producto-card-image" loading="lazy" />
                        <div className="producto-card-overlay">
                          <span className="overlay-text">Ver detalles</span>
                        </div>
                      </div>

                      <div className="producto-card-info">
                        <h4 className="producto-card-title">{p.nombre}</h4>

                        <div className="producto-card-precio">
                          {p.oferta === 1 || p.oferta === true ? (
                            <>
                              <span className="precio-actual oferta">${p.precioOferta}</span>
                              <span className="precio-tachado">${p.precio}</span>
                            </>
                          ) : (
                            <span className="precio-actual">${p.precio}</span>
                          )}
                        </div>

                        <button className="producto-card-btn" onClick={(e) => { e.stopPropagation(); navigate(`/producto/${p.id}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                          Ver producto →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

// ============================================================
// ESTILOS CSS — DISEÑO CORPORATIVO PROFESIONAL
// ============================================================
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    :root {
      --brand-900: #0b1220;
      --brand-800: #0f172a;
      --brand-700: #1e293b;
      --brand-600: #334155;
      --brand-500: #475569;
      --accent: #2563eb;
      --accent-dark: #1d4ed8;
      --accent-light: #dbeafe;
      --success: #16a34a;
      --success-dark: #15803d;
      --danger: #dc2626;
      --warning: #f59e0b;
      --surface: #ffffff;
      --surface-2: #f8fafc;
      --surface-3: #f1f5f9;
      --border: #e5e7eb;
      --border-soft: #eef2f7;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-muted: #94a3b8;
      --radius-sm: 10px;
      --radius-md: 14px;
      --radius-lg: 20px;
      --radius-xl: 28px;
      --shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.06);
      --shadow-md: 0 4px 12px rgba(15, 23, 42, 0.06), 0 2px 6px rgba(15, 23, 42, 0.04);
      --shadow-lg: 0 12px 32px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.05);
      --shadow-xl: 0 24px 56px rgba(15, 23, 42, 0.12), 0 8px 20px rgba(15, 23, 42, 0.06);
    }

    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }

    .producto-detalle-page {
      background: #f5f7fb;
      background-image:
        radial-gradient(circle at 0% 0%, rgba(37, 99, 235, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 100% 0%, rgba(22, 163, 74, 0.04) 0%, transparent 40%);
      min-height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow-x: hidden;
      padding-top: 0px;
      color: var(--text-primary);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    @media (max-width: 767px) {
      .navbar {
        position: sticky !important;
        top: 0 !important;
        z-index: 1000 !important;
        background: #fff !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.06) !important;
      }
      .producto-detalle-page { padding-top: 60px !important; margin-top: 0 !important; }
    }

    .producto-detalle-wrapper {
      display: flex; flex-wrap: wrap; gap: 32px;
      max-width: 1440px; margin: 32px auto 40px; padding: 40px;
      background: var(--surface);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-xl);
      width: 100%; box-sizing: border-box;
      transition: all 0.3s ease;
      border: 1px solid var(--border-soft);
      position: relative;
    }

    .producto-detalle-wrapper::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--accent) 0%, var(--success) 100%);
      border-radius: var(--radius-xl) var(--radius-xl) 0 0;
    }

    .producto-detalle-left-col { flex: 1 1 100%; max-width: 100%; display: flex; flex-direction: column; gap: 24px; }
    .producto-detalle-right-col { flex: 1 1 100%; max-width: 100%; display: flex; flex-direction: column; gap: 18px; }

    @media (min-width: 1024px) {
      .producto-detalle-wrapper { padding: 48px; gap: 56px; margin: 40px auto 52px; }
      .producto-detalle-left-col { flex: 0 0 50%; max-width: 50%; }
      .producto-detalle-right-col { flex: 0 0 45%; max-width: 45%; }
    }

    @media (min-width: 1440px) {
      .producto-detalle-wrapper { max-width: 1640px; padding: 56px 64px; gap: 72px; margin: 48px auto 64px; }
      .producto-detalle-left-col { flex: 0 0 48%; max-width: 48%; }
      .producto-detalle-right-col { flex: 0 0 46%; max-width: 46%; }
    }

    @media (max-width: 767px) {
      .producto-detalle-wrapper { padding: 20px; gap: 24px; margin: 16px 10px 24px; border-radius: 20px; }
      .producto-detalle-left-col, .producto-detalle-right-col { flex: 1 1 100%; max-width: 100%; }
    }

    /* ============ FICHA TÉCNICA ============ */
    .ficha-tecnica-visual-box {
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
      margin: 4px 0;
      box-shadow: var(--shadow-sm);
      position: relative;
    }

    .ficha-tecnica-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--border-soft);
    }

    .ficha-tecnica-icon {
      font-size: 30px;
      background: linear-gradient(135deg, var(--accent-light) 0%, #eff6ff 100%);
      width: 56px;
      height: 56px;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      border: 1px solid #dbeafe;
    }

    .ficha-tecnica-titulo {
      font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
      font-size: 17px;
      font-weight: 800;
      color: var(--brand-900);
      margin: 0;
      line-height: 1.25;
      letter-spacing: -0.3px;
    }

    .ficha-tecnica-subtitulo {
      font-size: 13px;
      color: var(--text-secondary);
      margin: 4px 0 0 0;
      font-weight: 500;
    }

    .ficha-tecnica-subtitulo strong {
      color: var(--accent-dark);
      font-weight: 700;
      background: var(--accent-light);
      padding: 2px 8px;
      border-radius: 6px;
      margin-left: 2px;
    }

    .ficha-tecnica-visual {
      background: #fff;
      border-radius: var(--radius-md);
      padding: 22px 18px;
      margin-bottom: 18px;
      border: 1px solid var(--border-soft);
    }

    .rollo-visual {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }

    .rollo-dimension { display: flex; flex-direction: column; align-items: center; gap: 5px; }

    .rollo-dimension-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: var(--accent-dark);
      background: var(--accent-light);
      padding: 3px 12px;
      border-radius: 999px;
      text-align: center;
    }

    .rollo-dimension-valor {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 22px;
      font-weight: 800;
      color: var(--brand-900);
      letter-spacing: -0.5px;
    }

    .rollo-rect {
      width: 130px;
      height: 95px;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 12px 24px rgba(37, 99, 235, 0.25);
      position: relative;
      overflow: hidden;
    }

    .rollo-rect::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%);
    }

    .rollo-rect-inner {
      background: rgba(255,255,255,0.15);
      border: 1.5px dashed rgba(255,255,255,0.55);
      border-radius: 8px;
      padding: 10px 18px;
      position: relative;
      z-index: 1;
    }

    .rollo-rect-text { color: #fff; font-weight: 800; font-size: 13px; letter-spacing: 1.5px; }

    .rollo-alto, .rollo-largo { min-width: 95px; }

    .ficha-formula {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      flex-wrap: wrap;
      padding: 16px 14px;
      background: var(--surface-2);
      border-radius: var(--radius-md);
      border: 1px solid var(--border-soft);
    }

    .formula-item {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 17px;
      font-weight: 700;
      color: var(--brand-900);
      background: #fff;
      padding: 8px 16px;
      border-radius: 10px;
      border: 1px solid var(--border);
    }

    .formula-signo { font-size: 20px; font-weight: 800; color: var(--text-muted); }

    .formula-resultado {
      background: linear-gradient(135deg, var(--success) 0%, var(--success-dark) 100%) !important;
      color: #fff !important;
      border-color: transparent !important;
      box-shadow: 0 8px 18px rgba(22, 163, 74, 0.25);
    }

    .ficha-formula-desc {
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: var(--text-muted);
      margin: 12px 0 0 0;
      letter-spacing: 0.2px;
    }

    .ficha-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }

    .ficha-grid-item {
      display: flex;
      align-items: center;
      gap: 12px;
      background: #fff;
      padding: 14px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-soft);
      transition: all 0.25s ease;
    }

    .ficha-grid-item:hover {
      border-color: var(--accent-light);
      box-shadow: var(--shadow-sm);
      transform: translateY(-2px);
    }

    .ficha-grid-icon {
      font-size: 22px;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--surface-2);
      border-radius: 10px;
      flex-shrink: 0;
      border: 1px solid var(--border-soft);
    }

    .ficha-grid-label {
      display: block;
      font-size: 10px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.6px;
      margin-bottom: 3px;
    }

    .ficha-grid-value {
      display: block;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: var(--brand-900);
      letter-spacing: -0.2px;
    }

    .ficha-nota {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
      border-left: 3px solid var(--warning);
      border-radius: var(--radius-md);
    }

    .ficha-nota-icon { font-size: 20px; flex-shrink: 0; line-height: 1.4; }

    .ficha-nota-texto {
      margin: 0;
      font-size: 13.5px;
      line-height: 1.65;
      color: #78350f;
    }

    .ficha-nota-texto strong { color: #92400e; font-weight: 800; }

    @media (max-width: 767px) {
      .ficha-tecnica-visual-box { padding: 18px; }
      .ficha-tecnica-icon { width: 48px; height: 48px; font-size: 26px; }
      .ficha-tecnica-titulo { font-size: 15px; }
      .rollo-rect { width: 100px; height: 78px; }
      .rollo-dimension-valor { font-size: 18px; }
      .formula-item { font-size: 15px; padding: 6px 12px; }
      .ficha-grid { grid-template-columns: 1fr; }
      .ficha-grid-value { font-size: 15px; }
    }

    @media (max-width: 400px) {
      .rollo-visual { gap: 8px; }
      .rollo-rect { width: 82px; height: 62px; }
      .formula-item { font-size: 13px; padding: 5px 9px; }
      .formula-signo { font-size: 16px; }
    }

    /* ============ DETALLES ADICIONALES ============ */
    .detalles-adicionales-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px 20px;
      margin-top: 10px;
    }

    .detalle-adicional {
      margin: 0;
      font-size: 14px;
      color: var(--text-primary);
      padding: 6px 0;
    }

    @media (max-width: 767px) {
      .detalles-adicionales-grid { grid-template-columns: 1fr; }
    }

    /* ============ COTIZADOR ============ */
    .cotizador-wrapper { width: 100%; display: block; }

    .cotizador-box {
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid var(--border);
      padding: 28px;
      border-radius: var(--radius-lg);
      width: 100%;
      margin-top: 0;
      box-shadow: var(--shadow-md);
    }

    .cotizador-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--border-soft);
    }

    .cotizador-icon {
      font-size: 26px;
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(37, 99, 235, 0.28);
      flex-shrink: 0;
    }

    .cotizador-title {
      margin: 0;
      font-family: 'Plus Jakarta Sans', sans-serif;
      color: var(--brand-900);
      font-size: 19px;
      font-weight: 800;
      letter-spacing: -0.4px;
    }

    .cotizador-subtitle {
      margin: 4px 0 0 0;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 500;
    }

    @media (max-width: 767px) {
      .cotizador-box { padding: 20px; }
      .cotizador-title { font-size: 17px; }
      .cotizador-icon { width: 46px; height: 46px; font-size: 22px; }
    }

    .selector-modo-entrada {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 22px;
    }

    .selector-modo-entrada label {
      display: flex; align-items: center; justify-content: center;
      gap: 8px; padding: 14px; background: #fff;
      border: 1.5px solid var(--border); border-radius: var(--radius-md);
      cursor: pointer; font-weight: 600; font-size: 14px;
      color: var(--text-primary); transition: all 0.25s ease;
    }

    .selector-modo-entrada label:hover { border-color: var(--accent); background: var(--surface-2); }
    .selector-modo-entrada label.active {
      border-color: var(--accent);
      background: var(--accent-light);
      color: var(--accent-dark);
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    .selector-modo-entrada label input[type="radio"] { accent-color: var(--accent); width: 16px; height: 16px; margin: 0; }

    .area-directa-card { background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border: 1px solid #bbf7d0; }

    @media (max-width: 767px) {
      .selector-modo-entrada { grid-template-columns: 1fr; }
    }

    /* ============ NOTIFICACIÓN ============ */
    .notificacion-flotante {
      position: fixed; top: 90px; right: 24px;
      background: linear-gradient(135deg, var(--brand-900) 0%, var(--brand-800) 100%);
      color: #fff;
      padding: 16px 24px;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-xl);
      z-index: 9999;
      animation: slideInRight 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-weight: 600; font-size: 14px; max-width: 90%;
      border-left: 3px solid var(--success);
    }

    @keyframes slideInRight {
      from { transform: translateX(120px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @media (max-width: 767px) {
      .notificacion-flotante { top: 70px; right: 12px; padding: 14px 18px; font-size: 13px; max-width: 95%; }
    }

    /* ============ LOADING ============ */
    .loading-container { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100vh; gap: 16px; }
    .loading-spinner {
      width: 52px; height: 52px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.9s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ============ BREADCRUMB ============ */
    .breadcrumb { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); flex-wrap: wrap; }
    .breadcrumb span { cursor: pointer; transition: color 0.2s; }
    .breadcrumb span:hover { color: var(--accent); }
    .breadcrumb-actual { color: var(--brand-900); font-weight: 600; cursor: default !important; }
    @media (max-width: 767px) { .breadcrumb { font-size: 12px; } }

    /* ============ GALERÍA ============ */
    .producto-detalle-gallery { position: relative; width: 100%; }
    .badges-container { position: absolute; top: 16px; left: 16px; z-index: 20; display: flex; flex-direction: column; gap: 8px; }

    .badge {
      padding: 7px 14px; border-radius: 8px; font-size: 10px; font-weight: 800;
      color: #fff; letter-spacing: 0.7px; text-transform: uppercase;
      box-shadow: 0 4px 12px rgba(0,0,0,0.18);
    }
    .rebaja { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); }
    .destacado { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
    .ultimas { background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); }

    @media (max-width: 400px) { .badge { font-size: 9px; padding: 5px 10px; } }

    .fav-btn {
      position: absolute; top: 16px; right: 16px; width: 48px; height: 48px;
      border-radius: 50%; border: 1px solid var(--border); font-size: 20px; cursor: pointer;
      z-index: 30; box-shadow: var(--shadow-md);
      transition: all 0.3s ease; background: rgba(255,255,255,0.96);
      backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center;
    }
    .fav-btn:hover { transform: scale(1.08); box-shadow: var(--shadow-lg); border-color: var(--accent-light); }
    @media (max-width: 400px) { .fav-btn { width: 40px; height: 40px; font-size: 17px; } }

    .main-image-container {
      width: 100%; height: 360px; overflow: hidden;
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%);
      position: relative;
      border: 1px solid var(--border-soft);
    }

    .main-image { width: 100%; height: 100%; object-fit: contain; display: block; transition: transform 0.1s ease; }
    .zoom-indicator {
      position: absolute; bottom: 16px; right: 16px;
      background: rgba(15, 23, 42, 0.9); color: #fff;
      padding: 7px 14px; border-radius: 999px;
      font-size: 12px; font-weight: 600; backdrop-filter: blur(8px);
    }

    .thumbs-container { display: flex; gap: 12px; margin-top: 18px; flex-wrap: wrap; }

    .thumb {
      width: 68px; height: 68px; object-fit: cover;
      border-radius: var(--radius-sm); cursor: pointer;
      transition: all 0.25s ease;
      border: 1.5px solid var(--border-soft);
      background: var(--surface-2);
      padding: 3px;
    }
    .thumb:hover { transform: scale(1.06); border-color: var(--text-muted); }
    .thumb.active { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }

    @media (min-width: 1024px) {
      .main-image-container { height: 480px; }
      .thumb { width: 84px; height: 84px; }
    }
    @media (min-width: 1440px) {
      .main-image-container { height: 560px; }
      .thumb { width: 92px; height: 92px; }
    }
    @media (max-width: 767px) {
      .main-image-container { height: 300px; }
      .thumb { width: 56px; height: 56px; }
    }
    @media (max-width: 400px) {
      .main-image-container { height: 240px; }
      .thumb { width: 46px; height: 46px; }
    }

    /* ============ TÍTULOS Y PRECIOS ============ */
    .product-title {
      font-family: 'Plus Jakarta Sans', 'Inter', sans-serif;
      font-size: 28px; font-weight: 800; color: var(--brand-900);
      line-height: 1.18; letter-spacing: -0.8px; margin: 0;
    }
    @media (min-width: 1024px) { .product-title { font-size: 36px; } }
    @media (min-width: 1440px) { .product-title { font-size: 40px; } }
    @media (max-width: 767px) { .product-title { font-size: 22px; } }
    @media (max-width: 400px) { .product-title { font-size: 19px; } }

    .precio-section { margin: 4px 0; }

    .precio-normal, .precio-oferta {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 36px; font-weight: 800; margin: 0;
      display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap;
      letter-spacing: -1px;
    }
    .precio-normal { color: var(--success); }
    .precio-oferta { color: var(--danger); }
    .precio-anterior { text-decoration: line-through; color: var(--text-muted); font-size: 20px; font-weight: 500; display: block; }
    .precio-unidad {
      font-family: 'Inter', sans-serif;
      font-size: 15px; font-weight: 600; color: var(--text-muted);
      letter-spacing: 0;
    }
    .descuento-badge {
      background: linear-gradient(135deg, var(--danger) 0%, #b91c1c 100%);
      color: #fff; padding: 4px 12px; border-radius: 999px;
      font-size: 13px; font-weight: 700; letter-spacing: 0.2px;
      box-shadow: 0 4px 10px rgba(220, 38, 38, 0.25);
    }

    @media (min-width: 1024px) { .precio-normal, .precio-oferta { font-size: 44px; } .precio-unidad { font-size: 17px; } }
    @media (min-width: 1440px) { .precio-normal, .precio-oferta { font-size: 48px; } .precio-unidad { font-size: 18px; } }
    @media (max-width: 767px) { .precio-normal, .precio-oferta { font-size: 30px; } .precio-anterior { font-size: 17px; } .precio-unidad { font-size: 13px; } }
    @media (max-width: 400px) { .precio-normal, .precio-oferta { font-size: 26px; } .precio-unidad { font-size: 12px; } }

    /* ============ CATEGORÍAS ============ */
    .category-box { display: flex; gap: 8px; flex-wrap: wrap; margin: 2px 0; }
    .category-tag {
      background: var(--brand-900); color: #fff;
      padding: 6px 14px; border-radius: 999px;
      font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
      transition: all 0.25s ease;
    }
    .subcategory-tag {
      background: var(--surface-3); color: var(--brand-700);
      padding: 6px 14px; border-radius: 999px;
      font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
      border: 1px solid var(--border-soft);
      transition: all 0.25s ease;
    }
    .type-tag {
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
      color: #fff;
      padding: 6px 14px; border-radius: 999px;
      font-size: 11px; font-weight: 700; letter-spacing: 0.3px;
      box-shadow: 0 4px 10px rgba(37, 99, 235, 0.22);
      transition: all 0.25s ease;
    }
    .category-tag:hover, .subcategory-tag:hover, .type-tag:hover { transform: translateY(-1px); }

    /* ============ SKU ============ */
    .sku-item { font-size: 13px; color: var(--text-muted); margin: -4px 0 0 0; font-weight: 500; }
    .sku-item strong { color: var(--brand-700); font-weight: 700; }

    /* ============ STOCK ============ */
    .stock-box-modern {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 18px; border-radius: var(--radius-md);
      background: var(--surface-2);
      border: 1.5px solid var(--border);
      flex-wrap: wrap; gap: 10px;
      transition: all 0.25s ease;
    }
    .stock-status { display: flex; align-items: center; gap: 10px; }
    .stock-indicator { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
    .stock-indicator.disponible { background: var(--success); box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.14); }
    .stock-indicator.poco { background: var(--warning); box-shadow: 0 0 0 4px rgba(245, 158, 11, 0.14); animation: pulse 1.8s infinite; }
    .stock-indicator.agotado { background: var(--danger); box-shadow: 0 0 0 4px rgba(220, 38, 38, 0.14); }
    .stock-text { font-weight: 700; font-size: 14px; }
    .stock-cantidad {
      font-size: 12px; color: var(--text-secondary);
      background: #fff; padding: 4px 14px;
      border-radius: 999px; border: 1px solid var(--border);
      font-weight: 600;
    }
    @media (max-width: 767px) { .stock-box-modern { flex-direction: column; align-items: flex-start; } }

    /* ============ BOX MODERN ============ */
    .box-modern {
      background: var(--surface-2);
      border: 1px solid var(--border-soft);
      padding: 22px;
      border-radius: var(--radius-md);
      transition: all 0.25s ease;
    }
    .box-modern:hover { border-color: var(--border); box-shadow: var(--shadow-sm); }
    .box-title {
      margin-bottom: 12px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 15px; font-weight: 800;
      color: var(--brand-900);
      letter-spacing: -0.2px;
    }
    .description { color: var(--text-secondary); line-height: 1.75; margin: 0; font-size: 14px; }

    /* ============ BOTONES ============ */
    .botones-acciones { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; width: 100%; margin-top: 6px; }

    .btn-ficha-tecnica {
      background: var(--brand-900); color: #fff; border: none; padding: 16px 20px;
      border-radius: var(--radius-md); cursor: pointer; font-weight: 700; font-size: 14px;
      transition: all 0.25s ease; display: flex; align-items: center; justify-content: center;
      gap: 8px; font-family: inherit;
    }
    .btn-ficha-tecnica:hover { background: var(--brand-800); transform: translateY(-2px); box-shadow: var(--shadow-lg); }

    .btn-agregar-pedido {
      background: linear-gradient(135deg, var(--success) 0%, var(--success-dark) 100%);
      color: #fff; border: none; padding: 16px 20px;
      border-radius: var(--radius-md); cursor: pointer;
      font-weight: 800; font-size: 14px; transition: all 0.25s ease;
      box-shadow: 0 6px 18px rgba(22, 163, 74, 0.28);
      display: flex; align-items: center; justify-content: center; gap: 8px;
      font-family: inherit;
    }
    .btn-agregar-pedido:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(22, 163, 74, 0.4); }

    @media (max-width: 767px) {
      .botones-acciones { grid-template-columns: 1fr; }
      .btn-ficha-tecnica, .btn-agregar-pedido { padding: 14px; }
    }

    /* ============ COTIZADOR DETALLES ============ */
    .guia-medicion { margin-bottom: 22px; background: #fff; border: 1px solid var(--border-soft); border-radius: var(--radius-md); padding: 20px; }
    .guia-titulo {
      text-align: center; margin: 0 0 16px 0;
      color: var(--brand-900); font-size: 15px; font-weight: 800;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .guia-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .guia-card {
      background: var(--surface-2); border-radius: var(--radius-md);
      padding: 14px; text-align: center;
      border: 1px solid var(--border-soft);
      transition: all 0.25s ease; cursor: pointer;
    }
    .guia-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-md); border-color: var(--border); }
    .guia-img { width: 100%; height: 100px; object-fit: contain; margin-bottom: 8px; transition: all 0.3s ease; }
    .guia-img:hover { transform: scale(1.05); }
    .guia-card h4 { font-size: 13px; margin: 8px 0 4px 0; color: var(--brand-900); font-weight: 700; }
    .guia-card p { font-size: 11px; color: var(--text-muted); margin: 0; }
    @media (max-width: 767px) { .guia-grid { grid-template-columns: 1fr; } }

    .selector-modo {
      display: flex; gap: 14px; flex-wrap: wrap;
      margin-bottom: 18px; padding: 14px;
      background: #fff; border-radius: var(--radius-md);
      border: 1px solid var(--border-soft);
    }
    .selector-modo label { font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; cursor: pointer; color: var(--text-primary); }
    .selector-modo input[type="radio"] { accent-color: var(--accent); width: 16px; height: 16px; }
    @media (max-width: 767px) { .selector-modo { padding: 12px; flex-direction: column; } .selector-modo label { font-size: 13px; } }

    .resumen-area {
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border: 1px solid #bbf7d0;
      color: var(--success-dark);
      padding: 12px; border-radius: var(--radius-sm);
      text-align: center; font-weight: 700; font-size: 14px; width: 100%;
    }
    @media (max-width: 767px) { .resumen-area { font-size: 13px; padding: 10px; } }

    .medidas-container { margin-bottom: 18px; }
    .medida-card {
      background: #fff; border: 1px solid var(--border-soft);
      border-radius: var(--radius-md); padding: 18px;
      margin-bottom: 14px; transition: all 0.25s ease;
    }
    .medida-card:hover { box-shadow: var(--shadow-sm); border-color: var(--border); }
    .medida-card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .medida-card h4 {
      font-size: 14px; margin: 0; color: var(--brand-900);
      font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif;
    }
    .medida-badge {
      background: linear-gradient(135deg, var(--success) 0%, var(--success-dark) 100%);
      color: #fff; padding: 4px 12px; border-radius: 999px;
      font-size: 11px; font-weight: 700;
      box-shadow: 0 3px 8px rgba(22, 163, 74, 0.22);
      letter-spacing: 0.2px;
    }

    .medidas-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
    .input-group { display: flex; flex-direction: column; gap: 6px; }
    .input-mini-label {
      font-size: 10px; font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.6px;
    }
    .input-area-auto {
      background: linear-gradient(135deg, #f0fdf4 0%, #f7fee7 100%);
      border-color: #bbf7d0;
      font-weight: 700;
      color: var(--success-dark);
    }

    @media (max-width: 767px) { .medidas-grid-3 { grid-template-columns: 1fr; } }

    .input-field {
      width: 100%; padding: 12px 14px;
      border-radius: var(--radius-sm);
      border: 1.5px solid var(--border);
      box-sizing: border-box; font-size: 14px;
      transition: all 0.2s ease; background: #fff;
      font-family: inherit; color: var(--text-primary);
    }
    .input-field:hover { border-color: #cbd5e1; }
    .input-field:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); outline: none; }
    .input-field::placeholder { color: var(--text-muted); }

    .resultado-medida { font-weight: 700; color: var(--success); margin: 10px 0 0 0; font-size: 13px; }
    .radio-label { display: block; margin-bottom: 10px; font-weight: 600; font-size: 13px; color: var(--text-primary); }
    .radio-label input { margin-right: 8px; accent-color: var(--accent); }

    .botones-medidas { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn-agregar {
      background: var(--accent); color: #fff;
      border: none; padding: 12px 16px;
      border-radius: var(--radius-sm); cursor: pointer;
      font-weight: 700; font-size: 13px; flex: 1;
      transition: all 0.25s ease; font-family: inherit;
    }
    .btn-agregar:hover { background: var(--accent-dark); box-shadow: 0 6px 16px rgba(37, 99, 235, 0.28); }
    .btn-limpiar {
      background: var(--surface-3); color: var(--brand-700);
      border: 1px solid var(--border);
      padding: 12px 16px; border-radius: var(--radius-sm);
      cursor: pointer; font-weight: 700; font-size: 13px;
      flex: 1; transition: all 0.25s ease; font-family: inherit;
    }
    .btn-limpiar:hover { background: #e2e8f0; }
    .btn-eliminar {
      background: transparent; color: var(--danger);
      border: 1px solid #fecaca;
      padding: 9px 14px; border-radius: var(--radius-sm);
      cursor: pointer; font-weight: 700; font-size: 12px;
      margin-top: 12px; width: 100%; transition: all 0.25s ease;
      font-family: inherit;
    }
    .btn-eliminar:hover { background: #fef2f2; border-color: var(--danger); }

    .desperdicio-box { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; align-items: center; }
    .desperdicio-label { font-weight: 800; color: var(--brand-900); font-size: 14px; margin-right: 4px; }
    .des-btn {
      border: 1.5px solid var(--border);
      padding: 9px 16px; border-radius: var(--radius-sm);
      cursor: pointer; font-weight: 700; font-size: 13px;
      background: #fff; color: var(--text-primary);
      transition: all 0.2s ease; min-width: 54px;
      font-family: inherit;
    }
    .des-btn:hover { border-color: var(--brand-900); }
    .des-btn.active {
      background: var(--brand-900); color: #fff;
      border-color: var(--brand-900);
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.22);
    }

    @media (max-width: 767px) { .desperdicio-box { gap: 5px; } .des-btn { padding: 7px 11px; font-size: 12px; min-width: 46px; } }

    /* ============ RESULTADO COTIZACIÓN ============ */
    .resultado-cotizacion {
      background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      border-radius: var(--radius-md);
      padding: 22px;
      border: 1px solid var(--border);
      margin-top: 8px;
      box-shadow: var(--shadow-sm);
    }
    .resultado-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; margin-bottom: 18px; }
    .resultado-item {
      display: flex; flex-direction: column;
      padding: 12px 14px;
      background: #fff;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-soft);
    }
    .resultado-item.destacado {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-color: #bfdbfe;
      grid-column: 1 / -1;
    }
    .resultado-label {
      font-size: 10px; font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .resultado-valor {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 17px; font-weight: 800;
      color: var(--brand-900); letter-spacing: -0.3px;
    }
    .resultado-valor.principal { font-size: 22px; color: var(--accent-dark); }
    .total-box {
      display: flex; justify-content: space-between; align-items: center;
      padding: 18px 22px;
      background: var(--brand-900);
      border-radius: var(--radius-md);
      margin-bottom: 18px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
    }
    .total-label {
      font-size: 14px; font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .total-valor {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 28px; font-weight: 800;
      color: #fff;
      letter-spacing: -1px;
    }
    .detalle-calculo {
      background: var(--surface-2);
      padding: 16px 18px;
      border-radius: var(--radius-sm);
      border-left: 3px solid var(--warning);
      margin-bottom: 16px;
    }
    .detalle-titulo {
      font-weight: 800; color: var(--brand-900);
      margin: 0 0 8px 0; font-size: 13px;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .detalle-calculo p { margin: 5px 0; font-size: 13.5px; color: var(--text-secondary); line-height: 1.55; }
    .detalle-calculo p strong { color: var(--brand-900); font-weight: 700; }
    .necesitas-box {
      display: flex; justify-content: space-between; align-items: center;
      padding: 16px 22px;
      background: linear-gradient(135deg, var(--brand-900) 0%, var(--brand-800) 100%);
      border-radius: var(--radius-md);
      margin-bottom: 18px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.15);
    }
    .necesitas-label {
      font-size: 13px; font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.8px;
    }
    .necesitas-valor {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 20px; font-weight: 800;
      color: #facc15;
      letter-spacing: -0.4px;
    }

    @media (max-width: 767px) {
      .resultado-grid { grid-template-columns: 1fr; gap: 8px; }
      .resultado-item.destacado { grid-column: 1; }
      .total-valor { font-size: 22px; }
      .necesitas-valor { font-size: 16px; }
    }

    /* ============ FORM CLIENTE ============ */
    .form-cliente {
      margin-top: 8px; background: #fff;
      padding: 20px; border-radius: var(--radius-md);
      border: 1px solid var(--border-soft);
      display: flex; flex-direction: column; gap: 10px;
    }
    .form-cliente h3 {
      margin: 0 0 6px 0; font-size: 15px;
      color: var(--brand-900); font-weight: 800;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .btn-enviar {
      margin-top: 6px;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
      color: #fff; border: none; padding: 15px;
      border-radius: var(--radius-md); cursor: pointer;
      font-weight: 800; font-size: 15px; width: 100%;
      transition: all 0.25s ease;
      box-shadow: 0 6px 18px rgba(37, 99, 235, 0.28);
      font-family: inherit;
    }
    .btn-enviar:hover { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(37, 99, 235, 0.4); }
    .btn-enviar:disabled { opacity: 0.6; cursor: not-allowed; transform: none; box-shadow: none; }
    .mensaje-exito { margin-top: 10px; color: var(--success); font-weight: 700; text-align: center; animation: fadeIn 0.4s ease; font-size: 14px; }

    /* ============ CARRUSEL DE MODELOS — PREMIUM ============ */
    .modelos-carrusel {
      background:
        radial-gradient(circle at 0% 0%, rgba(37, 99, 235, 0.06) 0%, transparent 50%),
        radial-gradient(circle at 100% 100%, rgba(22, 163, 74, 0.05) 0%, transparent 50%),
        linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
      box-shadow: var(--shadow-md);
      width: 100%;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
    }

    .modelos-carrusel::before {
      content: '';
      position: absolute;
      top: -2px; left: 0; right: 0;
      height: 2px;
      background: linear-gradient(90deg, transparent, var(--accent), var(--success), transparent);
      opacity: 0.6;
    }

    .modelos-carrusel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .modelos-carrusel-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 17px;
      font-weight: 800;
      color: var(--brand-900);
      margin: 0;
      display: flex;
      align-items: center;
      gap: 10px;
      letter-spacing: -0.3px;
    }

    .title-icon {
      font-size: 20px;
      display: inline-block;
      animation: sparkle 2.4s ease-in-out infinite;
    }

    @keyframes sparkle {
      0%, 100% { transform: scale(1) rotate(0deg); filter: brightness(1); }
      50% { transform: scale(1.18) rotate(8deg); filter: brightness(1.4); }
    }

    .title-text {
      background: linear-gradient(135deg, var(--brand-900) 0%, var(--accent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .title-badge {
      font-size: 9px;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
      color: #fff;
      padding: 4px 11px;
      border-radius: 999px;
      font-weight: 800;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      box-shadow: 0 3px 10px rgba(37, 99, 235, 0.28);
      animation: badgeBounce 2.4s ease-in-out infinite;
    }

    @keyframes badgeBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-3px); }
    }

    .carrusel-controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .carrusel-btn {
      background: #fff;
      border: 1.5px solid var(--border);
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 13px;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      color: var(--brand-900);
      font-weight: 800;
      position: relative;
      overflow: hidden;
    }

    .carrusel-btn::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
      opacity: 0;
      transition: opacity 0.3s ease;
      border-radius: 50%;
    }

    .carrusel-btn:hover {
      transform: scale(1.14);
      border-color: transparent;
      color: #fff;
      box-shadow: 0 8px 22px rgba(37, 99, 235, 0.32);
    }

    .carrusel-btn:hover::before { opacity: 1; }
    .carrusel-btn span, .carrusel-btn { position: relative; z-index: 1; }

    .carrusel-indicador {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-secondary);
      min-width: 56px;
      text-align: center;
      background: #fff;
      border: 1px solid var(--border-soft);
      padding: 6px 12px;
      border-radius: 999px;
      letter-spacing: 0.3px;
    }

    .carrusel-indicador strong {
      color: var(--accent);
      font-weight: 800;
    }

    .modelos-carrusel-container {
      overflow: hidden;
      position: relative;
      width: 100%;
    }

    .modelos-carrusel-scroll {
      scroll-behavior: smooth;
      overflow-x: auto;
      display: flex;
      gap: 20px;
      padding: 12px 6px 18px 6px;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scroll-snap-type: x mandatory;
    }

    .modelos-carrusel-scroll::-webkit-scrollbar { height: 6px; }
    .modelos-carrusel-scroll::-webkit-scrollbar-track {
      background: var(--surface-3);
      border-radius: 10px;
      margin: 0 8px;
    }
    .modelos-carrusel-scroll::-webkit-scrollbar-thumb {
      background: linear-gradient(90deg, var(--accent), var(--accent-dark));
      border-radius: 10px;
    }

    .modelo-carrusel-item {
      min-width: 220px;
      max-width: 260px;
      flex-shrink: 0;
      scroll-snap-align: center;
      background: #fff;
      border-radius: 20px;
      padding: 18px 16px 16px 16px;
      cursor: pointer;
      transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
      border: 2px solid var(--border-soft);
      text-align: center;
      position: relative;
      overflow: hidden;
      will-change: transform;
    }

    .modelo-carrusel-item::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.04) 0%, rgba(22, 163, 74, 0.04) 100%);
      opacity: 0;
      transition: opacity 0.4s ease;
      border-radius: 18px;
      pointer-events: none;
    }

    .modelo-carrusel-item:hover {
      transform: translateY(-10px) scale(1.04);
      box-shadow:
        0 24px 48px rgba(15, 23, 42, 0.14),
        0 8px 16px rgba(37, 99, 235, 0.08);
      border-color: var(--accent);
    }

    .modelo-carrusel-item:hover::before { opacity: 1; }

    .modelo-carrusel-item.active {
      border-color: var(--accent);
      background: linear-gradient(180deg, #ffffff 0%, #f0f7ff 100%);
      box-shadow:
        0 0 0 4px rgba(37, 99, 235, 0.14),
        0 20px 44px rgba(37, 99, 235, 0.18);
      transform: translateY(-6px) scale(1.03);
      animation: activePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes activePop {
      0% { transform: translateY(-6px) scale(1.03); }
      40% { transform: translateY(-6px) scale(1.08); }
      100% { transform: translateY(-6px) scale(1.03); }
    }

    .modelo-carrusel-item.is-current:not(.active) {
      animation: currentPulse 2s ease-in-out infinite;
    }

    @keyframes currentPulse {
      0%, 100% { box-shadow: 0 4px 16px rgba(37, 99, 235, 0.08); }
      50% { box-shadow: 0 8px 28px rgba(37, 99, 235, 0.2); }
    }

    .modelo-selected-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      background: linear-gradient(135deg, var(--success) 0%, var(--success-dark) 100%);
      color: #fff;
      font-size: 9px;
      font-weight: 800;
      padding: 5px 11px;
      border-radius: 999px;
      z-index: 3;
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.35);
      display: flex;
      align-items: center;
      gap: 4px;
      letter-spacing: 0.3px;
      text-transform: uppercase;
      animation: badgeSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    @keyframes badgeSlideIn {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }

    .check-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 13px;
      height: 13px;
      background: rgba(255,255,255,0.25);
      border-radius: 50%;
      font-size: 8px;
      font-weight: 900;
    }

    .modelo-oferta-badge {
      position: absolute;
      top: 12px;
      right: 12px;
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: #fff;
      font-size: 9px;
      font-weight: 800;
      padding: 5px 11px;
      border-radius: 999px;
      z-index: 3;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
      letter-spacing: 0.3px;
      animation: ofertaPulse 1.8s ease-in-out infinite;
    }

    @keyframes ofertaPulse {
      0%, 100% { transform: scale(1); box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35); }
      50% { transform: scale(1.06); box-shadow: 0 6px 20px rgba(220, 38, 38, 0.55); }
    }

    .modelo-img-wrapper {
      position: relative;
      border-radius: 14px;
      overflow: hidden;
      background: linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%);
      margin-bottom: 12px;
      padding: 8px;
      transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .modelo-img-glow {
      position: absolute;
      inset: 0;
      background: radial-gradient(circle at center, rgba(37, 99, 235, 0.18) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.4s ease;
      pointer-events: none;
    }

    .modelo-carrusel-item:hover .modelo-img-glow { opacity: 1; }
    .modelo-carrusel-item:hover .modelo-img-wrapper { transform: scale(1.03); }

    .modelo-carrusel-img {
      width: 100%;
      height: 160px;
      object-fit: contain;
      border-radius: 10px;
      transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      z-index: 1;
    }

    .modelo-carrusel-item:hover .modelo-carrusel-img {
      transform: scale(1.12) rotate(-2deg);
    }

    .modelo-carrusel-info { margin-top: 4px; }

    .modelo-carrusel-nombre {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: var(--brand-900);
      margin: 0;
      line-height: 1.3;
      height: 36px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      letter-spacing: -0.2px;
    }

    .modelo-precio-row {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .modelo-carrusel-precio {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 20px;
      font-weight: 800;
      color: var(--success);
      margin: 0;
      letter-spacing: -0.5px;
    }

    .modelo-precio-ant {
      font-size: 12px;
      color: var(--text-muted);
      text-decoration: line-through;
      font-weight: 600;
    }

    .stock-badge {
      font-size: 10px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: #fff;
      padding: 4px 10px;
      border-radius: 999px;
      display: inline-block;
      margin-top: 8px;
      font-weight: 700;
      letter-spacing: 0.2px;
      box-shadow: 0 3px 8px rgba(245, 158, 11, 0.28);
      animation: stockGlow 2s ease-in-out infinite;
    }

    @keyframes stockGlow {
      0%, 100% { box-shadow: 0 3px 8px rgba(245, 158, 11, 0.28); }
      50% { box-shadow: 0 4px 14px rgba(245, 158, 11, 0.5); }
    }

    .carrusel-progress {
      display: flex;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
    }

    .carrusel-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #cbd5e1;
      transition: all 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;
    }

    .carrusel-dot:hover { transform: scale(1.3); background: var(--text-muted); }

    .carrusel-dot.active {
      width: 36px;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
      box-shadow: 0 0 16px rgba(37, 99, 235, 0.5);
    }

    .btn-ver-todos {
      width: 100%;
      margin-top: 16px;
      background: linear-gradient(135deg, var(--brand-900) 0%, var(--brand-800) 100%);
      color: #fff;
      border: none;
      padding: 14px 18px;
      border-radius: var(--radius-md);
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-family: inherit;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      position: relative;
      overflow: hidden;
    }

    .btn-ver-todos::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
      transition: left 0.6s ease;
    }

    .btn-ver-todos:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(15, 23, 42, 0.28);
      background: linear-gradient(135deg, var(--brand-800) 0%, var(--brand-700) 100%);
    }

    .btn-ver-todos:hover::before { left: 100%; }

    .btn-count-badge {
      background: rgba(255,255,255,0.15);
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      padding: 3px 10px;
      border-radius: 999px;
      margin-left: 4px;
      border: 1px solid rgba(255,255,255,0.2);
    }

    @media (max-width: 767px) {
      .modelos-carrusel { padding: 18px; }
      .modelos-carrusel-title { font-size: 15px; }
      .title-icon { font-size: 17px; }
      .carrusel-btn { width: 34px; height: 34px; font-size: 11px; }
      .carrusel-indicador { font-size: 12px; min-width: 48px; padding: 5px 10px; }
      .modelo-carrusel-item { min-width: 180px; max-width: 210px; padding: 14px 12px; }
      .modelo-carrusel-img { height: 130px; }
      .modelo-carrusel-nombre { font-size: 12.5px; height: 32px; }
      .modelo-carrusel-precio { font-size: 17px; }
      .modelo-precio-ant { font-size: 11px; }
    }

    @media (max-width: 400px) {
      .modelo-carrusel-item { min-width: 160px; max-width: 190px; }
      .modelo-carrusel-img { height: 115px; }
      .modelo-carrusel-nombre { font-size: 12px; }
    }

    /* =========================================================
       SECCIÓN RECOMENDADOS Y RELACIONADOS - REDISEÑO PREMIUM
       ========================================================= */
    .full-width-related-wrapper {
      width: 100%;
      max-width: 100vw;
      overflow-x: hidden;
      padding: 0 24px;
      box-sizing: border-box;
      margin: 0 auto;
    }

    .full-width-related-section {
      max-width: 1440px;
      margin: 56px auto 0 auto;
      padding: 0 4px;
      box-sizing: border-box;
      width: 100%;
    }

    .related-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 24px;
      width: 100%;
    }

    /* --- Header de sección relacionada --- */
    .related-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 28px;
      padding: 0 2px;
      flex-wrap: wrap;
      gap: 14px;
    }

    .related-header-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .related-header-label {
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1.5px;
      color: var(--accent);
      text-transform: uppercase;
      display: inline-block;
      padding: 4px 10px;
      background: var(--accent-light);
      border-radius: 999px;
      width: fit-content;
    }

    .section-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: var(--brand-900);
      margin: 0;
      letter-spacing: -0.6px;
      line-height: 1.2;
    }

    .highlight {
      background: linear-gradient(135deg, var(--accent) 0%, var(--success) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .related-count {
      font-size: 12px;
      font-weight: 700;
      color: var(--brand-700);
      background: var(--surface-3);
      padding: 8px 16px;
      border-radius: 999px;
      letter-spacing: 0.2px;
      border: 1px solid var(--border-soft);
    }

    /* --- Banner de sugeridos --- */
    .sugeridos-banner {
      background:
        radial-gradient(circle at 100% 0%, rgba(37, 99, 235, 0.35) 0%, transparent 55%),
        radial-gradient(circle at 0% 100%, rgba(22, 163, 74, 0.25) 0%, transparent 55%),
        linear-gradient(135deg, var(--brand-900) 0%, var(--brand-700) 100%);
      padding: 32px 36px;
      border-radius: var(--radius-xl);
      margin-bottom: 36px;
      width: 100%;
      box-sizing: border-box;
      position: relative;
      overflow: hidden;
      box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
      border: 1px solid rgba(255,255,255,0.05);
    }

    .sugeridos-banner::before {
      content: '';
      position: absolute;
      top: -50%;
      right: -10%;
      width: 500px;
      height: 500px;
      background: radial-gradient(circle, rgba(37, 99, 235, 0.2) 0%, transparent 70%);
      pointer-events: none;
    }

    .sugeridos-banner::after {
      content: '';
      position: absolute;
      bottom: -60%;
      left: -5%;
      width: 400px;
      height: 400px;
      background: radial-gradient(circle, rgba(22, 163, 74, 0.15) 0%, transparent 70%);
      pointer-events: none;
    }

    .sugeridos-label {
      display: inline-block;
      background: rgba(255,255,255,0.12);
      color: #fff;
      font-weight: 800;
      font-size: 10px;
      letter-spacing: 2px;
      padding: 6px 16px;
      border-radius: 999px;
      text-transform: uppercase;
      margin-bottom: 14px;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.15);
      position: relative;
      z-index: 1;
    }

    .sugeridos-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 26px;
      font-weight: 800;
      color: #fff;
      margin: 8px 0 10px 0;
      line-height: 1.25;
      letter-spacing: -0.5px;
      position: relative;
      z-index: 1;
    }

    .sugeridos-subtitle {
      font-size: 15px;
      color: #cbd5e1;
      margin: 0;
      position: relative;
      z-index: 1;
      max-width: 720px;
      line-height: 1.55;
    }

    .sugeridos-subtitle strong {
      color: #fff;
      font-weight: 700;
    }

    /* --- Grupos por tipo --- */
    .tipo-grupo {
      margin-bottom: 40px;
    }

    .tipo-grupo:last-child {
      margin-bottom: 0;
    }

    .tipo-grupo-header {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 22px;
      background: #fff;
      border-radius: var(--radius-md);
      border-left: 4px solid var(--tipo-color, var(--accent));
      border-top: 1px solid var(--border-soft);
      border-right: 1px solid var(--border-soft);
      border-bottom: 1px solid var(--border-soft);
      margin-bottom: 20px;
      box-shadow: var(--shadow-sm);
      transition: all 0.25s ease;
    }

    .tipo-grupo-header:hover {
      box-shadow: var(--shadow-md);
      transform: translateX(4px);
    }

    .tipo-grupo-icon {
      font-size: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: var(--surface-2);
      border: 1px solid var(--border-soft);
    }

    .tipo-grupo-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 16px;
      font-weight: 800;
      color: var(--brand-900);
      margin: 0;
      flex: 1;
      letter-spacing: -0.2px;
    }

    .tipo-grupo-count {
      font-size: 11px;
      font-weight: 700;
      color: var(--brand-700);
      background: var(--surface-3);
      padding: 5px 14px;
      border-radius: 999px;
      border: 1px solid var(--border-soft);
      letter-spacing: 0.2px;
    }

    /* --- Tarjeta de producto (relacionado y sugerido) --- */
    .producto-card {
      position: relative;
      background: #fff;
      border-radius: var(--radius-lg);
      padding: 0;
      cursor: pointer;
      border: 1px solid var(--border-soft);
      transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: var(--shadow-sm);
    }

    .producto-card:hover {
      transform: translateY(-8px);
      box-shadow:
        0 24px 48px rgba(15, 23, 42, 0.12),
        0 8px 16px rgba(37, 99, 235, 0.06);
      border-color: var(--accent-light);
    }

    .sugerido-card {
      border-top: 3px solid var(--accent);
    }

    .producto-card-badges {
      position: absolute;
      top: 12px;
      left: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      z-index: 3;
      pointer-events: none;
    }

    .card-badge {
      font-size: 9px;
      font-weight: 800;
      padding: 5px 10px;
      border-radius: 999px;
      color: #fff;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      box-shadow: 0 3px 10px rgba(0,0,0,0.15);
      width: fit-content;
    }

    .card-badge.recomendado {
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
    }

    .card-badge.oferta {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.35);
      animation: ofertaPulse 1.8s ease-in-out infinite;
    }

    .card-badge.stock-bajo {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.35);
    }

    .fav-btn-card {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 1px solid var(--border-soft);
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 16px;
      z-index: 4;
      transition: all 0.25s ease;
      box-shadow: 0 3px 10px rgba(15, 23, 42, 0.08);
    }

    .fav-btn-card:hover {
      transform: scale(1.12);
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.15);
      border-color: var(--accent-light);
    }

    .fav-btn-card.active {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      border-color: transparent;
    }

    .producto-card-image-wrapper {
      position: relative;
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, #fafbfc 0%, #f1f5f9 100%);
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 14px;
    }

    .producto-card-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
      position: relative;
      z-index: 1;
    }

    .producto-card:hover .producto-card-image {
      transform: scale(1.1);
    }

    .producto-card-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(180deg, transparent 40%, rgba(15, 23, 42, 0.75) 100%);
      opacity: 0;
      transition: opacity 0.35s ease;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding-bottom: 18px;
      z-index: 2;
    }

    .producto-card:hover .producto-card-overlay {
      opacity: 1;
    }

    .overlay-text {
      color: #fff;
      font-weight: 700;
      font-size: 12px;
      letter-spacing: 0.5px;
      padding: 6px 16px;
      background: rgba(37, 99, 235, 0.9);
      border-radius: 999px;
      backdrop-filter: blur(6px);
      transform: translateY(10px);
      transition: transform 0.35s ease;
    }

    .producto-card:hover .overlay-text {
      transform: translateY(0);
    }

    .producto-card-info {
      padding: 16px 16px 18px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }

    .producto-card-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: var(--brand-900);
      margin: 0;
      line-height: 1.35;
      min-height: 38px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      letter-spacing: -0.2px;
    }

    .producto-card-sub {
      font-size: 11px;
      color: var(--text-muted);
      margin: 0;
      font-weight: 500;
      letter-spacing: 0.2px;
    }

    .producto-card-precio {
      display: flex;
      align-items: baseline;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 4px;
    }

    .precio-actual {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 20px;
      font-weight: 800;
      color: var(--success);
      letter-spacing: -0.5px;
    }

    .precio-actual.oferta {
      color: var(--danger);
    }

    .precio-tachado {
      font-size: 12px;
      color: var(--text-muted);
      text-decoration: line-through;
      font-weight: 600;
    }

    .producto-card-btn {
      margin-top: 8px;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
      color: #fff;
      border: none;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      font-weight: 700;
      font-size: 12.5px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-family: inherit;
      letter-spacing: 0.2px;
      opacity: 0.95;
    }

    .producto-card-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);
      opacity: 1;
    }

    /* --- Responsive --- */
    @media (min-width: 1024px) {
      .related-grid {
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 26px;
      }
      .producto-card-image-wrapper {
        height: 220px;
      }
      .full-width-related-wrapper {
        padding: 0 48px;
      }
    }

    @media (min-width: 1440px) {
      .related-grid {
        grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
        gap: 28px;
      }
      .producto-card-image-wrapper {
        height: 240px;
      }
    }

    @media (max-width: 767px) {
      .full-width-related-wrapper {
        padding: 0 14px;
      }
      .full-width-related-section {
        padding: 0 2px;
        margin-top: 40px;
      }
      .related-grid {
        grid-template-columns: repeat(auto-fill, minmax(155px, 1fr));
        gap: 14px;
      }
      .producto-card-image-wrapper {
        height: 150px;
        padding: 10px;
      }
      .producto-card-info {
        padding: 12px 12px 14px 12px;
        gap: 6px;
      }
      .producto-card-title {
        font-size: 12.5px;
        min-height: 34px;
      }
      .producto-card-sub {
        font-size: 10px;
      }
      .precio-actual {
        font-size: 16px;
      }
      .precio-tachado {
        font-size: 10px;
      }
      .producto-card-btn {
        font-size: 11px;
        padding: 8px 10px;
      }
      .fav-btn-card {
        width: 32px;
        height: 32px;
        font-size: 14px;
      }
      .card-badge {
        font-size: 8px;
        padding: 4px 8px;
      }
      .section-title {
        font-size: 20px;
      }
      .related-header-label {
        font-size: 10px;
        padding: 3px 8px;
      }
      .related-count {
        font-size: 11px;
        padding: 6px 12px;
      }
      .sugeridos-banner {
        padding: 22px 22px;
        border-radius: var(--radius-lg);
      }
      .sugeridos-title {
        font-size: 19px;
      }
      .sugeridos-subtitle {
        font-size: 13px;
      }
      .tipo-grupo-header {
        padding: 12px 16px;
        gap: 10px;
      }
      .tipo-grupo-icon {
        width: 34px;
        height: 34px;
        font-size: 16px;
      }
      .tipo-grupo-title {
        font-size: 14px;
      }
      .tipo-grupo-count {
        font-size: 10px;
        padding: 4px 10px;
      }
    }

    @media (max-width: 400px) {
      .related-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
      }
      .producto-card-image-wrapper {
        height: 130px;
      }
      .producto-card-title {
        font-size: 11.5px;
      }
      .precio-actual {
        font-size: 15px;
      }
      .producto-card-btn {
        font-size: 10.5px;
        padding: 7px 8px;
      }
      .fav-btn-card {
        width: 28px;
        height: 28px;
        font-size: 12px;
        top: 8px;
        right: 8px;
      }
      .card-badge {
        font-size: 7px;
        padding: 3px 7px;
      }
    }

    /* ============ MODALES ============ */
    .modal-overlay {
      position: fixed; top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: rgba(11, 18, 32, 0.92);
      display: flex; justify-content: center; align-items: center;
      z-index: 9999; cursor: zoom-out;
      animation: fadeIn 0.25s ease;
      padding: 20px; box-sizing: border-box;
      backdrop-filter: blur(6px);
    }
    .modal-image {
      max-width: 90%; max-height: 90%;
      border-radius: var(--radius-md);
      box-shadow: 0 24px 60px rgba(0,0,0,0.6);
      animation: zoomIn 0.25s ease;
      object-fit: contain;
    }
    @keyframes zoomIn { from { transform: scale(0.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
  `;
  document.head.appendChild(styleSheet);
  
}