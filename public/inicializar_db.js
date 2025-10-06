// Importa las funciones necesarias del SDK de Firebase v9+
// Usamos estas URLs directamente porque estamos en un proyecto simple de HTML y JS.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ==================================================================================
// CONFIGURACIÓN DE TU PROYECTO (¡YA ESTÁ LISTA!)
// Este es el objeto que conecta el código con tu proyecto de Firebase.
// ==================================================================================
const firebaseConfig = {
  apiKey: "AIzaSyB1YcCmGwk1Z-atqktnMs86EqoD_yL2kIs",
  authDomain: "finanzasminegocio-5d112.firebaseapp.com",
  projectId: "finanzasminegocio-5d112",
  storageBucket: "finanzasminegocio-5d112.firebasestorage.app",
  messagingSenderId: "868288373011",
  appId: "1:868288373011:web:c5447a18ce5d448e953ae6",
  measurementId: "G-NDWD7FHXQT"
};


// Inicializa Firebase con tu configuración
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Función para crear un negocio de ejemplo y su primer cierre diario.
 */
async function crearEstructuraInicial() {
  console.log("Iniciando la creación de la estructura...");

  try {
    // 1. Crear el documento del negocio principal en la colección 'negocios'
    console.log("Creando el documento para 'Negocio Principal'...");
    const negocioData = {
      nombre: "Negocio Principal",
      fechaCreacion: serverTimestamp() // Guarda la fecha actual del servidor
    };
    
    // addDoc crea un documento con un ID automático en la colección 'negocios'
    const negocioRef = await addDoc(collection(db, "negocios"), negocioData);
    console.log(`Documento de negocio creado con ID: ${negocioRef.id}`);

    // 2. Añadir un registro de ejemplo en la sub-colección 'cierresDiarios'
    console.log("Añadiendo cierre diario de ejemplo...");
    const cierreDiarioData = {
      fecha: new Date("2025-10-04"), // Usamos una fecha de ejemplo
      nombreCajero: "Ana Martínez",
      ingresoEfectivo: 5500.75,
      totalVentas: 7200.50,
      registradoEn: serverTimestamp()
    };
    
    // Creamos una referencia a la sub-colección y añadimos el documento
    const cierresDiariosCollectionRef = collection(db, "negocios", negocioRef.id, "cierresDiarios");
    const cierreRef = await addDoc(cierresDiariosCollectionRef, cierreDiarioData);

    console.log(`Cierre diario de ejemplo añadido con ID: ${cierreRef.id}`);
    console.log("¡Estructura inicial creada con éxito en Firestore!");
    alert("¡Estructura inicial creada con éxito! Revisa tu consola de Firestore.");

  } catch (error) {
    console.error("Error al crear la estructura inicial: ", error);
    alert("Hubo un error al crear la estructura. Revisa la consola del navegador para más detalles.");
  }
}

// Hacemos que la función esté disponible globalmente para poder llamarla desde el botón en el HTML
window.crearEstructuraInicial = crearEstructuraInicial;

