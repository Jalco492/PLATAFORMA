import { useEffect, useState } from "react";
import api from "../services/api";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Nosotros() {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
    api.get("/productos")
      .then((res) => setProductos(res.data))
      .catch((err) => console.log(err));
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

  return (
    <div style={styles.page(darkMode)}>
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

      {/* HERO */}
      <section style={styles.hero(darkMode)}>
        <div style={styles.overlay} />
        <div style={styles.heroContent}>
          <div style={styles.badgeContainer}>
            <div style={styles.badge}>
              <img
                src="/LOGO.PNG"
                alt="Logo"
                style={styles.badgeLogo}
              />
              <span style={styles.badgeText}>Fray Flooring</span>
            </div>
          </div>

          <div style={styles.heroTextContainer}>
            <h1 style={styles.heroTitle}>
              Transformamos espacios
              <br />
              con diseño premium
            </h1>

            <p style={styles.heroText}>
              El aliado estratégico en pisos y recubrimientos,
              conectando productos de alto nivel con clientes que buscan calidad,
              confianza y cumplimiento en cada compra.
            </p>

            <div style={styles.heroStats}>
              <div style={styles.statItem}>
                <h3 style={styles.statNumber}>+500</h3>
                <span style={styles.statText}>Proyectos</span>
              </div>
              <div style={styles.statItem}>
                <h3 style={styles.statNumber}>+120</h3>
                <span style={styles.statText}>Clientes</span>
              </div>
              <div style={styles.statItem}>
                <h3 style={styles.statNumber}>100%</h3>
                <span style={styles.statText}>Calidad</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENIDO CENTRADO - UNA SOLA COLUMNA */}
      <section style={styles.grid}>
        {/* QUIENES SOMOS - Full Width */}
        <div style={{ ...styles.card(darkMode), ...styles.fullWidth }}>
          <div style={styles.cardGlow} />
          <div style={styles.cardContent}>
            <span style={styles.tag(darkMode)}>NOSOTROS</span>
            <h2 style={styles.title(darkMode)}>🏢 ¿Quiénes somos?</h2>
            <p style={styles.description(darkMode)}>
              En Fray Flooring somos una empresa dedicada a la importación 
              y distribución de pisos, recubrimientos y materiales para 
              la decoración del hogar. Nos distinguimos por ofrecer productos
              de calidad, disponibilidad y un servicio profesional que brinda 
              confianza a nuestros clientes. Trabajamos cada día para ser un 
              aliado sólido y confiable, proporcionando soluciones que contribuyen
              a la creación de espacios funcionales, elegantes y duraderos.
            </p>
          </div>
        </div>

        {/* MISION - Full Width */}
        <div style={{ ...styles.card(darkMode), ...styles.fullWidth }}>
          <div style={styles.cardGlow} />
          <div style={styles.cardContent}>
            <span style={styles.tag(darkMode)}>MISIÓN</span>
            <h2 style={styles.title(darkMode)}>🚀 Nuestra misión</h2>
            <p style={styles.description(darkMode)}>
              Importar y distribuir pisos y recubrimientos de clase mundial, garantizando
              disponibilidad, calidad y respaldo para nuestros clientes, convirtiéndonos en
              un aliado estratégico para el desarrollo de proyectos residenciales y
              comerciales.
            </p>
          </div>
        </div>

        {/* VISION - Full Width */}
        <div style={{ ...styles.card(darkMode), ...styles.fullWidth }}>
          <div style={styles.cardGlow} />
          <div style={styles.cardContent}>
            <span style={styles.tag(darkMode)}>VISIÓN</span>
            <h2 style={styles.title(darkMode)}>🌎 Nuestra visión</h2>
            <p style={styles.description(darkMode)}>
              Consolidarnos como la importadora y distribuidora de pisos y recubrimientos
              más confiable del mercado, distinguiéndonos por nuestra fortaleza operativa,
              excelencia en el servicio y compromiso con el crecimiento sostenible de
              nuestros clientes.
            </p>
          </div>
        </div>

        {/* VALORES - Full Width */}
        <div style={{ ...styles.card(darkMode), ...styles.fullWidth }}>
          <div style={styles.cardGlow} />
          <div style={styles.cardContent}>
            <span style={styles.tag(darkMode)}>VALORES</span>
            <h2 style={styles.title(darkMode)}>💎 Nuestros valores</h2>
            <div style={styles.valuesList}>
              <div style={styles.valueItem(darkMode)}>
                <strong>● Calidad:</strong> Seleccionamos productos que cumplen
                con los más altos estándares del mercado.
              </div>
              <div style={styles.valueItem(darkMode)}>
                <strong>● Compromiso:</strong> Respondemos con responsabilidad a las
                necesidades de nuestros clientes y socios comerciales.
              </div>
              <div style={styles.valueItem(darkMode)}>
                <strong>● Servicio:</strong> Ofrecemos atención cercana, profesional
                y orientada a soluciones.
              </div>
              <div style={styles.valueItem(darkMode)}>
                <strong>● Innovación:</strong> Buscamos constantemente nuevas tendencias,
                materiales y oportunidades para mejorar nuestra oferta.
              </div>
              <div style={styles.valueItem(darkMode)}>
                <strong>● Responsabilidad:</strong> Cumplimos con nuestros compromisos
                comerciales y logísticos de manera eficiente.
              </div>
            </div>
          </div>
        </div>

        {/* MARCAS - Full Width */}
        <div style={{ ...styles.card(darkMode), ...styles.fullWidth }}>
          <div style={styles.cardGlow} />
          <div style={styles.cardContent}>
            <span style={styles.tag(darkMode)}>MARCAS</span>
            <h2 style={styles.title(darkMode)}>🤝 Trabajamos con</h2>
            <div style={styles.partners}>
              <div style={styles.partnerCard(darkMode)}>
                <img src="/01.webp" alt="Socio 1" style={styles.partnerLogo} />
              </div>
              <div style={styles.partnerCard(darkMode)}>
                <img src="/02.webp" alt="Socio 2" style={styles.partnerLogo} />
              </div>
              <div style={styles.partnerCard(darkMode)}>
                <img src="/03.webp" alt="Socio 3" style={styles.partnerLogo} />
              </div>
              <div style={styles.partnerCard(darkMode)}>
                <img src="/04.webp" alt="Socio 4" style={styles.partnerLogo} />
              </div>
              <div style={styles.partnerCard(darkMode)}>
                <img src="/05.webp" alt="Socio 5" style={styles.partnerLogo} />
              </div>
              <div style={styles.partnerCard(darkMode)}>
                <img src="/06.webp" alt="Socio 6" style={styles.partnerLogo} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer darkMode={darkMode} />
    </div>
  );
}

