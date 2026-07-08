function configurarFormulario() {
    const tipo = document.getElementById("tipoCalculo").value;
    const formCampos = document.getElementById("formularioCampos");
    
    ocultarResultado();

    if (!tipo) {
        formCampos.classList.add("hidden");
        return;
    }
    
    formCampos.classList.remove("hidden");
    
    const grupos = [
        "grupo_ie", "grupo_r", "grupo_m", 
        "grupo_tmar_val", "grupo_inflacion", "grupo_premio",
        "grupo_co_val", "grupo_roa", "grupo_roe",
        "grupo_wd", "grupo_kd", "grupo_ke"
    ];
    grupos.forEach(id => document.getElementById(id).classList.add("hidden"));

    if (tipo === "ie_discreta" || tipo === "r_discreta") {
        document.getElementById(tipo === "ie_discreta" ? "grupo_r" : "grupo_ie").classList.remove("hidden");
        document.getElementById("grupo_m").classList.remove("hidden");
    } else if (tipo === "ie_continua" || tipo === "r_continua") {
        document.getElementById(tipo === "ie_continua" ? "grupo_r" : "grupo_ie").classList.remove("hidden");
    } else if (tipo.startsWith("tmar")) {
        if (tipo !== "tmar") document.getElementById("grupo_tmar_val").classList.remove("hidden");
        if (tipo !== "tmar_f") document.getElementById("grupo_inflacion").classList.remove("hidden");
        if (tipo !== "tmar_i") document.getElementById("grupo_premio").classList.remove("hidden");
    } else if (tipo.startsWith("co")) {
        if (tipo !== "co") document.getElementById("grupo_co_val").classList.remove("hidden");
        if (tipo !== "co_roe") document.getElementById("grupo_roa").classList.remove("hidden");
        if (tipo !== "co_roa") document.getElementById("grupo_roe").classList.remove("hidden");
    } else if (tipo === "ccpp") {
        document.getElementById("grupo_wd").classList.remove("hidden");
        document.getElementById("grupo_kd").classList.remove("hidden");
        document.getElementById("grupo_ke").classList.remove("hidden");
    }
}

function calcularCapital() {
    const tipo = document.getElementById("tipoCalculo").value;
    const resDiv = document.getElementById("resultado");
    let output = 0;
    let texto = "";
    let color = "";

    try {
        if (tipo.includes("discreta") || tipo.includes("continua")) {
            const ie = parseFloat(document.getElementById("tasaEfectiva").value);
            const r = parseFloat(document.getElementById("tasaNominal").value);
            const m = parseFloat(document.getElementById("frecuencia").value);
            
            if (tipo === "ie_discreta") {
                if (isNaN(r) || isNaN(m)) throw "Faltan datos obligatorios.";
                output = Math.pow(1 + (r / m), m) - 1;
                color = output < 0 ? "val-negativo" : "val-positivo";
                texto = `Tasa Efectiva Anual (i): <span class="${color}">${(output * 100).toFixed(4)}%</span>`;
            } else if (tipo === "r_discreta") {
                if (isNaN(ie) || isNaN(m)) throw "Faltan datos obligatorios.";
                output = m * (Math.pow(1 + ie, 1 / m) - 1);
                color = output < 0 ? "val-negativo" : "val-positivo";
                texto = `Tasa Nominal Anual (r): <span class="${color}">${(output * 100).toFixed(4)}%</span>`;
            } else if (tipo === "ie_continua") {
                if (isNaN(r)) throw "Faltan datos obligatorios.";
                output = Math.exp(r) - 1;
                color = output < 0 ? "val-negativo" : "val-positivo";
                texto = `Tasa Efectiva Continua: <span class="${color}">${(output * 100).toFixed(4)}%</span>`;
            } else if (tipo === "r_continua") {
                if (isNaN(ie)) throw "Faltan datos obligatorios.";
                output = Math.log(1 + ie);
                color = output < 0 ? "val-negativo" : "val-positivo";
                texto = `Tasa Nominal Continua: <span class="${color}">${(output * 100).toFixed(4)}%</span>`;
            }
        }
        else if (tipo.startsWith("tmar")) {
            const tmar = parseFloat(document.getElementById("valTmar").value);
            const f = parseFloat(document.getElementById("valInflacion").value);
            const i = parseFloat(document.getElementById("valPremio").value);

            if (tipo === "tmar") {
                if (isNaN(f) || isNaN(i)) throw "Faltan datos obligatorios.";
                output = i + f + (i * f);
                color = output < 0 ? "val-negativo" : "val-positivo";
                texto = `TMAR Global: <span class="${color}">${(output * 100).toFixed(4)}%</span>`;
            } else if (tipo === "tmar_i") {
                if (isNaN(tmar) || isNaN(f)) throw "Faltan datos obligatorios.";
                output = (tmar - f) / (1 + f);
                color = output < 0 ? "val-negativo" : "val-positivo";
                texto = `Premio al Riesgo (i): <span class="${color}">${(output * 100).toFixed(4)}%</span>`;
            } else if (tipo === "tmar_f") {
                if (isNaN(tmar) || isNaN(i)) throw "Faltan datos obligatorios.";
                output = (tmar - i) / (1 + i);
                color = output < 0 ? "val-negativo" : "val-positivo";
                texto = `Tasa de Inflación (f): <span class="${color}">${(output * 100).toFixed(4)}%</span>`;
            }
        }
        else if (tipo.startsWith("co")) {
            const co = parseFloat(document.getElementById("valCO").value);
            const roa = parseFloat(document.getElementById("valROA").value);
            const roe = parseFloat(document.getElementById("valROE").value);

            if (tipo === "co") {
                if (isNaN(roa) || isNaN(roe)) throw "Faltan datos obligatorios.";
                output = roa - roe;
                color = output < 0 ? "val-negativo" : "val-positivo";
                texto = `Costo de Oportunidad: <span class="${color}">${output.toFixed(4)}</span>`;
            } else if (tipo === "co_roa") {
                if (isNaN(co) || isNaN(roe)) throw "Faltan datos obligatorios.";
                output = co + roe;
                color = output < 0 ? "val-negativo" : "val-positivo";
                texto = `Retorno Alternativa: <span class="${color}">${output.toFixed(4)}</span>`;
            } else if (tipo === "co_roe") {
                if (isNaN(co) || isNaN(roa)) throw "Faltan datos obligatorios.";
                output = roa - co;
                color = output < 0 ? "val-negativo" : "val-positivo";
                texto = `Retorno Elegida: <span class="${color}">${output.toFixed(4)}</span>`;
            }
        }
        else if (tipo === "ccpp") {
            const Wd = parseFloat(document.getElementById("valWd").value);
            const Kd = parseFloat(document.getElementById("valKd").value);
            const Ke = parseFloat(document.getElementById("valKe").value);

            if (isNaN(Wd) || isNaN(Kd) || isNaN(Ke)) throw "Faltan datos obligatorios.";
            if (Wd < 0 || Wd > 1) throw "Error lógico: El porcentaje de deuda (Wd) debe estar entre 0 y 1.";
            if (Kd < 0 || Ke < 0) throw "Error lógico: Los costos de capital (Kd, Ke) no pueden ser negativos.";

            const We = 1 - Wd;
            output = (Wd * Kd) + (We * Ke);
            color = output < 0 ? "val-negativo" : "val-positivo";
            texto = `CCPP / WACC: <span class="${color}">${(output * 100).toFixed(4)}%</span>`;
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