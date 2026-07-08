let monedaActual = '$';

document.addEventListener("DOMContentLoaded", () => {
    monedaActual = localStorage.getItem('moneda') || '$';
    configurarFormulario();
});

function alternarSalvamento(idx) {
    const tipo = document.getElementById(`tipoSalvamento_${idx}`).value;
    const label = document.getElementById(`lblSalvamento_${idx}`);
    const input = document.getElementById(`salvamento_${idx}`);
    
    if (tipo === "porcentaje") {
        label.textContent = `Porcentaje de Salvamento (% de P_${idx})`;
        input.placeholder = "Ej: 10";
    } else {
        label.textContent = `Valor de Salvamento Fijo (S_${idx}) [${monedaActual.trim()}]`;
        input.placeholder = "Ej: 5000";
    }
}

function configurarFormulario() {
    const modulo = document.getElementById("tipoModulo").value;
    const num = parseInt(document.getElementById("numAlternativas").value);
    
    ocultarResultado();

    for (let i = 1; i <= 8; i++) {
        const block = document.getElementById(`block_alt_${i}`);
        const inputVida = document.getElementById(`vida_${i}`);

        if (i <= num) {
            block.classList.remove("hidden");

            if (modulo === "iguales") {
                if (i > 1) {
                    inputVida.disabled = true;
                } else {
                    inputVida.disabled = false;
                    inputVida.removeEventListener("input", sincronizarVidasDinamicas);
                    inputVida.addEventListener("input", sincronizarVidasDinamicas);
                }
            } else {
                inputVida.disabled = false;
                inputVida.removeEventListener("input", sincronizarVidasDinamicas);
            }
            alternarSalvamento(i);
        } else {
            block.classList.add("hidden");
        }
    }
    
    if (modulo === "iguales") sincronizarVidasDinamicas();
}

function sincronizarVidasDinamicas() {
    const modulo = document.getElementById("tipoModulo").value;
    if (modulo === "iguales") {
        const valorN = document.getElementById("vida_1").value;
        const num = parseInt(document.getElementById("numAlternativas").value);
        for (let i = 2; i <= num; i++) {
            document.getElementById(`vida_${i}`).value = valorN;
        }
    }
}

function calcularMCD(a, b) {
    return b === 0 ? a : calcularMCD(b, a % b);
}

function calcularMCM(a, b) {
    if (a === 0 || b === 0) return 0;
    return (a * b) / calcularMCD(a, b);
}

function calcularVPNBase(P, A, S, i, N, horizonteMax = N) {
    let vpnTotal = 0;

    for (let t = 0; t < horizonteMax; t += N) {
        vpnTotal -= P / Math.pow(1 + i, t);
        vpnTotal += S / Math.pow(1 + i, t + N);
    }

    for (let t = 1; t <= horizonteMax; t++) {
        vpnTotal += A / Math.pow(1 + i, t);
    }
    return vpnTotal;
}

function calcularVABase(vpn, i, N) {
    if (i === 0) return vpn / N;
    return vpn * ((i * Math.pow(1 + i, N)) / (Math.pow(1 + i, N) - 1));
}

function calcularTIRIncrementalSemejante(deltaP, deltaA, deltaS, N) {
    let i = 0.12; 
    const maxIter = 100;
    const tolerancia = 1e-6;

    for (let k = 0; k < maxIter; k++) {
        let vpn = -deltaP;
        let derivada = 0;

        for (let t = 1; t <= N; t++) {
            let f = deltaA;
            if (t === N) f += deltaS;
            vpn += f / Math.pow(1 + i, t);
            derivada -= (t * f) / Math.pow(1 + i, t + 1);
        }

        if (Math.abs(derivada) < 1e-11) break;
        let nuevoI = i - (vpn / derivada);
        if (Math.abs(nuevoI - i) < tolerancia) return nuevoI;
        i = nuevoI;
    }
    return i;
}


