import React from 'react';
import { Link } from 'react-router-dom'; // Importamos Link para la navegación

function LoginPage() {
  const handleSubmit = (event) => {
    event.preventDefault(); // Previene que la página se recargue
    // La lógica de Firebase irá aquí en el siguiente hito
    console.log('Intento de inicio de sesión...');
  };

  return (
    <div>
      <h2>Iniciar Sesión</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Correo Electrónico:</label>
          <input type="email" id="email" name="email" required />
        </div>
        <div>
          <label htmlFor="password">Contraseña:</label>
          <input type="password" id="password" name="password" required />
        </div>
        <button type="submit">Ingresar</button>
      </form>
      <p>
        ¿No tienes una cuenta? <Link to="/registro">Regístrate aquí</Link>
      </p>
    </div>
  );
}

export default LoginPage;