import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB1YcCmGwk1Z-atqktnMs86EqoD_yL2kIs",
  authDomain: "finanzasminegocio-5d112.firebaseapp.com",
  projectId: "finanzasminegocio-5d112",
  storageBucket: "finanzasminegocio-5d112.firebasestorage.app",
  messagingSenderId: "868288373011",
  appId: "1:868288373011:web:c5447a18ce5d448e953ae6",
  measurementId: "G-NDWD7FHXQT"
};

// Inicializa Firebase
export const app = initializeApp(firebaseConfig); 

// Exporta los servicios que usaremos
export const auth = getAuth(app);
export const db = getFirestore(app);