function procesarAlternativas() {
    const modulo = document.getElementById("tipoModulo").value;
    const num = parseInt(document.getElementById("numAlternativas").value);
    const tmarInput = parseFloat(document.getElementById("tmar").value);
    const resDiv = document.getElementById("resultado");

    try {
        if (isNaN(tmarInput)) throw "Defina la tasa de rendimiento global (TMAR / TREMA).";
        const i = tmarInput / 100;

        let alternativas = [];
        for (let k = 1; k <= num; k++) {
            const P = parseFloat(document.getElementById(`inversion_${k}`).value);
            const A = parseFloat(document.getElementById(`flujo_${k}`).value);
            const N = parseInt(document.getElementById(`vida_${k}`).value);
            let S = parseFloat(document.getElementById(`salvamento_${k}`).value);
            
            if (document.getElementById(`tipoSalvamento_${k}`).value === "porcentaje") {
                if(!isNaN(P) && !isNaN(S)) S = P * (S / 100);
            }

            if ([P, A, N, S].some(isNaN)) throw `Faltan campos obligatorios en la Alternativa ${k}.`;
            if (N <= 0) throw `La vida útil de la Alternativa ${k} debe ser mayor a 0.`;
            
            alternativas.push({ id: k, P, A, N, S });
        }

        let HTML_Response = "";

        if (modulo === "iguales") {

            alternativas.forEach(alt => {
                alt.vpn = calcularVPNBase(alt.P, alt.A, alt.S, i, alt.N);
            });

            alternativas.sort((a, b) => a.P - b.P);

            let txtAnalisis = "<strong>Cadena de Análisis Incremental Consecutivo:</strong><br>";
            let defensora = alternativas[0];

            for (let j = 1; j < alternativas.length; j++) {
                let retadora = alternativas[j];
                let deltaP = retadora.P - defensora.P;
                let deltaA = retadora.A - defensora.A;
                let deltaS = retadora.S - defensora.S;
                
                let deltaVPN = retadora.vpn - defensora.vpn;
                let tirIncremental = calcularTIRIncrementalSemejante(deltaP, deltaA, deltaS, defensora.N);

                txtAnalisis += `• <em>Defensa: Alt ${defensora.id} vs Alt ${retadora.id}</em> → `;
                
                if (deltaVPN > 0 && tirIncremental > i) {
                    txtAnalisis += `ΔVPN: <span class="val-positivo">${monedaActual}${deltaVPN.toFixed(2)}</span>, ΔTIR: <span class="val-positivo">${(tirIncremental*100).toFixed(2)}%</span>. La inversión adicional se justifica. <strong style="color:var(--azul-primario);">Gana Alt ${retadora.id}</strong>.<br>`;
                    defensora = retadora;
                } else {
                    txtAnalisis += `ΔVPN: <span class="val-negativo">${monedaActual}${deltaVPN.toFixed(2)}</span>, ΔTIR: <span class="val-negativo">${(tirIncremental*100).toFixed(2)}%</span>. Inversión adicional rechazada. <strong style="color:var(--azul-primario);">Mantiene Alt ${defensora.id}</strong>.<br>`;
                }
            }

            HTML_Response = `
                <div style="text-align: left; font-size: 14px; font-weight: normal; line-height:1.6;">
                    <strong>Métricas de Valor Presente Neto (Individuales):</strong><br>
                    ${alternativas.map(a => `• Alternativa ${a.id}: VPN = <span class="${a.vpn >= 0 ? 'val-positivo' : 'val-negativo'}">${monedaActual}${a.vpn.toFixed(2)}</span> (P: ${monedaActual}${a.P})`).join('<br>')}<br><br>
                    ${txtAnalisis}<br>
                    <div style="font-size: 16px; margin-top:10px; border-top: 1px solid var(--azul-borde); padding-top:8px;">
                        <strong>Decisión Final Óptima:</strong> <span class="val-positivo">Seleccionar Alternativa ${defensora.id}</span>
                    </div>
                </div>
            `;

        } else {

            let vidasActivas = alternativas.map(a => a.N);
            let mcmGeneral = vidasActivas[0];
            for(let x = 1; x < vidasActivas.length; x++) {
                mcmGeneral = calcularMCM(mcmGeneral, vidasActivas[x]);
            }

            alternativas.forEach(alt => {
                alt.vpnIndividual = calcularVPNBase(alt.P, alt.A, alt.S, i, alt.N, alt.N);
                alt.va = calcularVABase(alt.vpnIndividual, i, alt.N);
                alt.vpnMCM = calcularVPNBase(alt.P, alt.A, alt.S, i, alt.N, mcmGeneral);
            });

            alternativas.sort((a, b) => a.P - b.P);
            let txtAnalisisVA = "<strong>Cadena de Análisis Incremental por Valor Anual (VA):</strong><br>";
            let defensoraVA = alternativas[0];

            for (let j = 1; j < alternativas.length; j++) {
                let retadoraVA = alternativas[j];
                let deltaVA = retadoraVA.va - defensoraVA.va;
                
                txtAnalisisVA += `• <em>Defensa: Alt ${defensoraVA.id} vs Alt ${retadoraVA.id}</em> → `;
                if (deltaVA > 0) {
                    txtAnalisisVA += `ΔVA: <span class="val-positivo">${monedaActual}${deltaVA.toFixed(2)}/año</span>. Incremento rentable. <strong style="color:var(--azul-primario);">Gana Alt ${retadoraVA.id}</strong>.<br>`;
                    defensoraVA = retadoraVA;
                } else {
                    txtAnalisisVA += `ΔVA: <span class="val-negativo">${monedaActual}${deltaVA.toFixed(2)}/año</span>. No justifica costo. <strong style="color:var(--azul-primario);">Mantiene Alt ${defensoraVA.id}</strong>.<br>`;
                }
            }

            HTML_Response = `
                <div style="text-align: left; font-size: 14px; font-weight: normal; line-height:1.6;">
                    <strong>Horizonte Común Unificado (MCM):</strong> <strong>${mcmGeneral} años</strong><br><br>
                    <strong>Análisis por Alternativa Pasando al MCM:</strong><br>
                    ${alternativas.map(a => `• <strong>Alternativa ${a.id}</strong> (N=${a.N} años):<br>
                     &nbsp;&nbsp;&nbsp;&nbsp;- VA Individual: <span class="${a.va >= 0 ? 'val-positivo' : 'val-negativo'}">${monedaActual}${a.va.toFixed(2)}/año</span><br>
                     &nbsp;&nbsp;&nbsp;&nbsp;- VPN Extendido (MCM): <span>${monedaActual}${a.vpnMCM.toFixed(2)}</span>`).join('<br>')}<br><br>
                    ${txtAnalisisVA}<br>
                    <div style="font-size: 16px; margin-top:10px; border-top: 1px solid var(--azul-borde); padding-top:8px;">
                        <strong>Decisión Final Óptima:</strong> <span class="val-positivo">Seleccionar Alternativa ${defensoraVA.id}</span>
                    </div>
                </div>
            `;
        }

        mostrarExito(resDiv, HTML_Response);

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
        if (!e.target.id.startsWith("vida_") && e.target.id !== "tipoModulo" && e.target.id !== "numAlternativas") {
            ocultarResultado();
        }
    }
});