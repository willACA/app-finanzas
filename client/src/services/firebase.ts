    // Importa las funciones necesarias desde los SDKs que necesitas
    import { initializeApp } from "firebase/app";
    import { getAuth } from "firebase/auth";
    import { getFirestore } from "firebase/firestore";

    // Tu configuración de la aplicación web de Firebase
    // Lee las variables de entorno de forma segura
    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID
    };

    // Inicializa Firebase
    const app = initializeApp(firebaseConfig);

    // Exporta los servicios que usarás en tu aplicación
    export const auth = getAuth(app);
    export const db = getFirestore(app);
    
