// functions/index.js - CÓDIGO CON ESTRUCTURA DE DATOS MEJORADA

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

// --- FUNCIÓN 1: OBTENER CAJA CHICA ANTERIOR (Sin cambios) ---
exports.obtenerCajaChicaAnterior = onCall(async (request) => {
    const negocioId = request.data.negocioId;
    if (!negocioId) {
        throw new HttpsError("invalid-argument", "Falta el 'negocioId'.");
    }
    try {
        const cierresRef = db.collection("negocios").doc(negocioId).collection("cierresDiarios");
        const snapshot = await cierresRef.orderBy("fechaCierre", "desc").limit(1).get();
        
        if (snapshot.empty) {
            logger.info(`No se encontraron cierres para el negocio ${negocioId}, devolviendo 0.`);
            return { totalFinalEnCaja: 0 };
        }
        
        const ultimoCierre = snapshot.docs[0].data();
        const totalAnterior = ultimoCierre.cierreCuadre?.totalFinalEnCaja || 0;
        
        logger.info(`Último cierre para ${negocioId} encontrado. Caja chica anterior: ${totalAnterior}`);
        return { totalFinalEnCaja: totalAnterior };

    } catch (error) {
        logger.error(`Error al obtener el último cierre para el negocio ${negocioId}:`, error);
        throw new HttpsError("internal", "Error al consultar la base de datos.");
    }
});

// --- FUNCIÓN 2: PROCESAR Y GUARDAR CIERRE (¡VERSIÓN MEJORADA!) ---
exports.procesarYGuardarCierre = onCall(async (request) => {
    const cierreData = request.data;
    const { negocioId, fechaCierre, gastos, cxc, transferencias, adiciones, ...resumenCierre } = cierreData;

    if (!negocioId || !fechaCierre) {
        throw new HttpsError("invalid-argument", "Faltan datos esenciales (negocioId, fechaCierre).");
    }

    // Prepara el documento de resumen del cierre
    const resumenData = {
        ...resumenCierre, // Todos los campos excepto las listas
        negocioId: negocioId,
        fechaCierre: new Date(fechaCierre),
        fechaRegistro: new Date(),
    };

    try {
        const negocioRef = db.collection("negocios").doc(negocioId);

        // 1. Guarda el documento de resumen en la subcolección 'cierresDiarios'
        const cierreRef = await negocioRef.collection("cierresDiarios").add(resumenData);
        const cierreId = cierreRef.id; // Obtenemos el ID del cierre que acabamos de crear

        logger.info(`Resumen de cierre guardado con ID: ${cierreId}`);

        // 2. Prepara una lista de promesas para guardar todos los sub-documentos en paralelo
        const promises = [];

        // Guardar cada Gasto en la colección 'gastos'
        if (gastos && gastos.length > 0) {
            gastos.forEach(gasto => {
                const gastoData = {
                    ...gasto,
                    cierreId: cierreId, // Vinculamos el gasto al cierre
                    negocioId: negocioId,
                    fechaCierre: new Date(fechaCierre)
                };
                promises.push(negocioRef.collection('gastos').add(gastoData));
            });
        }

        // Guardar cada Cuenta por Cobrar en la colección 'cxc'
        if (cxc && cxc.length > 0) {
            cxc.forEach(item => {
                const cxcData = {
                    ...item,
                    cierreId: cierreId,
                    negocioId: negocioId,
                    fechaCierre: new Date(fechaCierre)
                };
                promises.push(negocioRef.collection('cxc').add(cxcData));
            });
        }

        // Guardar cada Transferencia en la colección 'transferencias'
        if (transferencias && transferencias.length > 0) {
            transferencias.forEach(item => {
                const transfData = {
                    ...item,
                    cierreId: cierreId,
                    negocioId: negocioId,
                    fechaCierre: new Date(fechaCierre)
                };
                promises.push(negocioRef.collection('transferencias').add(transfData));
            });
        }
        
        // Guardar cada Adición en la colección 'adiciones'
        if (adiciones && adiciones.length > 0) {
            adiciones.forEach(item => {
                const adicionData = {
                    ...item,
                    cierreId: cierreId,
                    negocioId: negocioId,
                    fechaCierre: new Date(fechaCierre)
                };
                promises.push(negocioRef.collection('adiciones').add(adicionData));
            });
        }

        // 3. Ejecuta todas las promesas de escritura
        await Promise.all(promises);

        logger.info(`Sub-documentos para el cierre ${cierreId} guardados con éxito.`);
        return { status: "success", message: "Cierre y todos sus detalles guardados correctamente.", docId: cierreId };

    } catch (error) {
        logger.error(`Error al guardar el cierre distribuido para ${negocioId}:`, error);
        throw new HttpsError("internal", "Error al guardar los datos en Firestore.");
    }
});

