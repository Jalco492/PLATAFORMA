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
  FaChevronLeft,
  FaCreditCard,
  FaMoneyBillWave,
  FaCalendarCheck,
  FaGift,
} from "react-icons/fa";
import api from "../services/api";

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

  const [menuProductosAbierto, setMenuProductosAbierto] = useState(false);
  const [menuCategoriasAbierto, setMenuCategoriasAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
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

  const menuCategoriasRef = useRef(null);
  const navbarRef = useRef(null);
  const linksContainerRef = useRef(null);
  const categoriasScrollRef = useRef(null);
  const tiposHoverTimeoutRef = useRef(null);
  const tiposMenuRef = useRef(null);
  const productosMenuRef = useRef(null);
  const productoTiposRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // ===== COLORES PARA LAS CATEGORÍAS =====
  const categoryColors = [
    { bg: 'linear-gradient(135deg, #FF6B6B, #EE5A24)', border: '#EE5A24', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #FECA57, #FF9F43)', border: '#FF9F43', text: '#2d3436' },
    { bg: 'linear-gradient(135deg, #48DBFB, #0ABDE3)', border: '#0ABDE3', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #FF9FF3, #F368E0)', border: '#F368E0', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #54A0FF, #2E86DE)', border: '#2E86DE', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #5F27CD, #341F97)', border: '#341F97', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #1DD1A1, #10AC84)', border: '#10AC84', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #FF6B6B, #EE5A24)', border: '#EE5A24', text: '#ffffff' },
    { bg: 'linear-gradient(135deg, #F8A5C2, #F78FB3)', border: '#F78FB3', text: '#2d3436' },
  ];

  // ===== CATEGORÍAS A MOSTRAR =====
  const categoriasMostrar = subcategorias.length > 0 ? subcategorias : categorias;

  // ===== BÚSQUEDA EN TIEMPO REAL =====
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (busqueda.trim().length > 0) {
        const texto = busqueda.toLowerCase().trim();
        const filtrados = productos.filter((p) => {
          return (
            (p.nombre || "").toLowerCase().includes(texto) ||
            (p.descripcion || "").toLowerCase().includes(texto) ||
            (p.categoria || "").toLowerCase().includes(texto) ||
            (p.subcategoria || "").toLowerCase().includes(texto) ||
            (p.sku || "").toString().toLowerCase().includes(texto)
          );
        });
        setResultadosBusqueda(filtrados.slice(0, 6));
        setMostrarResultados(true);
      } else {
        setResultadosBusqueda([]);
        setMostrarResultados(false);
      }
    }, 200);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [busqueda, productos]);

  // Limpiar menús al cambiar de ruta
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
    setMostrarResultados(false);
    setResultadosBusqueda([]);
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
      const subH = categoriasScrollRef.current ? categoriasScrollRef.current.offsetHeight : 0;
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
    if (categoriasScrollRef.current) {
      resizeObserver.observe(categoriasScrollRef.current);
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

  const scrollCategories = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 350;
      const newPosition = scrollContainerRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
      scrollContainerRef.current.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
    }
  };

  const obtenerImagen = (producto) => {
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

  const SocialIcon = ({ children, color, href, size = "normal", isYoutube = false }) => {
    const isMobileIcon = size === "small";
    const sizePx = isMobileIcon ? "26px" : "46px";
    const iconSize = isMobileIcon ? "10px" : "18px";
    
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: isMobileIcon ? "50%" : "12px",
          cursor: "pointer",
          textDecoration: "none",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          width: sizePx,
          height: sizePx,
          minWidth: sizePx,
          minHeight: sizePx,
          background: isYoutube ? "#ffffff" : color,
          color: isYoutube ? "#FF0000" : "#ffffff",
          border: isMobileIcon ? "1px solid rgba(255,255,255,0.06)" : "2px solid rgba(255,255,255,0.1)",
          fontSize: iconSize,
          boxShadow: isYoutube ? "0 2px 12px rgba(255,0,0,0.12)" : `0 2px 12px ${color}30`,
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.12)";
          e.currentTarget.style.boxShadow = "0 4px 30px rgba(59,130,246,0.3)";
          e.currentTarget.style.borderColor = "#60a5fa";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = isYoutube ? "0 2px 12px rgba(255,0,0,0.12)" : `0 2px 12px ${color}30`;
          e.currentTarget.style.borderColor = isMobileIcon ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.1)";
        }}
      >
        {children}
      </a>
    );
  };

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
    setMostrarResultados(false);
    setResultadosBusqueda([]);
    setBusqueda("");
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
      setResultadosBusqueda([]);
      setMostrarResultados(false);
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

  // ===== FUNCIÓN PARA IR A LA SECCIÓN DE OFERTAS - COMO EL BOTÓN DE NUEVOS PRODUCTOS =====
  const irAOfertas = () => {
    // Cerrar menús
    cerrarMenuCategorias();
    setMobileMenuOpen(false);
    setMostrarTiposHover(false);
    setProductoMostrarTipos(false);
    if (tiposHoverTimeoutRef.current) {
      clearTimeout(tiposHoverTimeoutRef.current);
      tiposHoverTimeoutRef.current = null;
    }
    
    // Navegar a la página principal con el hash #ofertas
    navigate("/#ofertas");
    
    // Hacer scroll a la sección de ofertas después de que la página cargue
    setTimeout(() => {
      // Buscar la sección de ofertas
      let ofertasSection = document.getElementById('productos-oferta');
      
      if (!ofertasSection) {
        ofertasSection = document.querySelector('[class*="ofertaProductosWrapper"]');
      }
      
      if (!ofertasSection) {
        const allElements = document.querySelectorAll('h2, h1, div, section');
        for (let el of allElements) {
          if (el.textContent && el.textContent.includes('Productos en Oferta')) {
            let parent = el;
            for (let i = 0; i < 5; i++) {
              if (parent.parentElement) {
                parent = parent.parentElement;
                if (parent.className && parent.className.includes('oferta')) {
                  ofertasSection = parent;
                  break;
                }
              }
            }
            if (!ofertasSection) {
              ofertasSection = el.closest('div') || el;
            }
            break;
          }
        }
      }
      
      if (ofertasSection) {
        ofertasSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 500);
  };

  // ===== FUNCIÓN PARA BUSCAR =====
  const handleSearchSubmit = () => {
    if (busqueda.trim()) {
      navigate(`/productos?buscar=${encodeURIComponent(busqueda)}`);
      setMostrarResultados(false);
      setResultadosBusqueda([]);
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
        @keyframes logoElectric {
          0% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(37,99,235,0.3)); }
          50% { transform: scale(1.05); filter: drop-shadow(0 0 60px rgba(37,99,235,0.6)); }
          100% { transform: scale(1); filter: drop-shadow(0 0 20px rgba(37,99,235,0.3)); }
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* ===== CONTENEDOR DE PAGOS - MÁS GRANDE ===== */
        .pagos-container {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255,255,255,0.03);
          padding: 4px 14px;
          border-radius: 25px;
          border: 1px solid rgba(255,255,255,0.06);
          flex-shrink: 0;
          flex-wrap: nowrap;
          height: 40px;
        }

        .pagos-container .pago-item {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 10px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 500;
          color: #94a3b8;
          white-space: nowrap;
          transition: all 0.3s ease;
          height: 28px;
        }

        .pagos-container .pago-item:hover {
          background: rgba(59,130,246,0.08);
          color: #e2e8f0;
          transform: scale(1.05);
        }

        .pagos-container .pago-item .pago-icon {
          font-size: 14px;
          color: #60a5fa;
        }

        .pagos-container .pago-item.highlight {
          color: #60a5fa;
          font-weight: 600;
        }

        .pagos-container .pago-item.highlight .pago-icon {
          color: #f093fb;
        }

        /* ===== CONTENEDOR DE CATEGORÍAS - MÁS ALTO ===== */
        .categorias-container {
          width: 100%;
          min-height: 140px;
          max-height: 160px;
          background: linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 100%);
          backdrop-filter: blur(12px);
          border-top: 2px solid rgba(59,130,246,0.15);
          border-bottom: 2px solid rgba(59,130,246,0.15);
          padding: 12px 20px;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
          box-shadow: 0 4px 40px rgba(0,0,0,0.3);
        }

        .categorias-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(59,130,246,0.03), transparent);
          background-size: 200% 100%;
          animation: gradientMove 6s ease-in-out infinite;
          pointer-events: none;
        }

        .categorias-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 10px 10px 10px;
          border-bottom: 2px solid rgba(59,130,246,0.1);
          margin-bottom: 10px;
          flex-shrink: 0;
          position: relative;
          z-index: 1;
        }

        .categorias-title {
          font-size: 20px;
          font-weight: 800;
          background: linear-gradient(90deg, #60a5fa, #a78bfa, #60a5fa);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: 2px;
          display: flex;
          align-items: center;
          gap: 12px;
          text-transform: uppercase;
        }

        .categorias-title .title-icon {
          color: #60a5fa;
          font-size: 18px;
          -webkit-text-fill-color: initial;
          background: none;
        }

        .ver-todos-btn {
          background: linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.2));
          border: 2px solid rgba(59,130,246,0.3);
          color: #93c5fd;
          padding: 8px 22px;
          border-radius: 22px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          height: 36px;
        }

        .ver-todos-btn:hover {
          background: linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.3));
          border-color: #60a5fa;
          transform: scale(1.05);
          box-shadow: 0 4px 30px rgba(59,130,246,0.2);
        }

        .ver-todos-btn .btn-arrow {
          transition: transform 0.3s ease;
        }

        .ver-todos-btn:hover .btn-arrow {
          transform: translateX(6px);
        }

        .categorias-scroll-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          flex: 1;
          min-height: 55px;
          padding: 0 50px;
          z-index: 1;
        }

        .categorias-scroll {
          display: flex;
          gap: 12px;
          overflow-x: auto;
          scroll-behavior: smooth;
          padding: 4px 0;
          flex: 1;
          -ms-overflow-style: none;
          scrollbar-width: none;
          align-items: center;
        }

        .categorias-scroll::-webkit-scrollbar {
          display: none;
        }

        /* ===== FLECHAS CENTRADAS ===== */
        .scroll-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(15,23,42,0.95);
          backdrop-filter: blur(12px);
          border: 2.5px solid rgba(59,130,246,0.3);
          color: #93c5fd;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 20;
          font-size: 14px;
          box-shadow: 0 4px 30px rgba(0,0,0,0.4), 0 0 30px rgba(59,130,246,0.05);
          opacity: 1 !important;
          pointer-events: auto !important;
        }

        .scroll-arrow:hover {
          background: rgba(59,130,246,0.2);
          border-color: #60a5fa;
          transform: translateY(-50%) scale(1.12);
          box-shadow: 0 8px 40px rgba(59,130,246,0.3);
          color: #ffffff;
        }

        .scroll-arrow:active {
          transform: translateY(-50%) scale(0.92);
        }

        .scroll-arrow-left {
          left: 6px;
        }

        .scroll-arrow-right {
          right: 6px;
        }

        /* ===== ITEMS DE CATEGORÍA ===== */
        .categoria-item {
          flex: 0 0 auto;
          padding: 8px 22px;
          min-width: 110px;
          border-radius: 14px;
          color: #ffffff;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          letter-spacing: 0.5px;
          position: relative;
          text-transform: uppercase;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: 2px solid rgba(255,255,255,0.15);
          background: var(--cat-bg, linear-gradient(135deg, #667eea, #764ba2));
          box-shadow: 0 4px 25px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1);
          text-shadow: 0 2px 15px rgba(0,0,0,0.3);
          min-height: 38px;
          height: 38px;
        }

        .categoria-item::before {
          content: '';
          position: absolute;
          top: -1px;
          left: -1px;
          right: -1px;
          bottom: -1px;
          border-radius: 15px;
          background: linear-gradient(135deg, rgba(255,255,255,0.2), transparent);
          opacity: 0;
          transition: opacity 0.3s ease;
          z-index: -1;
        }

        .categoria-item:hover {
          transform: translateY(-2px) scale(1.04);
          border-color: rgba(255,255,255,0.4);
          box-shadow: 0 8px 30px rgba(0,0,0,0.3), 0 0 30px rgba(59,130,246,0.15);
        }

        .categoria-item:hover::before {
          opacity: 1;
        }

        .categoria-item .cat-icon {
          font-size: 11px;
          opacity: 0.6;
          transition: all 0.3s ease;
        }

        .categoria-item:hover .cat-icon {
          opacity: 1;
          transform: scale(1.3) rotate(10deg);
        }

        .tipos-hover-menu {
          position: fixed;
          background: rgba(8,12,30,0.98);
          backdrop-filter: blur(25px);
          border: 2px solid rgba(59,130,246,0.3);
          border-radius: 18px;
          box-shadow: 0 30px 100px rgba(0,0,0,0.9), 0 0 60px rgba(59,130,246,0.05);
          padding: 20px 24px;
          min-width: 200px;
          max-width: 380px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 99999;
          animation: slideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          left: 50%;
          transform: translateX(-50%);
          margin-top: 12px;
        }

        .tipos-hover-menu::-webkit-scrollbar {
          width: 4px;
        }
        .tipos-hover-menu::-webkit-scrollbar-track {
          background: rgba(59,130,246,0.03);
          border-radius: 10px;
        }
        .tipos-hover-menu::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(59,130,246,0.4), rgba(37,99,235,0.2));
          border-radius: 10px;
        }

        .tipos-hover-menu .tipo-item {
          padding: 10px 18px;
          cursor: pointer;
          color: #c7d2fe;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.25s ease;
          border-radius: 10px;
          margin: 3px 0;
          border-left: 3px solid transparent;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .tipos-hover-menu .tipo-item::before {
          content: '▸';
          color: rgba(59,130,246,0.4);
          font-size: 12px;
          transition: all 0.3s ease;
        }

        .tipos-hover-menu .tipo-item:hover {
          background: rgba(59,130,246,0.08);
          color: #ffffff;
          border-left: 3px solid #60a5fa;
          transform: translateX(4px);
        }

        .tipos-hover-menu .tipo-item:hover::before {
          color: #60a5fa;
          transform: translateX(3px);
        }

        .tipos-hover-menu .ver-todos {
          border-top: 2px solid rgba(59,130,246,0.08);
          padding-top: 12px;
          margin-top: 6px;
          color: #60a5fa;
          font-weight: 700;
          text-align: center;
          cursor: pointer;
          padding: 10px 18px;
          border-radius: 10px;
          transition: all 0.25s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
        }

        .tipos-hover-menu .ver-todos:hover {
          background: rgba(59,130,246,0.06);
          transform: scale(1.03);
        }

        .tipos-hover-menu .ver-todos .arrow-icon {
          transition: transform 0.3s ease;
        }

        .tipos-hover-menu .ver-todos:hover .arrow-icon {
          transform: translateX(4px);
        }

        .tipos-hover-menu .menu-header {
          border-bottom: 2px solid rgba(59,130,246,0.1);
          padding-bottom: 10px;
          margin-bottom: 12px;
          color: #ffffff;
          font-size: 16px;
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .tipos-hover-menu .menu-header .header-icon {
          color: #60a5fa;
          font-size: 14px;
        }

        .productos-dropdown-menu {
          position: absolute;
          top: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          background: rgba(10,10,30,0.98);
          border: 2px solid rgba(59,130,246,0.3);
          border-radius: 16px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.8);
          padding: 8px;
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

        .producto-submenu-tipos {
          position: absolute;
          top: -6px;
          left: calc(100% + 6px);
          background: rgba(10,10,30,0.98);
          border: 2px solid rgba(59,130,246,0.25);
          border-radius: 14px;
          box-shadow: 0 30px 80px rgba(0,0,0,0.8);
          padding: 8px;
          min-width: 200px;
          max-width: 280px;
          max-height: 400px;
          overflow-y: auto;
          animation: slideUp 0.25s ease;
          z-index: 99999;
          backdrop-filter: blur(10px);
        }

        .producto-submenu-tipos::-webkit-scrollbar {
          width: 4px;
        }
        .producto-submenu-tipos::-webkit-scrollbar-track {
          background: rgba(59,130,246,0.03);
          border-radius: 10px;
        }
        .producto-submenu-tipos::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(59,130,246,0.4), rgba(37,99,235,0.2));
          border-radius: 10px;
        }

        .texto-blue {
          background: linear-gradient(90deg, #60a5fa, #3b82f6, #1d4ed8, #3b82f6, #60a5fa);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmerBlue 3s linear infinite;
        }

        .logo-electric {
          animation: logoElectric 3.5s ease-in-out infinite;
          transition: all 0.4s ease;
          cursor: pointer;
          filter: drop-shadow(0 0 30px rgba(37,99,235,0.2));
        }

        .logo-electric:hover {
          transform: scale(1.08);
          filter: drop-shadow(0 0 80px rgba(37,99,235,0.7));
        }

        .nav-link-hover {
          cursor: pointer;
          font-weight: 700;
          font-size: clamp(16px, 1.3vw, 20px);
          padding: 10px 24px;
          border-radius: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          white-space: nowrap;
          position: relative;
          background: transparent;
          border: none;
          letter-spacing: 0.5px;
          color: #94a3b8;
          text-transform: uppercase;
          height: 44px;
          display: flex;
          align-items: center;
        }

        .nav-link-hover:hover {
          transform: scale(1.05);
          color: #60a5fa;
          background: rgba(59,130,246,0.08);
          box-shadow: 0 4px 30px rgba(59,130,246,0.05);
        }

        .desktop-productos-btn {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: clamp(16px, 1.3vw, 20px);
          font-weight: 700;
          padding: 10px 24px;
          border-radius: 10px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          letter-spacing: 0.5px;
          position: relative;
          color: #94a3b8;
          text-transform: uppercase;
          height: 44px;
        }

        .desktop-productos-btn:hover {
          transform: scale(1.05);
          color: #60a5fa;
          background: rgba(59,130,246,0.08);
          box-shadow: 0 4px 30px rgba(59,130,246,0.05);
        }

        /* ===== ESTILO PARA EL BOTÓN DE NUEVOS PRODUCTOS ===== */
        .nuevos-badge {
          background: linear-gradient(135deg, #0003cc, #f5576c);
          color: #ffffff;
          font-size: clamp(12px, 1vw, 16px);
          font-weight: 800;
          padding: 8px 22px;
          border-radius: 999px;
          border: none;
          cursor: pointer;
          animation: pulse 2s ease infinite;
          box-shadow: 0 4px 30px rgba(245,87,108,0.4);
          letter-spacing: 0.5px;
          text-transform: uppercase;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 38px;
        }

        .nuevos-badge:hover {
          transform: scale(1.08) !important;
          box-shadow: 0 8px 50px rgba(245,87,108,0.6) !important;
        }

        /* ===== ESTILO PARA EL BOTÓN DE PROMOCIONES ===== */
        .promociones-btn {
          background: linear-gradient(135deg, #FF6B6B, #EE5A24);
          color: #ffffff;
          border: none;
          padding: 6px 18px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          animation: pulse 2s ease infinite;
          box-shadow: 0 4px 20px rgba(238, 90, 36, 0.3);
          white-space: nowrap;
          flex-shrink: 0;
          height: 36px;
        }

        .promociones-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 8px 40px rgba(238, 90, 36, 0.5);
        }

        .promociones-btn .btn-icon {
          font-size: 14px;
        }

        .dropdown-item {
          padding: 10px 20px;
          cursor: pointer;
          color: #bfdbfe;
          font-weight: 600;
          margin: 0;
          font-size: 15px;
          transition: all 0.2s ease;
          border-radius: 8px;
          border-left: 3px solid transparent;
        }

        .dropdown-item:hover {
          transform: translateX(4px);
          background: rgba(59,130,246,0.06);
          color: #ffffff;
          border-left: 3px solid #60a5fa;
        }

        /* ===== RESULTADOS DE BÚSQUEDA ===== */
        .search-results-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          left: 0;
          right: 0;
          background: rgba(10,10,30,0.98);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(59,130,246,0.2);
          border-radius: 16px;
          padding: 8px;
          max-height: 350px;
          overflow-y: auto;
          box-shadow: 0 30px 80px rgba(0,0,0,0.6);
          z-index: 100000;
          animation: slideDown 0.2s ease;
          min-width: 280px;
        }

        .search-results-dropdown::-webkit-scrollbar {
          width: 4px;
        }
        .search-results-dropdown::-webkit-scrollbar-track {
          background: rgba(59,130,246,0.03);
          border-radius: 10px;
        }
        .search-results-dropdown::-webkit-scrollbar-thumb {
          background: rgba(59,130,246,0.3);
          border-radius: 10px;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 14px;
          cursor: pointer;
          border-radius: 10px;
          transition: all 0.2s ease;
          border-bottom: 1px solid rgba(59,130,246,0.05);
        }

        .search-result-item:hover {
          background: rgba(59,130,246,0.06);
          transform: scale(1.02);
        }

        .search-result-item:last-child {
          border-bottom: none;
        }

        .search-result-item img {
          width: 40px;
          height: 40px;
          object-fit: cover;
          border-radius: 8px;
        }

        .search-result-item .result-info {
          flex: 1;
        }

        .search-result-item .result-info h4 {
          margin: 0;
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 600;
        }

        .search-result-item .result-info p {
          margin: 0;
          color: #94a3b8;
          font-size: 13px;
          font-weight: 500;
        }

        .search-result-item .result-price {
          color: #60a5fa;
          font-weight: 700;
          font-size: 14px;
        }

        .search-no-results {
          padding: 20px;
          text-align: center;
          color: #94a3b8;
          font-size: 14px;
        }

        .search-container {
          display: flex;
          align-items: center;
          background: rgba(255,255,255,0.05);
          border: 2px solid rgba(255,255,255,0.08);
          border-radius: 30px;
          padding: 2px 4px 2px 18px;
          transition: all 0.3s ease;
          flex: 1;
          max-width: 260px;
          position: relative;
          height: 38px;
        }

        .search-container:focus-within {
          border-color: #60a5fa;
          box-shadow: 0 0 30px rgba(59,130,246,0.1);
          background: rgba(255,255,255,0.08);
        }

        .search-container input {
          background: transparent;
          border: none;
          outline: none;
          color: #e2e8f0;
          font-size: 13px;
          padding: 6px 0;
          width: 100%;
          font-weight: 500;
          height: 30px;
        }

        .search-container input::placeholder {
          color: #64748b;
          font-weight: 400;
        }

        .search-container .search-btn {
          background: linear-gradient(135deg, #3b82f6, #6366f1);
          border: none;
          color: #fff;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .search-container .search-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 4px 20px rgba(59,130,246,0.4);
        }

        .links-container {
          width: 100%;
          background: linear-gradient(135deg, #0a0a1a 0%, #141433 100%);
          backdrop-filter: blur(10px);
          border-top: 2px solid rgba(59,130,246,0.1);
          border-bottom: 2px solid rgba(59,130,246,0.1);
          display: flex;
          justify-content: center;
          padding: 8px 0;
          box-shadow: 0 4px 40px rgba(0,0,0,0.2);
          position: relative;
          overflow: visible !important;
          min-height: 60px;
          z-index: 4999;
        }

        .links-inner {
          display: flex;
          flex-wrap: nowrap;
          justify-content: center;
          align-items: center;
          gap: 2px;
          width: 100%;
          padding: 0 15px;
          overflow: visible !important;
          position: relative;
          z-index: 1;
        }

        .menu-item-with-submenu {
          position: relative;
        }

        /* ===== ESTILOS MÓVIL ===== */
        @media (max-width: 768px) {
          .social-desktop { display: none !important; }
          .nav-links-desktop { display: none !important; }
          .search-container { display: none !important; }
          .pagos-container { display: none !important; }
          .promociones-btn { display: none !important; }
          
          .navbar-content {
            gap: 2px !important;
            padding: 4px 8px !important;
            flex-direction: column !important;
            min-height: auto !important;
            background: rgba(10,10,26,0.98) !important;
            backdrop-filter: blur(20px) !important;
            border-bottom: 1px solid rgba(255,255,255,0.04) !important;
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
            width: 28px !important;
            height: 28px !important;
            object-fit: contain;
          }
          
          .mobile-logo-text {
            display: block !important;
            font-size: 12px !important;
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
            width: 26px !important;
            height: 26px !important;
            min-width: 26px !important;
            min-height: 26px !important;
            font-size: 9px !important;
            border-radius: 50% !important;
            border: 1px solid rgba(255,255,255,0.04) !important;
          }
          
          .mobile-search-btn {
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
            color: #94a3b8;
            width: 30px;
            height: 30px;
            min-width: 30px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            flex-shrink: 0;
            font-size: 11px;
          }
          
          .mobile-search-btn:hover {
            background: rgba(59,130,246,0.08);
            border-color: #60a5fa;
            color: #60a5fa;
          }
          
          .mobile-hamburger-btn {
            width: 30px !important;
            height: 30px !important;
            min-width: 30px !important;
            border-radius: 6px !important;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
            color: #94a3b8;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            flex-shrink: 0;
            position: relative;
            z-index: 10001;
            font-size: 11px;
          }
          
          .mobile-hamburger-btn:hover {
            background: rgba(59,130,246,0.08);
            border-color: #60a5fa;
            color: #60a5fa;
          }
          
          .mobile-nav-links {
            display: flex !important;
            flex-wrap: wrap;
            justify-content: center;
            gap: 2px;
            padding: 4px 0 2px 0;
            border-top: 1px solid rgba(255,255,255,0.03);
            width: 100%;
          }
          
          .mobile-nav-link {
            font-size: 10px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s ease;
            background: transparent;
            border: none;
            color: #94a3b8;
            white-space: nowrap;
            display: flex;
            align-items: center;
            gap: 2px;
          }
          
          .mobile-nav-link:hover {
            color: #60a5fa;
            background: rgba(59,130,246,0.04);
          }
          
          .mobile-nav-link .nuevos-badge {
            font-size: 6px !important;
            padding: 1px 5px !important;
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
            border-radius: 0 0 16px 16px;
            box-shadow: 0 25px 80px rgba(0,0,0,0.6);
            padding: 4px 0;
            max-height: calc(100vh - 80px);
            overflow-y: auto;
            animation: slideDown 0.3s ease;
            z-index: 10000;
            border-top: 2px solid rgba(59,130,246,0.15);
            margin-top: 2px;
            width: calc(100% + 16px);
          }
          
          .mobile-dropdown-menu::-webkit-scrollbar {
            width: 3px;
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
            gap: 8px;
            padding: 8px 14px;
            cursor: pointer;
            transition: all 0.2s ease;
            border: none;
            background: transparent;
            width: 100%;
            text-align: left;
            font-size: 13px;
            font-weight: 600;
            border-radius: 6px;
            color: #c7d2fe;
          }
          
          .mobile-menu-item:hover {
            color: #ffffff;
            background: rgba(59,130,246,0.04);
          }
          
          .mobile-menu-item .nuevos-badge {
            font-size: 9px !important;
            padding: 1px 8px !important;
          }

          .mobile-pagos-container {
            display: flex !important;
            flex-wrap: wrap;
            gap: 4px;
            padding: 6px 4px;
            background: rgba(255,255,255,0.02);
            border-radius: 8px;
            margin: 2px 0;
            border: 1px solid rgba(255,255,255,0.04);
            align-items: center;
          }

          .mobile-pagos-container .pago-item {
            display: flex;
            align-items: center;
            gap: 4px;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 10px;
            font-weight: 500;
            color: #94a3b8;
            background: rgba(255,255,255,0.03);
            white-space: nowrap;
            height: 24px;
          }

          .mobile-pagos-container .pago-item .pago-icon {
            font-size: 10px;
            color: #60a5fa;
          }

          .mobile-pagos-container .pago-item.highlight {
            color: #60a5fa;
            font-weight: 600;
            background: rgba(59,130,246,0.06);
          }

          .mobile-pagos-container .pago-item.highlight .pago-icon {
            color: #f093fb;
          }

          /* ===== BOTÓN PROMOCIONES MÓVIL ===== */
          .mobile-promociones-btn {
            background: linear-gradient(135deg, #FF6B6B, #EE5A24);
            color: #ffffff;
            border: none;
            padding: 4px 12px;
            border-radius: 14px;
            font-weight: 700;
            font-size: 10px;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 4px;
            animation: pulse 2s ease infinite;
            box-shadow: 0 2px 10px rgba(238, 90, 36, 0.3);
            white-space: nowrap;
            height: 24px;
          }

          .mobile-promociones-btn:hover {
            transform: scale(1.05);
          }
          
          .links-container { display: none !important; }
          .categorias-container { display: none !important; }
          
          .tipos-hover-menu { 
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 90% !important;
            max-width: 350px !important;
            z-index: 999999 !important;
            margin-top: 0 !important;
          }

          .search-results-dropdown {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 90% !important;
            max-width: 400px !important;
            z-index: 999999 !important;
            max-height: 400px !important;
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
          .mobile-hamburger-btn { display: none !important; }
          .mobile-pagos-container { display: none !important; }
          .mobile-promociones-btn { display: none !important; }
          .search-container { display: flex !important; }
          .pagos-container { display: flex !important; }
          .promociones-btn { display: flex !important; }
          .links-container { display: flex !important; }
          .categorias-container { display: flex !important; }
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
          padding: isMobileView ? "4px 10px" : "12px 30px",
          background: darkMode ? "#0a0a1a" : "linear-gradient(135deg, #0a0a2a 0%, #0f0f3a 100%)",
          color: "#fff",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 5000,
          boxShadow: isMobileView 
            ? "0 2px 15px rgba(0,0,0,0.3)" 
            : "0 4px 50px rgba(0,0,0,0.3), 0 0 80px rgba(59,130,246,0.02)",
          borderBottom: isMobileView 
            ? "1px solid rgba(255,255,255,0.04)" 
            : "2px solid rgba(59,130,246,0.08)",
          boxSizing: "border-box",
          minHeight: isMobileView ? "auto" : "120px",
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
              gap: '12px',
              padding: '2px 0'
            }}>
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0, cursor: 'pointer' }}
                onClick={() => navigate("/")}
              >
                <img
                  src="/logo.png"
                  alt="FRAY FLOORING"
                  className="logo-electric"
                  style={{
                    height: '80px',
                    width: 'auto',
                    maxHeight: '90px',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </div>

              {/* Título Fray Flooring */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flex: 1,
                justifyContent: 'center'
              }}>
                <span className="texto-blue" style={{
                  fontSize: 'clamp(36px, 4.5vw, 60px)',
                  fontWeight: '900',
                  letterSpacing: '4px',
                  whiteSpace: 'nowrap'
                }}>
                  Fray
                </span>
                <span style={{
                  fontSize: 'clamp(20px, 2.5vw, 38px)',
                  fontWeight: '700',
                  letterSpacing: '6px',
                  whiteSpace: 'nowrap',
                  color: '#ffffff',
                  textShadow: '0 2px 30px rgba(255,255,255,0.05)',
                }}>
                  Flooring
                </span>
              </div>

              {/* Buscador, Pagos, Promociones e Iconos */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px', 
                flexShrink: 0
              }}>
                {/* Buscador con resultados en tiempo real */}
                <div className="search-container" style={{ position: 'relative' }}>
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="🔍 Buscar..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSearchSubmit();
                      }
                    }}
                    onFocus={() => {
                      if (busqueda.trim().length > 0 && resultadosBusqueda.length > 0) {
                        setMostrarResultados(true);
                      }
                    }}
                    onBlur={() => {
                      setTimeout(() => setMostrarResultados(false), 200);
                    }}
                  />
                  <button className="search-btn" onClick={handleSearchSubmit}>
                    <FaSearch size={13} />
                  </button>

                  {/* Resultados de búsqueda en tiempo real */}
                  {mostrarResultados && resultadosBusqueda.length > 0 && (
                    <div className="search-results-dropdown">
                      {resultadosBusqueda.map((p) => (
                        <div 
                          key={p.id} 
                          className="search-result-item"
                          onClick={() => {
                            navigate(`/producto/${p.id}`);
                            setMostrarResultados(false);
                            setResultadosBusqueda([]);
                            setBusqueda("");
                          }}
                        >
                          <img 
                            src={obtenerImagen(p)} 
                            alt={p.nombre}
                            onError={(e) => {
                              e.target.src = "https://via.placeholder.com/200?text=Sin+imagen";
                            }}
                          />
                          <div className="result-info">
                            <h4>{p.nombre}</h4>
                            <p>{p.categoria || p.subcategoria || ''}</p>
                          </div>
                          <span className="result-price">${p.precio}</span>
                        </div>
                      ))}
                      <div style={{ 
                        padding: '8px 14px', 
                        textAlign: 'center', 
                        color: '#60a5fa', 
                        fontSize: '13px', 
                        fontWeight: '600',
                        cursor: 'pointer',
                        borderTop: '1px solid rgba(59,130,246,0.1)',
                        marginTop: '4px'
                      }}
                      onClick={handleSearchSubmit}
                      >
                        Ver todos los resultados →
                      </div>
                    </div>
                  )}
                </div>

                {/* Contenedor de Pagos - MÁS GRANDE */}
                <div className="pagos-container">
                  <div className="pago-item highlight">
                    <FaCreditCard className="pago-icon" />
                    Tarjeta
                  </div>
                  <div className="pago-item">
                    <FaMoneyBillWave className="pago-icon" />
                    Transferencia
                  </div>
                  <div className="pago-item">
                    <FaMoneyBillWave className="pago-icon" />
                    Efectivo
                  </div>
                  <div className="pago-item highlight">
                    <FaCalendarCheck className="pago-icon" />
                    Meses sin intereses
                  </div>
                </div>

              {/* Botón Promociones - IGUAL QUE NUEVOS PRODUCTOS */}
