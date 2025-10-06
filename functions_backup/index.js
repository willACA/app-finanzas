// functions/index.js - CÓDIGO DE DIAGNÓSTICO

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

// Inicializa Firebase Admin SDK
initializeApp();
const db = getFirestore();

/**
 * @name obtenerCajaChicaAnterior
 * @description Obtiene el valor final en caja del último cierre registrado para un negocio.
 */
exports.obtenerCajaChicaAnterior = onCall(async (request) => {
    const negocioId = request.data.negocioId;
    if (!negocioId) {
        logger.error("Llamada a la función sin negocioId.");
        throw new HttpsError("invalid-argument", "Falta el 'negocioId'.");
    }

    logger.info(`Buscando caja chica para el negocio: ${negocioId}`);

    try {
        const cierresRef = db.collection("negocios").doc(negocioId).collection("cierresDiarios");
        const snapshot = await cierresRef.orderBy("fechaCierre", "desc").limit(1).get();

        if (snapshot.empty) {
            logger.info("No se encontraron cierres anteriores para este negocio, devolviendo 0.");
            return { totalFinalEnCaja: 0 };
        }

        const ultimoCierre = snapshot.docs[0].data();
        // Verificación de seguridad para evitar errores si la estructura de datos es incorrecta
        const totalAnterior = ultimoCierre.cierreCuadre?.totalFinalEnCaja || 0;
        
        logger.info(`Último cierre encontrado. Total anterior: ${totalAnterior}`);
        return { totalFinalEnCaja: totalAnterior };

    } catch (error) {
        logger.error("Error crítico al obtener el último cierre:", error);
        throw new HttpsError("internal", "Error al consultar la base de datos.");
    }
});