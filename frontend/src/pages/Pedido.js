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
  FaSave
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
    'tramo': 'Tramo (metros)',
    'rollo': 'Rollo (metros)',
    'unidad': 'Unidad',
    'metro_lineal': 'Metro Lineal (m²)',
    'otros': 'Otros'
  };
  return tipos[tipoVenta] || tipoVenta || 'No definido';
};

// 🔥 FUNCIÓN PARA OBTENER EL ICONO DEL TIPO DE VENTA
const obtenerIconoTipo = (tipoVenta) => {
  const iconos = {
    'caja': <FaBox size={12} />,
    'pieza': <FaCubes size={12} />,
    'tramo': <FaRuler size={12} />,
    'rollo': <FaLayerGroup size={12} />,
    'unidad': <FaPalette size={12} />,
    'metro_lineal': <FaRuler size={12} />,
    'otros': <FaThLarge size={12} />
  };
  return iconos[tipoVenta] || <FaBox size={12} />;
};

// 🔥 FUNCIÓN PARA SABER SI EL PRODUCTO SE VENDE POR METROS
const esVentaPorMetros = (tipoVenta) => {
  return tipoVenta === 'tramo' || tipoVenta === 'rollo' || tipoVenta === 'metro_lineal';
};

// 🔥 FUNCIÓN PARA OBTENER LA UNIDAD DE MEDIDA
const obtenerUnidadMedida = (tipoVenta) => {
  if (tipoVenta === 'tramo' || tipoVenta === 'rollo' || tipoVenta === 'metro_lineal') {
    return 'metros';
  }
  if (tipoVenta === 'caja') {
    return 'cajas';
  }
  if (tipoVenta === 'pieza') {
    return 'piezas';
  }
  return 'unidades';
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

export default function Pedido() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados para el mensaje informativo
  const [mostrarMensaje, setMostrarMensaje] = useState(() => {
    const carritoGuardado = sessionStorage.getItem("carritoPedido");
    let tieneProductos = false;
    if (carritoGuardado) {
      try {
        const parsed = JSON.parse(carritoGuardado);
        tieneProductos = Array.isArray(parsed) && parsed.length > 0;
      } catch (e) {
        console.error("Error al cargar carrito:", e);
      }
    }
    return !tieneProductos;
  });
  
  // Estados para el formulario de pedido
  const [productosDisponibles, setProductosDisponibles] = useState([]);
  const [carrito, setCarrito] = useState([]);
  
  // Estados para datos del cliente
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
      comentarios: ""
    };
  });
  
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("");
  const [mensajeError, setMensajeError] = useState("");
  const [numeroPedido, setNumeroPedido] = useState("");

  // Estado para dark mode
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // Estado para favoritos
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos");
    return guardados ? JSON.parse(guardados) : [];
  });

  // Estado para categorías y subcategorías
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [tipos, setTipos] = useState([]);

  // 🔥 ESTADO PARA MODO DE EDICIÓN DE CANTIDAD
  const [editandoCantidad, setEditandoCantidad] = useState(null);
  const [cantidadInput, setCantidadInput] = useState("");

  // REF para evitar duplicados
  const productoAgregadoRef = useRef(false);
  const ultimoProductoAgregadoRef = useRef(null);

  // Cargar productos disponibles y carrito guardado
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const res = await api.get("/productos");
        setProductosDisponibles(res.data || []);
      } catch (error) {
        console.error("Error cargando productos:", error);
        setProductosDisponibles([]);
      }
    };
    cargarProductos();

    // Recuperar carrito guardado en sessionStorage
    const carritoGuardado = sessionStorage.getItem("carritoPedido");
    if (carritoGuardado) {
      try {
        const parsed = JSON.parse(carritoGuardado);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Asegurar que cada item tenga los campos necesarios
          const carritoLimpio = parsed.map(item => ({
            ...item,
            precio: Number(item.precio) || 0,
            cantidad: Number(item.cantidad) || 1,
            subtotal: Number(item.subtotal) || (Number(item.precio) || 0) * (Number(item.cantidad) || 1)
          }));
          setCarrito(carritoLimpio);
          setMostrarMensaje(false);
        }
      } catch (e) {
        console.error("Error al cargar carrito:", e);
      }
    }
  }, []);

  // Cargar categorías, subcategorías y tipos para Navbar
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

  // Guardar dark mode en localStorage
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Guardar favoritos en localStorage
  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  // Guardar carrito en sessionStorage
  useEffect(() => {
    if (carrito.length > 0 || sessionStorage.getItem("carritoPedido")) {
      sessionStorage.setItem("carritoPedido", JSON.stringify(carrito));
    }
    setMostrarMensaje(carrito.length === 0);
  }, [carrito]);

  // Guardar cliente en sessionStorage
  useEffect(() => {
    sessionStorage.setItem("clientePedido", JSON.stringify(cliente));
  }, [cliente]);

  // Escuchar productos agregados
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
      alto: producto.alto || 0
    };
    
    agregarProductoAlCarrito(productoCompleto, cantidad || 1);
    
    setTimeout(() => {
      const cleanState = { ...location.state };
      delete cleanState.productoAgregado;
      window.history.replaceState(cleanState, document.title);
      productoAgregadoRef.current = false;
    }, 200);
    
  }, [location.state]);

  // Función para toggle favoritos
  const toggleFavorito = (producto) => {
    const existe = favoritos.find((fav) => fav.id === producto.id);
    if (existe) {
      setFavoritos(favoritos.filter((f) => f.id !== producto.id));
    } else {
      setFavoritos([...favoritos, producto]);
    }
  };

  // Función para verificar si un producto es favorito
  const esFavorito = (id) => favoritos.some((f) => f.id === id);

  // 🔥 FUNCIÓN PARA AGREGAR PRODUCTO AL CARRITO
  const agregarProductoAlCarrito = (producto, cantidad = 1) => {
    setCarrito(prevCarrito => {
      const existe = prevCarrito.find(item => item.id === producto.id);
      
      let nuevoCarrito;
      if (existe) {
        const nuevaCantidad = Number(existe.cantidad) + Number(cantidad);
        nuevoCarrito = prevCarrito.map(item => 
          item.id === producto.id 
            ? { 
                ...item, 
                cantidad: nuevaCantidad, 
                subtotal: Number(item.precio) * nuevaCantidad 
              }
            : item
        );
      } else {
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
          cantidad: Number(cantidad),
          subtotal: Number(producto.precio) * Number(cantidad)
        };
        nuevoCarrito = [...prevCarrito, nuevoProducto];
      }
      
      sessionStorage.setItem("carritoPedido", JSON.stringify(nuevoCarrito));
      return nuevoCarrito;
    });
  };

  // Eliminar producto del carrito
  const eliminarDelCarrito = (id) => {
    setCarrito(prevCarrito => {
      const nuevoCarrito = prevCarrito.filter(item => item.id !== id);
      sessionStorage.setItem("carritoPedido", JSON.stringify(nuevoCarrito));
      return nuevoCarrito;
    });
  };

  // 🔥 ACTUALIZAR CANTIDAD - Soporte para metros
  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad < 0.1) return;
    setCarrito(prevCarrito => {
      const nuevoCarrito = prevCarrito.map(item => 
        item.id === id 
          ? { 
              ...item, 
              cantidad: nuevaCantidad, 
              subtotal: (Number(item.precio) || 0) * nuevaCantidad 
            }
          : item
      );
      sessionStorage.setItem("carritoPedido", JSON.stringify(nuevoCarrito));
      return nuevoCarrito;
    });
  };

  // 🔥 INICIAR EDICIÓN DE CANTIDAD
  const iniciarEdicionCantidad = (item) => {
    setEditandoCantidad(item.id);
    setCantidadInput(String(item.cantidad));
  };

  // 🔥 GUARDAR CANTIDAD EDITADA
  const guardarEdicionCantidad = (id) => {
    const valor = parseFloat(cantidadInput);
    if (isNaN(valor) || valor <= 0) {
      setMensajeError("Por favor ingresa una cantidad válida");
      return;
    }
    actualizarCantidad(id, valor);
    setEditandoCantidad(null);
    setCantidadInput("");
  };

  // 🔥 CANCELAR EDICIÓN
  const cancelarEdicionCantidad = () => {
    setEditandoCantidad(null);
    setCantidadInput("");
  };

  // 🔥 INCREMENTAR CANTIDAD
  const incrementarCantidad = (id, paso = 1) => {
    const item = carrito.find(i => i.id === id);
    if (!item) return;
    const nuevaCantidad = Number(item.cantidad) + paso;
    actualizarCantidad(id, nuevaCantidad);
  };

  // 🔥 DECREMENTAR CANTIDAD
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

  // 🔥 OBTENER EL PASO PARA CADA TIPO DE PRODUCTO
  const obtenerPaso = (tipoVenta) => {
    if (esVentaPorMetros(tipoVenta)) {
      return 0.5; // Para metros, incrementos de 0.5
    }
    return 1; // Para unidades, incrementos de 1
  };

  // Calcular total del carrito
  const totalCarrito = carrito.reduce((sum, item) => {
    const subtotal = calcularSubtotal(item);
    return sum + subtotal;
  }, 0);

  // Validar formulario
  const validarFormulario = () => {
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
    if (carrito.length === 0) {
      setMensajeError("Agrega al menos un producto al pedido");
      return false;
    }
    return true;
  };

  // Enviar pedido
  const enviarPedido = async () => {
    if (!validarFormulario()) return;
    
    setCargando(true);
    setMensajeError("");
    setMensajeExito("");
    setNumeroPedido("");

    const pedidoData = {
      cliente: {
        nombre: cliente.nombre,
        email: cliente.email,
        celular: cliente.celular,
        comentarios: cliente.comentarios || ""
      },
      productos: carrito.map(item => ({
        id: item.id,
        nombre: item.nombre || 'Producto',
        sku: item.sku || 'N/A',
        cantidad: Number(item.cantidad) || 1,
        precio: Number(item.precio) || 0,
        subtotal: calcularSubtotal(item),
        imagen: item.imagen || obtenerImagenProducto(item),
        tipoVenta: item.tipoVenta || 'unidad',
        presentacion: item.presentacion || 'Unidad',
        cobertura: item.cobertura || 0,
        categoria: item.categoria || '',
        subcategoria: item.subcategoria || '',
        unidadMedida: esVentaPorMetros(item.tipoVenta) ? 'metros' : 'unidades'
      })),
      total: Number(totalCarrito.toFixed(2))
    };

    try {
      const res = await api.post("/pedidos", pedidoData);
      
      if (res.status === 201) {
        setNumeroPedido(res.data.numero_pedido);
        setMensajeExito(`✅ ¡Pedido #${res.data.numero_pedido} creado exitosamente!`);
        
        // Limpiar todo
        setCarrito([]);
        setCliente({ nombre: "", email: "", celular: "", comentarios: "" });
        sessionStorage.removeItem("carritoPedido");
        sessionStorage.removeItem("clientePedido");
      }
    } catch (error) {
      console.error("Error al guardar pedido:", error);
      setMensajeError("❌ Error al crear el pedido. Por favor intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  };

  // Ir a la página de productos para agregar
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

  // Si está mostrando el mensaje informativo Y el carrito está vacío
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
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1) rotate(90deg)';
                e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.2)' : '#e2e8f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.1)' : '#f1f5f9';
              }}
            >
              <FaTimes />
            </button>

            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '20px'
            }}>
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

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = darkMode ? 'rgba(239, 68, 68, 0.25)' : '#fee2e2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = darkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2';
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 6px 40px rgba(59, 130, 246, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 30px rgba(59, 130, 246, 0.4)';
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

  // Formulario de pedido
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
            onMouseEnter={(e) => {
              e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.2)' : '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = darkMode ? 'rgba(59, 130, 246, 0.1)' : '#f1f5f9';
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

          {/* MENSAJE DE ÉXITO */}
          {mensajeExito && (
            <div style={{
              background: darkMode ? 'rgba(34, 197, 94, 0.15)' : '#f0fdf4',
              border: darkMode ? '2px solid rgba(34, 197, 94, 0.3)' : '2px solid #bbf7d0',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>✅</div>
              <div style={{ 
                fontSize: '22px', 
                fontWeight: '800', 
                color: darkMode ? '#86efac' : '#166534',
                marginBottom: '6px'
              }}>
                ¡Pedido Creado Exitosamente!
              </div>
              <div style={{ 
                fontSize: '32px', 
                fontWeight: '900', 
                color: '#fbbf24',
                background: darkMode ? 'rgba(251, 191, 36, 0.1)' : '#fffbeb',
                padding: '10px 20px',
                borderRadius: '12px',
                display: 'inline-block',
                marginBottom: '12px',
                letterSpacing: '1px'
              }}>
                📋 {numeroPedido}
              </div>
              <div style={{
                background: darkMode ? 'rgba(251, 191, 36, 0.15)' : '#fffbeb',
                border: darkMode ? '2px solid rgba(251, 191, 36, 0.3)' : '2px solid #fde68a',
                borderRadius: '12px',
                padding: '16px 20px',
                margin: '12px 0',
                color: darkMode ? '#fcd34d' : '#92400e'
              }}>
                ⚠️ <strong>¡IMPORTANTE!</strong> Anota tu número de pedido. 
                <br />
                <span style={{ fontSize: '14px' }}>Será necesario para la entrega en tienda física.</span>
              </div>
              <div style={{
                color: darkMode ? '#94a3b8' : '#64748b',
                fontSize: '14px',
                marginTop: '8px'
              }}>
                Un asesor se pondrá en contacto contigo para confirmar tu pedido.
              </div>
              <button
                onClick={() => navigate("/")}
                style={{
                  marginTop: '16px',
                  padding: '12px 40px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 20px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 6px 30px rgba(59, 130, 246, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.3)';
                }}
              >
                Ir al Inicio
              </button>
            </div>
          )}

          {mensajeError && (
            <div style={{
              background: darkMode ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
              border: darkMode ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #fecaca',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '16px',
              color: darkMode ? '#fca5a5' : '#991b1b'
            }}>
              {mensajeError}
            </div>
          )}

          {!mensajeExito && (
            <>
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
                      onFocus={(e) => e.currentTarget.style.borderColor = '#60a5fa'}
                      onBlur={(e) => e.currentTarget.style.borderColor = darkMode ? 'rgba(59, 130, 246, 0.15)' : '#e5e7eb'}
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
                      onFocus={(e) => e.currentTarget.style.borderColor = '#60a5fa'}
                      onBlur={(e) => e.currentTarget.style.borderColor = darkMode ? 'rgba(59, 130, 246, 0.15)' : '#e5e7eb'}
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
                      onFocus={(e) => e.currentTarget.style.borderColor = '#60a5fa'}
                      onBlur={(e) => e.currentTarget.style.borderColor = darkMode ? 'rgba(59, 130, 246, 0.15)' : '#e5e7eb'}
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
                      onFocus={(e) => e.currentTarget.style.borderColor = '#60a5fa'}
                      onBlur={(e) => e.currentTarget.style.borderColor = darkMode ? 'rgba(59, 130, 246, 0.15)' : '#e5e7eb'}
                    />
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
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
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 30px rgba(59, 130, 246, 0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 20px rgba(59, 130, 246, 0.3)';
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
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      {carrito.map(item => {
                        const imagenProducto = item.imagen || obtenerImagenProducto(item);
                        const esPorMetros = esVentaPorMetros(item.tipoVenta);
                        const unidad = esPorMetros ? 'm' : 'uds';
                        const paso = obtenerPaso(item.tipoVenta);
                        const esDecimal = paso < 1;
                        const subtotal = calcularSubtotal(item);
                        
                        return (
                          <div key={item.id} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            padding: '10px 12px',
                            borderBottom: darkMode ? '1px solid rgba(59,130,246,0.05)' : '1px solid #f1f5f9',
                            flexWrap: 'wrap'
                          }}>
                            {/* IMAGEN */}
                            <div style={{
                              width: '60px',
                              height: '60px',
                              flexShrink: 0,
                              borderRadius: '8px',
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
                                  e.target.src = 'https://via.placeholder.com/60?text=Sin+imagen';
                                }}
                              />
                            </div>
                            
                            {/* INFO PRODUCTO */}
                            <div style={{ flex: 2, minWidth: '120px' }}>
                              <div style={{ color: darkMode ? '#fff' : '#111827', fontSize: '14px', fontWeight: '600' }}>
                                {item.nombre}
                              </div>
                              <div style={{ color: darkMode ? '#94a3b8' : '#64748b', fontSize: '11px' }}>
                                SKU: {item.sku || 'N/A'}
                              </div>
                              {/* TIPO DE VENTA */}
                              <div style={{ 
                                color: '#60a5fa', 
                                fontSize: '10px', 
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginTop: '2px',
                                flexWrap: 'wrap'
                              }}>
                                {obtenerIconoTipo(item.tipoVenta)} 
                                <span>{obtenerTipoVenta(item.tipoVenta)}</span>
                                {esPorMetros && (
                                  <span style={{ 
                                    color: darkMode ? '#94a3b8' : '#64748b', 
                                    fontWeight: '400',
                                    background: darkMode ? 'rgba(59,130,246,0.1)' : '#eef2ff',
                                    padding: '0 8px',
                                    borderRadius: '4px'
                                  }}>
                                    📏 {item.ancho || 0}cm x {item.alto || 0}cm
                                  </span>
                                )}
                                {item.cobertura > 0 && (
                                  <span style={{ color: darkMode ? '#94a3b8' : '#64748b', fontWeight: '400' }}>
                                    • {item.cobertura} m²
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {/* 🔥 CONTROLES DE CANTIDAD - MEJORADOS PARA METROS */}
                            {editandoCantidad === item.id ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <input
                                  type="number"
                                  value={cantidadInput}
                                  onChange={(e) => setCantidadInput(e.target.value)}
                                  step={esDecimal ? "0.5" : "1"}
                                  min="0"
                                  style={{
                                    width: '80px',
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
                                  {esPorMetros ? 'm' : 'uds'}
                                </span>
                                <button
                                  onClick={() => guardarEdicionCantidad(item.id)}
                                  style={{
                                    background: '#16a34a',
                                    border: 'none',
                                    color: '#fff',
                                    padding: '4px 8px',
                                    borderRadius: '4px',
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
                                    padding: '4px 8px',
                                    borderRadius: '4px',
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
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '6px',
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
                                    fontWeight: '600', 
                                    minWidth: '40px', 
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    borderBottom: '2px dashed #60a5fa',
                                    padding: '0 4px'
                                  }}
                                  onClick={() => iniciarEdicionCantidad(item)}
                                  title="Haz clic para editar la cantidad"
                                >
                                  {item.cantidad}
                                </span>
                                
                                <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: '600' }}>
                                  {esPorMetros ? 'm' : 'uds'}
                                </span>
                                
                                <button
                                  onClick={() => incrementarCantidad(item.id, paso)}
                                  style={{
                                    width: '26px',
                                    height: '26px',
                                    borderRadius: '6px',
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
                                  <FaEdit size={10} />
                                </button>
                              </div>
                            )}
                            
                            <div style={{ color: '#60a5fa', fontSize: '14px', fontWeight: '600', minWidth: '70px', textAlign: 'right' }}>
                              ${subtotal.toFixed(2)}
                            </div>
                            
                            <button
                              onClick={() => eliminarDelCarrito(item.id)}
                              style={{
                                background: darkMode ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                                border: 'none',
                                color: darkMode ? '#fca5a5' : '#991b1b',
                                cursor: 'pointer',
                                padding: '4px 8px',
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
                onMouseEnter={(e) => {
                  if (carrito.length > 0 && !cargando) {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 6px 40px rgba(59, 130, 246, 0.6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (carrito.length > 0 && !cargando) {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 30px rgba(59, 130, 246, 0.4)';
                  }
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
            </>
          )}
        </div>
      </div>

      <Footer darkMode={darkMode} />
    </div>
  );
}