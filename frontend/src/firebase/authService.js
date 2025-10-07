// Imports from Firebase SDK
import { getFunctions, httpsCallable } from "firebase/functions";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

// Imports from our local config file
import { app, auth, db } from "./config";

// Initialize Firebase Functions
const functions = getFunctions(app);

// --- FUNCIÓN DE REGISTRO ---
// Llama a nuestra Cloud Function para crear el usuario y los documentos de forma segura
export const registerWithDetails = async (userDetails) => {
  const registerFunction = httpsCallable(functions, 'registerNewUserAndBusiness');
  try {
    const result = await registerFunction(userDetails);
    return { success: true, data: result.data };
  } catch (error) {
    console.error("Error al llamar a la Cloud Function de registro:", error);
    return { success: false, error: error.message };
  }
};

// --- FUNCIÓN DE LOGIN ---
// Autentica al usuario y obtiene sus datos de Firestore
export const loginUser = async (email, password) => {
  try {
    // 1. Autenticar al usuario con Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // 2. Obtener el documento del usuario desde Firestore para leer sus datos
    const userDocRef = doc(db, "usuarios", user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (userDocSnap.exists()) {
      // 3. Devolver tanto la información de Auth como los datos de Firestore
      const userData = userDocSnap.data();
      return { success: true, user: { ...user, ...userData } };
    } else {
      // Caso improbable: el usuario existe en Auth pero no en Firestore
      throw new Error("No se encontraron los datos del usuario.");
    }

  } catch (error) {
    console.error("Error en el inicio de sesión:", error);
    return { success: false, error: error.message };
  }
};

