// src/pages/Admin.js
import { useEffect, useState } from "react";
import api from "../services/api";

export default function Admin() {
  // 🟢 PRODUCTOS
  const [productos, setProductos] = useState([]);
  const [sugerencias, setSugerencias] = useState([]);
  const [contactos, setContactos] = useState([]);
  
  // 🔵 BANNERS PRINCIPALES
  const [banners, setBanners] = useState([]);
  
  // 🟠 BANNERS DE OFERTAS ESPECIALES
  const [bannersOfertas, setBannersOfertas] = useState([]);
  const [bannerOfertaForm, setBannerOfertaForm] = useState({
    titulo: "",
    descripcion: "",
    imagen: "",
    porcentaje: "",
    enlace_tipo: "categoria",
    categoria_id: "",
    subcategoria_id: "",
    tipo_id: "",
    producto_id: "",
    url_externa: "",
    orden: "1"
  });
  const [archivoBannerOferta, setArchivoBannerOferta] = useState(null);
  const [previewBannerOferta, setPreviewBannerOferta] = useState("");
  
  // 📂 CATEGORÍAS
  const [categorias, setCategorias] = useState([]);
  const [subcategorias, setSubcategorias] = useState([]);
  const [tipos, setTipos] = useState([]);
  
  // ➕ NUEVA CATEGORÍA / SUBCATEGORÍA / TIPO
  const [nuevaCategoria, setNuevaCategoria] = useState("");
  const [nuevaSubcategoria, setNuevaSubcategoria] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState("");
  const [nuevoTipo, setNuevoTipo] = useState("");
  const [subcategoriaSeleccionadaParaTipo, setSubcategoriaSeleccionadaParaTipo] = useState("");
  
  // ✏️ EDITAR CATEGORÍA / SUBCATEGORÍA / TIPO
  const [editandoCategoria, setEditandoCategoria] = useState(null);
  const [nombreCategoriaEditada, setNombreCategoriaEditada] = useState("");
  const [editandoSubcategoria, setEditandoSubcategoria] = useState(null);
  const [nombreSubcategoriaEditada, setNombreSubcategoriaEditada] = useState("");
  const [editandoTipo, setEditandoTipo] = useState(null);
  const [nombreTipoEditado, setNombreTipoEditado] = useState("");
  const [subcategoriaParaTipoEditado, setSubcategoriaParaTipoEditado] = useState("");
  
  // ⏰ FECHA OFERTA
  const [fechaOferta, setFechaOferta] = useState("");

  // 🔍 BUSCADOR DE PRODUCTOS
  const [busqueda, setBusqueda] = useState("");

  // 📋 PEDIDOS
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [mostrarDetallePedido, setMostrarDetallePedido] = useState(false);
  const [filtroEstadoPedido, setFiltroEstadoPedido] = useState("todos");

  // Cargar fecha guardada al montar
  useEffect(() => {
    const guardada = localStorage.getItem("fechaOferta");
    if (guardada) {
      const fecha = new Date(guardada);
      if (!isNaN(fecha.getTime())) {
        const year = fecha.getFullYear();
        const month = String(fecha.getMonth() + 1).padStart(2, "0");
        const day = String(fecha.getDate()).padStart(2, "0");
        const hours = String(fecha.getHours()).padStart(2, "0");
        const minutes = String(fecha.getMinutes()).padStart(2, "0");
        setFechaOferta(`${year}-${month}-${day}T${hours}:${minutes}`);
      }
    }
  }, []);
  
  // 🔥 ESTADOS PARA IMÁGENES
  const [archivoPrincipal, setArchivoPrincipal] = useState(null);
  const [previewPrincipal, setPreviewPrincipal] = useState("");
  const [archivosGaleria, setArchivosGaleria] = useState([]);
  const [previewsGaleria, setPreviewsGaleria] = useState([]);
  const [archivoFicha, setArchivoFicha] = useState(null);
  const [previewFicha, setPreviewFicha] = useState("");
  
  // 🟣 ESTADO PARA DUPLICAR
  const [duplicando, setDuplicando] = useState(false);
  
  // 🟢 FORM PRODUCTOS
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    precioOferta: "",
    oferta: false,
    rebaja: false,
    stock: "",
    imagenes: "",
    categoria_id: "",
    subcategoria_id: "",
    tipo_id: "",
    destacado: false,
    nuevo: false,
    fichaTecnica: "",
    sku: "",
    presentacion: "",
    ancho: "",
    alto: "",
    grueso: "",
    cobertura: "",
    tipoVenta: "pieza",
    tipoCobertura: "m2",
    piezasCaja: "",
    especificaciones: "",
    informacionAdicional: "",
    variante: "",
    uso: "",
    aplicacion: "",
    tipo_diseno: "",
    material: "",
    acabado: "",
    tipo_instalacion: "",
    espesor_capa_desgaste: ""
  });
  
  // 🟡 FORM BANNERS
  const [bannerForm, setBannerForm] = useState({
    titulo: "",
    descripcion: "",
    imagen: "",
    categoria: "",
    subcategoria: ""
  });
  const [archivoBanner, setArchivoBanner] = useState(null);
  const [previewBanner, setPreviewBanner] = useState("");
  
  // 🟣 MODAL
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoId, setProductoId] = useState(null);
  
  // Cargar datos iniciales
  useEffect(() => {
    cargar();
    cargarBanners();
    cargarBannersOfertas();
    cargarCategorias();
    cargarSubcategorias();
    cargarTipos();
    cargarContactos();
    cargarPedidos();
  }, []);
  
  // Funciones de carga
  const cargarContactos = () => {
    api.get("/contactos")
      .then(res => setContactos(res.data))
      .catch(err => console.log(err));
  };
  
  const cargar = () => {
    api.get("/admin/productos")
      .then(res => setProductos(res.data));
  };

  const cargarPedidos = () => {
    api.get("/pedidos")
      .then(res => setPedidos(res.data))
      .catch(err => console.error("Error cargando pedidos:", err));
  };
  
  const cargarBanners = () => {
    api.get("/banners")
      .then(res => setBanners(res.data));
  };
  
  const cargarBannersOfertas = () => {
    api.get("/banners-ofertas")
      .then(res => setBannersOfertas(res.data))
      .catch(err => console.log(err));
  };
  
  const cargarCategorias = () => {
    api.get("/categorias")
      .then(res => setCategorias(res.data));
  };
  
  const cargarSubcategorias = () => {
    api.get("/subcategorias")
      .then(res => setSubcategorias(res.data));
  };
  
  const cargarTipos = () => {
    api.get("/tipos")
      .then(res => setTipos(res.data))
      .catch(err => console.log(err));
  };
  
  // Handlers de formulario
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value
    });
  };
  
  // Imágenes
  const handleImagenPrincipal = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivoPrincipal(file);
    setPreviewPrincipal(URL.createObjectURL(file));
  };
  
  const handleGaleria = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setArchivosGaleria(files);
    const urls = files.map(file => URL.createObjectURL(file));
    setPreviewsGaleria(urls);
  };
  
  const handleFichaTecnica = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivoFicha(file);
    setPreviewFicha(URL.createObjectURL(file));
  };
  
  const handleBannerChange = (e) => {
    setBannerForm({
      ...bannerForm,
      [e.target.name]: e.target.value
    });
  };
  
  const handleBannerImagen = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivoBanner(file);
    setPreviewBanner(URL.createObjectURL(file));
  };
  
  // 🟠 BANNERS DE OFERTAS ESPECIALES
  const handleBannerOfertaChange = (e) => {
    const { name, value } = e.target;
    setBannerOfertaForm({
      ...bannerOfertaForm,
      [name]: value
    });
    if (name === 'enlace_tipo') {
      setBannerOfertaForm(prev => ({
        ...prev,
        categoria_id: "",
        subcategoria_id: "",
        tipo_id: "",
        producto_id: "",
        url_externa: "",
        [name]: value
      }));
    }
  };
  
  const handleBannerOfertaImagen = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setArchivoBannerOferta(file);
    setPreviewBannerOferta(URL.createObjectURL(file));
  };
  
  const crearBannerOferta = async () => {
    try {
      let imagenBanner = "";
      if (archivoBannerOferta) {
        const formData = new FormData();
        formData.append("imagen", archivoBannerOferta);
        const uploadRes = await api.post("/upload-banner-oferta", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        imagenBanner = uploadRes.data.imagen;
      }
      
      const data = {
        titulo: bannerOfertaForm.titulo,
        descripcion: bannerOfertaForm.descripcion,
        imagen: imagenBanner,
        porcentaje: bannerOfertaForm.porcentaje,
        enlace_tipo: bannerOfertaForm.enlace_tipo,
        orden: bannerOfertaForm.orden
      };
      
      if (bannerOfertaForm.enlace_tipo === 'categoria') {
        data.categoria_id = bannerOfertaForm.categoria_id;
      } else if (bannerOfertaForm.enlace_tipo === 'subcategoria') {
        data.subcategoria_id = bannerOfertaForm.subcategoria_id;
      } else if (bannerOfertaForm.enlace_tipo === 'tipo') {
        data.tipo_id = bannerOfertaForm.tipo_id;
      } else if (bannerOfertaForm.enlace_tipo === 'producto') {
        data.producto_id = bannerOfertaForm.producto_id;
      } else if (bannerOfertaForm.enlace_tipo === 'url') {
        data.url_externa = bannerOfertaForm.url_externa;
      }
      
      await api.post("/banners-ofertas", data);
      cargarBannersOfertas();
      setBannerOfertaForm({
        titulo: "",
        descripcion: "",
        imagen: "",
        porcentaje: "",
        enlace_tipo: "categoria",
        categoria_id: "",
        subcategoria_id: "",
        tipo_id: "",
        producto_id: "",
        url_externa: "",
        orden: "1"
      });
      setArchivoBannerOferta(null);
      setPreviewBannerOferta("");
      alert("✅ Banner de oferta creado");
    } catch (err) {
      console.log(err);
      alert("❌ Error creando banner de oferta");
    }
  };
  
  const eliminarBannerOferta = (id) => {
    if (!window.confirm("¿Eliminar banner de oferta?")) return;
    api.delete(`/banners-ofertas/${id}`)
      .then(() => cargarBannersOfertas())
      .catch(err => console.log(err));
  };
  
  // CRUD Categorías, Subcategorías, Tipos
  const crearCategoria = () => {
    if (!nuevaCategoria) return alert("Escribe una categoría");
    api.post("/categorias", { nombre: nuevaCategoria })
      .then(() => {
        cargarCategorias();
        setNuevaCategoria("");
        alert("✅ Categoría creada");
      })
      .catch(err => {
        console.log(err);
        alert("❌ Error al crear categoría");
      });
  };
  
  const crearSubcategoria = () => {
    if (!nuevaSubcategoria || !categoriaSeleccionada) return alert("Completa los datos");
    api.post("/subcategorias", {
      nombre: nuevaSubcategoria,
      categoria_id: categoriaSeleccionada
    })
      .then(() => {
        cargarSubcategorias();
        setNuevaSubcategoria("");
        alert("✅ Subcategoría creada");
      })
      .catch(err => {
        console.log(err);
        alert("❌ Error al crear subcategoría");
      });
  };
  
  const crearTipo = () => {
    if (!nuevoTipo || !subcategoriaSeleccionadaParaTipo) return alert("Completa los datos");
    api.post("/tipos", {
      nombre: nuevoTipo,
      subcategoria_id: subcategoriaSeleccionadaParaTipo
    })
      .then(() => {
        cargarTipos();
        setNuevoTipo("");
        setSubcategoriaSeleccionadaParaTipo("");
        alert("✅ Tipo creado");
      })
      .catch(err => {
        console.log(err);
        alert("❌ Error al crear tipo");
      });
  };
  
  const eliminarCategoria = (id) => {
    if (!window.confirm("¿Eliminar categoría?")) return;
    api.delete(`/categorias/${id}`)
      .then(() => {
        cargarCategorias();
        alert("✅ Categoría eliminada");
      })
      .catch(err => {
        console.log(err);
        alert("❌ Error al eliminar categoría");
      });
  };
  
  const eliminarSubcategoria = (id) => {
    if (!window.confirm("¿Eliminar subcategoría?")) return;
    api.delete(`/subcategorias/${id}`)
      .then(() => {
        cargarSubcategorias();
        alert("✅ Subcategoría eliminada");
      })
      .catch(err => {
        console.log(err);
        alert("❌ Error al eliminar subcategoría");
      });
  };
  
  const eliminarTipo = (id) => {
    if (!window.confirm("¿Eliminar tipo?")) return;
    api.delete(`/tipos/${id}`)
      .then(() => {
        cargarTipos();
        alert("✅ Tipo eliminado");
      })
      .catch(err => {
        console.log(err);
        alert("❌ Error al eliminar tipo");
      });
  };
  
  const actualizarCategoria = (id) => {
    api.put(`/categorias/${id}`, { nombre: nombreCategoriaEditada })
      .then(() => {
        cargarCategorias();
        setEditandoCategoria(null);
        setNombreCategoriaEditada("");
        alert("✅ Categoría actualizada");
      })
      .catch(err => {
        console.log(err);
        alert("❌ Error al actualizar categoría");
      });
  };
  
  const actualizarSubcategoria = (id) => {
    api.put(`/subcategorias/${id}`, { nombre: nombreSubcategoriaEditada })
      .then(() => {
        cargarSubcategorias();
        setEditandoSubcategoria(null);
        setNombreSubcategoriaEditada("");
        alert("✅ Subcategoría actualizada");
      })
      .catch(err => {
        console.log(err);
        alert("❌ Error al actualizar subcategoría");
      });
  };
  
  const actualizarTipo = (id) => {
    if (!nombreTipoEditado || !subcategoriaParaTipoEditado) return alert("Completa los datos");
    api.put(`/tipos/${id}`, {
      nombre: nombreTipoEditado,
      subcategoria_id: subcategoriaParaTipoEditado
    })
      .then(() => {
        cargarTipos();
        setEditandoTipo(null);
        setNombreTipoEditado("");
        setSubcategoriaParaTipoEditado("");
        alert("✅ Tipo actualizado");
      })
      .catch(err => {
        console.log(err);
        alert("❌ Error al actualizar tipo");
      });
  };
  
  const toggleCategoriaDestacada = (cat) => {
    api.put(`/categorias/${cat.id}`, {
      destacada: cat.destacada === 1 || cat.destacada === true ? 0 : 1
    })
      .then(() => cargarCategorias())
      .catch(err => {
        console.log(err);
        alert("Error al actualizar categoría");
      });
  };
  
  // 🟢 FUNCIONES PARA EL MODAL
  const abrirModalEditar = (producto) => {
    const imagenesArr = producto.imagenes ? producto.imagenes.split(",") : [];
    const principal = imagenesArr[0] || "";
    const galeria = imagenesArr.slice(1);
    
    setForm({
      nombre: producto.nombre || "",
      descripcion: producto.descripcion || "",
      precio: producto.precio || "",
      precioOferta: producto.precioOferta || "",
      oferta: producto.oferta === 1 || producto.oferta === true,
      rebaja: producto.rebaja === 1 || producto.rebaja === true,
      stock: producto.stock || "",
      imagenes: producto.imagenes || "",
      categoria_id: producto.categoria_id || "",
      subcategoria_id: producto.subcategoria_id || "",
      tipo_id: producto.tipo_id || "",
      destacado: producto.destacado === 1 || producto.destacado === true,
      fichaTecnica: producto.fichaTecnica || "",
      especificaciones: producto.especificaciones || "",
      informacionAdicional: producto.informacionAdicional || "",
      sku: producto.sku || "",
      presentacion: producto.presentacion || "",
      ancho: producto.ancho || "",
      alto: producto.alto || "",
      grueso: producto.grueso || "",
      cobertura: producto.cobertura || "",
      tipoVenta: producto.tipoVenta || "pieza",
      piezasCaja: producto.piezasCaja || "",
      tipoCobertura: producto.tipoCobertura || "m2",
      variante: producto.variante || "",
      uso: producto.uso || "",
      aplicacion: producto.aplicacion || "",
      tipo_diseno: producto.tipo_diseno || "",
      material: producto.material || "",
      acabado: producto.acabado || "",
      tipo_instalacion: producto.tipo_instalacion || "",
      espesor_capa_desgaste: producto.espesor_capa_desgaste || ""
    });
    setSugerencias(producto.sugerencias ? JSON.parse(producto.sugerencias) : []);
    setPreviewPrincipal(principal);
    setPreviewsGaleria(galeria);
    setPreviewFicha(producto.fichaTecnica || "");
    setArchivoPrincipal(null);
    setArchivosGaleria([]);
    setArchivoFicha(null);
    setDuplicando(false);
    setModoEdicion(true);
    setProductoId(producto.id);
    setModalAbierto(true);
  };
  
  const abrirModalDuplicar = (producto) => {
    const imagenesArr = producto.imagenes ? producto.imagenes.split(",") : [];
    const principal = imagenesArr[0] || "";
    const galeria = imagenesArr.slice(1);
    
    setForm({
      nombre: (producto.nombre || "") + " (copia)",
      descripcion: producto.descripcion || "",
      precio: producto.precio || "",
      precioOferta: producto.precioOferta || "",
      oferta: producto.oferta === 1 || producto.oferta === true,
      rebaja: producto.rebaja === 1 || producto.rebaja === true,
      stock: producto.stock || "",
      imagenes: producto.imagenes || "",
      categoria_id: producto.categoria_id || "",
      subcategoria_id: producto.subcategoria_id || "",
      tipo_id: producto.tipo_id || "",
      destacado: producto.destacado === 1 || producto.destacado === true,
      fichaTecnica: producto.fichaTecnica || "",
      especificaciones: producto.especificaciones || "",
      informacionAdicional: producto.informacionAdicional || "",
      sku: (producto.sku || "") + "-COPY",
      presentacion: producto.presentacion || "",
      ancho: producto.ancho || "",
      alto: producto.alto || "",
      grueso: producto.grueso || "",
      cobertura: producto.cobertura || "",
      tipoVenta: producto.tipoVenta || "pieza",
      piezasCaja: producto.piezasCaja || "",
      tipoCobertura: producto.tipoCobertura || "m2",
      variante: producto.variante || "",
      uso: producto.uso || "",
      aplicacion: producto.aplicacion || "",
      tipo_diseno: producto.tipo_diseno || "",
      material: producto.material || "",
      acabado: producto.acabado || "",
      tipo_instalacion: producto.tipo_instalacion || "",
      espesor_capa_desgaste: producto.espesor_capa_desgaste || ""
    });
    setSugerencias(producto.sugerencias ? JSON.parse(producto.sugerencias) : []);
    setPreviewPrincipal(principal);
    setPreviewsGaleria(galeria);
    setPreviewFicha(producto.fichaTecnica || "");
    setArchivoPrincipal(null);
    setArchivosGaleria([]);
    setArchivoFicha(null);
    setDuplicando(true);
    setModoEdicion(false);
    setProductoId(null);
    setModalAbierto(true);
  };
  
  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setDuplicando(false);
    setProductoId(null);
    setForm({
      nombre: "",
      descripcion: "",
      precio: "",
      precioOferta: "",
      oferta: false,
      rebaja: false,
      stock: "",
      imagenes: "",
      categoria_id: "",
      subcategoria_id: "",
      tipo_id: "",
      destacado: false,
      nuevo: false,
      fichaTecnica: "",
      sku: "",
      presentacion: "",
      ancho: "",
      alto: "",
      grueso: "",
      cobertura: "",
      tipoVenta: "pieza",
      tipoCobertura: "m2",
      piezasCaja: "",
      especificaciones: "",
      informacionAdicional: "",
      variante: "",
      uso: "",
      aplicacion: "",
      tipo_diseno: "",
      material: "",
      acabado: "",
      tipo_instalacion: "",
      espesor_capa_desgaste: ""
    });
    setSugerencias([]);
    setPreviewPrincipal("");
    setPreviewsGaleria([]);
    setPreviewFicha("");
    setArchivoPrincipal(null);
    setArchivosGaleria([]);
    setArchivoFicha(null);
  };
  
  // 🟢 CREAR PRODUCTO
  const crearProducto = async () => {
    try {
      let todasLasImagenes = form.imagenes ? form.imagenes.split(",") : [];
      
      if (archivoPrincipal) {
        const formData = new FormData();
        formData.append("imagenes", archivoPrincipal);
        const uploadRes = await api.post("/upload-productos", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        const newUrl = uploadRes.data[0];
        if (todasLasImagenes.length > 0) {
          todasLasImagenes[0] = newUrl;
        } else {
          todasLasImagenes = [newUrl];
        }
      }
      
      if (archivosGaleria.length > 0) {
        const formData = new FormData();
        archivosGaleria.forEach(imagen => formData.append("imagenes", imagen));
        const uploadRes = await api.post("/upload-productos", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        todasLasImagenes = todasLasImagenes.concat(uploadRes.data);
      }
      
      let fichaUrl = form.fichaTecnica || "";
      if (archivoFicha) {
        const formData = new FormData();
        formData.append("ficha", archivoFicha);
        const uploadRes = await api.post("/upload-ficha", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        fichaUrl = uploadRes.data.url;
      }
      
      const imagenesString = todasLasImagenes.join(",");
      
      await api.post("/productos", {
        ...form,
        imagenes: imagenesString,
        fichaTecnica: fichaUrl,
        sugerencias
      });
      cargar();
      cerrarModal();
      alert("✅ Producto creado");
    } catch (err) {
      console.log(err);
      alert("❌ Error al crear producto");
    }
  };
  
  // 🟣 ACTUALIZAR PRODUCTO
  const actualizarProducto = async () => {
    try {
      let todasLasImagenes = [];
      const imagenesExistentes = form.imagenes ? form.imagenes.split(",") : [];
      
      if (archivoPrincipal) {
        const formData = new FormData();
        formData.append("imagenes", archivoPrincipal);
        const uploadRes = await api.post("/upload-productos", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        todasLasImagenes.push(uploadRes.data[0]);
      } else if (imagenesExistentes.length > 0) {
        todasLasImagenes.push(imagenesExistentes[0]);
      }
      
      if (archivosGaleria.length > 0) {
        const formData = new FormData();
        archivosGaleria.forEach(imagen => formData.append("imagenes", imagen));
        const uploadRes = await api.post("/upload-productos", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        todasLasImagenes = todasLasImagenes.concat(uploadRes.data);
      } else {
        const galeriaExistente = imagenesExistentes.slice(1);
        todasLasImagenes = todasLasImagenes.concat(galeriaExistente);
      }
      
      let fichaUrl = form.fichaTecnica;
      if (archivoFicha) {
        const formData = new FormData();
        formData.append("ficha", archivoFicha);
        const uploadRes = await api.post("/upload-ficha", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        fichaUrl = uploadRes.data.url;
      }
      
      const imagenesString = todasLasImagenes.join(",");
      
      await api.put(`/productos/${productoId}`, {
        ...form,
        imagenes: imagenesString,
        fichaTecnica: fichaUrl,
        sugerencias
      });
      cargar();
      cerrarModal();
      alert("✅ Producto actualizado");
    } catch (err) {
      console.log(err);
      alert("❌ Error al actualizar");
    }
  };
  
  // 🔘 MANEJADOR GUARDAR (desde el modal)
  const handleGuardarModal = () => {
    if (modoEdicion) {
      actualizarProducto();
    } else {
      crearProducto();
    }
  };
  
  // 🔴 ELIMINAR PRODUCTO
  const eliminar = (id) => {
    if (!window.confirm("¿Eliminar producto?")) return;
    api.delete(`/productos/${id}`).then(() => cargar());
  };
  
  // 🟢 BANNERS PRINCIPALES
  const crearBanner = async () => {
    try {
      let imagenBanner = "";
      if (archivoBanner) {
        const formData = new FormData();
        formData.append("imagen", archivoBanner);
        const uploadRes = await api.post("/upload-banner", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        imagenBanner = uploadRes.data.imagen;
      }
      await api.post("/banners", {
        ...bannerForm,
        imagen: imagenBanner
      });
      cargarBanners();
      setBannerForm({ titulo: "", descripcion: "", imagen: "", categoria: "", subcategoria: "" });
      setArchivoBanner(null);
      setPreviewBanner("");
      alert("✅ Banner creado");
    } catch (err) {
      console.log(err);
      alert("❌ Error creando banner");
    }
  };
  
  const eliminarBanner = (id) => {
    api.delete(`/banners/${id}`).then(() => cargarBanners());
  };
  
  const eliminarContacto = (id) => {
    if (!window.confirm("¿Eliminar mensaje?")) return;
    api.delete(`/contactos/${id}`)
      .then(() => cargarContactos())
      .catch(console.log);
  };
  
  const toggleVisibleProducto = (producto) => {
    api.put(`/productos/${producto.id}/visible`, {
      visible: producto.visible === 1 || producto.visible === true ? 0 : 1
    })
      .then(() => cargar())
      .catch(err => {
        console.log(err);
        alert("Error al cambiar visibilidad");
      });
  };

  // 📋 FUNCIONES PARA PEDIDOS
  const actualizarEstadoPedido = async (id, estado) => {
    if (!window.confirm(`¿Cambiar estado del pedido a "${estado}"?`)) return;
    
    try {
      const res = await api.put(`/pedidos/${id}/estado`, { estado });
      
      if (res.data.success) {
        alert(`✅ Estado actualizado a "${estado}". Se envió correo al cliente.`);
        cargarPedidos();
        // Si el detalle está abierto, actualizarlo
        if (mostrarDetallePedido && pedidoSeleccionado && pedidoSeleccionado.id === id) {
          const detalleRes = await api.get(`/pedidos/${id}`);
          setPedidoSeleccionado(detalleRes.data);
        }
      }
    } catch (err) {
      console.error(err);
      alert("❌ Error al actualizar estado");
    }
  };

  const verDetallePedido = async (id) => {
    try {
      const res = await api.get(`/pedidos/${id}`);
      setPedidoSeleccionado(res.data);
      setMostrarDetallePedido(true);
    } catch (err) {
      console.error("Error cargando detalle:", err);
      alert("❌ Error al cargar detalle del pedido");
    }
  };

  // 🗑️ FUNCIÓN PARA ELIMINAR PEDIDOS
  const eliminarPedido = async (id) => {
    if (!window.confirm("⚠️ ¿Estás seguro de eliminar este pedido? Esta acción no se puede deshacer.")) return;
    
    try {
      await api.delete(`/pedidos/${id}`);
      
      // Actualizar la lista de pedidos
      setPedidos(pedidos.filter(pedido => pedido.id !== id));
      
      // Si el pedido eliminado es el que se está viendo en detalle, cerrar el detalle
      if (pedidoSeleccionado && pedidoSeleccionado.id === id) {
        setMostrarDetallePedido(false);
        setPedidoSeleccionado(null);
      }
      
      alert("✅ Pedido eliminado correctamente");
    } catch (err) {
      console.error("Error al eliminar pedido:", err);
      alert("❌ Error al eliminar el pedido. Intenta nuevamente.");
    }
  };

  // Función para obtener la imagen de un producto
  const obtenerImagenProducto = (producto) => {
    if (!producto) return "https://via.placeholder.com/60";
    if (producto.imagenes && producto.imagenes.trim() !== "") {
      const imagenes = producto.imagenes.split(",");
      return imagenes[0].trim();
    }
    return producto.imagen || "https://via.placeholder.com/60";
  };

  // 🔍 FILTRAR PRODUCTOS POR BÚSQUEDA
  const productosFiltrados = productos.filter(p => {
    const term = busqueda.toLowerCase().trim();
    if (!term) return true;
    const nombre = (p.nombre || "").toLowerCase();
    const sku = (p.sku || "").toLowerCase();
    return nombre.includes(term) || sku.includes(term);
  });

  // 🎨 Función para renderizar el formulario de producto
  const renderFormularioProducto = () => (
    <div className="form-grid">
      <input
        name="nombre"
        placeholder="Nombre"
        value={form.nombre}
        onChange={handleChange}
        className="form-input"
      />
      <textarea
        name="descripcion"
        placeholder="Descripción"
        value={form.descripcion}
        onChange={handleChange}
        className="form-textarea"
      />
      <input
        name="precio"
        placeholder="Precio"
        value={form.precio}
        onChange={handleChange}
        className="form-input"
      />
      <input
        name="precioOferta"
        placeholder="Precio oferta"
        value={form.precioOferta}
        onChange={handleChange}
        className="form-input"
      />
      <input
        name="stock"
        placeholder="Stock"
        value={form.stock}
        onChange={handleChange}
        className="form-input"
      />
      <input
        name="sku"
        placeholder="SKU del producto"
        value={form.sku}
        onChange={handleChange}
        className="form-input"
      />
      
      <select
        name="tipoVenta"
        value={form.tipoVenta}
        onChange={handleChange}
        className="form-input"
      >
        <option value="pieza">Pieza</option>
        <option value="caja">Caja</option>
        <option value="rollo">Rollo</option>
        <option value="tramo">Tramo</option>
        <option value="unidad">Unidad</option>
        <option value="otros">Otros</option>
      </select>

      {form.tipoVenta === "caja" && (
        <input
          name="piezasCaja"
          placeholder="¿Cuántas piezas trae la caja?"
          value={form.piezasCaja}
          onChange={handleChange}
          className="form-input"
        />
      )}

      {form.tipoVenta === "otros" ? (
        <div>
          <label className="form-label">🧴 Presentación</label>
          <select
            name="presentacion"
            value={form.presentacion}
            onChange={handleChange}
            className="form-input"
          >
            <option value="">Selecciona presentación</option>
            <option value="250ml">250 ml</option>
            <option value="500ml">500 ml</option>
            <option value="1L">1 Litro</option>
            <option value="3.6L">3.6 Litros</option>
            <option value="4L">4 Litros</option>
            <option value="19L">19 Litros</option>
          </select>
        </div>
      ) : (
        <div className="input-group">
          <div>
            <label className="form-label">📏 Ancho (cm)</label>
            <input
              name="ancho"
              placeholder="Ej: 50"
              value={form.ancho}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">📏 Alto (cm)</label>
            <input
              name="alto"
              placeholder="Ej: 50"
              value={form.alto}
              onChange={handleChange}
              className="form-input"
            />
          </div>
          <div>
            <label className="form-label">📏 Grueso</label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                name="grueso"
                placeholder="Ej: 0.5, 1, 2, 3"
                value={form.grueso}
                onChange={handleChange}
                className="form-input"
                style={{ flex: 1 }}
              />
              <select
                name="unidadGrueso"
                value={form.unidadGrueso || 'mm'}
                onChange={handleChange}
                className="form-input"
                style={{ width: '80px', flexShrink: 0 }}
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="m">m</option>
              </select>
            </div>
            <small style={{ color: '#6b7280', fontSize: '12px' }}>
              💡 Ejemplos: 0.5mm (para pisos vinílicos), 2mm (para SPC), 3mm (para LVT)
            </small>
          </div>
        </div>
      )}

      <div className="input-group">
        <div>
          <label className="form-label">📦 Cobertura</label>
          <input
            name="cobertura"
            placeholder="Ej: 1.5"
            value={form.cobertura}
            onChange={handleChange}
            className="form-input"
          />
        </div>
        <div>
          <label className="form-label">📏 Unidad</label>
          <select
            name="tipoCobertura"
            value={form.tipoCobertura}
            onChange={handleChange}
            className="form-input"
          >
            <option value="m2">m²</option>
            <option value="ml">Lineal (ml)</option>
          </select>
        </div>
      </div>

      <select
        name="categoria_id"
        value={form.categoria_id}
        onChange={handleChange}
        className="form-input"
      >
        <option value="">Selecciona categoría</option>
        {categorias.map(cat => (
          <option key={cat.id} value={cat.id}>{cat.nombre}</option>
        ))}
      </select>

      <select
        name="subcategoria_id"
        value={form.subcategoria_id}
        onChange={handleChange}
        className="form-input"
      >
        <option value="">Selecciona subcategoría</option>
        {subcategorias
          .filter(sub => String(sub.categoria_id) === String(form.categoria_id))
          .map(sub => (
            <option key={sub.id} value={sub.id}>{sub.nombre}</option>
          ))}
      </select>

      <select
        name="tipo_id"
        value={form.tipo_id}
        onChange={handleChange}
        className="form-input"
      >
        <option value="">Selecciona Tipo</option>
        {tipos
          .filter(tipo => String(tipo.subcategoria_id) === String(form.subcategoria_id))
          .map(tipo => (
            <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
          ))}
      </select>

      <input
        name="variante"
        placeholder="Variante (opcional)"
        value={form.variante}
        onChange={handleChange}
        className="form-input"
      />

      <select
        name="uso"
        value={form.uso}
        onChange={handleChange}
        className="form-input"
      >
        <option value="">Selecciona uso</option>
        <option value="interior">Interior</option>
        <option value="exterior">Exterior</option>
      </select>

      <select
        name="aplicacion"
        value={form.aplicacion}
        onChange={handleChange}
        className="form-input"
      >
        <option value="">Selecciona aplicación</option>
        <option value="Escolar">Escolar</option>
        <option value="Médico">Médico</option>
        <option value="Hotelero">Hotelero</option>
        <option value="Industrial">Industrial</option>
        <option value="Recreativo">Recreativo</option>
        <option value="Corporativo">Corporativo</option>
        <option value="Residencial">Residencial</option>
        <option value="Comercial">Comercial</option>
        <option value="Vivienda social">Hogar</option>
      </select>

      <select
        name="tipo_diseno"
        value={form.tipo_diseno}
        onChange={handleChange}
        className="form-input"
      >
        <option value="">Selecciona tipo de diseño</option>
        <option value="Madera">Madera</option>
        <option value="Mármol">Mármol</option>
        <option value="Piedra">Piedra</option>
        <option value="Cemento">Cemento</option>
        <option value="Concreto">Concreto</option>
        <option value="Granito">Granito</option>
        <option value="Terrazo">Terrazo</option>
        <option value="Liso">Liso</option>
        <option value="Geométrico">Geométrico</option>
        <option value="Lineal">Lineal</option>
        <option value="Rayado">Rayado</option>
        <option value="Tejido">Tejido</option>
        <option value="Natural">Natural</option>
        <option value="Rústico">Rústico</option>
        <option value="Moderno">Moderno</option>
        <option value="Vintage">Vintage</option>
        <option value="Fantasía">Fantasía</option>
        <option value="Baldosa">Baldosa</option>
      </select>

      <select
        name="material"
        value={form.material}
        onChange={handleChange}
        className="form-input"
      >
        <option value="">Selecciona material</option>
        <option value="PVC">PVC</option>
        <option value="SPC">SPC</option>
        <option value="LVT">LVT</option>
        <option value="Vinílico">Vinílico</option>
        <option value="Laminado">Laminado</option>
        <option value="MDF">MDF</option>
        <option value="HDF">HDF</option>
        <option value="Madera">Madera</option>
        <option value="Aluminio">Aluminio</option>
        <option value="Poliéster">Poliéster</option>
        <option value="Tela">Tela</option>
        <option value="Fibra sintética">Fibra sintética</option>
        <option value="Nylon">Nylon</option>
        <option value="Polipropileno">Polipropileno</option>
        <option value="Polietileno">Polietileno</option>
        <option value="Cerámica">Cerámica</option>
        <option value="Porcelanato">Porcelanato</option>
        <option value="Caucho">Caucho</option>
        <option value="Bambú">Bambú</option>
      </select>

      <select
        name="acabado"
        value={form.acabado}
        onChange={handleChange}
        className="form-input"
      >
        <option value="">Selecciona acabado</option>
        <option value="Mate">Mate</option>
        <option value="Brillante">Brillante</option>
        <option value="Satinado">Satinado</option>
        <option value="Texturizado">Texturizado</option>
        <option value="Natural">Natural</option>
        <option value="Rústico">Rústico</option>
        <option value="Pulido">Pulido</option>
        <option value="Cepillado">Cepillado</option>
        <option value="Antideslizante">Antideslizante</option>
        <option value="Impermeable">Impermeable</option>
        <option value="Resistente a rayos UV">Resistente a rayos UV</option>
      </select>

      <select
        name="tipo_instalacion"
        value={form.tipo_instalacion}
        onChange={handleChange}
        className="form-input"
      >
        <option value="">Selecciona tipo de instalación</option>
        <option value="Click">Click</option>
        <option value="Pegado">Pegado</option>
        <option value="Autoadherible">Autoadherible</option>
        <option value="Flotante">Flotante</option>
        <option value="En rollo">En rollo</option>
        <option value="Atornillado">Atornillado</option>
        <option value="Clavado">Clavado</option>
        <option value="Con riel">Con riel</option>
        <option value="Con soportes">Con soportes</option>
        <option value="Empotrado">Empotrado</option>
        <option value="Manual">Manual</option>
        <option value="Motorizado">Motorizado</option>
      </select>

      <div>
        <label className="form-label">📏 Espesor capa de desgaste (mm)</label>
        <input
          name="espesor_capa_desgaste"
          placeholder="Ej: 0.3, 0.5, 1.0, 2.0"
          value={form.espesor_capa_desgaste}
          onChange={handleChange}
          className="form-input"
        />
        <small style={{ color: '#6b7280', fontSize: '12px' }}>
          💡 Valores comunes: 0.3mm, 0.5mm, 0.7mm, 1.0mm, 1.5mm, 2.0mm
        </small>
      </div>

      <div className="form-group">
        <label className="form-label">Productos sugeridos</label>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            multiple
            value={sugerencias}
            onChange={(e) =>
              setSugerencias([...e.target.selectedOptions].map(option => option.value))
            }
            className="form-multiselect"
            style={{ flex: 1 }}
          >
            {productos.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          <button
            className="btn-delete"
            onClick={() => setSugerencias([])}
            style={{ padding: '8px 16px', height: 'fit-content' }}
          >
            🗑 Limpiar
          </button>
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">🖼 Imagen principal (miniatura)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImagenPrincipal}
          className="form-input"
        />
        {previewPrincipal && (
          <div>
            <p className="form-label">Vista previa (principal)</p>
            <img src={previewPrincipal} alt="Principal" className="preview-image" style={{ maxHeight: '150px' }} />
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">🖼 Galería de imágenes (adicionales)</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleGaleria}
          className="form-input"
        />
        {previewsGaleria.length > 0 && (
          <div>
            <p className="form-label">Vista previa (galería)</p>
            <div className="image-grid">
              {previewsGaleria.map((img, i) => (
                <img key={i} src={img} alt={`galeria-${i}`} className="preview-thumb" />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">📄 Ficha técnica</label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={handleFichaTecnica}
          className="form-input"
        />
        {previewFicha && (
          <div>
            <p className="form-label">Vista previa ficha técnica</p>
            {previewFicha.endsWith(".pdf") ? (
              <object data={previewFicha} type="application/pdf" width="100%" height="300px">
                <p>No se puede mostrar el PDF, <a href={previewFicha} target="_blank" rel="noopener noreferrer">descárgalo aquí</a></p>
              </object>
            ) : (
              <img src={previewFicha} alt="Ficha" className="preview-image" />
            )}
          </div>
        )}
      </div>

      <textarea
        name="especificaciones"
        placeholder="Especificaciones"
        value={form.especificaciones}
        onChange={handleChange}
        className="form-textarea"
      />

      <textarea
        name="informacionAdicional"
        placeholder="Información adicional"
        value={form.informacionAdicional}
        onChange={handleChange}
        className="form-textarea"
      />

      <div className="checkbox-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="destacado"
            checked={form.destacado}
            onChange={handleChange}
          />
          Producto destacado
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="oferta"
            checked={form.oferta}
            onChange={handleChange}
          />
          Producto en oferta
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="rebaja"
            checked={form.rebaja}
            onChange={handleChange}
          />
          Producto en rebaja
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="nuevo"
            checked={form.nuevo}
            onChange={handleChange}
          />
          Producto nuevo
        </label>
      </div>

      <button className="btn-primary" onClick={handleGuardarModal}>
        {modoEdicion ? "Actualizar producto" : "Crear producto"}
      </button>
    </div>
  );

  // Renderizado principal
  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="header-content">
          <h1>🟣 Panel Admin</h1>
          <p className="header-subtitle">Gestiona tu tienda desde un solo lugar</p>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <span className="stat-number">{productos.length}</span>
          <span className="stat-label">Productos</span>
        </div>
        <div className="stat-card stat-purple">
          <span className="stat-number">{categorias.length}</span>
          <span className="stat-label">Categorías</span>
        </div>
        <div className="stat-card stat-green">
          <span className="stat-number">{subcategorias.length}</span>
          <span className="stat-label">Subcategorías</span>
        </div>
        <div className="stat-card stat-indigo">
          <span className="stat-number">{tipos.length}</span>
          <span className="stat-label">Tipos</span>
        </div>
        <div className="stat-card stat-orange">
          <span className="stat-number">{banners.length}</span>
          <span className="stat-label">Banners</span>
        </div>
        <div className="stat-card stat-red">
          <span className="stat-number">{contactos.length}</span>
          <span className="stat-label">Mensajes</span>
        </div>
        <div className="stat-card" style={{ borderColor: '#2563eb' }}>
          <span className="stat-number" style={{ color: '#2563eb' }}>{pedidos.length}</span>
          <span className="stat-label">📋 Pedidos</span>
        </div>
      </div>

      <div className="top-forms">
        <section className="section-card">
          <h2>📂 Crear categoría</h2>
          <div className="form-group">
            <input
              placeholder="Nombre categoría"
              value={nuevaCategoria}
              onChange={(e) => setNuevaCategoria(e.target.value)}
              className="form-input"
            />
            <button className="btn-primary" onClick={crearCategoria}>
              Crear categoría
            </button>
          </div>
        </section>

        <section className="section-card">
          <h2>📁 Crear subcategoría</h2>
          <div className="form-group">
            <select
              value={categoriaSeleccionada}
              onChange={(e) => setCategoriaSeleccionada(e.target.value)}
              className="form-input"
            >
              <option value="">Selecciona categoría</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
            <input
              placeholder="Nombre subcategoría"
              value={nuevaSubcategoria}
              onChange={(e) => setNuevaSubcategoria(e.target.value)}
              className="form-input"
            />
            <button className="btn-primary" onClick={crearSubcategoria}>
              Crear subcategoría
            </button>
          </div>
        </section>

        <section className="section-card">
          <h2>🏷️ Crear Tipo</h2>
          <div className="form-group">
            <select
              value={subcategoriaSeleccionadaParaTipo}
              onChange={(e) => setSubcategoriaSeleccionadaParaTipo(e.target.value)}
              className="form-input"
            >
              <option value="">Selecciona subcategoría</option>
              {subcategorias.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.nombre} ({categorias.find(c => c.id === sub.categoria_id)?.nombre})
                </option>
              ))}
            </select>
            <input
              placeholder="Nombre del Tipo (ej: A, B, C, Premium)"
              value={nuevoTipo}
              onChange={(e) => setNuevoTipo(e.target.value)}
              className="form-input"
            />
            <button className="btn-primary" onClick={crearTipo}>
              Crear Tipo
            </button>
          </div>
        </section>
      </div>

      <section className="section-card">
        <h2>📂 Categorías</h2>
        {categorias.map(cat => (
          <div key={cat.id} className="category-item">
            <div className="category-name">
              {editandoCategoria === cat.id ? (
                <input
                  value={nombreCategoriaEditada}
                  onChange={(e) => setNombreCategoriaEditada(e.target.value)}
                  className="form-input"
                />
              ) : (
                <strong>{cat.nombre}</strong>
              )}
            </div>
            <div className="category-actions">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={cat.destacada === 1 || cat.destacada === true}
                  onChange={() => toggleCategoriaDestacada(cat)}
                />
                Destacada
              </label>
              {editandoCategoria === cat.id ? (
                <button className="btn-edit" onClick={() => actualizarCategoria(cat.id)}>
                  💾 Guardar
                </button>
              ) : (
                <button className="btn-edit" onClick={() => {
                  setEditandoCategoria(cat.id);
                  setNombreCategoriaEditada(cat.nombre);
                }}>
                  ✏️ Editar
                </button>
              )}
              <button className="btn-delete" onClick={() => eliminarCategoria(cat.id)}>
                🗑 Eliminar
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="section-card">
        <h2>📁 Subcategorías</h2>
        {subcategorias.map(sub => (
          <div key={sub.id} className="category-item">
            <div className="category-name">
              {editandoSubcategoria === sub.id ? (
                <input
                  value={nombreSubcategoriaEditada}
                  onChange={(e) => setNombreSubcategoriaEditada(e.target.value)}
                  className="form-input"
                />
              ) : (
                <div>
                  <strong>{sub.nombre}</strong>
                  <p className="text-muted">
                    {categorias.find(c => c.id === sub.categoria_id)?.nombre}
                  </p>
                </div>
              )}
            </div>
            <div className="category-actions">
              {editandoSubcategoria === sub.id ? (
                <button className="btn-edit" onClick={() => actualizarSubcategoria(sub.id)}>
                  💾 Guardar
                </button>
              ) : (
                <button className="btn-edit" onClick={() => {
                  setEditandoSubcategoria(sub.id);
                  setNombreSubcategoriaEditada(sub.nombre);
                }}>
                  ✏️ Editar
                </button>
              )}
              <button className="btn-delete" onClick={() => eliminarSubcategoria(sub.id)}>
                🗑 Eliminar
              </button>
            </div>
          </div>
        ))}
      </section>

      <section className="section-card">
        <h2>🏷️ Tipos</h2>
        {tipos.map(tipo => (
          <div key={tipo.id} className="category-item">
            <div className="category-name">
              {editandoTipo === tipo.id ? (
                <div>
                  <input
                    value={nombreTipoEditado}
                    onChange={(e) => setNombreTipoEditado(e.target.value)}
                    className="form-input"
                    placeholder="Nombre del tipo"
                  />
                  <select
                    value={subcategoriaParaTipoEditado}
                    onChange={(e) => setSubcategoriaParaTipoEditado(e.target.value)}
                    className="form-input"
                    style={{ marginTop: '8px' }}
                  >
                    <option value="">Selecciona subcategoría</option>
                    {subcategorias.map(sub => (
                      <option key={sub.id} value={sub.id}>
                        {sub.nombre} ({categorias.find(c => c.id === sub.categoria_id)?.nombre})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <strong>{tipo.nombre}</strong>
                  <p className="text-muted">
                    {subcategorias.find(s => s.id === tipo.subcategoria_id)?.nombre} - 
                    {categorias.find(c => c.id === subcategorias.find(s => s.id === tipo.subcategoria_id)?.categoria_id)?.nombre}
                  </p>
                </div>
              )}
            </div>
            <div className="category-actions">
              {editandoTipo === tipo.id ? (
                <button className="btn-edit" onClick={() => actualizarTipo(tipo.id)}>
                  💾 Guardar
                </button>
              ) : (
                <button className="btn-edit" onClick={() => {
                  setEditandoTipo(tipo.id);
                  setNombreTipoEditado(tipo.nombre);
                  setSubcategoriaParaTipoEditado(tipo.subcategoria_id);
                }}>
                  ✏️ Editar
                </button>
              )}
              <button className="btn-delete" onClick={() => eliminarTipo(tipo.id)}>
                🗑 Eliminar
              </button>
            </div>
          </div>
        ))}
        {tipos.length === 0 && (
          <p className="empty-state">No hay tipos creados</p>
        )}
      </section>

      {/* FORMULARIO DE PRODUCTO (solo se muestra si NO hay modal abierto) */}
      {!modalAbierto && (
        <section className="section-card">
          <h2>➕ Crear producto</h2>
          {renderFormularioProducto()}
        </section>
      )}

      {/* MODAL */}
      {modalAbierto && (
        <div className="modal-overlay" onClick={cerrarModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modoEdicion ? "✏️ Editar producto" : "📋 Duplicar / Crear producto"}</h2>
              <button className="modal-close" onClick={cerrarModal}>✕</button>
            </div>
            <div className="modal-body">
              {renderFormularioProducto()}
            </div>
          </div>
        </div>
      )}

      {/* ⏰ SECCIÓN DE CONFIGURACIÓN DEL TEMPORIZADOR */}
      <section className="section-card timer-section">
        <h2>⏰ Configurar tiempo de ofertas</h2>
        <p>Selecciona la fecha y hora de finalización</p>
        <input
          type="datetime-local"
          value={fechaOferta}
          onChange={(e) => setFechaOferta(e.target.value)}
          className="form-input"
        />
        <button
          className="btn-timer"
          onClick={() => {
            if (!fechaOferta) return alert("Selecciona una fecha");
            const fecha = new Date(fechaOferta);
            if (isNaN(fecha.getTime())) return alert("Fecha inválida");
            localStorage.setItem("fechaOferta", fecha.toISOString());
            alert("✅ Tiempo guardado correctamente");
          }}
        >
          💾 Guardar configuración
        </button>
        {fechaOferta && (
          <p style={{ marginTop: "12px", fontSize: "14px", color: "#94a3b8" }}>
            📅 Fecha actual configurada: {new Date(fechaOferta).toLocaleString("es-MX")}
          </p>
        )}
      </section>

      {/* 🔍 LISTA DE PRODUCTOS CON BUSCADOR */}
      <section className="section-card">
        <h2>📦 Lista productos</h2>
        <div style={{ marginBottom: "20px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre o SKU..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="form-input"
            style={{ flex: "1", minWidth: "200px" }}
          />
          {busqueda && (
            <button
              className="btn-edit"
              onClick={() => setBusqueda("")}
              style={{ background: "#6b7280", whiteSpace: "nowrap" }}
            >
              ✕ Limpiar
            </button>
          )}
          <span style={{ alignSelf: "center", fontSize: "14px", color: "#6b7280" }}>
            {productosFiltrados.length} de {productos.length} productos
          </span>
        </div>

        {productosFiltrados.length === 0 && busqueda && (
          <div className="empty-state">No se encontraron productos con "{busqueda}"</div>
        )}

        {productosFiltrados.map(p => {
          const imagenesArr = p.imagenes ? p.imagenes.split(",") : [];
          const principal = imagenesArr[0] || "https://via.placeholder.com/120";
          return (
            <div key={p.id} className="product-card">
              <div className="product-info">
                <img
                  src={principal}
                  alt={p.nombre}
                  className="product-image"
                  onError={(e) => e.target.src = "https://via.placeholder.com/120"}
                />
                <div className="product-details">
                  <h3>{p.nombre}</h3>
                  <p>🔖 SKU: {p.sku}</p>
                  {p.variante && <p className="text-muted">🔖 Variante: {p.variante}</p>}
                  {p.tipo_id && tipos.find(t => t.id === p.tipo_id) && (
                    <p>🏷️ Tipo: {tipos.find(t => t.id === p.tipo_id)?.nombre}</p>
                  )}
                  <div className="status-badge">
                    {p.visible === 0 || p.visible === false ? (
                      <span className="badge-hidden">🚫 Oculto</span>
                    ) : (
                      <span className="badge-visible">👁 Visible</span>
                    )}
                  </div>
                  {p.tipoVenta === "otros" ? (
                    <p>🧴 Presentación: {p.presentacion}</p>
                  ) : (
                    <p>📏 {p.ancho}cm x {p.alto}cm x {p.grueso}mm</p>
                  )}
                  <p>📦 Cobertura: {p.cobertura} {p.tipoCobertura}</p>
                  <p>🚚 Venta: {p.tipoVenta}</p>
                  <p>💲 {p.precio}</p>
                  <p>📂 Categoría: {p.categoria || "Sin categoría"}</p>
                  <p>📁 Subcategoría: {p.subcategoria || "Sin subcategoría"}</p>
                  {(p.oferta === 1 || p.oferta === true) && (
                    <p className="text-oferta">🔥 Oferta: ${p.precioOferta}</p>
                  )}
                  {(p.rebaja === 1 || p.rebaja === true) && (
                    <span className="badge-rebaja">🏷 Rebaja</span>
                  )}
                  <p>📦 Stock: {p.stock}</p>
                  {p.fichaTecnica && <p className="text-success">📄 Tiene ficha técnica</p>}
                  {(p.destacado === 1 || p.destacado === true) && (
                    <span className="badge-destacado">⭐ Destacado</span>
                  )}
                  
                  {p.uso && <p>🏠 Uso: {p.uso}</p>}
                  {p.aplicacion && <p>📋 Aplicación: {p.aplicacion}</p>}
                  {p.tipo_diseno && <p>🎨 Diseño: {p.tipo_diseno}</p>}
                  {p.material && <p>🧱 Material: {p.material}</p>}
                  {p.acabado && <p>✨ Acabado: {p.acabado}</p>}
                  {p.tipo_instalacion && <p>🔧 Instalación: {p.tipo_instalacion}</p>}
                  {p.espesor_capa_desgaste && <p>📏 Espesor capa desgaste: {p.espesor_capa_desgaste} mm</p>}
                </div>
              </div>

              {p.sugerencias && JSON.parse(p.sugerencias).length > 0 && (
                <div className="sugerencias-container">
                  <strong>Recomendado para este producto</strong>
                  <div className="sugerencias-list">
                    {JSON.parse(p.sugerencias).map((id) => {
                      const prod = productos.find(x => x.id === Number(id));
                      if (!prod) return null;
                      const prodImagenes = prod.imagenes ? prod.imagenes.split(",") : [];
                      return (
                        <div key={id} className="sugerencia-card">
                          <img
                            src={prodImagenes[0] || "https://via.placeholder.com/80"}
                            alt={prod.nombre}
                            className="sugerencia-image"
                          />
                          <p className="sugerencia-name">{prod.nombre}</p>
                          <p className="sugerencia-price">${prod.precio}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="product-actions">
                <button className="btn-visibility" onClick={() => toggleVisibleProducto(p)}>
                  {p.visible ? "👁 Visible" : "🚫 Oculto"}
                </button>
                <button className="btn-edit" onClick={() => abrirModalEditar(p)}>✏️ Editar</button>
                <button className="btn-duplicate" onClick={() => abrirModalDuplicar(p)} style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontWeight: '700',
                  fontSize: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}>📋 Duplicar</button>
                <button className="btn-delete" onClick={() => eliminar(p.id)}>🗑 Eliminar</button>
              </div>
            </div>
          );
        })}
      </section>

      {/* ================================================= */}
      {/* 📋 SECCIÓN DE PEDIDOS */}
      {/* ================================================= */}
      <section className="section-card" style={{ borderTop: '4px solid #2563eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h2 style={{ margin: 0 }}>📋 Pedidos</h2>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={filtroEstadoPedido}
              onChange={(e) => setFiltroEstadoPedido(e.target.value)}
              className="form-input"
              style={{ width: 'auto', minWidth: '120px', padding: '8px 12px' }}
            >
              <option value="todos">📌 Todos</option>
              <option value="pendiente">⏳ Pendiente</option>
              <option value="confirmado">✅ Confirmado</option>
              <option value="en_preparacion">🔧 En preparación</option>
              <option value="listo">📦 Listo</option>
              <option value="entregado">🚚 Entregado</option>
              <option value="cancelado">❌ Cancelado</option>
            </select>
            <button className="btn-edit" onClick={cargarPedidos} style={{ background: '#2563eb' }}>
              🔄 Actualizar
            </button>
          </div>
        </div>

        {pedidos.length === 0 ? (
          <div className="empty-state">No hay pedidos registrados</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '14px',
              minWidth: '650px'
            }}>
              <thead>
                <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '700', color: '#374151' }}>📋 Pedido</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '700', color: '#374151' }}>👤 Cliente</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '700', color: '#374151' }}>📦 Productos</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '700', color: '#374151' }}>💰 Total</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '700', color: '#374151' }}>📅 Fecha</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontWeight: '700', color: '#374151' }}>📌 Estado</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', fontWeight: '700', color: '#374151' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pedidos
                  .filter(p => filtroEstadoPedido === 'todos' || p.estado === filtroEstadoPedido)
                  .map(pedido => {
                    const estadoColores = {
                      pendiente: { bg: '#fef3c7', color: '#92400e', label: '⏳ Pendiente' },
                      confirmado: { bg: '#dbeafe', color: '#1e40af', label: '✅ Confirmado' },
                      en_preparacion: { bg: '#fef3c7', color: '#92400e', label: '🔧 En preparación' },
                      listo: { bg: '#d1fae5', color: '#065f46', label: '📦 Listo' },
                      entregado: { bg: '#d1fae5', color: '#065f46', label: '🚚 Entregado' },
                      cancelado: { bg: '#fee2e2', color: '#991b1b', label: '❌ Cancelado' }
                    };
                    const estadoInfo = estadoColores[pedido.estado] || estadoColores.pendiente;

                    return (
                      <tr key={pedido.id} style={{ borderBottom: '1px solid #e5e7eb', transition: 'background 0.2s' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#fafbfc'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '12px 14px' }}>
                          <strong style={{ color: '#2563eb' }}>{pedido.numero_pedido}</strong>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ fontWeight: '600' }}>{pedido.cliente_nombre}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>{pedido.cliente_celular}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{ background: '#eef2ff', padding: '4px 10px', borderRadius: '12px', fontSize: '13px' }}>
                            {pedido.total_productos || 0} productos
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', fontWeight: '700', color: '#059669' }}>
                          ${pedido.total}
                        </td>
                        <td style={{ padding: '12px 14px', fontSize: '13px', color: '#6b7280' }}>
                          {new Date(pedido.fecha_pedido).toLocaleDateString('es-MX')}
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <span style={{
                            background: estadoInfo.bg,
                            color: estadoInfo.color,
                            padding: '4px 12px',
                            borderRadius: '16px',
                            fontSize: '12px',
                            fontWeight: '700',
                            display: 'inline-block'
                          }}>
                            {estadoInfo.label}
                          </span>
                        </td>
                        <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                            <button
                              className="btn-edit"
                              onClick={() => verDetallePedido(pedido.id)}
                              style={{ padding: '4px 10px', fontSize: '11px' }}
                            >
                              👁 Ver
                            </button>
                            <select
                              value={pedido.estado}
                              onChange={(e) => actualizarEstadoPedido(pedido.id, e.target.value)}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '8px',
                                border: '2px solid #e5e7eb',
                                fontSize: '11px',
                                background: '#fff',
                                cursor: 'pointer'
                              }}
                            >
                              <option value="pendiente">⏳ Pendiente</option>
                              <option value="confirmado">✅ Confirmado</option>
                              <option value="en_preparacion">🔧 Preparación</option>
                              <option value="listo">📦 Listo</option>
                              <option value="entregado">🚚 Entregado</option>
                              <option value="cancelado">❌ Cancelado</option>
                            </select>
                            {/* 👇 BOTÓN ELIMINAR PEDIDO */}
                            <button
                              className="btn-delete"
                              onClick={() => eliminarPedido(pedido.id)}
                              style={{ padding: '4px 10px', fontSize: '11px' }}
                            >
                              🗑 Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ================================================= */}
      {/* 📋 MODAL DE DETALLE DE PEDIDO CON IMÁGENES */}
      {/* ================================================= */}
      {mostrarDetallePedido && pedidoSeleccionado && (
        <div className="modal-overlay" onClick={() => setMostrarDetallePedido(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div className="modal-header">
              <h2>📋 Detalle del Pedido</h2>
              <button className="modal-close" onClick={() => setMostrarDetallePedido(false)}>✕</button>
            </div>
            <div className="modal-body">
              {/* Información del pedido */}
              <div style={{
                background: 'linear-gradient(135deg, #eef2ff, #ffffff)',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '16px',
                border: '1px solid #c7d2fe'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <strong style={{ color: '#6b7280', fontSize: '12px' }}>📋 Número de Pedido</strong>
                    <p style={{ fontWeight: '700', fontSize: '18px', color: '#2563eb', margin: '4px 0 0 0' }}>
                      {pedidoSeleccionado.numero_pedido}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: '#6b7280', fontSize: '12px' }}>📌 Estado</strong>
                    <p style={{ margin: '4px 0 0 0' }}>
                      <span style={{
                        background: (() => {
                          const colores = {
                            pendiente: '#fef3c7', confirmado: '#dbeafe', en_preparacion: '#fef3c7',
                            listo: '#d1fae5', entregado: '#d1fae5', cancelado: '#fee2e2'
                          };
                          return colores[pedidoSeleccionado.estado] || '#f1f5f9';
                        })(),
                        color: (() => {
                          const colores = {
                            pendiente: '#92400e', confirmado: '#1e40af', en_preparacion: '#92400e',
                            listo: '#065f46', entregado: '#065f46', cancelado: '#991b1b'
                          };
                          return colores[pedidoSeleccionado.estado] || '#374151';
                        })(),
                        padding: '4px 14px',
                        borderRadius: '16px',
                        fontSize: '14px',
                        fontWeight: '700',
                        display: 'inline-block'
                      }}>
                        {(pedidoSeleccionado.estado || 'pendiente').toUpperCase()}
                      </span>
                    </p>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginTop: '12px' }}>
                  <div>
                    <strong style={{ color: '#6b7280', fontSize: '12px' }}>👤 Cliente</strong>
                    <p style={{ margin: '4px 0 0 0', fontWeight: '600' }}>{pedidoSeleccionado.cliente_nombre}</p>
                  </div>
                  <div>
                    <strong style={{ color: '#6b7280', fontSize: '12px' }}>📧 Email</strong>
                    <p style={{ margin: '4px 0 0 0' }}>{pedidoSeleccionado.cliente_email}</p>
                  </div>
                  <div>
                    <strong style={{ color: '#6b7280', fontSize: '12px' }}>📱 Celular</strong>
                    <p style={{ margin: '4px 0 0 0' }}>{pedidoSeleccionado.cliente_celular}</p>
                  </div>
                </div>
                {pedidoSeleccionado.cliente_comentarios && (
                  <div style={{ marginTop: '10px' }}>
                    <strong style={{ color: '#6b7280', fontSize: '12px' }}>💬 Comentarios</strong>
                    <p style={{ margin: '4px 0 0 0', background: '#fff', padding: '8px 12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      {pedidoSeleccionado.cliente_comentarios}
                    </p>
                  </div>
                )}
                <div style={{ marginTop: '10px' }}>
                  <strong style={{ color: '#6b7280', fontSize: '12px' }}>📅 Fecha</strong>
                  <p style={{ margin: '4px 0 0 0' }}>
                    {new Date(pedidoSeleccionado.fecha_pedido).toLocaleString('es-MX', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>

              {/* Productos del pedido CON IMÁGENES */}
              <h3 style={{ marginTop: '16px', marginBottom: '12px', fontSize: '18px' }}>🛒 Productos</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px',
                  minWidth: '400px'
                }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Imagen</th>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>Producto</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Cantidad</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Precio</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedidoSeleccionado.productos && pedidoSeleccionado.productos.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={{ padding: '8px 10px' }}>
                          <img 
                            src={item.imagen || obtenerImagenProducto(item)}
                            alt={item.nombre}
                            style={{
                              width: '50px',
                              height: '50px',
                              objectFit: 'cover',
                              borderRadius: '8px',
                              border: '1px solid #e5e7eb'
                            }}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/50';
                            }}
                          />
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ fontWeight: '600' }}>{item.nombre}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>SKU: {item.sku || 'N/A'}</div>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>{item.cantidad}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right' }}>${item.precio}</td>
                        <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: '600' }}>${item.subtotal}</td>
                      </tr>
                    ))}
                    <tr style={{ borderTop: '2px solid #e5e7eb' }}>
                      <td colSpan="4" style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '700', fontSize: '16px' }}>
                        TOTAL:
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: '800', fontSize: '18px', color: '#059669' }}>
                        ${pedidoSeleccionado.total}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Botones de acción */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <select
                  value={pedidoSeleccionado.estado}
                  onChange={(e) => {
                    actualizarEstadoPedido(pedidoSeleccionado.id, e.target.value);
                    setMostrarDetallePedido(false);
                  }}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '2px solid #e5e7eb',
                    fontSize: '14px',
                    background: '#fff',
                    cursor: 'pointer',
                    flex: 1,
                    minWidth: '150px'
                  }}
                >
                  <option value="pendiente">⏳ Pendiente</option>
                  <option value="confirmado">✅ Confirmado</option>
                  <option value="en_preparacion">🔧 En preparación</option>
                  <option value="listo">📦 Listo</option>
                  <option value="entregado">🚚 Entregado</option>
                  <option value="cancelado">❌ Cancelado</option>
                </select>
                <button
                  className="btn-primary"
                  onClick={() => setMostrarDetallePedido(false)}
                  style={{ background: 'linear-gradient(135deg, #6b7280, #4b5563)', flex: 1, minWidth: '100px' }}
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="section-card">
        <h2>📩 Mensajes de Contacto</h2>
        {contactos.length === 0 ? (
          <div className="empty-state">No hay mensajes recibidos</div>
        ) : (
          contactos.map(contacto => (
            <div key={contacto.id} className="contact-card">
              <div className="contact-header">
                <div className="contact-header-info">
                  <h3>👤 {contacto.nombre}</h3>
                  <span className="contact-date">
                    {new Date(contacto.fecha).toLocaleString("es-MX")}
                  </span>
                </div>
                <button className="btn-delete" onClick={() => eliminarContacto(contacto.id)}>
                  🗑 Eliminar
                </button>
              </div>
              <div className="contact-grid">
                <div className="info-box">
                  <strong>📧 Correo</strong>
                  <p className="info-box-text">{contacto.correo}</p>
                </div>
                <div className="info-box">
                  <strong>📱 Teléfono</strong>
                  <p className="info-box-text">{contacto.telefono}</p>
                </div>
                {contacto.empresa && (
                  <div className="info-box">
                    <strong>🏢 Empresa</strong>
                    <p className="info-box-text">{contacto.empresa}</p>
                  </div>
                )}
              </div>
              <div className="message-box">
                <strong>💬 Mensaje</strong>
                <p className="message-text">{contacto.mensaje}</p>
              </div>
            </div>
          ))
        )}
      </section>

      {/* ================================================= */}
      {/* 🟠 BANNERS DE OFERTAS ESPECIALES */}
      {/* ================================================= */}
      <section className="section-card" style={{ borderTop: '4px solid #f59e0b' }}>
        <h2>🏷️ Banners de ofertas especiales</h2>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
          Estos banners se mostrarán en la sección de ofertas especiales del catálogo
        </p>
        
        <div className="form-grid">
          <input
            name="titulo"
            placeholder="Título (ej: 50% OFF)"
            value={bannerOfertaForm.titulo}
            onChange={handleBannerOfertaChange}
            className="form-input"
          />
          <textarea
            name="descripcion"
            placeholder="Descripción breve"
            value={bannerOfertaForm.descripcion}
            onChange={handleBannerOfertaChange}
            className="form-textarea"
          />
          <input
            name="porcentaje"
            placeholder="Porcentaje (ej: 50%)"
            value={bannerOfertaForm.porcentaje}
            onChange={handleBannerOfertaChange}
            className="form-input"
          />
          
          <select
            name="enlace_tipo"
            value={bannerOfertaForm.enlace_tipo}
            onChange={handleBannerOfertaChange}
            className="form-input"
          >
            <option value="categoria">📂 Categoría</option>
            <option value="subcategoria">📁 Subcategoría</option>
            <option value="tipo">🏷️ Tipo</option>
            <option value="producto">📦 Producto</option>
            <option value="url">🔗 URL Externa</option>
          </select>

          {bannerOfertaForm.enlace_tipo === 'categoria' && (
            <select
              name="categoria_id"
              value={bannerOfertaForm.categoria_id}
              onChange={handleBannerOfertaChange}
              className="form-input"
            >
              <option value="">Selecciona una categoría</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          )}

          {bannerOfertaForm.enlace_tipo === 'subcategoria' && (
            <select
              name="subcategoria_id"
              value={bannerOfertaForm.subcategoria_id}
              onChange={handleBannerOfertaChange}
              className="form-input"
            >
              <option value="">Selecciona una subcategoría</option>
              {subcategorias.map(sub => (
                <option key={sub.id} value={sub.id}>
                  {sub.nombre} ({categorias.find(c => c.id === sub.categoria_id)?.nombre})
                </option>
              ))}
            </select>
          )}

          {bannerOfertaForm.enlace_tipo === 'tipo' && (
            <select
              name="tipo_id"
              value={bannerOfertaForm.tipo_id}
              onChange={handleBannerOfertaChange}
              className="form-input"
            >
              <option value="">Selecciona un tipo</option>
              {tipos.map(tipo => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre} ({subcategorias.find(s => s.id === tipo.subcategoria_id)?.nombre})
                </option>
              ))}
            </select>
          )}

          {bannerOfertaForm.enlace_tipo === 'producto' && (
            <select
              name="producto_id"
              value={bannerOfertaForm.producto_id}
              onChange={handleBannerOfertaChange}
              className="form-input"
            >
              <option value="">Selecciona un producto</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} (SKU: {p.sku})
                </option>
              ))}
            </select>
          )}

          {bannerOfertaForm.enlace_tipo === 'url' && (
            <input
              name="url_externa"
              placeholder="URL externa (ej: https://tienda.com/oferta)"
              value={bannerOfertaForm.url_externa}
              onChange={handleBannerOfertaChange}
              className="form-input"
            />
          )}

          <select
            name="orden"
            value={bannerOfertaForm.orden}
            onChange={handleBannerOfertaChange}
            className="form-input"
          >
            <option value="1">Posición 1</option>
            <option value="2">Posición 2</option>
            <option value="3">Posición 3</option>
          </select>

          <input
            type="file"
            accept="image/*"
            onChange={handleBannerOfertaImagen}
            className="form-input"
          />
          
          {previewBannerOferta && (
            <div style={{ gridColumn: '1 / -1' }}>
              <p className="form-label">Vista previa</p>
              <img 
                src={previewBannerOferta} 
                alt="Preview banner oferta" 
                className="banner-preview" 
                style={{ maxHeight: '200px', objectFit: 'contain', background: '#f8fafc' }}
              />
            </div>
          )}
          
          <button 
            className="btn-primary" 
            onClick={crearBannerOferta}
            style={{ 
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              boxShadow: '0 4px 16px rgba(245, 158, 11, 0.3)'
            }}
          >
            🏷️ Crear banner de oferta
          </button>
        </div>
      </section>

      <section className="section-card">
        <h2>📋 Lista de banners de ofertas</h2>
        {bannersOfertas.length === 0 ? (
          <div className="empty-state">No hay banners de ofertas creados</div>
        ) : (
          bannersOfertas.map(b => {
            let destino = "";
            if (b.enlace_tipo === 'categoria' && b.categoria_id) {
              const cat = categorias.find(c => c.id === b.categoria_id);
              destino = `📂 Categoría: ${cat?.nombre || 'ID: ' + b.categoria_id}`;
            } else if (b.enlace_tipo === 'subcategoria' && b.subcategoria_id) {
              const sub = subcategorias.find(s => s.id === b.subcategoria_id);
              destino = `📁 Subcategoría: ${sub?.nombre || 'ID: ' + b.subcategoria_id}`;
            } else if (b.enlace_tipo === 'tipo' && b.tipo_id) {
              const tipo = tipos.find(t => t.id === b.tipo_id);
              destino = `🏷️ Tipo: ${tipo?.nombre || 'ID: ' + b.tipo_id}`;
            } else if (b.enlace_tipo === 'producto' && b.producto_id) {
              const prod = productos.find(p => p.id === b.producto_id);
              destino = `📦 Producto: ${prod?.nombre || 'ID: ' + b.producto_id}`;
            } else if (b.enlace_tipo === 'url') {
              destino = `🔗 URL: ${b.url_externa}`;
            }
            
            return (
              <div key={b.id} className="banner-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                <img 
                  src={b.imagen} 
                  alt={b.titulo} 
                  className="banner-image" 
                  style={{ width: '120px', height: '80px', objectFit: 'cover' }}
                />
                <div className="banner-info">
                  <h3 style={{ color: '#d97706' }}>🏷️ {b.titulo}</h3>
                  <p>{b.descripcion}</p>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {b.porcentaje && (
                      <span className="badge-rebaja" style={{ background: '#dc2626', padding: '2px 12px', borderRadius: '12px' }}>
                        {b.porcentaje} OFF
                      </span>
                    )}
                    <span style={{ fontSize: '13px', color: '#6b7280' }}>
                      📌 Orden: {b.orden || '1'}
                    </span>
                    {destino && (
                      <span style={{ fontSize: '13px', color: '#2563eb' }}>
                        🔗 {destino}
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  className="btn-delete" 
                  onClick={() => eliminarBannerOferta(b.id)}
                  style={{ flexShrink: 0 }}
                >
                  🗑 Eliminar
                </button>
              </div>
            );
          })
        )}
      </section>

      {/* ================================================= */}
      {/* 🔵 BANNERS PRINCIPALES */}
      {/* ================================================= */}
      <section className="section-card">
        <h2>🔥 Banner promociones principales</h2>
        <div className="form-grid">
          <input
            name="titulo"
            placeholder="Título"
            value={bannerForm.titulo}
            onChange={handleBannerChange}
            className="form-input"
          />
          <textarea
            name="descripcion"
            placeholder="Descripción"
            value={bannerForm.descripcion}
            onChange={handleBannerChange}
            className="form-textarea"
          />
          <input
            type="file"
            accept="image/*"
            onChange={handleBannerImagen}
            className="form-input"
          />
          <select
            name="categoria"
            value={bannerForm.categoria}
            onChange={handleBannerChange}
            className="form-input"
          >
            <option value="">Selecciona categoría</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>
            ))}
          </select>
          <select
            name="subcategoria"
            value={bannerForm.subcategoria}
            onChange={handleBannerChange}
            className="form-input"
          >
            <option value="">Selecciona subcategoría</option>
            {subcategorias
              .filter(sub => {
                const categoria = categorias.find(cat => cat.nombre === bannerForm.categoria);
                return String(sub.categoria_id) === String(categoria?.id);
              })
              .map(sub => (
                <option key={sub.id} value={sub.nombre}>{sub.nombre}</option>
              ))}
          </select>
          {previewBanner && (
            <img src={previewBanner} alt="Preview" className="banner-preview" />
          )}
          <button className="btn-primary" onClick={crearBanner}>
            Crear banner
          </button>
        </div>
      </section>

      <section className="section-card">
        <h2>🖼 Lista banners principales</h2>
        {banners.map(b => (
          <div key={b.id} className="banner-card">
            <img src={b.imagen} alt={b.titulo} className="banner-image" />
            <div className="banner-info">
              <h3>{b.titulo}</h3>
              <p>{b.descripcion}</p>
              {b.categoria && <p className="banner-category">📂 Categoría: {b.categoria}</p>}
              {b.subcategoria && <p className="banner-category">📁 Subcategoría: {b.subcategoria}</p>}
            </div>
            <button className="btn-delete" onClick={() => eliminarBanner(b.id)}>
              🗑 Eliminar
            </button>
          </div>
        ))}
      </section>

      {/* ESTILOS (CSS inyectado) */}
      <style jsx>{`
        * { box-sizing: border-box; }

        .admin-container {
          min-height: 100vh;
          background: #f0f2f8;
          padding: 16px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          overflow-x: hidden;
        }

        @media (min-width: 768px) {
          .admin-container { padding: 24px 32px; }
        }

        .admin-header {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          border-radius: 20px;
          padding: 24px 20px;
          margin-bottom: 24px;
          box-shadow: 0 8px 32px rgba(79, 70, 229, 0.3);
        }

        @media (min-width: 768px) {
          .admin-header { padding: 32px 40px; border-radius: 24px; margin-bottom: 30px; }
        }

        .header-content { max-width: 1200px; margin: 0 auto; }

        .admin-header h1 {
          color: #fff;
          font-size: 24px;
          font-weight: 900;
          margin: 0;
          letter-spacing: -0.5px;
        }

        .header-subtitle {
          color: rgba(255,255,255,0.8);
          font-size: 14px;
          margin: 6px 0 0 0;
        }

        @media (min-width: 480px) {
          .admin-header h1 { font-size: 28px; }
          .header-subtitle { font-size: 16px; }
        }

        @media (min-width: 768px) {
          .admin-header h1 { font-size: 36px; }
          .header-subtitle { font-size: 18px; }
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 24px;
        }

        @media (min-width: 480px) {
          .stats-grid { grid-template-columns: repeat(4, 1fr); gap: 16px; }
        }

        @media (min-width: 768px) {
          .stats-grid { grid-template-columns: repeat(7, 1fr); gap: 20px; margin-bottom: 30px; }
        }

        .stat-card {
          background: #fff;
          border-radius: 16px;
          padding: 16px 12px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
          border: 1px solid #e5e7eb;
          transition: transform 0.2s ease;
        }

        .stat-card:hover { transform: translateY(-3px); }

        @media (min-width: 480px) {
          .stat-card { padding: 20px 16px; border-radius: 20px; }
        }

        .stat-number {
          font-size: 20px;
          font-weight: 900;
          display: block;
          color: #1f2937;
        }

        .stat-label {
          font-size: 11px;
          color: #6b7280;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        @media (min-width: 480px) {
          .stat-number { font-size: 26px; }
          .stat-label { font-size: 12px; }
        }

        @media (min-width: 768px) {
          .stat-number { font-size: 32px; }
          .stat-label { font-size: 14px; }
        }

        .stat-blue .stat-number { color: #3b82f6; }
        .stat-purple .stat-number { color: #7c3aed; }
        .stat-green .stat-number { color: #10b981; }
        .stat-indigo .stat-number { color: #4f46e5; }
        .stat-orange .stat-number { color: #f59e0b; }
        .stat-red .stat-number { color: #ef4444; }

        .top-forms {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (min-width: 768px) {
          .top-forms { grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 30px; }
        }

        .section-card {
          background: #fff;
          border-radius: 20px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.06);
          border: 1px solid #e5e7eb;
          overflow: hidden;
          width: 100%;
        }

        @media (min-width: 768px) {
          .section-card { padding: 28px 32px; border-radius: 24px; margin-bottom: 30px; }
        }

        .section-card h2 {
          font-size: 18px;
          font-weight: 800;
          color: #111827;
          margin-top: 0;
          margin-bottom: 16px;
        }

        @media (min-width: 768px) {
          .section-card h2 { font-size: 22px; margin-bottom: 20px; }
        }

        .form-group { display: flex; flex-direction: column; gap: 12px; }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
        }

        @media (min-width: 768px) {
          .form-grid { grid-template-columns: 1fr 1fr; gap: 16px; }
        }

        .form-input,
        .form-textarea {
          padding: 12px 14px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          font-size: 14px;
          outline: none;
          transition: border-color 0.3s ease;
          background: #fafbfc;
          width: 100%;
          box-sizing: border-box;
        }

        .form-input:focus,
        .form-textarea:focus {
          border-color: #7c3aed;
          background: #fff;
        }

        @media (min-width: 768px) {
          .form-input,
          .form-textarea { padding: 14px 16px; font-size: 15px; }
        }

        .form-textarea { min-height: 80px; resize: vertical; }

        .form-multiselect {
          width: 100%;
          min-height: 120px;
          padding: 10px;
          border-radius: 12px;
          border: 2px solid #e5e7eb;
          background: #fafbfc;
          font-size: 14px;
          box-sizing: border-box;
        }

        .form-label {
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
          display: block;
          font-size: 14px;
        }

        .input-group {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 10px;
        }

        @media (max-width: 768px) { .input-group { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 480px) { .input-group { grid-template-columns: 1fr; } }

        .checkbox-group {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          padding: 8px 0;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #374151;
          cursor: pointer;
          font-size: 14px;
        }

        .checkbox-label input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
          flex-shrink: 0;
        }

        .btn-primary {
          background: linear-gradient(135deg, #10b981, #059669);
          color: #fff;
          border: none;
          padding: 14px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          width: 100%;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
        }

        @media (min-width: 768px) {
          .btn-primary { padding: 16px 28px; font-size: 16px; width: auto; }
        }

        .btn-edit {
          background: linear-gradient(135deg, #2563eb, #3b82f6);
          color: #fff;
          border: none;
          padding: 8px 14px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          transition: transform 0.2s ease;
          white-space: nowrap;
        }

        .btn-edit:hover { transform: scale(1.03); }

        @media (min-width: 768px) {
          .btn-edit { padding: 10px 18px; font-size: 13px; }
        }

        .btn-delete {
          background: linear-gradient(135deg, #dc2626, #ef4444);
          color: #fff;
          border: none;
          padding: 8px 14px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          transition: transform 0.2s ease;
          white-space: nowrap;
        }

        .btn-delete:hover { transform: scale(1.03); }

        @media (min-width: 768px) {
          .btn-delete { padding: 10px 18px; font-size: 13px; }
        }

        .btn-visibility {
          background: #6b7280;
          color: #fff;
          border: none;
          padding: 8px 14px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 12px;
          cursor: pointer;
          transition: transform 0.2s ease;
          white-space: nowrap;
        }

        .btn-visibility:hover { transform: scale(1.03); }

        @media (min-width: 768px) {
          .btn-visibility { padding: 10px 18px; font-size: 13px; }
        }

        .btn-timer {
          background: linear-gradient(135deg, #f97316, #ef4444);
          color: #fff;
          border: none;
          padding: 14px 20px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          width: 100%;
          margin-top: 12px;
          box-shadow: 0 4px 16px rgba(239, 68, 68, 0.3);
          transition: transform 0.2s ease;
        }

        .btn-timer:hover { transform: translateY(-2px); }

        @media (min-width: 768px) {
          .btn-timer { padding: 16px 28px; font-size: 16px; width: auto; }
        }

        .category-item {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          padding: 14px 16px;
          border-radius: 14px;
          margin-bottom: 10px;
          background: linear-gradient(135deg, #ffffff, #fafbfc);
          border: 1px solid #e5e7eb;
          gap: 10px;
          width: 100%;
        }

        @media (min-width: 768px) {
          .category-item { padding: 16px 20px; border-radius: 18px; margin-bottom: 12px; gap: 16px; }
        }

        .category-name { flex: 1; min-width: 120px; }
        .category-name .form-input { padding: 8px 12px; font-size: 13px; }

        .category-actions {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 8px;
        }

        .text-muted {
          color: #6b7280;
          font-size: 12px;
          margin: 4px 0 0 0;
        }

        @media (min-width: 768px) { .text-muted { font-size: 13px; } }

        .product-card {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: flex-start;
          padding: 16px;
          border-radius: 16px;
          margin-bottom: 16px;
          background: #fff;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          gap: 12px;
          width: 100%;
        }

        @media (min-width: 768px) {
          .product-card { padding: 20px 24px; border-radius: 20px; margin-bottom: 20px; gap: 16px; }
        }

        .product-info {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          flex: 1;
          width: 100%;
        }

        .product-image {
          width: 80px;
          height: 80px;
          object-fit: cover;
          border-radius: 12px;
          border: 2px solid #eef2ff;
          flex-shrink: 0;
        }

        @media (min-width: 480px) {
          .product-image { width: 100px; height: 100px; }
        }

        @media (min-width: 768px) {
          .product-image { width: 120px; height: 120px; border-radius: 16px; border-width: 3px; }
        }

        .product-details { flex: 1; min-width: 160px; }
        .product-details h3 { margin: 0 0 6px 0; font-size: 16px; }

        @media (min-width: 768px) { .product-details h3 { font-size: 18px; } }

        .product-details p {
          margin: 3px 0;
          font-size: 13px;
          color: #374151;
          word-break: break-word;
        }

        @media (min-width: 768px) { .product-details p { font-size: 14px; } }

        .product-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          width: 100%;
        }

        @media (min-width: 480px) {
          .product-actions { width: auto; gap: 10px; }
        }

        .product-actions button {
          flex: 1;
          min-width: 70px;
          text-align: center;
          font-size: 11px;
          padding: 8px 12px;
        }

        @media (min-width: 480px) {
          .product-actions button { flex: none; font-size: 12px; padding: 8px 14px; }
        }

        @media (min-width: 768px) {
          .product-actions button { font-size: 13px; padding: 10px 18px; }
        }

        .badge-visible,
        .badge-hidden,
        .badge-rebaja,
        .badge-destacado {
          padding: 3px 10px;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 700;
          display: inline-block;
        }

        @media (min-width: 768px) {
          .badge-visible,
          .badge-hidden,
          .badge-rebaja,
          .badge-destacado { padding: 4px 12px; font-size: 12px; }
        }

        .badge-visible { background: #16a34a; color: #fff; }
        .badge-hidden { background: #1f2937; color: #fff; }
        .badge-rebaja { background: #dc2626; color: #fff; }
        .badge-destacado { background: #111827; color: #fff; }

        .status-badge { margin: 4px 0; }

        .text-oferta {
          color: #dc2626;
          font-weight: 700;
          font-size: 13px !important;
        }

        .text-success {
          color: #16a34a;
          font-weight: 600;
          font-size: 13px !important;
        }

        .sugerencias-container {
          margin-top: 12px;
          padding: 14px;
          border-radius: 14px;
          background: linear-gradient(135deg, #eef2ff, #ffffff);
          border: 1px solid #c7d2fe;
          width: 100%;
        }

        @media (min-width: 768px) {
          .sugerencias-container { padding: 16px; border-radius: 16px; margin-top: 16px; }
        }

        .sugerencias-container strong {
          color: #3730a3;
          display: block;
          margin-bottom: 10px;
          font-size: 14px;
        }

        .sugerencias-list {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 8px;
        }

        .sugerencia-card {
          min-width: 110px;
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          padding: 10px;
          text-align: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          transition: transform 0.2s ease;
          flex-shrink: 0;
        }

        .sugerencia-card:hover { transform: scale(1.03); }

        @media (min-width: 480px) {
          .sugerencia-card { min-width: 130px; padding: 12px; }
        }

        .sugerencia-image {
          width: 100%;
          height: 60px;
          object-fit: cover;
          border-radius: 8px;
        }

        @media (min-width: 480px) { .sugerencia-image { height: 70px; } }

        .sugerencia-name {
          font-weight: 600;
          font-size: 12px;
          margin: 6px 0 3px 0;
          color: #111827;
        }

        .sugerencia-price {
          font-weight: 700;
          color: #16a34a;
          font-size: 13px;
          margin: 0;
        }

        .image-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
          gap: 8px;
          margin: 10px 0;
        }

        @media (min-width: 768px) {
          .image-grid { grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap: 10px; }
        }

        .preview-thumb {
          width: 100%;
          height: 70px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #ddd;
        }

        @media (min-width: 768px) {
          .preview-thumb { height: 100px; border-radius: 10px; }
        }

        .preview-image {
          max-width: 100%;
          max-height: 200px;
          border-radius: 10px;
          border: 1px solid #ddd;
          margin-top: 8px;
        }

        @media (min-width: 768px) {
          .preview-image { max-height: 300px; border-radius: 12px; margin-top: 10px; }
        }

        .banner-preview {
          max-width: 100%;
          max-height: 150px;
          object-fit: cover;
          border-radius: 12px;
        }

        @media (min-width: 768px) { .banner-preview { max-height: 200px; } }

        .banner-card {
          display: flex;
          flex-wrap: wrap;
          gap: 14px;
          align-items: center;
          padding: 14px 16px;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          margin-bottom: 14px;
          background: #fafbfc;
          width: 100%;
        }

        @media (min-width: 768px) {
          .banner-card { padding: 16px 20px; border-radius: 16px; margin-bottom: 16px; gap: 20px; }
        }

        .banner-image {
          width: 100%;
          height: 120px;
          object-fit: cover;
          border-radius: 10px;
          flex-shrink: 0;
        }

        @media (min-width: 480px) {
          .banner-image { width: 140px; height: 90px; }
        }

        @media (min-width: 768px) {
          .banner-image { width: 180px; height: 100px; border-radius: 12px; }
        }

        .banner-info { flex: 1; min-width: 120px; }
        .banner-info h3 { margin: 0 0 4px 0; font-size: 16px; }
        .banner-info p { margin: 4px 0; font-size: 13px; color: #4b5563; word-break: break-word; }

        .banner-category {
          color: #2563eb;
          font-weight: 600;
          font-size: 13px !important;
        }

        .contact-card {
          background: #fff;
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid #e5e7eb;
          box-shadow: 0 4px 12px rgba(0,0,0,0.04);
          width: 100%;
          overflow: hidden;
        }

        @media (min-width: 768px) {
          .contact-card { padding: 20px 24px; border-radius: 20px; margin-bottom: 20px; }
        }

        .contact-header {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          gap: 10px;
          width: 100%;
        }

        .contact-header-info { flex: 1; min-width: 150px; }
        .contact-header h3 { margin: 0; font-size: 17px; word-break: break-word; }

        @media (min-width: 768px) { .contact-header h3 { font-size: 20px; } }

        .contact-date {
          color: #6b7280;
          font-size: 12px;
          display: block;
        }

        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          margin-bottom: 14px;
        }

        @media (min-width: 768px) {
          .contact-grid { grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 16px; }
        }

        .info-box {
          background: #fafbfc;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 10px 12px;
          overflow: hidden;
        }

        @media (min-width: 768px) {
          .info-box { padding: 14px 16px; border-radius: 14px; }
        }

        .info-box strong {
          display: block;
          font-size: 11px;
          color: #6b7280;
          margin-bottom: 2px;
        }

        @media (min-width: 768px) {
          .info-box strong { font-size: 12px; margin-bottom: 4px; }
        }

        .info-box-text {
          margin: 0;
          font-weight: 500;
          font-size: 13px;
          word-break: break-word;
        }

        .message-box {
          background: linear-gradient(135deg, #eef2ff, #ffffff);
          border: 1px solid #c7d2fe;
          padding: 14px 16px;
          border-radius: 14px;
          line-height: 1.6;
          overflow: hidden;
        }

        @media (min-width: 768px) {
          .message-box { padding: 18px 20px; border-radius: 16px; line-height: 1.7; }
        }

        .message-box strong {
          display: block;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .message-text {
          margin: 0;
          font-size: 14px;
          word-break: break-word;
          white-space: pre-wrap;
        }

        .empty-state {
          background: #fff;
          padding: 30px 20px;
          border-radius: 16px;
          text-align: center;
          color: #6b7280;
          border: 2px dashed #d1d5db;
          font-size: 14px;
        }

        @media (min-width: 768px) {
          .empty-state { padding: 40px; font-size: 16px; }
        }

        .timer-section {
          background: linear-gradient(135deg, #111827, #1f2937);
          color: #fff;
          border: none;
        }

        .timer-section h2 { color: #fff; }
        .timer-section p { opacity: 0.7; margin-bottom: 14px; font-size: 14px; }

        .timer-section .form-input {
          background: rgba(255,255,255,0.1);
          color: #fff;
          border-color: rgba(255,255,255,0.2);
        }

        .timer-section .form-input:focus {
          background: rgba(255,255,255,0.15);
          border-color: #f97316;
        }

        .timer-section .form-input::placeholder { color: rgba(255,255,255,0.5); }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          padding: 20px;
          animation: fadeIn 0.25s ease;
        }

        .modal-content {
          background: #fff;
          border-radius: 28px;
          max-width: 900px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 24px 28px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          animation: slideUp 0.3s ease;
          position: relative;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 16px;
        }

        .modal-header h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 800;
          color: #111827;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 28px;
          font-weight: 300;
          color: #6b7280;
          cursor: pointer;
          transition: color 0.2s;
          line-height: 1;
          padding: 0 8px;
        }

        .modal-close:hover { color: #111827; }

        .modal-body { padding: 4px 0; }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        @media (max-width: 640px) {
          .modal-content { padding: 16px; border-radius: 20px; }
          .modal-header h2 { font-size: 18px; }
          .modal-close { font-size: 24px; }
        }

        @media (max-width: 360px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .stat-card { padding: 12px 8px; }
          .stat-number { font-size: 18px; }
          .stat-label { font-size: 10px; }
          .product-image { width: 60px; height: 60px; }
          .sugerencia-card { min-width: 90px; }
          .contact-grid { grid-template-columns: 1fr; }
        }

        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        table th {
          background: #f1f5f9;
          padding: 12px 14px;
          text-align: left;
          font-weight: 700;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
        }

        table td {
          padding: 12px 14px;
          border-bottom: 1px solid #e5e7eb;
        }

        table tr:hover { background: #fafbfc; }

        @media (max-width: 768px) {
          table { font-size: 12px; }
          table th,
          table td { padding: 8px 10px; }
        }

        .section-card * { max-width: 100%; }
        .form-input,
        .form-textarea,
        .form-multiselect { max-width: 100%; }
        img { max-width: 100%; height: auto; }
      `}</style>
    </div>
  );
}