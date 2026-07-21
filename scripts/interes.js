document.addEventListener("DOMContentLoaded", () => {
    configurarFormulario();
});

function configurarFormulario() {
    const objetivo = document.getElementById("variableACalcular").value;

    const grupoP = document.getElementById("grupo_P");
    const grupoF = document.getElementById("grupo_F");
    const grupoi = document.getElementById("grupo_i");
    const grupoN = document.getElementById("grupo_N");

    // Ocultar resultado anterior
    ocultarResultado();

    // Resetear visibilidad
    grupoP.classList.remove("hidden");
    grupoF.classList.remove("hidden");
    grupoi.classList.remove("hidden");
    grupoN.classList.remove("hidden");

    // Ocultar el campo que se desea calcular (incógnita)
    if (objetivo === "futuro") {
        grupoF.classList.add("hidden");
    } else if (objetivo === "presente") {
        grupoP.classList.add("hidden");
    } else if (objetivo === "tasa") {
        grupoi.classList.add("hidden");
    } else if (objetivo === "periodos") {
        grupoN.classList.add("hidden");
    } else if (objetivo === "interes") {
        grupoF.classList.add("hidden"); // En cálculo de interés se usa P, i, N
    }
}

function calcularInteres() {
    const tipo = document.querySelector('input[name="tipoInteres"]:checked').value;
    const objetivo = document.getElementById("variableACalcular").value;
    const resDiv = document.getElementById("resultado");

    const P = parseFloat(document.getElementById("cantPresente").value);
    const F = parseFloat(document.getElementById("cantFutura").value);
    const iInput = parseFloat(document.getElementById("tasaInteres").value);
    const N = parseFloat(document.getElementById("numeroPeriodos").value);

    try {
        let resultadoVal = 0;
        let etiqueta = "";
        let esMontoMoneda = false;

        if (objetivo === "futuro") {
            if ([P, iInput, N].some(isNaN)) throw "Por favor complete los campos P, i% y N.";
            if (P < 0 || iInput < 0 || N < 0) throw "Los valores ingresados deben ser mayores o iguales a 0.";

            const iDec = trunc2(iInput / 100);

            if (tipo === "simple") {
                const iN = trunc2(iDec * N);
                const factor = trunc2(1 + iN);
                resultadoVal = trunc2(P * factor);
            } else {
                const base = trunc2(1 + iDec);
                const powFactor = trunc2(Math.pow(base, N));
                resultadoVal = trunc2(P * powFactor);
            }
            etiqueta = "Valor Futuro (F)";
            esMontoMoneda = true;
        }
        
        else if (objetivo === "presente") {
            if ([F, iInput, N].some(isNaN)) throw "Por favor complete los campos F, i% y N.";
            if (F < 0 || iInput < 0 || N < 0) throw "Los valores ingresados deben ser mayores o iguales a 0.";

            const iDec = trunc2(iInput / 100);

            if (tipo === "simple") {
                const iN = trunc2(iDec * N);
                const factor = trunc2(1 + iN);
                if (factor === 0) throw "División por cero en la fórmula de despeje.";
                resultadoVal = trunc2(F / factor);
            } else {
                const base = trunc2(1 + iDec);
                const powFactor = trunc2(Math.pow(base, N));
                if (powFactor === 0) throw "División por cero en la fórmula de despeje.";
                resultadoVal = trunc2(F / powFactor);
            }
            etiqueta = "Valor Presente (P)";
            esMontoMoneda = true;
        }

        else if (objetivo === "tasa") {
            if ([P, F, N].some(isNaN)) throw "Por favor complete los campos P, F y N.";
            if (P <= 0 || F <= 0 || N <= 0) throw "P, F y N deben ser mayores a 0.";

            if (tipo === "simple") {
                const dif = trunc2(F - P);
                const den = trunc2(P * N);
                if (den === 0) throw "División por cero en el cálculo.";
                const iDec = trunc2(dif / den);
                resultadoVal = trunc2(iDec * 100);
            } else {
                const ratio = trunc2(F / P);
                const exp = trunc2(1 / N);
                const rootFactor = trunc2(Math.pow(ratio, exp));
                const iDec = trunc2(rootFactor - 1);
                resultadoVal = trunc2(iDec * 100);
            }
            etiqueta = "Tasa de Interés (i)";
            esMontoMoneda = false;
        }

        else if (objetivo === "periodos") {
            if ([P, F, iInput].some(isNaN)) throw "Por favor complete los campos P, F e i%.";
            if (P <= 0 || F <= 0 || iInput <= 0) throw "P, F e i% deben ser mayores a 0.";

            const iDec = trunc2(iInput / 100);

            if (tipo === "simple") {
                const dif = trunc2(F - P);
                const den = trunc2(P * iDec);
                if (den === 0) throw "División por cero en el cálculo.";
                resultadoVal = trunc2(dif / den);
            } else {
                const ratio = trunc2(F / P);
                const logNum = trunc2(Math.log(ratio));
                const logDen = trunc2(Math.log(trunc2(1 + iDec)));
                if (logDen === 0) throw "División por cero en el cálculo logarítmico.";
                resultadoVal = trunc2(logNum / logDen);
            }
            etiqueta = "Número de Períodos (N)";
            esMontoMoneda = false;
        }

        else if (objetivo === "interes") {
            if ([P, iInput, N].some(isNaN)) throw "Por favor complete los campos P, i% y N.";
            if (P < 0 || iInput < 0 || N < 0) throw "Los valores deben ser mayores o iguales a 0.";

            const iDec = trunc2(iInput / 100);

            if (tipo === "simple") {
                resultadoVal = trunc2(P * trunc2(iDec * N));
            } else {
                const base = trunc2(1 + iDec);
                const powFactor = trunc2(Math.pow(base, N));
                const F_calc = trunc2(P * powFactor);
                resultadoVal = trunc2(F_calc - P);
            }
            etiqueta = "Monto de Interés Ganado (I)";
            esMontoMoneda = true;
        }

        let htmlRes = `<strong>${etiqueta}:</strong><br>`;
        if (esMontoMoneda) {
            htmlRes += formatearDual(resultadoVal, true);
        } else if (objetivo === "tasa") {
            htmlRes += `<span class="val-positivo" style="font-size:22px; font-weight:800;">${resultadoVal.toFixed(2)}%</span> por período`;
        } else if (objetivo === "periodos") {
            htmlRes += `<span class="val-positivo" style="font-size:22px; font-weight:800;">${resultadoVal.toFixed(2)}</span> períodos`;
        }

        mostrarExito(resDiv, htmlRes);

    } catch (err) {
        mostrarError(resDiv, err);
    }
}

function limpiarCamposInteres() {
    limpiarCamposGenerico("formularioCampos");
    configurarFormulario();
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
    if (e.target.tagName === "INPUT") {
        ocultarResultado();
    }
});
