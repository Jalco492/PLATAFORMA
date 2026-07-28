// src/components/NavigationManager.js
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function NavigationManager() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handlePopState = (event) => {
      // Previene el comportamiento por defecto
      event.preventDefault();
      
      // Si la ruta actual NO es "/productos", redirige a "/productos"
      if (location.pathname !== "/productos") {
        navigate("/productos", { replace: true });
      }
    };

    // Escucha el evento de retroceso
    window.addEventListener("popstate", handlePopState);
    
    // También escucha el evento beforeunload para casos extremos
    window.addEventListener("beforeunload", () => {
      window.removeEventListener("popstate", handlePopState);
    });
    
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [location, navigate]);

  return null;
}