document.addEventListener("DOMContentLoaded", () => {
    configurarFormulario();
});

const macrsTablas = {
    3: [33.33, 44.45, 14.81, 7.41],
    5: [20.00, 32.00, 19.20, 11.52, 11.52, 5.76],
    7: [14.29, 24.49, 17.49, 12.49, 8.93, 8.92, 8.93, 4.46],
    10: [10.00, 18.00, 14.40, 11.52, 9.22, 7.37, 6.55, 6.55, 6.56, 6.55, 3.28]
};

function configurarFormulario() {
    const modo = document.getElementById("tipoModulo").value;
    const formDep = document.getElementById("formDepreciacion");
    const formReemp = document.getElementById("formReemplazo");
    const grupoMacrs = document.getElementById("grupo_macrs_anos");
    const grupoSalva = document.getElementById("grupo_salvamento");
    const grupoVida = document.getElementById("grupo_vida");

    ocultarResultado();

    if (modo === "reemplazo") {
        formDep.classList.add("hidden");
        formReemp.classList.remove("hidden");
    } else {
        formReemp.classList.add("hidden");
        formDep.classList.remove("hidden");

        if (modo === "macrs") {
            grupoMacrs.classList.remove("hidden");
            grupoSalva.classList.add("hidden");
            grupoVida.classList.add("hidden");
        } else {
            grupoMacrs.classList.add("hidden");
            grupoSalva.classList.remove("hidden");
            grupoVida.classList.remove("hidden");
        }
    }
}

function calcularDepreciacion() {
    const modo = document.getElementById("tipoModulo").value;
    const P = parseFloat(document.getElementById("costoInicial").value);
    const resDiv = document.getElementById("resultado");

    try {
        if (isNaN(P) || P <= 0) throw "Por favor ingrese un costo inicial de activo (P) válido mayor a 0.";

        let S = parseFloat(document.getElementById("valorSalvamento").value) || 0;
        let N = parseInt(document.getElementById("vidaUtil").value);

        if (modo !== "macrs" && (isNaN(N) || N <= 0)) throw "Por favor ingrese una vida útil en años (N > 0).";
        if (S < 0 || S >= P) throw "El valor de salvamento (S) no puede ser negativo ni superior al costo inicial (P).";

        let filasHTML = "";
        let depAcumulada = 0;
        let valorEnLibros = P;

        if (modo === "linea_recta") {
            const depAnual = trunc2(trunc2(P - S) / N);
            for (let t = 1; t <= N; t++) {
                depAcumulada = trunc2(depAcumulada + depAnual);
                valorEnLibros = trunc2(P - depAcumulada);
                filasHTML += `
                    <tr>
                        <td>Año ${t}</td>
                        <td>${formatearDual(depAnual, true)}</td>
                        <td>${formatearDual(depAcumulada, true)}</td>
                        <td>${formatearDual(valorEnLibros, true)}</td>
                    </tr>
                `;
            }
        } else if (modo === "suma_digitos") {
            const sda = (N * (N + 1)) / 2;
            const baseDep = trunc2(P - S);
            for (let t = 1; t <= N; t++) {
                const fraccion = trunc2((N - t + 1) / sda);
                const depAño = trunc2(baseDep * fraccion);
                depAcumulada = trunc2(depAcumulada + depAño);
                valorEnLibros = trunc2(P - depAcumulada);
                filasHTML += `
                    <tr>
                        <td>Año ${t}</td>
                        <td>${formatearDual(depAño, true)}</td>
                        <td>${formatearDual(depAcumulada, true)}</td>
                        <td>${formatearDual(valorEnLibros, true)}</td>
                    </tr>
                `;
            }
        } else if (modo === "saldo_decreciente") {
            const tasaD = trunc2(2 / N);
            for (let t = 1; t <= N; t++) {
                let depAño = trunc2(valorEnLibros * tasaD);
                if (trunc2(valorEnLibros - depAño) < S) {
                    depAño = trunc2(valorEnLibros - S);
                }
                depAcumulada = trunc2(depAcumulada + depAño);
                valorEnLibros = trunc2(P - depAcumulada);
                filasHTML += `
                    <tr>
                        <td>Año ${t}</td>
                        <td>${formatearDual(depAño, true)}</td>
                        <td>${formatearDual(depAcumulada, true)}</td>
                        <td>${formatearDual(valorEnLibros, true)}</td>
                    </tr>
                `;
            }
        } else if (modo === "macrs") {
            const catMacrs = parseInt(document.getElementById("tipoMacrs").value);
            const porcentajes = macrsTablas[catMacrs];
            porcentajes.forEach((pct, idx) => {
                const t = idx + 1;
                const depAño = trunc2(P * trunc2(pct / 100));
                depAcumulada = trunc2(depAcumulada + depAño);
                valorEnLibros = trunc2(P - depAcumulada);
                filasHTML += `
                    <tr>
                        <td>Año ${t} (${pct}%)</td>
                        <td>${formatearDual(depAño, true)}</td>
                        <td>${formatearDual(depAcumulada, true)}</td>
                        <td>${formatearDual(valorEnLibros, true)}</td>
                    </tr>
                `;
            });
        }

        const htmlRes = `
            <strong>Tabla de Depreciación Programada:</strong><br>
            <table class="tabla-resultados">
                <thead>
                    <tr>
                        <th>Período</th>
                        <th>Depreciación Anual</th>
                        <th>Depreciación Acumulada</th>
                        <th>Valor en Libros</th>
                    </tr>
                </thead>
                <tbody>
                    ${filasHTML}
                </tbody>
            </table>
        `;

        mostrarExito(resDiv, htmlRes);

    } catch (err) {
        mostrarError(resDiv, err);
    }
}

