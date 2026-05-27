function calcular() {
  // elementos
  const tipoInteres = document.querySelector('input[name="tipoInteres"]:checked');
  const inputP = document.querySelector("#cantPresente");
  const inputF = document.querySelector("#cantFutura");
  const inputi = document.querySelector("#tasaInteres");
  const inputN = document.querySelector("#numeroPeriodos");
  const resultado = document.querySelector("#resultado");
  
  // inputs
  let P = parseFloat(inputP.value); 
  let F = parseFloat(inputF.value);
  let i = parseFloat(inputi.value);
  let N = parseFloat(inputN.value);
  
  // formulas
  let output = 0;
  if (tipoInteres.value === "simple") {
    output = P * (1 + (i * N));
  } else {
    output = P * ((1 + i) ** N);
  }
  
  // resultados
  output = Math.trunc(output * 10000) / 10000;
  inputF.value = output;
  resultado.textContent = output;
  resultado.style.color = "green";
  
  // debug
  console.log(output);
  console.log(P);
  console.log(N);
  console.log(F);
  console.log(i);
  console.log(tipoInteres);
}
