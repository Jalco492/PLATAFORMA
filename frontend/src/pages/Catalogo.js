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
    const cardWidth = isMobileView ? 165 : 240;
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

      {/* ===== HERO CARRUSEL ===== */}
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

      {/* OFERTAS ESPECIALES - BANNERS */}
      {bannersOfertas.length > 0 && (
        <div style={styles.ofertasBannerWrapper(isMobile)}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle(darkMode, isMobile, "gradient")}>
              🏷️ Ofertas especiales
            </h2>
            <p style={styles.sectionSubtitle(isMobile)}>
              Aprovecha descuentos increíbles en productos seleccionados
            </p>
          </div>

          <div style={styles.ofertasBannerGrid(isMobile, bannersOfertas.length)}>
            {bannersOfertas.map((banner, index) => (
              <div
                key={banner.id}
                style={styles.ofertaBannerCard(darkMode, isMobile)}
                onClick={() => {
                  if (banner.enlace_tipo === 'categoria' && banner.categoria_id) {
                    navigate(`/categoria-id/${banner.categoria_id}`);
                  } else if (banner.enlace_tipo === 'subcategoria' && banner.subcategoria_id) {
                    navigate(`/subcategorias/${banner.subcategoria_id}`);
                  } else if (banner.enlace_tipo === 'tipo' && banner.tipo_id) {
                    navigate(`/tipo/${banner.tipo_id}`);
                  } else if (banner.enlace_tipo === 'producto' && banner.producto_id) {
                    navigate(`/producto/${banner.producto_id}`);
                  } else if (banner.enlace_tipo === 'url' && banner.url_externa) {
                    window.open(banner.url_externa, '_blank');
                  } else {
                    navigate('/ofertas');
                  }
                }}
              >
                <div style={styles.ofertaBannerImageWrapper}>
                  <img
                    src={
                      banner.imagen
                        ? `https://backend-zuib.onrender.com${banner.imagen}`
                        : "https://via.placeholder.com/600x400/1e293b/60a5fa?text=Oferta"
                    }
                    alt={banner.titulo}
                    style={styles.ofertaBannerImage}
                    loading="lazy"
                    onError={(e) => {
                      e.target.src = "https://via.placeholder.com/600x400/1e293b/60a5fa?text=Oferta";
                    }}
                  />
                  <div style={styles.ofertaBannerOverlay}>
                    {banner.porcentaje && (
                      <span style={styles.ofertaBannerBadge}>🔥 {banner.porcentaje} OFF</span>
                    )}
                    <h3 style={styles.ofertaBannerTitle}>{banner.titulo}</h3>
                    {banner.descripcion && (
                      <p style={styles.ofertaBannerDesc}>{banner.descripcion}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CATEGORÍAS */}
      {categorias.length > 0 && (
        <div style={styles.categoriesSection(isMobile)}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle(darkMode, isMobile, "gradient")}>
              Explora nuestras categorías
            </h2>
            <p style={styles.sectionSubtitle(isMobile)}>
              Encuentra el producto perfecto para ti
            </p>
          </div>

          <div style={styles.categoriesGrid(isMobile)}>
            {categorias.slice(0, 8).map((cat, index) => {
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
                  style={styles.categoryCardWrapper}
                  onClick={() => navigate(`/categoria-id/${cat.id}`)}
                >
                  <div style={styles.categoryCard(darkMode)}>
                    <div style={styles.categoryBubble(darkMode)}>
                      <span style={styles.categoryBubbleText(isMobile)}>
                        {cat.nombre}
                      </span>
                    </div>
                    
                    <img
                      src={
                        productoCategoria
                          ? obtenerImagen(productoCategoria)
                          : "https://via.placeholder.com/300/1e293b/60a5fa?text=?"
                      }
                      alt={cat.nombre}
                      style={styles.categoryCardImage}
                      loading="lazy"
                    />
                    
                    <div style={styles.categoryCardFooter}>
                      <p style={styles.categoryCardCount(isMobile)}>
                        {count} productos
                      </p>
                      <span style={styles.categoryCardArrow}>→</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={styles.categoriesFooter}>
            <button
              style={styles.buttonPrimary(darkMode, isMobile)}
              onClick={() => navigate("/categorias")}
              className="btn-glow"
            >
              Ver todas las categorías →
            </button>
          </div>
        </div>
      )}

      {/* ===== PRODUCTOS NUEVOS ===== */}
      {productosNuevos.length > 0 && (
        <div
          id="productos-nuevos"
          className="slider-section"
          style={{
            ...styles.section(isMobile),
            position: "relative",
            overflow: "visible",
            zIndex: 10,
          }}
        >
          <div style={styles.sectionHeader}>
            <h2 style={{ ...styles.sectionTitle(darkMode, isMobile), textAlign: "center" }}>
              ✨ Productos Nuevos
            </h2>
            <p style={{ ...styles.sectionSubtitle(isMobile), textAlign: "center" }}>
              Lo último en tendencia
            </p>
          </div>

          <div style={{ position: "relative", width: "100%" }}>
            <button
              onClick={() => scrollSlider("nuevoSlider", "left")}
              style={styles.arrowLeft(isMobile)}
              className="slider-arrow"
              aria-label="Desplazar izquierda"
            >
              ❮
            </button>
            <button
              onClick={() => scrollSlider("nuevoSlider", "right")}
              style={styles.arrowRight(isMobile)}
              className="slider-arrow"
              aria-label="Desplazar derecha"
            >
              ❯
            </button>

            <div 
              id="nuevoSlider" 
              style={{
                display: "flex",
                gap: "16px",
                overflowX: "auto",
                overflowY: "visible",
                padding: "12px 40px 20px 40px",
                WebkitOverflowScrolling: "touch",
                scrollBehavior: "smooth",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                position: "relative",
                zIndex: 5,
              }}
            >
              {productosNuevos.map((p, index) => (
                <div
                  key={p.id}
                  className="slider-card"
                  style={{
                    ...styles.nuevoCard(darkMode, isMobile),
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 5,
                    minWidth: isMobile ? "165px" : "240px",
                    maxWidth: isMobile ? "165px" : "240px",
                    opacity: 1,
                    transform: "none",
                  }}
                  onClick={() => navigate(`/producto/${p.id}`)}
                >
                  <div style={styles.nuevoBadge}>🆕 Nuevo</div>
                  <div style={styles.cardImageWrapper}>
                    <img
                      src={
                        p.imagenes
                          ? `https://backend-zuib.onrender.com${p.imagenes.split(",")[0]}`
                          : "https://via.placeholder.com/200"
                      }
                      alt={p.nombre}
                      className="slider-image"
                      style={styles.sliderImage}
                      loading="lazy"
                    />
                  </div>
                  <div style={styles.cardContent}>
                    <h3 style={styles.cardTitle(isMobile)}>{p.nombre}</h3>
                    <div style={styles.cardPriceContainer}>
                      <span style={styles.cardPrice(isMobile)}>${p.precio}</span>
                    </div>
                    <button style={styles.cardButton} className="btn-shine">
                      Ver producto →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== PRODUCTOS EN OFERTA - CENTRADOS ===== */}
      {mostrarOfertas && productosOferta.length > 0 && (
        <div style={styles.ofertaProductosWrapper(isMobile)}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle(darkMode, isMobile, "gradient")}>
              🔥 Productos en Oferta
            </h2>
            <p style={styles.sectionSubtitle(isMobile)}>
              Aprovecha antes de que termine el tiempo
            </p>
          </div>

          <div style={styles.timerContainer}>
            <div style={styles.timerBox} className="timer-glow">
              <div style={styles.timerItem}>
                <span style={styles.timerNumber}>{String(tiempoRestante.dias).padStart(2, '0')}</span>
                <span style={styles.timerLabel}>Días</span>
              </div>
              <span style={styles.timerSeparator}>:</span>
              <div style={styles.timerItem}>
                <span style={styles.timerNumber}>{String(tiempoRestante.horas).padStart(2, '0')}</span>
                <span style={styles.timerLabel}>Horas</span>
              </div>
              <span style={styles.timerSeparator}>:</span>
              <div style={styles.timerItem}>
                <span style={styles.timerNumber}>{String(tiempoRestante.minutos).padStart(2, '0')}</span>
                <span style={styles.timerLabel}>Min</span>
              </div>
              <span style={styles.timerSeparator}>:</span>
              <div style={styles.timerItem}>
                <span style={styles.timerNumber}>{String(tiempoRestante.segundos).padStart(2, '0')}</span>
                <span style={styles.timerLabel}>Seg</span>
              </div>
            </div>
          </div>

          {/* Grid centrado para productos en oferta */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            width: "100%",
            maxWidth: "100%",
          }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
              gap: isMobile ? "14px" : "22px",
              width: "100%",
              maxWidth: isMobile ? "100%" : "900px",
              justifyContent: "center",
            }}>
              {productosOferta.slice(0, 6).map((p, index) => (
                <div
                  key={p.id}
                  style={{
                    ...styles.productCard(darkMode, isMobile),
                    opacity: 1,
                    transform: "none",
                    width: "100%",
                    maxWidth: "100%",
                  }}
                  onClick={() => navigate(`/producto/${p.id}`)}
                >
                  <div style={styles.ofertaProductoBadge}>🔥 OFERTA</div>
                  <img
                    src={
                      p.imagenes
                        ? `https://backend-zuib.onrender.com${p.imagenes.split(",")[0]}`
                        : "https://via.placeholder.com/300"
                    }
                    alt={p.nombre}
                    style={styles.productImage(isMobile)}
                    loading="lazy"
                  />
                  <h3 style={styles.productName(darkMode, isMobile)}>
                    {p.nombre}
                  </h3>
                  <div style={styles.productPrices}>
                    <span style={styles.productOldPrice}>${p.precio}</span>
                    <span style={styles.productNewPrice}>
                      ${p.precioOferta || (p.precio * 0.8).toFixed(2)}
                    </span>
                  </div>
                  <button style={styles.productButton} className="btn-shine">
                    Ver producto →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {productosOferta.length > 6 && (
            <div style={styles.verTodosContainer}>
              <button
                style={styles.buttonDanger(darkMode, isMobile)}
                onClick={irAMasVendidos}
                className="btn-glow"
              >
                Ver todos los productos en oferta →
              </button>
            </div>
          )}
        </div>
      )}

      {/* MENSAJE CUANDO LAS OFERTAS HAN TERMINADO */}
      {!mostrarOfertas && productosOferta.length > 0 && (
        <div style={styles.ofertaProductosWrapper(isMobile)}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle(darkMode, isMobile, "gradient")}>
              ⏰ ¡Ofertas Finalizadas!
            </h2>
            <p style={styles.sectionSubtitle(isMobile)}>
              Las ofertas especiales han terminado. ¡Vuelve pronto para más promociones!
            </p>
          </div>
          
          <div style={styles.timerContainer}>
            <div style={styles.timerBox}>
              <div style={styles.timerItem}>
                <span style={styles.timerNumber}>00</span>
                <span style={styles.timerLabel}>Días</span>
              </div>
              <span style={styles.timerSeparator}>:</span>
              <div style={styles.timerItem}>
                <span style={styles.timerNumber}>00</span>
                <span style={styles.timerLabel}>Horas</span>
              </div>
              <span style={styles.timerSeparator}>:</span>
              <div style={styles.timerItem}>
                <span style={styles.timerNumber}>00</span>
                <span style={styles.timerLabel}>Min</span>
              </div>
              <span style={styles.timerSeparator}>:</span>
              <div style={styles.timerItem}>
                <span style={styles.timerNumber}>00</span>
                <span style={styles.timerLabel}>Seg</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CATEGORÍAS MÁS VENDIDAS ===== */}
      {categoriasDestacadas.length > 0 && (
        <div
          className="slider-section"
          style={{
            ...styles.section(isMobile),
            position: "relative",
            overflow: "visible",
            zIndex: 10,
          }}
        >
          <div style={styles.sectionHeader}>
            <h2 style={{ ...styles.sectionTitle(darkMode, isMobile), textAlign: "center" }}>
              🔥 Categorías más vendidas
            </h2>
            <p style={{ ...styles.sectionSubtitle(isMobile), textAlign: "center" }}>
              Las favoritas de nuestra comunidad
            </p>
          </div>

          <div style={{ position: "relative", width: "100%" }}>
            <button
              onClick={() => scrollSlider("vendidasSlider", "left")}
              style={styles.arrowLeft(isMobile)}
              className="slider-arrow"
              aria-label="Desplazar izquierda"
            >
              ❮
            </button>
            <button
              onClick={() => scrollSlider("vendidasSlider", "right")}
              style={styles.arrowRight(isMobile)}
              className="slider-arrow"
              aria-label="Desplazar derecha"
            >
              ❯
            </button>

            <div 
              id="vendidasSlider" 
              style={{
                display: "flex",
                gap: "16px",
                overflowX: "auto",
                overflowY: "visible",
                padding: "12px 40px 20px 40px",
                WebkitOverflowScrolling: "touch",
                scrollBehavior: "smooth",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                position: "relative",
                zIndex: 5,
              }}
            >
              {categoriasDestacadas.map((p, index) => (
                <div
                  key={index}
                  className="slider-card"
                  style={{
                    ...styles.sliderCard(darkMode, isMobile),
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 5,
                    minWidth: isMobile ? "165px" : "240px",
                    maxWidth: isMobile ? "165px" : "240px",
                    opacity: 1,
                    transform: "none",
                  }}
                  onClick={() => navigate(`/categoria-id/${p.categoria_id}`)}
                >
                  <div style={styles.cardImageWrapper}>
                    <img
                      src={obtenerImagen(p)}
                      alt={p.nombre}
                      className="slider-image"
                      style={styles.sliderImage}
                      loading="lazy"
                    />
                  </div>
                  <div style={styles.cardContent}>
                    <h3 style={styles.cardTitle(isMobile)}>{p.categoria}</h3>
                    <div style={styles.cardBadge}>⭐ Popular</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== PRODUCTOS DESTACADOS ===== */}
      {destacados.length > 0 && (
        <div
          className="slider-section"
          style={{
            ...styles.section(isMobile),
            position: "relative",
            overflow: "visible",
            zIndex: 10,
          }}
        >
          <div style={styles.sectionHeader}>
            <h2 style={{ ...styles.sectionTitle(darkMode, isMobile), textAlign: "center" }}>
              ⭐ Productos destacados
            </h2>
            <p style={{ ...styles.sectionSubtitle(isMobile), textAlign: "center" }}>
              Los productos más valorados por nuestros clientes
            </p>
          </div>

          <div style={{ position: "relative", width: "100%" }}>
            <button
              onClick={() => scrollSlider("destacadosSlider", "left")}
              style={styles.arrowLeft(isMobile)}
              className="slider-arrow"
              aria-label="Desplazar izquierda"
            >
              ❮
            </button>
            <button
              onClick={() => scrollSlider("destacadosSlider", "right")}
              style={styles.arrowRight(isMobile)}
              className="slider-arrow"
              aria-label="Desplazar derecha"
            >
              ❯
            </button>

            <div 
              id="destacadosSlider" 
              style={{
                display: "flex",
                gap: "16px",
                overflowX: "auto",
                overflowY: "visible",
                padding: "12px 40px 20px 40px",
                WebkitOverflowScrolling: "touch",
                scrollBehavior: "smooth",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                position: "relative",
                zIndex: 5,
              }}
            >
              {destacados.map((p, index) => (
                <div
                  key={index}
                  className="slider-card"
                  style={{
                    ...styles.sliderCard(darkMode, isMobile),
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 5,
                    minWidth: isMobile ? "165px" : "240px",
                    maxWidth: isMobile ? "165px" : "240px",
                    opacity: 1,
                    transform: "none",
                  }}
                  onClick={() => navigate(`/producto/${p.id}`)}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorito(p);
                    }}
                    style={{
                      ...styles.favBtn,
                      background: esFavorito(p.id) ? "#dc2626" : "rgba(255,255,255,0.9)",
                      color: esFavorito(p.id) ? "#fff" : "#333",
                      zIndex: 15,
                    }}
                  >
                    {esFavorito(p.id) ? "❤️" : "🤍"}
                  </button>
                  <div style={styles.cardImageWrapper}>
                    <img
                      src={obtenerImagen(p)}
                      alt={p.nombre}
                      className="slider-image"
                      style={styles.sliderImage}
                      loading="lazy"
                    />
                  </div>
                  <div style={styles.cardContent}>
                    <h3 style={styles.cardTitle(isMobile)}>{p.nombre}</h3>
                    {!isMobile && <p style={styles.cardDesc}>{p.descripcion}</p>}
                    <div style={styles.cardPriceContainer}>
                      <span style={styles.cardPrice(isMobile)}>${p.precio}</span>
                      {p.precioOferta && (
                        <span style={styles.cardOldPrice}>${p.precio}</span>
                      )}
                    </div>
                    <button style={styles.cardButton} className="btn-shine">
                      Ver producto →
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

        /* ===== FORZAR QUE TODOS LOS ELEMENTOS SEAN VISIBLES Y FIJOS ===== */
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

        [data-animate].is-visible {
          opacity: 1 !important;
          transform: none !important;
        }

        .slider-card {
          opacity: 1 !important;
          transform: none !important;
          visibility: visible !important;
        }

        .slider-card:hover {
          transform: translateY(-8px) scale(1.02) !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.15) !important;
          z-index: 20 !important;
        }

        .slider-card:hover .slider-image {
          transform: scale(1.08) !important;
        }

        .slider-card:hover .card-button {
          background: linear-gradient(135deg, #2563eb, #1d4ed8) !important;
          transform: scale(1.02) !important;
        }

        .category-card-hover:hover {
          transform: translateY(-10px) scale(1.02) !important;
          box-shadow: 0 20px 50px rgba(59, 130, 246, 0.25) !important;
        }

        /* ===== MEJORAS PARA SLIDERS ===== */
        .slider-section {
          overflow: visible !important;
          position: relative;
          z-index: 10;
        }

        .slider-section .slider-card {
          overflow: visible !important;
          z-index: 5;
        }

        .slider-section .slider-card:hover {
          z-index: 20 !important;
        }

        .slider-section #nuevoSlider,
        .slider-section #vendidasSlider,
        .slider-section #destacadosSlider {
          overflow-x: auto !important;
          overflow-y: visible !important;
          padding: 12px 40px 20px 40px !important;
          margin: 0 !important;
        }

        .slider-section .slider-arrow {
          z-index: 50 !important;
        }

        /* ===== KEYFRAMES ===== */
        @keyframes timerPulse {
          0%, 100% {
            box-shadow: 0 0 30px rgba(59,130,246,0.2), inset 0 0 30px rgba(59,130,246,0.05);
          }
          50% {
            box-shadow: 0 0 50px rgba(59,130,246,0.4), inset 0 0 50px rgba(59,130,246,0.1);
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }

        /* ===== EFECTOS ESPECIALES ===== */
        .timer-glow {
          animation: timerPulse 2s ease-in-out infinite !important;
        }

        .btn-glow {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease !important;
        }

        .btn-glow::before {
          content: '';
          position: absolute;
          top: -2px;
          left: -2px;
          right: -2px;
          bottom: -2px;
          background: linear-gradient(45deg, #3b82f6, #8b5cf6, #3b82f6);
          background-size: 200% 200%;
          border-radius: 14px;
          opacity: 0;
          transition: opacity 0.3s ease !important;
          z-index: -1;
          animation: shimmer 3s ease-in-out infinite !important;
        }

        .btn-glow:hover::before {
          opacity: 1;
        }

        .btn-shine {
          position: relative;
          overflow: hidden;
        }

        .slider-arrow {
          transition: all 0.3s ease !important;
          z-index: 50 !important;
        }

        .slider-arrow:hover {
          transform: translateY(-50%) scale(1.1) !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
          background: rgba(255,255,255,1) !important;
        }

        /* ===== HERO BANNER ===== */
        .hero-wrapper {
          width: 100%;
          max-width: 100%;
          padding: 0;
          margin: 0;
          overflow: hidden;
          background: #0f172a;
        }

        .hero-container {
          position: relative;
          width: 100%;
          max-width: 100%;
          overflow: hidden;
          background: #0f172a;
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
          background: #0f172a;
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
          background: linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.4) 60%, transparent 100%);
          color: #ffffff;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          pointer-events: none;
        }

        .hero-title {
          font-size: 20px;
          font-weight: 800;
          margin: 0 0 4px 0;
          line-height: 1.2;
          letter-spacing: -0.02em;
          text-shadow: 0 2px 12px rgba(0,0,0,0.5);
          max-width: 85%;
        }

        .hero-description {
          font-size: 12px;
          margin: 0;
          opacity: 0.9;
          text-shadow: 0 2px 8px rgba(0,0,0,0.5);
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
          gap: 8px;
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
          background: rgba(255,255,255,0.4);
          transition: all 0.3s ease !important;
        }

        .hero-dot.active {
          background: #3b82f6;
          width: 24px;
          border-radius: 4px;
        }

        /* ===== MÓVIL ===== */
        @media (max-width: 767px) {
          .hero-image-wrapper {
            min-height: 280px;
            max-height: 70vh;
            width: 100%;
            overflow: hidden;
            position: relative;
            background: #0f172a;
          }
          
          .hero-image {
            width: 100%;
            height: 100%;
            min-height: 280px;
            max-height: 70vh;
            object-fit: contain;
            object-position: center;
            display: block;
            background: #0f172a;
          }

          .hero-overlay {
            padding: 20px 20px 24px;
          }

          .hero-title {
            font-size: 22px;
            max-width: 90%;
            margin-bottom: 6px;
          }

          .hero-description {
            font-size: 13px;
            max-width: 90%;
            -webkit-line-clamp: 2;
          }

          .hero-indicators {
            bottom: 12px;
            gap: 8px;
          }

          .hero-dot {
            height: 8px;
            width: 8px;
            min-width: 8px;
          }

          .hero-dot.active {
            width: 22px;
          }

          .slider-section .slider-arrow {
            width: 30px !important;
            height: 30px !important;
            font-size: 12px !important;
          }
        }

        /* ===== TABLET ===== */
        @media (min-width: 768px) and (max-width: 1024px) {
          .hero-image-wrapper {
            min-height: 350px;
            max-height: 55vh;
            width: 100%;
            overflow: hidden;
            position: relative;
          }
          
          .hero-image {
            width: 100%;
            height: 100%;
            min-height: 350px;
            max-height: 55vh;
            object-fit: cover;
            object-position: center;
            display: block;
          }

          .hero-overlay {
            padding: 28px 36px 32px;
          }

          .hero-title {
            font-size: 30px;
            max-width: 70%;
          }

          .hero-description {
            font-size: 16px;
            max-width: 60%;
            -webkit-line-clamp: 2;
          }

          .hero-indicators {
            bottom: 16px;
            gap: 10px;
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

        /* ===== DESKTOP ===== */
        @media (min-width: 1025px) {
          .hero-image-wrapper {
            min-height: 450px;
            max-height: 70vh;
            width: 100%;
            overflow: hidden;
            position: relative;
          }
          
          .hero-image {
            width: 100%;
            height: 100%;
            min-height: 450px;
            max-height: 70vh;
            object-fit: cover;
            object-position: center;
            display: block;
          }

          .hero-overlay {
            padding: 50px 60px;
          }

          .hero-title {
            font-size: 46px;
            max-width: 60%;
            margin-bottom: 8px;
          }

          .hero-description {
            font-size: 20px;
            max-width: 50%;
            -webkit-line-clamp: unset;
          }

          .hero-indicators {
            bottom: 24px;
            gap: 12px;
          }

          .hero-dot {
            height: 12px;
            width: 12px;
            min-width: 12px;
          }

          .hero-dot.active {
            width: 40px;
          }
        }

        @media (max-width: 480px) {
          .slider-section #nuevoSlider,
          .slider-section #vendidasSlider,
          .slider-section #destacadosSlider {
            padding: 12px 30px 20px 30px !important;
          }
        }
      `}</style>
    </div>
  );
}

// =================================================
// ESTILOS - COMPLETOS
// =================================================
const styles = {
  loaderContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "60vh",
    gap: "20px",
  },
  loader: {
    width: "50px",
    height: "50px",
    border: "4px solid rgba(59,130,246,0.1)",
    borderTop: "4px solid #3b82f6",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loaderText: {
    color: "#64748b",
    fontSize: "16px",
    fontWeight: "500",
  },
  page: (darkMode) => ({
    background: darkMode 
      ? "linear-gradient(180deg, #0f172a 0%, #1a2332 30%, #0f172a 60%, #1a2332 100%)"
      : "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 30%, #f1f5f9 60%, #e2e8f0 100%)",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    overflowX: "hidden",
    color: darkMode ? "#f1f5f9" : "#0f172a",
  }),
  sectionHeader: {
    textAlign: "center",
    marginBottom: "28px",
  },
  sectionTitle: (darkMode, isMobile, type) => ({
    fontSize: isMobile ? "24px" : "38px",
    fontWeight: "800",
    marginBottom: "6px",
    letterSpacing: "-0.02em",
    color: darkMode ? "#f1f5f9" : "#0f172a",
    ...(type === "gradient" && {
      background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
    }),
  }),
  sectionSubtitle: (isMobile) => ({
    fontSize: isMobile ? "14px" : "18px",
    color: "#94a3b8",
    fontWeight: "400",
    marginTop: "2px",
  }),
  buttonPrimary: (darkMode, isMobile) => ({
    padding: isMobile ? "12px 28px" : "14px 44px",
    fontSize: isMobile ? "14px" : "16px",
    fontWeight: "700",
    color: "#ffffff",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    boxShadow: "0 4px 24px rgba(59,130,246,0.35)",
    letterSpacing: "0.3px",
  }),
  buttonDanger: (darkMode, isMobile) => ({
    padding: isMobile ? "12px 28px" : "14px 44px",
    fontSize: isMobile ? "14px" : "16px",
    fontWeight: "700",
    color: "#ffffff",
    background: "linear-gradient(135deg, #dc2626, #b91c1c)",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    boxShadow: "0 4px 24px rgba(220,38,38,0.35)",
    letterSpacing: "0.3px",
  }),
  categoriesSection: (isMobile) => ({
    margin: isMobile ? "16px 12px" : "32px 32px",
    padding: isMobile ? "20px 12px" : "40px 24px",
    background: "transparent",
    borderRadius: isMobile ? "16px" : "24px",
  }),
  categoriesGrid: (isMobile) => ({
    display: "grid",
    gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
    gap: isMobile ? "16px" : "24px",
  }),
  categoryCardWrapper: {
    width: "100%",
  },
  categoryCard: (darkMode) => ({
    background: darkMode ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    borderRadius: "20px",
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    border: darkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.04)",
    position: "relative",
    height: "100%",
    display: "flex",
    flexDirection: "column",
  }),
  categoryBubble: (darkMode) => ({
    position: "absolute",
    top: "12px",
    left: "12px",
    zIndex: 10,
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    padding: "6px 14px",
    borderRadius: "20px",
    boxShadow: "0 4px 20px rgba(59,130,246,0.4)",
    border: "2px solid rgba(255,255,255,0.2)",
  }),
  categoryBubbleText: (isMobile) => ({
    color: "#fff",
    fontSize: isMobile ? "10px" : "13px",
    fontWeight: "700",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
    textShadow: "0 2px 8px rgba(0,0,0,0.2)",
  }),
  categoryCardImage: {
    width: "100%",
    height: "180px",
    objectFit: "cover",
    background: "#f8fafc",
  },
  categoryCardFooter: {
    padding: "12px 16px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryCardCount: (isMobile) => ({
    fontSize: isMobile ? "12px" : "14px",
    color: "#64748b",
    fontWeight: "500",
    margin: 0,
  }),
  categoryCardArrow: {
    fontSize: "20px",
    fontWeight: "300",
    color: "#3b82f6",
  },
  categoriesFooter: {
    display: "flex",
    justifyContent: "center",
    marginTop: "28px",
  },
  ofertasBannerWrapper: (isMobile) => ({
    margin: isMobile ? "16px 12px" : "32px 32px",
    padding: isMobile ? "16px 12px" : "32px 24px",
    background: "transparent",
    borderRadius: isMobile ? "16px" : "24px",
    width: "auto",
    maxWidth: "100%",
  }),
  ofertasBannerGrid: (isMobile, totalBanners) => ({
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : totalBanners === 1 ? "1fr" : totalBanners === 2 ? "repeat(2, 1fr)" : "repeat(3, 1fr)",
    gap: isMobile ? "16px" : "20px",
    width: "100%",
    maxWidth: "100%",
  }),
  ofertaBannerCard: (darkMode, isMobile) => ({
    borderRadius: isMobile ? "14px" : "18px",
    overflow: "hidden",
    cursor: "pointer",
    boxShadow: darkMode ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(0,0,0,0.06)",
    background: darkMode ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.9)",
    border: darkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.04)",
    width: "100%",
    maxWidth: "100%",
    height: "100%",
  }),
  ofertaBannerImageWrapper: {
    position: "relative",
    width: "100%",
    paddingTop: "56.25%",
    overflow: "hidden",
  },
  ofertaBannerImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  ofertaBannerOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: "16px 20px",
    background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    minHeight: "40%",
  },
  ofertaBannerBadge: {
    background: "linear-gradient(135deg, #dc2626, #b91c1c)",
    color: "#fff",
    fontSize: "14px",
    fontWeight: "800",
    padding: "4px 16px",
    borderRadius: "20px",
    marginBottom: "6px",
    textTransform: "uppercase",
    boxShadow: "0 2px 12px rgba(220,38,38,0.4)",
  },
  ofertaBannerTitle: {
    fontSize: "18px",
    fontWeight: "700",
    margin: "0",
    textAlign: "center",
    textShadow: "0 2px 8px rgba(0,0,0,0.5)",
  },
  ofertaBannerDesc: {
    fontSize: "13px",
    opacity: 0.8,
    margin: "4px 0 0 0",
    textShadow: "0 2px 8px rgba(0,0,0,0.5)",
  },
  ofertaProductosWrapper: (isMobile) => ({
    margin: isMobile ? "16px 12px" : "32px 32px",
    padding: isMobile ? "20px 12px" : "40px 24px",
    background: "transparent",
    borderRadius: isMobile ? "16px" : "24px",
    position: "relative",
    overflow: "hidden",
    width: "auto",
    maxWidth: "100%",
  }),
  timerContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "28px",
    width: "100%",
    maxWidth: "100%",
    overflow: "hidden",
  },
  timerBox: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    background: "rgba(15,23,42,0.8)",
    backdropFilter: "blur(10px)",
    padding: "16px 32px",
    borderRadius: "20px",
    border: "2px solid rgba(96,165,250,0.2)",
    boxShadow: "0 0 40px rgba(59,130,246,0.15), inset 0 0 40px rgba(59,130,246,0.05)",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  timerItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    minWidth: "55px",
  },
  timerNumber: {
    fontSize: "32px",
    fontWeight: "800",
    background: "linear-gradient(135deg, #60a5fa, #93c5fd)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    letterSpacing: "2px",
  },
  timerLabel: {
    fontSize: "11px",
    textTransform: "uppercase",
    color: "#93c5fd",
    opacity: 0.7,
    letterSpacing: "1px",
    fontWeight: "600",
  },
  timerSeparator: {
    color: "#60a5fa",
    fontSize: "32px",
    fontWeight: "700",
    opacity: 0.4,
  },
  productCard: (darkMode, isMobile) => ({
    background: darkMode ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    borderRadius: isMobile ? "14px" : "20px",
    padding: isMobile ? "14px" : "20px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
    cursor: "pointer",
    border: darkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
    width: "100%",
    maxWidth: "100%",
    height: "100%",
    minHeight: "280px",
    overflow: "hidden",
  }),
  ofertaProductoBadge: {
    position: "absolute",
    top: "10px",
    left: "10px",
    background: "linear-gradient(135deg, #dc2626, #b91c1c)",
    color: "#fff",
    padding: "4px 14px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    zIndex: 10,
    letterSpacing: "0.3px",
    boxShadow: "0 2px 10px rgba(220,38,38,0.4)",
  },
  productImage: (isMobile) => ({
    width: "100%",
    height: isMobile ? "120px" : "180px",
    objectFit: "contain",
    borderRadius: "12px",
    marginBottom: "10px",
    background: "rgba(255,255,255,0.3)",
    padding: "10px",
    maxWidth: "100%",
  }),
  productName: (darkMode, isMobile) => ({
    fontSize: isMobile ? "13px" : "16px",
    fontWeight: "600",
    margin: "4px 0",
    textAlign: "center",
    color: darkMode ? "#f1f5f9" : "#0f172a",
    lineHeight: "1.3",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    minHeight: isMobile ? "34px" : "42px",
    width: "100%",
  }),
  productPrices: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "12px",
    marginTop: "4px",
    width: "100%",
    flexWrap: "wrap",
  },
  productOldPrice: {
    color: "#94a3b8",
    textDecoration: "line-through",
    fontSize: "14px",
  },
  productNewPrice: {
    color: "#dc2626",
    fontWeight: "700",
    fontSize: "22px",
  },
  productButton: {
    marginTop: "12px",
    padding: "8px 20px",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#fff",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    textAlign: "center",
    border: "none",
    maxWidth: "100%",
  },
  verTodosContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: "32px",
    width: "100%",
  },
  section: (isMobile) => ({
    margin: isMobile ? "16px 8px" : "40px 24px",
    background: "transparent",
    borderRadius: isMobile ? "16px" : "24px",
    padding: isMobile ? "16px 4px 30px 4px" : "24px 12px 40px 12px",
    boxSizing: "border-box",
    overflow: "visible !important",
    position: "relative",
    zIndex: 10,
    width: "auto",
    maxWidth: "100%",
  }),
  sliderCard: (darkMode, isMobile) => ({
    minWidth: isMobile ? "165px" : "240px",
    maxWidth: isMobile ? "165px" : "240px",
    background: darkMode ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    borderRadius: isMobile ? "16px" : "22px",
    padding: isMobile ? "12px" : "18px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    cursor: "pointer",
    position: "relative",
    flexShrink: 0,
    border: darkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 5,
    overflow: "hidden",
  }),
  nuevoCard: (darkMode, isMobile) => ({
    minWidth: isMobile ? "165px" : "240px",
    maxWidth: isMobile ? "165px" : "240px",
    background: darkMode ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    borderRadius: isMobile ? "16px" : "22px",
    padding: isMobile ? "12px" : "18px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    cursor: "pointer",
    position: "relative",
    flexShrink: 0,
    border: "2px solid #10b981",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 5,
    overflow: "hidden",
  }),
  cardImageWrapper: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    borderRadius: "14px",
    background: "rgba(248,250,252,0.5)",
  },
  sliderImage: {
    width: "100%",
    height: "170px",
    objectFit: "contain",
    padding: "10px",
    background: "linear-gradient(135deg, #f8fafc, #f1f5f9)",
  },
  cardContent: {
    width: "100%",
    padding: "12px 4px 4px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
  },
  cardTitle: (isMobile) => ({
    fontSize: isMobile ? "14px" : "16px",
    fontWeight: "600",
    margin: "0",
    textAlign: "center",
    color: "#0f172a",
    lineHeight: "1.3",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    minHeight: isMobile ? "36px" : "42px",
  }),
  cardPriceContainer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    marginTop: "2px",
  },
  cardPrice: (isMobile) => ({
    color: "#2563eb",
    fontWeight: "700",
    fontSize: isMobile ? "18px" : "22px",
    letterSpacing: "-0.01em",
  }),
  cardOldPrice: {
    color: "#94a3b8",
    textDecoration: "line-through",
    fontSize: "14px",
  },
  cardButton: {
    marginTop: "8px",
    padding: "6px 16px",
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#fff",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
    cursor: "pointer",
    width: "100%",
    textAlign: "center",
    border: "none",
  },
  cardBadge: {
    background: "linear-gradient(135deg, #f59e0b, #d97706)",
    color: "#fff",
    padding: "2px 14px",
    borderRadius: "14px",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.3px",
    marginTop: "2px",
  },
  cardDesc: {
    color: "#64748b",
    fontSize: "13px",
    lineHeight: "1.4",
    margin: "2px 0",
    textAlign: "center",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    minHeight: "36px",
  },
  nuevoBadge: {
    position: "absolute",
    top: "10px",
    left: "10px",
    background: "#10b981",
    color: "#fff",
    padding: "4px 14px",
    borderRadius: "20px",
    fontSize: "11px",
    fontWeight: "700",
    zIndex: 10,
    letterSpacing: "0.3px",
    boxShadow: "0 2px 10px rgba(16,185,129,0.3)",
  },
  favBtn: {
    position: "absolute",
    top: "10px",
    right: "10px",
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    border: "none",
    cursor: "pointer",
    fontSize: "16px",
    zIndex: 15,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
  },
  arrowLeft: (isMobile) => ({
    position: "absolute",
    left: isMobile ? "2px" : "8px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.95)",
    border: "1px solid #e2e8f0",
    width: isMobile ? "30px" : "44px",
    height: isMobile ? "30px" : "44px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: isMobile ? "12px" : "18px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    zIndex: 50,
    backdropFilter: "blur(10px)",
    userSelect: "none",
  }),
  arrowRight: (isMobile) => ({
    position: "absolute",
    right: isMobile ? "2px" : "8px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.95)",
    border: "1px solid #e2e8f0",
    width: isMobile ? "30px" : "44px",
    height: isMobile ? "30px" : "44px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: isMobile ? "12px" : "18px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
    zIndex: 50,
    backdropFilter: "blur(10px)",
    userSelect: "none",
  }),
};