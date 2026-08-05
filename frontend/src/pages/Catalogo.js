import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";
import { useLocation } from "react-router-dom";

// ===== HOOK SIMPLIFICADO - SIN ANIMACIONES =====
function useScrollAnimation(initialState = {}) {
  const [visibleSections, setVisibleSections] = useState({
    hero: true,
    categorias: true,
    "ofertas-banner": true,
    "ofertas-productos": true,
    "productos-nuevos": true,
    "mas-vendidas": true,
    "destacados": true
  });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const elements = document.querySelectorAll("[data-animate]");
    elements.forEach((el) => {
      el.classList.add('is-visible');
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.style.visibility = 'visible';
    });

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    const observer = new MutationObserver(() => {
      const elements = document.querySelectorAll("[data-animate]:not(.is-visible)");
      elements.forEach((el) => {
        el.classList.add('is-visible');
        el.style.opacity = '1';
        el.style.transform = 'none';
        el.style.visibility = 'visible';
      });
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  return { visibleSections, scrollY };
}

export default function Catalogo() {
  const heroIntervalRef = useRef(null);

  useEffect(() => {
    if (window.location.hash === "#productos-nuevos") {
      setTimeout(() => {
        document
          .getElementById("productos-nuevos")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  }, []);

  const [productos, setProductos] = useState([]);
  const [destacados, setDestacados] = useState([]);
  const [banners, setBanners] = useState([]);
  const [bannersOfertas, setBannersOfertas] = useState([]);
  const [categoriasDestacadas, setCategoriasDestacadas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [heroActual, setHeroActual] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [mostrarOfertas, setMostrarOfertas] = useState(true);

  const location = useLocation();

  useEffect(() => {
    if (location.hash === "#productos-nuevos") {
      const section = document.getElementById("productos-nuevos");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [location]);

  const bannersHero = banners;

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  const navigate = useNavigate();
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  const productosNuevos = productos.filter(
    (p) => p.nuevo === 1 || p.nuevo === true
  );
  const productosOferta = productos.filter(
    (p) =>
      p.oferta === 1 ||
      p.oferta === true ||
      p.rebaja === 1 ||
      p.rebaja === true
  );

  const [fechaFinalOferta, setFechaFinalOferta] = useState(
    new Date("2026-12-31T23:59:59")
  );

  useEffect(() => {
    const guardada = localStorage.getItem("fechaOferta");
    if (guardada) {
      const fecha = new Date(guardada);
      if (!isNaN(fecha.getTime())) {
        setFechaFinalOferta(fecha);
      }
    }
  }, []);

  const [tiempoRestante, setTiempoRestante] = useState({
    dias: 0,
    horas: 0,
    minutos: 0,
    segundos: 0,
  });

  useEffect(() => {
    if (!fechaFinalOferta) return;
    
    const interval = setInterval(() => {
      const ahora = new Date().getTime();
      const distancia = fechaFinalOferta.getTime() - ahora;

      if (distancia < 0) {
        clearInterval(interval);
        setMostrarOfertas(false);
        return;
      }

      setTiempoRestante({
        dias: Math.floor(distancia / (1000 * 60 * 60 * 24)),
        horas: Math.floor(
          (distancia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        ),
        minutos: Math.floor((distancia % (1000 * 60 * 60)) / (1000 * 60)),
        segundos: Math.floor((distancia % (1000 * 60)) / 1000),
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [fechaFinalOferta]);

  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos");
    return guardados ? JSON.parse(guardados) : [];
  });

  useEffect(() => {
    const cargarDatos = async () => {
      setCargando(true);
      try {
        const [
          categoriasDestacadasRes,
          categoriasRes,
          subcategoriasRes,
          productosRes,
          bannersRes,
          destacadosRes,
          bannersOfertasRes,
        ] = await Promise.all([
          api.get("/categorias-destacadas"),
          api.get("/categorias"),
          api.get("/subcategorias"),
          api.get("/productos"),
          api.get("/banners"),
          api.get("/productos/destacados"),
          api.get("/banners-ofertas/public/active"),
        ]);

        setCategoriasDestacadas(categoriasDestacadasRes.data);
        setCategorias(categoriasRes.data);
        setSubcategorias(subcategoriasRes.data);
        setProductos(productosRes.data);
        setBanners(bannersRes.data);
        setDestacados(destacadosRes.data);
        setBannersOfertas(bannersOfertasRes.data);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  useEffect(() => {
    if (bannersHero.length === 0) return;
    
    if (heroIntervalRef.current) {
      clearInterval(heroIntervalRef.current);
    }

    heroIntervalRef.current = setInterval(() => {
      setHeroActual((prev) =>
        prev >= bannersHero.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => {
      if (heroIntervalRef.current) {
        clearInterval(heroIntervalRef.current);
      }
    };
  }, [bannersHero]);

  const toggleFavorito = (producto) => {
    const existe = favoritos.find((fav) => fav.id === producto.id);
    if (existe) {
      setFavoritos(favoritos.filter((f) => f.id !== producto.id));
    } else {
      setFavoritos([...favoritos, producto]);
    }
  };

  const esFavorito = (id) => favoritos.some((f) => f.id === id);

  const obtenerImagen = (p) => {
    if (p.imagenes) {
      return `https://backend-zuib.onrender.com${p.imagenes.split(",")[0]}`;
    }
    if (p.imagen) {
      return `https://backend-zuib.onrender.com${p.imagen}`;
    }
    return "https://via.placeholder.com/200";
  };

  const clickBanner = (banner) => {
    if (banner.subcategoria) {
      navigate(`/subcategoria/${encodeURIComponent(banner.subcategoria)}`);
      return;
    }
    if (banner.categoria) {
      navigate(`/categoria-id/${banner.categoria_id}`);
    }
  };

  const scrollSlider = (sliderId, direction) => {
    const slider = document.getElementById(sliderId);
    if (!slider) return;

    const isMobileView = window.innerWidth < 768;
    const cardWidth = isMobileView ? 180 : 280;
    const gap = 16;
    const scrollAmount = (cardWidth + gap) * 2;

    const currentScroll = slider.scrollLeft;
    const maxScroll = slider.scrollWidth - slider.clientWidth;

    let newScrollPosition;
    if (direction === "left") {
      newScrollPosition = Math.max(0, currentScroll - scrollAmount);
    } else {
      newScrollPosition = Math.min(maxScroll, currentScroll + scrollAmount);
    }

    slider.scrollTo({
      left: newScrollPosition,
      behavior: "smooth",
    });
  };

  const irAMasVendidos = () => {
    navigate("/mas-vendidos");
  };

  const { visibleSections, scrollY } = useScrollAnimation({});

  const getProductosOfertaMostrar = () => {
    if (isMobile) return 1;
    if (isTablet) return 3;
    return 5;
  };

  if (cargando) {
    return (
      <div style={styles.page(darkMode)}>
        <Navbar
          darkMode={darkMode}
          setDarkMode={setDarkMode}
          favoritos={favoritos}
          productos={productos}
          toggleFavorito={toggleFavorito}
          esFavorito={esFavorito}
          categorias={categorias}
          subcategorias={subcategorias}
        />
        <div style={styles.loaderContainer}>
          <div style={styles.loader}></div>
          <p style={styles.loaderText}>Cargando catálogo...</p>
        </div>
        <Footer darkMode={darkMode} />
      </div>
    );
  }

  return (
    <div style={styles.page(darkMode)}>
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        favoritos={favoritos}
        productos={productos}
        toggleFavorito={toggleFavorito}
        esFavorito={esFavorito}
        categorias={categorias}
        subcategorias={subcategorias}
      />

      {/* ===== HERO CARRUSEL (RESPONSIVE ORIGINAL) ===== */}
      {bannersHero.length > 0 && (
        <div className="hero-wrapper">
          <div className="hero-container">
            {bannersHero.map((banner, index) => (
              <div
                key={banner.id}
                className={`hero-slide ${index === heroActual ? 'active' : ''}`}
                onClick={() => clickBanner(banner)}
              >
                <div className="hero-image-wrapper">
                  <img
                    src={
                      banner.imagen
                        ? `https://backend-zuib.onrender.com${banner.imagen}`
                        : "https://via.placeholder.com/1200x600/1e293b/60a5fa?text=Banner"
                    }
                    alt={banner.titulo || "Banner"}
                    className="hero-image"
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/1200x600/1e293b/60a5fa?text=Banner";
                    }}
                  />
                </div>
                <div className="hero-overlay">
                  <h1 className="hero-title">{banner.titulo}</h1>
                  <p className="hero-description">{banner.descripcion}</p>
                </div>
              </div>
            ))}
            <div className="hero-indicators">
              {bannersHero.map((_, index) => (
                <button
                  key={index}
                  className={`hero-dot ${index === heroActual ? 'active' : ''}`}
                  onClick={() => setHeroActual(index)}
                  aria-label={`Ir al banner ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== OFERTAS FLASH MODERNAS ===== */}
      {bannersOfertas.length > 0 && (
        <div className="flash-offers-wrapper">
          <div className="flash-offers-header">
            <div className="flash-offers-title-group">
              <span className="flash-icon">🔥</span>
              <h2 className="flash-title">Ofertas Flash</h2>
              <span className="flash-badge">¡Hoy!</span>
            </div>
            <p className="flash-subtitle">Descuentos que desaparecen rápido</p>
          </div>

          <div className="flash-offers-grid">
            {bannersOfertas.slice(0, 3).map((banner) => (
              <div
                key={banner.id}
                className="flash-offer-card"
                onClick={() => {
                  if (banner.enlace_tipo === 'categoria' && banner.categoria_id) {
                    navigate(`/categoria-id/${banner.categoria_id}`);
                  } else if (banner.enlace_tipo === 'subcategoria' && banner.subcategoria_id) {
                    navigate(`/subcategorias/${banner.subcategoria_id}`);
                  } else if (banner.enlace_tipo === 'producto' && banner.producto_id) {
                    navigate(`/producto/${banner.producto_id}`);
                  } else {
                    navigate('/ofertas');
                  }
                }}
              >
                <div className="flash-offer-image-wrapper">
                  <img
                    src={
                      banner.imagen
                        ? `https://backend-zuib.onrender.com${banner.imagen}`
                        : "https://via.placeholder.com/600x400/1e293b/60a5fa?text=Oferta"
                    }
                    alt={banner.titulo}
                    className="flash-offer-image"
                    loading="lazy"
                  />
                  {banner.porcentaje && (
                    <div className="flash-offer-discount">
                      <span className="discount-number">{banner.porcentaje}</span>
                      <span className="discount-symbol">%</span>
                      <span className="discount-label">OFF</span>
                    </div>
                  )}
                  <div className="flash-offer-overlay">
                    <h3 className="flash-offer-title">{banner.titulo}</h3>
                    <span className="flash-offer-arrow">→</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== CATEGORÍAS MODERNAS CON IMÁGENES ===== */}
      {categorias.length > 0 && (
        <div className="categories-modern-wrapper">
          <div className="categories-modern-header">
            <h2 className="categories-modern-title">
              <span className="title-highlight">Explora</span> Categorías
            </h2>
            <p className="categories-modern-subtitle">
              Encuentra lo que buscas en nuestra selección
            </p>
          </div>

          <div className="categories-modern-grid">
            {categorias.slice(0, 8).map((cat) => {
              const productoCategoria = productos.find(
                (p) =>
                  p.categoria_id === cat.id || p.categoria === cat.nombre
              );
              const count = productos.filter(
                (p) => p.categoria_id === cat.id || p.categoria === cat.nombre
              ).length;
              return (
                <div
                  key={cat.id}
                  className="category-modern-card"
                  onClick={() => navigate(`/categoria-id/${cat.id}`)}
                >
                  <div className="category-modern-image-wrapper">
                    <img
                      src={
                        productoCategoria
                          ? obtenerImagen(productoCategoria)
                          : "https://via.placeholder.com/300/1e293b/60a5fa?text=?"
                      }
                      alt={cat.nombre}
                      className="category-modern-image"
                      loading="lazy"
                    />
                    <div className="category-modern-overlay">
                      <span className="category-emoji">📦</span>
                      <h3 className="category-modern-name">{cat.nombre}</h3>
                      <span className="category-modern-count">{count} productos</span>
                    </div>
                  </div>
                  <div className="category-modern-hover-effect"></div>
                </div>
              );
            })}
          </div>

          <div className="categories-modern-footer">
            <button
              className="categories-modern-btn btn-glow"
              onClick={() => navigate("/categorias")}
            >
              Ver todas las categorías
              <span className="btn-arrow">→</span>
            </button>
          </div>
        </div>
      )}

      {/* ===== PRODUCTOS NUEVOS ===== */}
      {productosNuevos.length > 0 && (
        <div id="productos-nuevos" className="new-products-wrapper">
          <div className="new-products-header">
            <div className="new-products-title-group">
              <span className="new-products-icon">✨</span>
              <h2 className="new-products-title">Nuevos Productos</h2>
            </div>
            <p className="new-products-subtitle">Descubre las últimas novedades</p>
          </div>

          <div className="new-products-slider-container">
            <button
              onClick={() => scrollSlider("nuevoSliderModern", "left")}
              className="slider-arrow-modern left"
              aria-label="Desplazar izquierda"
            >
              ‹
            </button>
            <button
              onClick={() => scrollSlider("nuevoSliderModern", "right")}
              className="slider-arrow-modern right"
              aria-label="Desplazar derecha"
            >
              ›
            </button>

            <div id="nuevoSliderModern" className="new-products-slider">
              {productosNuevos.map((p) => (
                <div
                  key={p.id}
                  className="new-product-card"
                  onClick={() => navigate(`/producto/${p.id}`)}
                >
                  <div className="new-product-badge">NUEVO</div>
                  <div className="new-product-image-wrapper">
                    <img
                      src={
                        p.imagenes
                          ? `https://backend-zuib.onrender.com${p.imagenes.split(",")[0]}`
                          : "https://via.placeholder.com/200"
                      }
                      alt={p.nombre}
                      className="new-product-image"
                      loading="lazy"
                    />
                  </div>
                  <div className="new-product-info">
                    <h3 className="new-product-name">{p.nombre}</h3>
                    <div className="new-product-price">${p.precio}</div>
                    <button className="new-product-btn btn-shine">
                      Ver producto
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== PRODUCTOS EN OFERTA ===== */}
      {mostrarOfertas && productosOferta.length > 0 && (
        <div className="sale-products-wrapper">
          <div className="sale-products-header">
            <div className="sale-products-title-group">
              <span className="sale-icon">🛒</span>
              <h2 className="sale-products-title">Gran Liquidación</h2>
            </div>
            <p className="sale-products-subtitle">Aprovecha antes de que se acaben</p>
          </div>

          <div className="sale-timer-container">
            <div className="sale-timer">
              <div className="timer-unit">
                <span className="timer-value">{String(tiempoRestante.dias).padStart(2, '0')}</span>
                <span className="timer-label">Días</span>
              </div>
              <span className="timer-separator">:</span>
              <div className="timer-unit">
                <span className="timer-value">{String(tiempoRestante.horas).padStart(2, '0')}</span>
                <span className="timer-label">Horas</span>
              </div>
              <span className="timer-separator">:</span>
              <div className="timer-unit">
                <span className="timer-value">{String(tiempoRestante.minutos).padStart(2, '0')}</span>
                <span className="timer-label">Min</span>
              </div>
              <span className="timer-separator">:</span>
              <div className="timer-unit">
                <span className="timer-value">{String(tiempoRestante.segundos).padStart(2, '0')}</span>
                <span className="timer-label">Seg</span>
              </div>
            </div>
          </div>

          <div className="sale-products-grid">
            {productosOferta.slice(0, getProductosOfertaMostrar()).map((p) => (
              <div
                key={p.id}
                className="sale-product-card"
                onClick={() => navigate(`/producto/${p.id}`)}
              >
                <div className="sale-product-discount-badge">-20%</div>
                <img
                  src={
                    p.imagenes
                      ? `https://backend-zuib.onrender.com${p.imagenes.split(",")[0]}`
                      : "https://via.placeholder.com/300"
                  }
                  alt={p.nombre}
                  className="sale-product-image"
                  loading="lazy"
                />
                <h3 className="sale-product-name">{p.nombre}</h3>
                <div className="sale-product-prices">
                  <span className="sale-old-price">${p.precio}</span>
                  <span className="sale-new-price">${p.precioOferta || (p.precio * 0.8).toFixed(2)}</span>
                </div>
                <button className="sale-product-btn btn-shine">
                  Aprovechar oferta
                </button>
              </div>
            ))}
          </div>

          {productosOferta.length > getProductosOfertaMostrar() && (
            <div className="sale-products-footer">
              <button
                className="sale-products-btn-all btn-glow"
                onClick={irAMasVendidos}
              >
                Ver todas las ofertas
                <span className="btn-arrow">→</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== CATEGORÍAS MÁS VENDIDAS ===== */}
      {categoriasDestacadas.length > 0 && (
        <div className="popular-categories-wrapper">
          <div className="popular-categories-header">
            <div className="popular-categories-title-group">
              <span className="popular-icon">🏆</span>
              <h2 className="popular-categories-title">Más Vendidas</h2>
            </div>
            <p className="popular-categories-subtitle">Lo que más gusta a nuestra comunidad</p>
          </div>

          <div className="popular-categories-slider-container">
            <button
              onClick={() => scrollSlider("vendidasSliderModern", "left")}
              className="slider-arrow-modern left"
              aria-label="Desplazar izquierda"
            >
              ‹
            </button>
            <button
              onClick={() => scrollSlider("vendidasSliderModern", "right")}
              className="slider-arrow-modern right"
              aria-label="Desplazar derecha"
            >
              ›
            </button>

            <div id="vendidasSliderModern" className="popular-categories-slider">
              {categoriasDestacadas.map((p, index) => (
                <div
                  key={index}
                  className="popular-category-card"
                  onClick={() => navigate(`/categoria-id/${p.categoria_id}`)}
                >
                  <div className="popular-category-image-wrapper">
                    <img
                      src={obtenerImagen(p)}
                      alt={p.nombre}
                      className="popular-category-image"
                      loading="lazy"
                    />
                    <div className="popular-category-rank">#{index + 1}</div>
                  </div>
                  <div className="popular-category-info">
                    <h3 className="popular-category-name">{p.categoria}</h3>
                    <span className="popular-category-badge">🔥 Popular</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== PRODUCTOS DESTACADOS ===== */}
      {destacados.length > 0 && (
        <div className="featured-products-wrapper">
          <div className="featured-products-header">
            <div className="featured-products-title-group">
              <span className="featured-icon">⭐</span>
              <h2 className="featured-products-title">Productos Destacados</h2>
            </div>
            <p className="featured-products-subtitle">Los favoritos de nuestros clientes</p>
          </div>

          <div className="featured-products-slider-container">
            <button
              onClick={() => scrollSlider("destacadosSliderModern", "left")}
              className="slider-arrow-modern left"
              aria-label="Desplazar izquierda"
            >
              ‹
            </button>
            <button
              onClick={() => scrollSlider("destacadosSliderModern", "right")}
              className="slider-arrow-modern right"
              aria-label="Desplazar derecha"
            >
              ›
            </button>

            <div id="destacadosSliderModern" className="featured-products-slider">
              {destacados.map((p) => (
                <div
                  key={p.id}
                  className="featured-product-card"
                  onClick={() => navigate(`/producto/${p.id}`)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorito(p);
                    }}
                    className="featured-fav-btn"
                    style={{
                      background: esFavorito(p.id) ? "linear-gradient(135deg, #ff6b6b, #ee0a0a)" : "rgba(255,255,255,0.9)",
                      color: esFavorito(p.id) ? "#fff" : "#333",
                    }}
                  >
                    {esFavorito(p.id) ? "♥" : "♡"}
                  </button>
                  <div className="featured-product-image-wrapper">
                    <img
                      src={obtenerImagen(p)}
                      alt={p.nombre}
                      className="featured-product-image"
                      loading="lazy"
                    />
                  </div>
                  <div className="featured-product-info">
                    <h3 className="featured-product-name">{p.nombre}</h3>
                    {!isMobile && <p className="featured-product-desc">{p.descripcion}</p>}
                    <div className="featured-product-price">${p.precio}</div>
                    <button className="featured-product-btn btn-shine">
                      Ver producto
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer darkMode={darkMode} />

      <style>{`
        /* ===== LOADER ===== */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @keyframes pulse-badge {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        /* ===== RESET ===== */
        * {
          animation: none !important;
          transition: none !important;
        }

        [data-animate] {
          opacity: 1 !important;
          transform: none !important;
          visibility: visible !important;
          pointer-events: auto !important;
        }

        /* ===== HERO BANNER ORIGINAL (RESPONSIVE) ===== */
        .hero-wrapper {
          width: 100%;
          max-width: 100%;
          padding: 0;
          margin: 0;
          overflow: hidden;
          background: #f5f5f5;
        }

        .hero-container {
          position: relative;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          background: #f5f5f5;
        }

        .hero-slide {
          position: relative;
          width: 100%;
          display: none;
          cursor: pointer;
        }

        .hero-slide.active {
          display: block;
        }

        .hero-image-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
          background: #f5f5f5;
        }

        .hero-image {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          object-position: center;
        }

        .hero-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 20px 24px;
          background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          pointer-events: none;
        }

        .hero-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 4px 0;
          line-height: 1.2;
          max-width: 85%;
        }

        .hero-description {
          font-size: 12px;
          margin: 0;
          opacity: 0.85;
          max-width: 85%;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          line-height: 1.4;
        }

        .hero-indicators {
          position: absolute;
          bottom: 12px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
          z-index: 10;
        }

        .hero-dot {
          height: 8px;
          width: 8px;
          min-width: 8px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          padding: 0;
          background: rgba(255,255,255,0.5);
          transition: all 0.3s ease !important;
        }

        .hero-dot.active {
          background: #3483fa;
          width: 24px;
          border-radius: 4px;
        }

        @media (max-width: 767px) {
          .hero-image-wrapper {
            min-height: 200px;
            max-height: 50vh;
            width: 100%;
            overflow: hidden;
            position: relative;
            background: #f5f5f5;
          }
          
          .hero-image {
            width: 100%;
            height: 100%;
            min-height: 200px;
            max-height: 50vh;
            object-fit: contain;
            object-position: center;
            display: block;
            background: #f5f5f5;
          }

          .hero-overlay {
            padding: 16px 16px 20px;
          }

          .hero-title {
            font-size: 18px;
            max-width: 90%;
            margin-bottom: 4px;
          }

          .hero-description {
            font-size: 12px;
            max-width: 90%;
            -webkit-line-clamp: 2;
          }

          .hero-indicators {
            bottom: 8px;
            gap: 6px;
          }
        }

        @media (min-width: 768px) and (max-width: 1024px) {
          .hero-image-wrapper {
            min-height: 300px;
            max-height: 55vh;
            width: 100%;
            overflow: hidden;
            position: relative;
          }
          
          .hero-image {
            width: 100%;
            height: 100%;
            min-height: 300px;
            max-height: 55vh;
            object-fit: cover;
            object-position: center;
            display: block;
          }

          .hero-overlay {
            padding: 24px 32px 28px;
          }

          .hero-title {
            font-size: 28px;
            max-width: 70%;
          }

          .hero-description {
            font-size: 16px;
            max-width: 60%;
            -webkit-line-clamp: 2;
          }

          .hero-indicators {
            bottom: 16px;
            gap: 8px;
          }

          .hero-dot {
            height: 10px;
            width: 10px;
            min-width: 10px;
          }

          .hero-dot.active {
            width: 30px;
          }
        }

        @media (min-width: 1025px) {
          .hero-image-wrapper {
            min-height: 400px;
            max-height: 65vh;
            width: 100%;
            overflow: hidden;
            position: relative;
          }
          
          .hero-image {
            width: 100%;
            height: 100%;
            min-height: 400px;
            max-height: 65vh;
            object-fit: cover;
            object-position: center;
            display: block;
          }

          .hero-overlay {
            padding: 50px 80px 60px;
          }

          .hero-title {
            font-size: 48px;
            max-width: 55%;
            margin-bottom: 8px;
          }

          .hero-description {
            font-size: 20px;
            max-width: 45%;
            -webkit-line-clamp: unset;
          }

          .hero-indicators {
            bottom: 30px;
            gap: 12px;
          }

          .hero-dot {
            height: 12px;
            width: 12px;
            min-width: 12px;
          }

          .hero-dot.active {
            width: 36px;
          }
        }

        /* ===== OFERTAS FLASH MODERNAS ===== */
        .flash-offers-wrapper {
          padding: 20px 30px;
          background: linear-gradient(135deg, #fff5f5, #ffffff);
          margin: 10px 20px;
          border-radius: 20px;
          box-shadow: 0 2px 20px rgba(0,0,0,0.05);
        }

        .flash-offers-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .flash-offers-title-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .flash-icon {
          font-size: 32px;
        }

        .flash-title {
          font-size: 28px;
          font-weight: 700;
          background: linear-gradient(135deg, #ff6b6b, #ee0a0a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }

        .flash-badge {
          background: #ff6b6b;
          color: #fff;
          padding: 2px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          animation: pulse-badge 2s infinite;
        }

        .flash-subtitle {
          color: #666;
          margin: 4px 0 0 0;
          font-size: 14px;
        }

        .flash-offers-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .flash-offer-card {
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 2px 10px rgba(0,0,0,0.06);
        }

        .flash-offer-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.12);
        }

        .flash-offer-image-wrapper {
          position: relative;
          width: 100%;
          padding-top: 66.67%;
          overflow: hidden;
        }

        .flash-offer-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .flash-offer-discount {
          position: absolute;
          top: 12px;
          left: 12px;
          background: linear-gradient(135deg, #ff6b6b, #ee0a0a);
          color: #fff;
          padding: 8px 12px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          align-items: center;
          line-height: 1;
          box-shadow: 0 4px 15px rgba(238,10,10,0.3);
        }

        .discount-number {
          font-size: 24px;
          font-weight: 800;
        }

        .discount-symbol {
          font-size: 14px;
          font-weight: 700;
        }

        .discount-label {
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .flash-offer-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px 20px;
          background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .flash-offer-title {
          color: #fff;
          font-size: 16px;
          font-weight: 600;
          margin: 0;
        }

        .flash-offer-arrow {
          color: #fff;
          font-size: 24px;
          font-weight: 300;
        }

        /* ===== CATEGORÍAS MODERNAS CON IMÁGENES ===== */
        .categories-modern-wrapper {
          padding: 30px 30px;
          margin: 10px 20px;
        }

        .categories-modern-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .categories-modern-title {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 4px 0;
        }

        .title-highlight {
          background: linear-gradient(135deg, #3483fa, #1a5cb5);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .categories-modern-subtitle {
          color: #666;
          font-size: 16px;
          margin: 0;
        }

        .categories-modern-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }

        .category-modern-card {
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          border: 1px solid #e8e8e8;
          transition: all 0.3s ease;
          background: #fff;
        }

        .category-modern-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.1);
          border-color: #3483fa;
        }

        .category-modern-image-wrapper {
          position: relative;
          width: 100%;
          padding-top: 75%;
          overflow: hidden;
        }

        .category-modern-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .category-modern-overlay {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px 12px;
          background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-end;
          min-height: 60%;
        }

        .category-emoji {
          font-size: 28px;
          margin-bottom: 4px;
        }

        .category-modern-name {
          font-size: 16px;
          font-weight: 600;
          color: #fff;
          margin: 0;
          text-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }

        .category-modern-count {
          font-size: 12px;
          color: rgba(255,255,255,0.8);
          margin-top: 2px;
        }

        .category-modern-hover-effect {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(52,131,250,0.1), rgba(26,92,181,0.2));
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .category-modern-card:hover .category-modern-hover-effect {
          opacity: 1;
        }

        .categories-modern-footer {
          text-align: center;
          margin-top: 24px;
        }

        .categories-modern-btn {
          background: linear-gradient(135deg, #3483fa, #1a5cb5);
          color: #fff;
          border: none;
          padding: 12px 32px;
          border-radius: 50px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .categories-modern-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(52,131,250,0.3);
        }

        .btn-arrow {
          font-size: 18px;
          transition: transform 0.3s ease;
        }

        .categories-modern-btn:hover .btn-arrow {
          transform: translateX(4px);
        }

        /* ===== PRODUCTOS NUEVOS ===== */
        .new-products-wrapper {
          padding: 30px 30px;
          margin: 10px 20px;
          background: linear-gradient(135deg, #f8faff, #ffffff);
          border-radius: 20px;
        }

        .new-products-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .new-products-title-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .new-products-icon {
          font-size: 28px;
        }

        .new-products-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #00a650, #00c853);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .new-products-subtitle {
          color: #666;
          font-size: 14px;
          margin: 4px 0 0 0;
        }

        .new-products-slider-container {
          position: relative;
        }

        .new-products-slider {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 12px 0;
          scroll-behavior: smooth;
          scrollbar-width: none;
        }

        .new-products-slider::-webkit-scrollbar {
          display: none;
        }

        .new-product-card {
          min-width: 220px;
          max-width: 220px;
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid #00a650;
          transition: all 0.3s ease;
          flex-shrink: 0;
          position: relative;
        }

        .new-product-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 40px rgba(0,166,80,0.15);
        }

        .new-product-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: #00a650;
          color: #fff;
          padding: 2px 12px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          z-index: 2;
        }

        .new-product-image-wrapper {
          position: relative;
          width: 100%;
          padding-top: 100%;
          overflow: hidden;
          background: #f5f5f5;
        }

        .new-product-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 12px;
        }

        .new-product-info {
          padding: 12px 16px 16px;
          text-align: center;
        }

        .new-product-name {
          font-size: 14px;
          font-weight: 500;
          margin: 0 0 4px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 36px;
        }

        .new-product-price {
          font-size: 20px;
          font-weight: 700;
          color: #00a650;
          margin-bottom: 8px;
        }

        .new-product-btn {
          background: #00a650;
          color: #fff;
          border: none;
          padding: 8px 0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          transition: all 0.3s ease;
        }

        .new-product-btn:hover {
          background: #008f44;
          transform: scale(1.02);
        }

        /* ===== PRODUCTOS EN OFERTA ===== */
        .sale-products-wrapper {
          padding: 30px 30px;
          margin: 10px 20px;
          background: linear-gradient(135deg, #fff5f5, #fff0f0);
          border-radius: 20px;
        }

        .sale-products-header {
          text-align: center;
          margin-bottom: 16px;
        }

        .sale-products-title-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .sale-icon {
          font-size: 28px;
        }

        .sale-products-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #ff6b6b, #ee0a0a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .sale-products-subtitle {
          color: #666;
          font-size: 14px;
          margin: 4px 0 0 0;
        }

        .sale-timer-container {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .sale-timer {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          padding: 10px 24px;
          border-radius: 16px;
          box-shadow: 0 2px 20px rgba(0,0,0,0.06);
        }

        .timer-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 40px;
        }

        .timer-value {
          font-size: 28px;
          font-weight: 800;
          color: #ee0a0a;
        }

        .timer-label {
          font-size: 10px;
          text-transform: uppercase;
          color: #999;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .timer-separator {
          color: #ccc;
          font-size: 24px;
          font-weight: 300;
        }

        .sale-products-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
        }

        .sale-product-card {
          background: #fff;
          border-radius: 16px;
          padding: 12px;
          cursor: pointer;
          position: relative;
          border: 1px solid #e8e8e8;
          transition: all 0.3s ease;
          text-align: center;
        }

        .sale-product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.1);
        }

        .sale-product-discount-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: linear-gradient(135deg, #ff6b6b, #ee0a0a);
          color: #fff;
          padding: 2px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 700;
          z-index: 2;
        }

        .sale-product-image {
          width: 100%;
          height: 140px;
          object-fit: contain;
          margin-bottom: 8px;
        }

        .sale-product-name {
          font-size: 14px;
          font-weight: 500;
          margin: 0 0 4px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 36px;
        }

        .sale-product-prices {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .sale-old-price {
          color: #999;
          text-decoration: line-through;
          font-size: 14px;
        }

        .sale-new-price {
          color: #ee0a0a;
          font-size: 20px;
          font-weight: 700;
        }

        .sale-product-btn {
          background: linear-gradient(135deg, #ff6b6b, #ee0a0a);
          color: #fff;
          border: none;
          padding: 8px 0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          transition: all 0.3s ease;
        }

        .sale-product-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(238,10,10,0.3);
        }

        .sale-products-footer {
          text-align: center;
          margin-top: 20px;
        }

        .sale-products-btn-all {
          background: linear-gradient(135deg, #ff6b6b, #ee0a0a);
          color: #fff;
          border: none;
          padding: 12px 32px;
          border-radius: 50px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .sale-products-btn-all:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(238,10,10,0.3);
        }

        /* ===== POPULAR CATEGORIES ===== */
        .popular-categories-wrapper {
          padding: 30px 30px;
          margin: 10px 20px;
        }

        .popular-categories-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .popular-categories-title-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .popular-icon {
          font-size: 28px;
        }

        .popular-categories-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #f5a623, #e09500);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .popular-categories-subtitle {
          color: #666;
          font-size: 14px;
          margin: 4px 0 0 0;
        }

        .popular-categories-slider-container {
          position: relative;
        }

        .popular-categories-slider {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 12px 0;
          scroll-behavior: smooth;
          scrollbar-width: none;
        }

        .popular-categories-slider::-webkit-scrollbar {
          display: none;
        }

        .popular-category-card {
          min-width: 220px;
          max-width: 220px;
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid #e8e8e8;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .popular-category-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.1);
        }

        .popular-category-image-wrapper {
          position: relative;
          width: 100%;
          padding-top: 100%;
          overflow: hidden;
        }

        .popular-category-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .popular-category-rank {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0,0,0,0.7);
          color: #fff;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
        }

        .popular-category-info {
          padding: 12px 16px;
          text-align: center;
        }

        .popular-category-name {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px 0;
        }

        .popular-category-badge {
          display: inline-block;
          background: linear-gradient(135deg, #f5a623, #e09500);
          color: #fff;
          padding: 2px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }

        /* ===== FEATURED PRODUCTS ===== */
        .featured-products-wrapper {
          padding: 30px 30px;
          margin: 10px 20px;
          background: linear-gradient(135deg, #f8faff, #ffffff);
          border-radius: 20px;
        }

        .featured-products-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .featured-products-title-group {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .featured-icon {
          font-size: 28px;
        }

        .featured-products-title {
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(135deg, #ff6b6b, #ee0a0a);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .featured-products-subtitle {
          color: #666;
          font-size: 14px;
          margin: 4px 0 0 0;
        }

        .featured-products-slider-container {
          position: relative;
        }

        .featured-products-slider {
          display: flex;
          gap: 16px;
          overflow-x: auto;
          padding: 12px 0;
          scroll-behavior: smooth;
          scrollbar-width: none;
        }

        .featured-products-slider::-webkit-scrollbar {
          display: none;
        }

        .featured-product-card {
          min-width: 220px;
          max-width: 220px;
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid #e8e8e8;
          transition: all 0.3s ease;
          flex-shrink: 0;
          position: relative;
        }

        .featured-product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.1);
        }

        .featured-fav-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: none;
          cursor: pointer;
          font-size: 16px;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .featured-fav-btn:hover {
          transform: scale(1.1);
        }

        .featured-product-image-wrapper {
          position: relative;
          width: 100%;
          padding-top: 100%;
          overflow: hidden;
          background: #f5f5f5;
        }

        .featured-product-image {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 12px;
        }

        .featured-product-info {
          padding: 12px 16px 16px;
          text-align: center;
        }

        .featured-product-name {
          font-size: 14px;
          font-weight: 500;
          margin: 0 0 4px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 36px;
        }

        .featured-product-desc {
          font-size: 12px;
          color: #666;
          margin: 0 0 8px 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          min-height: 32px;
        }

        .featured-product-price {
          font-size: 20px;
          font-weight: 700;
          color: #3483fa;
          margin-bottom: 8px;
        }

        .featured-product-btn {
          background: linear-gradient(135deg, #3483fa, #1a5cb5);
          color: #fff;
          border: none;
          padding: 8px 0;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          width: 100%;
          transition: all 0.3s ease;
        }

        .featured-product-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(52,131,250,0.3);
        }

        /* ===== SLIDER ARROWS MODERNOS ===== */
        .slider-arrow-modern {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: #fff;
          border: 1px solid #e8e8e8;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
          font-size: 20px;
          color: #333;
          box-shadow: 0 2px 12px rgba(0,0,0,0.08);
          z-index: 10;
          transition: all 0.3s ease;
        }

        .slider-arrow-modern:hover {
          background: #3483fa;
          color: #fff;
          border-color: #3483fa;
          box-shadow: 0 4px 20px rgba(52,131,250,0.3);
        }

        .slider-arrow-modern.left {
          left: -4px;
        }

        .slider-arrow-modern.right {
          right: -4px;
        }

        /* ===== EFECTOS GLOBALES ===== */
        .btn-shine {
          position: relative;
          overflow: hidden;
        }

        .btn-glow {
          position: relative;
          overflow: hidden;
        }

        .btn-glow:hover {
          transform: translateY(-2px);
        }

        /* ===== RESPONSIVE GENERAL ===== */
        @media (max-width: 768px) {
          .flash-offers-grid {
            grid-template-columns: 1fr;
          }

          .categories-modern-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .sale-products-grid {
            grid-template-columns: 1fr;
          }

          .flash-offers-wrapper,
          .categories-modern-wrapper,
          .new-products-wrapper,
          .sale-products-wrapper,
          .popular-categories-wrapper,
          .featured-products-wrapper {
            padding: 16px 12px;
            margin: 6px 8px;
          }

          .slider-arrow-modern {
            width: 32px;
            height: 32px;
            font-size: 16px;
          }

          .slider-arrow-modern.left {
            left: -2px;
          }

          .slider-arrow-modern.right {
            right: -2px;
          }

          .new-product-card,
          .popular-category-card,
          .featured-product-card {
            min-width: 160px;
            max-width: 160px;
          }

          .sale-timer {
            padding: 8px 16px;
            gap: 4px;
          }

          .timer-value {
            font-size: 20px;
          }

          .timer-unit {
            min-width: 30px;
          }

          .timer-separator {
            font-size: 18px;
          }

          .flash-title,
          .new-products-title,
          .sale-products-title,
          .popular-categories-title,
          .featured-products-title,
          .categories-modern-title {
            font-size: 22px;
          }
        }

        @media (max-width: 480px) {
          .categories-modern-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }

          .flash-offers-wrapper,
          .categories-modern-wrapper,
          .new-products-wrapper,
          .sale-products-wrapper,
          .popular-categories-wrapper,
          .featured-products-wrapper {
            padding: 12px 8px;
            margin: 4px 4px;
          }

          .new-product-card,
          .popular-category-card,
          .featured-product-card {
            min-width: 140px;
            max-width: 140px;
          }

          .category-modern-image-wrapper {
            padding-top: 100%;
          }

          .sale-timer {
            padding: 6px 12px;
            gap: 2px;
          }

          .timer-value {
            font-size: 16px;
          }

          .timer-unit {
            min-width: 24px;
          }

          .timer-separator {
            font-size: 14px;
          }

          .timer-label {
            font-size: 8px;
          }

          .flash-title,
          .new-products-title,
          .sale-products-title,
          .popular-categories-title,
          .featured-products-title,
          .categories-modern-title {
            font-size: 18px;
          }

          .categories-modern-btn {
            padding: 10px 20px;
            font-size: 14px;
          }

          .sale-products-btn-all {
            padding: 10px 20px;
            font-size: 14px;
          }

          .flash-icon,
          .new-products-icon,
          .sale-icon,
          .popular-icon,
          .featured-icon {
            font-size: 22px;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .sale-products-grid {
            grid-template-columns: repeat(3, 1fr);
          }

          .flash-offers-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .categories-modern-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
}

// =================================================
// ESTILOS - ESTILO MODERNO Y LLAMATIVO
// =================================================
const styles = {
  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "16px",
  },
  loader: {
    width: "48px",
    height: "48px",
    border: "3px solid rgba(52,131,250,0.15)",
    borderTop: "3px solid #3483fa",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loaderText: {
    color: "#666",
    fontSize: "16px",
    fontWeight: "400",
  },
  page: (darkMode) => ({
    background: darkMode 
      ? "#0f0f1a"
      : "#f8faff",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    overflowX: "hidden",
    color: darkMode ? "#f1f5f9" : "#333",
  }),
};