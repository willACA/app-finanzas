import React from 'react';
import { Link } from 'react-router-dom';

function App() {
  // En el futuro, aquí pondremos la lógica para verificar si el usuario está autenticado.
  // Si no lo está, lo redirigiremos al login.
  // Por ahora, simplemente será nuestro "Dashboard" provisional.

  return (
    <div>
      <h1>Bienvenido a la App de Finanzas</h1>
      <p>Este será tu dashboard principal una vez que inicies sesión.</p>
      <Link to="/login">Ir a Iniciar Sesión</Link>
    </div>
  );
}

export default App;