document.addEventListener("DOMContentLoaded", () => {
    configurarFormulario();
});

function alternarSalvamento(idx) {
    const tipo = document.getElementById(`tipoSalvamento_${idx}`).value;
    const label = document.getElementById(`lblSalvamento_${idx}`);
    const input = document.getElementById(`salvamento_${idx}`);
    const { divisa } = getMonedaConfig();
    
    if (tipo === "porcentaje") {
        label.textContent = `Porcentaje de Salvamento (% de P_${idx})`;
        input.placeholder = "Ej: 10";
    } else {
        label.textContent = `Valor de Salvamento Fijo (S_${idx})`;
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
        const factorP = trunc2(Math.pow(trunc2(1 + i), t));
        vpnTotal = trunc2(vpnTotal - trunc2(P / factorP));

        const factorS = trunc2(Math.pow(trunc2(1 + i), t + N));
        vpnTotal = trunc2(vpnTotal + trunc2(S / factorS));
    }
    for (let t = 1; t <= horizonteMax; t++) {
        const factorA = trunc2(Math.pow(trunc2(1 + i), t));
        vpnTotal = trunc2(vpnTotal + trunc2(A / factorA));
    }
    return trunc2(vpnTotal);
}

function calcularVABase(vpn, i, N) {
    if (i === 0) return trunc2(vpn / N);
    const powN = trunc2(Math.pow(trunc2(1 + i), N));
    const num = trunc2(i * powN);
    const den = trunc2(powN - 1);
    if (den === 0) return 0;
    const factor = trunc2(num / den);
    return trunc2(vpn * factor);
}

function calcularTIRIncremental(deltaP, deltaA, deltaS, N) {
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
        if (Math.abs(nuevoI - i) < tolerancia) return trunc2(nuevoI);
        i = nuevoI;
    }
    return trunc2(i);
}

