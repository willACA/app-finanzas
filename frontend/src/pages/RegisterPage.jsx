import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { registerWithDetails } from '../firebase/authService'; // ¡Usamos la nueva función robusta!

function RegisterPage() {
  const [formData, setFormData] = useState({
    businessName: '',
    ownerName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    const { email, password, businessName, ownerName } = formData;
    const result = await registerWithDetails({ email, password, businessName, ownerName });
    
    setLoading(false);

    if (result.success) {
      console.log('¡Registro completo!', result.data);
      alert('¡Registro exitoso! Ahora espera la aprobación.');
    } else {
      // Usamos un mensaje más amigable para el usuario
      setError('Hubo un error al registrar la cuenta. Verifica tus datos o intenta más tarde.');
    }
  };

  return (
    <div>
      <h2>Crear Cuenta</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="businessName">Nombre del Negocio:</label>
          <input type="text" id="businessName" name="businessName" value={formData.businessName} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="ownerName">Tu Nombre (Propietario):</label>
          <input type="text" id="ownerName" name="ownerName" value={formData.ownerName} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="email">Correo Electrónico:</label>
          <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div>
          <label htmlFor="password">Contraseña:</label>
          <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Registrarme'}
        </button>
      </form>
      <p>
        ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </div>
  );
}

export default RegisterPage;
