const opcionesVariables = {
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
    cocomo: [
        { value: "E", text: "Esfuerzo Requerido (E)" },
        { value: "KLOC", text: "Tamaño de Software (KLOC)" }
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
    ],
    capacidad: [
        { value: "util", text: "Tasa de Utilización de Capacidad (%)" },
        { value: "Q", text: "Producción Real (Q)" },
        { value: "Qmax", text: "Capacidad Máxima de Producción" }
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
    
    opcionesVariables[modelo].forEach(opt => {
        const el = document.createElement("option");
        el.value = opt.value;
        el.text = opt.text;
        selectVar.appendChild(el);
    });
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
    
    // Ocultar todos los grupos inicialmente
    const grupos = ["grupo_CT", "grupo_CF", "grupo_v", "grupo_Q", "grupo_P", "grupo_IT", "grupo_U", "grupo_Cu", "grupo_margen", "grupo_Qmax", "grupo_utilizacion", "grupo_modo_cocomo", "grupo_KLOC", "grupo_Esfuerzo"];
    grupos.forEach(id => document.getElementById(id).classList.add("hidden"));
    
    // Mostrar dinámicamente según el modelo
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
    } else if (modelo === "cocomo") {
        document.getElementById("grupo_modo_cocomo").classList.remove("hidden");
        if (objetivo !== "E") document.getElementById("grupo_Esfuerzo").classList.remove("hidden");
        if (objetivo !== "KLOC") document.getElementById("grupo_KLOC").classList.remove("hidden");
    } else if (modelo === "ingreso_utilidad") {
        if (objetivo !== "U") document.getElementById("grupo_U").classList.remove("hidden");
        if (objetivo !== "IT") document.getElementById("grupo_IT").classList.remove("hidden");
        if (objetivo !== "CT") document.getElementById("grupo_CT").classList.remove("hidden");
    } else if (modelo === "formacion_precio") {
        if (objetivo !== "P") document.getElementById("grupo_P").classList.remove("hidden");
        if (objetivo !== "Cu") document.getElementById("grupo_Cu").classList.remove("hidden");
        if (objetivo !== "margen") document.getElementById("grupo_margen").classList.remove("hidden");
    } else if (modelo === "capacidad") {
        if (objetivo !== "util") document.getElementById("grupo_utilizacion").classList.remove("hidden");
        if (objetivo !== "Q") document.getElementById("grupo_Q").classList.remove("hidden");
        if (objetivo !== "Qmax") document.getElementById("grupo_Qmax").classList.remove("hidden");
    }
}

