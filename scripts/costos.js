const opcionesVariablesCostos = {
    costo_total: [
        { value: "CT", text: "Costo Total (CT)" },
        { value: "CF", text: "Costo Fijo (CF)" },
        { value: "v", text: "Costo Variable Unitario (v)" },
        { value: "Q", text: "Cantidad / Volumen (Q)" }
    ],
    punto_equilibrio: [
        { value: "Qeq", text: "Cantidad de Equilibrio (Qeq)" },
        { value: "CF", text: "Costo Fijo (CF)" },
        { value: "P", text: "Precio Unitario de Venta (P)" },
        { value: "v", text: "Costo Variable Unitario (v)" }
    ],
    ingreso_utilidad: [
        { value: "U", text: "Margen de Beneficio Real / Utilidad (U)" },
        { value: "IT", text: "Ingreso Total (IT)" },
        { value: "CT", text: "Costo Total (CT)" }
    ],
    formacion_precio: [
        { value: "P", text: "Precio Unitario Formulado (P)" },
        { value: "Cu", text: "Costo Unitario Total (Cu)" },
        { value: "margen", text: "Margen de Beneficio Nominal (%)" }
    ]
};

function cambiarModelo() {
    const modelo = document.getElementById("modeloCalculo").value;
    const seccionVar = document.getElementById("seccionVariable");
    const selectVar = document.getElementById("variableObjetivo");
    const formCampos = document.getElementById("formularioCampos");
    
    ocultarResultado();
    formCampos.classList.add("hidden");
    
    if (!modelo) {
        seccionVar.classList.add("hidden");
        return;
    }
    
    seccionVar.classList.remove("hidden");
    selectVar.innerHTML = '<option value="">-- Seleccione la incógnita --</option>';
    
    if (opcionesVariablesCostos[modelo]) {
        opcionesVariablesCostos[modelo].forEach(opt => {
            const el = document.createElement("option");
            el.value = opt.value;
            el.text = opt.text;
            selectVar.appendChild(el);
        });
    }
}

function configurarFormulario() {
    const modelo = document.getElementById("modeloCalculo").value;
    const objetivo = document.getElementById("variableObjetivo").value;
    const formCampos = document.getElementById("formularioCampos");
    
    ocultarResultado();
    if (!objetivo) {
        formCampos.classList.add("hidden");
        return;
    }
    formCampos.classList.remove("hidden");
    
    const grupos = ["grupo_CT", "grupo_CF", "grupo_v", "grupo_Q", "grupo_P", "grupo_IT", "grupo_U", "grupo_Cu", "grupo_margen"];
    grupos.forEach(id => document.getElementById(id).classList.add("hidden"));
    
    if (modelo === "costo_total") {
        if (objetivo !== "CT") document.getElementById("grupo_CT").classList.remove("hidden");
        if (objetivo !== "CF") document.getElementById("grupo_CF").classList.remove("hidden");
        if (objetivo !== "v") document.getElementById("grupo_v").classList.remove("hidden");
        if (objetivo !== "Q") document.getElementById("grupo_Q").classList.remove("hidden");
    } else if (modelo === "punto_equilibrio") {
        if (objetivo !== "Qeq") document.getElementById("grupo_Q").classList.remove("hidden"); 
        if (objetivo !== "CF") document.getElementById("grupo_CF").classList.remove("hidden");
        if (objetivo !== "P") document.getElementById("grupo_P").classList.remove("hidden");
        if (objetivo !== "v") document.getElementById("grupo_v").classList.remove("hidden");
    } else if (modelo === "ingreso_utilidad") {
        if (objetivo !== "U") document.getElementById("grupo_U").classList.remove("hidden");
        if (objetivo !== "IT") document.getElementById("grupo_IT").classList.remove("hidden");
        if (objetivo !== "CT") document.getElementById("grupo_CT").classList.remove("hidden");
    } else if (modelo === "formacion_precio") {
        if (objetivo !== "P") document.getElementById("grupo_P").classList.remove("hidden");
        if (objetivo !== "Cu") document.getElementById("grupo_Cu").classList.remove("hidden");
        if (objetivo !== "margen") document.getElementById("grupo_margen").classList.remove("hidden");
    }
}

