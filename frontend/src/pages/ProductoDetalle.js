import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Footer from "./Footer";
import Navbar from "./Navbar";

// 🔥 FUNCIÓN PARA GENERAR URL DE IMAGEN
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
  const [medidas, setMedidas] = useState([{ largo: "", ancho: "" }]);
  const [desperdicio, setDesperdicio] = useState(0);
  const [modoCotizacion, setModoCotizacion] = useState("todas");
  const [areaSeleccionada, setAreaSeleccionada] = useState(0);
  const [mostrarNotificacion, setMostrarNotificacion] = useState(false);
  const [notificacionMensaje, setNotificacionMensaje] = useState("");
  
  const cotizadorRef = useRef();
  const imagenPDFRef = useRef();
  const carruselIntervalRef = useRef(null);
  const carruselScrollRef = useRef(null);

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
        setMedidas([{ largo: "", ancho: "" }]);
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

    // Cargar sugeridos
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

  // ========== FUNCIONES ==========
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

  const reiniciarCarruselAutomatico = () => {
    if (carruselIntervalRef.current) {
      clearInterval(carruselIntervalRef.current);
    }
    if (modelosDisponibles.length > 1) {
      carruselIntervalRef.current = setInterval(() => {
        setIndiceCarrusel((prev) => {
          const nextIndex = (prev + 1) % modelosDisponibles.length;
          if (carruselScrollRef.current) {
            const items = carruselScrollRef.current.querySelectorAll('.modelo-carrusel-item');
            if (items[nextIndex]) {
              const itemWidth = items[nextIndex].offsetWidth + 12;
              carruselScrollRef.current.scrollTo({
                left: nextIndex * itemWidth,
                behavior: 'smooth'
              });
            }
          }
          return nextIndex;
        });
      }, 3500);
    }
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
      'caja': 'por caja',
      'pieza': 'por pieza',
      'tramo': 'por tramo',
      'rollo': 'por rollo',
      'unidad': 'por unidad',
      'metros': 'por metro',
      'otros': producto?.presentacion ? `por ${producto.presentacion}` : 'por unidad'
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

  const agregarMedida = () => {
    if (medidas.length >= 5) return;
    setMedidas([...medidas, { largo: "", ancho: "" }]);
  };

  const eliminarMedida = (index) => {
    if (medidas.length === 1) return;
    setMedidas(medidas.filter((_, i) => i !== index));
  };

  const actualizarMedida = (index, campo, valor) => {
    const nuevas = [...medidas];
    nuevas[index][campo] = valor;
    setMedidas(nuevas);
  };

  const limpiarCampos = () => {
    setMedidas([{ largo: "", ancho: "" }]);
  };

  // ========== CÁLCULOS COTIZADOR ==========
  let areaIngresada = 0;
  if (producto?.tipoVenta === "otros") {
    areaIngresada = Number(medidas[0]?.area) || 0;
  } else {
    areaIngresada = modoCotizacion === "todas"
      ? medidas.reduce((total, item) => {
          const largo = Number(item.largo) || 0;
          const ancho = Number(item.ancho) || 0;
          return total + largo * ancho;
        }, 0)
      : (Number(medidas[areaSeleccionada]?.largo) || 0) * (Number(medidas[areaSeleccionada]?.ancho) || 0);
  }

  const areaConDesperdicio = areaIngresada * (1 + Number(desperdicio) / 100);
  const anchoM = (Number(producto?.ancho) || 0) / 100;
  const altoM = (Number(producto?.alto) || 0) / 100;
  const coberturaPorPieza = anchoM * altoM;
  const piezasCaja = Number(producto?.piezasCaja) || 1;

  let coberturaPorUnidad = 0;
  if (producto?.tipoVenta === "otros") {
    coberturaPorUnidad = Number(producto?.cobertura) || 0;
  } else {
    coberturaPorUnidad = producto?.tipoVenta === "caja" ? coberturaPorPieza * piezasCaja : coberturaPorPieza;
  }

  let metrosLineales = 0;
  let cantidadNecesaria = 0;
  let areaCubierta = 0;

  if (producto?.tipoVenta === "otros") {
    cantidadNecesaria = coberturaPorUnidad > 0 ? Math.ceil(areaIngresada / coberturaPorUnidad) : 0;
    areaCubierta = cantidadNecesaria * coberturaPorUnidad;
  } else if (producto?.tipoVenta === "unidad") {
    cantidadNecesaria = medidas.reduce((total, item) => total + (Number(item.cantidad) || 0), 0);
  } else if (producto?.tipoVenta === "tramo") {
    metrosLineales = medidas.reduce((total, item) => total + (Number(item.perimetro) || 0), 0);
    cantidadNecesaria = metrosLineales;
  } else if (producto?.tipoVenta === "rollo") {
    const anchoMaterial = Math.min(anchoM, altoM);
    metrosLineales = anchoMaterial > 0 ? areaConDesperdicio / anchoMaterial : 0;
    cantidadNecesaria = metrosLineales;
  } else {
    cantidadNecesaria = coberturaPorUnidad > 0 ? Math.ceil(areaConDesperdicio / coberturaPorUnidad) : 0;
  }

  const precioFinal = Number(producto?.oferta ? producto?.precioOferta : producto?.precio) || 0;
  let total = 0;
  if (producto?.tipoVenta === "rollo") {
    total = areaConDesperdicio * precioFinal;
  } else if (producto?.tipoVenta === "tramo" || producto?.tipoVenta === "unidad" || producto?.tipoVenta === "otros") {
    total = cantidadNecesaria * precioFinal;
  } else {
    total = cantidadNecesaria * precioFinal;
  }
  total = total.toFixed(2);

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

  const obtenerDetalleMedidas = () => {
    return medidas.map((item, index) => {
      if (producto?.tipoVenta === "unidad") {
        return { numero: index + 1, cantidad: Number(item.cantidad) || 0 };
      }
      if (producto?.tipoVenta === "tramo") {
        return { numero: index + 1, perimetro: Number(item.perimetro) || 0 };
      }
      if (producto?.tipoVenta === "otros") {
        return { numero: 1, area: Number(item.area) || 0 };
      }
      const largo = Number(item.largo) || 0;
      const ancho = Number(item.ancho) || 0;
      return { numero: index + 1, largo, ancho, area: largo * ancho };
    });
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

      if (producto?.tipoVenta === "otros") {
        pdf.text(`Área a cubrir: ${areaIngresada.toFixed(2)} m²`, 20, y + 8);
        pdf.text(`Cobertura por unidad: ${coberturaPorUnidad.toFixed(2)} m²`, 20, y + 18);
        pdf.text(`Unidades necesarias: ${cantidadNecesaria}`, 20, y + 28);
        pdf.text(`Área total cubierta: ${areaCubierta.toFixed(2)} m²`, 20, y + 38);
      } else if (producto?.tipoVenta === "unidad") {
        pdf.text(`Cantidad total de unidades: ${cantidadNecesaria}`, 20, y + 8);
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
      pdf.text("Detalle de Medidas", 15, y);
      y += 10;
      const detalleMedidas = obtenerDetalleMedidas();
      detalleMedidas.forEach((item) => {
        pdf.setFontSize(11);
        if (producto.tipoVenta === "unidad") {
          pdf.text(`Cantidad ${item.numero}: ${item.cantidad}`, 20, y);
        } else if (producto.tipoVenta === "tramo") {
          pdf.text(`Perímetro ${item.numero}: ${item.perimetro} m`, 20, y);
        } else if (producto.tipoVenta === "otros") {
          pdf.text(`Área a cubrir: ${item.area.toFixed(2)} m²`, 20, y);
        } else {
          pdf.text(
            `Área ${item.numero}: ${item.largo} x ${item.ancho} = ${item.area.toFixed(2)} m²`,
            20,
            y
          );
        }
        y += 8;
      });

      let notaProducto = "";
      if (producto.tipoVenta === "rollo") {
        notaProducto =
          `Este producto se vende por rollo. ` +
          `Cada rollo mide ${(Number(producto.ancho) / 100).toFixed(2)} m x ${(Number(producto.alto) / 100).toFixed(2)} m y cubre ${coberturaPorUnidad.toFixed(2)} m². ` +
          `Para cubrir ${areaConDesperdicio.toFixed(2)} m² necesitas aproximadamente ${metrosLineales.toFixed(2)} metros lineales.`;
      } else if (producto.tipoVenta === "caja") {
        notaProducto =
          `Este producto se vende por caja. ` +
          `Cada caja contiene ${producto.piezasCaja} piezas y cubre ${coberturaPorUnidad.toFixed(2)} m². ` +
          `Para cubrir ${areaConDesperdicio.toFixed(2)} m² necesitas aproximadamente ${cantidadNecesaria} cajas.`;
      } else if (producto.tipoVenta === "pieza") {
        notaProducto =
          `Cada pieza cubre ${coberturaPorUnidad.toFixed(2)} m². ` +
          `Para cubrir ${areaConDesperdicio.toFixed(2)} m² necesitas aproximadamente ${cantidadNecesaria} piezas.`;
      } else if (producto.tipoVenta === "unidad") {
        notaProducto = `Se requieren aproximadamente ${cantidadNecesaria} unidades para este proyecto.`;
      } else if (producto.tipoVenta === "tramo") {
        notaProducto = `Para cubrir ${cantidadNecesaria.toFixed(2)} metros necesitas aproximadamente ${cantidadNecesaria.toFixed(2)} metros lineales.`;
      } else if (producto.tipoVenta === "otros") {
        notaProducto =
          `Este producto se vende por presentación (${producto.presentacion || "unidad"}). ` +
          `Cada unidad cubre ${coberturaPorUnidad.toFixed(2)} m². ` +
          `Para cubrir ${areaIngresada.toFixed(2)} m² necesitas aproximadamente ${cantidadNecesaria} unidades. ` +
          `Esto cubrirá ${areaCubierta.toFixed(2)} m².`;
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
    return tipo + "s";
  };

  const relacionadosAgrupados = agruparPorTipo(relacionados);
  const sugeridosAgrupados = agruparPorTipo(sugeridos);

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

      {/* NOTIFICACIÓN */}
      {mostrarNotificacion && (
        <div className="notificacion-flotante">
          <span>{notificacionMensaje}</span>
        </div>
      )}

      {/* ===== CONTENEDOR PRINCIPAL CON DOS COLUMNAS ===== */}
      <div className="producto-detalle-wrapper">
        
        {/* ===== COLUMNA IZQUIERDA: GALERÍA + COTIZADOR ===== */}
        <div className="producto-detalle-left-col">
          
          {/* GALERÍA */}
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

          {/* ===== COTIZADOR - SIEMPRE VISIBLE (en desktop abajo de la galería) ===== */}
          <div className="cotizador-wrapper">
            <div className="cotizador-box" ref={cotizadorRef}>
              <h3 className="cotizador-title">🧮 Calcula cuánto necesitas</h3>

              {producto.tipoVenta !== "unidad" && producto.tipoVenta !== "tramo" && producto.tipoVenta !== "otros" && (
                <div className="guia-medicion">
                  <h4 className="guia-titulo">📏 ¿Cómo calcular los m²?</h4>
                  <div className="guia-grid">
                    <div className="guia-card">
                      <img src="/areasplanas.png" alt="Cómo medir piso" className="guia-img" onClick={() => setImagenGuiaZoom("/areasplanas.png")} />
                      <h4>Áreas planas (Pisos)</h4>
                      <p>Da clic en la imagen para ampliar.</p>
                    </div>
                    <div className="guia-card">
                      <img src="/paredes.png" alt="Cómo medir muro" className="guia-img" onClick={() => setImagenGuiaZoom("/paredes.png")} />
                      <h4>Muros (Paredes)</h4>
                      <p>Da clic en la imagen para ampliar.</p>
                    </div>
                  </div>
                </div>
              )}

              {producto.tipoVenta !== "unidad" && producto.tipoVenta !== "tramo" && producto.tipoVenta !== "otros" && (
                <div className="selector-modo">
                  <label>
                    <input type="radio" checked={modoCotizacion === "todas"} onChange={() => setModoCotizacion("todas")} />
                    Cotizar todas las áreas
                  </label>
                  <label>
                    <input type="radio" checked={modoCotizacion === "una"} onChange={() => setModoCotizacion("una")} />
                    Cotizar una sola área
                  </label>
                  <div className="resumen-area">
                    {modoCotizacion === "todas" ? `📐 Área total: ${areaIngresada.toFixed(2)} m²` : `📐 Área seleccionada: ${areaIngresada.toFixed(2)} m²`}
                  </div>
                </div>
              )}

              <div className="medidas-container">
                {producto.tipoVenta === "otros" ? (
                  <div className="medida-card">
                    <h4>Área a cubrir</h4>
                    <input
                      type="number"
                      placeholder="Ingresa los m² que deseas cubrir"
                      value={medidas[0]?.area || ""}
                      onChange={(e) => setMedidas([{ area: e.target.value }])}
                      className="input-field"
                      step="0.01"
                    />
                    <p className="resultado-medida">Área ingresada: {areaIngresada.toFixed(2)} m²</p>
                  </div>
                ) : (
                  medidas.map((item, index) => (
                    <div key={index} className="medida-card">
                      <h4>
                        {producto.tipoVenta === "unidad" ? `Unidad ${index + 1}` : producto.tipoVenta === "tramo" ? `Perímetro ${index + 1}` : `Área ${index + 1}`}
                      </h4>
                      {modoCotizacion === "una" && producto.tipoVenta !== "unidad" && producto.tipoVenta !== "tramo" && (
                        <label className="radio-label">
                          <input type="radio" checked={areaSeleccionada === index} onChange={() => setAreaSeleccionada(index)} />
                          Utilizar esta área
                        </label>
                      )}
                      {producto.tipoVenta === "unidad" ? (
                        <input
                          type="number"
                          placeholder="Cantidad de unidades"
                          value={item.cantidad || ""}
                          onChange={(e) => actualizarMedida(index, "cantidad", e.target.value)}
                          className="input-field"
                        />
                      ) : producto.tipoVenta === "tramo" ? (
                        <input
                          type="number"
                          placeholder="Perímetro en metros"
                          value={item.perimetro || ""}
                          onChange={(e) => actualizarMedida(index, "perimetro", e.target.value)}
                          className="input-field"
                        />
                      ) : (
                        <div className="medidas-grid">
                          <input
                            type="number"
                            placeholder="Largo (m)"
                            value={item.largo}
                            onChange={(e) => actualizarMedida(index, "largo", e.target.value)}
                            className="input-field"
                          />
                          <input
                            type="number"
                            placeholder="Ancho (m)"
                            value={item.ancho}
                            onChange={(e) => actualizarMedida(index, "ancho", e.target.value)}
                            className="input-field"
                          />
                        </div>
                      )}
                      <p className="resultado-medida">
                        {producto.tipoVenta === "unidad" ? `Cantidad: ${Number(item.cantidad || 0)}` : producto.tipoVenta === "tramo" ? `Perímetro: ${Number(item.perimetro || 0)} m` : `Área: ${((Number(item.largo) || 0) * (Number(item.ancho) || 0)).toFixed(2)} m²`}
                      </p>
                      {producto.tipoVenta !== "unidad" && medidas.length > 1 && (
                        <button className="btn-eliminar" onClick={() => eliminarMedida(index)}>
                          🗑 Eliminar
                        </button>
                      )}
                    </div>
                  ))
                )}

                {producto.tipoVenta !== "unidad" && producto.tipoVenta !== "otros" && (
                  <div className="botones-medidas">
                    {medidas.length < 5 && (
                      <button className="btn-agregar" onClick={agregarMedida}>
                        ➕ Agregar medida
                      </button>
                    )}
                    <button className="btn-limpiar" onClick={limpiarCampos}>
                      🧹 Limpiar campos
                    </button>
                  </div>
                )}
              </div>

              {producto.tipoVenta !== "unidad" && producto.tipoVenta !== "tramo" && producto.tipoVenta !== "otros" && (
                <div className="desperdicio-box">
                  <span className="desperdicio-label">Desperdicio:</span>
                  {[0, 10, 15, 20].map((p) => (
                    <button key={p} className={`des-btn ${desperdicio === p ? "active" : ""}`} onClick={() => setDesperdicio(p)}>
                      {p}%
                    </button>
                  ))}
                </div>
              )}

              {(
                (producto.tipoVenta === "otros" && areaIngresada > 0) ||
                (producto.tipoVenta === "unidad" && medidas.some(m => Number(m.cantidad) > 0)) ||
                (producto.tipoVenta === "tramo" && medidas.some(m => Number(m.perimetro) > 0)) ||
                (producto.tipoVenta !== "unidad" && producto.tipoVenta !== "tramo" && producto.tipoVenta !== "otros" && areaIngresada > 0)
              ) && (
                <div className="resultado-cotizacion">
                  {producto.tipoVenta === "tramo" ? (
                    <p><strong>Perímetro total:</strong> {metrosLineales.toFixed(2)} m</p>
                  ) : producto.tipoVenta === "unidad" ? (
                    <p><strong>Cantidad de unidades:</strong> {cantidadNecesaria}</p>
                  ) : producto.tipoVenta === "otros" ? (
                    <>
                      <p><strong>Área a cubrir:</strong> {areaIngresada.toFixed(2)} m²</p>
                      <p><strong>Cobertura por {producto.presentacion || "unidad"}:</strong> {coberturaPorUnidad.toFixed(2)} m²</p>
                      <p><strong>Unidades necesarias:</strong> {cantidadNecesaria}</p>
                      <p><strong>Área total cubierta:</strong> {areaCubierta.toFixed(2)} m²</p>
                    </>
                  ) : (
                    <>
                      <p><strong>Área ingresada:</strong> {areaIngresada.toFixed(2)} m²</p>
                      <p><strong>Área con desperdicio:</strong> {areaConDesperdicio.toFixed(2)} m²</p>
                    </>
                  )}
                  <p><strong>Necesitas:</strong> {producto.tipoVenta === "unidad" || producto.tipoVenta === "otros" ? <strong>{cantidadNecesaria}</strong> : producto.tipoVenta === "tramo" || producto.tipoVenta === "rollo" ? <strong>{metrosLineales.toFixed(2)}</strong> : <strong>{cantidadNecesaria}</strong>} {producto.tipoVenta === "unidad" || producto.tipoVenta === "otros" ? "unidades" : producto.tipoVenta === "tramo" || producto.tipoVenta === "rollo" ? "metros lineales" : `${producto.tipoVenta}s`}</p>
                  <p className="total-estimado">Total estimado: ${total.toLocaleString()}</p>

                  <div className="nota-producto">
                    ℹ️ Este producto se vende por <strong>{producto.tipoVenta}</strong>.
                    {producto.tipoVenta === "caja" && (
                      <> Cada caja contiene <strong>{producto.piezasCaja} piezas</strong> y cubre <strong>{coberturaPorUnidad.toFixed(2)} m²</strong>.<br/><br/>Para cubrir <strong>{areaConDesperdicio.toFixed(2)} m²</strong> necesitas aproximadamente <strong>{cantidadNecesaria} cajas</strong>.</>
                    )}
                    {producto.tipoVenta === "pieza" && (
                      <> Cada pieza cubre <strong>{coberturaPorUnidad.toFixed(2)} m²</strong>.<br/><br/>Para cubrir <strong>{areaConDesperdicio.toFixed(2)} m²</strong> necesitas aproximadamente <strong>{cantidadNecesaria} piezas</strong>.</>
                    )}
                    {producto.tipoVenta === "rollo" && (
                      <> Cada rollo mide {(Number(producto.ancho) / 100).toFixed(2)} m x {(Number(producto.alto) / 100).toFixed(2)} m y cubre <strong>{coberturaPorUnidad.toFixed(2)} m²</strong>.<br/><br/>Para cubrir <strong>{areaConDesperdicio.toFixed(2)} m²</strong> necesitas aproximadamente <strong>{metrosLineales.toFixed(2)} metros lineales</strong>.</>
                    )}
                    {producto.tipoVenta === "tramo" && (
                      <> La cotización se realiza con base en la suma de los perímetros capturados.<br/><br/><strong>Perímetro total:</strong> {metrosLineales.toFixed(2)} m<br/><strong>Material requerido:</strong> {metrosLineales.toFixed(2)} metros lineales.</>
                    )}
                    {producto.tipoVenta === "unidad" && (
                      <> La cotización se realiza con base en la cantidad de unidades capturadas.<br/><br/><strong>Cantidad requerida:</strong> {cantidadNecesaria} unidades.</>
                    )}
                    {producto.tipoVenta === "otros" && (
                      <> La cotización se realiza con base en el área que deseas cubrir. Cada unidad ({producto.presentacion || "presentación"}) cubre <strong>{coberturaPorUnidad.toFixed(2)} m²</strong>.<br/><br/><strong>Área a cubrir:</strong> {areaIngresada.toFixed(2)} m²<br/><strong>Cantidad requerida:</strong> {cantidadNecesaria} unidades.<br/><strong>Área total cubierta:</strong> {areaCubierta.toFixed(2)} m².</>
                    )}
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
        </div>

        {/* ===== COLUMNA DERECHA: INFORMACIÓN DEL PRODUCTO ===== */}
        <div className="producto-detalle-right-col">
          {/* Miga de pan */}
          <div className="breadcrumb">
            <span onClick={() => navigate('/')}>Inicio</span>
            <span>/</span>
            <span onClick={() => navigate('/productos')}>Productos</span>
            <span>/</span>
            <span className="breadcrumb-actual">{producto.nombre}</span>
          </div>

          <h1 className="product-title">{getNombreActual()}</h1>

          {/* ===== CARRUSEL DE MODELOS ===== */}
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

          {/* CATEGORÍAS */}
          <div className="category-box">
            {producto.categoria && <span className="category-tag">📁 {producto.categoria}</span>}
            {producto.subcategoria && <span className="subcategory-tag">📂 {producto.subcategoria}</span>}
            {producto.tipo && <span className="type-tag">🏷️ {producto.tipo}</span>}
          </div>

          {/* PRECIO */}
          <div className="precio-section">
            {producto.oferta === 1 || producto.oferta === true ? (
              <div className="precio-container">
                <span className="precio-anterior">${producto.precio}</span>
                <h2 className="precio-oferta">${getPrecioActual()} <span className="precio-unidad">{getUnidadVenta()}</span></h2>
                <span className="descuento-badge">-{Math.round(((producto.precio - producto.precioOferta) / producto.precio) * 100)}%</span>
              </div>
            ) : (
              <h2 className="precio-normal">${getPrecioActual()} <span className="precio-unidad">{getUnidadVenta()}</span></h2>
            )}
          </div>

          {/* SKU */}
          {producto.sku && <p className="sku-item"><strong>SKU:</strong> {producto.sku}</p>}

          {/* STOCK - Diseño moderno */}
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

          {/* DATOS DEL PRODUCTO - Diseño en grid */}
          <div className="data-box-modern">
            <div className="data-item-modern">
              <span className="data-icon">📦</span>
              <div>
                <span className="data-label">Venta por</span>
                <span className="data-value">{producto.tipoVenta || '-'}</span>
              </div>
            </div>
            <div className="data-item-modern">
              <span className="data-icon">📏</span>
              <div>
                <span className="data-label">Medidas</span>
                <span className="data-value">
                  {producto.presentacion 
                    ? producto.presentacion 
                    : producto.ancho && producto.alto 
                      ? `${(Number(producto.ancho) / 100).toFixed(2)} x ${(Number(producto.alto) / 100).toFixed(2)} m`
                      : '-'}
                </span>
              </div>
            </div>
            {producto.tipoVenta === "caja" && (
              <div className="data-item-modern">
                <span className="data-icon">📦</span>
                <div>
                  <span className="data-label">Piezas por caja</span>
                  <span className="data-value">{producto.piezasCaja}</span>
                </div>
              </div>
            )}
            {coberturaPorUnidad > 0 && (
              <div className="data-item-modern">
                <span className="data-icon">📐</span>
                <div>
                  <span className="data-label">Cobertura</span>
                  <span className="data-value">{coberturaPorUnidad.toFixed(2)} m²</span>
                </div>
              </div>
            )}
            {producto.grueso && (
              <div className="data-item-modern">
                <span className="data-icon">📊</span>
                <div>
                  <span className="data-label">Grosor</span>
                  <span className="data-value">{producto.grueso} mm</span>
                </div>
              </div>
            )}
          </div>

          {/* DESCRIPCIÓN */}
          <div className="box-modern">
            <h3 className="box-title">📝 Descripción</h3>
            <p className="description">{producto.descripcion}</p>
          </div>

          {/* ESPECIFICACIONES */}
          {producto.especificaciones && (
            <div className="box-modern">
              <h3 className="box-title">⚙️ Especificaciones</h3>
              <p className="description" style={{ whiteSpace: "pre-wrap" }}>{producto.especificaciones}</p>
            </div>
          )}

          {/* INFORMACIÓN ADICIONAL */}
          {producto.informacionAdicional && (
            <div className="box-modern">
              <h3 className="box-title">📋 Información adicional</h3>
              <p className="description" style={{ whiteSpace: "pre-wrap" }}>{producto.informacionAdicional}</p>
            </div>
          )}

          {/* BOTONES DE ACCIÓN - SOLO AGREGAR AL PEDIDO Y FICHA TÉCNICA */}
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

      {/* MODALES ZOOM */}
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

      {/* ========== PRODUCTOS RELACIONADOS ========== */}
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
// ESTILOS CSS MEJORADOS - DISEÑO TIENDA EN LÍNEA
// ============================================================
if (typeof document !== "undefined") {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    /* ============================================================ */
    /* BASE Y RESET */
    /* ============================================================ */
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .producto-detalle-page {
      padding-top: 50px !important;
      background: #f8fafc;
      min-height: 100vh;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow-x: hidden;
      padding-top: 0px;
    }

    /* ============================================================ */
    /* AJUSTE PARA NAVBAR EN MÓVIL */
    /* ============================================================ */
    @media (max-width: 767px) {
      .navbar {
        position: sticky !important;
        top: 0 !important;
        z-index: 1000 !important;
        background: #fff !important;
        box-shadow: 0 2px 10px rgba(0,0,0,0.08) !important;
      }
      
      .producto-detalle-page {
        padding-top: 60px !important;
        margin-top: 0 !important;
      }
    }

    /* ============================================================ */
    /* NUEVO LAYOUT - GALERÍA + COTIZADOR A LA IZQUIERDA */
    /* ============================================================ */
    .producto-detalle-wrapper {
      display: flex;
      flex-wrap: wrap;
      gap: 30px;
      max-width: 1400px;
      margin: 10px auto 20px;
      padding: 24px;
      background: #fff;
      border-radius: 24px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      width: 100%;
      box-sizing: border-box;
      transition: all 0.3s ease;
    }

    .producto-detalle-left-col {
      flex: 1 1 100%;
      max-width: 100%;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .producto-detalle-right-col {
      flex: 1 1 100%;
      max-width: 100%;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    /* En desktop: galería + cotizador ocupan el lado izquierdo */
    @media (min-width: 1024px) {
      .producto-detalle-wrapper {
        padding: 36px 40px;
        gap: 40px;
        margin: 20px auto 30px;
        border-radius: 28px;
      }
      
      .producto-detalle-left-col {
        flex: 0 0 50%;
        max-width: 50%;
      }
      
      .producto-detalle-right-col {
        flex: 0 0 45%;
        max-width: 45%;
      }
    }

    @media (min-width: 1440px) {
      .producto-detalle-wrapper {
        max-width: 1600px;
        padding: 48px 56px;
        gap: 56px;
        margin: 25px auto 40px;
        border-radius: 36px;
      }
      .producto-detalle-left-col { flex: 0 0 48%; max-width: 48%; }
      .producto-detalle-right-col { flex: 0 0 46%; max-width: 46%; }
    }

    /* En móvil: todo en una columna */
    @media (max-width: 767px) {
      .producto-detalle-wrapper {
        padding: 14px;
        gap: 16px;
        margin: 10px 8px 16px;
        border-radius: 16px;
      }
      
      .producto-detalle-left-col,
      .producto-detalle-right-col {
        flex: 1 1 100%;
        max-width: 100%;
      }
    }

    /* ============================================================ */
    /* COTIZADOR WRAPPER - visible siempre */
    /* ============================================================ */
    .cotizador-wrapper {
      width: 100%;
      display: block;
    }

    .cotizador-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 18px;
      border-radius: 14px;
      width: 100%;
      margin-top: 0;
    }

    /* En móvil el cotizador se muestra después de la galería */
    @media (max-width: 767px) {
      .cotizador-box {
        margin-top: 10px;
      }
    }

    /* ============================================================ */
    /* NOTIFICACIÓN FLOTANTE */
    /* ============================================================ */
    .notificacion-flotante {
      position: fixed;
      top: 80px;
      right: 20px;
      background: #1e293b;
      color: #fff;
      padding: 14px 24px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      z-index: 9999;
      animation: slideInRight 0.4s ease;
      font-weight: 500;
      font-size: 14px;
      max-width: 90%;
    }

    @keyframes slideInRight {
      from { transform: translateX(100px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    @media (max-width: 767px) {
      .notificacion-flotante {
        top: 70px;
        right: 10px;
        padding: 12px 16px;
        font-size: 13px;
        max-width: 95%;
      }
    }

    /* ============================================================ */
    /* LOADING */
    /* ============================================================ */
    .loading-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100vh;
      gap: 16px;
    }

    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #e2e8f0;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* ============================================================ */
    /* BREADCRUMB */
    /* ============================================================ */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #64748b;
      flex-wrap: wrap;
    }
    .breadcrumb span {
      cursor: pointer;
      transition: color 0.2s;
    }
    .breadcrumb span:hover {
      color: #3b82f6;
    }
    .breadcrumb-actual {
      color: #1e293b;
      font-weight: 600;
      cursor: default !important;
    }

    @media (max-width: 767px) {
      .breadcrumb { font-size: 12px; }
    }

    /* ============================================================ */
    /* GALERÍA */
    /* ============================================================ */
    .producto-detalle-gallery {
      position: relative;
      width: 100%;
    }

    .badges-container {
      position: absolute;
      top: 12px;
      left: 12px;
      z-index: 20;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .badge {
      padding: 5px 12px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      animation: badgePulse 2s ease-in-out infinite;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    }
    .rebaja { background: linear-gradient(135deg, #dc2626, #b91c1c); }
    .destacado { background: linear-gradient(135deg, #f59e0b, #d97706); }
    .ultimas { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }

    @keyframes badgePulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    @media (max-width: 400px) {
      .badge { font-size: 9px; padding: 3px 8px; }
    }

    .fav-btn {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      border: none;
      font-size: 20px;
      cursor: pointer;
      z-index: 30;
      box-shadow: 0 4px 15px rgba(0,0,0,0.12);
      transition: all 0.3s ease;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .fav-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 25px rgba(0,0,0,0.2);
    }

    @media (max-width: 400px) {
      .fav-btn { width: 36px; height: 36px; font-size: 16px; }
    }

    .main-image-container {
      width: 100%;
      height: 320px;
      overflow: hidden;
      border-radius: 16px;
      background: #f8fafc;
      position: relative;
      border: 1px solid #f1f5f9;
    }

    .main-image {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
      transition: transform 0.1s ease;
    }

    .zoom-indicator {
      position: absolute;
      bottom: 12px;
      right: 12px;
      background: rgba(0,0,0,0.7);
      color: #fff;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 12px;
      backdrop-filter: blur(4px);
    }

    .thumbs-container {
      display: flex;
      gap: 10px;
      margin-top: 14px;
      flex-wrap: wrap;
    }

    .thumb {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
      background: #f8fafc;
    }
    .thumb:hover {
      transform: scale(1.05);
      border-color: #94a3b8;
    }
    .thumb.active {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
    }

    @media (min-width: 1024px) {
      .main-image-container { height: 440px; }
      .thumb { width: 80px; height: 80px; }
    }

    @media (min-width: 1440px) {
      .main-image-container { height: 520px; }
      .thumb { width: 90px; height: 90px; }
    }

    @media (max-width: 767px) {
      .main-image-container { height: 280px; }
      .thumb { width: 50px; height: 50px; }
    }

    @media (max-width: 400px) {
      .main-image-container { height: 220px; }
      .thumb { width: 40px; height: 40px; }
    }

    /* ============================================================ */
    /* TÍTULOS Y PRECIOS */
    /* ============================================================ */
    .product-title {
      font-size: 24px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      letter-spacing: -0.5px;
      margin: 0;
    }

    @media (min-width: 1024px) {
      .product-title { font-size: 32px; }
    }

    @media (min-width: 1440px) {
      .product-title { font-size: 36px; }
    }

    @media (max-width: 767px) {
      .product-title { font-size: 20px; }
    }

    @media (max-width: 400px) {
      .product-title { font-size: 17px; }
    }

    .precio-section {
      margin: 2px 0;
    }

    .precio-normal {
      color: #16a34a;
      font-size: 32px;
      font-weight: 900;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .precio-oferta {
      color: #dc2626;
      font-size: 32px;
      font-weight: 900;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .precio-anterior {
      text-decoration: line-through;
      color: #94a3b8;
      font-size: 20px;
      font-weight: 600;
      display: block;
    }

    .precio-unidad {
      font-size: 16px;
      font-weight: 600;
      color: #64748b;
    }

    .descuento-badge {
      background: #dc2626;
      color: #fff;
      padding: 2px 12px;
      border-radius: 999px;
      font-size: 14px;
      font-weight: 700;
    }

    @media (min-width: 1024px) {
      .precio-normal, .precio-oferta { font-size: 40px; }
      .precio-unidad { font-size: 18px; }
    }

    @media (min-width: 1440px) {
      .precio-normal, .precio-oferta { font-size: 44px; }
      .precio-unidad { font-size: 20px; }
    }

    @media (max-width: 767px) {
      .precio-normal, .precio-oferta { font-size: 26px; }
      .precio-anterior { font-size: 17px; }
      .precio-unidad { font-size: 13px; }
    }

    @media (max-width: 400px) {
      .precio-normal, .precio-oferta { font-size: 22px; }
      .precio-unidad { font-size: 11px; }
    }

    /* ============================================================ */
    /* CATEGORÍAS */
    /* ============================================================ */
    .category-box {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin: 0;
    }

    .category-tag {
      background: #0f172a;
      color: #fff;
      padding: 4px 14px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    .category-tag:hover { transform: scale(1.05); }

    .subcategory-tag {
      background: #e2e8f0;
      color: #0f172a;
      padding: 4px 14px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    .subcategory-tag:hover { transform: scale(1.05); }

    .type-tag {
      background: #3b82f6;
      color: #fff;
      padding: 4px 14px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      transition: all 0.3s ease;
    }
    .type-tag:hover { transform: scale(1.05); }

    /* ============================================================ */
    /* SKU */
    /* ============================================================ */
    .sku-item {
      font-size: 13px;
      color: #64748b;
      margin: -2px 0 0 0;
    }
    .sku-item strong {
      color: #0f172a;
    }

    /* ============================================================ */
    /* STOCK - MODERNO */
    /* ============================================================ */
    .stock-box-modern {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-radius: 12px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      flex-wrap: wrap;
      gap: 8px;
    }

    .stock-status {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .stock-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      display: inline-block;
    }
    .stock-indicator.disponible { background: #16a34a; }
    .stock-indicator.poco { background: #f59e0b; animation: pulse 1.5s infinite; }
    .stock-indicator.agotado { background: #dc2626; }

    .stock-text {
      font-weight: 600;
      font-size: 14px;
    }

    .stock-cantidad {
      font-size: 13px;
      color: #64748b;
      background: #fff;
      padding: 2px 14px;
      border-radius: 999px;
      border: 1px solid #e2e8f0;
    }

    @media (max-width: 767px) {
      .stock-box-modern { flex-direction: column; align-items: flex-start; }
    }

    /* ============================================================ */
    /* DATA BOX - MODERNO */
    /* ============================================================ */
    .data-box-modern {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 14px 16px;
    }

    .data-item-modern {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .data-icon {
      font-size: 18px;
      width: 30px;
      text-align: center;
    }

    .data-label {
      display: block;
      font-size: 10px;
      font-weight: 600;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .data-value {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #0f172a;
    }

    @media (max-width: 767px) {
      .data-box-modern { grid-template-columns: 1fr; }
    }

    /* ============================================================ */
    /* CAJAS DE TEXTO - MODERNAS */
    /* ============================================================ */
    .box-modern {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 16px;
      border-radius: 14px;
    }

    .box-title {
      margin-bottom: 10px;
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
    }

    .description {
      color: #475569;
      line-height: 1.8;
      margin: 0;
      font-size: 14px;
    }

    /* ============================================================ */
    /* BOTONES DE ACCIÓN */
    /* ============================================================ */
    .botones-acciones {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      width: 100%;
      margin-top: 2px;
    }

    .btn-ficha-tecnica {
      background: #1e293b;
      color: #fff;
      border: none;
      padding: 14px 16px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 600;
      font-size: 14px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 12px rgba(30, 41, 59, 0.2);
    }
    .btn-ficha-tecnica:hover {
      background: #0f172a;
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(30, 41, 59, 0.3);
    }

    .btn-agregar-pedido {
      background: linear-gradient(135deg, #16a34a, #15803d);
      color: #fff;
      border: none;
      padding: 14px 16px;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(22, 163, 74, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-agregar-pedido:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 25px rgba(22, 163, 74, 0.4);
      background: linear-gradient(135deg, #15803d, #166534);
    }

    @media (max-width: 767px) {
      .botones-acciones { grid-template-columns: 1fr; gap: 8px; }
      .btn-ficha-tecnica, .btn-agregar-pedido { padding: 12px; font-size: 14px; }
    }

    @media (max-width: 400px) {
      .botones-acciones { gap: 6px; }
      .btn-ficha-tecnica, .btn-agregar-pedido { padding: 10px; font-size: 13px; }
    }

    /* ============================================================ */
    /* COTIZADOR - SIEMPRE VISIBLE */
    /* ============================================================ */
    .cotizador-title {
      margin: 0 0 16px 0;
      color: #0f172a;
      font-size: 17px;
      font-weight: 700;
    }

    .guia-medicion {
      margin-bottom: 20px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px;
    }

    .guia-titulo {
      text-align: center;
      margin: 0 0 14px 0;
      color: #0f172a;
      font-size: 15px;
      font-weight: 700;
    }

    .guia-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .guia-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 12px;
      text-align: center;
      border: 1px solid #e2e8f0;
      transition: all 0.3s ease;
      cursor: pointer;
    }
    .guia-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(0,0,0,0.08);
    }

    .guia-img {
      width: 100%;
      height: 100px;
      object-fit: contain;
      margin-bottom: 8px;
      transition: all 0.3s ease;
    }
    .guia-img:hover { transform: scale(1.05); }
    .guia-card h4 { font-size: 13px; margin: 6px 0; color: #0f172a; }
    .guia-card p { font-size: 11px; color: #64748b; margin: 0; }

    @media (min-width: 1024px) {
      .guia-img { height: 120px; }
    }

    @media (max-width: 767px) {
      .guia-grid { grid-template-columns: 1fr; }
      .guia-img { height: 100px; }
    }

    .selector-modo {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-bottom: 16px;
      padding: 12px;
      background: #fff;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }
    .selector-modo label {
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 6px;
      cursor: pointer;
      color: #0f172a;
    }
    .selector-modo input[type="radio"] {
      accent-color: #3b82f6;
      width: 16px;
      height: 16px;
    }

    @media (max-width: 767px) {
      .selector-modo { padding: 10px; flex-direction: column; }
      .selector-modo label { font-size: 13px; }
    }

    .resumen-area {
      background: #ecfdf5;
      border: 1px solid #16a34a;
      color: #166534;
      padding: 10px;
      border-radius: 10px;
      text-align: center;
      font-weight: 700;
      font-size: 14px;
      width: 100%;
    }

    @media (max-width: 767px) {
      .resumen-area { font-size: 13px; padding: 8px; }
    }

    .medidas-container {
      margin-bottom: 16px;
    }

    .medida-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 12px;
      transition: all 0.3s ease;
    }
    .medida-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
    }
    .medida-card h4 {
      font-size: 14px;
      margin: 0 0 10px 0;
      color: #0f172a;
    }

    .medidas-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    @media (max-width: 767px) {
      .medidas-grid { grid-template-columns: 1fr; }
    }

    .input-field {
      width: 100%;
      padding: 10px 12px;
      border-radius: 8px;
      border: 1px solid #d1d5db;
      box-sizing: border-box;
      font-size: 14px;
      transition: all 0.25s ease;
      background: #fff;
    }
    .input-field:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      outline: none;
    }

    .resultado-medida {
      font-weight: 600;
      color: #16a34a;
      margin: 8px 0 0 0;
      font-size: 13px;
    }

    .radio-label {
      display: block;
      margin-bottom: 8px;
      font-weight: 500;
      font-size: 13px;
      color: #0f172a;
    }
    .radio-label input {
      margin-right: 6px;
    }

    .botones-medidas {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .btn-agregar {
      background: #16a34a;
      color: #fff;
      border: none;
      padding: 10px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      flex: 1;
      transition: all 0.25s ease;
    }
    .btn-agregar:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(22, 163, 74, 0.3);
    }

    .btn-limpiar {
      background: #f59e0b;
      color: #fff;
      border: none;
      padding: 10px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      flex: 1;
      transition: all 0.25s ease;
    }
    .btn-limpiar:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
    }

    .btn-eliminar {
      background: #dc2626;
      color: #fff;
      border: none;
      padding: 8px 12px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 12px;
      margin-top: 8px;
      width: 100%;
      transition: all 0.25s ease;
    }
    .btn-eliminar:hover {
      transform: scale(1.02);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }

    .desperdicio-box {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
      flex-wrap: wrap;
      align-items: center;
    }
    .desperdicio-label {
      font-weight: 600;
      color: #0f172a;
      font-size: 14px;
      margin-right: 4px;
    }
    .des-btn {
      border: 1px solid #e2e8f0;
      padding: 8px 14px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      background: #fff;
      color: #0f172a;
      transition: all 0.25s ease;
      min-width: 50px;
    }
    .des-btn.active {
      background: #0f172a;
      color: #fff;
      border-color: #0f172a;
    }
    .des-btn:hover {
      transform: scale(1.05);
    }

    @media (max-width: 767px) {
      .desperdicio-box { gap: 4px; }
      .des-btn { padding: 6px 10px; font-size: 12px; min-width: 44px; }
    }

    .resultado-cotizacion {
      background: #fff;
      border-radius: 12px;
      padding: 16px;
      border: 1px solid #e2e8f0;
      margin-top: 4px;
    }
    .resultado-cotizacion p {
      margin: 6px 0;
      font-size: 14px;
      color: #0f172a;
    }

    .total-estimado {
      font-size: 24px;
      font-weight: 800;
      color: #16a34a;
      margin: 10px 0 6px 0 !important;
    }

    @media (max-width: 767px) {
      .total-estimado { font-size: 20px; }
    }

    .nota-producto {
      margin-top: 12px;
      background: #eff6ff;
      padding: 14px;
      border-radius: 10px;
      color: #1e3a8a;
      line-height: 1.7;
      font-size: 13px;
    }

    @media (max-width: 767px) {
      .nota-producto { font-size: 12px; padding: 12px; }
    }

    .form-cliente {
      margin-top: 20px;
      background: #fff;
      padding: 16px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }
    .form-cliente h3 {
      margin: 0 0 12px 0;
      font-size: 16px;
      color: #0f172a;
    }

    @media (max-width: 767px) {
      .form-cliente { padding: 14px; }
      .form-cliente h3 { font-size: 15px; }
    }

    .btn-enviar {
      margin-top: 8px;
      background: linear-gradient(135deg, #dc2626, #b91c1c);
      color: #fff;
      border: none;
      padding: 12px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
      width: 100%;
      transition: all 0.25s ease;
    }
    .btn-enviar:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(220, 38, 38, 0.3);
    }
    .btn-enviar:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .mensaje-exito {
      margin-top: 12px;
      color: #16a34a;
      font-weight: 600;
      text-align: center;
      animation: fadeIn 0.4s ease;
    }

    /* ============================================================ */
    /* CARRUSEL DE MODELOS */
    /* ============================================================ */
    .modelos-carrusel {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 16px;
      padding: 16px;
      box-shadow: 0 4px 16px rgba(56, 189, 248, 0.08);
      width: 100%;
      box-sizing: border-box;
    }

    .modelos-carrusel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .modelos-carrusel-title {
      font-size: 15px;
      font-weight: 700;
      color: #0c4a6e;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .title-icon {
      font-size: 18px;
      animation: floatIcon 3s ease-in-out infinite;
    }
    @keyframes floatIcon {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }

    .title-badge {
      font-size: 9px;
      background: #0ea5e9;
      color: #fff;
      padding: 2px 10px;
      border-radius: 999px;
      font-weight: 600;
      animation: pulseBadge 2s ease-in-out infinite;
    }
    @keyframes pulseBadge {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }

    @media (max-width: 767px) {
      .modelos-carrusel-title { font-size: 13px; }
    }

    .carrusel-controls {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .carrusel-btn {
      background: #fff;
      border: 1px solid #bae6fd;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 11px;
      transition: all 0.25s ease;
      color: #0c4a6e;
      font-weight: 700;
    }
    .carrusel-btn:hover {
      background: #38bdf8;
      color: #fff;
      transform: scale(1.1);
      box-shadow: 0 4px 12px rgba(56, 189, 248, 0.3);
    }

    .carrusel-indicador {
      font-size: 12px;
      font-weight: 600;
      color: #0c4a6e;
      min-width: 44px;
      text-align: center;
    }

    @media (max-width: 767px) {
      .carrusel-btn { width: 26px; height: 26px; font-size: 10px; }
      .carrusel-indicador { font-size: 11px; min-width: 36px; }
    }

    .modelos-carrusel-container {
      overflow: hidden;
      position: relative;
      width: 100%;
    }

    .modelos-carrusel-scroll {
      scroll-behavior: smooth;
      overflow-x: auto;
      display: flex;
      gap: 12px;
      padding: 8px 4px 12px 4px;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: #38bdf8 #e0f2fe;
      scroll-snap-type: x mandatory;
    }
    .modelos-carrusel-scroll::-webkit-scrollbar {
      height: 5px;
    }
    .modelos-carrusel-scroll::-webkit-scrollbar-track {
      background: #e0f2fe;
      border-radius: 10px;
    }
    .modelos-carrusel-scroll::-webkit-scrollbar-thumb {
      background: #38bdf8;
      border-radius: 10px;
    }

    .modelo-carrusel-item {
      min-width: 130px;
      max-width: 160px;
      flex-shrink: 0;
      scroll-snap-align: start;
      background: #fff;
      border-radius: 14px;
      padding: 12px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      border: 2px solid transparent;
      text-align: center;
      position: relative;
    }
    .modelo-carrusel-item:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow: 0 8px 24px rgba(56, 189, 248, 0.2);
    }
    .modelo-carrusel-item.active {
      border-color: #0ea5e9;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.2), 0 12px 28px rgba(14, 165, 233, 0.2);
      background: #f0f9ff;
      transform: translateY(-4px) scale(1.04);
    }

    .modelo-selected-badge {
      position: absolute;
      top: 6px;
      left: 6px;
      background: #0ea5e9;
      color: #fff;
      font-size: 8px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 999px;
      animation: fadeIn 0.3s ease;
      z-index: 2;
    }

    .modelo-carrusel-img {
      width: 100%;
      height: 90px;
      object-fit: contain;
      border-radius: 8px;
      background: #fafafa;
      padding: 4px;
      transition: transform 0.3s ease;
    }
    .modelo-carrusel-item:hover .modelo-carrusel-img {
      transform: scale(1.05);
    }

    .modelo-carrusel-info {
      margin-top: 6px;
    }
    .modelo-carrusel-nombre {
      font-size: 11px;
      font-weight: 600;
      color: #0c4a6e;
      margin: 0;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      height: 26px;
    }
    .modelo-carrusel-precio {
      font-size: 13px;
      font-weight: 700;
      color: #16a34a;
      margin: 3px 0 0 0;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .oferta-tag {
      font-size: 8px;
      background: #dc2626;
      color: #fff;
      padding: 1px 6px;
      border-radius: 999px;
      font-weight: 600;
    }
    .stock-badge {
      font-size: 9px;
      background: #f59e0b;
      color: #fff;
      padding: 2px 8px;
      border-radius: 999px;
      display: inline-block;
      margin-top: 3px;
      font-weight: 600;
      animation: pulseBadge 2s ease-in-out infinite;
    }

    @media (min-width: 1024px) {
      .modelo-carrusel-item { min-width: 160px; max-width: 190px; }
      .modelo-carrusel-img { height: 120px; }
    }

    @media (min-width: 1440px) {
      .modelo-carrusel-item { min-width: 180px; max-width: 210px; }
      .modelo-carrusel-img { height: 130px; }
    }

    @media (max-width: 767px) {
      .modelo-carrusel-item { min-width: 110px; max-width: 135px; padding: 10px; }
      .modelo-carrusel-img { height: 75px; }
      .modelo-carrusel-nombre { font-size: 10px; height: 22px; }
      .modelo-carrusel-precio { font-size: 12px; }
    }

    @media (max-width: 400px) {
      .modelo-carrusel-item { min-width: 90px; max-width: 110px; padding: 8px; }
      .modelo-carrusel-img { height: 60px; }
    }

    .carrusel-progress {
      display: flex;
      justify-content: center;
      gap: 6px;
      margin-top: 10px;
    }
    .carrusel-dot {
      width: 8px;
      height: 8px;
      border-radius: 999px;
      background: #e2e8f0;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      cursor: pointer;
    }
    .carrusel-dot.active {
      width: 28px;
      background: #0ea5e9;
      box-shadow: 0 0 16px rgba(14, 165, 233, 0.3);
    }
    .carrusel-dot:hover {
      transform: scale(1.2);
    }

    .btn-ver-todos {
      width: 100%;
      margin-top: 12px;
      background: #0ea5e9;
      color: #fff;
      border: none;
      padding: 10px 14px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.25s ease;
      box-shadow: 0 4px 12px rgba(14, 165, 233, 0.25);
    }
    .btn-ver-todos:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(14, 165, 233, 0.35);
      background: #0284c7;
    }

    @media (max-width: 767px) {
      .btn-ver-todos { font-size: 12px; padding: 8px 12px; }
    }

    /* ============================================================ */
    /* PRODUCTOS RELACIONADOS */
    /* ============================================================ */
    .full-width-related-wrapper {
      width: 100%;
      max-width: 100vw;
      overflow-x: hidden;
      padding: 0 16px;
      box-sizing: border-box;
      margin: 0 auto;
    }

    .full-width-related-section {
      max-width: 1400px;
      margin: 32px auto 0 auto;
      padding: 0 4px;
      box-sizing: border-box;
      width: 100%;
    }

    .related-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 14px;
      width: 100%;
    }

    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
    }

    .related-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 0 2px;
      flex-wrap: wrap;
      gap: 8px;
    }

    .related-count {
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      background: #f1f5f9;
      padding: 4px 14px;
      border-radius: 999px;
    }

    .highlight {
      color: #3b82f6;
    }

    .related-card {
      background: #fff;
      border-radius: 16px;
      padding: 12px;
      text-align: center;
      cursor: pointer;
      position: relative;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      transition: all 0.3s ease;
    }
    .related-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.1);
    }

    .sugerido-card {
      background: #fff;
      border-radius: 16px;
      padding: 12px;
      position: relative;
      cursor: pointer;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      transition: all 0.3s ease;
      text-align: center;
    }
    .sugerido-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 32px rgba(0,0,0,0.1);
    }

    .sugerido-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      background: #0f172a;
      color: #fff;
      font-size: 9px;
      padding: 3px 10px;
      border-radius: 999px;
      font-weight: 700;
      z-index: 5;
    }

    .related-image {
      width: 100%;
      height: 110px;
      object-fit: contain;
      border-radius: 10px;
      margin-bottom: 8px;
      background: #fafafa;
    }

    .related-card h4, .sugerido-card h4 {
      font-size: 13px;
      margin: 6px 0 4px 0;
      color: #0f172a;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      height: 32px;
    }

    .related-sub {
      font-size: 11px;
      color: #64748b;
      margin: 0 0 4px 0;
    }

    .related-price {
      color: #16a34a;
      font-weight: 700;
      font-size: 15px;
      margin: 4px 0 0 0;
    }

    .precio-ant {
      text-decoration: line-through;
      color: #94a3b8;
      font-size: 13px;
      display: block;
    }
    .precio-of {
      color: #dc2626;
      font-weight: 700;
      font-size: 16px;
      margin: 0;
    }

    .fav-btn-small {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      border: none;
      font-size: 15px;
      cursor: pointer;
      z-index: 5;
      transition: all 0.25s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      background: rgba(255,255,255,0.95);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .fav-btn-small:hover {
      transform: scale(1.1);
    }

    @media (max-width: 400px) {
      .fav-btn-small { width: 28px; height: 28px; font-size: 12px; }
    }

    .tipo-grupo {
      margin-bottom: 24px;
    }
    .tipo-grupo:last-child { margin-bottom: 0; }

    .tipo-grupo-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      background: #f8fafc;
      border-radius: 12px;
      border-left: 4px solid #3b82f6;
      margin-bottom: 14px;
    }
    .tipo-grupo-icon { font-size: 18px; }
    .tipo-grupo-title {
      font-size: 15px;
      font-weight: 700;
      color: #0f172a;
      margin: 0;
      flex: 1;
    }
    .tipo-grupo-count {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      background: #fff;
      padding: 2px 12px;
      border-radius: 999px;
      border: 1px solid #e2e8f0;
    }

    @media (max-width: 767px) {
      .tipo-grupo-header { flex-wrap: wrap; padding: 8px 12px; }
      .tipo-grupo-title { font-size: 13px; }
    }

    .sugeridos-banner {
      background: #f8fafc;
      border-left: 5px solid #0f172a;
      padding: 16px 20px;
      border-radius: 14px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.04);
      width: 100%;
      box-sizing: border-box;
    }
    .sugeridos-label {
      display: inline-block;
      background: #0f172a;
      color: #fff;
      font-weight: 700;
      font-size: 10px;
      letter-spacing: 1.2px;
      padding: 4px 14px;
      border-radius: 999px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    .sugeridos-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 6px 0 8px 0;
      line-height: 1.2;
    }
    .sugeridos-subtitle {
      font-size: 14px;
      color: #475569;
      margin: 0;
    }

    @media (min-width: 1440px) {
      .sugeridos-title { font-size: 26px; }
      .sugeridos-banner { padding: 20px 28px; }
    }

    @media (max-width: 767px) {
      .sugeridos-title { font-size: 17px; }
      .sugeridos-subtitle { font-size: 13px; }
      .sugeridos-banner { padding: 12px 14px; }
    }

    @media (min-width: 1024px) {
      .related-grid { grid-template-columns: repeat(5, 1fr); gap: 20px; }
      .related-image { height: 150px; }
      .full-width-related-wrapper { padding: 0 36px; }
    }

    @media (min-width: 1440px) {
      .related-grid { gap: 24px; }
      .related-image { height: 180px; }
      .full-width-related-wrapper { padding: 0 56px; }
      .full-width-related-section { max-width: 1600px; }
    }

    @media (max-width: 767px) {
      .full-width-related-wrapper { padding: 0 10px; }
      .full-width-related-section { padding: 0 2px; }
      .related-grid { grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 10px; }
      .related-image { height: 90px; }
      .related-card h4, .sugerido-card h4 { font-size: 12px; height: 28px; }
    }

    @media (max-width: 400px) {
      .related-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
      .related-image { height: 70px; }
    }

    /* ============================================================ */
    /* MODALES ZOOM */
    /* ============================================================ */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0,0,0,0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      cursor: zoom-out;
      animation: fadeIn 0.25s ease;
      padding: 20px;
      box-sizing: border-box;
    }
    .modal-image {
      max-width: 90%;
      max-height: 90%;
      border-radius: 8px;
      box-shadow: 0 16px 48px rgba(0,0,0,0.5);
      animation: zoomIn 0.25s ease;
      object-fit: contain;
    }
    @keyframes zoomIn {
      from { transform: scale(0.9); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `;
  document.head.appendChild(styleSheet);
}