let monedaActual = '$';

document.addEventListener("DOMContentLoaded", () => {
    monedaActual = localStorage.getItem('moneda') || '$';
    const sufijo = ` [${monedaActual.trim()}]`;
    
    document.querySelector('label[for="anualidad"]').textContent = `Cuota / Anualidad (A)${sufijo}`;
    document.querySelector('label[for="valorPresente"]').textContent = `Valor Presente (P)${sufijo}`;
    document.querySelector('label[for="valorFuturo"]').textContent = `Valor Futuro (F)${sufijo}`;

    configurarFormulario();
});

function configurarFormulario() {
    const tipo = document.getElementById("tipoAnualidad").value;
    const objetivo = document.getElementById("variableCalcular").value;
    const base = document.getElementById("baseCalculo").value;
    const formCampos = document.getElementById("formularioCampos");
    
    ocultarResultado();

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

    const grupoBase = document.getElementById("grupo_base_calculo");
    const necesitaBase = ["cuota", "tasa", "periodos"].includes(objetivo);
    if (necesitaBase) {
        grupoBase.classList.remove("hidden");
    } else {
        grupoBase.classList.add("hidden");
    }

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
    if (i === 0) return A * N;
    let P = A * ((1 - Math.pow(1 + i, -N)) / i);
    if (tipo === 'anticipada') {
        P = P * (1 + i);
    } else if (tipo === 'diferida') {
        P = P * Math.pow(1 + i, -K);
    }
    return P;
}

function calcularValorFuturo(A, i, N, tipo) { 
    if (i === 0) return A * N;
    let F = A * ((Math.pow(1 + i, N) - 1) / i);
    if (tipo === 'anticipada') {
        F = F * (1 + i);
    }
    return F;
}

function calcularTasaNewtonRaphson(tipo, base, P, F, A, N, K) {
    let i = 0.1; 
    const maxIter = 100; 
    const tolerancia = 1e-7;   

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
        if (Math.abs(nuevoI - i) < tolerancia) return nuevoI;
        i = nuevoI;
    }
    return i; 
}

function calcularAnualidades() {
    const tipo = document.getElementById("tipoAnualidad").value;
    const objetivo = document.getElementById("variableCalcular").value;
    const base = document.getElementById("baseCalculo").value;
    const resDiv = document.getElementById("resultado");

    const i = !document.getElementById('grupo_tasa').classList.contains('hidden') ? parseFloat(document.getElementById('tasaInteres').value) / 100 : null;
    const N = !document.getElementById('grupo_periodos').classList.contains('hidden') ? parseInt(document.getElementById('periodos').value) : null;
    const A = !document.getElementById('grupo_anualidad').classList.contains('hidden') ? parseFloat(document.getElementById('anualidad').value) : null;
    const P = !document.getElementById('grupo_presente').classList.contains('hidden') ? parseFloat(document.getElementById('valorPresente').value) : null;
    const F = !document.getElementById('grupo_futuro').classList.contains('hidden') ? parseFloat(document.getElementById('valorFuturo').value) : null;
    const K = !document.getElementById('grupo_gracia').classList.contains('hidden') ? parseInt(document.getElementById('periodosGracia').value) : 0;

    let resultado = 0;
    let texto = "";
    let color = "";

    try {
        switch (objetivo) {
            case 'presente':
                if (isNaN(A) || isNaN(i) || isNaN(N)) throw "Faltan datos obligatorios.";
                resultado = calcularValorPresente(A, i, N, tipo, K);
                color = resultado < 0 ? "val-negativo" : "val-positivo";
                texto = `Valor Presente (P): <span class="${color}">${monedaActual}${resultado.toFixed(2)}</span>`;
                break;

            case 'futuro':
                if (isNaN(A) || isNaN(i) || isNaN(N)) throw "Faltan datos obligatorios.";
                resultado = calcularValorFuturo(A, i, N, tipo);
                color = resultado < 0 ? "val-negativo" : "val-positivo";
                texto = `Valor Futuro (F): <span class="${color}">${monedaActual}${resultado.toFixed(2)}</span>`;
                break;

            case 'cuota':
                if (isNaN(i) || isNaN(N)) throw "Faltan datos obligatorios.";
                if (base === 'usar-presente') {
                    if (isNaN(P)) throw "Introduce el Valor Presente (P).";
                    resultado = P / calcularValorPresente(1, i, N, tipo, K);
                } else {
                    if (isNaN(F)) throw "Introduce el Valor Futuro (F).";
                    resultado = F / calcularValorFuturo(1, i, N, tipo);
                }
                color = resultado < 0 ? "val-negativo" : "val-positivo";
                texto = `Cuota / Anualidad (A): <span class="${color}">${monedaActual}${resultado.toFixed(2)}</span>`;
                break;

            case 'periodos':
                if (isNaN(A) || isNaN(i)) throw "Faltan datos obligatorios.";
                if (base === 'usar-presente') {
                    if (isNaN(P)) throw "Introduce el Valor Presente (P).";
                    let P_ajustado = P;
                    if (tipo === 'anticipada') P_ajustado = P / (1 + i);
                    if (tipo === 'diferida') P_ajustado = P * Math.pow(1 + i, K);
                    
                    let argumentoLog = 1 - (P_ajustado * i / A);
                    if (argumentoLog <= 0) throw "Error lógico: Los parámetros impiden amortizar la deuda.";
                    resultado = -Math.log(argumentoLog) / Math.log(1 + i);
                } else {
                    if (isNaN(F)) throw "Introduce el Valor Futuro (F).";
                    let F_ajustado = (tipo === 'anticipada') ? F / (1 + i) : F;
                    
                    let argumentoLog = (F_ajustado * i / A) + 1;
                    if (argumentoLog <= 0) throw "Error lógico: Datos incongruentes para un fondo acumulado.";
                    resultado = Math.log(argumentoLog) / Math.log(1 + i);
                }
                color = resultado < 0 ? "val-negativo" : "val-positivo";
                texto = `Número de Periodos (N): <span class="${color}">${Math.ceil(resultado)} pagos</span> (Exacto: ${resultado.toFixed(2)})`;
                break;

            case 'periodo-gracia':
                if (isNaN(P) || isNaN(A) || isNaN(i) || isNaN(N)) throw "Faltan datos obligatorios.";
                let P_ordinario = calcularValorPresente(A, i, N, 'ordinaria');
                let argumentoK = P_ordinario / P;
                if (argumentoK <= 0) throw "Error matemático: El valor presente introducido es inválido.";
                resultado = Math.log(argumentoK) / Math.log(1 + i);
                
                color = resultado < 0 ? "val-negativo" : "val-positivo";
                texto = `Periodos de Gracia (K): <span class="${color}">${Math.round(resultado)} periodos</span> (Exacto: ${resultado.toFixed(2)})`;
                break;

            case 'tasa':
                if (isNaN(N) || isNaN(A)) throw "Faltan datos obligatorios.";
                resultado = calcularTasaNewtonRaphson(tipo, base, P, F, A, N, K);
                
                if (isNaN(resultado) || resultado <= -1) {
                    throw "Los datos ingresados impiden calcular una tasa de interés real.";
                }
                color = resultado < 0 ? "val-negativo" : "val-positivo";
                texto = `Tasa de Interés (i): <span class="${color}">${(resultado * 100).toFixed(4)}%</span> por periodo`;
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
    document.getElementById("resultado").style.display = "none";
}

document.addEventListener("input", function(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") {
        ocultarResultado();
    }
});