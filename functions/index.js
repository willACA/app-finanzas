// functions/index.js - VERSIÓN FINAL CORREGIDA

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");

// --- INICIALIZACIÓN CORRECTA ---
// Se inicializa la app una sola vez
admin.initializeApp();
// Se obtienen los servicios a través del SDK de admin
const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
// --- FIN DE LA CORRECCIÓN ---


// =================================================================
// === FUNCIÓN PARA REGISTRO DE USUARIO Y NEGOCIO (v2) ===
// =================================================================
exports.registerNewUserAndBusiness = onCall(async (request) => {
  const { email, password, businessName, ownerName } = request.data;

  if (!email || !password || !businessName || !ownerName) {
    logger.error("Intento de registro con datos incompletos.");
    throw new HttpsError(
      "invalid-argument",
      "Faltan datos para el registro. Todos los campos son requeridos."
    );
  }

  let newUserUID;

  try {
    // 1. Crear el usuario en Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: ownerName,
    });
    
    newUserUID = userRecord.uid;
    logger.info("Usuario creado en Auth con UID:", newUserUID);

    // 2. Preparar los documentos para Firestore
    const userDoc = {
      email: email,
      uid: newUserUID,
      nombre: ownerName,
      estadoCuenta: "pendiente",
      fechaCreacion: FieldValue.serverTimestamp(), // Se usa la variable corregida
    };

    const businessDoc = {
      ownerId: newUserUID,
      nombreNegocio: businessName,
      fechaCreacion: FieldValue.serverTimestamp(), // Se usa la variable corregida
    };

    // 3. Escribir ambos documentos en un solo batch (operación atómica)
    const writeBatch = db.batch();
    const userRef = db.collection("usuarios").doc(newUserUID);
    const businessRef = db.collection("negocios").doc();

    writeBatch.set(userRef, userDoc);
    writeBatch.set(businessRef, businessDoc);

    await writeBatch.commit();
    logger.info("Documentos creados con éxito en Firestore para UID:", newUserUID);

    return { success: true, uid: newUserUID };

  } catch (error) {
    logger.error("Error completo en el proceso de registro:", error);
    
    if (newUserUID) {
      logger.warn(`Intentando borrar usuario huérfano de Auth: ${newUserUID}`);
      await admin.auth().deleteUser(newUserUID);
    }

    throw new HttpsError(
      "internal",
      "Ocurrió un error al crear la cuenta. Por favor, intenta de nuevo."
    );
  }
});

// =================================================================
// === TUS FUNCIONES EXISTENTES (v2) - SIN CAMBIOS EN LA LÓGICA ===
// =================================================================

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

exports.procesarYGuardarCierre = onCall(async (request) => {
  const cierreData = request.data;
  const { negocioId, fechaCierre, gastos, cxc, transferencias, adiciones, ...resumenCierre } = cierreData;

  if (!negocioId || !fechaCierre) {
    throw new HttpsError("invalid-argument", "Faltan datos esenciales (negocioId, fechaCierre).");
  }

  const resumenData = {
    ...resumenCierre,
    negocioId: negocioId,
    fechaCierre: new Date(fechaCierre),
    fechaRegistro: new Date(),
  };

  try {
    const negocioRef = db.collection("negocios").doc(negocioId);
    const cierreRef = await negocioRef.collection("cierresDiarios").add(resumenData);
    const cierreId = cierreRef.id;
    logger.info(`Resumen de cierre guardado con ID: ${cierreId}`);

    const promises = [];

    if (gastos && gastos.length > 0) {
        gastos.forEach(gasto => {
            promises.push(negocioRef.collection('gastos').add({ ...gasto, cierreId: cierreId, negocioId: negocioId, fechaCierre: new Date(fechaCierre) }));
        });
    }
    if (cxc && cxc.length > 0) {
        cxc.forEach(item => {
            promises.push(negocioRef.collection('cxc').add({ ...item, cierreId: cierreId, negocioId: negocioId, fechaCierre: new Date(fechaCierre) }));
        });
    }
    if (transferencias && transferencias.length > 0) {
        transferencias.forEach(item => {
            promises.push(negocioRef.collection('transferencias').add({ ...item, cierreId: cierreId, negocioId: negocioId, fechaCierre: new Date(fechaCierre) }));
        });
    }
    if (adiciones && adiciones.length > 0) {
        adiciones.forEach(item => {
            promises.push(negocioRef.collection('adiciones').add({ ...item, cierreId: cierreId, negocioId: negocioId, fechaCierre: new Date(fechaCierre) }));
        });
    }

    await Promise.all(promises);

    logger.info(`Sub-documentos para el cierre ${cierreId} guardados con éxito.`);
    return { status: "success", message: "Cierre y todos sus detalles guardados correctamente.", docId: cierreId };

  } catch (error) {
    logger.error(`Error al guardar el cierre distribuido para ${negocioId}:`, error);
    throw new HttpsError("internal", "Error al guardar los datos en Firestore.");
  }
});
