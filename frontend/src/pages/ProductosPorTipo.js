import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function ProductosPorTipo() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [productos, setProductos] = useState([]);
  const [tipo, setTipo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos");
    return guardados ? JSON.parse(guardados) : [];
  });

  // Cargar datos de navegación
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [productosTodos, setProductosTodos] = useState([]);

  useEffect(() => {
    const cargarDatosNavegacion = async () => {
      try {
        const [catRes, subRes, tipoRes, prodRes] = await Promise.all([
          api.get("/categorias"),
          api.get("/subcategorias"),
          api.get("/tipos"),
          api.get("/productos"),
        ]);
        setCategorias(catRes.data);
        setSubcategorias(subRes.data);
        setTipos(tipoRes.data);
        setProductosTodos(prodRes.data);
      } catch (error) {
        console.error("Error cargando datos de navegación:", error);
      }
    };
    cargarDatosNavegacion();
  }, []);

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Primero obtener el tipo por ID
        const tipoRes = await api.get(`/tipos/${id}`);
        setTipo(tipoRes.data);
        
        // Luego obtener los productos de ese tipo
        const productosRes = await api.get(`/productos/tipo/${id}`);
        setProductos(productosRes.data);
        
      } catch (error) {
        console.error("Error cargando productos por tipo:", error);
        setError("No se pudieron cargar los productos. Intenta de nuevo.");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      cargarProductos();
    }
  }, [id]);

  // ========== FUNCIONES ==========

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
    return producto.imagen || "/placeholder.png";
  };

  // Guardar favoritos en localStorage
  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  if (loading) {
    return (
      <div className="productos-por-tipo-page">
        <Navbar
          productos={productosTodos}
          categorias={categorias}
          subcategorias={subcategorias}
          tipos={tipos}
          favoritos={favoritos}
          toggleFavorito={toggleFavorito}
          esFavorito={esFavorito}
        />
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          minHeight: "60vh" 
        }}>
          <h2>Cargando productos...</h2>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !tipo) {
    return (
      <div className="productos-por-tipo-page">
        <Navbar
          productos={productosTodos}
          categorias={categorias}
          subcategorias={subcategorias}
          tipos={tipos}
          favoritos={favoritos}
          toggleFavorito={toggleFavorito}
          esFavorito={esFavorito}
        />
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          alignItems: "center", 
          minHeight: "60vh",
          flexDirection: "column",
          padding: "20px"
        }}>
          <h2 style={{ color: "#dc2626" }}>❌ Tipo no encontrado</h2>
          <p style={{ color: "#6b7280" }}>El tipo que buscas no existe o ha sido eliminado.</p>
          <button 
            onClick={() => navigate(-1)}
            style={{
              marginTop: "20px",
              padding: "12px 24px",
              background: "#111827",
              color: "#fff",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: "bold"
            }}
          >
            ← Volver atrás
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="productos-por-tipo-page">
      <Navbar
        productos={productosTodos}
        categorias={categorias}
        subcategorias={subcategorias}
        tipos={tipos}
        favoritos={favoritos}
        toggleFavorito={toggleFavorito}
        esFavorito={esFavorito}
      />

      <div style={{ 
        maxWidth: "1400px", 
        margin: "0 auto", 
        padding: "40px 20px",
        minHeight: "60vh"
      }}>
        {/* Header */}
        <div style={{
          marginBottom: "30px",
          borderBottom: "1px solid #e5e7eb",
          paddingBottom: "20px"
        }}>
          <h1 style={{
            fontSize: "36px",
            fontWeight: "800",
            color: "#111827",
            marginBottom: "5px"
          }}>
            📦 Productos de tipo: <span style={{ color: "#0ea5e9" }}>{tipo.nombre}</span>
          </h1>
          <p style={{ color: "#6b7280", fontSize: "16px" }}>
            {productos.length} {productos.length === 1 ? "producto disponible" : "productos disponibles"}
          </p>
          {tipo.subcategoria && (
            <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "5px" }}>
              Subcategoría: <strong>{tipo.subcategoria}</strong>
              {tipo.categoria && ` · Categoría: ${tipo.categoria}`}
            </p>
          )}
        </div>

        {/* Grid de productos */}
        {productos.length > 0 ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "24px"
          }}>
            {productos.map((p) => (
              <div
                key={p.id}
                style={{
                  background: "#fff",
                  borderRadius: "20px",
                  padding: "16px",
                  cursor: "pointer",
                  border: "1px solid #e5e7eb",
                  transition: "all 0.3s ease",
                  textAlign: "center",
                  position: "relative",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                }}
                onClick={() => navigate(`/producto/${p.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-6px)";
                  e.currentTarget.style.boxShadow = "0 15px 40px rgba(0,0,0,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
                }}
              >
                {/* Botón favoritos */}
                <button
                  style={{
                    position: "absolute",
                    top: "10px",
                    right: "10px",
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "none",
                    fontSize: "16px",
                    cursor: "pointer",
                    background: esFavorito(p.id) ? "#dc2626" : "#fff",
                    color: esFavorito(p.id) ? "#fff" : "#111",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    zIndex: "5"
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorito(p);
                  }}
                >
                  ❤️
                </button>

                {/* Badges */}
                <div style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "4px",
                  zIndex: "5"
                }}>
                  {p.rebaja === 1 && (
                    <span style={{
                      background: "#dc2626",
                      color: "#fff",
                      padding: "2px 10px",
                      borderRadius: "999px",
                      fontSize: "10px",
                      fontWeight: "bold"
                    }}>
                      REBAJA
                    </span>
                  )}
                  {p.destacado === 1 && (
                    <span style={{
                      background: "#111827",
                      color: "#fff",
                      padding: "2px 10px",
                      borderRadius: "999px",
                      fontSize: "10px",
                      fontWeight: "bold"
                    }}>
                      DESTACADO
                    </span>
                  )}
                </div>

                <img
                  src={obtenerImagen(p)}
                  alt={p.nombre}
                  style={{
                    width: "100%",
                    height: "160px",
                    objectFit: "contain",
                    borderRadius: "12px",
                    background: "#f9fafb",
                    marginBottom: "12px"
                  }}
                />
                <h4 style={{
                  margin: "0 0 4px 0",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#111827",
                  lineHeight: "1.2",
                  display: "-webkit-box",
                  WebkitLineClamp: "2",
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  height: "34px"
                }}>
                  {p.nombre}
                </h4>
                {p.sku && (
                  <p style={{
                    fontSize: "12px",
                    color: "#9ca3af",
                    margin: "0 0 8px 0"
                  }}>
                    SKU: {p.sku}
                  </p>
                )}
                {p.oferta === 1 ? (
                  <div>
                    <span style={{
                      textDecoration: "line-through",
                      color: "#9ca3af",
                      fontSize: "14px",
                      marginRight: "8px"
                    }}>
                      ${p.precio}
                    </span>
                    <p style={{
                      color: "#dc2626",
                      fontWeight: "bold",
                      fontSize: "20px",
                      margin: "0"
                    }}>
                      ${p.precioOferta}
                    </p>
                  </div>
                ) : (
                  <p style={{
                    color: "#16a34a",
                    fontWeight: "bold",
                    fontSize: "20px",
                    margin: "0"
                  }}>
                    ${p.precio}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            textAlign: "center",
            padding: "80px 20px",
            background: "#f9fafb",
            borderRadius: "16px",
            color: "#6b7280"
          }}>
            <p style={{ fontSize: "20px", marginBottom: "10px" }}>🔍 No hay productos disponibles para este tipo</p>
            <p style={{ fontSize: "14px" }}>
              No se encontraron productos en <strong>{tipo.nombre}</strong>
            </p>
            <button 
              onClick={() => navigate(-1)}
              style={{
                marginTop: "20px",
                padding: "12px 24px",
                background: "#111827",
                color: "#fff",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              ← Volver atrás
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}