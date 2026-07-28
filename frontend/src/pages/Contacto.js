import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Contacto() {
  const navigate = useNavigate();

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

  const [formulario, setFormulario] = useState({
    nombre: "",
    correo: "",
    telefono: "",
    empresa: "",
    mensaje: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario({
      ...formulario,
      [name]: value
    });
  };

  const enviarMensaje = async () => {
    try {
      if (
        !formulario.nombre ||
        !formulario.correo ||
        !formulario.telefono ||
        !formulario.mensaje
      ) {
        alert("Completa los campos obligatorios");
        return;
      }

      await api.post("/contactos", formulario);

      alert(
        "✅ Gracias por contactarnos.\n\nTu mensaje fue enviado correctamente y nos comunicaremos contigo pronto."
      );

      setFormulario({
        nombre: "",
        correo: "",
        telefono: "",
        empresa: "",
        mensaje: ""
      });
    } catch (error) {
      console.error(error);
      alert("❌ Error al enviar mensaje");
    }
  };

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

      {/* HERO (Centrado igual que Nosotros) */}
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
              Hablemos de tu
              <br />
              próximo proyecto
            </h1>

            <p style={styles.heroText}>
              Creamos espacios premium con acabados, diseño y materiales de alta
              calidad para transformar cualquier ambiente.
            </p>

            <div style={styles.heroButtons}>
              <button
                style={styles.primaryBtn}
                onClick={() => navigate("/cotizador")}
              >
                🚀 Solicitar cotización
              </button>

              <a href="tel:+525512345678" style={styles.callLink}>
                📞 Contactar ahora
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENIDO CENTRADO - UNA SOLA COLUMNA */}
      <section style={styles.grid}>
        
        {/* INFORMACIÓN - Full Width */}
        <div style={{ ...styles.card(darkMode), ...styles.fullWidth }}>
          <div style={styles.cardGlow} />
          <div style={styles.cardContent}>
            <span style={styles.tag(darkMode)}>CONTACTO</span>
            <h2 style={styles.title(darkMode)}>🏢 Información</h2>
            
            <div style={styles.valuesList}>
              <div style={styles.valueItem(darkMode)}>
                📍 Toluca, Estado de México
              </div>
              <div style={styles.valueItem(darkMode)}>
                📞 +52 55 1234 5678
              </div>
              <div style={styles.valueItem(darkMode)}>
                ✉️ contacto@frayflooring.com
              </div>
              <div style={styles.valueItem(darkMode)}>
                🕒 Lunes a Sábado · 9AM - 7PM
              </div>
            </div>
          </div>
        </div>

        {/* MAPA - Full Width */}
        <div style={{ ...styles.card(darkMode), ...styles.fullWidth }}>
          <div style={styles.cardGlow} />
          <div style={styles.cardContent}>
            <span style={styles.tag(darkMode)}>UBICACIÓN</span>
            <h2 style={styles.title(darkMode)}>📍 Nuestra ubicación</h2>
            
            <div style={styles.mapContainer}>
              <iframe
                title="Mapa"
                src="https://www.google.com/maps?q=19.296125,-99.563947&output=embed"
                width="100%"
                height="100%"
                style={styles.map(darkMode)}
              />
            </div>
          </div>
        </div>

        {/* FORMULARIO - Full Width */}
        <div style={{ ...styles.card(darkMode), ...styles.fullWidth }}>
          <div style={styles.cardGlow} />
          <div style={styles.cardContent}>
            <span style={styles.tag(darkMode)}>MENSAJE</span>
            <h2 style={styles.title(darkMode)}>✨ Envíanos un mensaje</h2>

            <div style={styles.formGrid}>
              <input
                name="nombre"
                value={formulario.nombre}
                onChange={handleChange}
                placeholder="Nombre completo"
                style={styles.input(darkMode)}
              />

              <input
                name="correo"
                value={formulario.correo}
                onChange={handleChange}
                placeholder="Correo electrónico"
                style={styles.input(darkMode)}
              />

              <input
                name="telefono"
                value={formulario.telefono}
                onChange={handleChange}
                placeholder="Teléfono"
                style={styles.input(darkMode)}
              />

              <input
                name="empresa"
                value={formulario.empresa}
                onChange={handleChange}
                placeholder="Empresa (Opcional)"
                style={styles.input(darkMode)}
              />
            </div>

            <textarea
              name="mensaje"
              value={formulario.mensaje}
              onChange={handleChange}
              placeholder="Cuéntanos sobre tu proyecto..."
              rows={6}
              style={styles.textarea(darkMode)}
            />

            <button style={styles.sendBtn} onClick={enviarMensaje}>
              🚀 Enviar mensaje
            </button>
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
        rgba(0,0,0,0.55),
        rgba(0,0,0,0.30)
      ),
      url('/CONTÁCTANOS.JPG')
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

  heroButtons: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    justifyContent: "center",
    width: "100%",
    "@media (max-width: 480px)": {
      flexDirection: "column",
      alignItems: "stretch",
      padding: "0 20px"
    }
  },

  primaryBtn: {
    background: "linear-gradient(to right, #2563eb, #3b82f6)",
    border: "none",
    color: "#fff",
    padding: "18px 36px",
    borderRadius: "16px",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 15px 35px rgba(37,99,235,.35)",
    transition: "transform 0.2s ease"
  },

  callLink: {
    background: "rgba(255,255,255,0.08)",
    border: "1px solid rgba(255,255,255,0.15)",
    color: "#fff",
    padding: "18px 36px",
    borderRadius: "16px",
    fontSize: "16px",
    fontWeight: "700",
    textDecoration: "none",
    backdropFilter: "blur(10px)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
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
    background: darkMode ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.92)",
    border: darkMode ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(255,255,255,0.8)",
    borderRadius: "28px",
    padding: "40px",
    backdropFilter: "blur(18px)",
    boxShadow: darkMode ? "0 25px 70px rgba(0,0,0,.38)" : "0 25px 60px rgba(0,0,0,.08)",
    width: "100%",
    maxWidth: "100%",
    boxSizing: "border-box",
    display: "flex",
    justifyContent: "center",
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
    boxSizing: "border-box"
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
    background: darkMode ? "rgba(255,255,255,0.08)" : "#eff6ff",
    color: darkMode ? "#ffffff" : "#2563eb",
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

  valuesList: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginTop: "20px",
    width: "100%",
    maxWidth: "800px",
    margin: "0 auto",
    boxSizing: "border-box"
  },

  valueItem: (darkMode) => ({
    background: darkMode ? "rgba(255,255,255,0.05)" : "#f8fafc",
    padding: "20px 24px",
    borderRadius: "20px",
    lineHeight: "1.8",
    fontSize: "clamp(15px, 1.2vw, 18px)",
    color: darkMode ? "#e2e8f0" : "#374151",
    borderLeft: "5px solid #2563eb",
    textAlign: "left",
    width: "100%",
    boxSizing: "border-box",
    "@media (max-width: 480px)": {
      padding: "14px 16px",
      fontSize: "14px"
    }
  }),

  mapContainer: {
    width: "100%",
    maxWidth: "800px",
    height: "400px",
    borderRadius: "20px",
    overflow: "hidden",
    marginTop: "20px",
    boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
    "@media (max-width: 480px)": {
      height: "280px"
    }
  },

  map: (darkMode) => ({
    width: "100%",
    height: "100%",
    border: "none",
    display: "block",
    filter: darkMode ? "invert(90%) hue-rotate(180deg)" : "none"
  }),

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "16px",
    width: "100%",
    maxWidth: "800px",
    marginBottom: "16px",
    boxSizing: "border-box",
    "@media (max-width: 600px)": {
      gridTemplateColumns: "1fr"
    }
  },

  input: (darkMode) => ({
    width: "100%",
    padding: "18px 22px",
    borderRadius: "14px",
    border: darkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
    background: darkMode ? "rgba(0,0,0,0.2)" : "#fff",
    color: darkMode ? "#fff" : "#111827",
    fontSize: "15px",
    boxSizing: "border-box",
    fontFamily: "inherit",
    outline: "none"
  }),

  textarea: (darkMode) => ({
    width: "100%",
    maxWidth: "800px",
    padding: "18px 22px",
    borderRadius: "14px",
    border: darkMode ? "1px solid rgba(255,255,255,0.1)" : "1px solid #e2e8f0",
    background: darkMode ? "rgba(0,0,0,0.2)" : "#fff",
    color: darkMode ? "#fff" : "#111827",
    fontSize: "15px",
    boxSizing: "border-box",
    fontFamily: "inherit",
    outline: "none",
    resize: "none",
    marginBottom: "24px"
  }),

  sendBtn: {
    background: "linear-gradient(to right, #2563eb, #3b82f6)",
    border: "none",
    color: "#fff",
    padding: "18px 40px",
    borderRadius: "16px",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer",
    boxShadow: "0 15px 35px rgba(37,99,235,.25)",
    width: "100%",
    maxWidth: "300px"
  }
};