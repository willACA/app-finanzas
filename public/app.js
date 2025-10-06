// --- 1. IMPORTACIONES DE FIREBASE ---
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
        import { getFirestore, collection, getDocs, connectFirestoreEmulator } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
        import { getFunctions, httpsCallable, connectFunctionsEmulator } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-functions.js";
        
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
        
        // --- 3. REFERENCIAS A LAS CLOUD FUNCTIONS ---
        const obtenerCajaChica = httpsCallable(functions, 'obtenerCajaChicaAnterior');
        const guardarCierreFunction = httpsCallable(functions, 'procesarYGuardarCierre');

        // --- 4. CONEXIÓN A EMULADORES (SOLO PARA DESARROLLO LOCAL) ---
        if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
            console.log("Estamos en local. Conectando a los emuladores...");
            connectFirestoreEmulator(db, '127.0.0.1', 8080);
            connectFunctionsEmulator(functions, '127.0.0.1', 5001);
        }

        // --- 5. LÓGICA DE LA APLICACIÓN ---
        document.addEventListener('DOMContentLoaded', function() {
            
            const formatter = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP' });
            const parseCurrency = (value) => parseFloat(value) || 0;
            const denominaciones = [2000, 1000, 500, 200, 100, 50, 25, 10, 5, 1];

            const elements = {
                negocio: document.getElementById('negocio'),
                cajero: document.getElementById('cajero'),
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
                totalFinalCaja: document.getElementById('total-final-caja'),
            };

            // === FUNCIONES PRINCIPALES ===

            function recalculateAll() {
                const montoRealContado = Array.from(elements.conteoGrid.querySelectorAll('input')).reduce((sum, el) => sum + (parseCurrency(el.dataset.valor) * parseCurrency(el.value)), 0);
                elements.cierreMontoReal.value = formatter.format(montoRealContado);
                const cajaChicaAnterior = parseCurrency(elements.cajaChicaAnterior.dataset.value);
                const montoEncontrado = parseCurrency(elements.montoEncontrado.value);
                const posVentaEfectivo = parseCurrency(elements.posVentaEfectivo.value);
                const posVentaTarjeta = parseCurrency(elements.posVentaTarjeta.value);
                const posVentaTotal = parseCurrency(elements.posVentaTotal.value);
                const verifone1 = parseCurrency(elements.verifone1.value);
                const verifone2 = parseCurrency(elements.verifone2.value);
                const entregaEfectivo = parseCurrency(elements.entregaEfectivo.value);
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
                const negocioId = document.getElementById('negocio').value;
                const fecha = document.getElementById('fecha').value;
                const cajero = document.getElementById('cajero').value;
                if (!negocioId || !fecha || !cajero) {
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

                    const cierreData = {
                        negocioId: elements.negocio.value,
                        fechaCierre: new Date(document.getElementById('fecha').value).toISOString(), 
                        cajero: elements.cajero.value,
                        cajaChicaAnterior: parseCurrency(elements.cajaChicaAnterior.dataset.value),
                        montoEncontrado: parseCurrency(elements.montoEncontrado.value),
                        ingresosPOS: {
                            efectivo: parseCurrency(elements.posVentaEfectivo.value),
                            transferencias: parseCurrency(elements.posTransferencias.value),
                            tarjeta: parseCurrency(elements.posVentaTarjeta.value),
                            total: parseCurrency(elements.posVentaTotal.value)
                        },
                        ingresosReales: {
                            efectivo: parseCurrency(elements.realEfectivo.value),
                            transferencias: parseCurrency(elements.realTransferencias.value.replace(/[^0-9.-]+/g,"")),
                            verifone1: parseCurrency(elements.verifone1.value),
                            verifone2: parseCurrency(elements.verifone2.value),
                            totalTarjeta: parseCurrency(elements.realTotalTarjeta.value.replace(/[^0-9.-]+/g,"")),
                            totalVentas: parseCurrency(elements.realTotalVentas.value.replace(/[^0-9.-]+/g,""))
                        },
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
                            entregaEfectivo: parseCurrency(elements.entregaEfectivo.value),
                            entregadoA: document.getElementById('entregado-a').value,
                            totalFinalEnCaja: parseCurrency(elements.totalFinalCaja.value.replace(/[^0-9.-]+/g,""))
                        },
                        comentariosFinales: document.getElementById('comentarios-finales').value
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
                ['monto-encontrado', 'pos-venta-efectivo', 'pos-transferencias', 'pos-venta-tarjeta', 'pos-venta-total', 'real-efectivo', 'verifone-1', 'verifone-2', 'entrega-efectivo', 'comentarios-finales'].forEach(id => {
                    document.getElementById(id).value = '';
                });

                ['negocio', 'cajero', 'entregado-a'].forEach(id => { document.getElementById(id).selectedIndex = 0; });
                document.getElementById('fecha').valueAsDate = null;
                
                document.querySelectorAll('#conteo-efectivo-grid input').forEach(input => input.value = '');

                ['adiciones-tbody', 'gastos-tbody', 'cxc-tbody', 'transferencias-tbody'].forEach(tbodyId => {
                    const tbody = document.getElementById(tbodyId);
                    tbody.innerHTML = '';
                    const addBtnId = `add-${tbodyId.replace('-tbody', '')}-btn`;
                    if (document.getElementById(addBtnId)) {
                        document.getElementById(addBtnId).click();
                    }
                });
                
                for(let i = 0; i < 4; i++) {
                    document.getElementById('add-gasto-btn').click();
                    document.getElementById('add-cxc-btn').click();
                    document.getElementById('add-transferencia-btn').click();
                }

                recalculateAll(); 

                setTimeout(() => { 
                    const statusMessage = document.getElementById('status-message');
                    if (statusMessage) statusMessage.textContent = ''; 
                }, 5000);
                
                elements.cajaChicaAnterior.value = formatter.format(0);
                elements.cajaChicaAnterior.dataset.value = 0;
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

            // === ASIGNACIÓN DE EVENTOS (EVENT LISTENERS) ===
            document.getElementById('guardar-cierre-btn').addEventListener('click', guardarCierre);
            document.getElementById('confirm-save-btn').addEventListener('click', procederConGuardado);
            document.getElementById('cancel-save-btn').addEventListener('click', () => {
                document.getElementById('confirm-modal').style.display = 'none';
            });

            elements.negocio.addEventListener('change', async (event) => {
                const negocioId = event.target.value;
                elements.cajaChicaAnterior.dataset.value = 0;
                if (!negocioId) {
                    elements.cajaChicaAnterior.value = formatter.format(0);
                    recalculateAll();
                    return;
                }
                elements.cajaChicaAnterior.value = "Cargando...";
                try {
                    const result = await obtenerCajaChica({ negocioId: negocioId });
                    const totalAnterior = result.data.totalFinalEnCaja || 0;
                    elements.cajaChicaAnterior.value = formatter.format(totalAnterior);
                    elements.cajaChicaAnterior.dataset.value = totalAnterior;
                    console.log(`Caja chica anterior cargada: ${totalAnterior}`);
                } catch (error) {
                    console.error("Error al llamar a la Cloud Function:", error);
                    elements.cajaChicaAnterior.value = "Error al cargar";
                } finally {
                    recalculateAll();
                }
            });

            const fieldsToRecalculate = [
                'monto-encontrado', 'pos-venta-efectivo', 'pos-venta-tarjeta', 'pos-transferencias',
                'verifone-1', 'verifone-2', 'entrega-efectivo', 'real-efectivo'
            ];
            fieldsToRecalculate.forEach(id => document.getElementById(id)?.addEventListener('input', recalculateAll));
            
            [elements.adicionesTbody, elements.gastosTbody, elements.transferenciasTbody, elements.cxcTbody].forEach(tbody => {
                tbody.addEventListener('input', recalculateAll);
            });

            // === INICIALIZACIÓN DE COMPONENTES DINÁMICOS ===
            const setupDynamicTable = (addBtnId, tbodyId, rowHtmlFactory, initialRows = 1) => {
                const addBtn = document.getElementById(addBtnId);
                const tbody = document.getElementById(tbodyId);
                const addRow = () => {
                    const newRow = document.createElement('tr');
                    newRow.innerHTML = rowHtmlFactory();
                    tbody.appendChild(newRow);
                    newRow.querySelector('.btn-delete').addEventListener('click', () => {
                        newRow.remove();
                        recalculateAll();
                    });
                };
                addBtn.addEventListener('click', addRow);
                for (let i = 0; i < initialRows; i++) addRow();
            };

            let clienteCounter = 1;
            setupDynamicTable('add-adicion-btn', 'adiciones-tbody', () => `<td><input type="text" placeholder="Ej: Aporte de socio" name="adicion_detalle"></td><td><input type="number" placeholder="0.00" step="0.01" name="adicion_monto"></td><td><button type="button" class="btn btn-delete"><svg viewBox="0 0 20 20"><path d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"></path></svg></button></td>`);
            setupDynamicTable('add-gasto-btn', 'gastos-tbody', () => `<td><select name="gasto_tipo"><option value="">Seleccione...</option><option value="variable">Gasto Variable</option></select></td><td><select name="gasto_detalle"><option value="">Seleccione...</option><option value="supermercado">Supermercado</option></select></td><td><select name="gasto_pagado_por"><option value="">Seleccione...</option><option value="caja_chica">Caja Chica</option></select></td><td><input type="number" placeholder="0.00" step="0.01" name="gasto_monto"></td><td><input type="text" placeholder="Nota opcional" name="gasto_comentario"></td><td><button type="button" class="btn btn-delete"><svg viewBox="0 0 20 20"><path d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"></path></svg></button></td>`, 5);
            setupDynamicTable('add-cxc-btn', 'cxc-tbody', () => `<td><select name="cxc_nombre"><option value="">Seleccione...</option><option value="empleado_1">Empleado 1</option></select></td><td><select name="cxc_operacion"><option value="">Seleccione...</option><option value="deuda">Deuda</option><option value="pago">Pago</option></select></td><td><input type="number" placeholder="0.00" step="0.01" name="cxc_monto"></td><td><button type="button" class="btn btn-delete"><svg viewBox="0 0 20 20"><path d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"></path></svg></button></td>`, 5);
            setupDynamicTable('add-transferencia-btn', 'transferencias-tbody', () => `<td>Cliente ${clienteCounter++}</td><td><select name="transf_banco"><option value="">Seleccione banco...</option><option value="bhd">BHD</option></select></td><td><input type="number" placeholder="0.00" step="0.01" name="transf_monto"></td><td><button type="button" class="btn btn-delete"><svg viewBox="0 0 20 20"><path d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"></path></svg></button></td>`, 5);
            
            denominaciones.forEach(valor => {
                const item = document.createElement('div');
                item.classList.add('conteo-item');
                item.innerHTML = `<label>RD$ ${valor}</label><input type="number" min="0" data-valor="${valor}" placeholder="0">`;
                item.querySelector('input').addEventListener('input', recalculateAll);
                elements.conteoGrid.appendChild(item);
            });
            
            cargarNegocios();
            cargarCajeros(); 
            recalculateAll();
        });