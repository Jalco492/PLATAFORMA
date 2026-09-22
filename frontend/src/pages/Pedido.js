// src/components/Pedido.js
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { 
  FaTimes, 
  FaWhatsapp, 
  FaEnvelope, 
  FaStore, 
  FaShoppingCart,
  FaPlus,
  FaMinus,
  FaTrash,
  FaCheck,
  FaArrowLeft,
  FaArrowRight,
  FaBox,
  FaCubes,
  FaRuler,
  FaLayerGroup,
  FaPalette,
  FaThLarge,
  FaEdit,
  FaSave,
  FaCalendarAlt,
  FaClock,
  FaInfoCircle,
  FaPhoneAlt,
  FaCopy
} from "react-icons/fa";
import api from "../services/api";
import Navbar from "./Navbar";
import Footer from "./Footer";

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

// 🔥 FUNCIÓN PARA OBTENER EL TIPO DE VENTA EN ESPAÑOL
const obtenerTipoVenta = (tipoVenta) => {
  const tipos = {
    'caja': 'Caja',
    'pieza': 'Pieza',
    'paquete': 'Paquete',
    'metro_cuadrado': 'Metro Cuadrado',
    'metro_lineal': 'Metro Lineal',
    'presentacion': 'Presentación',
    'unidad': 'Unidad',
    'tramo': 'Tramo',
    'rollo': 'Rollo',
    'otros': 'Otros'
  };
  return tipos[tipoVenta] || tipoVenta || 'No definido';
};

// 🔥 FUNCIÓN PARA OBTENER EL ICONO DEL TIPO DE VENTA
const obtenerIconoTipo = (tipoVenta) => {
  const iconos = {
    'caja': <FaBox size={12} />,
    'pieza': <FaCubes size={12} />,
    'paquete': <FaBox size={12} />,
    'metro_cuadrado': <FaRuler size={12} />,
    'metro_lineal': <FaRuler size={12} />,
    'presentacion': <FaPalette size={12} />,
    'tramo': <FaRuler size={12} />,
    'rollo': <FaLayerGroup size={12} />,
    'unidad': <FaPalette size={12} />,
    'otros': <FaThLarge size={12} />
  };
  return iconos[tipoVenta] || <FaBox size={12} />;
};

// 🔥 FUNCIÓN PARA SABER SI EL PRODUCTO SE VENDE POR METROS
const esVentaPorMetros = (tipoVenta) => {
  return tipoVenta === 'tramo' || tipoVenta === 'rollo' || tipoVenta === 'metro_lineal' || tipoVenta === 'metro_cuadrado';
};

// 🔥 FUNCIÓN PARA OBTENER LA UNIDAD DE MEDIDA (para el backend)
const obtenerUnidadMedida = (tipoVenta) => {
  if (tipoVenta === 'metro_cuadrado') return 'm²';
  if (tipoVenta === 'metro_lineal') return 'ml';
  if (tipoVenta === 'tramo' || tipoVenta === 'rollo') return 'metros';
  if (tipoVenta === 'caja') return 'cajas';
  if (tipoVenta === 'paquete') return 'paquetes';
  if (tipoVenta === 'pieza') return 'piezas';
  return 'unidades';
};

// 🔥 FUNCIÓN PARA OBTENER LA UNIDAD A MOSTRAR (abreviada)
const obtenerUnidadMostrar = (tipoVenta) => {
  if (tipoVenta === 'metro_cuadrado') return 'm²';
  if (tipoVenta === 'metro_lineal') return 'ml';
  if (tipoVenta === 'tramo') return 'tramos';
  if (tipoVenta === 'rollo') return 'm';
  if (tipoVenta === 'caja') return 'cajas';
  if (tipoVenta === 'paquete') return 'paquetes';
  if (tipoVenta === 'pieza') return 'pz';
  if (tipoVenta === 'presentacion') return 'uds';
  return 'uds';
};

// 🔥 FUNCIÓN PARA OBTENER LA UNIDAD SINGULAR (para textos)
const obtenerUnidadSingular = (tipoVenta) => {
  if (tipoVenta === 'metro_cuadrado') return 'm²';
  if (tipoVenta === 'metro_lineal') return 'ml';
  if (tipoVenta === 'tramo') return 'tramo';
  if (tipoVenta === 'rollo') return 'm';
  if (tipoVenta === 'caja') return 'caja';
  if (tipoVenta === 'paquete') return 'paquete';
  if (tipoVenta === 'pieza') return 'pieza';
  if (tipoVenta === 'presentacion') return 'presentación';
  return 'unidad';
};

// 🔥 FUNCIÓN PARA OBTENER EL PASO (incremento)
const obtenerPaso = (tipoVenta) => {
  if (tipoVenta === 'metro_cuadrado' || tipoVenta === 'metro_lineal' || tipoVenta === 'tramo' || tipoVenta === 'rollo') {
    return 0.5;
  }
  return 1;
};

// 🔥 FUNCIÓN PARA CALCULAR SUBTOTAL DE FORMA SEGURA
const calcularSubtotal = (item) => {
  if (item.subtotal !== undefined && item.subtotal !== null && !isNaN(Number(item.subtotal))) {
    return Number(item.subtotal);
  }
  const precio = Number(item.precio) || 0;
  const cantidad = Number(item.cantidad) || 0;
  return precio * cantidad;
};

// 🔥 FUNCIÓN PARA OBTENER INFO EXTRA DEL PRODUCTO
const obtenerInfoExtra = (item) => {
  const info = [];
  const t = item.tipoVenta;

  if ((t === 'caja' || t === 'paquete') && item.piezasCaja) {
    info.push({
      icono: '📦',
      texto: `${item.piezasCaja} pz por ${t}`
    });
  }

  if ((t === 'metro_cuadrado' || t === 'metro_lineal') && item.anchoProducto > 0) {
    info.push({
      icono: '📏',
      texto: `Ancho: ${item.anchoProducto} m`
    });
  }

  if (item.cobertura && Number(item.cobertura) > 0) {
    info.push({
      icono: '📊',
      texto: `${Number(item.cobertura).toFixed(2)} m²`
    });
  }

  if (t === 'presentacion' && item.presentacion) {
    info.push({
      icono: '🏷️',
      texto: item.presentacion
    });
  }

  if (item.grueso && (t === 'pieza' || t === 'caja' || t === 'paquete')) {
    info.push({
      icono: '📐',
      texto: `${item.grueso}${item.unidadGrueso || 'mm'}`
    });
  }

  return info;
};

// 🔥 FUNCIÓN PARA OBTENER LOS DÍAS DISPONIBLES DE ENTREGA (Lunes a Sábado)
const obtenerDiasEntrega = () => {
  const dias = [];
  const hoy = new Date();
  const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  for (let i = 1; i <= 30; i++) {
    const fecha = new Date(hoy);
    fecha.setDate(hoy.getDate() + i);
    const diaSemana = fecha.getDay();
    
    if (diaSemana >= 1 && diaSemana <= 6) {
      const año = fecha.getFullYear();
      const mes = String(fecha.getMonth() + 1).padStart(2, '0');
      const dia = String(fecha.getDate()).padStart(2, '0');
      const fechaISO = `${año}-${mes}-${dia}`;
      
      dias.push({
        valor: fechaISO,
        etiqueta: `${nombresDias[diaSemana]} ${dia}/${mes}/${año}`,
        diaSemana: diaSemana,
        esSabado: diaSemana === 6
      });
    }
  }
  
  return dias;
};

// 🔥 FUNCIÓN PARA OBTENER LAS HORAS DISPONIBLES SEGÚN EL DÍA
const obtenerHorasEntrega = (esSabado) => {
  const horas = [];
  
  if (esSabado) {
    for (let h = 12; h <= 17; h++) {
      const horaFormateada = h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
      horas.push({
        valor: `${String(h).padStart(2, '0')}:00`,
        etiqueta: horaFormateada
      });
    }
  } else {
    for (let h = 12; h <= 18; h++) {
      const horaFormateada = h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
      horas.push({
        valor: `${String(h).padStart(2, '0')}:00`,
        etiqueta: horaFormateada
      });
    }
  }
  
  return horas;
};

