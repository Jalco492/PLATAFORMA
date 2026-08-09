import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Footer from "./Footer";
import Navbar from "./Navbar";

// 🔥 FUNCIÓN PARA GENERAR URL DE IMAGEN - SOLO UNA VEZ
const getImageUrl = (imagen) => {
  if (!imagen) return "https://via.placeholder.com/200";
  if (imagen.startsWith("http://") || imagen.startsWith("https://")) return imagen;
  if (imagen.startsWith("/")) return `https://backend-zuib.onrender.com${imagen}`;
  return `https://backend-zuib.onrender.com/${imagen}`;
};

export default function ProductoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ========== ESTADOS ==========
  const [producto, setProducto] = useState(null);
  const [indice, setIndice] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [relacionados, setRelacionados] = useState([]);
  const [sugeridos, setSugeridos] = useState([]);
  const [imagenGuiaZoom, setImagenGuiaZoom] = useState(null);
  const [modelosDisponibles, setModelosDisponibles] = useState([]);
  const [modeloSeleccionado, setModeloSeleccionado] = useState(null);
  const [indiceCarrusel, setIndiceCarrusel] = useState(0);
  const [favoritos, setFavoritos] = useState(() => {
    const guardados = localStorage.getItem("favoritos");
    return guardados ? JSON.parse(guardados) : [];
  });
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cliente, setCliente] = useState({ nombre: "", correo: "", celular: "" });
  const [enviando, setEnviando] = useState(false);
  const [mensajeEnviado, setMensajeEnviado] = useState("");
  const [fichaZoom, setFichaZoom] = useState(false);
  const [mostrarCotizador, setMostrarCotizador] = useState(false);
  const [desperdicio, setDesperdicio] = useState(0);
  const [modoCotizacion, setModoCotizacion] = useState("todas");
  const [areaSeleccionada, setAreaSeleccionada] = useState(0);
  const [mostrarNotificacion, setMostrarNotificacion] = useState(false);
  const [notificacionMensaje, setNotificacionMensaje] = useState("");
  
  // ========== MÚLTIPLES ÁREAS ==========
  const [areas, setAreas] = useState([
    { 
      id: Date.now() + 1,
      tipo: "rectangulo", 
      nombre: "Área 1",
      datos: {
        largo: "",
        ancho: "",
        lado: "",
        diametro: "",
        base: "",
        altura: "",
        baseMayor: "",
        baseMenor: "",
        alturaTrapecio: "",
        escalones: "",
        huella: "",
        contrahuella: "",
        anchoEscalon: "",
        largoBarra: "",
        anchoBarra: "",
        cantidadBarras: "",
        radio: "",
        radioMenor: "",
        diagonalMayor: "",
        diagonalMenor: "",
        perimetro: "",
        apotema: "",
        numLados: "",
        longitudLado: "",
        angulo: "",
        radioExterior: "",
        radioInterior: "",
        descripcion: "",
        areaPersonalizada: ""
      }
    }
  ]);

  const cotizadorRef = useRef();
  const imagenPDFRef = useRef();
  const carruselIntervalRef = useRef(null);
  const carruselScrollRef = useRef(null);

  // ========== TIPOS DE FORMAS DISPONIBLES ==========
  const tiposDeFormas = [
    { id: "rectangulo", icono: "📏", nombre: "Rectángulo", campos: ["largo", "ancho"] },
    { id: "cuadrado", icono: "⬜", nombre: "Cuadrado", campos: ["lado"] },
    { id: "circulo", icono: "⭕", nombre: "Círculo", campos: ["diametro"] },
    { id: "triangulo", icono: "🔺", nombre: "Triángulo", campos: ["base", "altura"] },
    { id: "trapecio", icono: "📐", nombre: "Trapecio", campos: ["baseMayor", "baseMenor", "alturaTrapecio"] },
    { id: "rombo", icono: "💎", nombre: "Rombo", campos: ["diagonalMayor", "diagonalMenor"] },
    { id: "pentagono", icono: "⬠", nombre: "Pentágono", campos: ["perimetro", "apotema"] },
    { id: "hexagono", icono: "⬡", nombre: "Hexágono", campos: ["perimetro", "apotema"] },
    { id: "octagono", icono: "⯃", nombre: "Octágono", campos: ["perimetro", "apotema"] },
    { id: "elipse", icono: "🔵", nombre: "Elipse", campos: ["radio", "radioMenor"] },
    { id: "escalera", icono: "🪜", nombre: "Escalera", campos: ["escalones", "huella", "contrahuella", "anchoEscalon"] },
    { id: "barra", icono: "📊", nombre: "Barra", campos: ["largoBarra", "anchoBarra", "cantidadBarras"] },
    { id: "poligono_regular", icono: "⬡", nombre: "Polígono Regular", campos: ["numLados", "longitudLado", "apotema"] },
    { id: "sector_circular", icono: "🍕", nombre: "Sector Circular", campos: ["radio", "angulo"] },
    { id: "corona_circular", icono: "⭕", nombre: "Corona Circular", campos: ["radioExterior", "radioInterior"] },
    { id: "figura_personalizada", icono: "✏️", nombre: "Figura Personalizada", campos: ["descripcion", "areaPersonalizada"] }
  ];

  // ========== EFECTOS ==========
  useEffect(() => {
    const cargarDatosNavegacion = async () => {
      try {
        const [catRes, subRes, tipoRes] = await Promise.all([
          api.get("/categorias"),
          api.get("/subcategorias"),
          api.get("/tipos"),
        ]);
        setCategorias(catRes.data);
        setSubcategorias(subRes.data);
        setTipos(tipoRes.data);
      } catch (error) {
        console.error("Error cargando datos de navegación:", error);
      }
    };
    cargarDatosNavegacion();
  }, []);

  useEffect(() => {
    api.get("/productos")
      .then((res) => setProductos(res.data))
      .catch((err) => console.error("Error cargando productos:", err));
  }, []);

  useEffect(() => {
    api.get(`/productos/${id}`)
      .then((res) => {
        setProducto(res.data);
        setIndice(0);
        setModeloSeleccionado(null);
        setIndiceCarrusel(0);
        setAreas([
          { 
            id: Date.now() + 1,
            tipo: "rectangulo", 
            nombre: "Área 1",
            datos: {
              largo: "",
              ancho: "",
              lado: "",
              diametro: "",
              base: "",
              altura: "",
              baseMayor: "",
              baseMenor: "",
              alturaTrapecio: "",
              escalones: "",
              huella: "",
              contrahuella: "",
              anchoEscalon: "",
              largoBarra: "",
              anchoBarra: "",
              cantidadBarras: "",
              radio: "",
              radioMenor: "",
              diagonalMayor: "",
              diagonalMenor: "",
              perimetro: "",
              apotema: "",
              numLados: "",
              longitudLado: "",
              angulo: "",
              radioExterior: "",
              radioInterior: "",
              descripcion: "",
              areaPersonalizada: ""
            }
          }
        ]);
        setDesperdicio(0);
      })
      .catch((err) => console.error("Error cargando producto:", err));
  }, [id]);

  // ===== AJUSTE PARA NAVBAR EN MÓVIL =====
  useEffect(() => {
    const adjustForNavbar = () => {
      const navbar = document.querySelector('.navbar');
      const page = document.querySelector('.producto-detalle-page');
      if (navbar && page && window.innerWidth <= 767) {
        const height = navbar.offsetHeight;
        page.style.paddingTop = `${height + 40}px`;
      } else if (page) {
        page.style.paddingTop = '0px';
      }
    };
    
    adjustForNavbar();
    window.addEventListener('resize', adjustForNavbar);
    
    return () => window.removeEventListener('resize', adjustForNavbar);
  }, []);

  // ===== MODELOS DISPONIBLES =====
  useEffect(() => {
    if (!producto) {
      setModelosDisponibles([]);
      return;
    }

    const tipoId = producto.tipo_id;

    if (!tipoId) {
      setModelosDisponibles([]);
      return;
    }

    const filtrarModelosLocalmente = () => {
      const tipoActual = producto.tipo?.toLowerCase().trim() || '';
      if (!tipoActual) {
        setModelosDisponibles([]);
        return;
      }

      api.get("/productos")
        .then((res) => {
          const filtrados = res.data.filter((p) => {
            if (p.id === producto.id) return false;
            const tipoP = p.tipo?.toLowerCase().trim() || '';
            return tipoP === tipoActual && p.visible === 1;
          });
          setModelosDisponibles(filtrados);
          if (filtrados.length > 0 && !modeloSeleccionado) {
            setModeloSeleccionado(null);
          }
        })
        .catch((err) => console.error("Error en fallback:", err));
    };

    api.get(`/productos/tipo/${tipoId}`)
      .then((res) => {
        const filtrados = res.data.filter(p => p.id !== producto.id && p.visible === 1);
        setModelosDisponibles(filtrados);
        if (filtrados.length > 0 && !modeloSeleccionado) {
          setModeloSeleccionado(null);
        }
      })
      .catch((err) => {
        console.error("❌ Error cargando modelos disponibles:", err);
        filtrarModelosLocalmente();
      });
  }, [producto, modeloSeleccionado]);

  // ===== CARRUSEL AUTOMÁTICO =====
  useEffect(() => {
    if (modelosDisponibles.length > 1 && carruselScrollRef.current) {
      const scrollContainer = carruselScrollRef.current;
      
      if (carruselIntervalRef.current) {
        clearInterval(carruselIntervalRef.current);
      }

      carruselIntervalRef.current = setInterval(() => {
        setIndiceCarrusel((prev) => {
          const nextIndex = (prev + 1) % modelosDisponibles.length;
          if (scrollContainer) {
            const items = scrollContainer.querySelectorAll('.modelo-carrusel-item');
            if (items[nextIndex]) {
              const itemWidth = items[nextIndex].offsetWidth + 12;
              scrollContainer.scrollTo({
                left: nextIndex * itemWidth,
                behavior: 'smooth'
              });
            }
          }
          return nextIndex;
        });
      }, 3500);
    }
    return () => {
      if (carruselIntervalRef.current) clearInterval(carruselIntervalRef.current);
    };
  }, [modelosDisponibles]);

  // ===== PRODUCTOS RELACIONADOS =====
  useEffect(() => {
    if (!producto) return;

    const filtrarRelacionadosLocalmente = () => {
      const subcategoriaActual = producto.subcategoria?.toLowerCase().trim() || '';
      if (!subcategoriaActual) {
        setRelacionados([]);
        return;
      }

      api.get("/productos")
        .then((res) => {
          const filtrados = res.data.filter((p) => {
            if (p.id === producto.id) return false;
            const subcategoriaP = p.subcategoria?.toLowerCase().trim() || '';
            return subcategoriaP === subcategoriaActual && p.visible === 1;
          });
          setRelacionados(filtrados);
        })
        .catch((err) => console.error("Error en fallback:", err));
    };

    if (producto.subcategoria_id) {
      api.get(`/productos/subcategoria-id/${producto.subcategoria_id}`)
        .then((res) => {
          const filtrados = res.data.filter(p => p.id !== producto.id);
          setRelacionados(filtrados);
        })
        .catch((err) => {
          console.error("❌ Error cargando productos relacionados:", err);
          filtrarRelacionadosLocalmente();
        });
    } else {
      filtrarRelacionadosLocalmente();
    }

    let idsSugeridos = [];
    try {
      idsSugeridos = producto.sugerencias ? JSON.parse(producto.sugerencias) : [];
    } catch { idsSugeridos = []; }
    api.get("/productos")
      .then((res) => {
        const listaSugeridos = res.data.filter((p) => 
          idsSugeridos.includes(String(p.id)) && p.id !== producto.id
        );
        setSugeridos(listaSugeridos);
      })
      .catch((err) => console.error("Error cargando sugeridos:", err));
  }, [producto]);

  useEffect(() => {
    localStorage.setItem("favoritos", JSON.stringify(favoritos));
  }, [favoritos]);

  // ========== FUNCIONES DE CÁLCULO DE ÁREAS ==========
  
  const calcularAreaForma = (tipo, datos) => {
    switch(tipo) {
      case 'rectangulo': {
        const largo = Number(datos.largo) || 0;
        const ancho = Number(datos.ancho) || 0;
        return largo * ancho;
      }
      case 'cuadrado': {
        const lado = Number(datos.lado) || 0;
        return lado * lado;
      }
      case 'circulo': {
        const diametro = Number(datos.diametro) || 0;
        const radio = diametro / 2;
        return Math.PI * radio * radio;
      }
      case 'triangulo': {
        const base = Number(datos.base) || 0;
        const altura = Number(datos.altura) || 0;
        return (base * altura) / 2;
      }
      case 'trapecio': {
        const baseMayor = Number(datos.baseMayor) || 0;
        const baseMenor = Number(datos.baseMenor) || 0;
        const altura = Number(datos.alturaTrapecio) || 0;
        return ((baseMayor + baseMenor) * altura) / 2;
      }
      case 'rombo': {
        const diagonalMayor = Number(datos.diagonalMayor) || 0;
        const diagonalMenor = Number(datos.diagonalMenor) || 0;
        return (diagonalMayor * diagonalMenor) / 2;
      }
      case 'pentagono':
      case 'hexagono':
      case 'octagono': {
        const perimetro = Number(datos.perimetro) || 0;
        const apotema = Number(datos.apotema) || 0;
        return (perimetro * apotema) / 2;
      }
      case 'elipse': {
        const radio = Number(datos.radio) || 0;
        const radioMenor = Number(datos.radioMenor) || 0;
        return Math.PI * radio * radioMenor;
      }
      case 'escalera': {
        const escalones = Number(datos.escalones) || 0;
        const huella = Number(datos.huella) || 0;
        const contrahuella = Number(datos.contrahuella) || 0;
        const ancho = Number(datos.anchoEscalon) || 0;
        return escalones * ancho * (huella + contrahuella);
      }
      case 'barra': {
        const largo = Number(datos.largoBarra) || 0;
        const ancho = Number(datos.anchoBarra) || 0;
        const cantidad = Number(datos.cantidadBarras) || 1;
        return largo * ancho * cantidad;
      }
      case 'poligono_regular': {
        const n = Number(datos.numLados) || 0;
        const lado = Number(datos.longitudLado) || 0;
        const apotema = Number(datos.apotema) || 0;
        if (n > 0 && lado > 0 && apotema > 0) {
          return (n * lado * apotema) / 2;
        }
        return 0;
      }
      case 'sector_circular': {
        const radio = Number(datos.radio) || 0;
        const angulo = Number(datos.angulo) || 0;
        if (radio > 0 && angulo > 0) {
          return (Math.PI * radio * radio * angulo) / 360;
        }
        return 0;
      }
      case 'corona_circular': {
        const radioExterior = Number(datos.radioExterior) || 0;
        const radioInterior = Number(datos.radioInterior) || 0;
        if (radioExterior > 0 && radioInterior > 0 && radioExterior > radioInterior) {
          return Math.PI * (radioExterior * radioExterior - radioInterior * radioInterior);
        }
        return 0;
      }
      case 'figura_personalizada': {
        return Number(datos.areaPersonalizada) || 0;
      }
      default:
        return 0;
    }
  };

  const getDescripcionArea = (tipo, datos) => {
    switch(tipo) {
      case 'rectangulo':
        return `${datos.largo || 0}m × ${datos.ancho || 0}m`;
      case 'cuadrado':
        return `${datos.lado || 0}m × ${datos.lado || 0}m`;
      case 'circulo':
        return `⌀${datos.diametro || 0}m`;
      case 'triangulo':
        return `Base ${datos.base || 0}m × Altura ${datos.altura || 0}m ÷ 2`;
      case 'trapecio':
        return `(${datos.baseMayor || 0}m + ${datos.baseMenor || 0}m) × ${datos.alturaTrapecio || 0}m ÷ 2`;
      case 'rombo':
        return `(${datos.diagonalMayor || 0}m × ${datos.diagonalMenor || 0}m) ÷ 2`;
      case 'pentagono':
        return `Pentágono: (${datos.perimetro || 0}m × ${datos.apotema || 0}m) ÷ 2`;
      case 'hexagono':
        return `Hexágono: (${datos.perimetro || 0}m × ${datos.apotema || 0}m) ÷ 2`;
      case 'octagono':
        return `Octágono: (${datos.perimetro || 0}m × ${datos.apotema || 0}m) ÷ 2`;
      case 'elipse':
        return `π × ${datos.radio || 0}m × ${datos.radioMenor || 0}m`;
      case 'escalera':
        return `${datos.escalones || 0} escalones × ${datos.anchoEscalon || 0}m × (${datos.huella || 0}m + ${datos.contrahuella || 0}m)`;
      case 'barra':
        return `${datos.cantidadBarras || 1} barra(s) de ${datos.largoBarra || 0}m × ${datos.anchoBarra || 0}m`;
      case 'poligono_regular':
        return `${datos.numLados || 0} lados de ${datos.longitudLado || 0}m, apotema ${datos.apotema || 0}m`;
      case 'sector_circular':
        return `Radio ${datos.radio || 0}m, ángulo ${datos.angulo || 0}°`;
      case 'corona_circular':
        return `Radio ext. ${datos.radioExterior || 0}m, Radio int. ${datos.radioInterior || 0}m`;
      case 'figura_personalizada':
        return datos.descripcion || 'Figura personalizada';
      default:
        return '';
    }
  };

  const getNombreForma = (tipo) => {
    const forma = tiposDeFormas.find(f => f.id === tipo);
    return forma ? forma.nombre : tipo;
  };

  const getIconoForma = (tipo) => {
    const forma = tiposDeFormas.find(f => f.id === tipo);
    return forma ? forma.icono : '📐';
  };

  // ========== VALIDACIÓN DE MEDIDAS ==========
  const validarMedidas = (tipo, datos) => {
    switch(tipo) {
      case 'rectangulo': {
        const largo = Number(datos.largo) || 0;
        const ancho = Number(datos.ancho) || 0;
        if (largo > 0 && ancho > 0) {
          if (largo === ancho) {
            return { valido: true, mensaje: "⚠️ Es un cuadrado (lados iguales)", tipo: "warning" };
          }
          return { valido: true, mensaje: "✅ Rectángulo con lados diferentes", tipo: "success" };
        }
        return { valido: false, mensaje: "❌ Ingresa largo y ancho", tipo: "error" };
      }
      case 'cuadrado': {
        const lado = Number(datos.lado) || 0;
        if (lado > 0) {
          return { valido: true, mensaje: "✅ Cuadrado válido", tipo: "success" };
        }
        return { valido: false, mensaje: "❌ Ingresa el lado", tipo: "error" };
      }
      case 'circulo': {
        const diametro = Number(datos.diametro) || 0;
        if (diametro > 0) {
          return { valido: true, mensaje: "✅ Círculo válido", tipo: "success" };
        }
        return { valido: false, mensaje: "❌ Ingresa el diámetro", tipo: "error" };
      }
      case 'triangulo': {
        const base = Number(datos.base) || 0;
        const altura = Number(datos.altura) || 0;
        if (base > 0 && altura > 0) {
          return { valido: true, mensaje: "✅ Triángulo válido", tipo: "success" };
        }
        return { valido: false, mensaje: "❌ Ingresa base y altura", tipo: "error" };
      }
      case 'trapecio': {
        const baseMayor = Number(datos.baseMayor) || 0;
        const baseMenor = Number(datos.baseMenor) || 0;
        const altura = Number(datos.alturaTrapecio) || 0;
        if (baseMayor > 0 && baseMenor > 0 && altura > 0) {
          if (baseMayor === baseMenor) {
            return { valido: true, mensaje: "⚠️ Es un rectángulo (bases iguales)", tipo: "warning" };
          }
          return { valido: true, mensaje: "✅ Trapecio válido", tipo: "success" };
        }
        return { valido: false, mensaje: "❌ Ingresa todas las medidas", tipo: "error" };
      }
      case 'poligono_regular': {
        const n = Number(datos.numLados) || 0;
        const lado = Number(datos.longitudLado) || 0;
        const apotema = Number(datos.apotema) || 0;
        if (n > 2 && lado > 0 && apotema > 0) {
          return { valido: true, mensaje: `✅ ${n} lados válidos`, tipo: "success" };
        }
        return { valido: false, mensaje: "❌ Ingresa número de lados, longitud y apotema", tipo: "error" };
      }
      case 'sector_circular': {
        const radio = Number(datos.radio) || 0;
        const angulo = Number(datos.angulo) || 0;
        if (radio > 0 && angulo > 0 && angulo <= 360) {
          return { valido: true, mensaje: `✅ Sector de ${angulo}° válido`, tipo: "success" };
        }
        return { valido: false, mensaje: "❌ Radio y ángulo (0-360°) requeridos", tipo: "error" };
      }
      case 'corona_circular': {
        const re = Number(datos.radioExterior) || 0;
        const ri = Number(datos.radioInterior) || 0;
        if (re > 0 && ri > 0 && re > ri) {
          return { valido: true, mensaje: "✅ Corona circular válida", tipo: "success" };
        }
        if (re > 0 && ri > 0 && re <= ri) {
          return { valido: false, mensaje: "❌ Radio exterior debe ser mayor que el interior", tipo: "error" };
        }
        return { valido: false, mensaje: "❌ Ingresa ambos radios", tipo: "error" };
      }
      case 'figura_personalizada': {
        const area = Number(datos.areaPersonalizada) || 0;
        if (area > 0) {
          return { valido: true, mensaje: `✅ Área personalizada: ${area.toFixed(2)} m²`, tipo: "success" };
        }
        return { valido: false, mensaje: "❌ Ingresa el área calculada", tipo: "error" };
      }
      default:
        return { valido: true, mensaje: "", tipo: "info" };
    }
  };

  // ========== FUNCIONES DE MANEJO DE ÁREAS ==========
  
  const agregarArea = () => {
    if (areas.length >= 10) return;
    setAreas([
      ...areas,
      { 
        id: Date.now() + areas.length + 1,
        tipo: "rectangulo", 
        nombre: `Área ${areas.length + 1}`,
        datos: {
          largo: "",
          ancho: "",
          lado: "",
          diametro: "",
          base: "",
          altura: "",
          baseMayor: "",
          baseMenor: "",
          alturaTrapecio: "",
          escalones: "",
          huella: "",
          contrahuella: "",
          anchoEscalon: "",
          largoBarra: "",
          anchoBarra: "",
          cantidadBarras: "",
          radio: "",
          radioMenor: "",
          diagonalMayor: "",
          diagonalMenor: "",
          perimetro: "",
          apotema: "",
          numLados: "",
          longitudLado: "",
          angulo: "",
          radioExterior: "",
          radioInterior: "",
          descripcion: "",
          areaPersonalizada: ""
        }
      }
    ]);
  };

  const eliminarArea = (index) => {
    if (areas.length <= 1) return;
    setAreas(areas.filter((_, i) => i !== index));
  };

  const duplicarArea = (index) => {
    if (areas.length >= 10) return;
    const areaOriginal = areas[index];
    const nuevaArea = {
      ...areaOriginal,
      id: Date.now() + areas.length + 1,
      nombre: `${areaOriginal.nombre} (copia)`,
      datos: { ...areaOriginal.datos }
    };
    const nuevasAreas = [...areas];
    nuevasAreas.splice(index + 1, 0, nuevaArea);
    setAreas(nuevasAreas);
  };

  const actualizarArea = (index, campo, valor) => {
    const nuevasAreas = [...areas];
    if (campo === 'tipo') {
      nuevasAreas[index].tipo = valor;
      nuevasAreas[index].datos = {
        largo: "",
        ancho: "",
        lado: "",
        diametro: "",
        base: "",
        altura: "",
        baseMayor: "",
        baseMenor: "",
        alturaTrapecio: "",
        escalones: "",
        huella: "",
        contrahuella: "",
        anchoEscalon: "",
        largoBarra: "",
        anchoBarra: "",
        cantidadBarras: "",
        radio: "",
        radioMenor: "",
        diagonalMayor: "",
        diagonalMenor: "",
        perimetro: "",
        apotema: "",
        numLados: "",
        longitudLado: "",
        angulo: "",
        radioExterior: "",
        radioInterior: "",
        descripcion: "",
        areaPersonalizada: ""
      };
    } else if (campo === 'nombre') {
      nuevasAreas[index].nombre = valor;
    } else {
      nuevasAreas[index].datos[campo] = valor;
    }
    setAreas(nuevasAreas);
  };

  const limpiarAreas = () => {
    setAreas([
      { 
        id: Date.now() + 1,
        tipo: "rectangulo", 
        nombre: "Área 1",
        datos: {
          largo: "",
          ancho: "",
          lado: "",
          diametro: "",
          base: "",
          altura: "",
          baseMayor: "",
          baseMenor: "",
          alturaTrapecio: "",
          escalones: "",
          huella: "",
          contrahuella: "",
          anchoEscalon: "",
          largoBarra: "",
          anchoBarra: "",
          cantidadBarras: "",
          radio: "",
          radioMenor: "",
          diagonalMayor: "",
          diagonalMenor: "",
          perimetro: "",
          apotema: "",
          numLados: "",
          longitudLado: "",
          angulo: "",
          radioExterior: "",
          radioInterior: "",
          descripcion: "",
          areaPersonalizada: ""
        }
      }
    ]);
  };

  const calcularAreaTotal = () => {
    return areas.reduce((total, area) => {
      return total + calcularAreaForma(area.tipo, area.datos);
    }, 0);
  };

  const getAreasValidas = () => {
    return areas.filter(area => {
      return calcularAreaForma(area.tipo, area.datos) > 0;
    });
  };

  // ========== FUNCIONES EXISTENTES ==========
  const toggleFavorito = (producto) => {
    const existe = favoritos.find((fav) => fav.id === producto.id);
    if (existe) {
      setFavoritos(favoritos.filter((f) => f.id !== producto.id));
      mostrarNotificacionCustom("❤️ Producto eliminado de favoritos");
    } else {
      setFavoritos([...favoritos, producto]);
      mostrarNotificacionCustom("❤️ Producto agregado a favoritos");
    }
  };

  const esFavorito = (id) => favoritos.some((f) => f.id === id);

  const mostrarNotificacionCustom = (mensaje) => {
    setNotificacionMensaje(mensaje);
    setMostrarNotificacion(true);
    setTimeout(() => {
      setMostrarNotificacion(false);
    }, 3000);
  };

  const obtenerImagen = (producto) => {
    if (!producto) return "https://via.placeholder.com/200";
    let imagenUrl = "";
    if (producto.imagenes && producto.imagenes.trim() !== "") {
      imagenUrl = producto.imagenes.split(",")[0].trim();
    } else if (producto.imagen && producto.imagen.trim() !== "") {
      imagenUrl = producto.imagen.trim();
    } else {
      return "https://via.placeholder.com/200";
    }
    return getImageUrl(imagenUrl);
  };

  const imagenes = producto?.imagenes
    ? producto.imagenes.split(",")
    : producto?.imagen ? [producto.imagen] : [];

  const handleMouseMove = (e) => {
    const rect = e.target.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPos({ x, y });
  };

  const seleccionarModelo = (modelo, index) => {
    if (carruselIntervalRef.current) {
      clearInterval(carruselIntervalRef.current);
      carruselIntervalRef.current = null;
    }
    setModeloSeleccionado(modelo);
    setIndiceCarrusel(index);
    setIndice(0);
    setTimeout(() => {
      if (carruselScrollRef.current) {
        const items = carruselScrollRef.current.querySelectorAll('.modelo-carrusel-item');
        if (items[index]) {
          const itemWidth = items[index].offsetWidth + 12;
          carruselScrollRef.current.scrollTo({
            left: index * itemWidth,
            behavior: 'smooth'
          });
        }
      }
    }, 50);
  };

  const navegarCarrusel = (direccion) => {
    if (modelosDisponibles.length === 0) return;
    if (carruselIntervalRef.current) {
      clearInterval(carruselIntervalRef.current);
      carruselIntervalRef.current = null;
    }
    const nuevoIndice = (indiceCarrusel + direccion + modelosDisponibles.length) % modelosDisponibles.length;
    setIndiceCarrusel(nuevoIndice);
    setTimeout(() => {
      if (carruselScrollRef.current) {
        const items = carruselScrollRef.current.querySelectorAll('.modelo-carrusel-item');
        if (items[nuevoIndice]) {
          const itemWidth = items[nuevoIndice].offsetWidth + 12;
          carruselScrollRef.current.scrollTo({
            left: nuevoIndice * itemWidth,
            behavior: 'smooth'
          });
        }
      }
    }, 50);
  };

  const getImagenActual = () => {
    let imgUrl = '';
    if (modeloSeleccionado) {
      const img = modeloSeleccionado.imagenes 
        ? modeloSeleccionado.imagenes.split(",") 
        : [modeloSeleccionado.imagen];
      imgUrl = img[indice] || img[0] || '';
    } else {
      imgUrl = imagenes[indice] || imagenes[0] || '';
    }
    if (!imgUrl) return "https://via.placeholder.com/200";
    return getImageUrl(imgUrl);
  };

  const getNombreActual = () => modeloSeleccionado ? modeloSeleccionado.nombre : producto.nombre;
  const getPrecioActual = () => {
    const p = modeloSeleccionado || producto;
    return p.oferta ? p.precioOferta : p.precio;
  };

  const getUnidadVenta = () => {
    const tipoVenta = producto?.tipoVenta || '';
    const unidadMap = {
      'pieza': 'por pieza',
      'caja': 'por caja',
      'paquete': 'por paquete',
      'metro_cuadrado': 'por metro cuadrado',
      'metro_lineal': 'por metro lineal',
      'presentacion': producto?.presentacion ? `por ${producto.presentacion}` : 'por presentación'
    };
    return unidadMap[tipoVenta] || '';
  };

  const agruparPorTipo = (productos) => {
    const grupos = {};
    productos.forEach(p => {
      let tipo = p.tipo || p.tipo_nombre || 'Sin tipo';
      if (tipo.toLowerCase() === 'sin nombre' || tipo.toLowerCase() === 'sin tipo') tipo = 'Sin tipo';
      if (!grupos[tipo]) grupos[tipo] = [];
      grupos[tipo].push(p);
    });
    return grupos;
  };

  const getTipoColor = (tipo) => {
    const colores = {
      'Sin tipo': '#94a3b8', 'Piso': '#3b82f6', 'PVC': '#8b5cf6',
      'Autoadherible': '#06b6d4', 'Madera': '#d97706', 'Cerámica': '#ef4444',
      'Laminado': '#10b981', 'Porcelanato': '#6366f1', 'Mármol': '#8b5cf6',
      'Granito': '#f59e0b', 'Vinilico': '#14b8a6', 'SPC': '#0ea5e9',
      'WPC': '#84cc16', 'Linóleo': '#22d3ee',
    };
    for (const [key, color] of Object.entries(colores)) {
      if (tipo.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(tipo.toLowerCase())) {
        return color;
      }
    }
    return '#3b82f6';
  };

  const agregarAlPedido = (productoParaAgregar) => {
    const carritoGuardado = sessionStorage.getItem("carritoPedido");
    let carrito = carritoGuardado ? JSON.parse(carritoGuardado) : [];
    const existe = carrito.find(item => item.id === productoParaAgregar.id);
    
    if (existe) {
      carrito = carrito.map(item => 
        item.id === productoParaAgregar.id 
          ? { ...item, cantidad: item.cantidad + 1, subtotal: item.precio * (item.cantidad + 1) }
          : item
      );
    } else {
      carrito.push({
        ...productoParaAgregar,
        imagen: obtenerImagen(productoParaAgregar),
        cantidad: 1,
        subtotal: productoParaAgregar.precio || 0
      });
    }
    sessionStorage.setItem("carritoPedido", JSON.stringify(carrito));
    mostrarNotificacionCustom(`✅ "${productoParaAgregar.nombre}" agregado al pedido`);
    
    setTimeout(() => {
      navigate("/pedido");
    }, 1500);
  };

  // ========== CÁLCULOS COTIZADOR ==========
  const obtenerAnchoEnMetros = () => {
    const ancho = Number(producto?.anchoProducto) || 0;
    if (ancho > 10) {
      return ancho / 100;
    }
    return ancho;
  };

  let areaIngresada = calcularAreaTotal();
  let anchoRollo = obtenerAnchoEnMetros();

  const areaConDesperdicio = areaIngresada * (1 + Number(desperdicio) / 100);

  let coberturaPorUnidad = 0;
  if (producto?.tipoVenta === "metro_lineal") {
    const ancho = obtenerAnchoEnMetros();
    const metrosRollo = Number(producto.metrosPorRollo) || 0;
    coberturaPorUnidad = ancho * metrosRollo;
  } else if (producto?.tipoVenta === "metro_cuadrado") {
    coberturaPorUnidad = anchoRollo;
  } else if (producto?.tipoVenta === "presentacion") {
    coberturaPorUnidad = Number(producto?.cobertura) || 0;
  } else if (producto?.tipoVenta === "paquete") {
    const anchoM = (Number(producto?.ancho) || 0) / 100;
    const altoM = (Number(producto?.alto) || 0) / 100;
    const coberturaPorPieza = anchoM * altoM;
    const piezasCaja = Number(producto?.piezasCaja) || 1;
    coberturaPorUnidad = coberturaPorPieza * piezasCaja;
  } else {
    const anchoM = (Number(producto?.ancho) || 0) / 100;
    const altoM = (Number(producto?.alto) || 0) / 100;
    const coberturaPorPieza = anchoM * altoM;
    const piezasCaja = Number(producto?.piezasCaja) || 1;
    coberturaPorUnidad = producto?.tipoVenta === "caja" ? coberturaPorPieza * piezasCaja : coberturaPorPieza;
  }

  let metrosLineales = 0;
  let cantidadNecesaria = 0;
  let cantidadNecesariaTexto = "";
  let areaCubierta = 0;

  if (producto?.tipoVenta === "metro_lineal") {
    if (anchoRollo > 0 && areaIngresada > 0) {
      metrosLineales = areaConDesperdicio / anchoRollo;
    }
    cantidadNecesaria = metrosLineales;
    cantidadNecesariaTexto = `${metrosLineales.toFixed(2)} metros lineales`;
    areaCubierta = areaConDesperdicio;
    
  } else if (producto?.tipoVenta === "metro_cuadrado") {
    if (anchoRollo > 0 && areaIngresada > 0) {
      metrosLineales = areaConDesperdicio / anchoRollo;
    }
    cantidadNecesaria = metrosLineales;
    cantidadNecesariaTexto = `${metrosLineales.toFixed(2)} metros lineales (equivale a ${areaConDesperdicio.toFixed(2)} m²)`;
    areaCubierta = areaConDesperdicio;
    
  } else if (producto?.tipoVenta === "presentacion") {
    cantidadNecesaria = coberturaPorUnidad > 0 ? Math.ceil(areaIngresada / coberturaPorUnidad) : 0;
    cantidadNecesariaTexto = `${cantidadNecesaria} unidades`;
    areaCubierta = cantidadNecesaria * coberturaPorUnidad;
    
  } else if (producto?.tipoVenta === "paquete") {
    cantidadNecesaria = coberturaPorUnidad > 0 ? Math.ceil(areaConDesperdicio / coberturaPorUnidad) : 0;
    cantidadNecesariaTexto = `${cantidadNecesaria} paquetes`;
    areaCubierta = cantidadNecesaria * coberturaPorUnidad;
    
  } else if (producto?.tipoVenta === "caja") {
    cantidadNecesaria = coberturaPorUnidad > 0 ? Math.ceil(areaConDesperdicio / coberturaPorUnidad) : 0;
    cantidadNecesariaTexto = `${cantidadNecesaria} cajas`;
    areaCubierta = cantidadNecesaria * coberturaPorUnidad;
    
  } else if (producto?.tipoVenta === "pieza") {
    cantidadNecesaria = coberturaPorUnidad > 0 ? Math.ceil(areaConDesperdicio / coberturaPorUnidad) : 0;
    cantidadNecesariaTexto = `${cantidadNecesaria} piezas`;
    areaCubierta = cantidadNecesaria * coberturaPorUnidad;
    
  } else {
    cantidadNecesaria = coberturaPorUnidad > 0 ? Math.ceil(areaConDesperdicio / coberturaPorUnidad) : 0;
    cantidadNecesariaTexto = `${cantidadNecesaria} unidades`;
  }

  const precioFinal = Number(producto?.oferta ? producto?.precioOferta : producto?.precio) || 0;
  let total = 0;

  if (producto?.tipoVenta === "metro_lineal") {
    const precioPorMetroLineal = Number(producto.precio) || 0;
    total = metrosLineales * precioPorMetroLineal;
  } else if (producto?.tipoVenta === "metro_cuadrado") {
    const precioPorMetroCuadrado = Number(producto.precio) || 0;
    total = areaConDesperdicio * precioPorMetroCuadrado;
  } else {
    total = cantidadNecesaria * precioFinal;
  }
  total = total.toFixed(2);

  const precioPorMetroCuadrado = Number(producto?.precio) || 0;

  // ========== PDF ==========
  const convertirImagenBase64 = async (url) => {
    try {
      const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';
      const fullUrl = url.startsWith('http') ? url : `${API_BASE}${url}`;
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const blob = await response.blob();
      return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error convirtiendo imagen a base64:', error);
      return null;
    }
  };

  const generarPDF = async () => {
    try {
      setEnviando(true);
      const pdf = new jsPDF("p", "mm", "a4");
      const membrete1 = await convertirImagenBase64(
        window.location.origin + "/membreteuno.jpg"
      );
      const membrete2 = await convertirImagenBase64(
        window.location.origin + "/membretedos.jpg"
      );
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const ponerFondo = (pdf, img) => {
        if (!img) return;
        pdf.addImage(img, "JPEG", 0, 0, pageWidth, pageHeight);
      };

      ponerFondo(pdf, membrete1);
      let y = 50;
      const numeroCotizacion = Math.floor(100000 + Math.random() * 900000);
      const fechaActual = new Date().toLocaleDateString("es-MX");
      pdf.setFontSize(10);
      pdf.setTextColor(80);
      pdf.text(`Fecha: ${fechaActual}`, pageWidth - 60, 35);
      pdf.text(`Cotización #${numeroCotizacion}`, pageWidth - 60, 42);
      pdf.setDrawColor(200);
      pdf.line(15, 55, pageWidth - 15, 55);
      y = 70;

      const imagenBase64 = await convertirImagenBase64(getImagenActual());
      if (imagenBase64) {
        pdf.addImage(imagenBase64, "JPEG", 15, y, 60, 60);
      } else {
        pdf.setFontSize(10);
        pdf.setTextColor(150);
        pdf.text("Imagen no disponible", 15, y + 30);
      }

      pdf.setFontSize(14);
      pdf.setTextColor(40);
      pdf.text(`Producto: ${getNombreActual()}`, 85, y + 10);
      pdf.text(`Categoría: ${producto.categoria || "-"}`, 85, y + 20);
      pdf.text(`Subcategoría: ${producto.subcategoria || "-"}`, 85, y + 30);
      pdf.text(`SKU: ${producto.sku || "-"}`, 85, y + 40);
      pdf.setFontSize(20);
      pdf.setTextColor(22, 163, 74);
      pdf.text(`Total: $${total}`, 85, y + 55);

      y += 90;
      pdf.setFontSize(18);
      pdf.setTextColor(0);
      pdf.text("Resumen de Cotización", 15, y);
      y += 10;
      pdf.setFillColor(245, 247, 250);
      pdf.roundedRect(15, y, pageWidth - 30, 45, 3, 3, "F");
      pdf.setFontSize(11);
      pdf.setTextColor(60);

      if (producto?.tipoVenta === "metro_lineal") {
        pdf.text(`Área a cubrir: ${areaIngresada.toFixed(2)} m²`, 20, y + 8);
        pdf.text(`Desperdicio: ${desperdicio}%`, 20, y + 18);
        pdf.text(`Área final: ${areaConDesperdicio.toFixed(2)} m²`, 20, y + 28);
        pdf.text(`Metros lineales necesarios: ${metrosLineales.toFixed(2)} ml`, 20, y + 38);
        pdf.text(`Ancho del producto: ${anchoRollo.toFixed(2)} m`, 20, y + 48);
      } else if (producto?.tipoVenta === "metro_cuadrado") {
        pdf.text(`Área a cubrir: ${areaIngresada.toFixed(2)} m²`, 20, y + 8);
        pdf.text(`Desperdicio: ${desperdicio}%`, 20, y + 18);
        pdf.text(`Área final: ${areaConDesperdicio.toFixed(2)} m²`, 20, y + 28);
        pdf.text(`Metros lineales a cortar: ${metrosLineales.toFixed(2)} ml`, 20, y + 38);
        pdf.text(`Ancho del rollo: ${anchoRollo.toFixed(2)} m`, 20, y + 48);
        pdf.text(`Precio por m²: $${precioPorMetroCuadrado}`, 20, y + 58);
        pdf.text(`Total a pagar: ${areaConDesperdicio.toFixed(2)} m² × $${precioPorMetroCuadrado} = $${total}`, 20, y + 68);
      } else if (producto?.tipoVenta === "presentacion") {
        pdf.text(`Área a cubrir: ${areaIngresada.toFixed(2)} m²`, 20, y + 8);
        pdf.text(`Cobertura por unidad: ${coberturaPorUnidad.toFixed(2)} m²`, 20, y + 18);
        pdf.text(`Unidades necesarias: ${cantidadNecesaria}`, 20, y + 28);
        pdf.text(`Área total cubierta: ${areaCubierta.toFixed(2)} m²`, 20, y + 38);
      } else if (producto?.tipoVenta === "paquete") {
        pdf.text(`Área a cubrir: ${areaIngresada.toFixed(2)} m²`, 20, y + 8);
        pdf.text(`Piezas por paquete: ${producto.piezasCaja || 1}`, 20, y + 18);
        pdf.text(`Cobertura por paquete: ${coberturaPorUnidad.toFixed(2)} m²`, 20, y + 28);
        pdf.text(`Paquetes necesarios: ${cantidadNecesaria}`, 20, y + 38);
      } else if (producto?.tipoVenta === "caja") {
        pdf.text(`Área a cubrir: ${areaIngresada.toFixed(2)} m²`, 20, y + 8);
        pdf.text(`Piezas por caja: ${producto.piezasCaja || 1}`, 20, y + 18);
        pdf.text(`Cobertura por caja: ${coberturaPorUnidad.toFixed(2)} m²`, 20, y + 28);
        pdf.text(`Cajas necesarias: ${cantidadNecesaria}`, 20, y + 38);
      } else {
        pdf.text(
          `Modo de cotización: ${modoCotizacion === "todas" ? "Todas las áreas" : "Área seleccionada"}`,
          20,
          y + 8
        );
        pdf.text(`Área total: ${areaIngresada.toFixed(2)} m²`, 20, y + 18);
        pdf.text(`Desperdicio: ${desperdicio}%`, 20, y + 28);
        pdf.text(`Área final: ${areaConDesperdicio.toFixed(2)} m²`, 20, y + 38);
      }

      y += 60;
      pdf.setFontSize(14);
      pdf.setTextColor(30);
      pdf.text("Detalle de Áreas Calculadas", 15, y);
      y += 10;
      
      const areasValidas = getAreasValidas();
      areasValidas.forEach((area, idx) => {
        const areaValor = calcularAreaForma(area.tipo, area.datos);
        pdf.setFontSize(11);
        pdf.text(`${area.nombre} (${getNombreForma(area.tipo)})`, 20, y);
        y += 5;
        pdf.text(`  Cálculo: ${getDescripcionArea(area.tipo, area.datos)}`, 25, y);
        y += 5;
        pdf.text(`  Área: ${areaValor.toFixed(2)} m²`, 25, y);
        y += 8;
      });

      let notaProducto = "";
      if (producto.tipoVenta === "metro_lineal") {
        notaProducto =
          `Este producto se vende por metro lineal. El rollo mide ${anchoRollo.toFixed(2)} m de ancho y tiene ${producto.metrosPorRollo || 'N/A'} metros lineales. ` +
          `Para cubrir ${areaIngresada.toFixed(2)} m² necesitas aproximadamente ${metrosLineales.toFixed(2)} metros lineales. ` +
          `Precio por metro lineal: $${producto.precio}. Total: $${total}`;
      } else if (producto.tipoVenta === "metro_cuadrado") {
        notaProducto =
          `Este producto se vende por metro cuadrado. El rollo mide ${anchoRollo.toFixed(2)} m de ancho. ` +
          `Para cubrir ${areaIngresada.toFixed(2)} m² necesitas cortar ${metrosLineales.toFixed(2)} metros lineales del rollo. ` +
          `Precio por metro cuadrado: $${precioPorMetroCuadrado}. Total: $${total}`;
      } else if (producto.tipoVenta === "paquete") {
        const piezas = Number(producto.piezasCaja) || 1;
        notaProducto =
          `Este producto se vende por paquete. ` +
          `Cada paquete contiene ${piezas} piezas y cubre ${coberturaPorUnidad.toFixed(2)} m². ` +
          `Para cubrir ${areaConDesperdicio.toFixed(2)} m² necesitas aproximadamente ${cantidadNecesaria} paquetes.`;
      } else if (producto.tipoVenta === "caja") {
        const piezas = Number(producto.piezasCaja) || 1;
        notaProducto =
          `Este producto se vende por caja. ` +
          `Cada caja contiene ${piezas} piezas y cubre ${coberturaPorUnidad.toFixed(2)} m². ` +
          `Para cubrir ${areaConDesperdicio.toFixed(2)} m² necesitas aproximadamente ${cantidadNecesaria} cajas.`;
      } else if (producto.tipoVenta === "presentacion") {
        notaProducto =
          `Este producto se vende por presentación (${producto.presentacion || "unidad"}). ` +
          `Cada unidad cubre ${coberturaPorUnidad.toFixed(2)} m². ` +
          `Para cubrir ${areaIngresada.toFixed(2)} m² necesitas aproximadamente ${cantidadNecesaria} unidades. ` +
          `Esto cubrirá ${areaCubierta.toFixed(2)} m².`;
      } else if (producto.tipoVenta === "pieza") {
        notaProducto =
          `Cada pieza cubre ${coberturaPorUnidad.toFixed(2)} m². ` +
          `Para cubrir ${areaConDesperdicio.toFixed(2)} m² necesitas aproximadamente ${cantidadNecesaria} piezas.`;
      }

      const lineasNota = pdf.splitTextToSize(notaProducto, pageWidth - 45);
      const altoNota = lineasNota.length * 5 + 12;
      if (y + altoNota > pageHeight - 50) {
        pdf.addPage();
        ponerFondo(pdf, membrete2);
        y = 50;
      }
      pdf.setFillColor(255, 248, 200);
      pdf.roundedRect(15, y, pageWidth - 30, altoNota, 3, 3, "F");
      pdf.setFontSize(10);
      pdf.setTextColor(90);
      pdf.text(lineasNota, 20, y + 8);
      y += altoNota + 15;

      if (y > pageHeight - 90) {
        pdf.addPage();
        y = 20;
        if (membrete2) ponerFondo(pdf, membrete2);
      }
      pdf.setFontSize(14);
      pdf.setTextColor(30);
      pdf.text("Condiciones Comerciales", 15, y);
      y += 10;
      const condiciones = [
        "• Precios sujetos a cambios sin previo aviso.",
        "• Vigencia de la cotización: 15 días.",
        "• Material sujeto a disponibilidad.",
        "• No incluye instalación ni envío salvo indicación expresa.",
      ];
      pdf.setFontSize(10);
      pdf.setTextColor(90);
      condiciones.forEach((item) => {
        pdf.text(item, 20, y);
        y += 7;
      });
      y += 10;

      if (y > pageHeight - 80) {
        pdf.addPage();
        ponerFondo(pdf, membrete2);
        y = 50;
      }
      pdf.setFillColor(22, 163, 74);
      pdf.roundedRect(15, y, pageWidth - 30, 18, 3, 3, "F");
      pdf.setTextColor(255);
      pdf.setFontSize(18);
      pdf.text(`TOTAL ESTIMADO: $${total}`, 20, y + 12);
      y += 30;
      pdf.setFontSize(16);
      pdf.setTextColor(0);
      pdf.text("Datos del Cliente", 15, y);
      y += 12;
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(15, y, pageWidth - 30, 28, 3, 3, "F");
      pdf.setFontSize(11);
      pdf.setTextColor(0);
      pdf.text(`Nombre: ${cliente.nombre || "-"}`, 20, y + 8);
      pdf.text(`Correo: ${cliente.correo || "-"}`, 20, y + 16);
      pdf.text(`Celular: ${cliente.celular || "-"}`, 20, y + 24);
      y += 40;

      const pdfBase64 = pdf.output("datauristring");
      await api.post("/enviar-cotizacion", {
        nombre: cliente.nombre,
        correo: cliente.correo,
        celular: cliente.celular,
        producto: producto.nombre,
        total,
        pdf: pdfBase64,
      });
      setMensajeEnviado("✅ La cotización fue enviada a tu correo");
      mostrarNotificacionCustom("📧 Cotización enviada exitosamente");
    } catch (error) {
      console.error(error);
      alert("❌ Error generando cotización");
    } finally {
      setEnviando(false);
    }
  };

  if (!producto) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>Cargando producto...</p>
    </div>
  );

  const getStockColor = (stock) => {
    if (stock <= 0) return "#dc2626";
    if (stock <= 3) return "#f59e0b";
    return "#16a34a";
  };

  const getStockText = (stock) => {
    if (stock <= 0) return "Agotado";
    if (stock <= 3) return "¡Últimas unidades!";
    if (stock <= 10) return "Poco stock";
    return "Disponible";
  };

  const plural = (stock, tipo) => {
    if (stock === 1) return tipo;
    if (tipo === "unidad") return "unidades";
    if (tipo === "pieza") return "piezas";
    if (tipo === "tramo") return "tramos";
    if (tipo === "caja") return "cajas";
    if (tipo === "paquete") return "paquetes";
    return tipo + "s";
  };

  const relacionadosAgrupados = agruparPorTipo(relacionados);
  const sugeridosAgrupados = agruparPorTipo(sugeridos);

  const tieneCobertura = producto && (Number(producto.mostrarCobertura) === 1) && producto.cobertura && producto.cobertura.trim() !== '';

  const debeMostrarCotizador = () => {
    if (producto?.tipoVenta === "paquete") return false;
    if (producto?.tipoVenta === "metro_cuadrado") return true;
    if (producto?.tipoVenta === "metro_lineal") return true;
    if (producto?.tipoVenta === "presentacion") return tieneCobertura;
    if (producto?.tipoVenta === "caja") return tieneCobertura;
    if (producto?.tipoVenta === "pieza") return tieneCobertura;
    return tieneCobertura;
  };

  const mostrarGuiaMedicion = () => {
    return producto?.tipoVenta === "metro_lineal" || producto?.tipoVenta === "metro_cuadrado";
  };

  const mostrarDesperdicio = () => {
    return producto?.tipoVenta === "metro_lineal" || producto?.tipoVenta === "metro_cuadrado";
  };

  const renderizarCamposForma = (area, index) => {
    const tipo = area.tipo;
    const datos = area.datos;

    switch(tipo) {
      case 'rectangulo':
        return (
          <>
            <input
              type="number"
              placeholder="Largo (m)"
              value={datos.largo}
              onChange={(e) => actualizarArea(index, "largo", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <input
              type="number"
              placeholder="Ancho (m)"
              value={datos.ancho}
              onChange={(e) => actualizarArea(index, "ancho", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
          </>
        );
      case 'cuadrado':
        return (
          <input
            type="number"
            placeholder="Lado (m)"
            value={datos.lado}
            onChange={(e) => actualizarArea(index, "lado", e.target.value)}
            className="input-field"
            step="0.01"
            min="0"
          />
        );
      case 'circulo':
        return (
          <input
            type="number"
            placeholder="Diámetro (m)"
            value={datos.diametro}
            onChange={(e) => actualizarArea(index, "diametro", e.target.value)}
            className="input-field"
            step="0.01"
            min="0"
          />
        );
      case 'triangulo':
        return (
          <>
            <input
              type="number"
              placeholder="Base (m)"
              value={datos.base}
              onChange={(e) => actualizarArea(index, "base", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <input
              type="number"
              placeholder="Altura (m)"
              value={datos.altura}
              onChange={(e) => actualizarArea(index, "altura", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
          </>
        );
      case 'trapecio':
        return (
          <>
            <input
              type="number"
              placeholder="Base Mayor (m)"
              value={datos.baseMayor}
              onChange={(e) => actualizarArea(index, "baseMayor", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <input
              type="number"
              placeholder="Base Menor (m)"
              value={datos.baseMenor}
              onChange={(e) => actualizarArea(index, "baseMenor", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <input
              type="number"
              placeholder="Altura (m)"
              value={datos.alturaTrapecio}
              onChange={(e) => actualizarArea(index, "alturaTrapecio", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
          </>
        );
      case 'rombo':
        return (
          <>
            <input
              type="number"
              placeholder="Diagonal Mayor (m)"
              value={datos.diagonalMayor}
              onChange={(e) => actualizarArea(index, "diagonalMayor", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <input
              type="number"
              placeholder="Diagonal Menor (m)"
              value={datos.diagonalMenor}
              onChange={(e) => actualizarArea(index, "diagonalMenor", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
          </>
        );
      case 'pentagono':
      case 'hexagono':
      case 'octagono':
        return (
          <>
            <input
              type="number"
              placeholder="Perímetro (m)"
              value={datos.perimetro}
              onChange={(e) => actualizarArea(index, "perimetro", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <input
              type="number"
              placeholder="Apotema (m)"
              value={datos.apotema}
              onChange={(e) => actualizarArea(index, "apotema", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
          </>
        );
      case 'elipse':
        return (
          <>
            <input
              type="number"
              placeholder="Radio mayor (m)"
              value={datos.radio}
              onChange={(e) => actualizarArea(index, "radio", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <input
              type="number"
              placeholder="Radio menor (m)"
              value={datos.radioMenor}
              onChange={(e) => actualizarArea(index, "radioMenor", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
          </>
        );
      case 'escalera':
        return (
          <>
            <input
              type="number"
              placeholder="Número de escalones"
              value={datos.escalones}
              onChange={(e) => actualizarArea(index, "escalones", e.target.value)}
              className="input-field"
              step="1"
              min="1"
            />
            <input
              type="number"
              placeholder="Huella (m)"
              value={datos.huella}
              onChange={(e) => actualizarArea(index, "huella", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <input
              type="number"
              placeholder="Contrahuella (m)"
              value={datos.contrahuella}
              onChange={(e) => actualizarArea(index, "contrahuella", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <input
              type="number"
              placeholder="Ancho del escalón (m)"
              value={datos.anchoEscalon}
              onChange={(e) => actualizarArea(index, "anchoEscalon", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <div className="campo-ayuda">
              💡 Área = escalones × ancho × (huella + contrahuella)
            </div>
          </>
        );
      case 'barra':
        return (
          <>
            <input
              type="number"
              placeholder="Largo de la barra (m)"
              value={datos.largoBarra}
              onChange={(e) => actualizarArea(index, "largoBarra", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <input
              type="number"
              placeholder="Ancho de la barra (m)"
              value={datos.anchoBarra}
              onChange={(e) => actualizarArea(index, "anchoBarra", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <input
              type="number"
              placeholder="Cantidad de barras"
              value={datos.cantidadBarras}
              onChange={(e) => actualizarArea(index, "cantidadBarras", e.target.value)}
              className="input-field"
              step="1"
              min="1"
            />
            <div className="campo-ayuda">
              💡 Área = largo × ancho × cantidad de barras
            </div>
          </>
        );
      case 'poligono_regular':
        return (
          <>
            <input
              type="number"
              placeholder="Número de lados"
              value={datos.numLados}
              onChange={(e) => actualizarArea(index, "numLados", e.target.value)}
              className="input-field"
              step="1"
              min="3"
            />
            <input
              type="number"
              placeholder="Longitud del lado (m)"
              value={datos.longitudLado}
              onChange={(e) => actualizarArea(index, "longitudLado", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <input
              type="number"
              placeholder="Apotema (m)"
              value={datos.apotema}
              onChange={(e) => actualizarArea(index, "apotema", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <div className="campo-ayuda">
              💡 Área = (n × lado × apotema) / 2
            </div>
          </>
        );
      case 'sector_circular':
        return (
          <>
            <input
              type="number"
              placeholder="Radio (m)"
              value={datos.radio}
              onChange={(e) => actualizarArea(index, "radio", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <input
              type="number"
              placeholder="Ángulo (°)"
              value={datos.angulo}
              onChange={(e) => actualizarArea(index, "angulo", e.target.value)}
              className="input-field"
              step="0.1"
              min="0"
              max="360"
            />
            <div className="campo-ayuda">
              💡 Área = (π × r² × ángulo) / 360
            </div>
          </>
        );
      case 'corona_circular':
        return (
          <>
            <input
              type="number"
              placeholder="Radio exterior (m)"
              value={datos.radioExterior}
              onChange={(e) => actualizarArea(index, "radioExterior", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <input
              type="number"
              placeholder="Radio interior (m)"
              value={datos.radioInterior}
              onChange={(e) => actualizarArea(index, "radioInterior", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <div className="campo-ayuda">
              💡 Área = π × (R² - r²)
            </div>
          </>
        );
      case 'figura_personalizada':
        return (
          <>
            <textarea
              placeholder="Descripción de la figura"
              value={datos.descripcion}
              onChange={(e) => actualizarArea(index, "descripcion", e.target.value)}
              className="input-field"
              rows="2"
            />
            <input
              type="number"
              placeholder="Área calculada (m²)"
              value={datos.areaPersonalizada}
              onChange={(e) => actualizarArea(index, "areaPersonalizada", e.target.value)}
              className="input-field"
              step="0.01"
              min="0"
            />
            <div className="campo-ayuda">
              💡 Ingresa directamente el área que ya calculaste
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="producto-detalle-page">
      <Navbar
        productos={productos}
        categorias={categorias}
        subcategorias={subcategorias}
        tipos={tipos}
        favoritos={favoritos}
        toggleFavorito={toggleFavorito}
        esFavorito={esFavorito}
      />

      {mostrarNotificacion && (
        <div className="notificacion-flotante">
          <span>{notificacionMensaje}</span>
        </div>
      )}

      <div className="producto-detalle-wrapper">
        
        <div className="producto-detalle-left-col">
          
          <div className="producto-detalle-gallery">
            <div className="badges-container">
              {(producto.rebaja === 1 || producto.rebaja === true) && (
                <span className="badge rebaja">🔥 REBAJA</span>
              )}
              {(producto.destacado === 1 || producto.destacado === true) && (
                <span className="badge destacado">⭐ DESTACADO</span>
              )}
              {producto.stock <= 3 && producto.stock > 0 && (
                <span className="badge ultimas">⚡ ÚLTIMAS UNIDADES</span>
              )}
            </div>

            <button
              className="fav-btn"
              onClick={() => toggleFavorito(producto)}
              aria-label="Favorito"
            >
              {esFavorito(producto.id) ? '❤️' : '🤍'}
            </button>

            <div
              className="main-image-container"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setZoom(true)}
              onMouseLeave={() => setZoom(false)}
            >
              <img
                ref={imagenPDFRef}
                src={getImagenActual()}
                alt={getNombreActual()}
                className="main-image"
                style={{
                  transform: zoom ? "scale(2)" : "scale(1)",
                  transformOrigin: `${pos.x}% ${pos.y}%`,
                  transition: "transform 0.1s",
                }}
                loading="lazy"
              />
              {zoom && <div className="zoom-indicator">🔍 Zoom</div>}
            </div>

            <div className="thumbs-container">
              {(modeloSeleccionado 
                ? (modeloSeleccionado.imagenes ? modeloSeleccionado.imagenes.split(",") : [modeloSeleccionado.imagen])
                : imagenes
              ).map((img, i) => (
                <img
                  key={i}
                  src={getImageUrl(img)}
                  alt={`miniatura-${i}`}
                  className={`thumb ${i === indice ? 'active' : ''}`}
                  onClick={() => setIndice(i)}
                />
              ))}
            </div>
          </div>

          {debeMostrarCotizador() && (
            <div className="cotizador-wrapper">
              <div className="cotizador-box" ref={cotizadorRef}>
                <h3 className="cotizador-title">🧮 Calcula cuánto necesitas</h3>
                
                <div style={{ 
                  background: '#eff6ff', 
                  padding: '12px 16px', 
                  borderRadius: '10px',
                  marginBottom: '16px',
                  borderLeft: '4px solid #3b82f6',
                  fontSize: '14px',
                  color: '#1e3a8a'
                }}>
                  <p style={{ margin: 0 }}>
                    💡 Puedes calcular varias áreas diferentes. Cada área puede ser una forma geométrica distinta.
                    {producto.tipoVenta === "metro_lineal" ? (
                      <> Se sumarán todas para obtener los metros lineales totales.</>
                    ) : producto.tipoVenta === "metro_cuadrado" ? (
                      <> Se sumarán todas para obtener los metros cuadrados totales. Luego se calculan los metros lineales a cortar según el ancho del rollo.</>
                    ) : (
                      <> Se sumarán todas para obtener el total de unidades necesarias.</>
                    )}
                  </p>
                </div>

                <div className="areas-container">
                  {areas.map((area, index) => {
                    const areaValor = calcularAreaForma(area.tipo, area.datos);
                    const validacion = validarMedidas(area.tipo, area.datos);
                    
                    return (
                      <div key={area.id} className="area-card">
                        <div className="area-header">
                          <div className="area-nombre-input">
                            <input
                              type="text"
                              value={area.nombre}
                              onChange={(e) => actualizarArea(index, "nombre", e.target.value)}
                              className="input-field"
                              placeholder="Nombre del área"
                              style={{ flex: 1, minWidth: '100px' }}
                            />
                            <select
                              value={area.tipo}
                              onChange={(e) => actualizarArea(index, "tipo", e.target.value)}
                              className="input-field"
                              style={{ width: 'auto', minWidth: '140px' }}
                            >
                              {tiposDeFormas.map((forma) => (
                                <option key={forma.id} value={forma.id}>
                                  {forma.icono} {forma.nombre}
                                </option>
                              ))}
                            </select>
                            <button className="btn-duplicar" onClick={() => duplicarArea(index)} title="Duplicar área">
                              📋
                            </button>
                            {areas.length > 1 && (
                              <button className="btn-eliminar" onClick={() => eliminarArea(index)} title="Eliminar área">
                                🗑
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="area-campos">
                          {renderizarCamposForma(area, index)}
                        </div>

                        {areaValor > 0 && (
                          <div className="area-resultado">
                            <span className="area-resultado-label">📐 Área calculada:</span>
                            <span className="area-resultado-valor">{areaValor.toFixed(2)} m²</span>
                            <span className="area-resultado-detalle">{getDescripcionArea(area.tipo, area.datos)}</span>
                            {validacion.mensaje && (
                              <span className={`area-validacion ${validacion.tipo}`}>
                                {validacion.mensaje}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  <div className="botones-areas">
                    {areas.length < 10 && (
                      <button className="btn-agregar" onClick={agregarArea}>
                        ➕ Agregar área
                      </button>
                    )}
                    <button className="btn-limpiar" onClick={limpiarAreas}>
                      🧹 Reiniciar
                    </button>
                  </div>
                </div>

                {getAreasValidas().length > 1 && (
                  <>
                    <div className="resumen-areas">
                      <p className="resumen-titulo">📊 Resumen de todas las áreas</p>
                      {getAreasValidas().map((area, idx) => {
                        const areaValor = calcularAreaForma(area.tipo, area.datos);
                        return (
                          <p key={idx} className="resumen-item">
                            {area.nombre}: {areaValor.toFixed(2)} m² 
                            ({getNombreForma(area.tipo)}: {getDescripcionArea(area.tipo, area.datos)})
                          </p>
                        );
                      })}
                      <p className="total-areas">
                        <strong>Total área a cubrir: {areaIngresada.toFixed(2)} m²</strong>
                      </p>
                    </div>

                    <div className="resumen-areas-detallado">
                      <p className="resumen-titulo">📊 Detalle por área</p>
                      <table className="tabla-areas">
                        <thead>
                          <tr>
                            <th>Nombre</th>
                            <th>Forma</th>
                            <th>Medidas</th>
                            <th>Área (m²)</th>
                            <th>% del total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {getAreasValidas().map((area, idx) => {
                            const areaValor = calcularAreaForma(area.tipo, area.datos);
                            const porcentaje = areaIngresada > 0 ? (areaValor / areaIngresada * 100) : 0;
                            return (
                              <tr key={idx}>
                                <td>{area.nombre}</td>
                                <td>{getNombreForma(area.tipo)}</td>
                                <td>{getDescripcionArea(area.tipo, area.datos)}</td>
                                <td>{areaValor.toFixed(2)}</td>
                                <td>{porcentaje.toFixed(1)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}

                {mostrarDesperdicio() && (
                  <div className="desperdicio-box">
                    <span className="desperdicio-label">Desperdicio:</span>
                    {[0, 10, 15, 20].map((p) => (
                      <button key={p} className={`des-btn ${desperdicio === p ? "active" : ""}`} onClick={() => setDesperdicio(p)}>
                        {p}%
                      </button>
                    ))}
                  </div>
                )}

                {areaIngresada > 0 && (
                  <div className="resultado-cotizacion">
                    <div className="resultado-grid">
                      <div className="resultado-item">
                        <span className="resultado-label">📐 Área a cubrir</span>
                        <span className="resultado-valor">{areaIngresada.toFixed(2)} m²</span>
                      </div>
                      <div className="resultado-item">
                        <span className="resultado-label">📈 Desperdicio</span>
                        <span className="resultado-valor">{desperdicio}%</span>
                      </div>
                      <div className="resultado-item">
                        <span className="resultado-label">📐 Área con desperdicio</span>
                        <span className="resultado-valor">{areaConDesperdicio.toFixed(2)} m²</span>
                      </div>
                      <div className="resultado-item destacado">
                        <span className="resultado-label">
                          {producto.tipoVenta === "metro_lineal" ? "📏 Metros lineales a cortar" :
                           producto.tipoVenta === "metro_cuadrado" ? "📏 Metros lineales a cortar" :
                           "📦 Cantidad necesaria"}
                        </span>
                        <span className="resultado-valor principal">
                          {producto.tipoVenta === "metro_lineal" ? `${metrosLineales.toFixed(2)} ml` :
                           producto.tipoVenta === "metro_cuadrado" ? `${metrosLineales.toFixed(2)} ml` :
                           `${cantidadNecesaria}`}
                        </span>
                      </div>
                      {producto.tipoVenta === "metro_cuadrado" && (
                        <div className="resultado-item">
                          <span className="resultado-label">📐 Equivale a</span>
                          <span className="resultado-valor">{areaConDesperdicio.toFixed(2)} m²</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="total-box">
                      <span className="total-label">Total estimado</span>
                      <span className="total-valor">${Number(total).toLocaleString()}</span>
                    </div>

                    <div className="detalle-calculo">
                      <p className="detalle-titulo">📌 Detalle del cálculo</p>
                      <p>Total de áreas: <strong>{getAreasValidas().length} área(s)</strong></p>
                      <p>Área total: <strong>{areaIngresada.toFixed(2)} m²</strong></p>
                      {producto.tipoVenta === "metro_lineal" && (
                        <>
                          <p>Metros lineales necesarios: <strong>{metrosLineales.toFixed(2)} ml</strong></p>
                          <p>Cálculo: {areaConDesperdicio.toFixed(2)} m² ÷ {anchoRollo.toFixed(2)} m = {metrosLineales.toFixed(2)} ml</p>
                        </>
                      )}
                      {producto.tipoVenta === "metro_cuadrado" && (
                        <>
                          <p>Metros lineales a cortar: <strong>{metrosLineales.toFixed(2)} ml</strong></p>
                          <p>Cálculo: {areaConDesperdicio.toFixed(2)} m² ÷ {anchoRollo.toFixed(2)} m = {metrosLineales.toFixed(2)} ml</p>
                          <p>El rollo mide <strong>{anchoRollo.toFixed(2)} m</strong> de ancho</p>
                          <p>Se paga por m²: <strong>{areaConDesperdicio.toFixed(2)} m²</strong></p>
                        </>
                      )}
                      <p style={{ color: '#16a34a', fontSize: '1.1rem', marginTop: '6px' }}>
                        💰 {areaConDesperdicio.toFixed(2)} m² × ${Number(precioFinal).toLocaleString()} = <strong>${Number(total).toLocaleString()}</strong>
                      </p>
                    </div>

                    <div className="nota-tipo-venta">
                      ℹ️ Este producto se vende por <strong>{producto.tipoVenta === "metro_lineal" ? "metro lineal" : producto.tipoVenta === "metro_cuadrado" ? "metro cuadrado" : producto.tipoVenta}</strong>
                      {producto.tipoVenta === "metro_cuadrado" && (
                        <> • El rollo mide <strong>{anchoRollo.toFixed(2)} m</strong> de ancho</>
                      )}
                    </div>
                    
                    <div className="necesitas-box">
                      <span className="necesitas-label">Necesitas</span>
                      <span className="necesitas-valor">
                        {producto.tipoVenta === "metro_lineal" ? (
                          <>{metrosLineales.toFixed(2)} metros lineales</>
                        ) : producto.tipoVenta === "metro_cuadrado" ? (
                          <>{metrosLineales.toFixed(2)} metros lineales (equivale a {areaConDesperdicio.toFixed(2)} m²)</>
                        ) : producto.tipoVenta === "caja" ? (
                          <>{cantidadNecesaria} cajas</>
                        ) : producto.tipoVenta === "paquete" ? (
                          <>{cantidadNecesaria} paquetes</>
                        ) : producto.tipoVenta === "pieza" ? (
                          <>{cantidadNecesaria} piezas</>
                        ) : producto.tipoVenta === "presentacion" ? (
                          <>{cantidadNecesaria} unidades</>
                        ) : (
                          <>{cantidadNecesaria}</>
                        )}
                      </span>
                    </div>

                    <div className="form-cliente">
                      <h3>Solicitar cotización</h3>
                      <input
                        type="text"
                        placeholder="Nombre"
                        value={cliente.nombre}
                        onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                        className="input-field"
                      />
                      <input
                        type="email"
                        placeholder="Correo"
                        value={cliente.correo}
                        onChange={(e) => setCliente({ ...cliente, correo: e.target.value })}
                        className="input-field"
                      />
                      <input
                        type="text"
                        placeholder="Celular"
                        value={cliente.celular}
                        onChange={(e) => setCliente({ ...cliente, celular: e.target.value })}
                        className="input-field"
                      />
                      <button className="btn-enviar" onClick={generarPDF} disabled={enviando}>
                        {enviando ? "Enviando..." : "Solicitar cotización"}
                      </button>
                      {mensajeEnviado && <p className="mensaje-exito">{mensajeEnviado}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="producto-detalle-right-col">
          <div className="breadcrumb">
            <span onClick={() => navigate('/')}>Inicio</span>
            <span>/</span>
            <span onClick={() => navigate('/productos')}>Productos</span>
            <span>/</span>
            <span className="breadcrumb-actual">{producto.nombre}</span>
          </div>

          <h1 className="product-title">{getNombreActual()}</h1>

          {modelosDisponibles.length > 0 && (
            <div className="modelos-carrusel">
              <div className="modelos-carrusel-header">
                <h3 className="modelos-carrusel-title">
                  <span className="title-icon">🔄</span> Modelos disponibles
                  <span className="title-badge">¡Explora!</span>
                </h3>
                <div className="carrusel-controls">
                  <button className="carrusel-btn prev" onClick={() => navegarCarrusel(-1)} aria-label="Anterior">◀</button>
                  <span className="carrusel-indicador">{indiceCarrusel + 1} / {modelosDisponibles.length}</span>
                  <button className="carrusel-btn next" onClick={() => navegarCarrusel(1)} aria-label="Siguiente">▶</button>
                </div>
              </div>
              <div className="modelos-carrusel-container">
                <div className="modelos-carrusel-scroll" ref={carruselScrollRef}>
                  {modelosDisponibles.map((modelo, index) => (
                    <div
                      key={modelo.id}
                      className={`modelo-carrusel-item ${modeloSeleccionado?.id === modelo.id ? 'active' : ''}`}
                      onClick={() => seleccionarModelo(modelo, index)}
                    >
                      {modeloSeleccionado?.id === modelo.id && (
                        <div className="modelo-selected-badge">✓ Seleccionado</div>
                      )}
                      <img
                        src={obtenerImagen(modelo)}
                        alt={modelo.nombre}
                        className="modelo-carrusel-img"
                        loading="lazy"
                      />
                      <div className="modelo-carrusel-info">
                        <p className="modelo-carrusel-nombre">{modelo.nombre}</p>
                        <p className="modelo-carrusel-precio">
                          ${modelo.oferta ? modelo.precioOferta : modelo.precio}
                          {modelo.oferta && <span className="oferta-tag">Oferta</span>}
                        </p>
                        {modelo.stock <= 3 && modelo.stock > 0 && (
                          <span className="stock-badge">🔥 ¡Últimas unidades!</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="carrusel-progress">
                {modelosDisponibles.map((_, index) => (
                  <div
                    key={index}
                    className={`carrusel-dot ${index === indiceCarrusel ? 'active' : ''}`}
                    onClick={() => {
                      setIndiceCarrusel(index);
                      if (carruselScrollRef.current) {
                        const items = carruselScrollRef.current.querySelectorAll('.modelo-carrusel-item');
                        if (items[index]) {
                          const itemWidth = items[index].offsetWidth + 12;
                          carruselScrollRef.current.scrollTo({
                            left: index * itemWidth,
                            behavior: 'smooth'
                          });
                        }
                      }
                    }}
                  />
                ))}
              </div>
              <button 
                className="btn-ver-todos"
                onClick={() => {
                  if (producto.tipo_id) {
                    navigate(`/productos/tipo/${producto.tipo_id}`);
                  } else if (producto.tipo) {
                    navigate(`/productos/tipo-nombre/${encodeURIComponent(producto.tipo)}`);
                  }
                }}
              >
                🔍 Ver todos los modelos disponibles ({modelosDisponibles.length})
              </button>
            </div>
          )}

          <div className="category-box">
            {producto.categoria && <span className="category-tag">📁 {producto.categoria}</span>}
            {producto.subcategoria && <span className="subcategory-tag">📂 {producto.subcategoria}</span>}
            {producto.tipo && <span className="type-tag">🏷️ {producto.tipo}</span>}
          </div>

          <div className="precio-section">
            {producto.oferta === 1 || producto.oferta === true ? (
              <div className="precio-container">
                <span className="precio-anterior">${producto.precio}</span>
                <h2 className="precio-oferta">
                  ${getPrecioActual()} 
                  <span className="precio-unidad">{getUnidadVenta()}</span>
                </h2>
                <span className="descuento-badge">
                  -{Math.round(((producto.precio - producto.precioOferta) / producto.precio) * 100)}%
                </span>
              </div>
            ) : (
              <h2 className="precio-normal">
                ${getPrecioActual()} 
                <span className="precio-unidad">{getUnidadVenta()}</span>
              </h2>
            )}
          </div>

          {producto.sku && <p className="sku-item"><strong>SKU:</strong> {producto.sku}</p>}

          <div className="stock-box-modern" style={{ borderColor: getStockColor(producto.stock) }}>
            <div className="stock-status">
              <span className={`stock-indicator ${producto.stock <= 0 ? 'agotado' : producto.stock <= 3 ? 'poco' : 'disponible'}`}></span>
              <span className="stock-text" style={{ color: getStockColor(producto.stock) }}>
                {getStockText(producto.stock)}
              </span>
            </div>
            {producto.stock > 0 && (
              <span className="stock-cantidad">{producto.stock} {plural(producto.stock, producto.tipoVenta)}</span>
            )}
          </div>

          <div className="data-box-modern">
            <div className="data-item-modern">
              <span className="data-icon">📦</span>
              <div>
                <span className="data-label">Venta por</span>
                <span className="data-value">
                  {producto.tipoVenta === 'metro_lineal' ? 'Metro Lineal' :
                   producto.tipoVenta === 'metro_cuadrado' ? 'Metro Cuadrado' :
                   producto.tipoVenta === 'presentacion' ? 'Presentación' :
                   producto.tipoVenta === 'paquete' ? 'Paquete' :
                   producto.tipoVenta === 'caja' ? 'Caja' :
                   producto.tipoVenta === 'pieza' ? 'Pieza' :
                   producto.tipoVenta || '-'}
                </span>
              </div>
            </div>
            
            {producto.tipoVenta === "metro_lineal" ? (
              <>
                <div className="data-item-modern">
                  <span className="data-icon">📏</span>
                  <div>
                    <span className="data-label">Ancho del producto</span>
                    <span className="data-value">{anchoRollo.toFixed(2)} m</span>
                  </div>
                </div>
                <div className="data-item-modern">
                  <span className="data-icon">📐</span>
                  <div>
                    <span className="data-label">Metros lineales por rollo</span>
                    <span className="data-value">{producto.metrosPorRollo || '-'} ml</span>
                  </div>
                </div>
                <div className="data-item-modern">
                  <span className="data-icon">📊</span>
                  <div>
                    <span className="data-label">Total en m²</span>
                    <span className="data-value">{producto.metrosCuadrados ? `${producto.metrosCuadrados} m²` : '-'}</span>
                  </div>
                </div>
              </>
            ) : producto.tipoVenta === "metro_cuadrado" ? (
              <>
                <div className="data-item-modern">
                  <span className="data-icon">📏</span>
                  <div>
                    <span className="data-label">Ancho del rollo</span>
                    <span className="data-value">{anchoRollo.toFixed(2)} m</span>
                  </div>
                </div>
                <div className="data-item-modern">
                  <span className="data-icon">📐</span>
                  <div>
                    <span className="data-label">Alto</span>
                    <span className="data-value">{producto.alto || '-'} m</span>
                  </div>
                </div>
                <div className="data-item-modern">
                  <span className="data-icon">📊</span>
                  <div>
                    <span className="data-label">Total en m²</span>
                    <span className="data-value">{producto.metrosCuadrados ? `${producto.metrosCuadrados} m²` : '-'}</span>
                  </div>
                </div>
              </>
            ) : producto.tipoVenta === "paquete" ? (
              <>
                <div className="data-item-modern">
                  <span className="data-icon">📦</span>
                  <div>
                    <span className="data-label">Piezas por paquete</span>
                    <span className="data-value">{producto.piezasCaja || '-'}</span>
                  </div>
                </div>
                {tieneCobertura && (
                  <div className="data-item-modern">
                    <span className="data-icon">📐</span>
                    <div>
                      <span className="data-label">Cobertura por paquete</span>
                      <span className="data-value">{coberturaPorUnidad.toFixed(2)} m²</span>
                    </div>
                  </div>
                )}
              </>
            ) : producto.tipoVenta === "presentacion" ? (
              <div className="data-item-modern">
                <span className="data-icon">🧴</span>
                <div>
                  <span className="data-label">Presentación</span>
                  <span className="data-value">{producto.presentacion || '-'}</span>
                </div>
              </div>
            ) : producto.tipoVenta === "caja" ? (
              <>
                <div className="data-item-modern">
                  <span className="data-icon">📦</span>
                  <div>
                    <span className="data-label">Piezas por caja</span>
                    <span className="data-value">{producto.piezasCaja || '-'}</span>
                  </div>
                </div>
                {tieneCobertura && (
                  <div className="data-item-modern">
                    <span className="data-icon">📐</span>
                    <div>
                      <span className="data-label">Cobertura por pieza</span>
                      <span className="data-value">{producto.cobertura} {producto.tipoCobertura}</span>
                    </div>
                  </div>
                )}
                {coberturaPorUnidad > 0 && (
                  <div className="data-item-modern">
                    <span className="data-icon">📦</span>
                    <div>
                      <span className="data-label">Cobertura por caja</span>
                      <span className="data-value">{coberturaPorUnidad.toFixed(2)} m²</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="data-item-modern">
                <span className="data-icon">📏</span>
                <div>
                  <span className="data-label">Medidas</span>
                  <span className="data-value">
                    {producto.ancho && producto.alto 
                      ? `${producto.ancho}${producto.unidadAncho || 'cm'} x ${producto.alto}${producto.unidadAlto || 'cm'}`
                      : '-'}
                    {producto.grueso && ` x ${producto.grueso}${producto.unidadGrueso || 'mm'}`}
                  </span>
                </div>
              </div>
            )}
            
            {tieneCobertura && producto.tipoVenta !== "metro_lineal" && producto.tipoVenta !== "metro_cuadrado" && producto.tipoVenta !== "paquete" && producto.tipoVenta !== "caja" && (
              <div className="data-item-modern">
                <span className="data-icon">📐</span>
                <div>
                  <span className="data-label">Cobertura</span>
                  <span className="data-value">{producto.cobertura} {producto.tipoCobertura}</span>
                </div>
              </div>
            )}
            
            {producto.grueso && producto.tipoVenta !== "metro_lineal" && producto.tipoVenta !== "metro_cuadrado" && (
              <div className="data-item-modern">
                <span className="data-icon">📊</span>
                <div>
                  <span className="data-label">Grosor</span>
                  <span className="data-value">{producto.grueso} {producto.unidadGrueso || 'mm'}</span>
                </div>
              </div>
            )}
          </div>

          <div className="box-modern">
            <h3 className="box-title">📝 Descripción</h3>
            <p className="description">{producto.descripcion}</p>
          </div>

          {producto.especificaciones && (
            <div className="box-modern">
              <h3 className="box-title">⚙️ Especificaciones</h3>
              <p className="description" style={{ whiteSpace: "pre-wrap" }}>{producto.especificaciones}</p>
            </div>
          )}

          {producto.informacionAdicional && (
            <div className="box-modern">
              <h3 className="box-title">📋 Información adicional</h3>
              <p className="description" style={{ whiteSpace: "pre-wrap" }}>{producto.informacionAdicional}</p>
            </div>
          )}

          <div className="botones-acciones">
            {producto.fichaTecnica && (
              <button className="btn-ficha-tecnica" onClick={() => setFichaZoom(true)}>
                📄 Ver ficha técnica
              </button>
            )}
            <button className="btn-agregar-pedido" onClick={() => agregarAlPedido(producto)}>
              🛒 Agregar al pedido
            </button>
          </div>
        </div>
      </div>

      {fichaZoom && (
        <div className="modal-overlay" onClick={() => setFichaZoom(false)}>
          <img src={getImageUrl(producto.fichaTecnica)} alt="Ficha técnica ampliada" className="modal-image" />
        </div>
      )}
      {imagenGuiaZoom && (
        <div className="modal-overlay" onClick={() => setImagenGuiaZoom(null)}>
          <img src={imagenGuiaZoom} alt="Imagen ampliada" className="modal-image" />
        </div>
      )}

      <div className="full-width-related-wrapper">
        {sugeridos.length > 0 && (
          <div className="full-width-related-section">
            <div className="sugeridos-banner">
              <span className="sugeridos-label">PRODUCTOS RECOMENDADOS</span>
              <h2 className="sugeridos-title">Para instalar este producto también necesitarás</h2>
              <p className="sugeridos-subtitle">Estos complementos son utilizados frecuentemente junto con <strong>{producto.nombre}</strong></p>
            </div>
            {Object.keys(sugeridosAgrupados).map((tipo) => (
              <div key={tipo} className="tipo-grupo">
                <div className="tipo-grupo-header" style={{ borderLeftColor: getTipoColor(tipo) }}>
                  <span className="tipo-grupo-icon">🏷️</span>
                  <h3 className="tipo-grupo-title">{tipo}</h3>
                  <span className="tipo-grupo-count">{sugeridosAgrupados[tipo].length} productos</span>
                </div>
                <div className="related-grid">
                  {sugeridosAgrupados[tipo].map((p) => (
                    <div key={p.id} className="sugerido-card" onClick={() => { navigate(`/producto/${p.id}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <div className="sugerido-badge">Recomendado</div>
                      <button className="fav-btn-small" onClick={(e) => { e.stopPropagation(); toggleFavorito(p); }} style={{ background: esFavorito(p.id) ? "#dc2626" : "#fff", color: esFavorito(p.id) ? "#fff" : "#111" }}>❤️</button>
                      <img src={obtenerImagen(p)} alt={p.nombre} className="related-image" loading="lazy" />
                      <h4>{p.nombre}</h4>
                      <p className="related-sub">Ideal para instalación</p>
                      {p.oferta === 1 || p.oferta === true ? (
                        <div><span className="precio-ant">${p.precio}</span><p className="precio-of">${p.precioOferta}</p></div>
                      ) : (
                        <p className="related-price">${p.precio}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {relacionados.length > 0 && (
          <div className="full-width-related-section">
            <div className="related-header">
              <h2 className="section-title">🏷️ Productos en <span className="highlight">{producto.subcategoria}</span></h2>
              <span className="related-count">{relacionados.length} productos</span>
            </div>
            {Object.keys(relacionadosAgrupados).map((tipo) => (
              <div key={tipo} className="tipo-grupo">
                <div className="tipo-grupo-header" style={{ borderLeftColor: getTipoColor(tipo) }}>
                  <span className="tipo-grupo-icon">📦</span>
                  <h3 className="tipo-grupo-title">{tipo}</h3>
                  <span className="tipo-grupo-count">{relacionadosAgrupados[tipo].length} productos</span>
                </div>
                <div className="related-grid">
                  {relacionadosAgrupados[tipo].map((p) => (
                    <div key={p.id} className="related-card" onClick={() => { navigate(`/producto/${p.id}`); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                      <button className="fav-btn-small" onClick={(e) => { e.stopPropagation(); toggleFavorito(p); }} style={{ background: esFavorito(p.id) ? "#dc2626" : "#fff", color: esFavorito(p.id) ? "#fff" : "#111" }}>❤️</button>
                      <img src={obtenerImagen(p)} alt={p.nombre} className="related-image" loading="lazy" />
                      <h4>{p.nombre}</h4>
                      {p.oferta === 1 || p.oferta === true ? (
                        <div><span className="precio-ant">${p.precio}</span><p className="precio-of">${p.precioOferta}</p></div>
                      ) : (
                        <p className="related-price">${p.precio}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

// ============================================================
// ESTILOS CSS ADICIONALES
// ============================================================
if (typeof document !== "undefined") {
  const extraStyles = document.createElement("style");
  extraStyles.textContent = `
    .areas-container {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 12px;
    }

    .area-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      transition: all 0.3s ease;
    }
    .area-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }

    .area-header {
      margin-bottom: 10px;
    }

    .area-nombre-input {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .area-nombre-input select {
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid #d1d5db;
      font-size: 13px;
      background: #fff;
      cursor: pointer;
    }

    .area-campos {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .area-campos > input,
    .area-campos > textarea {
      width: 100%;
    }

    .area-resultado {
      margin-top: 10px;
      padding: 8px 14px;
      background: #f0fdf4;
      border: 1px solid #86efac;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .area-resultado-label {
      font-weight: 600;
      color: #166534;
      font-size: 13px;
    }

    .area-resultado-valor {
      font-size: 18px;
      font-weight: 800;
      color: #16a34a;
    }

    .area-resultado-detalle {
      font-size: 12px;
      color: #166534;
      background: #dcfce7;
      padding: 2px 10px;
      border-radius: 999px;
      font-weight: 500;
    }

    .area-validacion {
      font-size: 12px;
      padding: 2px 10px;
      border-radius: 999px;
      font-weight: 500;
    }

    .area-validacion.success {
      background: #dcfce7;
      color: #166534;
    }

    .area-validacion.warning {
      background: #fef3c7;
      color: #92400e;
    }

    .area-validacion.error {
      background: #fee2e2;
      color: #991b1b;
    }

    .area-validacion.info {
      background: #dbeafe;
      color: #1e40af;
    }

    .btn-duplicar {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-duplicar:hover {
      background: #e2e8f0;
      transform: scale(1.05);
    }

    .btn-eliminar {
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 16px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-eliminar:hover {
      background: #fecaca;
      transform: scale(1.05);
    }

    .botones-areas {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 4px;
    }

    .btn-agregar {
      background: #dbeafe;
      border: 1px solid #93c5fd;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      color: #1e40af;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-agregar:hover {
      background: #bfdbfe;
      transform: scale(1.02);
    }

    .btn-limpiar {
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 16px;
      font-size: 14px;
      font-weight: 600;
      color: #64748b;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-limpiar:hover {
      background: #e2e8f0;
    }

    .resumen-areas {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 16px;
    }

    .resumen-titulo {
      font-weight: 700;
      color: #0c4a6e;
      margin: 0 0 6px 0;
      font-size: 14px;
    }

    .resumen-item {
      margin: 3px 0;
      font-size: 13px;
      color: #1e293b;
    }

    .total-areas {
      margin: 6px 0 0 0;
      font-size: 15px;
      color: #0369a1;
      border-top: 1px dashed #bae6fd;
      padding-top: 6px;
    }

    .resumen-areas-detallado {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 16px;
      overflow-x: auto;
    }

    .tabla-areas {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-top: 8px;
    }

    .tabla-areas th {
      background: #f1f5f9;
      padding: 8px 10px;
      text-align: left;
      font-weight: 600;
      color: #1e293b;
      border-bottom: 2px solid #e2e8f0;
    }

    .tabla-areas td {
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
    }

    .tabla-areas tr:hover {
      background: #f8fafc;
    }

    .campo-ayuda {
      grid-column: 1 / -1;
      font-size: 12px;
      color: #64748b;
      background: #f1f5f9;
      padding: 8px 12px;
      border-radius: 8px;
      border-left: 3px solid #3b82f6;
    }

    .notificacion-flotante {
      position: fixed;
      top: 20px;
      right: 20px;
      background: #1e293b;
      color: #fff;
      padding: 14px 24px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      z-index: 9999;
      animation: slideIn 0.3s ease;
      font-size: 14px;
      max-width: 400px;
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @media (max-width: 767px) {
      .area-nombre-input {
        flex-direction: column;
        align-items: stretch;
      }
      
      .area-campos {
        grid-template-columns: 1fr;
      }
      
      .area-resultado {
        flex-direction: column;
        align-items: flex-start;
      }

      .notificacion-flotante {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
        font-size: 13px;
        padding: 12px 16px;
      }

      .tabla-areas {
        font-size: 11px;
      }

      .tabla-areas th,
      .tabla-areas td {
        padding: 6px 8px;
      }
    }
  `;
  document.head.appendChild(extraStyles);
}