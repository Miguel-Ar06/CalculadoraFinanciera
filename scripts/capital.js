document.addEventListener("DOMContentLoaded", () => {
    configurarFormulario();
});

function configurarFormulario() {
    const tipo = document.getElementById("tipoCalculo").value;
    const formCampos = document.getElementById("formularioCampos");
    
    ocultarResultado();
    if (!tipo) {
        formCampos.classList.add("hidden");
        return;
    }
    
    formCampos.classList.remove("hidden");
    const grupos = ["grupo_ie", "grupo_r", "grupo_m", "grupo_tmar_val", "grupo_inflacion", "grupo_premio", "grupo_co_val", "grupo_roa", "grupo_roe", "grupo_wd", "grupo_kd", "grupo_ke"];
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
        if (tipo !== "co_roa") document.getElementById("grupo_roa").classList.remove("hidden");
        if (tipo !== "co_roe") document.getElementById("grupo_roe").classList.remove("hidden");
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

    try {
        if (tipo.includes("discreta") || tipo.includes("continua")) {
            const ieInput = parseFloat(document.getElementById("tasaEfectiva").value);
            const rInput = parseFloat(document.getElementById("tasaNominal").value);
            const m = parseFloat(document.getElementById("frecuencia").value);

            const ie = !isNaN(ieInput) ? trunc2(ieInput / 100) : null;
            const r = !isNaN(rInput) ? trunc2(rInput / 100) : null;
            
            if (tipo === "ie_discreta") {
                if (r === null || isNaN(m)) throw "Faltan datos obligatorios.";
                const div = trunc2(r / m);
                const base = trunc2(1 + div);
                const powVal = trunc2(Math.pow(base, m));
                output = trunc2(powVal - 1);
                const pct = trunc2(output * 100);
                texto = `<strong>Tasa Efectiva Anual (i):</strong><br><span class="val-positivo" style="font-size:22px; font-weight:800;">${pct.toFixed(2)}%</span>`;
            } else if (tipo === "r_discreta") {
                if (ie === null || isNaN(m)) throw "Faltan datos obligatorios.";
                const exp = trunc2(1 / m);
                const base = trunc2(1 + ie);
                const powVal = trunc2(Math.pow(base, exp));
                const dif = trunc2(powVal - 1);
                output = trunc2(m * dif);
                const pct = trunc2(output * 100);
                texto = `<strong>Tasa Nominal Anual (r):</strong><br><span class="val-positivo" style="font-size:22px; font-weight:800;">${pct.toFixed(2)}%</span>`;
            } else if (tipo === "ie_continua") {
                if (r === null) throw "Faltan datos obligatorios.";
                const expVal = trunc2(Math.exp(r));
                output = trunc2(expVal - 1);
                const pct = trunc2(output * 100);
                texto = `<strong>Tasa Efectiva Continua:</strong><br><span class="val-positivo" style="font-size:22px; font-weight:800;">${pct.toFixed(2)}%</span>`;
            } else if (tipo === "r_continua") {
                if (ie === null) throw "Faltan datos obligatorios.";
                const logVal = trunc2(Math.log(trunc2(1 + ie)));
                output = trunc2(logVal);
                const pct = trunc2(output * 100);
                texto = `<strong>Tasa Nominal Continua:</strong><br><span class="val-positivo" style="font-size:22px; font-weight:800;">${pct.toFixed(2)}%</span>`;
            }
        }
        else if (tipo.startsWith("tmar")) {
            const tmarIn = parseFloat(document.getElementById("valTmar").value);
            const fIn = parseFloat(document.getElementById("valInflacion").value);
            const iIn = parseFloat(document.getElementById("valPremio").value);

            const tmar = !isNaN(tmarIn) ? trunc2(tmarIn / 100) : null;
            const f = !isNaN(fIn) ? trunc2(fIn / 100) : null;
            const i = !isNaN(iIn) ? trunc2(iIn / 100) : null;

            if (tipo === "tmar") {
                if (f === null || i === null) throw "Faltan datos obligatorios.";
                const prod = trunc2(i * f);
                const sum = trunc2(i + f);
                output = trunc2(sum + prod);
                const pct = trunc2(output * 100);
                texto = `<strong>TMAR Global:</strong><br><span class="val-positivo" style="font-size:22px; font-weight:800;">${pct.toFixed(2)}%</span>`;
            } else if (tipo === "tmar_i") {
                if (tmar === null || f === null) throw "Faltan datos obligatorios.";
                const num = trunc2(tmar - f);
                const den = trunc2(1 + f);
                output = trunc2(num / den);
                const pct = trunc2(output * 100);
                texto = `<strong>Premio al Riesgo (i):</strong><br><span class="val-positivo" style="font-size:22px; font-weight:800;">${pct.toFixed(2)}%</span>`;
            } else if (tipo === "tmar_f") {
                if (tmar === null || i === null) throw "Faltan datos obligatorios.";
                const num = trunc2(tmar - i);
                const den = trunc2(1 + i);
                output = trunc2(num / den);
                const pct = trunc2(output * 100);
                texto = `<strong>Tasa de Inflación (f):</strong><br><span class="val-positivo" style="font-size:22px; font-weight:800;">${pct.toFixed(2)}%</span>`;
            }
        }
        else if (tipo.startsWith("co")) {
            const co = parseFloat(document.getElementById("valCO").value);
            const roa = parseFloat(document.getElementById("valROA").value);
            const roe = parseFloat(document.getElementById("valROE").value);

            if (tipo === "co") {
                if (isNaN(roa) || isNaN(roe)) throw "Faltan datos obligatorios.";
                output = trunc2(roa - roe);
                texto = `<strong>Costo de Oportunidad Perdido:</strong><br>${formatearDual(output, true)}`;
            } else if (tipo === "co_roa") {
                if (isNaN(co) || isNaN(roe)) throw "Faltan datos obligatorios.";
                output = trunc2(co + roe);
                texto = `<strong>Retorno Opción Alternativa:</strong><br>${formatearDual(output, true)}`;
            } else if (tipo === "co_roe") {
                if (isNaN(co) || isNaN(roa)) throw "Faltan datos obligatorios.";
                output = trunc2(roa - co);
                texto = `<strong>Retorno Opción Elegida:</strong><br>${formatearDual(output, true)}`;
            }
        }
        else if (tipo === "ccpp") {
            const WdIn = parseFloat(document.getElementById("valWd").value);
            const KdIn = parseFloat(document.getElementById("valKd").value);
            const KeIn = parseFloat(document.getElementById("valKe").value);

            if (isNaN(WdIn) || isNaN(KdIn) || isNaN(KeIn)) throw "Faltan datos obligatorios.";

            const Wd = trunc2(WdIn > 1 ? WdIn / 100 : WdIn);
            if (Wd < 0 || Wd > 1) throw "El porcentaje de deuda (Wd) debe estar entre 0 y 100%.";

            const Kd = trunc2(KdIn / 100);
            const Ke = trunc2(KeIn / 100);

            const We = trunc2(1 - Wd);
            const partD = trunc2(Wd * Kd);
            const partE = trunc2(We * Ke);
            output = trunc2(partD + partE);
            const pct = trunc2(output * 100);
            texto = `<strong>Costo del Capital Promedio Ponderado (CCPP / WACC):</strong><br><span class="val-positivo" style="font-size:22px; font-weight:800;">${pct.toFixed(2)}%</span>`;
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