function ejecutarCalculo() {
    const modelo = document.getElementById("modeloCalculo").value;
    const objetivo = document.getElementById("variableObjetivo").value;
    const resDiv = document.getElementById("resultado");
    
    // Captura de datos
    const CT = parseFloat(document.getElementById("costoTotal").value);
    const CF = parseFloat(document.getElementById("costoFijo").value);
    const v = parseFloat(document.getElementById("costoVariableUnitario").value);
    const Q = parseFloat(document.getElementById("cantidad").value);
    const P = parseFloat(document.getElementById("precioUnitario").value);
    
    const IT = parseFloat(document.getElementById("ingresoTotal").value);
    const U = parseFloat(document.getElementById("utilidad").value);
    const Cu = parseFloat(document.getElementById("costoUnitario").value);
    const margen = parseFloat(document.getElementById("margenGanancia").value);
    
    const Qmax = parseFloat(document.getElementById("capacidadMax").value);
    const util = parseFloat(document.getElementById("tasaUtilizacion").value);
    
    const KLOC = parseFloat(document.getElementById("kloc").value);
    const E = parseFloat(document.getElementById("esfuerzo").value);
    
    let resultadoFinal = 0;
    let textoResultado = "";
    let color = "";

    try {
        // Validar que las variables físicas no sean negativas (excepto la Utilidad/Beneficio)
        const inputsFisicos = [CT, CF, v, Q, P, IT, Cu, Qmax, util, KLOC, E];
        if (inputsFisicos.some(val => val < 0)) throw "Error lógico: Esta variable no admite valores negativos.";

        if (modelo === "costo_total") {
            if (objetivo === "CT") {
                if (isNaN(CF) || isNaN(v) || isNaN(Q)) throw "Faltan variables.";
                resultadoFinal = CF + (v * Q);
                color = "val-positivo";
                textoResultado = `Costo Total (CT): <span class="${color}">${resultadoFinal.toFixed(2)}</span>`;
            } else if (objetivo === "CF") {
                if (isNaN(CT) || isNaN(v) || isNaN(Q)) throw "Faltan variables.";
                resultadoFinal = CT - (v * Q);
                if (resultadoFinal < 0) throw "Resultado inválido: El Costo Fijo resultante es negativo.";
                color = "val-positivo";
                textoResultado = `Costo Fijo (CF): <span class="${color}">${resultadoFinal.toFixed(2)}</span>`;
            } else if (objetivo === "v") {
                if (isNaN(CT) || isNaN(CF) || isNaN(Q) || Q === 0) throw "División por cero (Q=0) o datos faltantes.";
                resultadoFinal = (CT - CF) / Q;
                if (resultadoFinal < 0) throw "Resultado inválido: El Costo Variable es negativo.";
                color = "val-positivo";
                textoResultado = `Costo Variable Unitario (v): <span class="${color}">${resultadoFinal.toFixed(4)}</span>`;
            } else if (objetivo === "Q") {
                if (isNaN(CT) || isNaN(CF) || isNaN(v) || v === 0) throw "División por cero (v=0) o datos faltantes.";
                resultadoFinal = (CT - CF) / v;
                if (resultadoFinal < 0) throw "Resultado inválido: La cantidad es negativa.";
                color = "val-positivo";
                textoResultado = `Cantidad (Q): <span class="${color}">${resultadoFinal.toFixed(0)} unid.</span>`;
            }
        } 
        
        else if (modelo === "punto_equilibrio") {
            if (objetivo === "Qeq") {
                if (isNaN(CF) || isNaN(P) || isNaN(v)) throw "Faltan variables.";
                if ((P - v) <= 0) throw "El margen de contribución (P - v) debe ser mayor a 0 para que exista equilibrio.";
                resultadoFinal = CF / (P - v);
                color = "val-positivo";
                textoResultado = `Punto de Equilibrio (Qeq): <span class="${color}">${resultadoFinal.toFixed(2)} unid.</span>`;
            } else if (objetivo === "CF") {
                if (isNaN(Q) || isNaN(P) || isNaN(v)) throw "Faltan variables.";
                resultadoFinal = Q * (P - v);
                color = resultadoFinal < 0 ? "val-negativo" : "val-positivo";
                textoResultado = `Costo Fijo Soportado (CF): <span class="${color}">${resultadoFinal.toFixed(2)}</span>`;
            } else if (objetivo === "P") {
                if (isNaN(CF) || isNaN(Q) || isNaN(v) || Q === 0) throw "Faltan variables.";
                resultadoFinal = (CF / Q) + v;
                color = "val-positivo";
                textoResultado = `Precio Mínimo de Venta (P): <span class="${color}">$${resultadoFinal.toFixed(2)}</span>`;
            } else if (objetivo === "v") {
                if (isNaN(CF) || isNaN(Q) || isNaN(P) || Q === 0) throw "Faltan variables.";
                resultadoFinal = P - (CF / Q);
                color = resultadoFinal < 0 ? "val-negativo" : "val-positivo";
                textoResultado = `Costo Variable Límite (v): <span class="${color}">$${resultadoFinal.toFixed(2)}</span>`;
            }
        }

        else if (modelo === "ingreso_utilidad") {
            if (objetivo === "U") {
                if (isNaN(IT) || isNaN(CT)) throw "Faltan variables.";
                resultadoFinal = IT - CT;
                color = resultadoFinal < 0 ? "val-negativo" : "val-positivo"; // Pérdida en rojo, Ganancia en verde
                textoResultado = `Margen de Beneficio Real (U): <span class="${color}">$${resultadoFinal.toFixed(2)}</span>`;
            } else if (objetivo === "IT") {
                if (isNaN(U) || isNaN(CT)) throw "Faltan variables.";
                resultadoFinal = U + CT;
                if (resultadoFinal < 0) throw "Ingreso total no puede ser negativo.";
                color = "val-positivo";
                textoResultado = `Ingreso Total Requerido (IT): <span class="${color}">$${resultadoFinal.toFixed(2)}</span>`;
            } else if (objetivo === "CT") {
                if (isNaN(IT) || isNaN(U)) throw "Faltan variables.";
                resultadoFinal = IT - U;
                if (resultadoFinal < 0) throw "El Costo Total no puede ser negativo.";
                color = "val-positivo";
                textoResultado = `Costo Total Límite (CT): <span class="${color}">$${resultadoFinal.toFixed(2)}</span>`;
            }
        }

        else if (modelo === "formacion_precio") {
            if (objetivo === "P") {
                if (isNaN(Cu) || isNaN(margen)) throw "Faltan variables.";
                resultadoFinal = Cu * (1 + margen);
                color = resultadoFinal < 0 ? "val-negativo" : "val-positivo";
                textoResultado = `Precio Formulado (P): <span class="${color}">$${resultadoFinal.toFixed(2)}</span>`;
            } else if (objetivo === "Cu") {
                if (isNaN(P) || isNaN(margen)) throw "Faltan variables.";
                resultadoFinal = P / (1 + margen);
                color = resultadoFinal < 0 ? "val-negativo" : "val-positivo";
                textoResultado = `Costo Unitario (Cu): <span class="${color}">$${resultadoFinal.toFixed(2)}</span>`;
            } else if (objetivo === "margen") {
                if (isNaN(P) || isNaN(Cu) || Cu === 0) throw "Faltan variables o Costo Unitario es 0.";
                resultadoFinal = (P - Cu) / Cu;
                color = resultadoFinal < 0 ? "val-negativo" : "val-positivo"; // Margen negativo en rojo
                textoResultado = `Margen de Beneficio Nominal: <span class="${color}">${(resultadoFinal * 100).toFixed(2)}%</span>`;
            }
        }

        else if (modelo === "capacidad") {
            if (objetivo === "util") {
                if (isNaN(Q) || isNaN(Qmax) || Qmax === 0) throw "Faltan variables o la Capacidad Máxima es 0.";
                resultadoFinal = Q / Qmax;
                if (resultadoFinal > 1) throw "La Producción Real no puede superar la Capacidad Máxima (>100%).";
                color = "val-positivo";
                textoResultado = `Tasa de Utilización: <span class="${color}">${(resultadoFinal * 100).toFixed(2)}%</span>`;
            } else if (objetivo === "Q") {
                if (isNaN(util) || isNaN(Qmax)) throw "Faltan variables.";
                if (util < 0 || util > 1) throw "La Tasa de Utilización debe estar entre 0 y 1 (0% a 100%).";
                resultadoFinal = Qmax * util;
                color = "val-positivo";
                textoResultado = `Producción Real (Q): <span class="${color}">${resultadoFinal.toFixed(0)} unid.</span>`;
            } else if (objetivo === "Qmax") {
                if (isNaN(Q) || isNaN(util) || util === 0) throw "Faltan variables o la Utilización es 0.";
                resultadoFinal = Q / util;
                color = "val-positivo";
                textoResultado = `Capacidad Máxima Requerida: <span class="${color}">${resultadoFinal.toFixed(0)} unid.</span>`;
            }
        }

        else if (modelo === "cocomo") {
            const modo = document.getElementById("modoCocomo").value;
            let coef_a = 2.4, coef_b = 1.05; 
            if (modo === "semiacoplado") { coef_a = 3.0; coef_b = 1.12; }
            else if (modo === "embebido") { coef_a = 3.6; coef_b = 1.20; }
            
            if (objetivo === "E") {
                if (isNaN(KLOC)) throw "Ingrese el valor de KLOC.";
                resultadoFinal = coef_a * Math.pow(KLOC, coef_b); 
                color = "val-positivo";
                textoResultado = `Esfuerzo Estimado (E): <span class="${color}">${resultadoFinal.toFixed(2)} Personas-Mes</span>`;
            } else if (objetivo === "KLOC") {
                if (isNaN(E) || E <= 0) throw "Ingrese un esfuerzo válido mayor a 0.";
                resultadoFinal = Math.pow(E / coef_a, 1 / coef_b); 
                color = "val-positivo";
                textoResultado = `Tamaño Requerido: <span class="${color}">${resultadoFinal.toFixed(2)} KLOC</span>`;
            }
        }

        mostrarExito(resDiv, textoResultado);
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