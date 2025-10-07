// --- 1. IMPORTACIONES DE FIREBASE ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getFunctions, httpsCallable, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --- 2. CONFIGURACIÓN E INICIALIZACIÓN DE FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyB1YcCmGwk1Z-atqktnMs86EqoD_yL2kIs",
    authDomain: "finanzasminegocio-5d112.firebaseapp.com",
    projectId: "finanzasminegocio-5d112",
    storageBucket: "finanzasminegocio-5d112.appspot.com",
    messagingSenderId: "868288373011",
    appId: "1:868288373011:web:c5447a18ce5d448e953ae6",
    measurementId: "G-NDWD7FHXQT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');
const auth = getAuth(app);

// --- 3. CONEXIÓN A EMULADORES (SI APLICA) ---
if (window.location.hostname === "127.0.0.1") {
    console.log("📍 Modo local detectado. Conectando a los emuladores...");
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
}

// --- 4. REFERENCIAS A LAS CLOUD FUNCTIONS ---
const obtenerCajaChica = httpsCallable(functions, 'obtenerCajaChicaAnterior');
const guardarCierreFunction = httpsCallable(functions, 'procesarYGuardarCierre');


// --- 5. LÓGICA DE LA APLICACIÓN ---
document.addEventListener('DOMContentLoaded', function() {
    
    // --- UTILIDADES ---
    const formatter = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' });
    const parseCurrency = (value) => parseFloat(value) || 0;
    const denominaciones = [2000, 1000, 500, 200, 100, 50, 25, 10, 5, 1];

    // --- ESTADO CENTRAL DE LA APLICACIÓN ---
    const estado = {
        negocioId: null,
        negocioNombre: null,
        cajero: null,
        fecha: null,
        cajaChicaAnterior: 0,
        montoEncontrado: 0,
        ingresosPOS: {
            efectivo: 0,
            transferencias: 0,
            tarjeta: 0,
            total: 0
        },
        verificaciones: {
            verifone1: 0,
            verifone2: 0,
        },
        entrega: {
            monto: 0,
            entregadoA: null
        },
        comentariosFinales: '',
        adiciones: [],
    gastos: [],
    cxc: [],
    transferencias: []
    };

    // --- REFERENCIAS AL DOM ---
    const elements = {
        negocio: document.getElementById('negocio'),
        cajero: document.getElementById('cajero'),
        fecha: document.getElementById('fecha'),
        cajaChicaAnterior: document.getElementById('caja-chica-anterior'),
        montoEncontrado: document.getElementById('monto-encontrado'),
        posVentaEfectivo: document.getElementById('pos-venta-efectivo'),
        posTransferencias: document.getElementById('pos-transferencias'),
        posVentaTarjeta: document.getElementById('pos-venta-tarjeta'),
        posVentaTotal: document.getElementById('pos-venta-total'),
        verifone1: document.getElementById('verifone-1'),
        verifone2: document.getElementById('verifone-2'),
        realEfectivo: document.getElementById('real-efectivo'),
        realTransferencias: document.getElementById('real-transferencias'),
        realTotalTarjeta: document.getElementById('real-total-tarjeta'),
        realTotalVentas: document.getElementById('real-total-ventas'),
        adicionesTbody: document.getElementById('adiciones-tbody'),
        gastosTbody: document.getElementById('gastos-tbody'),
        cxcTbody: document.getElementById('cxc-tbody'),
        transferenciasTbody: document.getElementById('transferencias-tbody'),
        conteoGrid: document.getElementById('conteo-efectivo-grid'),
        cierreGastoCajaChica: document.getElementById('cierre-gasto-caja-chica'),
        diferenciaEfectivo: document.getElementById('diferencia-efectivo'),
        diferenciaTarjeta: document.getElementById('diferencia-tarjeta'),
        diferenciaTotal: document.getElementById('diferencia-total'),
        cierreMontoReal: document.getElementById('cierre-monto-real'),
        cierreMontoSistema: document.getElementById('cierre-monto-sistema'),
        entregaEfectivo: document.getElementById('entrega-efectivo'),
        entregadoA: document.getElementById('entregado-a'),
        totalFinalCaja: document.getElementById('total-final-caja'),
        comentariosFinales: document.getElementById('comentarios-finales'),
        form: document.querySelector('.form-container'),
        welcomeScreen: document.getElementById('welcome-screen'),
    mainAppScreen: document.getElementById('main-app-screen'),
   loginForm: document.getElementById('login-form'),
loginEmail: document.getElementById('login-email'),
loginPassword: document.getElementById('login-password'),
loginError: document.getElementById('login-error')
    };

    // --- MANEJADORES DE ESTADO Y EVENTOS ---

    function handleStateUpdate(event) {
        if (event.target.closest('tr')) return;
        const { name, value, type } = event.target;
        if (!name) return; // Si el input no tiene name, lo ignoramos

        const parsedValue = type === 'number' ? parseCurrency(value) : value;

        if (name.includes('.')) {
            const [key, subkey] = name.split('.');
            if (estado[key]) {
                estado[key][subkey] = parsedValue;
            }
        } else {
            estado[name] = parsedValue;
        }
        
        console.log('Estado actualizado:', estado);
        recalculateAll();
    }

    function bindEvents() {
        elements.form.addEventListener('input', handleStateUpdate);

        elements.negocio.addEventListener('change', async (event) => {
            const select = event.target;
            const negocioId = select.value;
            const negocioNombre = select.options[select.selectedIndex].text;
            estado.negocioId = negocioId;
            estado.negocioNombre = negocioNombre;
            console.log('Estado actualizado:', estado);
            
            elements.cajaChicaAnterior.dataset.value = 0;

            if (!negocioId) {
                elements.cajaChicaAnterior.value = formatter.format(0);
                recalculateAll();
                return;
            }
            elements.cajaChicaAnterior.value = "Cargando...";
            try {
                const result = await obtenerCajaChica({ negocioId });
                const totalAnterior = result.data.totalFinalEnCaja || 0;
                estado.cajaChicaAnterior = totalAnterior;
                elements.cajaChicaAnterior.value = formatter.format(totalAnterior);
                elements.cajaChicaAnterior.dataset.value = totalAnterior;
            } catch (error) {
                console.error("Error al llamar a la Cloud Function:", error);
                elements.cajaChicaAnterior.value = "Error al cargar";
            } finally {
                recalculateAll();
            }
        });

        document.getElementById('guardar-cierre-btn').addEventListener('click', guardarCierre);
        document.getElementById('confirm-save-btn').addEventListener('click', procederConGuardado);
        document.getElementById('cancel-save-btn').addEventListener('click', () => {
            document.getElementById('confirm-modal').style.display = 'none';
        });
        
        [elements.adicionesTbody, elements.gastosTbody, elements.transferenciasTbody, elements.cxcTbody].forEach(tbody => {
            tbody.addEventListener('input', recalculateAll);
        });
    }

    // --- LÓGICA DE CÁLCULO Y VISUALIZACIÓN ---
    
    // ¡IMPORTANTE! Por ahora, esta función SIGUE LEYENDO DEL DOM para no romper la funcionalidad.
    function recalculateAll() {
        const montoRealContado = Array.from(elements.conteoGrid.querySelectorAll('input')).reduce((sum, el) => sum + (parseCurrency(el.dataset.valor) * parseCurrency(el.value)), 0);
        elements.cierreMontoReal.value = formatter.format(montoRealContado);
        const cajaChicaAnterior = parseCurrency(elements.cajaChicaAnterior.dataset.value);
        const montoEncontrado = estado.montoEncontrado;
        const posVentaEfectivo = estado.ingresosPOS.efectivo;
const posVentaTarjeta = estado.ingresosPOS.tarjeta;
        const posVentaTotal = estado.ingresosPOS.total;
const verifone1 = estado.verificaciones.verifone1;
const verifone2 = estado.verificaciones.verifone2;
const entregaEfectivo = estado.entrega.monto;
        const totalAdiciones = Array.from(elements.adicionesTbody.querySelectorAll('input[name="adicion_monto"]')).reduce((sum, el) => sum + parseCurrency(el.value), 0);
        const gastosCajaChica = Array.from(elements.gastosTbody.querySelectorAll('tr')).filter(row => row.querySelector('select[name="gasto_pagado_por"]').value === 'caja_chica').reduce((sum, row) => sum + parseCurrency(row.querySelector('input[name="gasto_monto"]').value), 0);
        const cxcNeto = Array.from(elements.cxcTbody.querySelectorAll('tr')).reduce((sum, row) => {
            const operacion = row.querySelector('select[name="cxc_operacion"]').value;
            const monto = parseCurrency(row.querySelector('input[name="cxc_monto"]').value);
            if (operacion === 'pago') return sum + monto;
            if (operacion === 'deuda') return sum - monto;
            return sum;
        }, 0);
        const totalTransferencias = Array.from(elements.transferenciasTbody.querySelectorAll('input[name="transf_monto"]')).reduce((sum, el) => sum + parseCurrency(el.value), 0);
        const efectivoReal = montoRealContado - montoEncontrado - totalAdiciones + gastosCajaChica;
        elements.realEfectivo.value = efectivoReal.toFixed(2);
        elements.realTransferencias.value = formatter.format(totalTransferencias);
        const realTotalTarjeta = verifone1 + verifone2;
        elements.realTotalTarjeta.value = formatter.format(realTotalTarjeta);
        const realTotalVentas = efectivoReal + totalTransferencias + realTotalTarjeta;
        elements.realTotalVentas.value = formatter.format(realTotalVentas);
        elements.cierreGastoCajaChica.value = formatter.format(gastosCajaChica);
        const montoEnSistema = posVentaEfectivo + cajaChicaAnterior - gastosCajaChica + totalAdiciones + cxcNeto;
        elements.cierreMontoSistema.value = formatter.format(montoEnSistema);
        const diferenciaEfectivo = montoRealContado - montoEnSistema;
        const diferenciaTarjeta = realTotalTarjeta - posVentaTarjeta;
        const diferenciaTotal = realTotalVentas - posVentaTotal;
        updateDifferenceFieldWithThresholds(elements.diferenciaEfectivo, diferenciaEfectivo);
        updateDifferenceFieldWithThresholds(elements.diferenciaTarjeta, diferenciaTarjeta);
        updateDifferenceFieldWithThresholds(elements.diferenciaTotal, diferenciaTotal);
        const totalFinalCaja = montoRealContado - entregaEfectivo;
        elements.totalFinalCaja.value = formatter.format(totalFinalCaja);
    }

    /**
 * Dibuja una tabla en el DOM a partir de los datos en el estado.
 * @param {string} tbodyId - El ID del tbody de la tabla (ej: 'gastos-tbody').
 * @param {Array} dataArray - El array del estado que contiene los datos (ej: estado.gastos).
 * @param {Function} rowHtmlFactory - La función que genera el HTML para una fila.
 */
function renderTable(tbodyId, dataArray, rowHtmlFactory) {
    const tbody = document.getElementById(tbodyId);
    tbody.innerHTML = ''; // Limpiamos la tabla antes de dibujarla

    dataArray.forEach((rowData, index) => {
        const newRow = document.createElement('tr');
        // Pasamos el índice para poder identificar y eliminar la fila correcta
        newRow.innerHTML = rowHtmlFactory(rowData, index); 
        tbody.appendChild(newRow);
    });
}

    function updateDifferenceFieldWithThresholds(element, value) {
        element.value = formatter.format(value);
        element.classList.remove('diferencia-negativa', 'diferencia-aceptable', 'diferencia-advertencia');
        if (value < -10) { element.classList.add('diferencia-negativa'); } 
        else if (value > 10) { element.classList.add('diferencia-advertencia'); } 
        else { element.classList.add('diferencia-aceptable'); }
    }

    function guardarCierre() {
        const statusMessage = document.getElementById('status-message');
        statusMessage.textContent = "";
        if (!estado.negocioId || !estado.fecha || !estado.cajero) {
            statusMessage.textContent = "Error: Debes seleccionar negocio, cajero y fecha.";
            statusMessage.style.color = "var(--danger-color)";
            return;
        }
        document.getElementById('confirm-modal').style.display = 'flex';
    }

    async function procederConGuardado() {
        const modal = document.getElementById('confirm-modal');
        const guardarBtn = document.getElementById('confirm-save-btn');
        const statusMessage = document.getElementById('status-message');
        guardarBtn.disabled = true;
        guardarBtn.textContent = "Guardando...";

        try {
            const getTableData = (tbody) => Array.from(tbody.querySelectorAll('tr')).map(row => {
                const data = {};
                row.querySelectorAll('input, select').forEach(input => {
                    if (input.name) {
                        data[input.name] = input.type === 'number' ? parseCurrency(input.value) : input.value;
                    }
                });
                return data;
            }).filter(obj => Object.values(obj).some(val => val !== 0 && val !== ''));

            const conteoEfectivo = Array.from(elements.conteoGrid.querySelectorAll('input')).map(input => ({
                denominacion: parseCurrency(input.dataset.valor),
                cantidad: parseCurrency(input.value)
            })).filter(item => item.cantidad > 0);

            // Creamos el objeto final para enviar a Firebase desde nuestro 'estado'
            const cierreData = {
                ...estado, // Incluimos la mayoría de los datos del estado
                fechaCierre: new Date(estado.fecha).toISOString(), 
                adiciones: getTableData(elements.adicionesTbody),
                gastos: getTableData(elements.gastosTbody),
                cxc: getTableData(elements.cxcTbody),
                transferencias: getTableData(elements.transferenciasTbody),
                conteoEfectivo: conteoEfectivo,
                cierreCuadre: {
                    gastosCajaChica: parseCurrency(elements.cierreGastoCajaChica.value.replace(/[^0-9.-]+/g,"")),
                    montoRealContado: parseCurrency(elements.cierreMontoReal.value.replace(/[^0-9.-]+/g,"")),
                    montoEnSistema: parseCurrency(elements.cierreMontoSistema.value.replace(/[^0-9.-]+/g,"")),
                    diferenciaEfectivo: parseCurrency(elements.diferenciaEfectivo.value.replace(/[^0-9.-]+/g,"")),
                    diferenciaTarjeta: parseCurrency(elements.diferenciaTarjeta.value.replace(/[^0-9.-]+/g,"")),
                    diferenciaTotal: parseCurrency(elements.diferenciaTotal.value.replace(/[^0-9.-]+/g,"")),
                    entregaEfectivo: estado.entrega.monto,
                    entregadoA: estado.entrega.entregadoA,
                    totalFinalEnCaja: parseCurrency(elements.totalFinalCaja.value.replace(/[^0-g.-]+/g,""))
                },
            };
            
            await guardarCierreFunction(cierreData);
            
            statusMessage.textContent = "¡Cierre guardado con éxito!";
            statusMessage.style.color = "var(--success-color)";
            
            limpiarFormulario();

        } catch (error) {
            console.error("Error al llamar a la Cloud Function: ", error);
            statusMessage.textContent = `Error al guardar: ${error.message || 'Revisa la consola.'}`;
            statusMessage.style.color = "var(--danger-color)";
        } finally {
            modal.style.display = 'none';
            guardarBtn.disabled = false;
            guardarBtn.textContent = "Confirmar y Guardar";
        }
    }

    function limpiarFormulario() {
        // Implementar reseteo del formulario
        window.location.reload(); // Solución simple por ahora
    }
    
    async function cargarNegocios() {
        const negocioSelect = elements.negocio;
        try {
            const querySnapshot = await getDocs(collection(db, "negocios"));
            negocioSelect.innerHTML = '<option value="">Seleccione un negocio...</option>';
            querySnapshot.forEach((doc) => {
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = doc.data().nombre;
                negocioSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar negocios: ", error);
            negocioSelect.innerHTML = '<option value="">Error al cargar</option>';
        }
    }

    async function cargarCajeros() {
        const cajeroSelect = document.getElementById('cajero');
        try {
            const querySnapshot = await getDocs(collection(db, "cajeros"));
            cajeroSelect.innerHTML = '<option value="">Seleccione cajero...</option>';
            querySnapshot.forEach((doc) => {
                const option = document.createElement('option');
                option.value = doc.data().nombre; 
                option.textContent = doc.data().nombre;
                cajeroSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Error al cargar cajeros: ", error);
            cajeroSelect.innerHTML = '<option value="">Error al cargar</option>';
        }
    }

const setupDynamicTable = (addBtnId, tbodyId, stateArray, rowHtmlFactory, initialObject) => {
    const addBtn = document.getElementById(addBtnId);
    const tbody = document.getElementById(tbodyId);

    // Al hacer clic en "Añadir", agregamos un objeto nuevo al array del estado
    addBtn.addEventListener('click', () => {
        stateArray.push({ ...initialObject }); // Añadimos una copia del objeto inicial
        renderTable(tbodyId, stateArray, rowHtmlFactory); // Redibujamos la tabla
    });

    // Event listener para manejar cambios y eliminaciones dentro de la tabla
    tbody.addEventListener('change', (event) => {
        const target = event.target;
        const rowIndex = target.closest('tr').dataset.index;
        const fieldName = target.name;

        if (rowIndex !== undefined && fieldName) {
            // Actualizamos el objeto específico en el array del estado
            stateArray[rowIndex][fieldName] = target.type === 'number' ? parseCurrency(target.value) : target.value;
            recalculateAll();
        }
    });

    tbody.addEventListener('click', (event) => {
        if (event.target.closest('.btn-delete')) {
            const rowIndex = event.target.closest('tr').dataset.index;
            stateArray.splice(rowIndex, 1); // Eliminamos el elemento del array
            renderTable(tbodyId, stateArray, rowHtmlFactory); // Redibujamos la tabla
            recalculateAll();
        }
    });
};
    
// --- INICIALIZACIÓN DE LA APLICACIÓN ---

// Esta función contiene TODA la lógica original de tu formulario.
// Se llamará únicamente cuando el usuario haga clic en "Iniciar Sesión".
function startApp() {
    bindEvents();
    cargarNegocios();
    cargarCajeros();

    let clienteCounter = 1;

    // Adiciones
    setupDynamicTable('add-adicion-btn', 'adiciones-tbody', estado.adiciones, (adicion, index) => {
    // ... (El resto de tu código de setupDynamicTable para Adiciones)
    }, { detalle: '', monto: 0 });

    // Gastos
    setupDynamicTable('add-gasto-btn', 'gastos-tbody', estado.gastos, (gasto, index) => {
    // ... (El resto de tu código de setupDynamicTable para Gastos)
    }, { tipo: '', detalle: '', pagado_por: '', monto: 0, comentario: '' });

    // Cuentas por Cobrar (cxc)
    setupDynamicTable('add-cxc-btn', 'cxc-tbody', estado.cxc, (cxc, index) => {
    // ... (El resto de tu código de setupDynamicTable para CxC)
    }, { nombre: '', operacion: '', monto: 0 });

    // Transferencias
    setupDynamicTable('add-transferencia-btn', 'transferencias-tbody', estado.transferencias, (transf, index) => {
    // ... (El resto de tu código de setupDynamicTable para Transferencias)
    }, { nombre: '', banco: '', monto: 0 });
    
    denominaciones.forEach(valor => {
        const item = document.createElement('div');
        item.classList.add('conteo-item');
        item.innerHTML = `<label>RD$ ${valor}</label><input type="number" min="0" data-valor="${valor}" placeholder="0">`;
        item.querySelector('input').addEventListener('input', recalculateAll);
        elements.conteoGrid.appendChild(item);
    });

    recalculateAll();
}

// --- INICIALIZACIÓN DE LA APLICACIÓN ---

/**
 * Función principal que controla qué vista mostrar
 * basándose en el estado de autenticación del usuario.
 */
function handleAuthState() {
    onAuthStateChanged(auth, user => {
        if (user) {
            // --- USUARIO AUTENTICADO ---
            console.log('Usuario conectado:', user.email);
            elements.welcomeScreen.style.display = 'none';
            elements.mainAppScreen.style.display = 'block';
            startApp(); // Inicia la lógica principal de tu formulario
        } else {
            // --- USUARIO NO AUTENTICADO ---
            console.log('No hay usuario conectado.');
            elements.welcomeScreen.style.display = 'block';
            elements.mainAppScreen.style.display = 'none';
        }
    });
}

/**
 * Configura el listener para el envío del formulario de login.
 */
function setupLoginListener() {
    elements.loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = elements.loginEmail.value;
        const password = elements.loginPassword.value;
        elements.loginError.textContent = ''; // Limpiar errores previos

        try {
            await signInWithEmailAndPassword(auth, email, password);
            // El onAuthStateChanged se encargará de redirigir la vista
        } catch (error) {
            console.error('Error de inicio de sesión:', error.code);
            elements.loginError.textContent = 'Correo o contraseña incorrectos.';
        }
    });
}

// Arrancamos la aplicación
handleAuthState();      // Escucha los cambios de autenticación
setupLoginListener();   // Prepara el formulario de login

// Arrancamos la aplicación
init();
    
});