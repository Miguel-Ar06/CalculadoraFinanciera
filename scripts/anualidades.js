document.addEventListener("DOMContentLoaded", () => {
    configurarFormulario();
});

function configurarFormulario() {
    const tipo = document.getElementById("tipoAnualidad").value;
    const objetivo = document.getElementById("variableCalcular").value;
    const base = document.getElementById("baseCalculo").value;

    ocultarResultado();

    // Habilitar período de gracia si es diferida
    const optGracia = document.getElementById("optGracia");
    if (tipo === "diferida") {
        optGracia.classList.remove("hidden");
    } else {
        optGracia.classList.add("hidden");
        if (objetivo === "periodo-gracia") {
            document.getElementById("variableCalcular").value = "cuota";
            return configurarFormulario();
        }
    }

    // Determinar si se necesita selector de base (P o F)
    const grupoBase = document.getElementById("grupo_base_calculo");
    const necesitaBase = ["cuota", "tasa", "periodos"].includes(objetivo);
    if (necesitaBase) {
        grupoBase.classList.remove("hidden");
    } else {
        grupoBase.classList.add("hidden");
    }

    // Resetear visibilidad de inputs
    const grupos = ["grupo_tasa", "grupo_periodos", "grupo_anualidad", "grupo_presente", "grupo_futuro", "grupo_gracia"];
    grupos.forEach(id => document.getElementById(id).classList.add("hidden"));

    if (objetivo !== "tasa") document.getElementById("grupo_tasa").classList.remove("hidden");
    if (objetivo !== "periodos") document.getElementById("grupo_periodos").classList.remove("hidden");
    if (objetivo !== "cuota") document.getElementById("grupo_anualidad").classList.remove("hidden");

    if (objetivo === "presente") {
        if (tipo === "diferida") document.getElementById("grupo_gracia").classList.remove("hidden");
    } else if (objetivo === "periodo-gracia") {
        document.getElementById("grupo_presente").classList.remove("hidden");
    } else if (necesitaBase) {
        if (base === "usar-presente") {
            document.getElementById("grupo_presente").classList.remove("hidden");
            if (tipo === "diferida") document.getElementById("grupo_gracia").classList.remove("hidden");
        } else {
            document.getElementById("grupo_futuro").classList.remove("hidden");
        }
    }
}

function calcularValorPresente(A, i, N, tipo, K = 0) { 
    if (i === 0) return trunc2(A * N);
    
    const baseFactor = trunc2(1 + i);
    const powNegN = trunc2(Math.pow(baseFactor, -N));
    let P = trunc2(A * trunc2(trunc2(1 - powNegN) / i));

    if (tipo === 'anticipada') {
        P = trunc2(P * trunc2(1 + i));
    } else if (tipo === 'diferida') {
        const powNegK = trunc2(Math.pow(baseFactor, -K));
        P = trunc2(P * powNegK);
    }
    return P;
}

function calcularValorFuturo(A, i, N, tipo) { 
    if (i === 0) return trunc2(A * N);

    const baseFactor = trunc2(1 + i);
    const powN = trunc2(Math.pow(baseFactor, N));
    let F = trunc2(A * trunc2(trunc2(powN - 1) / i));

    if (tipo === 'anticipada') {
        F = trunc2(F * trunc2(1 + i));
    }
    return F;
}

function calcularTasaNewtonRaphson(tipo, base, P, F, A, N, K) {
    let i = 0.1; 
    const maxIter = 100; 
    const tolerancia = 1e-6;   

    for (let iter = 0; iter < maxIter; iter++) {
        if (Math.abs(i) < 1e-6) i = i < 0 ? -1e-6 : 1e-6;
        if (i <= -1) i = -0.99;

        let funcion = 0;
        let derivada = 0;

        if (tipo === 'ordinaria') {
            if (base === 'usar-presente') {
                funcion = A * ((1 - Math.pow(1 + i, -N)) / i) - P;
                derivada = A * ((N * Math.pow(1 + i, -N - 1)) / i - (1 - Math.pow(1 + i, -N)) / (i * i));
            } else {
                funcion = A * ((Math.pow(1 + i, N) - 1) / i) - F;
                derivada = A * ((N * Math.pow(1 + i, N - 1)) / i - (Math.pow(1 + i, N) - 1) / (i * i));
            }
        } 
        else if (tipo === 'anticipada') {
            if (base === 'usar-presente') {
                funcion = A * (((1 + i) - Math.pow(1 + i, -N + 1)) / i) - P;
                derivada = A * ((i + i * (N - 1) * Math.pow(1 + i, -N) - ((1 + i) - Math.pow(1 + i, -N + 1))) / (i * i));
            } else {
                funcion = A * ((Math.pow(1 + i, N + 1) - (1 + i)) / i) - F;
                derivada = A * (((((N + 1) * Math.pow(1 + i, N) - 1) * i) - (Math.pow(1 + i, N + 1) - (1 + i))) / (i * i));
            }
        } 
        else if (tipo === 'diferida') {
            if (base === 'usar-presente') {
                funcion = A * ((Math.pow(1 + i, -K) - Math.pow(1 + i, -(N + K))) / i) - P;
                derivada = A * ((((-K * Math.pow(1 + i, -K - 1) + (N + K) * Math.pow(1 + i, -(N + K + 1))) * i) - (Math.pow(1 + i, -K) - Math.pow(1 + i, -(N + K)))) / (i * i));
            } else {
                funcion = A * ((Math.pow(1 + i, N) - 1) / i) - F;
                derivada = A * ((N * Math.pow(1 + i, N - 1)) / i - (Math.pow(1 + i, N) - 1) / (i * i));
            }
        }

        if (Math.abs(derivada) < 1e-12) break;

        let nuevoI = i - (funcion / derivada);
        if (Math.abs(nuevoI - i) < tolerancia) return trunc2(nuevoI);
        i = nuevoI;
    }
    return trunc2(i); 
}