function ejecutarCalculoCostos() {
    const modelo = document.getElementById("modeloCalculo").value;
    const objetivo = document.getElementById("variableObjetivo").value;
    const resDiv = document.getElementById("resultado");
    
    const CT = parseFloat(document.getElementById("costoTotal").value);
    const CF = parseFloat(document.getElementById("costoFijo").value);
    const v = parseFloat(document.getElementById("costoVariableUnitario").value);
    const Q = parseFloat(document.getElementById("cantidad").value);
    const P = parseFloat(document.getElementById("precioUnitario").value);
    
    const IT = parseFloat(document.getElementById("ingresoTotal").value);
    const U = parseFloat(document.getElementById("utilidad").value);
    const Cu = parseFloat(document.getElementById("costoUnitario").value);
    const margenIn = parseFloat(document.getElementById("margenGanancia").value);
    const margen = !isNaN(margenIn) ? trunc2(margenIn / 100) : null;
    
    let resVal = 0;
    let textoRes = "";

    try {
        if (modelo === "costo_total") {
            if (objetivo === "CT") {
                if ([CF, v, Q].some(isNaN)) throw "Faltan variables obligatorias.";
                const vQ = trunc2(v * Q);
                resVal = trunc2(CF + vQ);
                textoRes = `<strong>Costo Total (CT):</strong><br>${formatearDual(resVal, true)}`;
            } else if (objetivo === "CF") {
                if ([CT, v, Q].some(isNaN)) throw "Faltan variables obligatorias.";
                const vQ = trunc2(v * Q);
                resVal = trunc2(CT - vQ);
                if (resVal < 0) throw "Error lógico: El Costo Fijo resultante es negativo.";
                textoRes = `<strong>Costo Fijo (CF):</strong><br>${formatearDual(resVal, true)}`;
            } else if (objetivo === "v") {
                if ([CT, CF, Q].some(isNaN) || Q === 0) throw "División por cero o datos faltantes.";
                const num = trunc2(CT - CF);
                resVal = trunc2(num / Q);
                if (resVal < 0) throw "Error lógico: El Costo Variable es negativo.";
                textoRes = `<strong>Costo Variable Unitario (v):</strong><br>${formatearDual(resVal, true)}`;
            } else if (objetivo === "Q") {
                if ([CT, CF, v].some(isNaN) || v === 0) throw "División por cero o datos faltantes.";
                const num = trunc2(CT - CF);
                resVal = trunc2(num / v);
                if (resVal < 0) throw "Error lógico: La cantidad es negativa.";
                textoRes = `<strong>Cantidad Producida (Q):</strong><br><span class="val-positivo" style="font-size:22px; font-weight:800;">${resVal.toFixed(2)} unidades</span>`;
            }
        } 
        
        else if (modelo === "punto_equilibrio") {
            if (objetivo === "Qeq") {
                if ([CF, P, v].some(isNaN)) throw "Faltan variables obligatorias.";
                const dif = trunc2(P - v);
                if (dif <= 0) throw "El margen de contribución (P - v) debe ser mayor a 0 para alcanzar el equilibrio.";
                resVal = trunc2(CF / dif);
                textoRes = `<strong>Punto de Equilibrio (Qeq):</strong><br><span class="val-positivo" style="font-size:22px; font-weight:800;">${resVal.toFixed(2)} unidades</span>`;
            } else if (objetivo === "CF") {
                if ([Q, P, v].some(isNaN)) throw "Faltan variables obligatorias.";
                const dif = trunc2(P - v);
                resVal = trunc2(Q * dif);
                textoRes = `<strong>Costo Fijo Máximo Soportado (CF):</strong><br>${formatearDual(resVal, true)}`;
            } else if (objetivo === "P") {
                if ([CF, Q, v].some(isNaN) || Q === 0) throw "Faltan variables obligatorias o Q es 0.";
                const div = trunc2(CF / Q);
                resVal = trunc2(div + v);
                textoRes = `<strong>Precio Mínimo de Venta de Equilibrio (P):</strong><br>${formatearDual(resVal, true)}`;
            } else if (objetivo === "v") {
                if ([CF, Q, P].some(isNaN) || Q === 0) throw "Faltan variables obligatorias o Q es 0.";
                const div = trunc2(CF / Q);
                resVal = trunc2(P - div);
                textoRes = `<strong>Costo Variable Límite (v):</strong><br>${formatearDual(resVal, true)}`;
            }
        }

        else if (modelo === "ingreso_utilidad") {
            if (objetivo === "U") {
                if ([IT, CT].some(isNaN)) throw "Faltan variables obligatorias.";
                resVal = trunc2(IT - CT);
                textoRes = `<strong>Margen de Beneficio Real (U):</strong><br>${formatearDual(resVal, true)}`;
            } else if (objetivo === "IT") {
                if ([U, CT].some(isNaN)) throw "Faltan variables obligatorias.";
                resVal = trunc2(U + CT);
                if (resVal < 0) throw "Ingreso total no puede ser negativo.";
                textoRes = `<strong>Ingreso Total Requerido (IT):</strong><br>${formatearDual(resVal, true)}`;
            } else if (objetivo === "CT") {
                if ([IT, U].some(isNaN)) throw "Faltan variables obligatorias.";
                resVal = trunc2(IT - U);
                if (resVal < 0) throw "El Costo Total no puede ser negativo.";
                textoRes = `<strong>Costo Total Límite (CT):</strong><br>${formatearDual(resVal, true)}`;
            }
        }

        else if (modelo === "formacion_precio") {
            if (objetivo === "P") {
                if ([Cu, margen].some(val => val === null || isNaN(val))) throw "Faltan variables obligatorias.";
                const factor = trunc2(1 + margen);
                resVal = trunc2(Cu * factor);
                textoRes = `<strong>Precio Formulado de Venta (P):</strong><br>${formatearDual(resVal, true)}`;
            } else if (objetivo === "Cu") {
                if ([P, margen].some(val => val === null || isNaN(val))) throw "Faltan variables obligatorias.";
                const factor = trunc2(1 + margen);
                if (factor === 0) throw "División por cero.";
                resVal = trunc2(P / factor);
                textoRes = `<strong>Costo Unitario Límite (Cu):</strong><br>${formatearDual(resVal, true)}`;
            } else if (objetivo === "margen") {
                if ([P, Cu].some(isNaN) || Cu === 0) throw "Faltan variables obligatorias o Cu es 0.";
                const dif = trunc2(P - Cu);
                resVal = trunc2(dif / Cu);
                const pct = trunc2(resVal * 100);
                textoRes = `<strong>Margen de Beneficio Nominal:</strong><br><span class="val-positivo" style="font-size:22px; font-weight:800;">${pct.toFixed(2)}%</span>`;
            }
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
