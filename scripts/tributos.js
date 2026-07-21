document.addEventListener("DOMContentLoaded", () => {
    configurarFormulario();
});

function configurarFormulario() {
    const modo = document.getElementById("tipoTributo").value;
    const formISLR = document.getElementById("formISLR");
    const formIVA = document.getElementById("formIVA");
    const formIGTF = document.getElementById("formIGTF");
    const formEscudo = document.getElementById("formEscudo");

    ocultarResultado();

    formISLR.classList.add("hidden");
    formIVA.classList.add("hidden");
    formIGTF.classList.add("hidden");
    formEscudo.classList.add("hidden");

    if (modo === "islr") formISLR.classList.remove("hidden");
    else if (modo === "iva") formIVA.classList.remove("hidden");
    else if (modo === "igtf") formIGTF.classList.remove("hidden");
    else if (modo === "escudo") formEscudo.classList.remove("hidden");
}

function calcularISLR() {
    const ingresos = parseFloat(document.getElementById("ingresosBrutos").value);
    const gastos = parseFloat(document.getElementById("gastosDeducibles").value);
    const dep = parseFloat(document.getElementById("depreciacionAnual").value) || 0;
    const tasaIn = parseFloat(document.getElementById("tasaIslr").value);
    const resDiv = document.getElementById("resultado");

    try {
        if ([ingresos, gastos, tasaIn].some(isNaN)) throw "Por favor ingrese todos los valores obligatorios del ISLR.";
        if (ingresos < 0 || gastos < 0 || dep < 0 || tasaIn < 0) throw "Los datos no pueden ser negativos.";

        const T = trunc2(tasaIn / 100);
        const deduccionesTotales = trunc2(gastos + dep);
        const rentaNeta = trunc2(ingresos - deduccionesTotales);

        let islrMonto = 0;
        if (rentaNeta > 0) {
            islrMonto = trunc2(rentaNeta * T);
        }

        // FEDI = (Ingresos - Gastos - Depreciacion)*(1 - T) + Depreciacion
        // O equivalente: Renta Neta - ISLR + Depreciacion
        const fedi = trunc2(trunc2(rentaNeta - islrMonto) + dep);

        const htmlRes = `
            <div style="text-align: left; font-size: 14px; font-weight: normal; line-height: 1.6;">
                <strong>📊 Resultados del Cálculo Tributario ISLR (Venezuela):</strong><br><br>
                • <strong>Renta Neta Gravable:</strong><br> ${formatearDual(rentaNeta, true)}<br><br>
                • <strong>Impuesto ISLR Estimado a Pagar (${tasaIn}%):</strong><br> ${formatearDual(islrMonto, true)}<br><br>
                
                <div style="border-top: 1px solid var(--azul-borde); padding-top: 10px; margin-top: 10px;">
                    <strong>💵 Flujo de Efectivo Después de Impuestos (FEDI / FADI):</strong><br>
                    ${formatearDual(fedi, true)}
                </div>
            </div>
        `;

        mostrarExito(resDiv, htmlRes);

    } catch (err) {
        mostrarError(resDiv, err);
    }
}

