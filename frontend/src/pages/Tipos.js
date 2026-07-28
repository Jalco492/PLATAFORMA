// src/pages/Tipos.js (o src/components/Tipos.js)
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Tipos() {
  const { id } = useParams(); // Obtiene el ID del tipo desde la URL
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [tipoInfo, setTipoInfo] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Estados para el navbar (si los necesitas, puedes pasarlos desde App o manejarlos localmente)
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos");
    return guardados ? JSON.parse(guardados) : [];
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // Cargar categorías y subcategorías para el navbar (si no vienen de App)
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [productosNavbar, setProductosNavbar] = useState([]);

  useEffect(() => {
    // Cargar datos para el navbar
    const cargarDatosNavbar = async () => {
      try {
        const [catRes, subRes, tipRes, prodRes] = await Promise.all([
          api.get("/categorias"),
          api.get("/subcategorias"),
          api.get("/tipos"),
          api.get("/productos")
        ]);
        setCategorias(catRes.data);
        setSubcategorias(subRes.data);
        setTipos(tipRes.data);
        setProductosNavbar(prodRes.data);
      } catch (error) {
        console.error("Error cargando datos del navbar:", error);
      }
    };
    cargarDatosNavbar();
  }, []);

  // Cargar productos del tipo seleccionado
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setCargando(true);
        // Obtener el tipo y sus productos
        const tipoRes = await api.get(`/tipos/${id}`);
        setTipoInfo(tipoRes.data);

        // Obtener productos filtrados por tipo_id
        const prodRes = await api.get(`/productos/tipo/${id}`);
        setProductos(prodRes.data);
      } catch (error) {
        console.error("Error cargando productos del tipo:", error);
        setProductos([]);
      } finally {
        setCargando(false);
      }
    };
    if (id) {
      cargarProductos();
    }
  }, [id]);

  // Guardar favoritos en localStorage
  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  // Funciones de favoritos
  const toggleFavorito = (producto) => {
    const existe = favoritos.find((fav) => fav.id === producto.id);
    if (existe) {
      setFavoritos(favoritos.filter((f) => f.id !== producto.id));
    } else {
      setFavoritos([...favoritos, producto]);
    }
  };

  const esFavorito = (id) => {
    return favoritos.some((f) => f.id === id);
  };

  // Obtener la primera imagen del producto
  const obtenerImagen = (producto) => {
    if (producto.imagenes && producto.imagenes.trim() !== "") {
      return producto.imagenes.split(",")[0];
    }
    return producto.imagen || "https://via.placeholder.com/300x300?text=Sin+Imagen";
  };

  // Navegar al detalle del producto
  const irAlProducto = (id) => {
    navigate(`/producto/${id}`);
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: darkMode ? "#111827" : "#f3f4f6",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* NAVBAR */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        favoritos={favoritos}
        categorias={categorias}
        subcategorias={subcategorias}
        tipos={tipos}
        productos={productosNavbar}
        toggleFavorito={toggleFavorito}
        esFavorito={esFavorito}
      />

      {/* CONTENIDO PRINCIPAL - CON PADDING SUPERIOR PARA BAJAR EL CONTENIDO */}
      <div style={{ 
        flex: 1, 
        maxWidth: "1400px", 
        margin: "0 auto", 
        padding: "140px 20px 30px 20px", // Aumentado el padding superior
        width: "100%",
        boxSizing: "border-box"
      }}>
        {/* Encabezado */}
        {tipoInfo && (
          <div style={{ 
            marginBottom: "30px",
            background: darkMode ? "#1f2937" : "#fff",
            padding: "25px 30px",
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
          }}>
            <h1 style={{ 
              margin: 0, 
              color: darkMode ? "#fff" : "#111827",
              fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
              fontWeight: "700"
            }}>
              🏷️ {tipoInfo.nombre}
            </h1>
            <p style={{ 
              margin: "8px 0 0 0",
              color: darkMode ? "#9ca3af" : "#4b5563",
              fontSize: "clamp(1rem, 1.2vw, 1.1rem)"
            }}>
              {tipoInfo.subcategoria && (
                <>Subcategoría: <strong>{tipoInfo.subcategoria}</strong></>
              )}
              {tipoInfo.categoria && (
                <> · Categoría: <strong>{tipoInfo.categoria}</strong></>
              )}
            </p>
          </div>
        )}

        {/* Grid de productos */}
        {cargando ? (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px",
            color: darkMode ? "#9ca3af" : "#6b7280"
          }}>
            <p style={{ fontSize: "1.2rem" }}>Cargando productos...</p>
          </div>
        ) : productos.length === 0 ? (
          <div style={{ 
            textAlign: "center", 
            padding: "60px 20px",
            background: darkMode ? "#1f2937" : "#fff",
            borderRadius: "16px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.06)"
          }}>
            <p style={{ 
              fontSize: "1.2rem", 
              color: darkMode ? "#9ca3af" : "#6b7280"
            }}>
              No hay productos disponibles para este tipo.
            </p>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "24px"
          }}>
            {productos.map((producto) => (
              <div
                key={producto.id}
                style={{
                  background: darkMode ? "#1f2937" : "#fff",
                  borderRadius: "18px",
                  padding: "16px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                  cursor: "pointer",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  position: "relative",
                  border: darkMode ? "1px solid #374151" : "1px solid #e5e7eb",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  textAlign: "center"
                }}
                onClick={() => irAlProducto(producto.id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow = "0 10px 30px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)";
                }}
              >
                {/* Botón favorito */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorito(producto);
                  }}
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    background: esFavorito(producto.id) ? "#dc2626" : "rgba(255,255,255,0.9)",
                    color: esFavorito(producto.id) ? "#fff" : "#111",
                    border: "none",
                    borderRadius: "50%",
                    width: "36px",
                    height: "36px",
                    fontSize: "18px",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                    zIndex: 5
                  }}
                >
                  ❤️
                </button>

                {/* Badges de oferta/rebaja */}
                <div style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  zIndex: 5
                }}>
                  {(producto.oferta === 1 || producto.oferta === true) && (
                    <span style={{
                      background: "#dc2626",
                      color: "#fff",
                      padding: "2px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "bold"
                    }}>
                      OFERTA
                    </span>
                  )}
                  {(producto.rebaja === 1 || producto.rebaja === true) && (
                    <span style={{
                      background: "#f59e0b",
                      color: "#fff",
                      padding: "2px 10px",
                      borderRadius: "12px",
                      fontSize: "11px",
                      fontWeight: "bold"
                    }}>
                      REBAJA
                    </span>
                  )}
                </div>

                {/* Imagen */}
                <img
                  src={obtenerImagen(producto)}
                  alt={producto.nombre}
                  style={{
                    width: "100%",
                    height: "200px",
                    objectFit: "cover",
                    borderRadius: "12px",
                    marginBottom: "12px",
                    background: "#f9fafb"
                  }}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/300x300?text=Sin+Imagen";
                  }}
                />

                {/* Nombre */}
                <h3 style={{
                  margin: "0 0 6px 0",
                  fontSize: "clamp(0.95rem, 1.2vw, 1.1rem)",
                  color: darkMode ? "#fff" : "#111827",
                  fontWeight: "600",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  lineHeight: "1.3",
                  minHeight: "2.6rem"
                }}>
                  {producto.nombre}
                </h3>

                {/* Precio */}
                {(producto.oferta === 1 || producto.oferta === true) && producto.precioOferta ? (
                  <div style={{ marginTop: "auto" }}>
                    <span style={{
                      textDecoration: "line-through",
                      color: "#9ca3af",
                      fontSize: "14px",
                      marginRight: "8px"
                    }}>
                      ${producto.precio}
                    </span>
                    <span style={{
                      color: "#dc2626",
                      fontWeight: "700",
                      fontSize: "20px"
                    }}>
                      ${producto.precioOferta}
                    </span>
                  </div>
                ) : (
                  <p style={{
                    margin: "8px 0 0 0",
                    color: "#16a34a",
                    fontWeight: "700",
                    fontSize: "20px"
                  }}>
                    ${producto.precio}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <Footer darkMode={darkMode} />
    </div>
  );
}