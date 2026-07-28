import { useEffect, useState } from "react";
import api from "../services/api";
import { useNavigate } from "react-router-dom";
import Footer from "./Footer";

export default function Home() {

  const navigate = useNavigate();

  const [productos, setProductos] = useState([]);
  const [destacados, setDestacados] = useState([]);
  const [banners, setBanners] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);

  // ✅ IMPORTANTE: string, no array
  const [busqueda, setBusqueda] = useState("");

  const [bannerActual, setBannerActual] = useState(0);

  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos");
    return guardados ? JSON.parse(guardados) : [];
  });

  /* ========================= */
  /* CARGA INICIAL */
  /* ========================= */
  useEffect(() => {

    api.get("/productos").then(res => setProductos(res.data));
    api.get("/productos/destacados").then(res => setDestacados(res.data));
    api.get("/banners").then(res => setBanners(res.data));
    api.get("/categorias").then(res => setCategorias(res.data));
    api.get("/subcategorias").then(res => setSubcategorias(res.data));

  }, []);

  /* ========================= */
  /* FAVORITOS */
  /* ========================= */
  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  const toggleFavorito = (p) => {

    const existe = favoritos.find(f => f.id === p.id);

    if (existe) {
      setFavoritos(favoritos.filter(f => f.id !== p.id));
    } else {
      setFavoritos([...favoritos, p]);
    }

  };

  const esFavorito = (id) =>
    favoritos.some(f => f.id === id);

  /* ========================= */
  /* CARRUSEL BANNERS */
  /* ========================= */
  useEffect(() => {

    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setBannerActual(prev =>
        prev === banners.length - 1 ? 0 : prev + 1
      );
    }, 4000);

    return () => clearInterval(interval);

  }, [banners]);

  /* ========================= */
  /* IMAGEN */
  /* ========================= */
  const obtenerImagen = (p) =>
    p.imagenes ? p.imagenes.split(",")[0] : "";

  /* ========================= */
  /* FILTRO BUSCADOR (CORREGIDO) */
  /* ========================= */
  const productosFiltrados = productos.filter(p =>
    (p.nombre || "")
      .toLowerCase()
      .includes(busqueda.toLowerCase())
  );

  return (

    <div>

      {/* ========================= */}
      {/* HERO */}
      {/* ========================= */}
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h1>🛒 Bienvenido a Mi Tienda</h1>
        <p>Encuentra los mejores productos al mejor precio</p>
      </div>

      {/* ========================= */}
      {/* BANNER */}
      {/* ========================= */}
      {banners.length > 0 && (
        <div style={{ padding: "20px" }}>
          <img
            src={banners[bannerActual].imagen}
            alt=""
            style={{
              width: "100%",
              height: "350px",
              objectFit: "cover",
              borderRadius: "20px"
            }}
          />
        </div>
      )}

      {/* ========================= */}
      {/* CATEGORÍAS */}
      {/* ========================= */}
      <h2 style={{ paddingLeft: "20px" }}>📂 Categorías</h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        gap: "15px",
        padding: "20px"
      }}>

        {categorias.map(cat => (
          <div
            key={cat.id}
            onClick={() => navigate(`/categoria-id/${cat.id}`)}
            style={{
              background: "#fff",
              padding: "15px",
              borderRadius: "10px",
              cursor: "pointer",
              textAlign: "center"
            }}
          >
            {cat.nombre}
          </div>
        ))}

      </div>

      {/* ========================= */}
      {/* BUSCADOR */}
      {/* ========================= */}
      <div style={{ padding: "20px" }}>
        <input
          type="text"
          placeholder="Buscar productos..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            padding: "12px",
            width: "100%",
            borderRadius: "10px",
            border: "1px solid #ccc"
          }}
        />
      </div>

      {/* ========================= */}
      {/* DESTACADOS */}
      {/* ========================= */}
      <h2 style={{ paddingLeft: "20px" }}>⭐ Destacados</h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        padding: "20px"
      }}>

        {destacados.map(p => (
          <div
            key={p.id}
            onClick={() => navigate(`/producto/${p.id}`)}
            style={{
              background: "#fff",
              padding: "15px",
              borderRadius: "10px",
              cursor: "pointer",
              position: "relative"
            }}
          >

            {/* ❤️ FAVORITO */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorito(p);
              }}
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                border: "none",
                background: "transparent",
                fontSize: "20px"
              }}
            >
              {esFavorito(p.id) ? "❤️" : "🤍"}
            </button>

            <img
              src={obtenerImagen(p)}
              alt=""
              style={{
                width: "100%",
                height: "150px",
                objectFit: "cover"
              }}
            />

            <h3>{p.nombre}</h3>
            <p>${p.precio}</p>

          </div>
        ))}

      </div>

      {/* ========================= */}
      {/* PRODUCTOS */}
      {/* ========================= */}
      <h2 style={{ paddingLeft: "20px" }}>📦 Productos</h2>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "20px",
        padding: "20px"
      }}>

        {productosFiltrados.map(p => (
          <div
            key={p.id}
            onClick={() => navigate(`/producto/${p.id}`)}
            style={{
              background: "#f9f9f9",
              padding: "15px",
              borderRadius: "10px",
              cursor: "pointer"
            }}
          >

            <img
              src={obtenerImagen(p)}
              alt=""
              style={{
                width: "100%",
                height: "150px",
                objectFit: "cover"
              }}
            />

            <h3>{p.nombre}</h3>
            <p>${p.precio}</p>

          </div>
        ))}

      </div>

      {/* ========================= */}
      {/* FOOTER */}
      {/* ========================= */}
      <Footer />

    </div>
  );
}