<button 
  className="promociones-btn" 
  onClick={() => {
    // Cerrar menús
    cerrarMenuCategorias();
    setMobileMenuOpen(false);
    setMostrarTiposHover(false);
    setProductoMostrarTipos(false);
    if (tiposHoverTimeoutRef.current) {
      clearTimeout(tiposHoverTimeoutRef.current);
      tiposHoverTimeoutRef.current = null;
    }
    setMostrarResultados(false);
    setResultadosBusqueda([]);
    setBusqueda("");
    
    // Navegar a la página principal con el hash #ofertas
    navigate("/#ofertas");
    
    // Hacer scroll a la sección de ofertas después de que la página cargue
    setTimeout(() => {
      const ofertasSection = document.getElementById('productos-oferta');
      if (ofertasSection) {
        ofertasSection.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        });
      }
    }, 600);
  }}
>
  <FaGift className="btn-icon" />
  Promociones
</button>
                {/* Iconos Sociales */}
                <div className="social-desktop" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <SocialIcon color="#1877F2" href="https://www.facebook.com/people/FRAY-Flooring/61587688868988/">
                    <FaFacebookF size={16} />
                  </SocialIcon>
                  <SocialIcon color="#E4405F" href="https://www.instagram.com/fray_flooring?igsh=b3pucDR1bjltMGQ2">
                    <FaInstagram size={16} />
                  </SocialIcon>
                  <SocialIcon color="#010101" href="https://www.tiktok.com/@fray_flooring6">
                    <FaTiktok size={16} />
                  </SocialIcon>
                  <SocialIcon color="#25D366" href="https://wa.me/525610026370">
                    <FaWhatsapp size={16} />
                  </SocialIcon>
                  <SocialIcon color="#FF0000" href="https://www.youtube.com/@FrayFlooring" isYoutube={true}>
                    <FaYoutube size={16} />
                  </SocialIcon>
                  <SocialIcon color="#38bdf8" href="tel:+525610026370">
                    <FaPhone size={16} />
                  </SocialIcon>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ===== VERSIÓN MÓVIL ===== */}
        {isMobileView && (
          <div style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            padding: '2px 0',
            position: 'relative'
          }}>
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
                <FaSearch size={11} />
              </button>

              <button 
                className="mobile-hamburger-btn"
                onClick={toggleMobileMenu}
                style={{
                  background: mobileMenuOpen ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.04)',
                  border: mobileMenuOpen ? '1px solid #60a5fa' : '1px solid rgba(255,255,255,0.06)',
                  color: mobileMenuOpen ? '#60a5fa' : '#94a3b8'
                }}
              >
                {mobileMenuOpen ? <FaTimes size={11} /> : <FaBars size={11} />}
              </button>
            </div>

            {/* Pagos en móvil - MÁS GRANDE */}
            <div className="mobile-pagos-container">
              <div className="pago-item highlight">
                <FaCreditCard className="pago-icon" />
                Tarjeta
              </div>
              <div className="pago-item">
                <FaMoneyBillWave className="pago-icon" />
                Transferencia
              </div>
              <div className="pago-item">
                <FaMoneyBillWave className="pago-icon" />
                Efectivo
              </div>
              <div className="pago-item highlight">
                <FaCalendarCheck className="pago-icon" />
                Meses sin intereses
              </div>
              <button className="mobile-promociones-btn" onClick={irAOfertas}>
                <FaGift size={9} />
                Promos
              </button>
            </div>

            <div className="mobile-nav-links">
              <button className="mobile-nav-link" onClick={() => navigate("/")}>
                <FaHome size={8} /> Inicio
              </button>
              <button className="mobile-nav-link" onClick={() => navigate("/nosotros")}>
                <FaInfoCircle size={8} /> Nosotros
              </button>
              <button className="mobile-nav-link" onClick={() => navigate("/contacto")}>
                <FaEnvelope size={8} /> Contacto
              </button>
              <button className="mobile-nav-link" onClick={handlePedidoClick}>
                Pedido
              </button>
              <button className="mobile-nav-link" onClick={() => navigate("/#productos-nuevos")}>
                <span className="nuevos-badge">✨NUEVOS</span>
              </button>
            </div>

            {mobileMenuOpen && (
              <div className="mobile-dropdown-menu">
                <button className="mobile-menu-item" onClick={() => handleNavigate("/")}>
                  <FaHome size={13} color="#60a5fa" /> Inicio
                </button>
                <button className="mobile-menu-item" onClick={() => handleNavigate("/nosotros")}>
                  <FaInfoCircle size={13} color="#60a5fa" /> Nosotros
                </button>
                <button className="mobile-menu-item" onClick={() => handleNavigate("/contacto")}>
                  <FaEnvelope size={13} color="#60a5fa" /> Contacto
                </button>
                <button className="mobile-menu-item" onClick={handlePedidoClick} style={{ fontWeight: '700', color: '#60a5fa' }}>
                  Pedido
                </button>
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.04)', margin: '2px 10px' }} />
                
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
                        style={{ paddingLeft: '24px', fontSize: '12px' }}>
                        {cat.nombre}
                      </button>
                    ))}
                  </div>
                )}
                
                <button className="mobile-menu-item" onClick={() => { navigate("/#productos-nuevos"); setMobileMenuOpen(false); }}>
                  <span className="nuevos-badge" style={{ fontSize: '10px', padding: '1px 10px' }}>✨ NUEVOS</span>
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
                            fontSize: '12px'
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
                                    fontSize: '11px'
                                  }}>
                                  • {sub.nombre} {subcategoriaSeleccionada === sub.id ? '▼' : '►'}
                                </button>
                                {subcategoriaSeleccionada === sub.id && (
                                  <div style={{ marginLeft: '8px' }}>
                                    {tiposUsar.filter(t => Number(t.subcategoria_id) === Number(sub.id)).map(tipo => (
                                      <button key={tipo.id} className="mobile-menu-item"
                                        onClick={() => { handleTipoClick(tipo.id); setMobileMenuOpen(false); }}
                                        style={{ fontSize: '10px', paddingLeft: '52px', color: '#94a3b8' }}>
                                        • {tipo.nombre}
                                      </button>
                                    ))}
                                    <button className="mobile-menu-item"
                                      onClick={() => { handleSubcategoriaClick(sub.nombre); setMobileMenuOpen(false); }}
                                      style={{ color: '#60a5fa', fontWeight: '600', paddingLeft: '52px', fontSize: '11px' }}>
                                      📂 Ver toda la subcategoría
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                            <button className="mobile-menu-item"
                              onClick={() => { handleVerTodasClick(cat.id); setMobileMenuOpen(false); }}
                              style={{ color: '#60a5fa', fontWeight: '700', paddingLeft: '38px', fontSize: '12px' }}>
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
            top: isNavbarVisible ? '120px' : '-100%',
            left: 0,
            right: 0,
            zIndex: 4999,
            transform: isNavbarVisible ? 'translateY(0)' : 'translateY(-100%)',
            opacity: isNavbarVisible ? 1 : 0,
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isNavbarVisible ? 'auto' : 'none',
            padding: '6px 0',
            minHeight: '55px',
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
                      padding: '10px 20px',
                      cursor: 'pointer',
                      color: '#bfdbfe',
                      fontWeight: '700',
                      fontSize: '16px',
                      transition: 'all 0.2s ease',
                      borderRadius: '8px',
                      borderLeft: '3px solid #60a5fa',
                      background: 'rgba(59,130,246,0.04)',
                      marginBottom: '6px'
                    }}
                  >
                    🛍 Todos nuestros productos
                  </div>

                  <div style={{ height: '2px', background: 'rgba(255,255,255,0.05)', margin: '6px 10px' }} />

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
                              padding: '8px 18px',
                              cursor: 'pointer',
                              color: '#bfdbfe',
                              fontWeight: '600',
                              fontSize: '14px',
                              transition: 'all 0.2s ease',
                              borderRadius: '8px',
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
                                padding: '8px 14px 10px', 
                                color: '#ffffff', 
                                fontSize: '13px', 
                                fontWeight: '700',
                                borderBottom: '2px solid rgba(255,255,255,0.05)',
                                marginBottom: '6px'
                              }}>
                                📦 {sub.nombre}
                              </div>
                              {tiposDeSub.map(tipo => (
                                <div 
                                  key={tipo.id} 
                                  className="dropdown-item"
                                  onClick={() => handleTipoClick(tipo.id)}
                                  style={{
                                    padding: '8px 18px',
                                    cursor: 'pointer',
                                    color: '#c7d2fe',
                                    fontWeight: '500',
                                    fontSize: '13px',
                                    transition: 'all 0.2s ease',
                                    borderRadius: '8px',
                                    borderLeft: '2.5px solid transparent'
                                  }}
                                >
                                  • {tipo.nombre}
                                </div>
                              ))}
                              <div style={{ height: '2px', background: 'rgba(255,255,255,0.04)', margin: '6px 10px' }} />
                              <div 
                                className="dropdown-item"
                                onClick={() => handleSubcategoriaClick(sub.nombre)}
                                style={{
                                  padding: '8px 18px',
                                  cursor: 'pointer',
                                  color: '#60a5fa',
                                  fontWeight: '700',
                                  fontSize: '13px',
                                  transition: 'all 0.2s ease',
                                  borderRadius: '8px',
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
                    <div style={{ padding: '10px 18px', color: '#94a3b8', fontSize: '14px' }}>
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
            
            <button onClick={handlePedidoClick} className="nav-link-hover" style={{ color: '#94a3b8' }}>
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

      {/* ===== CATEGORÍAS CON FLECHAS CENTRADAS - MÁS ALTO ===== */}
      {!isMobileView && categoriasMostrar && categoriasMostrar.length > 0 && (
        <div 
          ref={categoriasScrollRef}
          className="categorias-container"
          style={{
            position: 'fixed',
            top: isNavbarVisible ? '175px' : '-100%',
            left: 0,
            right: 0,
            zIndex: 4998,
            transform: isNavbarVisible ? 'translateY(0)' : 'translateY(-100%)',
            opacity: isNavbarVisible ? 1 : 0,
            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: isNavbarVisible ? 'auto' : 'none',
          }}
        >
          <div className="categorias-header">
            <div className="categorias-title">
              <span className="title-icon">✦</span>
              EXPLORA NUESTROS PRODUCTOS
            </div>
            <button 
              className="ver-todos-btn"
              onClick={irATodosLosProductos}
            >
              Ver todos
              <span className="btn-arrow"><FaArrowRight size={10} /></span>
            </button>
          </div>

          <div className="categorias-scroll-wrapper">
            <button 
              className="scroll-arrow scroll-arrow-left"
              onClick={() => scrollCategories('left')}
              aria-label="Desplazar categorías a la izquierda"
            >
              <FaChevronLeft size={16} />
            </button>

            <div 
              ref={scrollContainerRef}
              className="categorias-scroll"
            >
              {categoriasMostrar.map((cat, index) => {
                const color = categoryColors[index % categoryColors.length];
                const nombre = cat.nombre || cat.name || `Categoría ${index + 1}`;
                return (
                  <div 
                    key={cat.id || index} 
                    className="categoria-item"
                    style={{
                      '--cat-bg': color.bg,
                      background: color.bg,
                      borderColor: 'rgba(255,255,255,0.15)',
                      color: color.text || '#ffffff'
                    }}
                    onClick={() => {
                      if (cat.nombre) {
                        handleSubcategoriaClick(cat.nombre);
                      } else if (cat.id) {
                        handleVerTodasClick(cat.id);
                      }
                    }}
                    onMouseEnter={() => {
                      if (cat.id && cat.nombre) {
                        handleSubcategoriaHoverScroll(cat.id, cat.nombre);
                      }
                    }}
                    onMouseLeave={handleSubcategoriaLeaveScroll}
                  >
                    <span className="cat-icon">✦</span>
                    {nombre}
                  </div>
                );
              })}
            </div>

            <button 
              className="scroll-arrow scroll-arrow-right"
              onClick={() => scrollCategories('right')}
              aria-label="Desplazar categorías a la derecha"
            >
              <FaChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ===== MENÚ DE TIPOS HOVER ===== */}
      {mostrarTiposHover && subcategoriaHover && tiposDeSubcategoriaHover.length > 0 && (
        <div 
          ref={tiposMenuRef}
          className="tipos-hover-menu"
          style={{
            top: isNavbarVisible ? '330px' : '-100%',
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

      {/* ===== OVERLAY DE BÚSQUEDA (Móvil) ===== */}
      {mostrarBuscador && isMobileView && (
        <div className="search-overlay" onClick={toggleBuscador}>
          <div className="search-overlay-content" onClick={(e) => e.stopPropagation()}>
            <button className="search-overlay-close" onClick={toggleBuscador}>
              <FaTimes size={24} />
            </button>
            <input
              type="text"
              placeholder="🔍 Buscar productos..."
              value={busqueda}
              onChange={(e) => {
                setBusqueda(e.target.value);
                if (e.target.value.trim().length > 0) {
                  const texto = e.target.value.toLowerCase().trim();
                  const filtrados = productos.filter((p) => {
                    return (
                      (p.nombre || "").toLowerCase().includes(texto) ||
                      (p.descripcion || "").toLowerCase().includes(texto) ||
                      (p.categoria || "").toLowerCase().includes(texto) ||
                      (p.subcategoria || "").toLowerCase().includes(texto) ||
                      (p.sku || "").toString().toLowerCase().includes(texto)
                    );
                  });
                  setResultadosBusqueda(filtrados.slice(0, 6));
                  setMostrarResultados(true);
                } else {
                  setResultadosBusqueda([]);
                  setMostrarResultados(false);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearchSubmit();
                  toggleBuscador();
                }
              }}
              className="search-overlay-input"
              autoFocus
            />
            {busqueda.trim() !== "" && resultadosBusqueda.length > 0 && (
              <div style={{ marginTop: '16px', maxHeight: '350px', overflowY: 'auto' }}>
                {resultadosBusqueda.map((p) => (
                  <div key={p.id} className="search-result-item"
                    onClick={() => { navigate(`/producto/${p.id}`); toggleBuscador(); }}>
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
                <div style={{ padding: '10px', textAlign: 'center' }}>
                  <button 
                    onClick={() => { handleSearchSubmit(); toggleBuscador(); }}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                      border: 'none',
                      color: '#fff',
                      padding: '8px 20px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Ver todos los resultados →
                  </button>
                </div>
              </div>
            )}
            {busqueda.trim() !== "" && resultadosBusqueda.length === 0 && (
              <div style={{ marginTop: '16px', textAlign: 'center', color: '#94a3b8', padding: '20px' }}>
                No se encontraron productos
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