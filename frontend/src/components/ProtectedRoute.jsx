import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  // ✅ CAMBIO AQUÍ: Obtenemos también el estado "loading"
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // ✅ CAMBIO AQUÍ: Mientras estemos verificando, mostramos un mensaje
  if (loading) {
    return <div>Cargando sesión...</div>; // O un spinner de carga
  }

  if (!currentUser) {
    // Cuando ya no estamos cargando y NO hay usuario, redirigir al login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (currentUser.estadoCuenta === 'pendiente') {
    // Si el usuario está pendiente, redirigir a la página de pendiente
    return <Navigate to="/pendiente" replace />;
  }

  // Si todo está en orden, mostrar la página solicitada
  return children;
};

export default ProtectedRoute;