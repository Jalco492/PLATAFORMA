import { BrowserRouter, Routes, Route } from "react-router-dom";
import Catalogo from "./pages/Catalogo";
import ProductoDetalle from "./pages/ProductoDetalle";
import Admin from "./pages/Admin";
import Categoria from "./pages/Categoria";
import Categorias from "./pages/Categorias";
import Subcategoria from "./pages/Subcategoria";
import SubcategoriaId from "./pages/SubcategoriaId";
import Productos from "./pages/Productos";
import Buscar from "./pages/Buscar";
import Favoritos from "./pages/Favoritos";
import Footer from "./pages/Footer";
import Contacto from "./pages/Contacto";
import Nosotros from "./pages/Nosotros";
import Navbar from "./pages/Navbar";
import Comparar from "./pages/Comparar";
import Cotizador from "./pages/Cotizador";
import Tipos from "./pages/Tipos"; 
import MasVendidos from "./pages/MasVendidos"; 
import ProductosPorTipo from "./pages/ProductosPorTipo"; 
import Pedido from "./pages/Pedido"; 



function App() {
  return (
    <BrowserRouter>
      <Routes>

       

        <Route path="/" element={<Catalogo />} />

        <Route path="/producto/:id" element={<ProductoDetalle />} />

        <Route path="/admin" element={<Admin />} />

        <Route path="/categoria/:nombre" element={<Categoria />} />
         <Route path="/categorias" element={<Categorias />} />

        <Route path="/subcategoria/:nombre" element={<Subcategoria />} />
         <Route path="/subcategorias/:id" element={<SubcategoriaId />} />

        <Route path="/categoria-id/:id" element={<Categoria />} />
        <Route path="/productos" element={<Productos />} />
        <Route path="/buscar/:texto" element={<Buscar />} />
        <Route path="/favoritos" element={<Favoritos />} />
        <Route path="/footer" element={<Footer />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/nosotros" element={<Nosotros />} />
         <Route path="/navbar" element={<Navbar />} />
         <Route path="/comparar" element={<Comparar />}/>
         <Route path="/cotizador"element={<Cotizador />}/>
         <Route path="/tipo/:id" element={<Tipos />}/>
         <Route path="/productos/tipo/:id" element={<ProductosPorTipo />} />
          <Route path="/mas-vendidos" element={<MasVendidos />} />
           <Route path="/pedido" element={<Pedido />} 
/>
       


        
      </Routes>
    </BrowserRouter>
  );
}

export default App;