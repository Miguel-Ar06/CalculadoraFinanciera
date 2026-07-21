document.addEventListener("DOMContentLoaded", () => {
    // Escuchar cambios
});

function calcularCocomo() {
    const klocInput = parseFloat(document.getElementById("kloc").value);
    const slocPerFp = parseFloat(document.getElementById("lenguaje").value);
    const modo = document.getElementById("modoCocomo").value;
    const salarioInput = parseFloat(document.getElementById("salarioMensual").value);
    const resDiv = document.getElementById("resultado");

    try {
        if (isNaN(klocInput) || klocInput <= 0) throw "Por favor ingrese un valor de KLOC (Líneas de código x 1000) mayor a 0.";

        const KLOC = trunc2(klocInput);
        const SLOC = trunc2(KLOC * 1000);
        const salarioMensual = !isNaN(salarioInput) && salarioInput >= 0 ? trunc2(salarioInput) : 1000;

        // Calcular Puntos de Función Equivalentes (FP)
        const fp = trunc2(SLOC / slocPerFp);

        // Constantes del Modo de Proyecto
        let a = 3.2, b = 1.05, c = 2.5, d = 0.38;
        if (modo === "semiacoplado") {
            a = 3.0; b = 1.12; c = 2.5; d = 0.35;
        } else if (modo === "embebido") {
            a = 3.6; b = 1.20; c = 2.5; d = 0.32;
        }

        // Obtener los 14 multiplicadores de esfuerzo
        const idsEM = [
            "em_rely", "em_data", "em_cplx", "em_time", "em_stor", "em_virt", "em_turn",
            "em_capb", "em_aexp", "em_pcap", "em_vexp", "em_lexp", "em_modp", "em_tool"
        ];

        let EAF = 1.0;
        idsEM.forEach(id => {
            const val = parseFloat(document.getElementById(id).value);
            if (!isNaN(val)) EAF *= val;
        });
        EAF = trunc2(EAF);

        // Fórmulas COCOMO II con truncado a 2 decimales
        const klocPow = trunc2(Math.pow(KLOC, b));
        const PM = trunc2(a * trunc2(klocPow * EAF)); // Personas-Mes

        const pmPow = trunc2(Math.pow(PM, d));
        const TDEV = trunc2(c * pmPow); // Meses

        const personal = TDEV > 0 ? trunc2(PM / TDEV) : 0;
        const costoDivisaBase = trunc2(PM * salarioMensual);

        const htmlRes = `
            <div style="text-align: left; font-size: 14px; font-weight: normal; line-height: 1.6;">
                <strong>📊 Resultados de Estimación COCOMO II:</strong><br><br>
                • <strong>Líneas de Código (SLOC):</strong> ${SLOC.toLocaleString()} líneas (${KLOC.toFixed(2)} KLOC)<br>
                • <strong>Puntos de Función Estimados (FP):</strong> ~${fp.toFixed(2)} FP<br>
                • <strong>Factor de Ajuste de Esfuerzo (EAF):</strong> ${EAF.toFixed(4)}<br><br>
                
                • <strong>Esfuerzo Requerido (PM):</strong> <span class="val-positivo" style="font-size:18px; font-weight:800;">${PM.toFixed(2)} Personas-Mes</span><br>
                • <strong>Tiempo de Desarrollo (TDEV):</strong> <span class="val-positivo" style="font-size:18px; font-weight:800;">${TDEV.toFixed(2)} Meses</span><br>
                • <strong>Personal Requerido Promedio:</strong> <span class="val-positivo" style="font-size:18px; font-weight:800;">${Math.ceil(personal)} Desarrolladores</span> (Exacto: ${personal.toFixed(2)})<br><br>
                
                <div style="border-top: 1px solid var(--azul-borde); padding-top: 10px; margin-top: 10px;">
                    <strong>💰 Costo Total Estimado del Proyecto:</strong><br>
                    ${formatearDual(costoDivisaBase, true)}
                </div>
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
