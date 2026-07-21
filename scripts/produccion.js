document.addEventListener("DOMContentLoaded", () => {
    configurarFormulario();
});

function configurarFormulario() {
    const objetivo = document.getElementById("variableObjetivo").value;

    ocultarResultado();

    const grupoQ = document.getElementById("grupo_Q");
    const grupoQmax = document.getElementById("grupo_Qmax");
    const grupoUtil = document.getElementById("grupo_utilizacion");

    grupoQ.classList.remove("hidden");
    grupoQmax.classList.remove("hidden");
    grupoUtil.classList.remove("hidden");

    if (objetivo === "util") {
        grupoUtil.classList.add("hidden");
    } else if (objetivo === "Q") {
        grupoQ.classList.add("hidden");
    } else if (objetivo === "Qmax") {
        grupoQmax.classList.add("hidden");
    }
}

function ejecutarCalculoProduccion() {
    const objetivo = document.getElementById("variableObjetivo").value;
    const resDiv = document.getElementById("resultado");

    const Q = parseFloat(document.getElementById("cantidad").value);
    const Qmax = parseFloat(document.getElementById("capacidadMax").value);
    const utilIn = parseFloat(document.getElementById("tasaUtilizacion").value);
    const util = !isNaN(utilIn) ? trunc2(utilIn / 100) : null;

    let resVal = 0;
    let textoRes = "";

    try {
        if (objetivo === "util") {
            if (isNaN(Q) || isNaN(Qmax) || Qmax === 0) throw "Por favor ingrese Q y Q_max válidos (Q_max > 0).";
            if (Q < 0 || Qmax < 0) throw "Los valores no admiten números negativos.";
            resVal = trunc2(Q / Qmax);
            if (resVal > 1) throw "La producción real no puede ser mayor que la capacidad máxima (>100%).";
            const pct = trunc2(resVal * 100);
            textoRes = `<strong>Tasa de Utilización de Capacidad:</strong><br><span class="val-positivo" style="font-size:22px; font-weight:800;">${pct.toFixed(2)}%</span>`;
        } else if (objetivo === "Q") {
            if (util === null || isNaN(Qmax)) throw "Por favor ingrese la tasa de utilización y Q_max.";
            if (util < 0 || util > 1) throw "La tasa de utilización debe estar entre 0 y 100%.";
            resVal = trunc2(Qmax * util);
            textoRes = `<strong>Producción Real Estimada (Q):</strong><br><span class="val-positivo" style="font-size:22px; font-weight:800;">${resVal.toFixed(2)} unidades</span>`;
        } else if (objetivo === "Qmax") {
            if (isNaN(Q) || util === null || util === 0) throw "Por favor ingrese Q y la tasa de utilización (utilización > 0).";
            resVal = trunc2(Q / util);
            textoRes = `<strong>Capacidad Máxima Requerida (Q_max):</strong><br><span class="val-positivo" style="font-size:22px; font-weight:800;">${resVal.toFixed(2)} unidades</span>`;
        }

        mostrarExito(resDiv, textoRes);
    } catch (error) {
        mostrarError(resDiv, error);
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