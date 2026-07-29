import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
  FaPhone,
  FaBars,
  FaTimes,
  FaSearch,
  FaHome,
  FaInfoCircle,
  FaEnvelope,
  FaChevronRight,
  FaArrowRight,
  FaClipboardList,
} from "react-icons/fa";
import api from "../services/api";

// 🔥 FUNCIÓN PARA GENERAR URL DE IMAGEN - IGUAL QUE EN COTIZADOR Y PEDIDO
const getImageUrl = (imagen) => {
  if (!imagen) {
    return "https://via.placeholder.com/200?text=Sin+imagen";
  }

  // Si ya viene con una URL completa la usa directamente
  if (imagen.startsWith("http://") || imagen.startsWith("https://")) {
    return imagen;
  }

  // 🔥 IMPORTANTE: Usar la misma URL del backend
  const API_BASE = process.env.REACT_APP_API_URL || 'https://backend-zuib.onrender.com';
  
  // Si la imagen comienza con /, la concatena con el backend
  if (imagen.startsWith("/")) {
    return `${API_BASE}${imagen}`;
  }

  // Si no comienza con /, la agrega
  return `${API_BASE}/${imagen}`;
};

export default function Navbar({
  darkMode,
  setDarkMode,
  favoritos = [],
  categorias = [],
  subcategorias = [],
  tipos = [],
  productos = [],
  toggleFavorito,
  esFavorito,
  isMobile
}) {

  const navigate = useNavigate();
  const location = useLocation();

  // ========== ESTADOS ==========
  const [menuProductosAbierto, setMenuProductosAbierto] = useState(false);
  const [menuCategoriasAbierto, setMenuCategoriasAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNavbarVisible, setIsNavbarVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState(null);
  const [mostrarSubcategorias, setMostrarSubcategorias] = useState(false);
  const [mostrarTipos, setMostrarTipos] = useState(false);
  const [mostrarBuscador, setMostrarBuscador] = useState(false);
  
  const [subcategoriaHover, setSubcategoriaHover] = useState(null);
  const [tiposDeSubcategoriaHover, setTiposDeSubcategoriaHover] = useState([]);
  const [mostrarTiposHover, setMostrarTiposHover] = useState(false);

  const [productoHoverSubcategoria, setProductoHoverSubcategoria] = useState(null);
  const [productoTiposHover, setProductoTiposHover] = useState([]);
  const [productoMostrarTipos, setProductoMostrarTipos] = useState(false);

  const [tiposLocal, setTiposLocal] = useState([]);
  const [productosMobileOpen, setProductosMobileOpen] = useState(false);
  const [categoriasMobileOpen, setCategoriasMobileOpen] = useState(false);

  // ========== REFERENCIAS ==========
  const menuCategoriasRef = useRef(null);
  const navbarRef = useRef(null);
  const linksContainerRef = useRef(null);
  const subcategoriasScrollRef = useRef(null);
  const tiposHoverTimeoutRef = useRef(null);
  const tiposMenuRef = useRef(null);
  const productosMenuRef = useRef(null);
  const productoTiposRef = useRef(null);

  // ========== EFECTO PARA RESETEAR ESTADOS AL CAMBIAR DE RUTA ==========
  useEffect(() => {
    setMenuProductosAbierto(false);
    setMenuCategoriasAbierto(false);
    setMostrarTiposHover(false);
    setProductoMostrarTipos(false);
    setMobileMenuOpen(false);
    setSubcategoriaHover(null);
    setProductoHoverSubcategoria(null);
    setTiposDeSubcategoriaHover([]);
    setProductoTiposHover([]);
    setCategoriaSeleccionada(null);
    setSubcategoriaSeleccionada(null);
    setMostrarSubcategorias(false);
    setMostrarTipos(false);
    
    if (tiposHoverTimeoutRef.current) {
      clearTimeout(tiposHoverTimeoutRef.current);
      tiposHoverTimeoutRef.current = null;
    }
  }, [location.pathname]);

  useEffect(() => {
    if (tipos && tipos.length > 0) {
      setTiposLocal(tipos);
    } else {
      const cargarTipos = async () => {
        try {
          const res = await api.get("/tipos");
          setTiposLocal(res.data);
        } catch (error) {
          console.error("❌ Error cargando tipos:", error);
        }
      };
      cargarTipos();
    }
  }, [tipos]);

  const tiposUsar = tipos && tipos.length > 0 ? tipos : tiposLocal;

  // ========== EFECTOS ==========
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const updateNavbarHeight = () => {
    if (navbarRef.current && linksContainerRef.current) {
      const navbarH = navbarRef.current.offsetHeight;
      const linksH = linksContainerRef.current.offsetHeight;
      const subH = subcategoriasScrollRef.current ? subcategoriasScrollRef.current.offsetHeight : 0;
      setNavbarHeight(navbarH + linksH + subH);
    }
  };

  useEffect(() => {
    updateNavbarHeight();
    const resizeObserver = new ResizeObserver(() => {
      updateNavbarHeight();
    });
    if (navbarRef.current) {
      resizeObserver.observe(navbarRef.current);
    }
    if (linksContainerRef.current) {
      resizeObserver.observe(linksContainerRef.current);
    }
    if (subcategoriasScrollRef.current) {
      resizeObserver.observe(subcategoriasScrollRef.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    let scrollTimeout;
    const handleScroll = () => {
      if (scrollTimeout) {
        cancelAnimationFrame(scrollTimeout);
      }
      scrollTimeout = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        if (isMobileView) {
          if (currentScrollY > lastScrollY && currentScrollY > 50) {
            setIsNavbarVisible(false);
            setMobileMenuOpen(false);
          } else if (currentScrollY < lastScrollY || currentScrollY < 50) {
            setIsNavbarVisible(true);
          }
        } else {
          if (currentScrollY > lastScrollY && currentScrollY > 50) {
            setIsNavbarVisible(false);
          } else if (currentScrollY < lastScrollY || currentScrollY < 50) {
            setIsNavbarVisible(true);
          }
        }
        setLastScrollY(currentScrollY);
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimeout) {
        cancelAnimationFrame(scrollTimeout);
      }
    };
  }, [lastScrollY, isMobileView]);

  // ========== CLICK OUTSIDE ==========
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInsideCategorias = menuCategoriasRef.current?.contains(event.target);
      const isClickInsideTiposHover = tiposMenuRef.current?.contains(event.target);
      const isClickInsideProductos = productosMenuRef.current?.contains(event.target);
      const isClickInsideProductoTipos = productoTiposRef.current?.contains(event.target);
      
      if (!isClickInsideCategorias && !isClickInsideTiposHover && !isClickInsideProductos && !isClickInsideProductoTipos) {
        setMenuCategoriasAbierto(false);
        setCategoriaSeleccionada(null);
        setSubcategoriaSeleccionada(null);
        setMostrarSubcategorias(false);
        setMostrarTipos(false);
        setMostrarTiposHover(false);
        setMenuProductosAbierto(false);
        setProductoMostrarTipos(false);
        setProductoHoverSubcategoria(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const productosFiltrados = productos.filter((p) => {
    const texto = busqueda.toLowerCase();
    return (
      (p.nombre || "").toLowerCase().includes(texto) ||
      (p.descripcion || "").toLowerCase().includes(texto) ||
      (p.categoria || "").toLowerCase().includes(texto) ||
      (p.subcategoria || "").toLowerCase().includes(texto) ||
      (p.sku || "").toString().toLowerCase().includes(texto)
    );
  });

  // 🔥 FUNCIÓN OBTENER IMAGEN - CORREGIDA CON getImageUrl
  const obtenerImagen = (producto) => {
    if (!producto) return "https://via.placeholder.com/200?text=Sin+imagen";

    let imagenUrl = "";

    // Prioriza 'imagenes' (puede tener múltiples separadas por coma)
    if (producto.imagenes && producto.imagenes.trim() !== "") {
      imagenUrl = producto.imagenes.split(",")[0].trim();
    } else if (producto.imagen && producto.imagen.trim() !== "") {
      imagenUrl = producto.imagen.trim();
    } else {
      return "https://via.placeholder.com/200?text=Sin+imagen";
    }

    // 🔥 APLICA getImageUrl PARA OBTENER LA URL COMPLETA
    return getImageUrl(imagenUrl);
  };

  // ========== COMPONENTE SOCIAL ICON ==========
  const SocialIcon = ({ children, color, href, size = "normal", isYoutube = false }) => {
    const isMobileIcon = size === "small";
    const sizePx = isMobileIcon ? "26px" : "46px";
    const iconSize = isMobileIcon ? "10px" : "20px";
    
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: isMobileIcon ? "50%" : "10px",
          cursor: "pointer",
          textDecoration: "none",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          width: sizePx,
          height: sizePx,
          minWidth: sizePx,
          minHeight: sizePx,
          background: isYoutube ? "#ffffff" : color,
          color: isYoutube ? "#FF0000" : "#ffffff",
          border: isMobileIcon ? "1px solid rgba(255,255,255,0.06)" : "2px solid rgba(59,130,246,0.2)",
          fontSize: iconSize,
          boxShadow: isYoutube ? "0 2px 12px rgba(255,0,0,0.12)" : `0 2px 12px ${color}30`,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.15) rotate(-3deg)";
          e.currentTarget.style.boxShadow = "0 4px 30px rgba(59,130,246,0.4)";
          e.currentTarget.style.borderColor = "#60a5fa";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = isYoutube ? "0 2px 12px rgba(255,0,0,0.12)" : `0 2px 12px ${color}30`;
          e.currentTarget.style.borderColor = isMobileIcon ? "rgba(255,255,255,0.06)" : "rgba(59,130,246,0.2)";
        }}
      >
        {children}
      </a>
    );
  };

  // ========== FUNCIONES MANEJADORAS ==========
  const cerrarMenuCategorias = () => {
    setMenuCategoriasAbierto(false);
    setCategoriaSeleccionada(null);
    setSubcategoriaSeleccionada(null);
    setMostrarSubcategorias(false);
    setMostrarTipos(false);
    setMostrarTiposHover(false);
    setMenuProductosAbierto(false);
    setProductoMostrarTipos(false);
    setProductoHoverSubcategoria(null);
  };

  const handleCategoriaClick = (catId, e) => {
    e?.stopPropagation();
    if (categoriaSeleccionada === catId) {
      setCategoriaSeleccionada(null);
      setSubcategoriaSeleccionada(null);
      setMostrarSubcategorias(false);
      setMostrarTipos(false);
    } else {
      setCategoriaSeleccionada(catId);
      setSubcategoriaSeleccionada(null);
      setMostrarSubcategorias(true);
      setMostrarTipos(false);
    }
  };

  const handleSubcategoriaClickBoton = (subId, e) => {
    e?.stopPropagation();
    if (subcategoriaSeleccionada === subId) {
      setSubcategoriaSeleccionada(null);
      setMostrarTipos(false);
    } else {
      setSubcategoriaSeleccionada(subId);
      setMostrarTipos(true);
    }
  };

  const handleSubcategoriaHoverScroll = (subId, subNombre) => {
    if (tiposHoverTimeoutRef.current) {
      clearTimeout(tiposHoverTimeoutRef.current);
      tiposHoverTimeoutRef.current = null;
    }
    
    const tiposFiltrados = tiposUsar.filter(t => Number(t.subcategoria_id) === Number(subId));
    setTiposDeSubcategoriaHover(tiposFiltrados);
    setSubcategoriaHover({ id: subId, nombre: subNombre });
    setMostrarTiposHover(true);
  };

  const handleSubcategoriaLeaveScroll = () => {
    tiposHoverTimeoutRef.current = setTimeout(() => {
      if (!tiposMenuRef.current?.matches(':hover')) {
        setMostrarTiposHover(false);
        setSubcategoriaHover(null);
        setTiposDeSubcategoriaHover([]);
      }
    }, 300);
  };

  const handleTiposHoverEnter = () => {
    if (tiposHoverTimeoutRef.current) {
      clearTimeout(tiposHoverTimeoutRef.current);
      tiposHoverTimeoutRef.current = null;
    }
  };

  const handleTiposHoverLeave = () => {
    tiposHoverTimeoutRef.current = setTimeout(() => {
      setMostrarTiposHover(false);
      setSubcategoriaHover(null);
      setTiposDeSubcategoriaHover([]);
    }, 300);
  };

  const handleProductosMouseEnter = (e) => {
    e.stopPropagation();
    setMenuProductosAbierto(true);
  };

  const handleProductosMouseLeave = () => {
    setTimeout(() => {
      if (!productosMenuRef.current?.matches(':hover') && !productoTiposRef.current?.matches(':hover')) {
        setMenuProductosAbierto(false);
        setProductoHoverSubcategoria(null);
        setProductoTiposHover([]);
        setProductoMostrarTipos(false);
      }
    }, 300);
  };

  const handleProductoSubcategoriaHover = (subId, subNombre) => {
    if (tiposHoverTimeoutRef.current) {
      clearTimeout(tiposHoverTimeoutRef.current);
      tiposHoverTimeoutRef.current = null;
    }
    
    const tiposFiltrados = tiposUsar.filter(t => Number(t.subcategoria_id) === Number(subId));
    setProductoTiposHover(tiposFiltrados);
    setProductoHoverSubcategoria({ id: subId, nombre: subNombre });
    setProductoMostrarTipos(true);
  };

  const handleProductoSubcategoriaLeave = () => {
    tiposHoverTimeoutRef.current = setTimeout(() => {
      if (!productoTiposRef.current?.matches(':hover')) {
        setProductoMostrarTipos(false);
        setProductoHoverSubcategoria(null);
        setProductoTiposHover([]);
      }
    }, 300);
  };

  const handleProductoTiposHoverEnter = () => {
    if (tiposHoverTimeoutRef.current) {
      clearTimeout(tiposHoverTimeoutRef.current);
      tiposHoverTimeoutRef.current = null;
    }
  };

  const handleProductoTiposHoverLeave = () => {
    tiposHoverTimeoutRef.current = setTimeout(() => {
      setProductoMostrarTipos(false);
      setProductoHoverSubcategoria(null);
      setProductoTiposHover([]);
    }, 300);
  };

  const handleSubcategoriaClick = (subNombre) => {
    navigate(`/subcategoria/${encodeURIComponent(subNombre)}`);
    cerrarMenuCategorias();
    setMobileMenuOpen(false);
    setMostrarTiposHover(false);
    setProductoMostrarTipos(false);
    if (tiposHoverTimeoutRef.current) {
      clearTimeout(tiposHoverTimeoutRef.current);
      tiposHoverTimeoutRef.current = null;
    }
  };

  const handleVerTodasClick = (catId) => {
    navigate(`/categoria-id/${catId}`);
    cerrarMenuCategorias();
    setMobileMenuOpen(false);
  };

  const handleTipoClick = (tipoId) => {
    navigate(`/tipo/${tipoId}`);
    cerrarMenuCategorias();
    setMostrarTiposHover(false);
    setProductoMostrarTipos(false);
    setMobileMenuOpen(false);
    if (tiposHoverTimeoutRef.current) {
      clearTimeout(tiposHoverTimeoutRef.current);
      tiposHoverTimeoutRef.current = null;
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
    cerrarMenuCategorias();
    setMobileMenuOpen(false);
    setMostrarTiposHover(false);
    setProductoMostrarTipos(false);
  };

  const irATodosLosProductos = () => {
    navigate("/productos");
    setMobileMenuOpen(false);
    cerrarMenuCategorias();
    setMenuProductosAbierto(false);
    setProductoMostrarTipos(false);
    setProductoHoverSubcategoria(null);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
    if (!mobileMenuOpen) {
      cerrarMenuCategorias();
    }
  };

  const toggleBuscador = () => {
    setMostrarBuscador(!mostrarBuscador);
    if (!mostrarBuscador) {
      setBusqueda("");
    }
  };

  const handleMobileCategoria = (catId) => {
    if (categoriaSeleccionada === catId) {
      setCategoriaSeleccionada(null);
      setSubcategoriaSeleccionada(null);
      setMostrarSubcategorias(false);
      setMostrarTipos(false);
    } else {
      setCategoriaSeleccionada(catId);
      setSubcategoriaSeleccionada(null);
      setMostrarSubcategorias(true);
      setMostrarTipos(false);
    }
  };

  const handleMobileSubcategoria = (subId) => {
    if (subcategoriaSeleccionada === subId) {
      setSubcategoriaSeleccionada(null);
      setMostrarTipos(false);
    } else {
      setSubcategoriaSeleccionada(subId);
      setMostrarTipos(true);
    }
  };

  const handleMouseEnterCategorias = (e) => {
    e.stopPropagation();
    setMenuCategoriasAbierto(true);
  };

  const handleMouseLeaveCategorias = () => {
    setTimeout(() => {
      if (!menuCategoriasRef.current?.matches(':hover')) {
        setMenuCategoriasAbierto(false);
        setCategoriaSeleccionada(null);
        setSubcategoriaSeleccionada(null);
        setMostrarSubcategorias(false);
        setMostrarTipos(false);
        setMostrarTiposHover(false);
      }
    }, 300);
  };

  const handlePedidoClick = () => {
    navigate("/pedido");
    cerrarMenuCategorias();
    setMobileMenuOpen(false);
    setMostrarTiposHover(false);
    setProductoMostrarTipos(false);
    if (tiposHoverTimeoutRef.current) {
      clearTimeout(tiposHoverTimeoutRef.current);
      tiposHoverTimeoutRef.current = null;
    }
  };

  return (
    <>
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        @keyframes shimmerBlue {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes glowPulse {
          0% { box-shadow: 0 0 20px rgba(59,130,246,0.15); }
          50% { box-shadow: 0 0 40px rgba(59,130,246,0.25); }
          100% { box-shadow: 0 0 20px rgba(59,130,246,0.15); }
        }
        @keyframes logoElectric {
          0% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(37,99,235,0.3)); }
          50% { transform: scale(1.03) rotate(-0.5deg); filter: drop-shadow(0 0 50px rgba(37,99,235,0.7)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(37,99,235,0.3)); }
        }
        @keyframes scrollSubcategorias {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .subcategorias-track {
          display: flex;
          animation: scrollSubcategorias 35s linear infinite;
          width: max-content;
        }
        .subcategorias-track:hover {
          animation-play-state: paused;
        }

        .subcategoria-item {
          flex: 0 0 auto;
          padding: 10px 28px;
          margin: 0 6px;
          background: linear-gradient(135deg, rgba(59,130,246,0.12), rgba(37,99,235,0.06));
          border: 1.5px solid rgba(59,130,246,0.2);
          border-radius: 50px;
          color: #e0e7ff;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          backdrop-filter: blur(8px);
          letter-spacing: 0.8px;
          position: relative;
          text-transform: uppercase;
          box-shadow: 0 2px 15px rgba(59,130,246,0.05);
        }

        .subcategoria-item::before {
          content: '';
          position: absolute;
          inset: -1.5px;
          border-radius: 50px;
          padding: 1.5px;
          background: linear-gradient(135deg, rgba(59,130,246,0.3), transparent, rgba(59,130,246,0.3));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .subcategoria-item:hover::before {
          opacity: 1;
        }

        .subcategoria-item:hover {
          background: linear-gradient(135deg, rgba(59,130,246,0.25), rgba(37,99,235,0.15));
          transform: translateY(-3px) scale(1.04);
          border-color: rgba(96,165,250,0.5);
          color: #ffffff;
          box-shadow: 0 8px 35px rgba(59,130,246,0.25), 0 0 60px rgba(59,130,246,0.05);
        }

        .subcategoria-item .sub-indicator {
          display: inline-block;
          margin-left: 8px;
          font-size: 10px;
          color: #60a5fa;
          transition: transform 0.3s ease;
        }

        .subcategoria-item:hover .sub-indicator {
          transform: translateX(3px) scale(1.2);
        }

        .subcategoria-item .sub-icon {
          display: inline-block;
          margin-right: 8px;
          font-size: 14px;
        }

        .subcategorias-container {
          width: 100%;
          background: linear-gradient(135deg, #0a1628, #0f2147, #0a1628);
          background-size: 300% 300%;
          animation: gradientMove 10s ease infinite;
          border-top: 2px solid rgba(59,130,246,0.15);
          border-bottom: 2px solid rgba(59,130,246,0.15);
          overflow: hidden;
          padding: 10px 0;
          position: relative;
          backdrop-filter: blur(12px);
          box-shadow: inset 0 4px 30px rgba(0,0,0,0.3), 0 4px 30px rgba(59,130,246,0.05);
          min-height: 60px;
        }

        .subcategorias-container::before,
        .subcategorias-container::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          width: 80px;
          z-index: 2;
          pointer-events: none;
        }

        .subcategorias-container::before {
          left: 0;
          background: linear-gradient(90deg, rgba(10,22,40,1) 0%, rgba(10,22,40,0.8) 50%, transparent 100%);
        }

        .subcategorias-container::after {
          right: 0;
          background: linear-gradient(270deg, rgba(10,22,40,1) 0%, rgba(10,22,40,0.8) 50%, transparent 100%);
        }

        .subcategorias-wrapper {
          display: flex;
          overflow: hidden;
          position: relative;
          width: 100%;
        }

        .tipos-hover-menu {
          position: fixed;
          background: rgba(8,12,30,0.98);
          backdrop-filter: blur(25px);
          border: 1.5px solid rgba(59,130,246,0.25);
          border-radius: 20px;
          box-shadow: 0 25px 80px rgba(0,0,0,0.9), 0 0 60px rgba(59,130,246,0.03);
          padding: 18px 22px;
          min-width: 200px;
          max-width: 400px;
          max-height: 350px;
          overflow-y: auto;
          z-index: 99999;
          animation: slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          left: 50%;
          transform: translateX(-50%);
          margin-top: 12px;
        }

        .tipos-hover-menu::-webkit-scrollbar {
          width: 3px;
        }
        .tipos-hover-menu::-webkit-scrollbar-track {
          background: rgba(59,130,246,0.03);
          border-radius: 10px;
        }
        .tipos-hover-menu::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(59,130,246,0.3), rgba(37,99,235,0.1));
          border-radius: 10px;
        }

        .tipos-hover-menu .tipo-item {
          padding: 10px 16px;
          cursor: pointer;
          color: #c7d2fe;
          font-weight: 500;
          font-size: 14px;
          transition: all 0.25s ease;
          border-radius: 10px;
          margin: 3px 0;
          border-left: 2.5px solid transparent;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tipos-hover-menu .tipo-item::before {
          content: '▸';
          color: rgba(59,130,246,0.3);
          font-size: 12px;
          transition: all 0.3s ease;
        }

        .tipos-hover-menu .tipo-item:hover {
          background: rgba(59,130,246,0.1);
          color: #ffffff;
          border-left: 2.5px solid #60a5fa;
          transform: translateX(4px);
        }

        .tipos-hover-menu .tipo-item:hover::before {
          color: #60a5fa;
          transform: translateX(3px);
        }

        .tipos-hover-menu .ver-todos {
          border-top: 1px solid rgba(59,130,246,0.1);
          padding-top: 12px;
          margin-top: 6px;
          color: #60a5fa;
          font-weight: 700;
          text-align: center;
          cursor: pointer;
          padding: 10px 16px;
          border-radius: 10px;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .tipos-hover-menu .ver-todos:hover {
          background: rgba(59,130,246,0.08);
          transform: scale(1.02);
        }

        .tipos-hover-menu .ver-todos .arrow-icon {
          transition: transform 0.3s ease;
        }

        .tipos-hover-menu .ver-todos:hover .arrow-icon {
          transform: translateX(4px);
        }

        .tipos-hover-menu .menu-header {
          border-bottom: 1.5px solid rgba(59,130,246,0.12);
          padding-bottom: 10px;
          margin-bottom: 12px;
          color: #ffffff;
          font-size: 15px;
          font-weight: 700;
          text-shadow: 0 0 30px rgba(59,130,246,0.1);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .tipos-hover-menu .menu-header .header-icon {
          color: #60a5fa;
          font-size: 14px;
        }

        .productos-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: rgba(10,10,30,0.98);
          border: 2px solid rgba(59,130,246,0.3);
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8);
          padding: 6px;
          min-width: 280px;
          max-width: 400px;
          max-height: 600px;
          overflow-y: visible !important;
          overflow-x: visible !important;
          animation: slideUp 0.25s ease;
          z-index: 99999;
          backdrop-filter: blur(10px);
        }

        .productos-dropdown-menu::-webkit-scrollbar {
          display: none !important;
        }
        .productos-dropdown-menu {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }

        .producto-submenu-tipos {
          position: absolute;
          top: -6px;
          left: calc(100% + 4px);
          background: rgba(10,10,30,0.98);
          border: 2px solid rgba(59,130,246,0.25);
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8);
          padding: 6px;
          min-width: 200px;
          max-width: 280px;
          max-height: 400px;
          overflow-y: auto;
          animation: slideUp 0.25s ease;
          z-index: 99999;
          backdrop-filter: blur(10px);
        }

        .producto-submenu-tipos::-webkit-scrollbar {
          width: 3px;
        }
        .producto-submenu-tipos::-webkit-scrollbar-track {
          background: rgba(59,130,246,0.03);
          border-radius: 10px;
        }
        .producto-submenu-tipos::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(59,130,246,0.3), rgba(37,99,235,0.1));
          border-radius: 10px;
        }

        .texto-blue {
          background: linear-gradient(90deg, #60a5fa, #3b82f6, #1d4ed8, #3b82f6, #60a5fa);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerBlue 3s linear infinite;
          text-shadow: 0 0 40px rgba(59,130,246,0.3);
        }

        .logo-electric {
          animation: logoElectric 3.5s ease-in-out infinite;
          transition: all 0.4s ease;
          cursor: pointer;
          filter: drop-shadow(0 0 20px rgba(37,99,235,0.3));
        }

        .logo-electric:hover {
          transform: scale(1.1) rotate(-2deg);
          filter: drop-shadow(0 0 60px rgba(37,99,235,0.9));
        }

        .nav-link-hover {
          cursor: pointer;
          font-weight: 700;
          font-size: clamp(18px, 1.4vw, 24px);
          padding: 12px 28px;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          position: relative;
          background: transparent;
          border: none;
          letter-spacing: 0.5px;
          color: #60a5fa;
          text-shadow: 0 0 20px rgba(59,130,246,0.4), 0 0 60px rgba(59,130,246,0.2);
        }

        .nav-link-hover:hover {
          transform: scale(1.08) translateY(-2px);
          color: #93c5fd;
          text-shadow: 0 0 30px rgba(59,130,246,0.6), 0 0 80px rgba(59,130,246,0.3);
          background: rgba(59,130,246,0.1);
          border-radius: 12px;
        }

        .nav-link-hover::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          width: 0;
          height: 3px;
          background: linear-gradient(90deg, #60a5fa, #3b82f6, #60a5fa);
          transition: all 0.3s ease;
          transform: translateX(-50%);
          border-radius: 3px;
          box-shadow: 0 0 20px rgba(59,130,246,0.5);
        }

        .nav-link-hover:hover::after {
          width: 70%;
        }

        .desktop-productos-btn {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: clamp(18px, 1.4vw, 24px);
          font-weight: 700;
          padding: 12px 28px;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          letter-spacing: 0.5px;
          position: relative;
          color: #60a5fa;
          text-shadow: 0 0 20px rgba(59,130,246,0.4), 0 0 60px rgba(59,130,246,0.2);
        }

        .desktop-productos-btn:hover {
          transform: scale(1.08) translateY(-2px);
          color: #93c5fd;
          text-shadow: 0 0 30px rgba(59,130,246,0.6), 0 0 80px rgba(59,130,246,0.3);
          background: rgba(59,130,246,0.1);
          border-radius: 12px;
        }

        .desktop-productos-btn::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 50%;
          width: 0;
          height: 3px;
          background: linear-gradient(90deg, #60a5fa, #3b82f6, #60a5fa);
          transition: all 0.3s ease;
          transform: translateX(-50%);
          border-radius: 3px;
          box-shadow: 0 0 20px rgba(59,130,246,0.5);
        }

        .desktop-productos-btn:hover::after {
          width: 70%;
        }

        .nuevos-badge {
          background: linear-gradient(135deg, #60a5fa, #3b82f6, #1d4ed8);
          color: #ffffff;
          font-size: clamp(14px, 1.2vw, 20px);
          font-weight: 800;
          padding: 10px 24px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          animation: pulse 2s ease infinite;
          box-shadow: 0 2px 30px rgba(59,130,246,0.6);
          letter-spacing: 0.5px;
          text-transform: uppercase;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .nuevos-badge:hover {
          transform: scale(1.1) !important;
          box-shadow: 0 4px 50px rgba(59,130,246,0.8) !important;
        }

        .dropdown-item {
          padding: 10px 18px;
          cursor: pointer;
          color: #bfdbfe;
          font-weight: 500;
          margin: 0;
          font-size: 15px;
          transition: all 0.2s ease;
          border-radius: 6px;
          border-left: 3px solid transparent;
          letter-spacing: 0.3px;
        }

        .dropdown-item:hover {
          transform: translateX(4px);
          background: rgba(59,130,246,0.1);
          color: #ffffff;
          border-left: 3px solid #60a5fa;
        }

        .search-toggle-btn {
          background: rgba(59,130,246,0.08);
          border: 2px solid rgba(59,130,246,0.15);
          color: #bfdbfe;
          width: 46px;
          height: 46px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(5px);
          flex-shrink: 0;
        }

        .search-toggle-btn:hover {
          background: rgba(59,130,246,0.2);
          transform: scale(1.1) rotate(5deg);
          border-color: #60a5fa;
          box-shadow: 0 0 30px rgba(59,130,246,0.15);
        }

        .search-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.92);
          backdrop-filter: blur(15px);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: slideDown 0.3s ease;
        }

        .search-overlay-content {
          width: 90%;
          max-width: 600px;
          background: rgba(26,26,46,0.98);
          border-radius: 20px;
          padding: 30px;
          border: 2px solid rgba(59,130,246,0.3);
          box-shadow: 0 20px 60px rgba(0,0,0,0.8);
          position: relative;
        }

        .search-overlay-input {
          width: 100%;
          padding: 16px 24px;
          border-radius: 35px;
          border: 2px solid rgba(59,130,246,0.2);
          outline: none;
          font-size: 18px;
          font-weight: 500;
          background: rgba(255,255,255,0.95);
          color: #111827;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }

        .search-overlay-input:focus {
          border-color: #60a5fa;
          box-shadow: 0 0 45px rgba(59,130,246,0.2);
          transform: scale(1.02);
        }

        .search-overlay-close {
          position: absolute;
          top: 20px;
          right: 30px;
          color: #fff;
          font-size: 30px;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(59,130,246,0.1);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid rgba(59,130,246,0.2);
        }

        .search-overlay-close:hover {
          transform: scale(1.1) rotate(90deg);
          background: rgba(59,130,246,0.2);
          border-color: #60a5fa;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.2s ease;
          border-bottom: 1px solid rgba(59,130,246,0.05);
        }

        .search-result-item:hover {
          background: rgba(59,130,246,0.08);
          transform: scale(1.02);
        }

        .search-result-item img {
          width: 45px;
          height: 45px;
          object-fit: cover;
          border-radius: 8px;
        }

        .search-result-item h4 {
          margin: 0;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
        }

        .search-result-item p {
          margin: 0;
          color: #94a3b8;
          font-size: 14px;
          font-weight: 500;
        }

        .links-container {
          width: 100%;
          background: linear-gradient(135deg, #0c1a3a, #1a2d6e, #0c1a3a);
          background-size: 400% 400%;
          animation: gradientMove 8s ease infinite;
          border-top: 3px solid rgba(96,165,250,0.5);
          border-bottom: 3px solid rgba(96,165,250,0.5);
          display: flex;
          justify-content: center;
          padding: 12px 0;
          box-shadow: 0 4px 40px rgba(59,130,246,0.15), inset 0 0 60px rgba(59,130,246,0.05);
          animation: glowPulse 3s ease-in-out infinite, gradientMove 8s ease infinite;
          position: relative;
          overflow: visible !important;
          min-height: 70px;
          z-index: 4999;
        }

        .links-inner {
          display: flex;
          flex-wrap: nowrap;
          justify-content: center;
          align-items: center;
          gap: 4px;
          width: 100%;
          padding: 0 10px;
          overflow: visible !important;
          position: relative;
          z-index: 1;
        }

        .dropdown-wrapper {
          position: relative;
          z-index: 99999;
        }

        .dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          left: 50%;
          transform: translateX(-50%);
          background: rgba(10,10,30,0.98);
          border: 2px solid rgba(59,130,246,0.3);
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8);
          padding: 6px;
          min-width: 220px;
          max-width: 700px;
          max-height: 600px;
          overflow-y: visible !important;
          overflow-x: visible !important;
          animation: slideUp 0.25s ease;
          z-index: 99999;
          backdrop-filter: blur(10px);
        }

        .dropdown-menu::-webkit-scrollbar {
          display: none !important;
        }
        .dropdown-menu {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }

        .dropdown-submenu {
          position: absolute;
          top: -6px;
          left: calc(100% + 4px);
          background: rgba(10,10,30,0.98);
          border: 2px solid rgba(59,130,246,0.25);
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8);
          padding: 6px;
          min-width: 220px;
          max-width: 300px;
          max-height: 600px;
          overflow-y: visible !important;
          overflow-x: visible !important;
          animation: slideUp 0.25s ease;
          z-index: 99999;
          backdrop-filter: blur(10px);
        }

        .dropdown-submenu::-webkit-scrollbar {
          display: none !important;
        }
        .dropdown-submenu {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }

        .dropdown-submenu-tipos {
          position: absolute;
          top: -6px;
          left: calc(100% + 4px);
          background: rgba(10,10,30,0.98);
          border: 2px solid rgba(59,130,246,0.25);
          border-radius: 12px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.8);
          padding: 6px;
          min-width: 200px;
          max-width: 280px;
          max-height: 600px;
          overflow-y: visible !important;
          overflow-x: visible !important;
          animation: slideUp 0.25s ease;
          z-index: 99999;
          backdrop-filter: blur(10px);
        }

        .dropdown-submenu-tipos::-webkit-scrollbar {
          display: none !important;
        }
        .dropdown-submenu-tipos {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }

        .menu-item-with-submenu {
          position: relative;
        }

        /* ===== ESTILOS MEJORADOS PARA MÓVIL ===== */
        @media (max-width: 768px) {
          .social-desktop { display: none !important; }
          .nav-links-desktop { display: none !important; }
          
          .navbar-content {
            gap: 2px !important;
            padding: 4px 8px !important;
            flex-direction: column !important;
            min-height: auto !important;
            background: rgba(10,10,26,0.98) !important;
            backdrop-filter: blur(20px) !important;
            border-bottom: 1px solid rgba(59,130,246,0.06) !important;
          }
          
          .mobile-top-row {
            display: flex !important;
            align-items: center;
            gap: 3px;
            width: 100%;
            justify-content: space-between;
            padding: 2px 0;
          }
          
          .mobile-logo {
            display: flex !important;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
            cursor: pointer;
          }
          
          .mobile-logo img {
            width: 26px !important;
            height: 26px !important;
            object-fit: contain;
          }
          
          .mobile-logo-text {
            display: block !important;
            font-size: 11px !important;
            font-weight: 700 !important;
            color: #ffffff !important;
            letter-spacing: 0.3px;
          }
          
          .mobile-logo-text span {
            color: #3b82f6 !important;
          }
          
          .mobile-social {
            display: flex !important;
            align-items: center;
            gap: 2px;
            flex-shrink: 0;
          }
          
          .mobile-social a {
            width: 24px !important;
            height: 24px !important;
            min-width: 24px !important;
            min-height: 24px !important;
            font-size: 8px !important;
            border-radius: 50% !important;
            border: 1px solid rgba(255,255,255,0.04) !important;
          }
          
          .mobile-search-btn {
            background: rgba(59,130,246,0.06);
            border: 1px solid rgba(59,130,246,0.1);
            color: #bfdbfe;
            width: 28px;
            height: 28px;
            min-width: 28px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            flex-shrink: 0;
            font-size: 10px;
          }
          
          .mobile-search-btn:hover {
            background: rgba(59,130,246,0.15);
            border-color: #60a5fa;
            transform: scale(1.05);
          }
          
          .mobile-hamburger-btn {
            width: 28px !important;
            height: 28px !important;
            min-width: 28px !important;
            border-radius: 6px !important;
            background: rgba(59,130,246,0.06);
            border: 1px solid rgba(59,130,246,0.1);
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            flex-shrink: 0;
            position: relative;
            z-index: 10001;
            font-size: 10px;
          }
          
          .mobile-hamburger-btn:hover {
            background: rgba(59,130,246,0.12);
            border-color: #60a5fa;
          }
          
          .mobile-nav-links {
            display: flex !important;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1px;
            padding: 3px 0 1px 0;
            border-top: 1px solid rgba(59,130,246,0.03);
            width: 100%;
          }
          
          .mobile-nav-link {
            font-size: 9px;
            font-weight: 600;
            padding: 2px 6px;
            border-radius: 3px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: transparent;
            border: none;
            color: #94a3b8;
            text-shadow: 0 0 20px rgba(59,130,246,0.03);
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 1px;
          }
          
          .mobile-nav-link:hover {
            transform: scale(1.05);
            color: #60a5fa;
            text-shadow: 0 0 30px rgba(59,130,246,0.15);
            background: rgba(59,130,246,0.04);
          }
          
          .mobile-nav-link .nuevos-badge {
            font-size: 5px !important;
            padding: 1px 4px !important;
            animation: pulse 2s ease infinite;
            box-shadow: 0 2px 8px rgba(59,130,246,0.2);
          }
          
          .mobile-dropdown-menu {
            display: block !important;
            position: absolute;
            top: 100%;
            left: -8px;
            right: -8px;
            background: rgba(10,10,30,0.98);
            backdrop-filter: blur(20px);
            border-radius: 0 0 14px 14px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.6);
            padding: 4px 0;
            max-height: calc(100vh - 80px);
            overflow-y: auto;
            animation: slideDown 0.3s ease;
            z-index: 10000;
            border-top: 2px solid rgba(59,130,246,0.2);
            margin-top: 2px;
            width: calc(100% + 16px);
          }
          
          .mobile-dropdown-menu::-webkit-scrollbar {
            width: 2px;
          }
          .mobile-dropdown-menu::-webkit-scrollbar-track {
            background: transparent;
          }
          .mobile-dropdown-menu::-webkit-scrollbar-thumb {
            background: rgba(59,130,246,0.3);
            border-radius: 10px;
          }
          
          .mobile-menu-item {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
            background: transparent;
            width: 100%;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            border-radius: 4px;
            color: #c7d2fe;
            text-shadow: 0 0 20px rgba(59,130,246,0.03);
          }
          
          .mobile-menu-item:hover {
            transform: scale(1.02);
            color: #ffffff;
            text-shadow: 0 0 30px rgba(59,130,246,0.15);
            background: rgba(59,130,246,0.05);
          }
          
          .mobile-menu-item .nuevos-badge {
            font-size: 8px !important;
            padding: 1px 6px !important;
          }
          
          .links-container { display: none !important; }
          .subcategorias-container { display: none !important; }
          .search-toggle-btn { display: none !important; }
          .dropdown-wrapper { display: none !important; }
          
          .tipos-hover-menu { 
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 90% !important;
            max-width: 330px !important;
            z-index: 999999 !important;
            margin-top: 0 !important;
          }
        }

        @media (min-width: 769px) {
          .social-desktop { display: flex !important; }
          .mobile-nav-links { display: none !important; }
          .mobile-logo { display: none !important; }
          .mobile-logo-text { display: none !important; }
          .mobile-social { display: none !important; }
          .mobile-dropdown-menu { display: none !important; }
          .mobile-top-row { display: none !important; }
          .mobile-search-btn { display: none !important; }
          .search-toggle-btn { display: flex !important; }
          .links-container { display: flex !important; }
          .subcategorias-container { display: block !important; }
          .mobile-hamburger-btn { display: none !important; }
        }

        .navbar-spacer { display: none !important; }
        @media (min-width: 769px) {
          .navbar-spacer { display: block !important; }
        }
      `}</style>

      {/* ===== NAVBAR PRINCIPAL ===== */}
      <div 
        ref={navbarRef}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: "100%",
          padding: isMobileView ? "3px 8px" : "16px 24px",
          background: darkMode ? "#0a0a1a" : "#0a0a2a",
          color: "#fff",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 5000,
          boxShadow: isMobileView 
            ? "0 2px 12px rgba(0,0,0,0.3)" 
            : "0 4px 40px rgba(59,130,246,0.08)",
          borderBottom: isMobileView 
            ? "1px solid rgba(59,130,246,0.04)" 
            : "none",
          boxSizing: "border-box",
          minHeight: isMobileView ? "auto" : "160px",
          transform: isNavbarVisible ? 'translateY(0)' : 'translateY(-100%)',
          opacity: isNavbarVisible ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: isNavbarVisible ? 'auto' : 'none',
        }}
        className="navbar-content"
      >
        {/* ===== VERSIÓN ESCRITORIO ===== */}
        {!isMobileView && (
          <>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              maxWidth: '1400px',
              gap: '20px',
              padding: '10px 0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, cursor: 'pointer' }}
                onClick={() => navigate("/")}
              >
                <img
                  src="/logo.png"
                  alt="FRAY FLOORING"
                  className="logo-electric"
                  style={{
                    height: '120px',
                    width: 'auto',
                    maxHeight: '130px',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                flex: 1,
                justifyContent: 'center'
              }}>
                <span className="texto-blue" style={{
                  fontSize: 'clamp(52px, 7vw, 90px)',
                  fontWeight: '900',
                  letterSpacing: '6px',
                  whiteSpace: 'nowrap'
                }}>
                  Fray
                </span>
                <span style={{
                  fontSize: 'clamp(32px, 4.5vw, 58px)',
                  fontWeight: '700',
                  letterSpacing: '10px',
                  whiteSpace: 'nowrap',
                  color: '#ffffff',
                  textShadow: '0 0 40px rgba(255,255,255,0.15)',
                }}>
                  Flooring
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0 }}>
                <div className="social-desktop" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SocialIcon color="#1877F2" href="https://www.facebook.com/people/FRAY-Flooring/61587688868988/">
                    <FaFacebookF size={20} />
                  </SocialIcon>
                  <SocialIcon color="#E4405F" href="https://www.instagram.com/fray_flooring?igsh=b3pucDR1bjltMGQ2">
                    <FaInstagram size={20} />
                  </SocialIcon>
                  <SocialIcon color="#010101" href="https://www.tiktok.com/@fray_flooring6">
                    <FaTiktok size={20} />
                  </SocialIcon>
                  <SocialIcon color="#25D366" href="https://wa.me/525610026370">
                    <FaWhatsapp size={20} />
                  </SocialIcon>
                  <SocialIcon color="#FF0000" href="https://www.youtube.com/@FrayFlooring" isYoutube={true}>
                    <FaYoutube size={20} />
                  </SocialIcon>
                  <SocialIcon color="#38bdf8" href="tel:+525610026370">
                    <FaPhone size={20} />
                  </SocialIcon>
                </div>
                <button className="search-toggle-btn" onClick={toggleBuscador}>
                  <FaSearch size={22} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* ===== VERSIÓN MÓVIL OPTIMIZADA ===== */}
        {isMobileView && (
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '1px',
            padding: '1px 0',
            position: 'relative'
          }}>
            {/* Fila superior: Logo | Social | Botones */}
            <div className="mobile-top-row">
              <div className="mobile-logo" onClick={() => navigate("/")}>
                <img src="/logo.png" alt="Logo" />
                <span className="mobile-logo-text">
                  <span>Fray</span> Flooring
                </span>
              </div>

              <div className="mobile-social">
                <SocialIcon color="#1877F2" href="https://www.facebook.com/people/FRAY-Flooring/61587688868988/" size="small">
                  <FaFacebookF />
                </SocialIcon>
                <SocialIcon color="#E4405F" href="https://www.instagram.com/fray_flooring?igsh=b3pucDR1bjltMGQ2" size="small">
                  <FaInstagram />
                </SocialIcon>
                <SocialIcon color="#010101" href="https://www.tiktok.com/@fray_flooring6" size="small">
                  <FaTiktok />
                </SocialIcon>
                <SocialIcon color="#25D366" href="https://wa.me/525610026370" size="small">
                  <FaWhatsapp />
                </SocialIcon>
                <SocialIcon color="#FF0000" href="https://www.youtube.com/@FrayFlooring" size="small" isYoutube={true}>
                  <FaYoutube />
                </SocialIcon>
                <SocialIcon color="#38bdf8" href="tel:+525610026370" size="small">
                  <FaPhone />
                </SocialIcon>
              </div>

              <button className="mobile-search-btn" onClick={toggleBuscador}>
                <FaSearch size={10} />
              </button>

              <button 
                className="mobile-hamburger-btn"
                onClick={toggleMobileMenu}
                style={{
                  background: mobileMenuOpen ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.04)',
                  border: mobileMenuOpen ? '1px solid #60a5fa' : '1px solid rgba(59,130,246,0.08)',
                }}
              >
                {mobileMenuOpen ? <FaTimes size={10} /> : <FaBars size={10} />}
              </button>
            </div>

            {/* Navegación rápida */}
            <div className="mobile-nav-links">
              <button className="mobile-nav-link" onClick={() => navigate("/")}>
                <FaHome size={7} /> Inicio
              </button>
              <button className="mobile-nav-link" onClick={() => navigate("/nosotros")}>
                <FaInfoCircle size={7} /> Nosotros
              </button>
              <button className="mobile-nav-link" onClick={() => navigate("/contacto")}>
                <FaEnvelope size={7} /> Contacto
              </button>
              <button className="mobile-nav-link" onClick={handlePedidoClick}>
                Pedido
              </button>
              <button className="mobile-nav-link" onClick={() => navigate("/#productos-nuevos")}>
                <span className="nuevos-badge">✨NUEVOS</span>
              </button>
            </div>

            {/* Menú desplegable móvil */}
            {mobileMenuOpen && (
              <div className="mobile-dropdown-menu">
                <button className="mobile-menu-item" onClick={() => handleNavigate("/")}>
                  <FaHome size={12} color="#60a5fa" /> Inicio
                </button>
                <button className="mobile-menu-item" onClick={() => handleNavigate("/nosotros")}>
                  <FaInfoCircle size={12} color="#60a5fa" /> Nosotros
                </button>
                <button className="mobile-menu-item" onClick={() => handleNavigate("/contacto")}>
                  <FaEnvelope size={12} color="#60a5fa" /> Contacto
                </button>
                <button className="mobile-menu-item" onClick={handlePedidoClick} style={{ fontWeight: '700', color: '#60a5fa' }}>
                  Pedido
                </button>
                <div style={{ height: '1px', background: 'rgba(59,130,246,0.04)', margin: '2px 10px' }} />
                
                <button className="mobile-menu-item" onClick={irATodosLosProductos} style={{ fontWeight: '700', color: '#60a5fa' }}>
                  🛍 Todos los productos
                </button>
                
                <button className="mobile-menu-item" onClick={() => setProductosMobileOpen(!productosMobileOpen)}>
                  <span>📦 Categorías</span>
                  <span style={{ marginLeft: 'auto' }}>{productosMobileOpen ? '▲' : '▼'}</span>
                </button>
                {productosMobileOpen && (
                  <div style={{ marginLeft: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                    {categorias.map(cat => (
                      <button key={cat.id} className="mobile-menu-item"
                        onClick={() => { handleVerTodasClick(cat.id); setMobileMenuOpen(false); }}
                        style={{ paddingLeft: '24px', fontSize: '11px' }}>
                        {cat.nombre}
                      </button>
                    ))}
                  </div>
                )}
                
                <button className="mobile-menu-item" onClick={() => { navigate("/#productos-nuevos"); setMobileMenuOpen(false); }}>
                  <span className="nuevos-badge" style={{ fontSize: '9px', padding: '1px 8px' }}>✨ NUEVOS</span>
                </button>
                
                <button className="mobile-menu-item" onClick={() => setCategoriasMobileOpen(!categoriasMobileOpen)}>
                  <span>📂 Subcategorías</span>
                  <span style={{ marginLeft: 'auto' }}>{categoriasMobileOpen ? '▲' : '▼'}</span>
                </button>
                {categoriasMobileOpen && (
                  <div style={{ marginLeft: '4px', maxHeight: '200px', overflowY: 'auto' }}>
                    {categorias.map(cat => (
                      <div key={cat.id}>
                        <button className="mobile-menu-item" onClick={() => handleMobileCategoria(cat.id)}
                          style={{ 
                            fontWeight: categoriaSeleccionada === cat.id ? '700' : '500',
                            color: categoriaSeleccionada === cat.id ? '#60a5fa' : '#c7d2fe',
                            paddingLeft: '24px',
                            fontSize: '11px'
                          }}>
                          {cat.nombre} {categoriaSeleccionada === cat.id ? '▼' : '►'}
                        </button>
                        {categoriaSeleccionada === cat.id && (
                          <div style={{ marginLeft: '8px' }}>
                            {subcategorias.filter(sub => Number(sub.categoria_id) === Number(cat.id)).map(sub => (
                              <div key={sub.id}>
                                <button className="mobile-menu-item" onClick={() => handleMobileSubcategoria(sub.id)}
                                  style={{ 
                                    fontWeight: subcategoriaSeleccionada === sub.id ? '700' : '500',
                                    color: subcategoriaSeleccionada === sub.id ? '#60a5fa' : '#c7d2fe',
                                    paddingLeft: '38px',
                                    fontSize: '10px'
                                  }}>
                                  • {sub.nombre} {subcategoriaSeleccionada === sub.id ? '▼' : '►'}
                                </button>
                                {subcategoriaSeleccionada === sub.id && (
                                  <div style={{ marginLeft: '8px' }}>
                                    {tiposUsar.filter(t => Number(t.subcategoria_id) === Number(sub.id)).map(tipo => (
                                      <button key={tipo.id} className="mobile-menu-item"
                                        onClick={() => { handleTipoClick(tipo.id); setMobileMenuOpen(false); }}
                                        style={{ fontSize: '9px', paddingLeft: '52px', color: '#94a3b8' }}>
                                        • {tipo.nombre}
                                      </button>
                                    ))}
                                    <button className="mobile-menu-item"
                                      onClick={() => { handleSubcategoriaClick(sub.nombre); setMobileMenuOpen(false); }}
                                      style={{ color: '#60a5fa', fontWeight: '600', paddingLeft: '52px', fontSize: '10px' }}>
                                      📂 Ver toda la subcategoría
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                            <button className="mobile-menu-item"
                              onClick={() => { handleVerTodasClick(cat.id); setMobileMenuOpen(false); }}
                              style={{ color: '#60a5fa', fontWeight: '700', paddingLeft: '38px', fontSize: '11px' }}>
                              📂 Ver toda la categoría
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ===== CONTENEDOR DE LINKS (Desktop) ===== */}
      {!isMobileView && (
        <div 
          ref={linksContainerRef}
          className="links-container"
          style={{
            position: 'fixed',
            top: isNavbarVisible ? '160px' : '-100%',
            left: 0,
            right: 0,
            zIndex: 4999,
            transform: isNavbarVisible ? 'translateY(0)' : 'translateY(-100%)',
            opacity: isNavbarVisible ? 1 : 0,
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isNavbarVisible ? 'auto' : 'none',
            padding: '12px 0',
            minHeight: '70px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'visible !important'
          }}
        >
          <div className="links-inner">
            <button onClick={() => navigate("/")} className="nav-link-hover">Inicio</button>

            <div 
              ref={productosMenuRef}
              style={{ 
                position: 'relative', 
                display: 'inline-block',
                zIndex: 99999
              }}
              onMouseEnter={handleProductosMouseEnter}
              onMouseLeave={handleProductosMouseLeave}
            >
              <button className="desktop-productos-btn">Productos</button>

              {menuProductosAbierto && (
                <div className="productos-dropdown-menu">
                  <div 
                    className="dropdown-item"
                    onClick={irATodosLosProductos}
                    style={{
                      padding: '10px 18px',
                      cursor: 'pointer',
                      color: '#bfdbfe',
                      fontWeight: '700',
                      fontSize: '15px',
                      transition: 'all 0.2s ease',
                      borderRadius: '6px',
                      borderLeft: '3px solid #60a5fa',
                      background: 'rgba(59,130,246,0.05)',
                      marginBottom: '4px'
                    }}
                  >
                    🛍 Todos nuestros productos
                  </div>

                  <div style={{ height: '1px', background: 'rgba(59,130,246,0.1)', margin: '4px 8px' }} />

                  {subcategorias && subcategorias.length > 0 ? (
                    subcategorias.map(sub => {
                      const tiposDeSub = tiposUsar.filter(t => Number(t.subcategoria_id) === Number(sub.id));
                      return (
                        <div 
                          key={sub.id}
                          className="menu-item-with-submenu"
                          style={{ position: 'relative' }}
                          onMouseEnter={() => handleProductoSubcategoriaHover(sub.id, sub.nombre)}
                          onMouseLeave={handleProductoSubcategoriaLeave}
                        >
                          <div 
                            className="dropdown-item"
                            onClick={() => handleSubcategoriaClick(sub.nombre)}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '8px 16px',
                              cursor: 'pointer',
                              color: '#bfdbfe',
                              fontWeight: '500',
                              fontSize: '14px',
                              transition: 'all 0.2s ease',
                              borderRadius: '6px',
                              borderLeft: '3px solid transparent'
                            }}
                          >
                            <span>{sub.nombre}</span>
                            {tiposDeSub.length > 0 && (
                              <span style={{ fontSize: '12px', color: '#60a5fa' }}>▸</span>
                            )}
                          </div>

                          {productoMostrarTipos && productoHoverSubcategoria?.id === sub.id && tiposDeSub.length > 0 && (
                            <div 
                              ref={productoTiposRef}
                              className="producto-submenu-tipos"
                              onMouseEnter={handleProductoTiposHoverEnter}
                              onMouseLeave={handleProductoTiposHoverLeave}
                            >
                              <div style={{ 
                                padding: '6px 12px 8px', 
                                color: '#ffffff', 
                                fontSize: '13px', 
                                fontWeight: '700',
                                borderBottom: '1px solid rgba(59,130,246,0.1)',
                                marginBottom: '4px'
                              }}>
                                📦 {sub.nombre}
                              </div>
                              {tiposDeSub.map(tipo => (
                                <div 
                                  key={tipo.id} 
                                  className="dropdown-item"
                                  onClick={() => handleTipoClick(tipo.id)}
                                  style={{
                                    padding: '8px 16px',
                                    cursor: 'pointer',
                                    color: '#c7d2fe',
                                    fontWeight: '500',
                                    fontSize: '13px',
                                    transition: 'all 0.2s ease',
                                    borderRadius: '6px',
                                    borderLeft: '2.5px solid transparent'
                                  }}
                                >
                                  • {tipo.nombre}
                                </div>
                              ))}
                              <div style={{ height: '1px', background: 'rgba(59,130,246,0.08)', margin: '4px 8px' }} />
                              <div 
                                className="dropdown-item"
                                onClick={() => handleSubcategoriaClick(sub.nombre)}
                                style={{
                                  padding: '8px 16px',
                                  cursor: 'pointer',
                                  color: '#60a5fa',
                                  fontWeight: '700',
                                  fontSize: '13px',
                                  transition: 'all 0.2s ease',
                                  borderRadius: '6px',
                                  borderLeft: '2.5px solid transparent',
                                  textAlign: 'center'
                                }}
                              >
                                📂 Ver todas las lineas
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '10px 16px', color: '#94a3b8', fontSize: '14px' }}>
                      No hay subcategorías disponibles
                    </div>
                  )}
                </div>
              )}
            </div>

            <button onClick={() => navigate("/nosotros")} className="nav-link-hover">Nosotros</button>
            <button onClick={() => navigate("/contacto")} className="nav-link-hover">Contacto</button>

            <button onClick={() => navigate("/#productos-nuevos")} className="nuevos-badge">
              NUEVOS PRODUCTOS
            </button>
            
            <button onClick={handlePedidoClick} className="nav-link-hover" style={{ color: '#93c5fd' }}>
              Pedido
            </button>
            
            <button onClick={() => navigate("/favoritos")} className="nav-link-hover">
              Favoritos {favoritos.length}
            </button>
            <button onClick={() => navigate("/comparar")} className="nav-link-hover">Comparador</button>
            <button onClick={() => navigate("/cotizador")} className="nav-link-hover">Cotizador</button>
          </div>
        </div>
      )}

      {/* ===== SUBCATEGORÍAS SCROLL (Desktop) ===== */}
      {!isMobileView && subcategorias && subcategorias.length > 0 && (
        <div 
          ref={subcategoriasScrollRef}
          className="subcategorias-container"
          style={{
            position: 'fixed',
            top: isNavbarVisible ? '260px' : '-100%',
            left: 0,
            right: 0,
            zIndex: 4998,
            transform: isNavbarVisible ? 'translateY(0)' : 'translateY(-100%)',
            opacity: isNavbarVisible ? 1 : 0,
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isNavbarVisible ? 'auto' : 'none',
          }}
        >
          <div className="subcategorias-wrapper">
            <div className="subcategorias-track">
              {subcategorias.map((sub) => (
                <span 
                  key={sub.id} 
                  className="subcategoria-item"
                  onMouseEnter={() => handleSubcategoriaHoverScroll(sub.id, sub.nombre)}
                  onMouseLeave={handleSubcategoriaLeaveScroll}
                  onClick={() => handleSubcategoriaClick(sub.nombre)}
                >
                  <span className="sub-icon">✦</span>
                  {sub.nombre} 
                  <span className="sub-indicator">▸</span>
                </span>
              ))}
            </div>
            <div className="subcategorias-track">
              {subcategorias.map((sub) => (
                <span 
                  key={`dup-${sub.id}`} 
                  className="subcategoria-item"
                  onMouseEnter={() => handleSubcategoriaHoverScroll(sub.id, sub.nombre)}
                  onMouseLeave={handleSubcategoriaLeaveScroll}
                  onClick={() => handleSubcategoriaClick(sub.nombre)}
                >
                  <span className="sub-icon">✦</span>
                  {sub.nombre} 
                  <span className="sub-indicator">▸</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== MENÚ DE TIPOS HOVER ===== */}
      {mostrarTiposHover && subcategoriaHover && tiposDeSubcategoriaHover.length > 0 && (
        <div 
          ref={tiposMenuRef}
          className="tipos-hover-menu"
          style={{
            top: isNavbarVisible ? '316px' : '-100%',
            opacity: isNavbarVisible ? 1 : 0,
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={handleTiposHoverEnter}
          onMouseLeave={handleTiposHoverLeave}
        >
          <div className="menu-header">
            <span className="header-icon"><FaChevronRight size={14} /></span>
            {subcategoriaHover.nombre}
          </div>
          
          {tiposDeSubcategoriaHover.map(tipo => (
            <div 
              key={tipo.id} 
              className="tipo-item"
              onClick={() => handleTipoClick(tipo.id)}
            >
              {tipo.nombre}
            </div>
          ))}
          
          <div 
            className="ver-todos"
            onClick={() => handleSubcategoriaClick(subcategoriaHover.nombre)}
          >
            Ver toda la linea
            <span className="arrow-icon"><FaArrowRight size={12} /></span>
          </div>
        </div>
      )}

      {/* ===== OVERLAY DE BÚSQUEDA ===== */}
      {mostrarBuscador && (
        <div className="search-overlay" onClick={toggleBuscador}>
          <div className="search-overlay-content" onClick={(e) => e.stopPropagation()}>
            <button className="search-overlay-close" onClick={toggleBuscador}>
              <FaTimes size={24} />
            </button>
            <input
              type="text"
              placeholder="🔍 Buscar productos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  navigate(`/productos?buscar=${encodeURIComponent(busqueda)}`);
                  toggleBuscador();
                }
              }}
              className="search-overlay-input"
              autoFocus
            />
            {busqueda.trim() !== "" && (
              <div style={{ marginTop: '16px', maxHeight: '350px', overflowY: 'auto' }}>
                {productosFiltrados.slice(0, 8).map((p) => (
                  <div key={p.id} className="search-result-item"
                    onClick={() => { navigate(`/producto/${p.id}`); toggleBuscador(); }}>
                    {/* 🔥 IMAGEN CORREGIDA */}
                    <img 
                      src={obtenerImagen(p)} 
                      alt={p.nombre}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/200?text=Sin+imagen";
                      }}
                    />
                    <div>
                      <h4>{p.nombre}</h4>
                      <p>${p.precio}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===== SPACER ===== */}
      <div 
        className="navbar-spacer"
        style={{ 
          height: isMobileView ? 'auto' : `${navbarHeight}px`,
          display: isMobileView ? 'none' : 'block',
          flexShrink: 0,
          width: '100%',
          pointerEvents: 'none'
        }} 
      />
    </>
  );
}