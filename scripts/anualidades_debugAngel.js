// Miguel, este archivo lo cree para tener un lindo orden, capaz al final lo mudemos para el unico script, pero no me ilusiona

const radiosTipo = document.querySelectorAll('input[name="tipoAnualidad"]');
const radiosCalcular = document.querySelectorAll('input[name="variableCalcular"]');
const radiosBase = document.querySelectorAll('input[name="baseCalculo"]');

radiosTipo.forEach(radio => radio.addEventListener('change', actualizarInterfaz));
radiosCalcular.forEach(radio => radio.addEventListener('change', actualizarInterfaz));
radiosBase.forEach(radio => radio.addEventListener('change', actualizarInterfaz));

actualizarInterfaz();

function actualizarInterfaz() {
    const tipo = document.querySelector('input[name="tipoAnualidad"]:checked').value;
    const objetivo = document.querySelector('input[name="variableCalcular"]:checked').value;
    
    const baseElement = document.querySelector('input[name="baseCalculo"]:checked');
    const base = baseElement ? baseElement.value : 'usar-presente';

    const lblCalcularGracia = document.getElementById('lblCalcularGracia');
    if (tipo === 'diferida') {
        lblCalcularGracia.classList.remove('ocultar');
    } else {
        lblCalcularGracia.classList.add('ocultar');
        if (objetivo === 'periodo-gracia') {
            document.querySelector('input[value="cuota"]').checked = true;
            return actualizarInterfaz(); 
        }
    }

    const contenedorBaseCalculo = document.getElementById('contenedor-base-calculo');
    const necesitaBase = ['cuota', 'tasa', 'periodos'].includes(objetivo);
    
    if (necesitaBase) {
        contenedorBaseCalculo.classList.remove('ocultar');
    } else {
        contenedorBaseCalculo.classList.add('ocultar');
    }


    const todosLosContenedores = ['tasa', 'periodos', 'anualidad', 'presente', 'futuro', 'gracia'];
    todosLosContenedores.forEach(id => {
        document.getElementById(`contenedor-${id}`).classList.add('ocultar');
    });

    if (objetivo !== 'tasa') {
        document.getElementById('contenedor-tasa').classList.remove('ocultar');
    }
    if (objetivo !== 'periodos') {
        document.getElementById('contenedor-periodos').classList.remove('ocultar');
    }
    if (objetivo !== 'cuota') {
        document.getElementById('contenedor-anualidad').classList.remove('ocultar');
    }

    if (objetivo === 'presente') {
        if (tipo === 'diferida') document.getElementById('contenedor-gracia').classList.remove('ocultar');
    } else if (objetivo === 'futuro') {
    } else if (objetivo === 'periodo-gracia') {
        document.getElementById('contenedor-presente').classList.remove('ocultar');
    } else {
        if (base === 'usar-presente') {
            document.getElementById('contenedor-presente').classList.remove('ocultar');
            if (tipo === 'diferida') document.getElementById('contenedor-gracia').classList.remove('ocultar');
        } else if (base === 'usar-futuro') {
            document.getElementById('contenedor-futuro').classList.remove('ocultar');
        }
    }
}

// Juguetes de la calculadora financiera

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
                // En valor futuro el periodo de gracia no afecta al cálculo final de los periodos activos
                funcion = A * ((Math.pow(1 + i, N) - 1) / i) - F;
                derivada = A * ((N * Math.pow(1 + i, N - 1)) / i - (Math.pow(1 + i, N) - 1) / (i * i));
            }
        }

        if (Math.abs(derivada) < 1e-12) break;

        let nuevoI = i - (funcion / derivada);

        if (Math.abs(nuevoI - i) < tolerancia) {
            return nuevoI;
        }

        i = nuevoI;
    }
    return i; 
}



