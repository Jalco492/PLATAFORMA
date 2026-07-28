import {
  FaFacebookF,
  FaInstagram,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
  FaPhone,
  FaEnvelope
} from "react-icons/fa";

export default function Footer({ darkMode }) {
  return (
    <footer style={styles.footer(darkMode)}>
      {/* TOP */}
      <div style={styles.container}>
        {/* BRAND */}
        <div style={styles.col}>
          <h2 style={styles.logo}>
            <span style={styles.logoBlue}>Fray</span>
            <span style={styles.logoWhite}> Flooring</span>
          </h2>
          <p style={styles.text(darkMode)}>
            Encuentra productos de construcción y diseño con calidad premium y experiencia moderna.
          </p>
        </div>

        {/* LINKS */}
        <div style={styles.col}>
          <h3 style={styles.title}>Enlaces</h3>
          <a href="/" style={styles.link(darkMode)}>Inicio</a>
          <a href="/productos" style={styles.link(darkMode)}>Productos</a>
          <a href="/comparar" style={styles.link(darkMode)}>Comparador de productos</a>
          <a href="/contacto" style={styles.link(darkMode)}>Contacto</a>
          <a href="/nosotros" style={styles.link(darkMode)}>Nosotros</a>
          <a href="/favoritos" style={styles.link(darkMode)}>Favoritos</a>
          <a href="/cotizador" style={styles.link(darkMode)}>Cotizador</a>
        </div>

        {/* CONTACTO */}
        <div style={styles.col}>
          <h3 style={styles.title}>Contacto</h3>
          <p style={styles.text(darkMode)}>📍 CDMX, México</p>
          <p style={styles.text(darkMode)}>📞 +52 55 0000 0000</p>
          <p style={styles.text(darkMode)}>✉️ contacto@mitienda.com</p>
        </div>

        {/* REDES */}
        <div style={styles.col}>
          <h3 style={styles.title}>Síguenos</h3>
          <div style={styles.socials}>
            <SocialIcon color="#1877F2" href="https://www.facebook.com/people/FRAY-Flooring/61587688868988/">
              <FaFacebookF size={22} />
            </SocialIcon>
            <SocialIcon color="#E4405F" href="https://www.instagram.com/fray_flooring?igsh=b3pucDR1bjltMGQ2">
              <FaInstagram size={22} />
            </SocialIcon>
            <SocialIcon color="#010101" href="https://www.tiktok.com/@fray_flooring6">
              <FaTiktok size={22} />
            </SocialIcon>
            <SocialIcon color="#25D366" href="https://wa.me/525610026370">
              <FaWhatsapp size={22} />
            </SocialIcon>
            <SocialIcon color="#FF0000" href="https://www.youtube.com/@FrayFlooring">
              <FaYoutube size={22} />
            </SocialIcon>
            <SocialIcon color="#38bdf8" href="tel:+525610026370">
              <FaPhone size={22} />
            </SocialIcon>
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div style={styles.bottom(darkMode)}>
        © {new Date().getFullYear()} Fray Flooring • Todos los derechos reservados
      </div>
    </footer>
  );
}

function SocialIcon({ children, color, href }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        ...styles.icon,
        background: color,
        textDecoration: "none"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-6px) scale(1.1)";
        e.currentTarget.style.boxShadow = "0 14px 28px rgba(0,0,0,0.35)";
        e.currentTarget.style.filter = "brightness(1.15)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "0 8px 18px rgba(0,0,0,0.25)";
        e.currentTarget.style.filter = "brightness(1)";
      }}
    >
      {children}
    </a>
  );
}

const styles = {
  footer: (darkMode) => ({
    background: darkMode
      ? "linear-gradient(135deg, #0f172a, #1a2332)"
      : "linear-gradient(135deg, #0f172a, #1a2332)",
    color: "#fff",
    marginTop: "60px",
    borderTop: "2px solid rgba(96,165,250,0.2)",
    width: "100%"
  }),

  container: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "clamp(30px, 5vw, 60px)",
    maxWidth: "1400px",
    margin: "0 auto",
    padding: "clamp(30px, 6vw, 80px) clamp(20px, 4vw, 60px)",
    alignItems: "start",
    
    "@media (max-width: 768px)": {
      gridTemplateColumns: "1fr 1fr",
      gap: "30px",
      padding: "40px 20px"
    },
    "@media (max-width: 480px)": {
      gridTemplateColumns: "1fr",
      gap: "35px",
      padding: "30px 20px"
    }
  },

  col: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minWidth: 0,
    
    "@media (max-width: 768px)": {
      alignItems: "flex-start",
      textAlign: "left"
    },
    "@media (max-width: 480px)": {
      alignItems: "center",
      textAlign: "center"
    }
  },

  logo: {
    fontSize: "clamp(28px, 4vw, 42px)",
    fontWeight: "800",
    marginBottom: "4px",
    display: "inline-block",
    "@media (max-width: 480px)": {
      fontSize: "32px"
    }
  },

  logoBlue: {
    background: "linear-gradient(90deg, #60a5fa, #3b82f6, #1d4ed8, #3b82f6, #60a5fa)",
    backgroundSize: "200% auto",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    animation: "shimmerBlue 3s linear infinite",
    textShadow: "0 0 40px rgba(59,130,246,0.3)",
  },

  logoWhite: {
    color: "#ffffff",
    textShadow: "0 0 40px rgba(255,255,255,0.15)",
    background: "none",
    WebkitBackgroundClip: "unset",
    WebkitTextFillColor: "#ffffff",
    animation: "none",
  },

  title: {
    fontSize: "clamp(15px, 2vw, 19px)",
    fontWeight: "700",
    color: "#60a5fa",
    marginBottom: "6px",
    "@media (max-width: 480px)": {
      fontSize: "18px"
    }
  },

  text: (darkMode) => ({
    fontSize: "clamp(13px, 1.4vw, 15px)",
    lineHeight: "1.7",
    color: "#cbd5e1",
    "@media (max-width: 480px)": {
      fontSize: "14px",
      maxWidth: "300px"
    }
  }),

  link: (darkMode) => ({
    fontSize: "clamp(13px, 1.4vw, 15px)",
    color: "#cbd5e1",
    textDecoration: "none",
    transition: "0.3s",
    padding: "4px 0",
    ":hover": {
      color: "#60a5fa",
      transform: "translateX(4px)"
    },
    "@media (max-width: 480px)": {
      fontSize: "14px"
    }
  }),

  socials: {
    display: "flex",
    gap: "12px",
    flexWrap: "wrap",
    alignItems: "center",
    
    "@media (max-width: 768px)": {
      justifyContent: "flex-start"
    },
    "@media (max-width: 480px)": {
      justifyContent: "center",
      gap: "10px"
    }
  },

  icon: {
    width: "clamp(48px, 6vw, 60px)",
    height: "clamp(48px, 6vw, 60px)",
    borderRadius: "16px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    cursor: "pointer",
    transition: "all 0.25s ease",
    boxShadow: "0 8px 18px rgba(0,0,0,0.25)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(8px)",
    flexShrink: 0,
    
    "@media (max-width: 480px)": {
      width: "52px",
      height: "52px",
      borderRadius: "14px"
    }
  },

  bottom: (darkMode) => ({
    textAlign: "center",
    padding: "20px 20px",
    fontSize: "clamp(12px, 1.4vw, 14px)",
    color: "#94a3b8",
    borderTop: "1px solid rgba(96,165,250,0.1)",
    "@media (max-width: 480px)": {
      fontSize: "12px",
      padding: "16px 20px"
    }
  })
};