function calcularIVA() {
    const ventas = parseFloat(document.getElementById("ventasBase").value);
    const compras = parseFloat(document.getElementById("comprasBase").value);
    const alicuotaIn = parseFloat(document.getElementById("alicuotaIva").value);
    const resDiv = document.getElementById("resultado");

    try {
        if (isNaN(ventas) || isNaN(compras)) throw "Ingrese las bases imponibles de ventas y compras.";
        const alicuota = trunc2(alicuotaIn / 100);

        const debitoFiscal = trunc2(ventas * alicuota);
        const creditoFiscal = trunc2(compras * alicuota);
        const cuotaIva = trunc2(debitoFiscal - creditoFiscal);

        let textoCuota = "";
        if (cuotaIva >= 0) {
            textoCuota = `• <strong>Cuota Neta de IVA a Pagar al SENIAT:</strong><br> ${formatearDual(cuotaIva, true)}`;
        } else {
            const remanente = Math.abs(cuotaIva);
            textoCuota = `• <strong>Excedente / Crédito Fiscal para el Siguiente Período:</strong><br> ${formatearDual(remanente, true)}`;
        }

        const htmlRes = `
            <div style="text-align: left; font-size: 14px; font-weight: normal; line-height: 1.6;">
                <strong>📊 Resumen de Liquidación del IVA (${alicuotaIn}%):</strong><br><br>
                • <strong>Débito Fiscal (Ventas):</strong> ${formatearDual(debitoFiscal, true)}<br>
                • <strong>Crédito Fiscal (Compras):</strong> ${formatearDual(creditoFiscal, true)}<br><br>
                ${textoCuota}
            </div>
        `;

        mostrarExito(resDiv, htmlRes);

    } catch (err) {
        mostrarError(resDiv, err);
    }
}

function calcularIGTF() {
    const monto = parseFloat(document.getElementById("montoOperacion").value);
    const tasaIn = parseFloat(document.getElementById("tasaIgtf").value);
    const resDiv = document.getElementById("resultado");

    try {
        if (isNaN(monto) || monto <= 0) throw "Ingrese un monto de operación en divisas válido.";
        const tasa = trunc2(tasaIn / 100);

        const igtfMonto = trunc2(monto * tasa);
        const totalConIgtf = trunc2(monto + igtfMonto);

        const htmlRes = `
            <div style="text-align: left; font-size: 14px; font-weight: normal; line-height: 1.6;">
                <strong>📊 Cálculo del IGTF (${tasaIn}%):</strong><br><br>
                • <strong>Monto Base de la Transacción:</strong><br> ${formatearDual(monto, true)}<br><br>
                • <strong>Impuesto IGTF Retenido / Cobrado:</strong><br> ${formatearDual(igtfMonto, true)}<br><br>
                • <strong>Monto Total Desembolsado con IGTF:</strong><br> ${formatearDual(totalConIgtf, true)}
            </div>
        `;

        mostrarExito(resDiv, htmlRes);

    } catch (err) {
        mostrarError(resDiv, err);
    }
}

function calcularEscudo() {
    const dep = parseFloat(document.getElementById("montoDepreciacionEscudo").value);
    const tasaIn = parseFloat(document.getElementById("tasaIslrEscudo").value);
    const resDiv = document.getElementById("resultado");

    try {
        if (isNaN(dep) || isNaN(tasaIn) || dep < 0) throw "Ingrese un monto de depreciación válido.";
        const T = trunc2(tasaIn / 100);

        const escudoMonto = trunc2(dep * T);

        const htmlRes = `
            <div style="text-align: left; font-size: 14px; font-weight: normal; line-height: 1.6;">
                <strong>🛡️ Escudo Fiscal de la Depreciación (Tax Shield):</strong><br><br>
                • <strong>Ahorro Tributario Anual en ISLR:</strong><br>
                ${formatearDual(escudoMonto, true)}<br><br>
                <small>* Este monto representa el ahorro directo de efectivo al deducir la depreciación del impuesto imponible.</small>
            </div>
        `;

        mostrarExito(resDiv, htmlRes);

    } catch (err) {
        mostrarError(resDiv, err);
    }
}

function mostrarExito(elemento, texto) {
    elemento.innerHTML = texto;
    elemento.className = ""; 
    elemento.style.display = "block";
}

function mostrarError(elemento, mensaje) {
    elemento.innerHTML = `Error: <span class="val-negativo">${mensaje}</span>`;
    elemento.className = "error-msg";
    elemento.style.display = "block";
}

function ocultarResultado() {
    const resDiv = document.getElementById("resultado");
    if (resDiv) resDiv.style.display = "none";
}

document.addEventListener("input", function(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") {
        ocultarResultado();
    }
});