document.getElementById('btnCalcular').addEventListener('click', () => {
    const tipo = document.querySelector('input[name="tipoAnualidad"]:checked').value;
    const objetivo = document.querySelector('input[name="variableCalcular"]:checked').value;
    
    const baseElement = document.querySelector('input[name="baseCalculo"]:checked');
    const base = baseElement ? baseElement.value : 'usar-presente';


    const i = !document.getElementById('contenedor-tasa').classList.contains('ocultar') ? parseFloat(document.getElementById('tasaInteres').value) / 100 : null;
    const N = !document.getElementById('contenedor-periodos').classList.contains('ocultar') ? parseInt(document.getElementById('periodos').value) : null;
    const A = !document.getElementById('contenedor-anualidad').classList.contains('ocultar') ? parseFloat(document.getElementById('anualidad').value) : null;
    const P = !document.getElementById('contenedor-presente').classList.contains('ocultar') ? parseFloat(document.getElementById('valorPresente').value) : null;
    const F = !document.getElementById('contenedor-futuro').classList.contains('ocultar') ? parseFloat(document.getElementById('valorFuturo').value) : null;
    const K = !document.getElementById('contenedor-gracia').classList.contains('ocultar') ? parseInt(document.getElementById('periodosGracia').value) : 0;

    let resultado = 0;
    let txtDisplay = "";

    try {
        switch (objetivo) {
            
            case 'presente': // Calcular Valor Presente (P)
                if (isNaN(A) || isNaN(i) || isNaN(N)) throw "Por favor llena todos los campos requeridos (Anualidad, Tasa y Periodos).";
                resultado = calcularValorPresente(A, i, N, tipo, K);
                txtDisplay = `Valor Presente (P): $${resultado.toFixed(2)}`;
                break;

            case 'futuro': // Calcular Valor Futuro (F)
                if (isNaN(A) || isNaN(i) || isNaN(N)) throw "Por favor llena todos los campos requeridos (Anualidad, Tasa y Periodos).";
                resultado = calcularValorFuturo(A, i, N, tipo);
                txtDisplay = `Valor Futuro (F): $${resultado.toFixed(2)}`;
                break;

            case 'cuota': // Calcular Cuota / Anualidad (A)
                if (isNaN(i) || isNaN(N)) throw "Por favor llena la tasa y los periodos.";
                if (base === 'usar-presente') {
                    if (isNaN(P)) throw "Introduce el Valor Presente (P).";
                    let factor = calcularValorPresente(1, i, N, tipo, K); 
                    resultado = P / factor;
                } else {
                    if (isNaN(F)) throw "Introduce el Valor Futuro (F).";
                    let factor = calcularValorFuturo(1, i, N, tipo); 
                    resultado = F / factor;
                }
                txtDisplay = `Cuota / Anualidad (A): $${resultado.toFixed(2)}`;
                break;

            case 'periodos': // Calcular Número de Periodos (N)
                if (isNaN(A) || isNaN(i)) throw "Por favor llena la anualidad y la tasa.";
                if (base === 'usar-presente') {
                    if (isNaN(P)) throw "Introduce el Valor Presente (P).";
                    let P_ajustado = P;
                    if (tipo === 'anticipada') P_ajustado = P / (1 + i);
                    if (tipo === 'diferida') P_ajustado = P * Math.pow(1 + i, K);
                    
                    let argumentoLog = 1 - (P_ajustado * i / A);
                    if (argumentoLog <= 0) throw "Los datos ingresados no corresponden a un plazo financiero viable.";
                    resultado = -Math.log(argumentoLog) / Math.log(1 + i);
                } else {
                    if (isNaN(F)) throw "Introduce el Valor Futuro (F).";
                    let F_ajustado = (tipo === 'anticipada') ? F / (1 + i) : F;
                    
                    let argumentoLog = (F_ajustado * i / A) + 1;
                    if (argumentoLog <= 0) throw "Los datos ingresados no corresponden a un plazo financiero viable.";
                    resultado = Math.log(argumentoLog) / Math.log(1 + i);
                }
                txtDisplay = `Número de Periodos (N): ${Math.ceil(resultado)} pagos (Exacto: ${resultado.toFixed(2)})`;
                break;

            case 'periodo-gracia': // Calcular Periodos de Gracia (K)
                if (isNaN(P) || isNaN(A) || isNaN(i) || isNaN(N)) throw "Llena todos los campos (P, A, i, N).";
                let P_ordinario = calcularValorPresente(A, i, N, 'ordinaria');
                let argumentoK = P_ordinario / P;
                if (argumentoK <= 0) throw "Error matemático: El valor presente introducido es inválido para los flujos dados.";
                resultado = Math.log(argumentoK) / Math.log(1 + i);

                txtDisplay = `Periodos de Gracia (K): ${Math.round(resultado)} periodos (Exacto: ${resultado.toFixed(2)})`;
                break;

            case 'tasa': // Calcular Tasa (i) con Newton-Raphson
                if (isNaN(N) || isNaN(A)) throw "Se necesitan los periodos (N) y la anualidad (A).";
                resultado = calcularTasaNewtonRaphson(tipo, base, P, F, A, N, K);
                
                if (isNaN(resultado) || resultado <= -1) {
                    throw "Los datos ingresados impiden calcular una tasa de interés real.";
                }
                txtDisplay = `Tasa de Interés (i): ${(resultado * 100).toFixed(4)}% por periodo`;
                break;
        }

        const displayNodo = document.getElementById('txtResultado');
        displayNodo.innerText = txtDisplay;
        displayNodo.style.color = "green";

    } catch (error) {
    
        const displayNodo = document.getElementById('txtResultado');
        displayNodo.innerText = `${error}`;
        displayNodo.style.color = "red";
    }
});