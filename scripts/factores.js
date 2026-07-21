document.addEventListener("DOMContentLoaded", () => {
    configurarFormulario();
});

function configurarFormulario() {
    const tipo = document.getElementById("tipoFactor").value;
    const lblMonto = document.getElementById("lblMontoBase");
    ocultarResultado();

    const mapaEtiquetas = {
        fp: "Valor Presente inicial (P)",
        pf: "Valor Futuro deseado (F)",
        fa: "Cuota periódica uniforme (A)",
        af: "Fondo Futuro deseado (F)",
        pa: "Cuota periódica uniforme (A)",
        ap: "Préstamo o Inversión inicial (P)",
        pg: "Gradiente Aritmético por período (G)",
        ag: "Gradiente Aritmético por período (G)"
    };

    if (mapaEtiquetas[tipo]) {
        lblMonto.textContent = `Monto Base: ${mapaEtiquetas[tipo]} (Opcional)`;
    }
}

function calcularFactor() {
    const tipo = document.getElementById("tipoFactor").value;
    const iInput = parseFloat(document.getElementById("tasaInteres").value);
    const n = parseInt(document.getElementById("numeroPeriodos").value);
    const montoBaseIn = parseFloat(document.getElementById("montoBase").value);
    const resDiv = document.getElementById("resultado");

    try {
        if (isNaN(iInput) || isNaN(n) || n <= 0 || iInput < 0) {
            throw "Por favor introduzca una tasa de interés (i%) y número de períodos (n > 0) válidos.";
        }

        const i = trunc2(iInput / 100);
        if (i === 0) throw "La tasa de interés debe ser mayor a 0%.";

        let factorVal = 0;
        let notacion = "";
        let nombreResultado = "";

        const basePow = trunc2(Math.pow(trunc2(1 + i), n));
        const basePowMinus1 = trunc2(basePow - 1);

        switch (tipo) {
            case "fp":
                factorVal = basePow;
                notacion = `(F/P, ${iInput}%, ${n})`;
                nombreResultado = "Valor Futuro Calculado (F)";
                break;
            case "pf":
                factorVal = trunc2(1 / basePow);
                notacion = `(P/F, ${iInput}%, ${n})`;
                nombreResultado = "Valor Presente Calculado (P)";
                break;
            case "fa":
                factorVal = trunc2(basePowMinus1 / i);
                notacion = `(F/A, ${iInput}%, ${n})`;
                nombreResultado = "Valor Futuro Acumulado (F)";
                break;
            case "af":
                factorVal = trunc2(i / basePowMinus1);
                notacion = `(A/F, ${iInput}%, ${n})`;
                nombreResultado = "Cuota Anual Uniforme (A)";
                break;
            case "pa":
                factorVal = trunc2(basePowMinus1 / trunc2(i * basePow));
                notacion = `(P/A, ${iInput}%, ${n})`;
                nombreResultado = "Valor Presente Equiv. (P)";
                break;
            case "ap":
                factorVal = trunc2(trunc2(i * basePow) / basePowMinus1);
                notacion = `(A/P, ${iInput}%, ${n})`;
                nombreResultado = "Cuota Anual Amortización (A)";
                break;
            case "pg":
                const i2 = trunc2(i * i);
                const i2Pow = trunc2(i2 * basePow);
                const numPG = trunc2(basePowMinus1 - trunc2(n * i));
                factorVal = trunc2(numPG / i2Pow);
                notacion = `(P/G, ${iInput}%, ${n})`;
                nombreResultado = "Valor Presente del Gradiente (P)";
                break;
            case "ag":
                const term1 = trunc2(1 / i);
                const term2 = trunc2(n / basePowMinus1);
                factorVal = trunc2(term1 - term2);
                notacion = `(A/G, ${iInput}%, ${n})`;
                nombreResultado = "Cuota Anual Equiv. Gradiente (A)";
                break;
        }

        let htmlRes = `
            <strong>Factor Financiero ${notacion}:</strong><br>
            <span class="val-positivo" style="font-size: 24px; font-weight: 800;">${factorVal.toFixed(4)}</span><br><br>
        `;

        if (!isNaN(montoBaseIn)) {
            const montoBase = trunc2(montoBaseIn);
            const resultadoMonto = trunc2(montoBase * factorVal);
            htmlRes += `
                <strong>${nombreResultado}:</strong><br>
                ${formatearDual(resultadoMonto, true)}
            `;
        }

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
