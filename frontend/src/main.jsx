import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from './App.jsx'; // La vista principal o Dashboard
import LoginPage from './pages/LoginPage.jsx'; // Crearemos este archivo pronto
import RegisterPage from './pages/RegisterPage.jsx'; // Crearemos este archivo pronto
import './index.css';

// Define las rutas de tu aplicación
const router = createBrowserRouter([
  {
    path: "/",
    element: <App />, // Esta será tu ruta protegida (Dashboard)
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/registro",
    element: <RegisterPage />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);