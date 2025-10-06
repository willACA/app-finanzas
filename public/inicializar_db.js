// Usamos 'require' para importar los módulos instalados localmente
const { initializeApp, applicationDefault } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializamos la app. Detectará automáticamente el emulador
// gracias a la variable de entorno que configuramos.
initializeApp({ projectId: 'finanzasminegocio-5d112' });

const db = getFirestore();

// --- DATOS DE PRUEBA ---
const negocios = [
    { nombre: 'Monen Francis' },
    { nombre: 'Monen Hamburguesas' }
];

const cajeros = [
    { nombre: 'William' },
    { nombre: 'Carla' },
    { nombre: 'Empleado 3' }
];

// --- FUNCIÓN PARA POBLAR LA BASE DE DATOS ---
async function seedDatabase() {
    console.log('Iniciando el sembrado de la base de datos...');

    try {
        // Añadir negocios
        console.log('Añadiendo negocios...');
        for (const negocio of negocios) {
            await db.collection('negocios').add(negocio);
            console.log(`- ${negocio.nombre} añadido.`);
        }

        // Añadir cajeros
        console.log('Añadiendo cajeros...');
        for (const cajero of cajeros) {
            await db.collection('cajeros').add(cajero);
            console.log(`- ${cajero.nombre} añadido.`);
        }

        console.log('✅ Sembrado de base de datos completado con éxito.');

    } catch (error) {
        console.error('❌ Error durante el sembrado:', error);
    }
}

// Ejecutamos la función
seedDatabase();