const styles = {
  page: (darkMode) => ({
    minHeight: "100vh",
    width: "100%",
    maxWidth: "100%",
    overflowX: "hidden",
    background: darkMode ? "#0f172a" : "#f8fafc",
    color: darkMode ? "#fff" : "#111827",
    fontFamily: "'Inter',sans-serif",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: 0,
    margin: 0,
    boxSizing: "border-box"
  }),

  hero: (darkMode) => ({
    minHeight: "100vh",
    width: "100%",
    maxWidth: "100%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    padding: "140px 20px 80px",
    backgroundImage: `
      linear-gradient(
        to right,
        rgba(0,0,0,0.45),
        rgba(0,0,0,0.20)
      ),
      url('/NOSOTROS.jpg')
    `,
    backgroundSize: "cover",
    backgroundPosition: "center center",
    backgroundRepeat: "no-repeat",
    filter: "saturate(1.2) contrast(1.08)",
    boxSizing: "border-box",
    "@media (max-width: 768px)": {
      padding: "120px 16px 60px",
      minHeight: "80vh"
    },
    "@media (max-width: 480px)": {
      padding: "100px 12px 40px",
      minHeight: "70vh"
    }
  }),

  overlay: {
    position: "absolute",
    inset: 0,
    background: `
      linear-gradient(
        to bottom,
        rgba(0,0,0,0.15),
        rgba(0,0,0,0.35)
      )
    `
  },

  heroContent: {
    position: "relative",
    zIndex: 2,
    maxWidth: "1200px",
    width: "100%",
    margin: "0 auto",
    padding: "0 20px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    boxSizing: "border-box",
    "@media (max-width: 768px)": {
      padding: "0 10px"
    },
    "@media (max-width: 480px)": {
      padding: "0 5px"
    }
  },

  badgeContainer: {
    width: "100%",
    display: "flex",
    justifyContent: "center",
    marginBottom: "30px"
  },

  badge: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "14px",
    padding: "12px 28px",
    borderRadius: "999px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.18)",
    backdropFilter: "blur(14px)",
    color: "#fff",
    fontWeight: "800",
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    "@media (max-width: 480px)": {
      padding: "10px 20px",
      gap: "10px"
    }
  },

  badgeLogo: {
    width: "55px",
    height: "55px",
    objectFit: "contain",
    filter: "drop-shadow(0 6px 12px rgba(255,255,255,0.18))",
    "@media (max-width: 480px)": {
      width: "40px",
      height: "40px"
    }
  },

  badgeText: {
    fontSize: "clamp(20px, 4vw, 34px)",
    "@media (max-width: 480px)": {
      fontSize: "18px"
    }
  },

  heroTextContainer: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center"
  },

  heroTitle: {
    fontSize: "clamp(40px, 8vw, 120px)",
    lineHeight: "0.95",
    fontWeight: "900",
    color: "#fff",
    marginBottom: "20px",
    letterSpacing: "-2px",
    textAlign: "center",
    width: "100%",
    "@media (max-width: 768px)": {
      fontSize: "clamp(32px, 10vw, 50px)",
      letterSpacing: "-1px"
    },
    "@media (max-width: 480px)": {
      fontSize: "clamp(28px, 12vw, 38px)"
    }
  },

  heroText: {
    fontSize: "clamp(16px, 2vw, 28px)",
    lineHeight: "1.8",
    color: "rgba(255,255,255,0.88)",
    maxWidth: "850px",
    marginBottom: "40px",
    textAlign: "center",
    marginLeft: "auto",
    marginRight: "auto",
    "@media (max-width: 768px)": {
      fontSize: "clamp(14px, 2.5vw, 18px)",
      lineHeight: "1.6"
    },
    "@media (max-width: 480px)": {
      fontSize: "14px",
      lineHeight: "1.5"
    }
  },

  heroStats: {
    display: "flex",
    gap: "40px",
    flexWrap: "wrap",
    marginTop: "10px",
    justifyContent: "center",
    width: "100%",
    "@media (max-width: 768px)": {
      gap: "24px"
    },
    "@media (max-width: 480px)": {
      gap: "16px",
      justifyContent: "center"
    }
  },

  statItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center"
  },

  statNumber: {
    fontSize: "clamp(28px, 4vw, 58px)",
    fontWeight: "900",
    color: "#ffffff",
    marginBottom: "4px",
    "@media (max-width: 480px)": {
      fontSize: "clamp(24px, 8vw, 32px)"
    }
  },

  statText: {
    color: "rgba(255,255,255,0.75)",
    fontSize: "clamp(12px, 1.2vw, 16px)",
    letterSpacing: "1px",
    textTransform: "uppercase",
    "@media (max-width: 480px)": {
      fontSize: "11px"
    }
  },

  grid: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
    display: "flex",
    flexDirection: "column",
    gap: "28px",
    padding: "60px 20px",
    boxSizing: "border-box",
    alignItems: "center",
    "@media (max-width: 768px)": {
      padding: "40px 16px",
      gap: "24px"
    },
    "@media (max-width: 480px)": {
      padding: "30px 12px",
      gap: "20px"
    }
  },

  fullWidth: {
    width: "100%"
  },

  card: (darkMode) => ({
    position: "relative",
    overflow: "hidden",
    background: darkMode
      ? "rgba(255,255,255,0.04)"
      : "rgba(255,255,255,0.92)",
    border: darkMode
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid rgba(255,255,255,0.8)",
    borderRadius: "28px",
    padding: "40px",
    backdropFilter: "blur(18px)",
    boxShadow: darkMode
      ? "0 25px 70px rgba(0,0,0,.38)"
      : "0 25px 60px rgba(0,0,0,.08)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
    transition: "all 0.3s ease",
    "@media (max-width: 768px)": {
      padding: "30px 24px",
      borderRadius: "24px"
    },
    "@media (max-width: 480px)": {
      padding: "24px 16px",
      borderRadius: "20px"
    }
  }),

  cardContent: {
    position: "relative",
    zIndex: 2,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    width: "100%",
    maxWidth: "900px",
    boxSizing: "border-box",
    "@media (max-width: 768px)": {
      maxWidth: "100%"
    }
  },

  cardGlow: {
    position: "absolute",
    width: "200px",
    height: "200px",
    background: "rgba(59,130,246,0.18)",
    borderRadius: "50%",
    top: "-100px",
    right: "-100px",
    filter: "blur(60px)"
  },

  tag: (darkMode) => ({
    display: "inline-flex",
    alignItems: "center",
    background: darkMode
      ? "rgba(255,255,255,0.08)"
      : "#eff6ff",
    color: darkMode
      ? "#ffffff"
      : "#2563eb",
    padding: "8px 16px",
    borderRadius: "999px",
    fontSize: "clamp(11px, 1vw, 12px)",
    fontWeight: "900",
    letterSpacing: "1px",
    marginBottom: "20px"
  }),

  title: (darkMode) => ({
    fontSize: "clamp(26px, 4vw, 52px)",
    fontWeight: "900",
    lineHeight: "1.1",
    marginBottom: "18px",
    color: darkMode ? "#ffffff" : "#111827",
    textAlign: "center",
    width: "100%",
    "@media (max-width: 480px)": {
      fontSize: "clamp(20px, 6vw, 26px)"
    }
  }),

  description: (darkMode) => ({
    fontSize: "clamp(15px, 1.5vw, 20px)",
    lineHeight: "1.9",
    textAlign: "center",
    color: darkMode ? "#cbd5e1" : "#374151",
    maxWidth: "800px",
    margin: "0 auto",
    width: "100%",
    boxSizing: "border-box",
    "@media (max-width: 480px)": {
      fontSize: "14px",
      lineHeight: "1.6"
    }
  }),

  valuesList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginTop: "20px",
    width: "100%",
    maxWidth: "800px",
    marginLeft: "auto",
    marginRight: "auto",
    boxSizing: "border-box"
  },

  valueItem: (darkMode) => ({
    background: darkMode
      ? "rgba(255,255,255,0.05)"
      : "#f8fafc",
    padding: "20px 24px",
    borderRadius: "20px",
    lineHeight: "1.8",
    fontSize: "clamp(15px, 1.2vw, 18px)",
    color: darkMode ? "#e2e8f0" : "#374151",
    borderLeft: "5px solid #2563eb",
    transition: "0.3s ease",
    boxShadow: darkMode
      ? "0 10px 25px rgba(0,0,0,0.18)"
      : "0 10px 20px rgba(0,0,0,0.04)",
    textAlign: "left",
    width: "100%",
    boxSizing: "border-box",
    "@media (max-width: 480px)": {
      padding: "14px 16px",
      fontSize: "14px",
      lineHeight: "1.6"
    }
  }),

  partners: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "20px",
    marginTop: "30px",
    width: "100%",
    maxWidth: "800px",
    marginLeft: "auto",
    marginRight: "auto",
    boxSizing: "border-box",
    "@media (max-width: 768px)": {
      gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
      gap: "16px"
    },
    "@media (max-width: 480px)": {
      gridTemplateColumns: "repeat(3, 1fr)",
      gap: "12px"
    }
  },

  partnerCard: (darkMode) => ({
    background: darkMode
      ? "rgba(255,255,255,0.05)"
      : "#ffffff",
    border: darkMode
      ? "1px solid rgba(255,255,255,0.08)"
      : "1px solid #e5e7eb",
    borderRadius: "20px",
    padding: "24px",
    minHeight: "120px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    transition: "0.35s ease",
    boxShadow: darkMode
      ? "0 10px 30px rgba(0,0,0,0.25)"
      : "0 10px 25px rgba(0,0,0,0.06)",
    "@media (max-width: 768px)": {
      padding: "20px",
      minHeight: "100px",
      borderRadius: "16px"
    },
    "@media (max-width: 480px)": {
      padding: "16px",
      minHeight: "80px",
      borderRadius: "14px"
    }
  }),

  partnerLogo: {
    width: "100%",
    maxWidth: "140px",
    height: "70px",
    objectFit: "contain",
    filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.12))",
    "@media (max-width: 480px)": {
      maxWidth: "80px",
      height: "50px"
    }
  }
};