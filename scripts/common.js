/**
 * Utilidades comunes para la Calculadora Financiera
 */

// Función de truncado a 2 decimales para todas las operaciones intermedias y finales
function trunc2(num) {
    if (isNaN(num) || !isFinite(num)) return 0;
    const factor = 100;
    return Math.trunc(num * factor) / factor;
}

// Obtener la configuración global de moneda y tasa de cambio desde localStorage
function getMonedaConfig() {
    const divisa = localStorage.getItem('monedaGlobal') || '$'; // '$' (USD) o '€' (EUR)
    let tasaBs = parseFloat(localStorage.getItem('tasaBs'));
    if (isNaN(tasaBs) || tasaBs <= 0) {
        tasaBs = divisa === '€' ? 43.50 : 40.00;
    }
    return { divisa, tasaBs };
}

// Formatear montos mostrando por defecto en Bolívares (Bs.) y en la divisa seleccionada ($ o €)
function formatearDual(monto, esBaseDivisa = true) {
    const { divisa, tasaBs } = getMonedaConfig();
    let montoBs = 0;
    let montoDivisa = 0;

    if (esBaseDivisa) {
        montoDivisa = trunc2(monto);
        montoBs = trunc2(montoDivisa * tasaBs);
    } else {
        montoBs = trunc2(monto);
        montoDivisa = trunc2(montoBs / tasaBs);
    }

    const signoBs = montoBs < 0 ? '-' : '';
    const signoDiv = montoDivisa < 0 ? '-' : '';

    const bsAbs = Math.abs(montoBs).toFixed(2);
    const divAbs = Math.abs(montoDivisa).toFixed(2);

    return `
        <div class="monto-dual">
            <span class="monto-bs">${signoBs}Bs. ${bsAbs}</span>
            <span class="monto-divisa">(${signoDiv}${divisa} ${divAbs} ${divisa === '$' ? 'USD' : 'EUR'})</span>
        </div>
    `;
}

// Función genérica para limpiar campos de cualquier formulario
function limpiarCamposGenerico(contenedorId = 'formularioCampos') {
    const container = document.getElementById(contenedorId) || document;
    const inputs = container.querySelectorAll('input[type="number"], input[type="text"]');
    inputs.forEach(input => {
        input.value = '';
    });
    
    const selects = container.querySelectorAll('select');
    selects.forEach(select => {
        // Si no es un control principal permanente
        if (select.id !== 'tipoInteres' && select.id !== 'tipoModulo' && select.id !== 'tipoCalculo' && select.id !== 'modeloCalculo') {
            select.selectedIndex = 0;
        }
    });

    const resDiv = document.getElementById('resultado');
    if (resDiv) {
        resDiv.style.display = 'none';
        resDiv.innerHTML = '';
    }
}