function procesarAlternativas() {
    const modulo = document.getElementById("tipoModulo").value;
    const num = parseInt(document.getElementById("numAlternativas").value);
    const tmarInput = parseFloat(document.getElementById("tmar").value);
    const resDiv = document.getElementById("resultado");

    try {
        if (isNaN(tmarInput)) throw "Defina la tasa de rendimiento global (TMAR / TREMA).";
        const i = trunc2(tmarInput / 100);

        let alternativas = [];
        for (let k = 1; k <= num; k++) {
            const P = parseFloat(document.getElementById(`inversion_${k}`).value);
            const A = parseFloat(document.getElementById(`flujo_${k}`).value);
            const N = parseInt(document.getElementById(`vida_${k}`).value);
            let S = parseFloat(document.getElementById(`salvamento_${k}`).value);
            
            if (document.getElementById(`tipoSalvamento_${k}`).value === "porcentaje") {
                if(!isNaN(P) && !isNaN(S)) S = trunc2(P * trunc2(S / 100));
            }

            if ([P, A, N, S].some(isNaN)) throw `Faltan campos obligatorios en la Alternativa ${k}.`;
            if (N <= 0) throw `La vida útil de la Alternativa ${k} debe ser mayor a 0.`;
            
            alternativas.push({ id: k, P, A, N, S });
        }

        let HTML_Response = "";
        const todasNegativas = alternativas.every(alt => {
            const vpnPrueba = calcularVPNBase(alt.P, alt.A, alt.S, i, alt.N);
            return vpnPrueba < 0;
        });

        if (modulo === "iguales") {
            alternativas.forEach(alt => {
                alt.vpn = calcularVPNBase(alt.P, alt.A, alt.S, i, alt.N);
            });

            // Si todas son negativas, buscar la menos mala (menor negativo / mayor valor algebraico)
            let mejorHipotetica = alternativas[0];
            alternativas.forEach(alt => {
                if (alt.vpn > mejorHipotetica.vpn) mejorHipotetica = alt;
            });

            alternativas.sort((a, b) => a.P - b.P);

            let txtAnalisis = "<strong>Cadena de Análisis Incremental Consecutivo:</strong><br>";
            let defensora = alternativas[0];

            for (let j = 1; j < alternativas.length; j++) {
                let retadora = alternativas[j];
                let deltaP = trunc2(retadora.P - defensora.P);
                let deltaA = trunc2(retadora.A - defensora.A);
                let deltaS = trunc2(retadora.S - defensora.S);
                
                let deltaVPN = trunc2(retadora.vpn - defensora.vpn);
                let tirIncremental = calcularTIRIncremental(deltaP, deltaA, deltaS, defensora.N);

                txtAnalisis += `• <em>Defensa: Alt ${defensora.id} vs Alt ${retadora.id}</em> → `;
                
                if (deltaVPN > 0 && tirIncremental > i) {
                    txtAnalisis += `ΔVPN: <span class="val-positivo">${deltaVPN.toFixed(2)}</span>, ΔTIR: <span class="val-positivo">${(tirIncremental*100).toFixed(2)}%</span>. Inversión adicional justificada. <strong style="color:var(--azul-primario);">Gana Alt ${retadora.id}</strong>.<br>`;
                    defensora = retadora;
                } else {
                    txtAnalisis += `ΔVPN: <span class="val-negativo">${deltaVPN.toFixed(2)}</span>, ΔTIR: <span class="val-negativo">${(tirIncremental*100).toFixed(2)}%</span>. Inversión adicional rechazada. <strong style="color:var(--azul-primario);">Mantiene Alt ${defensora.id}</strong>.<br>`;
                }
            }

            let htmlAlertNegativo = "";
            let htmlDecision = "";

            if (todasNegativas) {
                htmlAlertNegativo = `
                    <div class="alerta-negativo">
                        <strong>⚠️ Especificación Importante (Todas las Alternativas Negativas):</strong><br>
                        Dado que <strong>todas las alternativas presentan VPN negativo</strong>, en la práctica económica <u>NO SE DEBE ESCOGER NINGUNA</u>.<br>
                        Sin embargo, en un escenario hipotético donde sea obligatorio seleccionar una opción, la <strong>menos desfavorable</strong> sería la <strong>Alternativa ${mejorHipotetica.id}</strong> por presentar la menor pérdida (menor negativo).
                    </div>
                `;
                htmlDecision = `<span class="val-negativo">NO ESCOGER NINGUNA (Pérdidas). Opción hipotética menos desfavorable: Alternativa ${mejorHipotetica.id}</span>`;
            } else {
                htmlDecision = `<span class="val-positivo">Seleccionar Alternativa ${defensora.id}</span>`;
            }

            HTML_Response = `
                <div style="text-align: left; font-size: 14px; font-weight: normal; line-height:1.6;">
                    <strong>Métricas de Valor Presente Neto (VPN Individuales):</strong><br>
                    ${alternativas.map(a => `• <strong>Alternativa ${a.id}:</strong><br>&nbsp;&nbsp;&nbsp;&nbsp;VPN = ${formatearDual(a.vpn, true)}`).join('<br>')}<br>
                    ${txtAnalisis}<br>
                    ${htmlAlertNegativo}
                    <div style="font-size: 16px; margin-top:10px; border-top: 1px solid var(--azul-borde); padding-top:8px;">
                        <strong>Decisión Final:</strong> ${htmlDecision}
                    </div>
                </div>
            `;

        } else {
            // VIDAS ÚTILES DIFERENTES (VA / MCM)
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

            let mejorHipoteticaVA = alternativas[0];
            alternativas.forEach(alt => {
                if (alt.va > mejorHipoteticaVA.va) mejorHipoteticaVA = alt;
            });

            alternativas.sort((a, b) => a.P - b.P);
            let txtAnalisisVA = "<strong>Cadena de Análisis Incremental por Valor Anual (VA):</strong><br>";
            let defensoraVA = alternativas[0];

            for (let j = 1; j < alternativas.length; j++) {
                let retadoraVA = alternativas[j];
                let deltaVA = trunc2(retadoraVA.va - defensoraVA.va);
                
                txtAnalisisVA += `• <em>Defensa: Alt ${defensoraVA.id} vs Alt ${retadoraVA.id}</em> → `;
                if (deltaVA > 0) {
                    txtAnalisisVA += `ΔVA: <span class="val-positivo">${deltaVA.toFixed(2)}/año</span>. Incremento rentable. <strong style="color:var(--azul-primario);">Gana Alt ${retadoraVA.id}</strong>.<br>`;
                    defensoraVA = retadoraVA;
                } else {
                    txtAnalisisVA += `ΔVA: <span class="val-negativo">${deltaVA.toFixed(2)}/año</span>. No justifica costo. <strong style="color:var(--azul-primario);">Mantiene Alt ${defensoraVA.id}</strong>.<br>`;
                }
            }

            let htmlAlertNegativoVA = "";
            let htmlDecisionVA = "";

            if (todasNegativas) {
                htmlAlertNegativoVA = `
                    <div class="alerta-negativo">
                        <strong>⚠️ Especificación Importante (Todas las Alternativas Negativas):</strong><br>
                        Dado que <strong>todas las alternativas presentan flujos o valores anuales negativos</strong>, en la práctica <u>NO SE DEBE ESCOGER NINGUNA</u>.<br>
                        Sin embargo, en un escenario hipotético, la opción <strong>menos desfavorable</strong> sería la <strong>Alternativa ${mejorHipoteticaVA.id}</strong> por tener la menor pérdida anual.
                    </div>
                `;
                htmlDecisionVA = `<span class="val-negativo">NO ESCOGER NINGUNA. Opción hipotética menos desfavorable: Alternativa ${mejorHipoteticaVA.id}</span>`;
            } else {
                htmlDecisionVA = `<span class="val-positivo">Seleccionar Alternativa ${defensoraVA.id}</span>`;
            }

            HTML_Response = `
                <div style="text-align: left; font-size: 14px; font-weight: normal; line-height:1.6;">
                    <strong>Horizonte Común Unificado (MCM):</strong> <strong>${mcmGeneral} años</strong><br><br>
                    <strong>Análisis por Alternativa Pasando al MCM:</strong><br>
                    ${alternativas.map(a => `• <strong>Alternativa ${a.id}</strong> (N=${a.N} años):<br>
                     &nbsp;&nbsp;&nbsp;&nbsp;- Valor Anual (VA): ${formatearDual(a.va, true)} / año<br>
                     &nbsp;&nbsp;&nbsp;&nbsp;- VPN Extendido (MCM): ${formatearDual(a.vpnMCM, true)}`).join('<br>')}<br>
                    ${txtAnalisisVA}<br>
                    ${htmlAlertNegativoVA}
                    <div style="font-size: 16px; margin-top:10px; border-top: 1px solid var(--azul-borde); padding-top:8px;">
                        <strong>Decisión Final:</strong> ${htmlDecisionVA}
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
    const resDiv = document.getElementById("resultado");
    if (resDiv) resDiv.style.display = "none";
}

document.addEventListener("input", function(e) {
    if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") {
        if (!e.target.id.startsWith("vida_") && e.target.id !== "tipoModulo" && e.target.id !== "numAlternativas") {
            ocultarResultado();
        }
    }
});