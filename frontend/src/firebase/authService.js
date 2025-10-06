import { getAuth } from "firebase/auth";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "./config"; // Usamos 'app' para inicializar los servicios

// Inicializamos los servicios de Firebase que necesitamos
const auth = getAuth(app);
const functions = getFunctions(app);

// --- FUNCIÓN DE REGISTRO ---
// Esta función llama a nuestra Cloud Function 'registerNewUserAndBusiness'
export const registerWithDetails = async (userDetails) => {
  // Apuntamos a la función específica que desplegamos
  const registerFunction = httpsCallable(functions, 'registerNewUserAndBusiness');
  
  try {
    // Le pasamos los detalles del usuario a la función en la nube
    const result = await registerFunction(userDetails);
    return { success: true, data: result.data };
  } catch (error) {
    // Si la Cloud Function devuelve un error, lo capturamos aquí
    console.error("Error al llamar a la Cloud Function de registro:", error);
    return { success: false, error: error.message };
  }
};

// --- FUTURA FUNCIÓN DE LOGIN ---
// Aquí pondremos la lógica para el inicio de sesión más adelante
export const loginUser = async (email, password) => {
  // Lógica de inicio de sesión...
  console.log("Iniciando sesión con:", email);
};
