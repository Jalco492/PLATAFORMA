import { useEffect, useState, useRef } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";
import { useLocation } from "react-router-dom";

// ===== HOOK PERSONALIZADO PARA ANIMACIONES DE SCROLL =====
function useScrollAnimation(initialState = {}) {
  const [visibleSections, setVisibleSections] = useState(initialState);
  const [scrollY, setScrollY] = useState(0);
  const animationFrameRef = useRef(null);
  const timeoutRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (animationFrameRef.current) return;
      animationFrameRef.current = requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        animationFrameRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    let debounceTimeout = null;
    
    const checkVisibility = () => {
      const elements = document.querySelectorAll("[data-animate]:not(.is-visible)");
      const updates = {};
      
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
        const id = el.getAttribute('data-animate');
        if (isVisible && id && !visibleSections[id]) {
          updates[id] = true;
          el.classList.add('is-visible');
        }
      });

      if (Object.keys(updates).length > 0) {
        setVisibleSections(prev => ({ ...prev, ...updates }));
      }
    };

    const debouncedCheck = () => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(checkVisibility, 150);
    };

    const observer = new MutationObserver((mutations) => {
      const hasNewElements = mutations.some(m => 
        m.type === 'childList' && m.addedNodes.length > 0
      );
      if (hasNewElements) {
        debouncedCheck();
      }
    });

    observerRef.current = observer;
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributes: false,
      characterData: false
    });

    timeoutRef.current = setTimeout(checkVisibility, 200);
    window.addEventListener('load', checkVisibility);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('load', checkVisibility);
      if (observerRef.current) observerRef.current.disconnect();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, [visibleSections]);

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

  const obtenerImagen = (producto) => {
    if (producto.imagenes && producto.imagenes.trim() !== "") {
      return producto.imagenes.split(",")[0];
    }
    return producto.imagen;
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

    const cardWidth = isMobile ? 165 : 240;
    const gap = 16;
    const scrollAmount = (cardWidth + gap) * 2;

    const newScrollPosition =
      direction === "left"
        ? slider.scrollLeft - scrollAmount
        : slider.scrollLeft + scrollAmount;

    slider.scrollTo({
      left: newScrollPosition,
      behavior: "smooth",
    });
  };

  const irAMasVendidos = () => {
    navigate("/mas-vendidos");
  };

  const { visibleSections, scrollY } = useScrollAnimation({
    hero: true,
    categorias: true,
    "ofertas-banner": true,
    "ofertas-productos": true,
    "productos-nuevos": true,
    "mas-vendidas": true,
    "destacados": true
  });

  const animationDuration = isMobile ? '0.6s' : '0.9s';

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

      {/* HERO CARRUSEL */}
      {bannersHero.length > 0 && (
        <div 
          style={styles.heroWrapper(isMobile)}
          data-animate="hero"
          className={`fade-in-section ${visibleSections.hero ? "is-visible" : ""}`}
        >
          <div style={styles.heroContainer}>
            {bannersHero.map((banner, index) => (
              <div
                key={banner.id}
                style={{
                  ...styles.heroSlide,
                  opacity: index === heroActual ? 1 : 0,
                  transition: "opacity 0.8s ease-in-out",
                  pointerEvents: index === heroActual ? "auto" : "none",
                }}
                onClick={() => clickBanner(banner)}
              >
                <img
                  src={banner.imagen}
                  alt={banner.titulo || "Banner"}
                  style={styles.heroImage}
                  loading="lazy"
                />
                <div style={styles.heroOverlay(isMobile)}>
                  <h1 style={styles.heroTitle(isMobile)}>
                    {banner.titulo}
                  </h1>
                  <p style={styles.heroDesc(isMobile)}>
                    {banner.descripcion}
                  </p>
                </div>
              </div>
            ))}
            <div style={styles.heroIndicators}>
              {bannersHero.map((_, index) => (
                <button
                  key={index}
                  style={{
                    ...styles.heroDot,
                    background: index === heroActual ? "#3b82f6" : "rgba(255,255,255,0.4)",
                    width: index === heroActual ? "32px" : "10px",
                  }}
                  onClick={() => setHeroActual(index)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* OFERTAS ESPECIALES - BANNERS */}
      {bannersOfertas.length > 0 && (
        <div 
          style={styles.ofertasBannerWrapper(isMobile)}
          data-animate="ofertas-banner"
          className={`slide-up-section ${visibleSections["ofertas-banner"] ? "is-visible" : ""}`}
        >
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
                style={{
                  ...styles.ofertaBannerCard(darkMode, isMobile),
                  animationDelay: `${index * 0.15}s`,
                }}
                className="banner-card-animated"
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
                    src={banner.imagen}
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
        <div 
          style={styles.categoriesSection(isMobile)}
          data-animate="categorias"
          className={`slide-up-section ${visibleSections.categorias ? "is-visible" : ""}`}
        >
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
                  style={{
                    ...styles.categoryCardWrapper,
                    animationDelay: `${index * 0.1}s`,
                  }}
                  className="category-card-animated"
                  onClick={() => navigate(`/categoria-id/${cat.id}`)}
                >
                  <div 
                    style={styles.categoryCard(darkMode)}
                    className="category-card-hover"
                  >
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

      {/* PRODUCTOS NUEVOS - VISIBILIDAD COMPLETA */}
      {productosNuevos.length > 0 && (
        <div
          id="productos-nuevos"
          className="slider-section"
          style={{
            ...styles.section(isMobile),
            position: "relative",
            overflow: "visible !important",
            zIndex: 10,
          }}
          data-animate="productos-nuevos"
        >
          <div style={styles.sectionHeader}>
            <h2 style={{ ...styles.sectionTitle(darkMode, isMobile), textAlign: "center" }}>
              ✨ Productos Nuevos
            </h2>
            <p style={{ ...styles.sectionSubtitle(isMobile), textAlign: "center" }}>
              Lo último en tendencia
            </p>
          </div>

          <button
            onClick={() => scrollSlider("nuevoSlider", "left")}
            style={styles.arrowLeft(isMobile)}
            className="slider-arrow"
          >
            ❮
          </button>
          <button
            onClick={() => scrollSlider("nuevoSlider", "right")}
            style={styles.arrowRight(isMobile)}
            className="slider-arrow"
          >
            ❯
          </button>

          <div 
            id="nuevoSlider" 
            style={{
              ...styles.sliderRow,
              overflowX: "auto",
              overflowY: "visible",
              padding: "12px 4px 20px 4px",
              margin: "0 -4px",
              WebkitOverflowScrolling: "touch",
              scrollBehavior: "smooth",
            }}
          >
            {productosNuevos.map((p, index) => (
              <div
                key={p.id}
                className="slider-card"
                style={{
                  ...styles.nuevoCard(darkMode, isMobile),
                  animationDelay: `${index * 0.05}s`,
                  flexShrink: 0,
                  position: "relative",
                  zIndex: 5,
                }}
                onClick={() => navigate(`/producto/${p.id}`)}
              >
                <div style={styles.nuevoBadge}>🆕 Nuevo</div>
                <div style={styles.cardImageWrapper}>
                  <img
                    src={
                      p.imagenes
                        ? p.imagenes.split(",")[0]
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
      )}

      {/* PRODUCTOS EN OFERTA - SOLO SE MUESTRA SI mostrarOfertas ES true */}
      {mostrarOfertas && productosOferta.length > 0 && (
        <div 
          style={styles.ofertaProductosWrapper(isMobile)}
          data-animate="ofertas-productos"
          className={`scale-up-section ${visibleSections["ofertas-productos"] ? "is-visible" : ""}`}
        >
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

          <div style={styles.ofertaProductosGrid(isMobile)}>
            {productosOferta.slice(0, 6).map((p, index) => (
              <div
                key={p.id}
                style={{
                  ...styles.productCard(darkMode, isMobile),
                  animationDelay: `${index * 0.1}s`,
                }}
                className="product-card-animated"
                onClick={() => navigate(`/producto/${p.id}`)}
              >
                <div style={styles.ofertaProductoBadge}>🔥 OFERTA</div>
                <img
                  src={
                    p.imagenes
                      ? p.imagenes.split(",")[0]
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
                    ${p.precioOferta || p.precio}
                  </span>
                </div>
                <button style={styles.productButton} className="btn-shine">
                  Ver producto →
                </button>
              </div>
            ))}
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
        <div 
          style={styles.ofertaProductosWrapper(isMobile)}
          data-animate="ofertas-productos"
          className={`scale-up-section ${visibleSections["ofertas-productos"] ? "is-visible" : ""}`}
        >
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

      {/* CATEGORÍAS MÁS VENDIDAS - VISIBILIDAD COMPLETA */}
      {categoriasDestacadas.length > 0 && (
        <div
          className="slider-section"
          style={{
            ...styles.section(isMobile),
            position: "relative",
            overflow: "visible !important",
            zIndex: 10,
          }}
          data-animate="mas-vendidas"
        >
          <div style={styles.sectionHeader}>
            <h2 style={{ ...styles.sectionTitle(darkMode, isMobile), textAlign: "center" }}>
              🔥 Categorías más vendidas
            </h2>
            <p style={{ ...styles.sectionSubtitle(isMobile), textAlign: "center" }}>
              Las favoritas de nuestra comunidad
            </p>
          </div>

          <button
            onClick={() => scrollSlider("vendidasSlider", "left")}
            style={styles.arrowLeft(isMobile)}
            className="slider-arrow"
          >
            ❮
          </button>
          <button
            onClick={() => scrollSlider("vendidasSlider", "right")}
            style={styles.arrowRight(isMobile)}
            className="slider-arrow"
          >
            ❯
          </button>

          <div 
            id="vendidasSlider" 
            style={{
              ...styles.sliderRow,
              overflowX: "auto",
              overflowY: "visible",
              padding: "12px 4px 20px 4px",
              margin: "0 -4px",
              WebkitOverflowScrolling: "touch",
              scrollBehavior: "smooth",
            }}
          >
            {categoriasDestacadas.map((p, index) => (
              <div
                key={index}
                className="slider-card"
                style={{
                  ...styles.sliderCard(darkMode, isMobile),
                  animationDelay: `${index * 0.05}s`,
                  flexShrink: 0,
                  position: "relative",
                  zIndex: 5,
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
      )}

      {/* PRODUCTOS DESTACADOS - VISIBILIDAD COMPLETA */}
      {destacados.length > 0 && (
        <div
          className="slider-section"
          style={{
            ...styles.section(isMobile),
            position: "relative",
            overflow: "visible !important",
            zIndex: 10,
          }}
          data-animate="destacados"
        >
          <div style={styles.sectionHeader}>
            <h2 style={{ ...styles.sectionTitle(darkMode, isMobile), textAlign: "center" }}>
              ⭐ Productos destacados
            </h2>
            <p style={{ ...styles.sectionSubtitle(isMobile), textAlign: "center" }}>
              Los productos más valorados por nuestros clientes
            </p>
          </div>

          <button
            onClick={() => scrollSlider("destacadosSlider", "left")}
            style={styles.arrowLeft(isMobile)}
            className="slider-arrow"
          >
            ❮
          </button>
          <button
            onClick={() => scrollSlider("destacadosSlider", "right")}
            style={styles.arrowRight(isMobile)}
            className="slider-arrow"
          >
            ❯
          </button>

          <div 
            id="destacadosSlider" 
            style={{
              ...styles.sliderRow,
              overflowX: "auto",
              overflowY: "visible",
              padding: "12px 4px 20px 4px",
              margin: "0 -4px",
              WebkitOverflowScrolling: "touch",
              scrollBehavior: "smooth",
            }}
          >
            {destacados.map((p, index) => (
              <div
                key={index}
                className="slider-card"
                style={{
                  ...styles.sliderCard(darkMode, isMobile),
                  animationDelay: `${index * 0.05}s`,
                  flexShrink: 0,
                  position: "relative",
                  zIndex: 5,
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
      )}

      <Footer darkMode={darkMode} />

      <style>{`
        /* ===== LOADER ===== */
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* ===== ANIMACIONES DE SCROLL ===== */
        .fade-in-section {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity ${animationDuration} ease, transform ${animationDuration} ease;
          will-change: transform, opacity;
        }
        
        .fade-in-section.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .slide-up-section {
          opacity: 0;
          transform: translateY(60px);
          transition: opacity ${animationDuration} cubic-bezier(0.22, 1, 0.36, 1), 
                      transform ${animationDuration} cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform, opacity;
        }
        
        .slide-up-section.is-visible {
          opacity: 1;
          transform: translateY(0);
        }

        .scale-up-section {
          opacity: 0;
          transform: scale(0.95);
          transition: opacity ${animationDuration} ease, 
                      transform ${animationDuration} cubic-bezier(0.34, 1.56, 0.64, 1);
          will-change: transform, opacity;
        }
        
        .scale-up-section.is-visible {
          opacity: 1;
          transform: scale(1);
        }

        /* ===== ANIMACIONES DE TARJETAS ===== */
        .category-card-animated {
          opacity: 0;
          transform: translateY(30px);
          animation: cardFadeUp 0.6s ease forwards;
        }

        .category-card-hover {
          transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .category-card-hover:hover {
          transform: translateY(-10px) scale(1.02);
          box-shadow: 0 20px 50px rgba(59, 130, 246, 0.25);
        }

        .product-card-animated {
          opacity: 0;
          transform: translateY(30px);
          animation: cardFadeUp 0.6s ease forwards;
        }

        .banner-card-animated {
          opacity: 0;
          transform: scale(0.95);
          animation: bannerFadeIn 0.7s ease forwards;
        }

        /* ===== MEJORAS PARA SLIDERS - VISIBILIDAD COMPLETA ===== */
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
          overflow: visible !important;
          padding: 12px 4px 20px 4px !important;
          margin: 0 -4px !important;
        }

        .slider-section .slider-arrow {
          z-index: 50 !important;
        }

        .slider-card {
          opacity: 0;
          animation: cardSlideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          overflow: visible;
        }

        .slider-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 12px 40px rgba(0,0,0,0.15);
          z-index: 20 !important;
        }

        .slider-card:hover .slider-image {
          transform: scale(1.08);
        }

        .slider-card:hover .card-button {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          transform: scale(1.02);
        }

        .slider-card::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(59,130,246,0.04) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.5s ease;
          pointer-events: none;
          border-radius: 50%;
          z-index: -1;
        }

        .slider-card:hover::after {
          opacity: 1;
        }

        .slider-image {
          transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .card-button {
          transition: all 0.3s ease;
        }

        /* ===== KEYFRAMES ===== */
        @keyframes cardFadeUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cardSlideUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes bannerFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulseBubble {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 4px 20px rgba(59,130,246,0.4);
          }
          50% {
            transform: scale(1.05);
            box-shadow: 0 8px 40px rgba(59,130,246,0.8), 0 0 60px rgba(59,130,246,0.3);
          }
        }

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
          animation: timerPulse 2s ease-in-out infinite;
        }

        .btn-glow {
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
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
          transition: opacity 0.3s ease;
          z-index: -1;
          animation: shimmer 3s ease-in-out infinite;
        }

        .btn-glow:hover::before {
          opacity: 1;
        }

        .btn-shine {
          position: relative;
          overflow: hidden;
        }

        .btn-shine::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(
            45deg,
            transparent 30%,
            rgba(255, 255, 255, 0.15) 50%,
            transparent 70%
          );
          transform: rotate(45deg) translateX(-100%);
          transition: transform 0.6s ease;
        }

        .btn-shine:hover::after {
          transform: rotate(45deg) translateX(100%);
        }

        .slider-arrow {
          transition: all 0.3s ease;
          z-index: 50 !important;
        }

        .slider-arrow:hover {
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
          background: rgba(255,255,255,1);
        }

        /* ===== SCROLLBAR PERSONALIZADA ===== */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.05);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
        }

        /* ===== PREFERENCIA DE REDUCCIÓN DE MOVIMIENTO ===== */
        @media (prefers-reduced-motion: reduce) {
          .fade-in-section,
          .slide-up-section,
          .scale-up-section {
            opacity: 1 !important;
            transform: none !important;
            transition: none !important;
          }
          
          .category-card-animated,
          .product-card-animated,
          .banner-card-animated,
          .slider-card {
            animation: none !important;
            opacity: 1 !important;
          }
          
          .timer-glow {
            animation: none !important;
          }
          
          .btn-glow::before {
            animation: none !important;
          }
          
          .btn-shine::after {
            display: none !important;
          }
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 768px) {
          .category-card-animated {
            animation-duration: 0.4s;
          }
          
          .product-card-animated {
            animation-duration: 0.4s;
          }
          
          .banner-card-animated {
            animation-duration: 0.5s;
          }

          .slider-card {
            animation-duration: 0.3s;
          }
        }

        /* ===== ESTILOS ADICIONALES PARA SLIDERS ===== */
        #nuevoSlider::-webkit-scrollbar,
        #vendidasSlider::-webkit-scrollbar,
        #destacadosSlider::-webkit-scrollbar {
          height: 4px;
        }

        #nuevoSlider::-webkit-scrollbar-thumb,
        #vendidasSlider::-webkit-scrollbar-thumb,
        #destacadosSlider::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 2px;
        }

        #nuevoSlider::-webkit-scrollbar-track,
        #vendidasSlider::-webkit-scrollbar-track,
        #destacadosSlider::-webkit-scrollbar-track {
          background: transparent;
        }

        /* ===== PREVENIR RE-OBSERVACIÓN ===== */
        [data-animate].is-visible {
          opacity: 1 !important;
          transform: translateY(0) !important;
          pointer-events: auto !important;
        }

        /* ===== SHIMMER TEXT ===== */
        .text-gradient {
          background: linear-gradient(90deg, #60a5fa, #3b82f6, #1d4ed8, #3b82f6, #60a5fa);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

// =================================================
// ESTILOS MODERNOS Y ELEGANTES
// =================================================
const styles = {
  // ===== LOADER =====
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

  // ===== PAGE =====
  page: (darkMode) => ({
    background: darkMode 
      ? "linear-gradient(180deg, #0f172a 0%, #1a2332 30%, #0f172a 60%, #1a2332 100%)"
      : "linear-gradient(180deg, #f8fafc 0%, #e2e8f0 30%, #f1f5f9 60%, #e2e8f0 100%)",
    minHeight: "100vh",
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    overflowX: "hidden",
    color: darkMode ? "#f1f5f9" : "#0f172a",
    transition: "all 0.3s ease",
  }),

  // ===== SECTION HEADER =====
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

  // ===== BUTTONS =====
  buttonPrimary: (darkMode, isMobile) => ({
    padding: isMobile ? "12px 28px" : "14px 44px",
    fontSize: isMobile ? "14px" : "16px",
    fontWeight: "700",
    color: "#ffffff",
    background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    transition: "all 0.3s ease",
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
    transition: "all 0.3s ease",
    boxShadow: "0 4px 24px rgba(220,38,38,0.35)",
    letterSpacing: "0.3px",
  }),

  // ===== HERO =====
  heroWrapper: (isMobile) => ({
    padding: isMobile ? "8px 12px" : "20px 32px",
    width: "100%",
    boxSizing: "border-box",
  }),

  heroContainer: {
    position: "relative",
    width: "100%",
    borderRadius: "28px",
    overflow: "hidden",
    background: "transparent",
    boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
    aspectRatio: "16/5",
    minHeight: "200px",
  },

  heroSlide: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    transition: "opacity 0.8s ease-in-out",
    cursor: "pointer",
  },

  heroImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
    display: "block",
  },

  heroOverlay: (isMobile) => ({
    position: "absolute",
    inset: 0,
    background: "linear-gradient(to top, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.2) 60%, rgba(15,23,42,0) 100%)",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    padding: isMobile ? "16px" : "40px",
  }),

  heroTitle: (isMobile) => ({
    fontSize: isMobile ? "22px" : "44px",
    fontWeight: "800",
    marginBottom: "4px",
    lineHeight: "1.15",
    letterSpacing: "-0.02em",
    textShadow: "0 4px 20px rgba(0,0,0,0.3)",
  }),

  heroDesc: (isMobile) => ({
    fontSize: isMobile ? "12px" : "18px",
    maxWidth: "600px",
    opacity: 0.9,
    margin: 0,
    textShadow: "0 2px 10px rgba(0,0,0,0.3)",
    display: isMobile ? "-webkit-box" : "block",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
  }),

  heroIndicators: {
    position: "absolute",
    bottom: "16px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    gap: "8px",
    zIndex: 10,
  },

  heroDot: {
    height: "10px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
    transition: "all 0.3s ease",
    padding: 0,
  },

  // ===== CATEGORÍAS =====
  categoriesSection: (isMobile) => ({
    margin: isMobile ? "16px 12px" : "32px 32px",
    padding: isMobile ? "20px 12px" : "40px 24px",
    background: "transparent",
    borderRadius: isMobile ? "16px" : "24px",
  }),

  categoriesGrid: (isMobile) => ({
    display: "grid",
    gridTemplateColumns: isMobile
      ? "repeat(2, 1fr)"
      : "repeat(4, 1fr)",
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
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
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
    animation: "pulseBubble 1.5s ease-in-out infinite",
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
    transition: "transform 0.5s ease",
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
    transition: "transform 0.3s ease",
  },

  categoriesFooter: {
    display: "flex",
    justifyContent: "center",
    marginTop: "28px",
  },

  // ===== OFERTAS BANNER =====
  ofertasBannerWrapper: (isMobile) => ({
    margin: isMobile ? "16px 12px" : "32px 32px",
    padding: isMobile ? "16px 12px" : "32px 24px",
    background: "transparent",
    borderRadius: isMobile ? "16px" : "24px",
  }),

  ofertasBannerGrid: (isMobile, totalBanners) => ({
    display: "grid",
    gridTemplateColumns: isMobile
      ? "1fr"
      : totalBanners <= 2 
        ? `repeat(${totalBanners}, 1fr)`
        : "repeat(3, 1fr)",
    gap: isMobile ? "16px" : "20px",
  }),

  ofertaBannerCard: (darkMode, isMobile) => ({
    borderRadius: isMobile ? "14px" : "18px",
    overflow: "hidden",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: darkMode
      ? "0 4px 20px rgba(0,0,0,0.3)"
      : "0 4px 20px rgba(0,0,0,0.06)",
    background: darkMode ? "rgba(30,41,59,0.8)" : "rgba(255,255,255,0.9)",
    border: darkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.04)",
  }),

  ofertaBannerImageWrapper: {
    position: "relative",
    width: "100%",
    paddingTop: "66%",
    overflow: "hidden",
  },

  ofertaBannerImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    transition: "transform 0.5s ease",
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
    minHeight: "50%",
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

  // ===== PRODUCTOS EN OFERTA =====
  ofertaProductosWrapper: (isMobile) => ({
    margin: isMobile ? "16px 12px" : "32px 32px",
    padding: isMobile ? "20px 12px" : "40px 24px",
    background: "transparent",
    borderRadius: isMobile ? "16px" : "24px",
    position: "relative",
    overflow: "hidden",
  }),

  ofertaProductosGrid: (isMobile) => ({
    display: "grid",
    gridTemplateColumns: isMobile
      ? "repeat(2, 1fr)"
      : "repeat(3, 1fr)",
    gap: isMobile ? "14px" : "22px",
  }),

  // ===== TIMER =====
  timerContainer: {
    display: "flex",
    justifyContent: "center",
    marginBottom: "28px",
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

  // ===== PRODUCT CARD =====
  productCard: (darkMode, isMobile) => ({
    background: darkMode
      ? "rgba(30,41,59,0.8)"
      : "rgba(255,255,255,0.9)",
    backdropFilter: "blur(10px)",
    borderRadius: isMobile ? "14px" : "20px",
    padding: isMobile ? "14px" : "20px",
    boxShadow: "0 8px 30px rgba(0,0,0,0.06)",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    border: darkMode
      ? "1px solid rgba(255,255,255,0.06)"
      : "1px solid rgba(0,0,0,0.04)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    position: "relative",
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
  }),

  productName: (darkMode, isMobile) => ({
    fontSize: isMobile ? "13px" : "16px",
    fontWeight: "600",
    margin: "4px 0",
    textAlign: "center",
    color: darkMode ? "#f1f5f9" : "#0f172a",
    lineHeight: "1.3",
  }),

  productPrices: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginTop: "4px",
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
    transition: "all 0.3s ease",
    cursor: "pointer",
    width: "100%",
    textAlign: "center",
    border: "none",
  },

  verTodosContainer: {
    display: "flex",
    justifyContent: "center",
    marginTop: "32px",
  },

  // ===== SLIDER SECCIÓN =====
  section: (isMobile) => ({
    margin: isMobile ? "16px 8px" : "40px 24px",
    background: "transparent",
    borderRadius: isMobile ? "16px" : "24px",
    padding: isMobile ? "16px 4px 30px 4px" : "24px 12px 40px 12px",
    boxSizing: "border-box",
    overflow: "visible !important",
    position: "relative",
    zIndex: 10,
  }),

  sliderRow: {
    display: "flex",
    gap: "16px",
    overflowX: "auto",
    overflowY: "visible",
    padding: "12px 4px 20px 4px",
    scrollBehavior: "smooth",
    WebkitOverflowScrolling: "touch",
    scrollbarWidth: "none",
    msOverflowStyle: "none",
    margin: "0 -4px",
    position: "relative",
    zIndex: 5,
  },

  // ===== SLIDER CARD =====
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
    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 5,
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
    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 5,
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
    transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
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
    transition: "all 0.3s ease",
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
    transition: "all 0.2s ease",
  },

  // ===== ARROWS =====
  arrowLeft: (isMobile) => ({
    position: "absolute",
    left: isMobile ? "-2px" : "6px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.95)",
    border: "1px solid #e2e8f0",
    width: isMobile ? "34px" : "46px",
    height: isMobile ? "34px" : "46px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: isMobile ? "14px" : "18px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    zIndex: 50,
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
  }),

  arrowRight: (isMobile) => ({
    position: "absolute",
    right: isMobile ? "-2px" : "6px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.95)",
    border: "1px solid #e2e8f0",
    width: isMobile ? "34px" : "46px",
    height: isMobile ? "34px" : "46px",
    borderRadius: "50%",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: isMobile ? "14px" : "18px",
    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
    zIndex: 50,
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
  }),
};