function evaluarReemplazo() {
    const tmarIn = parseFloat(document.getElementById("tmarReemplazo").value);
    const resDiv = document.getElementById("resultado");

    try {
        if (isNaN(tmarIn) || tmarIn < 0) throw "Ingrese una tasa TMAR válida.";
        const i = trunc2(tmarIn / 100);

        // Defensor
        const pDef = parseFloat(document.getElementById("p_defensor").value);
        const caoDef = parseFloat(document.getElementById("cao_defensor").value);
        const sDef = parseFloat(document.getElementById("s_defensor").value);
        const nDef = parseInt(document.getElementById("n_defensor").value);

        // Retador
        const pRet = parseFloat(document.getElementById("p_retador").value);
        const caoRet = parseFloat(document.getElementById("cao_retador").value);
        const sRet = parseFloat(document.getElementById("s_retador").value);
        const nRet = parseInt(document.getElementById("n_retador").value);

        if ([pDef, caoDef, sDef, nDef, pRet, caoRet, sRet, nRet].some(isNaN)) {
            throw "Por favor complete todos los datos del Defensor y Retador.";
        }

        // Fórmulas CAUE
        // CAUE = P*(A/P, i, N) + CAO - S*(A/F, i, N)
        const factorAP_Def = trunc2((i * Math.pow(1 + i, nDef)) / (Math.pow(1 + i, nDef) - 1));
        const factorAF_Def = trunc2(i / (Math.pow(1 + i, nDef) - 1));
        const caueDef = trunc2(trunc2(pDef * factorAP_Def) + caoDef - trunc2(sDef * factorAF_Def));

        const factorAP_Ret = trunc2((i * Math.pow(1 + i, nRet)) / (Math.pow(1 + i, nRet) - 1));
        const factorAF_Ret = trunc2(i / (Math.pow(1 + i, nRet) - 1));
        const caueRet = trunc2(trunc2(pRet * factorAP_Ret) + caoRet - trunc2(sRet * factorAF_Ret));

        let decision = "";
        let colorDec = "";

        if (caueRet < caueDef) {
            decision = "REEMPLAZAR AHORA AL DEFENSOR POR EL RETADOR";
            colorDec = "val-positivo";
        } else {
            decision = "CONSERVAR EL DEFENSOR ACTUAL (No reemplazar aún)";
            colorDec = "val-negativo";
        }

        const htmlRes = `
            <div style="text-align: left; font-size: 14px; font-weight: normal; line-height: 1.6;">
                <strong>📊 Resultados del Análisis de Reemplazo:</strong><br><br>
                • <strong>CAUE del Defensor (Activo Actual):</strong><br>
                ${formatearDual(caueDef, true)} / año (N_D = ${nDef} años)<br><br>
                
                • <strong>CAUE del Retador (Activo Nuevo):</strong><br>
                ${formatearDual(caueRet, true)} / año (N_R = ${nRet} años)<br><br>
                
                <div style="font-size: 16px; border-top: 1px solid var(--azul-borde); padding-top: 10px;">
                    <strong>Decisión Óptima:</strong> <span class="${colorDec}">${decision}</span>
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