export default function Pedido() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🔥 REF PARA SCROLL AL MENSAJE DE ÉXITO
  const mensajeExitoRef = useRef(null);
  
  const [mostrarMensaje, setMostrarMensaje] = useState(false);
  
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [carrito, setCarrito] = useState([]);
  
  const [cliente, setCliente] = useState(() => {
    const clienteGuardado = sessionStorage.getItem("clientePedido");
    if (clienteGuardado) {
      try {
        return JSON.parse(clienteGuardado);
      } catch (e) {
        console.error("Error al cargar cliente:", e);
      }
    }
    return {
      nombre: "",
      email: "",
      celular: "",
      comentarios: "",
      diaEntrega: "",
      horaEntrega: ""
    };
  });
  
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [folioCopiado, setFolioCopiado] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos");
    return guardados ? JSON.parse(guardados) : [];
  });

  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [tipos, setTipos] = useState([]);

  const [editandoCantidad, setEditandoCantidad] = useState(null);
  const [cantidadInput, setCantidadInput] = useState("");

  const [diasDisponibles, setDiasDisponibles] = useState([]);
  const [horasDisponibles, setHorasDisponibles] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  const productoAgregadoRef = useRef(false);
  const ultimoProductoAgregadoRef = useRef(null);

  useEffect(() => {
    const dias = obtenerDiasEntrega();
    setDiasDisponibles(dias);
  }, []);

  useEffect(() => {
    if (cliente.diaEntrega) {
      const diaInfo = diasDisponibles.find(d => d.valor === cliente.diaEntrega);
      if (diaInfo) {
        setDiaSeleccionado(diaInfo);
        const horas = obtenerHorasEntrega(diaInfo.esSabado);
        setHorasDisponibles(horas);
        
        if (cliente.horaEntrega && !horas.find(h => h.valor === cliente.horaEntrega)) {
          setCliente(prev => ({ ...prev, horaEntrega: "" }));
        }
      }
    } else {
      setDiaSeleccionado(null);
      setHorasDisponibles([]);
    }
  }, [cliente.diaEntrega, diasDisponibles]);

  // 🔥 SCROLL AUTOMÁTICO AL MENSAJE DE ÉXITO
  useEffect(() => {
    if (!mensajeExito) return;

    let intentos = 0;
    const maxIntentos = 15;
    let cancelado = false;

    const intentarScroll = () => {
      if (cancelado) return;
      
      if (mensajeExitoRef.current) {
        try {
          window.scrollTo({ top: 0, behavior: 'instant' });
          mensajeExitoRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        } catch (e) {
          console.error("Error en scroll:", e);
        }
      } else if (intentos < maxIntentos) {
        intentos++;
        setTimeout(intentarScroll, 50);
      }
    };

    const timer = setTimeout(intentarScroll, 50);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [mensajeExito]);

  // 🔥 CARGA INICIAL: PRODUCTOS + CARRITO SINCRONIZADO CON STOCK REAL
  useEffect(() => {
    const inicializar = async () => {
      try {
        // 1. Cargar productos frescos del backend
        const res = await api.get("/productos");
        const productosFrescos = res.data || [];
        setProductosDisponibles(productosFrescos);

        // 2. Cargar carrito guardado y sincronizar stock con datos frescos
        const carritoGuardado = sessionStorage.getItem("carritoPedido");
        if (carritoGuardado) {
          try {
            const parsed = JSON.parse(carritoGuardado);
            if (Array.isArray(parsed) && parsed.length > 0) {
              let huboAjustes = false;

              const carritoLimpio = parsed.map(item => {
                // 🔥 Buscar el stock REAL en productos frescos
                const productoFresco = productosFrescos.find(p => p.id === item.id);
                const stockReal = productoFresco ? Number(productoFresco.stock) || 0 : 0;
                
                // 🔥 Ajustar cantidad si excede el stock
                let cantidadAjustada = Number(item.cantidad) || 1;
                if (cantidadAjustada > stockReal) {
                  cantidadAjustada = stockReal > 0 ? stockReal : 0;
                  huboAjustes = true;
                }

                return {
                  ...item,
                  precio: Number(item.precio) || 0,
                  cantidad: cantidadAjustada,
                  stock: stockReal,
                  subtotal: (Number(item.precio) || 0) * cantidadAjustada
                };
              }).filter(item => item.cantidad > 0); // 🔥 Quitar productos sin stock

              if (huboAjustes) {
                setMensajeError("⚠️ Algunos productos fueron ajustados porque su stock cambió.");
              }

              setCarrito(carritoLimpio);
              sessionStorage.setItem("carritoPedido", JSON.stringify(carritoLimpio));
              setMostrarMensaje(false);
            } else {
              setMostrarMensaje(true);
            }
          } catch (e) {
            console.error("Error al cargar carrito:", e);
            setMostrarMensaje(true);
          }
        } else {
          setMostrarMensaje(true);
        }
      } catch (error) {
        console.error("Error cargando productos:", error);
        setProductosDisponibles([]);
        setMostrarMensaje(true);
      }
    };

    inicializar();
  }, []);

  useEffect(() => {
    const cargarDatosNavegacion = async () => {
      try {
        const [catRes, subRes, tipoRes] = await Promise.all([
          api.get("/categorias"),
          api.get("/subcategorias"),
          api.get("/tipos"),
        ]);
        setCategorias(catRes.data || []);
        setSubcategorias(subRes.data || []);
        setTipos(tipoRes.data || []);
      } catch (error) {
        console.error("Error cargando datos de navegación:", error);
      }
    };
    cargarDatosNavegacion();
  }, []);

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  useEffect(() => {
    if (carrito.length > 0 || sessionStorage.getItem("carritoPedido")) {
      sessionStorage.setItem("carritoPedido", JSON.stringify(carrito));
    }
    if (!mensajeExito) {
      setMostrarMensaje(carrito.length === 0);
    }
  }, [carrito, mensajeExito]);

  useEffect(() => {
    sessionStorage.setItem("clientePedido", JSON.stringify(cliente));
  }, [cliente]);

  useEffect(() => {
    if (!location.state?.productoAgregado) return;
    
    const { producto, cantidad } = location.state.productoAgregado;
    const productoId = producto.id;
    const timestamp = Date.now();
    const identificador = `${productoId}-${timestamp}`;
    
    if (ultimoProductoAgregadoRef.current === identificador) return;
    if (productoAgregadoRef.current) return;
    
    productoAgregadoRef.current = true;
    ultimoProductoAgregadoRef.current = identificador;
    
    // 🔥 Buscar stock real en productosDisponibles
    const productoFresco = productosDisponibles.find(p => p.id === producto.id);
    const stockReal = productoFresco 
      ? Number(productoFresco.stock) || 0 
      : Number(producto.stock) || 0;

    const productoCompleto = {
      id: producto.id,
      nombre: producto.nombre,
      sku: producto.sku || 'N/A',
      precio: Number(producto.precio) || 0,
      imagen: obtenerImagenProducto(producto),
      tipoVenta: producto.tipoVenta || 'unidad',
      presentacion: producto.presentacion || 'Unidad',
      cobertura: producto.cobertura || 0,
      categoria: producto.categoria || '',
      subcategoria: producto.subcategoria || '',
      ancho: producto.ancho || 0,
      alto: producto.alto || 0,
      anchoProducto: producto.anchoProducto || 0,
      metrosPorRollo: producto.metrosPorRollo || 0,
      piezasCaja: producto.piezasCaja || 0,
      grueso: producto.grueso || 0,
      unidadGrueso: producto.unidadGrueso || 'mm',
      unidadAncho: producto.unidadAncho || 'cm',
      unidadAlto: producto.unidadAlto || 'cm',
      metrosCuadrados: producto.metrosCuadrados || 0,
      stock: stockReal,
      unidadMedida: obtenerUnidadMedida(producto.tipoVenta)
    };
    
    agregarProductoAlCarrito(productoCompleto, cantidad || 1);
    
    setTimeout(() => {
      const cleanState = { ...location.state };
      delete cleanState.productoAgregado;
      window.history.replaceState(cleanState, document.title);
      productoAgregadoRef.current = false;
    }, 200);
    
  }, [location.state, productosDisponibles]);

  const toggleFavorito = (producto) => {
    const existe = favoritos.find((fav) => fav.id === producto.id);
    if (existe) {
      setFavoritos(favoritos.filter((f) => f.id !== producto.id));
    } else {
      setFavoritos([...favoritos, producto]);
    }
  };

  const esFavorito = (id) => favoritos.some((f) => f.id === id);

  // 🔥 AGREGAR PRODUCTO AL CARRITO CON VALIDACIÓN DE STOCK
  const agregarProductoAlCarrito = (producto, cantidad = 1) => {
    setMensajeError("");
    
    setCarrito(prevCarrito => {
      const existe = prevCarrito.find(item => item.id === producto.id);
      
      // 🔥 Buscar stock real en productosDisponibles
      const productoFresco = productosDisponibles.find(p => p.id === producto.id);
      const stockDisponible = productoFresco 
        ? Number(productoFresco.stock) || 0 
        : Number(producto.stock) || 0;
      
      const unidad = obtenerUnidadMostrar(producto.tipoVenta);
      
      let nuevoCarrito;
      if (existe) {
        const nuevaCantidad = Number(existe.cantidad) + Number(cantidad);
        
        if (nuevaCantidad > stockDisponible) {
          setMensajeError(`⚠️ Solo hay ${stockDisponible} ${unidad} disponibles de "${producto.nombre}". Ya tienes ${existe.cantidad} en el carrito.`);
          return prevCarrito;
        }
        
        nuevoCarrito = prevCarrito.map(item => 
          item.id === producto.id 
            ? { 
                ...item, 
                cantidad: nuevaCantidad, 
                stock: stockDisponible,
                subtotal: Number(item.precio) * nuevaCantidad 
              }
            : item
        );
      } else {
        if (Number(cantidad) > stockDisponible) {
          setMensajeError(`⚠️ Solo hay ${stockDisponible} ${unidad} disponibles de "${producto.nombre}"`);
          return prevCarrito;
        }
        
        const nuevoProducto = {
          id: producto.id,
          nombre: producto.nombre || 'Producto',
          sku: producto.sku || 'N/A',
          precio: Number(producto.precio) || 0,
          imagen: producto.imagen || obtenerImagenProducto(producto),
          tipoVenta: producto.tipoVenta || 'unidad',
          presentacion: producto.presentacion || 'Unidad',
          cobertura: producto.cobertura || 0,
          categoria: producto.categoria || '',
          subcategoria: producto.subcategoria || '',
          ancho: producto.ancho || 0,
          alto: producto.alto || 0,
          anchoProducto: producto.anchoProducto || 0,
          metrosPorRollo: producto.metrosPorRollo || 0,
          piezasCaja: producto.piezasCaja || 0,
          grueso: producto.grueso || 0,
          unidadGrueso: producto.unidadGrueso || 'mm',
          unidadAncho: producto.unidadAncho || 'cm',
          unidadAlto: producto.unidadAlto || 'cm',
          metrosCuadrados: producto.metrosCuadrados || 0,
          stock: stockDisponible,
          cantidad: Number(cantidad),
          subtotal: Number(producto.precio) * Number(cantidad)
        };
        nuevoCarrito = [...prevCarrito, nuevoProducto];
      }
      
      sessionStorage.setItem("carritoPedido", JSON.stringify(nuevoCarrito));
      return nuevoCarrito;
    });
  };

  const eliminarDelCarrito = (id) => {
    setCarrito(prevCarrito => {
      const nuevoCarrito = prevCarrito.filter(item => item.id !== id);
      sessionStorage.setItem("carritoPedido", JSON.stringify(nuevoCarrito));
      return nuevoCarrito;
    });
  };

  // 🔥 ACTUALIZAR CANTIDAD CON VALIDACIÓN DE STOCK
  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad < 0.1) return;
    
    const item = carrito.find(i => i.id === id);
    if (!item) return;
    
    // 🔥 Buscar stock real en productosDisponibles (por si cambió)
    const productoFresco = productosDisponibles.find(p => p.id === id);
    const stockDisponible = productoFresco 
      ? Number(productoFresco.stock) || 0 
      : Number(item.stock) || 0;
    
    const unidad = obtenerUnidadMostrar(item.tipoVenta);
    
    if (nuevaCantidad > stockDisponible) {
      setMensajeError(`⚠️ Solo hay ${stockDisponible} ${unidad} disponibles de "${item.nombre}"`);
      return;
    }
    
    setMensajeError("");
    
    setCarrito(prevCarrito => {
      const nuevoCarrito = prevCarrito.map(item => 
        item.id === id 
          ? { 
              ...item, 
              cantidad: nuevaCantidad, 
              stock: stockDisponible,
              subtotal: (Number(item.precio) || 0) * nuevaCantidad 
            }
          : item
      );
      sessionStorage.setItem("carritoPedido", JSON.stringify(nuevoCarrito));
      return nuevoCarrito;
    });
  };

  const iniciarEdicionCantidad = (item) => {
    setEditandoCantidad(item.id);
    setCantidadInput(String(item.cantidad));
  };

  // 🔥 GUARDAR EDICIÓN CON VALIDACIÓN DE STOCK
  const guardarEdicionCantidad = (id) => {
    const valor = parseFloat(cantidadInput);
    if (isNaN(valor) || valor <= 0) {
      setMensajeError("Por favor ingresa una cantidad válida");
      return;
    }
    
    const item = carrito.find(i => i.id === id);
    if (!item) return;
    
    const productoFresco = productosDisponibles.find(p => p.id === id);
    const stockDisponible = productoFresco 
      ? Number(productoFresco.stock) || 0 
      : Number(item.stock) || 0;
    
    const unidad = obtenerUnidadMostrar(item.tipoVenta);
    
    if (valor > stockDisponible) {
      setMensajeError(`⚠️ Solo hay ${stockDisponible} ${unidad} disponibles de "${item.nombre}"`);
      return;
    }
    
    actualizarCantidad(id, valor);
    setEditandoCantidad(null);
    setCantidadInput("");
    setMensajeError("");
  };

  const cancelarEdicionCantidad = () => {
    setEditandoCantidad(null);
    setCantidadInput("");
  };

  // 🔥 INCREMENTAR CON VALIDACIÓN DE STOCK
  const incrementarCantidad = (id, paso = 1) => {
    const item = carrito.find(i => i.id === id);
    if (!item) return;
    const nuevaCantidad = Number(item.cantidad) + paso;
    
    const productoFresco = productosDisponibles.find(p => p.id === id);
    const stockDisponible = productoFresco 
      ? Number(productoFresco.stock) || 0 
      : Number(item.stock) || 0;
    
    const unidad = obtenerUnidadMostrar(item.tipoVenta);
    
    if (nuevaCantidad > stockDisponible) {
      setMensajeError(`⚠️ Solo hay ${stockDisponible} ${unidad} disponibles de "${item.nombre}"`);
      return;
    }
    
    setMensajeError("");
    actualizarCantidad(id, nuevaCantidad);
  };

  const decrementarCantidad = (id, paso = 1) => {
    const item = carrito.find(i => i.id === id);
    if (!item) return;
    if (Number(item.cantidad) <= paso) {
      if (window.confirm(`¿Eliminar "${item.nombre}" del carrito?`)) {
        eliminarDelCarrito(id);
      }
      return;
    }
    const nuevaCantidad = Number(item.cantidad) - paso;
    actualizarCantidad(id, nuevaCantidad);
  };

  const totalCarrito = carrito.reduce((sum, item) => {
    const subtotal = calcularSubtotal(item);
    return sum + subtotal;
  }, 0);

  // 🔥 REFRESCAR STOCK ANTES DE ENVIAR EL PEDIDO
  const refrescarStockCarrito = async () => {
    try {
      const res = await api.get("/productos");
      const productosFrescos = res.data || [];
      setProductosDisponibles(productosFrescos);

      let huboCambios = false;

      const carritoActualizado = carrito.map(item => {
        const fresco = productosFrescos.find(p => p.id === item.id);
        if (!fresco) {
          huboCambios = true;
          return { ...item, stock: 0, cantidad: 0 };
        }
        const stockReal = Number(fresco.stock) || 0;
        const cantidadReal = Math.min(Number(item.cantidad) || 0, stockReal);
        
        if (cantidadReal !== Number(item.cantidad) || stockReal !== Number(item.stock)) {
          huboCambios = true;
        }
        
        return {
          ...item,
          stock: stockReal,
          cantidad: cantidadReal,
          subtotal: (Number(item.precio) || 0) * cantidadReal
        };
      }).filter(item => item.cantidad > 0);

      if (huboCambios) {
        setCarrito(carritoActualizado);
        sessionStorage.setItem("carritoPedido", JSON.stringify(carritoActualizado));
      }

      return carritoActualizado;
    } catch (e) {
      console.error("Error refrescando stock:", e);
      return carrito;
    }
  };

  // 🔥 VALIDAR FORMULARIO CON VALIDACIÓN DE STOCK
  const validarFormulario = (carritoAValidar = carrito) => {
    if (!cliente.nombre.trim()) {
      setMensajeError("Por favor ingresa tu nombre");
      return false;
    }
    if (!cliente.email.trim() || !cliente.email.includes("@")) {
      setMensajeError("Por favor ingresa un correo electrónico válido");
      return false;
    }
    if (!cliente.celular.trim() || cliente.celular.length < 10) {
      setMensajeError("Por favor ingresa un número de celular válido (10 dígitos)");
      return false;
    }
    if (!cliente.diaEntrega) {
      setMensajeError("Por favor selecciona el día de entrega");
      return false;
    }
    if (!cliente.horaEntrega) {
      setMensajeError("Por favor selecciona la hora de entrega");
      return false;
    }
    if (carritoAValidar.length === 0) {
      setMensajeError("Agrega al menos un producto al pedido");
      return false;
    }
    
    for (const item of carritoAValidar) {
      const stockDisponible = Number(item.stock) || 0;
      const unidad = obtenerUnidadMostrar(item.tipoVenta);
      if (Number(item.cantidad) > stockDisponible) {
        setMensajeError(`⚠️ "${item.nombre}" solo tiene ${stockDisponible} ${unidad} disponibles. Ajusta la cantidad.`);
        return false;
      }
    }
    
    return true;
  };

  const formatearFechaEntrega = (fechaISO) => {
    if (!fechaISO) return '';
    const [año, mes, dia] = fechaISO.split('-');
    const fecha = new Date(año, mes - 1, dia);
    const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return `${nombresDias[fecha.getDay()]} ${dia}/${mes}/${año}`;
  };

  const formatearHoraEntrega = (hora24) => {
    if (!hora24) return '';
    const [h, m] = hora24.split(':');
    const hora = parseInt(h);
    const ampm = hora >= 12 ? 'PM' : 'AM';
    const hora12 = hora > 12 ? hora - 12 : (hora === 0 ? 12 : hora);
    return `${hora12}:${m} ${ampm}`;
  };

  const copiarFolio = async () => {
    try {
      await navigator.clipboard.writeText(numeroPedido);
      setFolioCopiado(true);
      setTimeout(() => setFolioCopiado(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  // 🔥 ENVIAR PEDIDO
  const enviarPedido = async () => {
    setCargando(true);
    setMensajeError("");
    setMensajeExito("");
    setNumeroPedido("");

    // 🔥 REFRESCAR STOCK ANTES DE VALIDAR
    const carritoFresco = await refrescarStockCarrito();

    if (carritoFresco.length === 0) {
      setMensajeError("❌ Los productos de tu carrito ya no tienen stock disponible.");
      setCargando(false);
      return;
    }

    // 🔥 Validar con el carrito actualizado
    if (!validarFormulario(carritoFresco)) {
      setCargando(false);
      return;
    }

    const diaInfo = diasDisponibles.find(d => d.valor === cliente.diaEntrega);
    const fechaEntregaFormateada = diaInfo ? diaInfo.etiqueta : formatearFechaEntrega(cliente.diaEntrega);
    const horaEntregaFormateada = formatearHoraEntrega(cliente.horaEntrega);

    const totalFresco = carritoFresco.reduce((sum, item) => sum + calcularSubtotal(item), 0);

    const pedidoData = {
      cliente: {
        nombre: cliente.nombre,
        email: cliente.email,
        celular: cliente.celular,
        comentarios: cliente.comentarios || "",
        diaEntrega: cliente.diaEntrega,
        horaEntrega: cliente.horaEntrega,
        fechaEntregaFormateada: fechaEntregaFormateada,
        horaEntregaFormateada: horaEntregaFormateada
      },
      productos: carritoFresco.map(item => ({
        id: item.id,
        nombre: item.nombre || 'Producto',
        sku: item.sku || 'N/A',
        cantidad: Number(item.cantidad) || 1,
        precio: Number(item.precio) || 0,
        subtotal: calcularSubtotal(item),
        imagen: item.imagen || obtenerImagenProducto(item),
        tipoVenta: item.tipoVenta || 'unidad',
        tipoVentaLabel: obtenerTipoVenta(item.tipoVenta),
        presentacion: item.presentacion || 'Unidad',
        cobertura: item.cobertura || 0,
        categoria: item.categoria || '',
        subcategoria: item.subcategoria || '',
        unidadMedida: obtenerUnidadMedida(item.tipoVenta),
        unidadMostrar: obtenerUnidadMostrar(item.tipoVenta),
        unidadSingular: obtenerUnidadSingular(item.tipoVenta),
        anchoProducto: item.anchoProducto || 0,
        metrosPorRollo: item.metrosPorRollo || 0,
        piezasCaja: item.piezasCaja || 0,
        metrosCuadrados: item.metrosCuadrados || 0,
        stock: item.stock || 0
      })),
      total: Number(totalFresco.toFixed(2))
    };

    try {
      const res = await api.post("/pedidos", pedidoData);
      
      if (res.status === 201) {
        window.scrollTo({ top: 0, behavior: 'instant' });

        setMensajeExito(`✅ ¡Pedido #${res.data.numero_pedido} creado exitosamente!`);
        setNumeroPedido(res.data.numero_pedido);
        
        setCarrito([]);
        setCliente({ 
          nombre: "", 
          email: "", 
          celular: "", 
          comentarios: "",
          diaEntrega: "",
          horaEntrega: ""
        });
        sessionStorage.removeItem("carritoPedido");
        sessionStorage.removeItem("clientePedido");
        
        setMostrarMensaje(false);
      }
    } catch (error) {
      console.error("Error al guardar pedido:", error);
      
      if (error.response?.data?.error === "Stock insuficiente" && error.response?.data?.detalles) {
        const detalles = error.response.data.detalles;
        setMensajeError(`❌ ${detalles.join(" | ")}`);
        
        try {
          const res = await api.get("/productos");
          const productosFrescos = res.data || [];
          setProductosDisponibles(productosFrescos);
          
          setCarrito(prevCarrito => 
            prevCarrito.map(item => {
              const productoActualizado = productosFrescos.find(p => p.id === item.id);
              if (productoActualizado) {
                const stockReal = Number(productoActualizado.stock) || 0;
                const cantidadAjustada = Math.min(Number(item.cantidad) || 0, stockReal);
                return {
                  ...item,
                  stock: stockReal,
                  cantidad: cantidadAjustada,
                  subtotal: (Number(item.precio) || 0) * cantidadAjustada
                };
              }
              return item;
            }).filter(item => item.cantidad > 0)
          );
        } catch (e) {
          console.error("Error recargando productos:", e);
        }
      } else {
        setMensajeError("❌ Error al crear el pedido. Por favor intenta de nuevo.");
      }
    } finally {
      setCargando(false);
    }
  };

  const irAProductos = () => {
    productoAgregadoRef.current = false;
    ultimoProductoAgregadoRef.current = null;
    navigate("/productos", { 
      state: { 
        desdePedido: true,
        cliente: cliente
      } 
    });
  };

  const aceptarMensaje = () => {
    setMostrarMensaje(false);
  };

  // =====================================================
  // 🔥 VISTA 2: MENSAJE DE ÉXITO CON FOLIO (PRIORIDAD MÁXIMA)
  // =====================================================
  if (mensajeExito) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: darkMode ? '#0a0a2a' : '#f8fafc',
        color: darkMode ? '#fff' : '#111827',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 0,
        margin: 0,
        boxSizing: 'border-box'
      }}>
        <style>{`
          @keyframes pulseGlow {
            0% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.3); }
            50% { box-shadow: 0 0 60px rgba(34, 197, 94, 0.5); }
            100% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.3); }
          }
          @keyframes folioPulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.03); }
            100% { transform: scale(1); }
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-40px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes checkmark {
            0% { transform: scale(0) rotate(-180deg); }
            60% { transform: scale(1.2) rotate(10deg); }
            100% { transform: scale(1) rotate(0deg); }
          }
        `}</style>

        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          productos={productosDisponibles}
          favoritos={favoritos}
          toggleFavorito={toggleFavorito}
          esFavorito={esFavorito}
          categorias={categorias}
          subcategorias={subcategorias}
          tipos={tipos}
        />

        <div 
          ref={mensajeExitoRef}
          style={{
            width: '100%',
            maxWidth: '750px',
            padding: '20px',
            paddingTop: '110px',
            paddingBottom: '40px',
            boxSizing: 'border-box'
          }}>
          <div style={{
            background: darkMode 
              ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(16, 185, 129, 0.08))' 
              : 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            border: darkMode ? '3px solid rgba(34, 197, 94, 0.4)' : '3px solid #86efac',
            borderRadius: '28px',
            padding: '45px 35px',
            textAlign: 'center',
            animation: 'slideDown 0.6s ease-out, pulseGlow 3s ease-in-out infinite',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: darkMode 
              ? '0 25px 80px rgba(0, 0, 0, 0.9), 0 0 60px rgba(34, 197, 94, 0.15)'
              : '0 25px 80px rgba(0, 0, 0, 0.1), 0 0 60px rgba(34, 197, 94, 0.1)'
          }}>
            
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #22c55e, #10b981, #34d399, #6ee7b7)'
            }} />

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              marginBottom: '28px',
              boxShadow: '0 12px 45px rgba(34, 197, 94, 0.5)',
              animation: 'checkmark 0.8s ease-out'
            }}>
              <FaCheck size={48} color="#fff" />
            </div>

            <div style={{ 
              fontSize: '30px', 
              fontWeight: '900', 
              color: darkMode ? '#86efac' : '#166534',
              marginBottom: '10px',
              letterSpacing: '-0.5px',
              lineHeight: '1.2'
            }}>
              ¡Pedido Creado Exitosamente!
            </div>

            <div style={{
              color: darkMode ? '#a7f3d0' : '#15803d',
              fontSize: '16px',
              marginBottom: '35px',
              fontWeight: '500'
            }}>
              Tu pedido ha sido registrado correctamente
            </div>

            <div style={{
              background: darkMode 
                ? 'linear-gradient(135deg, #1e293b, #0f172a)' 
                : 'linear-gradient(135deg, #ffffff, #f8fafc)',
              borderRadius: '24px',
              padding: '32px 28px',
              marginBottom: '28px',
              border: darkMode ? '3px dashed #fbbf24' : '3px dashed #f59e0b',
              boxShadow: darkMode 
                ? '0 8px 30px rgba(251, 191, 36, 0.15)' 
                : '0 8px 30px rgba(251, 191, 36, 0.25)',
              position: 'relative'
            }}>
              <div style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: '#fff',
                padding: '8px 22px',
                borderRadius: '22px',
                fontSize: '13px',
                fontWeight: '800',
                letterSpacing: '1.5px',
                marginBottom: '20px',
                textTransform: 'uppercase',
                boxShadow: '0 4px 15px rgba(251, 191, 36, 0.4)'
              }}>
                📋 Tu Folio de Pedido
              </div>

              <div style={{
                fontSize: '42px',
                fontWeight: '900',
                color: '#fbbf24',
                letterSpacing: '2px',
                marginBottom: '16px',
                fontFamily: "'Courier New', monospace",
                textShadow: darkMode ? '0 0 25px rgba(251, 191, 36, 0.6)' : '0 3px 6px rgba(251, 191, 36, 0.4)',
                animation: 'folioPulse 2s ease-in-out infinite',
                wordBreak: 'break-all',
                lineHeight: '1.1'
              }}>
                {numeroPedido}
              </div>

              <button
                onClick={copiarFolio}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: folioCopiado 
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : darkMode 
                      ? 'rgba(251, 191, 36, 0.15)' 
                      : '#fffbeb',
                  color: folioCopiado 
                    ? '#fff' 
                    : darkMode 
                      ? '#fcd34d' 
                      : '#92400e',
                  border: folioCopiado 
                    ? 'none' 
                    : darkMode 
                      ? '2px solid rgba(251, 191, 36, 0.4)' 
                      : '2px solid #fde68a',
                  padding: '10px 22px',
                  borderRadius: '22px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: folioCopiado ? '0 4px 15px rgba(34, 197, 94, 0.4)' : 'none'
                }}
              >
                {folioCopiado ? (
                  <><FaCheck size={13} /> ¡Copiado!</>
                ) : (
                  <><FaCopy size={13} /> Copiar folio</>
                )}
              </button>
            </div>

            <div style={{
              background: darkMode ? 'rgba(251, 191, 36, 0.12)' : '#fffbeb',
              border: darkMode ? '2px solid rgba(251, 191, 36, 0.35)' : '2px solid #fde68a',
              borderRadius: '18px',
              padding: '20px 24px',
              marginBottom: '28px',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '14px'
            }}>
              <div style={{ fontSize: '32px', flexShrink: 0, lineHeight: '1' }}>⚠️</div>
              <div>
                <div style={{
                  color: darkMode ? '#fcd34d' : '#92400e',
                  fontSize: '17px',
                  fontWeight: '900',
                  marginBottom: '8px',
                  letterSpacing: '0.3px'
                }}>
                  ¡IMPORTANTE!
                </div>
                <div style={{
                  color: darkMode ? '#fcd34d' : '#92400e',
                  fontSize: '15px',
                  lineHeight: '1.7',
                  fontWeight: '500'
                }}>
                  Anota tu número de pedido. Será <strong>necesario</strong> para la entrega en tienda física.
                </div>
              </div>
            </div>

            <button
              onClick={() => navigate("/")}
              style={{
                padding: '16px 55px',
                background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                color: '#fff',
                border: 'none',
                borderRadius: '16px',
                fontSize: '17px',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 30px rgba(59, 130, 246, 0.45)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05) translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(59, 130, 246, 0.65)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(59, 130, 246, 0.45)';
              }}
            >
              Ir al Inicio <FaArrowRight />
            </button>
          </div>
        </div>

        <Footer darkMode={darkMode} />
      </div>
    );
  }

  // =====================================================
  // 🔥 VISTA 1: MENSAJE INFORMATIVO INICIAL (SOLO SI NO HAY ÉXITO)
  // =====================================================
  if (mostrarMensaje && carrito.length === 0) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: darkMode ? '#0a0a2a' : '#f8fafc',
        color: darkMode ? '#fff' : '#111827',
        fontFamily: "'Inter', sans-serif",
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: 0,
        margin: 0,
        boxSizing: 'border-box'
      }}>
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          productos={productosDisponibles}
          favoritos={favoritos}
          toggleFavorito={toggleFavorito}
          esFavorito={esFavorito}
          categorias={categorias}
          subcategorias={subcategorias}
          tipos={tipos}
        />

        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          paddingTop: '80px',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <style>{`
            @keyframes shimmerBlue {
              0% { background-position: -200% center; }
              100% { background-position: 200% center; }
            }
            @keyframes pulseGlow {
              0% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.1); }
              50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.2); }
              100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.1); }
            }
          `}</style>

          <div style={{
            backgroundColor: darkMode ? '#0f1a3a' : '#ffffff',
            borderRadius: '24px',
            maxWidth: '600px',
            width: '100%',
            padding: '40px 35px',
            border: darkMode ? '2px solid rgba(59, 130, 246, 0.3)' : '2px solid #e5e7eb',
            boxShadow: darkMode 
              ? '0 25px 80px rgba(0, 0, 0, 0.9), 0 0 60px rgba(59, 130, 246, 0.05)'
              : '0 25px 80px rgba(0, 0, 0, 0.08)',
            animation: 'pulseGlow 3s ease-in-out infinite'
          }}>
            <button
              onClick={() => navigate(-1)}
              style={{
                float: 'right',
                background: darkMode ? 'rgba(59, 130, 246, 0.1)' : '#f1f5f9',
                border: darkMode ? '2px solid rgba(59, 130, 246, 0.2)' : '2px solid #e5e7eb',
                color: darkMode ? '#fff' : '#111827',
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                fontSize: '20px',
                marginBottom: '10px'
              }}
            >
              <FaTimes />
            </button>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <div style={{
                background: darkMode 
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.1))'
                  : 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(37, 99, 235, 0.05))',
                padding: '20px',
                borderRadius: '50%',
                border: darkMode ? '2px solid rgba(59, 130, 246, 0.3)' : '2px solid #3b82f6',
                fontSize: '48px'
              }}>
                📋
              </div>
            </div>

            <h2 style={{
              color: darkMode ? '#ffffff' : '#111827',
              fontSize: '28px',
              fontWeight: '800',
              textAlign: 'center',
              marginBottom: '16px',
              background: darkMode 
                ? 'linear-gradient(90deg, #60a5fa, #3b82f6, #1d4ed8)'
                : 'linear-gradient(90deg, #2563eb, #3b82f6, #1d4ed8)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmerBlue 3s linear infinite'
            }}>
              📦 Realiza tu Pedido
            </h2>

            <div style={{
              background: darkMode ? 'rgba(59, 130, 246, 0.05)' : '#eff6ff',
              borderRadius: '16px',
              padding: '20px 24px',
              marginBottom: '20px',
              borderLeft: darkMode ? '4px solid #3b82f6' : '4px solid #3b82f6'
            }}>
              <p style={{
                color: darkMode ? '#e0e7ff' : '#1e293b',
                fontSize: '16px',
                lineHeight: '1.7',
                margin: 0,
                fontWeight: '500'
              }}>
                A través de la plataforma podrás realizar pedidos para agilizar la entrega, 
                la cual será directamente en <strong style={{ color: '#60a5fa' }}>tienda física</strong>.
              </p>
            </div>

            <div style={{
              background: darkMode ? 'rgba(239, 68, 68, 0.1)' : '#fef2f2',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '24px',
              border: darkMode ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid #fecaca'
            }}>
              <p style={{
                color: darkMode ? '#fca5a5' : '#991b1b',
                fontSize: '14px',
                margin: 0,
                fontWeight: '600'
              }}>
                ⚠️ <strong>No se realizan envíos a domicilio.</strong>
              </p>
              <p style={{
                color: darkMode ? '#fca5a5' : '#991b1b',
                fontSize: '14px',
                margin: '6px 0 0 0'
              }}>
                Si requieres envío, por favor ponte en contacto con un asesor.
              </p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: darkMode ? 'rgba(37, 211, 102, 0.08)' : '#f0fdf4',
                borderRadius: '12px',
                padding: '14px 16px',
                border: darkMode ? '1px solid rgba(37, 211, 102, 0.15)' : '1px solid #bbf7d0',
                textAlign: 'center'
              }}>
                <FaWhatsapp style={{ color: '#25D366', fontSize: '22px', marginBottom: '6px' }} />
                <p style={{
                  color: darkMode ? '#86efac' : '#166534',
                  fontSize: '13px',
                  fontWeight: '600',
                  margin: 0
                }}>
                  <a href="tel:+525511164545" style={{ color: darkMode ? '#86efac' : '#166534', textDecoration: 'none' }}>
                    55 1116 4545
                  </a>
                </p>
              </div>

              <div style={{
                background: darkMode ? 'rgba(59, 130, 246, 0.08)' : '#eff6ff',
                borderRadius: '12px',
                padding: '14px 16px',
                border: darkMode ? '1px solid rgba(59, 130, 246, 0.15)' : '1px solid #bfdbfe',
                textAlign: 'center'
              }}>
                <FaEnvelope style={{ color: '#60a5fa', fontSize: '22px', marginBottom: '6px' }} />
                <p style={{
                  color: darkMode ? '#93c5fd' : '#1e40af',
                  fontSize: '12px',
                  fontWeight: '600',
                  margin: 0,
                  wordBreak: 'break-all'
                }}>
                  <a href="mailto:frayflooring@gmail.com" style={{ color: darkMode ? '#93c5fd' : '#1e40af', textDecoration: 'none' }}>
                    frayflooring@gmail.com
                  </a>
                </p>
              </div>
            </div>

            <div style={{
              background: darkMode ? 'rgba(251, 191, 36, 0.08)' : '#fffbeb',
              borderRadius: '12px',
              padding: '14px 18px',
              border: darkMode ? '1px solid rgba(251, 191, 36, 0.15)' : '1px solid #fde68a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              marginBottom: '24px'
            }}>
              <FaStore style={{ color: '#fbbf24', fontSize: '20px' }} />
              <span style={{
                color: darkMode ? '#fcd34d' : '#92400e',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                También puedes acudir directamente a nuestra sucursal
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  padding: '14px',
                  background: darkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                  color: darkMode ? '#fca5a5' : '#991b1b',
                  border: darkMode ? '2px solid rgba(239, 68, 68, 0.2)' : '2px solid #fecaca',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                Cerrar
              </button>
              
              <button
                onClick={aceptarMensaje}
                style={{
                  padding: '14px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 30px rgba(59, 130, 246, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                Continuar <FaArrowRight />
              </button>
            </div>
          </div>
        </div>

        <Footer darkMode={darkMode} />
      </div>
    );
  }

  // =====================================================
  // 🔥 VISTA 3: FORMULARIO DE PEDIDO (DEFAULT)
  // =====================================================
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: darkMode ? '#0a0a2a' : '#f8fafc',
      color: darkMode ? '#fff' : '#111827',
      fontFamily: "'Inter', sans-serif",
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 0,
      margin: 0,
      boxSizing: 'border-box'
    }}>
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        productos={productosDisponibles}
        favoritos={favoritos}
        toggleFavorito={toggleFavorito}
        esFavorito={esFavorito}
        categorias={categorias}
        subcategorias={subcategorias}
        tipos={tipos}
      />

      <div style={{
        width: '100%',
        maxWidth: '900px',
        padding: '20px',
        paddingTop: '100px',
        paddingBottom: '40px',
        boxSizing: 'border-box',
        flex: 1
      }}>
        <div style={{
          backgroundColor: darkMode ? '#0f1a3a' : '#ffffff',
          borderRadius: '24px',
          padding: '35px',
          border: darkMode ? '2px solid rgba(59, 130, 246, 0.3)' : '2px solid #e5e7eb',
          boxShadow: darkMode 
            ? '0 25px 80px rgba(0, 0, 0, 0.9)'
            : '0 25px 80px rgba(0, 0, 0, 0.08)',
        }}>
          <button
            onClick={() => navigate(-1)}
            style={{
              background: darkMode ? 'rgba(59, 130, 246, 0.1)' : '#f1f5f9',
              border: darkMode ? '2px solid rgba(59, 130, 246, 0.2)' : '2px solid #e5e7eb',
              color: darkMode ? '#fff' : '#111827',
              padding: '8px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.3s ease',
              fontSize: '14px',
              marginBottom: '20px'
            }}
          >
            <FaArrowLeft /> Volver
          </button>

          <h2 style={{
            color: darkMode ? '#ffffff' : '#111827',
            fontSize: '26px',
            fontWeight: '800',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <FaShoppingCart style={{ color: '#60a5fa' }} />
            Crear Pedido
          </h2>
          <p style={{ 
            color: darkMode ? '#94a3b8' : '#64748b', 
            marginBottom: '24px', 
            fontSize: '14px' 
          }}>
            Completa el formulario para realizar tu pedido. Un asesor te contactará para confirmar.
          </p>

          {mensajeError && (
            <div style={{
              background: darkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
              border: darkMode ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fecaca',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '16px',
              color: darkMode ? '#fca5a5' : '#991b1b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '10px'
            }}>
              <span>{mensajeError}</span>
              <button
                onClick={() => setMensajeError("")}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '0 4px'
                }}
              >
                ✕
              </button>
            </div>
          )}

          <div style={{
            background: darkMode ? 'rgba(59, 130, 246, 0.05)' : '#f8fafc',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            border: darkMode ? '1px solid rgba(59, 130, 246, 0.1)' : '1px solid #e5e7eb'
          }}>
            <h3 style={{ color: '#60a5fa', fontSize: '16px', marginBottom: '16px' }}>
              👤 Datos del Cliente
            </h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ 
                  color: darkMode ? '#94a3b8' : '#64748b', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  display: 'block', 
                  marginBottom: '4px' 
                }}>
                  Nombre completo *
                </label>
                <input
                  type="text"
                  value={cliente.nombre}
                  onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                  placeholder="Ej: Juan Pérez"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: darkMode ? '2px solid rgba(59, 130, 246, 0.15)' : '2px solid #e5e7eb',
                    background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
                    color: darkMode ? '#fff' : '#111827',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div>
                <label style={{ 
                  color: darkMode ? '#94a3b8' : '#64748b', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  display: 'block', 
                  marginBottom: '4px' 
                }}>
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  value={cliente.email}
                  onChange={(e) => setCliente({ ...cliente, email: e.target.value })}
                  placeholder="Ej: cliente@email.com"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: darkMode ? '2px solid rgba(59, 130, 246, 0.15)' : '2px solid #e5e7eb',
                    background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
                    color: darkMode ? '#fff' : '#111827',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '14px' }}>
              <div>
                <label style={{ 
                  color: darkMode ? '#94a3b8' : '#64748b', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  display: 'block', 
                  marginBottom: '4px' 
                }}>
                  Celular *
                </label>
                <input
                  type="tel"
                  value={cliente.celular}
                  onChange={(e) => setCliente({ ...cliente, celular: e.target.value })}
                  placeholder="Ej: 5512345678"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: darkMode ? '2px solid rgba(59, 130, 246, 0.15)' : '2px solid #e5e7eb',
                    background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
                    color: darkMode ? '#fff' : '#111827',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              
              <div>
                <label style={{ 
                  color: darkMode ? '#94a3b8' : '#64748b', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  display: 'block', 
                  marginBottom: '4px' 
                }}>
                  Comentarios (opcional)
                </label>
                <input
                  type="text"
                  value={cliente.comentarios}
                  onChange={(e) => setCliente({ ...cliente, comentarios: e.target.value })}
                  placeholder="Ej: Piso para sala"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: darkMode ? '2px solid rgba(59, 130, 246, 0.15)' : '2px solid #e5e7eb',
                    background: darkMode ? 'rgba(255,255,255,0.05)' : '#ffffff',
                    color: darkMode ? '#fff' : '#111827',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          {/* 🔥 SECCIÓN DE FECHA Y HORA DE ENTREGA */}
          <div style={{
            background: darkMode ? 'rgba(59, 130, 246, 0.05)' : '#f8fafc',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            border: darkMode ? '1px solid rgba(59, 130, 246, 0.1)' : '1px solid #e5e7eb'
          }}>
            <h3 style={{ 
              color: '#60a5fa', 
              fontSize: '16px', 
              marginBottom: '16px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px' 
            }}>
              <FaCalendarAlt /> Día y Hora de Entrega
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ 
                  color: darkMode ? '#94a3b8' : '#64748b', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  display: 'block', 
                  marginBottom: '4px' 
                }}>
                  Día de entrega *
                </label>
                <select
                  value={cliente.diaEntrega}
                  onChange={(e) => {
                    setCliente({ ...cliente, diaEntrega: e.target.value, horaEntrega: "" });
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: darkMode ? '2px solid rgba(59, 130, 246, 0.15)' : '2px solid #e5e7eb',
                    background: darkMode ? 'rgba(15, 26, 58, 0.95)' : '#ffffff',
                    color: darkMode ? '#fff' : '#111827',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Selecciona un día</option>
                  {diasDisponibles.map((dia) => (
                    <option key={dia.valor} value={dia.valor}>
                      {dia.etiqueta}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ 
                  color: darkMode ? '#94a3b8' : '#64748b', 
                  fontSize: '13px', 
                  fontWeight: '600', 
                  display: 'block', 
                  marginBottom: '4px' 
                }}>
                  Hora de entrega *
                </label>
                <select
                  value={cliente.horaEntrega}
                  onChange={(e) => setCliente({ ...cliente, horaEntrega: e.target.value })}
                  disabled={!cliente.diaEntrega}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: darkMode ? '2px solid rgba(59, 130, 246, 0.15)' : '2px solid #e5e7eb',
                    background: darkMode ? 'rgba(15, 26, 58, 0.95)' : '#ffffff',
                    color: darkMode ? '#fff' : '#111827',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: cliente.diaEntrega ? 'pointer' : 'not-allowed',
                    opacity: cliente.diaEntrega ? 1 : 0.6
                  }}
                >
                  <option value="">Selecciona una hora</option>
                  {horasDisponibles.map((hora) => (
                    <option key={hora.valor} value={hora.valor}>
                      {hora.etiqueta}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{
              marginTop: '18px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px'
            }}>
              <div style={{
                background: darkMode 
                  ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.12), rgba(37, 99, 235, 0.06))'
                  : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
                borderRadius: '12px',
                padding: '14px',
                border: darkMode 
                  ? '1.5px solid rgba(59, 130, 246, 0.25)' 
                  : '1.5px solid #bfdbfe',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                    borderRadius: '8px',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FaClock size={14} color="#fff" />
                  </div>
                  <span style={{
                    color: darkMode ? '#93c5fd' : '#1e40af',
                    fontSize: '12px',
                    fontWeight: '800',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>
                    Lunes a Viernes
                  </span>
                </div>
                <div style={{
                  color: darkMode ? '#e0e7ff' : '#1e293b',
                  fontSize: '16px',
                  fontWeight: '800',
                  letterSpacing: '0.3px'
                }}>
                  12:00 PM – 6:00 PM
                </div>
                <div style={{
                  color: darkMode ? '#94a3b8' : '#64748b',
                  fontSize: '11px',
                  marginTop: '4px',
                  fontWeight: '500'
                }}>
                  Horario continuo
                </div>
              </div>

              <div style={{
                background: darkMode 
                  ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.12), rgba(245, 158, 11, 0.06))'
                  : 'linear-gradient(135deg, #fffbeb, #fef3c7)',
                borderRadius: '12px',
                padding: '14px',
                border: darkMode 
                  ? '1.5px solid rgba(251, 191, 36, 0.25)' 
                  : '1.5px solid #fde68a',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    borderRadius: '8px',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <FaClock size={14} color="#fff" />
                  </div>
                  <span style={{
                    color: darkMode ? '#fcd34d' : '#92400e',
                    fontSize: '12px',
                    fontWeight: '800',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>
                    Sábado
                  </span>
                </div>
                <div style={{
                  color: darkMode ? '#fef3c7' : '#78350f',
                  fontSize: '16px',
                  fontWeight: '800',
                  letterSpacing: '0.3px'
                }}>
                  12:00 PM – 5:00 PM
                </div>
                <div style={{
                  color: darkMode ? '#fcd34d' : '#92400e',
                  fontSize: '11px',
                  marginTop: '4px',
                  fontWeight: '500'
                }}>
                  Horario reducido
                </div>
              </div>
            </div>

            <div style={{
              marginTop: '14px',
              background: darkMode 
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(124, 58, 237, 0.06))'
                : 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
              borderRadius: '14px',
              padding: '16px 18px',
              border: darkMode 
                ? '1.5px solid rgba(139, 92, 246, 0.3)' 
                : '1.5px solid #ddd6fe',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #8b5cf6, #a78bfa, #c4b5fd)'
              }} />

              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  borderRadius: '10px',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                }}>
                  <FaInfoCircle size={18} color="#fff" />
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{
                    color: darkMode ? '#c4b5fd' : '#5b21b6',
                    fontSize: '13px',
                    fontWeight: '800',
                    marginBottom: '6px',
                    letterSpacing: '0.3px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    📅 DÍAS FESTIVOS Y HORARIOS ESPECIALES
                  </div>
                  <div style={{
                    color: darkMode ? '#e9d5ff' : '#6b21a8',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    fontWeight: '500'
                  }}>
                    Los horarios pueden variar en días festivos oficiales. 
                    Te recomendamos <strong style={{ color: darkMode ? '#c4b5fd' : '#7c3aed' }}>consultar previamente</strong> antes de tu visita.
                  </div>

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                    marginTop: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <a
                      href="tel:+525511164545"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: darkMode 
                          ? 'rgba(139, 92, 246, 0.2)' 
                          : '#ffffff',
                        color: darkMode ? '#c4b5fd' : '#7c3aed',
                        padding: '7px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        border: darkMode 
                          ? '1.5px solid rgba(139, 92, 246, 0.4)' 
                          : '1.5px solid #c4b5fd',
                        transition: 'all 0.2s ease',
                        boxShadow: darkMode ? 'none' : '0 2px 6px rgba(139, 92, 246, 0.15)'
                      }}
                    >
                      <FaPhoneAlt size={11} />
                      55 1116 4545
                    </a>
                    <a
                      href="https://wa.me/525511164545?text=Hola,%20quisiera%20consultar%20los%20horarios%20de%20d%C3%ADas%20festivos"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'linear-gradient(135deg, #25D366, #128C7E)',
                        color: '#ffffff',
                        padding: '7px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        textDecoration: 'none',
                        border: 'none',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                      }}
                    >
                      <FaWhatsapp size={12} />
                      Consultar por WhatsApp
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            background: darkMode ? 'rgba(59, 130, 246, 0.05)' : '#f8fafc',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            border: darkMode ? '1px solid rgba(59, 130, 246, 0.1)' : '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
              <h3 style={{ color: '#60a5fa', fontSize: '16px', margin: 0 }}>
                🛒 Carrito de Pedido ({carrito.length} productos)
              </h3>
              <button
                onClick={irAProductos}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 2px 20px rgba(59, 130, 246, 0.3)'
                }}
              >
                <FaPlus size={12} /> Agregar Productos
              </button>
            </div>
            
            {carrito.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                color: darkMode ? '#64748b' : '#94a3b8'
              }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>🛒</div>
                <p style={{ margin: 0 }}>No hay productos en el carrito</p>
                <p style={{ fontSize: '13px', marginTop: '4px' }}>Haz clic en "Agregar Productos" para seleccionar</p>
              </div>
            ) : (
              <>
                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {carrito.map(item => {
                    const imagenProducto = item.imagen || obtenerImagenProducto(item);
                    const esPorMetros = esVentaPorMetros(item.tipoVenta);
                    const unidad = obtenerUnidadMostrar(item.tipoVenta);
                    const unidadSingular = obtenerUnidadSingular(item.tipoVenta);
                    const paso = obtenerPaso(item.tipoVenta);
                    const esDecimal = paso < 1;
                    const subtotal = calcularSubtotal(item);
                    const infoExtra = obtenerInfoExtra(item);
                    
                    // 🔥 Stock real desde productosDisponibles si existe
                    const productoFresco = productosDisponibles.find(p => p.id === item.id);
                    const stockDisponible = productoFresco 
                      ? Number(productoFresco.stock) || 0 
                      : Number(item.stock) || 0;
                    
                    const cantidadActual = Number(item.cantidad) || 0;
                    const stockBajo = cantidadActual >= stockDisponible;
                    
                    return (
                      <div key={item.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        padding: '12px',
                        borderBottom: darkMode ? '1px solid rgba(59,130,246,0.05)' : '1px solid #f1f5f9',
                        flexWrap: 'wrap',
                        background: darkMode ? 'rgba(255,255,255,0.02)' : '#fff',
                        borderRadius: '10px',
                        marginBottom: '8px'
                      }}>
                        <div style={{
                          width: '70px',
                          height: '70px',
                          flexShrink: 0,
                          borderRadius: '10px',
                          overflow: 'hidden',
                          background: darkMode ? '#1a1a3a' : '#f1f5f9',
                          border: darkMode ? '1px solid rgba(59,130,246,0.1)' : '1px solid #e5e7eb'
                        }}>
                          <img 
                            src={imagenProducto}
                            alt={item.nombre}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/70?text=Sin+imagen';
                            }}
                          />
                        </div>
                        
                        <div style={{ flex: 2, minWidth: '140px' }}>
                          <div style={{ color: darkMode ? '#fff' : '#111827', fontSize: '14px', fontWeight: '600' }}>
                            {item.nombre}
                          </div>
                          <div style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '11px' }}>
                            SKU: {item.sku || 'N/A'}
                          </div>
                          
                          {/* 🔥 MOSTRAR STOCK DISPONIBLE */}
                          <div style={{ 
                            color: stockBajo ? '#ef4444' : '#22c55e', 
                            fontSize: '11px', 
                            fontWeight: '600',
                            marginTop: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            📦 Stock: {stockDisponible} {unidad}
                            {stockBajo && <span style={{ color: '#ef4444' }}>(máximo alcanzado)</span>}
                          </div>
                          
                          <div style={{ 
                            color: '#60a5fa', 
                            fontSize: '11px', 
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            marginTop: '4px',
                            flexWrap: 'wrap'
                          }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              {obtenerIconoTipo(item.tipoVenta)} 
                              <span>{obtenerTipoVenta(item.tipoVenta)}</span>
                            </span>
                            
                            {infoExtra.map((info, idx) => (
                              <span 
                                key={idx}
                                style={{ 
                                  color: darkMode ? '#94a3b8' : '#64748b', 
                                  fontWeight: '500',
                                  background: darkMode ? 'rgba(59,130,246,0.1)' : '#eef2ff',
                                  padding: '1px 8px',
                                  borderRadius: '6px',
                                  fontSize: '10px'
                                }}
                              >
                                {info.icono} {info.texto}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {editandoCantidad === item.id ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <input
                              type="number"
                              value={cantidadInput}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || /^\d*\.?\d*$/.test(val)) {
                                  setCantidadInput(val);
                                }
                              }}
                              step={esDecimal ? "0.5" : "1"}
                              min="0"
                              max={stockDisponible}
                              style={{
                                width: '90px',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '2px solid #60a5fa',
                                background: darkMode ? 'rgba(255,255,255,0.05)' : '#fff',
                                color: darkMode ? '#fff' : '#111827',
                                fontSize: '14px',
                                fontWeight: '600',
                                textAlign: 'center',
                                outline: 'none'
                              }}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') guardarEdicionCantidad(item.id);
                                if (e.key === 'Escape') cancelarEdicionCantidad();
                              }}
                            />
                            <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
                              {unidad}
                            </span>
                            <button
                              onClick={() => guardarEdicionCantidad(item.id)}
                              style={{
                                background: '#16a34a',
                                border: 'none',
                                color: '#fff',
                                padding: '5px 8px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              <FaSave size={12} />
                            </button>
                            <button
                              onClick={cancelarEdicionCantidad}
                              style={{
                                background: '#6b7280',
                                border: 'none',
                                color: '#fff',
                                padding: '5px 8px',
                                borderRadius: '5px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              onClick={() => decrementarCantidad(item.id, paso)}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '7px',
                                border: darkMode ? '1px solid rgba(59,130,246,0.15)' : '1px solid #e5e7eb',
                                background: darkMode ? 'rgba(59,130,246,0.05)' : '#f8fafc',
                                color: darkMode ? '#fff' : '#111827',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px'
                              }}
                            >
                              <FaMinus size={8} />
                            </button>
                            
                            <span 
                              style={{ 
                                color: darkMode ? '#fff' : '#111827', 
                                fontSize: '14px', 
                                fontWeight: '700', 
                                minWidth: '46px', 
                                textAlign: 'center',
                                cursor: 'pointer',
                                borderBottom: '2px dashed #60a5fa',
                                padding: '0 4px'
                              }}
                              onClick={() => iniciarEdicionCantidad(item)}
                              title="Haz clic para editar la cantidad"
                            >
                              {esDecimal ? Number(item.cantidad).toFixed(2) : item.cantidad}
                            </span>
                            
                            <span style={{ fontSize: '11px', color: darkMode ? '#94a3b8' : '#6b7280', fontWeight: '600', minWidth: '44px' }}>
                              {unidad}
                            </span>
                            
                            <button
                              onClick={() => incrementarCantidad(item.id, paso)}
                              disabled={stockBajo}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '7px',
                                border: darkMode ? '1px solid rgba(59,130,246,0.15)' : '1px solid #e5e7eb',
                                background: stockBajo 
                                  ? (darkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2') 
                                  : (darkMode ? 'rgba(59,130,246,0.05)' : '#f8fafc'),
                                color: stockBajo 
                                  ? (darkMode ? '#fca5a5' : '#991b1b') 
                                  : (darkMode ? '#fff' : '#111827'),
                                cursor: stockBajo ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10px',
                                opacity: stockBajo ? 0.6 : 1
                              }}
                              title={stockBajo ? `Máximo alcanzado (${stockDisponible} ${unidad})` : ''}
                            >
                              <FaPlus size={8} />
                            </button>
                            
                            <button
                              onClick={() => iniciarEdicionCantidad(item)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#60a5fa',
                                cursor: 'pointer',
                                padding: '2px 4px',
                                fontSize: '12px'
                              }}
                              title="Editar cantidad"
                            >
                              <FaEdit size={11} />
                            </button>
                          </div>
                        )}
                        
                        <div style={{ color: '#60a5fa', fontSize: '15px', fontWeight: '700', minWidth: '80px', textAlign: 'right' }}>
                          ${subtotal.toFixed(2)}
                        </div>
                        
                        <button
                          onClick={() => eliminarDelCarrito(item.id)}
                          style={{
                            background: darkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                            border: 'none',
                            color: darkMode ? '#fca5a5' : '#991b1b',
                            cursor: 'pointer',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = darkMode ? 'rgba(239,68,68,0.2)' : '#fee2e2'}
                          onMouseLeave={(e) => e.currentTarget.style.background = darkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2'}
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '14px 12px 0',
                  borderTop: darkMode ? '2px solid rgba(59,130,246,0.1)' : '2px solid #f1f5f9',
                  marginTop: '8px'
                }}>
                  <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '16px' }}>Total:</span>
                  <span style={{ color: '#60a5fa', fontSize: '20px', fontWeight: '800' }}>
                    ${totalCarrito.toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>

          <button
            onClick={enviarPedido}
            disabled={cargando || carrito.length === 0}
            style={{
              width: '100%',
              padding: '16px',
              borderRadius: '14px',
              border: 'none',
              background: carrito.length > 0 ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : darkMode ? 'rgba(59,130,246,0.2)' : '#e5e7eb',
              color: carrito.length > 0 ? '#fff' : darkMode ? '#64748b' : '#94a3b8',
              fontSize: '18px',
              fontWeight: '700',
              cursor: carrito.length > 0 && !cargando ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease',
              boxShadow: carrito.length > 0 ? '0 4px 30px rgba(59, 130, 246, 0.4)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            {cargando ? (
              'Enviando...'
            ) : (
              <>
                <FaCheck /> Enviar Pedido
              </>
            )}
          </button>
        </div>
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
}