function calcularAnualidades() {
    const tipo = document.getElementById("tipoAnualidad").value;
    const objetivo = document.getElementById("variableCalcular").value;
    const base = document.getElementById("baseCalculo").value;
    const resDiv = document.getElementById("resultado");

    const iRaw = !document.getElementById('grupo_tasa').classList.contains('hidden') ? parseFloat(document.getElementById('tasaInteres').value) : null;
    const i = iRaw !== null ? trunc2(iRaw / 100) : null;
    const N = !document.getElementById('grupo_periodos').classList.contains('hidden') ? parseInt(document.getElementById('periodos').value) : null;
    const A = !document.getElementById('grupo_anualidad').classList.contains('hidden') ? parseFloat(document.getElementById('anualidad').value) : null;
    const P = !document.getElementById('grupo_presente').classList.contains('hidden') ? parseFloat(document.getElementById('valorPresente').value) : null;
    const F = !document.getElementById('grupo_futuro').classList.contains('hidden') ? parseFloat(document.getElementById('valorFuturo').value) : null;
    const K = !document.getElementById('grupo_gracia').classList.contains('hidden') ? parseInt(document.getElementById('periodosGracia').value) : 0;

    let resultado = 0;
    let texto = "";

    try {
        switch (objetivo) {
            case 'presente':
                if ([A, i, N].some(val => val === null || isNaN(val))) throw "Faltan datos obligatorios.";
                resultado = calcularValorPresente(A, i, N, tipo, K);
                texto = `<strong>Valor Presente (P):</strong><br>${formatearDual(resultado, true)}`;
                break;

            case 'futuro':
                if ([A, i, N].some(val => val === null || isNaN(val))) throw "Faltan datos obligatorios.";
                resultado = calcularValorFuturo(A, i, N, tipo);
                texto = `<strong>Valor Futuro (F):</strong><br>${formatearDual(resultado, true)}`;
                break;

            case 'cuota':
                if ([i, N].some(val => val === null || isNaN(val))) throw "Faltan datos obligatorios.";
                if (base === 'usar-presente') {
                    if (P === null || isNaN(P)) throw "Introduce el Valor Presente (P).";
                    const factorVP = calcularValorPresente(1, i, N, tipo, K);
                    if (factorVP === 0) throw "División por cero.";
                    resultado = trunc2(P / factorVP);
                } else {
                    if (F === null || isNaN(F)) throw "Introduce el Valor Futuro (F).";
                    const factorVF = calcularValorFuturo(1, i, N, tipo);
                    if (factorVF === 0) throw "División por cero.";
                    resultado = trunc2(F / factorVF);
                }
                texto = `<strong>Cuota / Anualidad (A):</strong><br>${formatearDual(resultado, true)}`;
                break;

            case 'periodos':
                if ([A, i].some(val => val === null || isNaN(val))) throw "Faltan datos obligatorios.";
                if (base === 'usar-presente') {
                    if (P === null || isNaN(P)) throw "Introduce el Valor Presente (P).";
                    let P_ajustado = P;
                    if (tipo === 'anticipada') P_ajustado = trunc2(P / trunc2(1 + i));
                    if (tipo === 'diferida') P_ajustado = trunc2(P * trunc2(Math.pow(trunc2(1 + i), K)));
                    
                    let argLog = 1 - ((P_ajustado * i) / A);
                    if (argLog <= 0) throw "Error lógico: Los parámetros impiden amortizar la deuda (los intereses superan el valor de la cuota).";
                    resultado = trunc2(-Math.log(argLog) / Math.log(1 + i));
                } else {
                    if (F === null || isNaN(F)) throw "Introduce el Valor Futuro (F).";
                    let F_ajustado = (tipo === 'anticipada') ? trunc2(F / (1 + i)) : F;
                    
                    let argLog = ((F_ajustado * i) / A) + 1;
                    if (argLog <= 0) throw "Error lógico: Datos incongruentes para un fondo acumulado.";
                    resultado = trunc2(Math.log(argLog) / Math.log(1 + i));
                }
                texto = `<strong>Número de Periodos (N):</strong><br><span class="val-positivo" style="font-size:22px; font-weight:800;">${Math.ceil(resultado)} pagos</span> (Exacto: ${resultado.toFixed(2)})`;
                break;

            case 'periodo-gracia':
                if ([P, A, i, N].some(val => val === null || isNaN(val))) throw "Faltan datos obligatorios.";
                let P_ordinario = calcularValorPresente(A, i, N, 'ordinaria');
                let argK = trunc2(P_ordinario / P);
                if (argK <= 0) throw "Error matemático: El valor presente introducido es inválido.";
                resultado = trunc2(Math.log(argK) / Math.log(1 + i));
                texto = `<strong>Periodos de Gracia (K):</strong><br><span class="val-positivo" style="font-size:22px; font-weight:800;">${Math.round(resultado)} periodos</span> (Exacto: ${resultado.toFixed(2)})`;
                break;

            case 'tasa':
                if ([N, A].some(val => val === null || isNaN(val))) throw "Faltan datos obligatorios.";
                resultado = calcularTasaNewtonRaphson(tipo, base, P, F, A, N, K);
                if (isNaN(resultado) || resultado <= -1) throw "Los datos ingresados impiden calcular una tasa de interés real.";
                const pct = trunc2(resultado * 100);
                texto = `<strong>Tasa de Interés por período (i):</strong><br><span class="val-positivo" style="font-size:22px; font-weight:800;">${pct.toFixed(2)}%</span>`;
                break;
        }

        mostrarExito(resDiv, texto);
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