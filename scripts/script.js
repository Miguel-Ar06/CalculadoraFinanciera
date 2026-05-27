function calcular() {
  let tipoInteres = document.querySelector('input[name="tipoInteres"]:checked').value;
  let P = document.querySelector("#cantPresente").value;
  let F = document.querySelector("#cantFutura").value;
  let i = document.querySelector("#tasaInteres").value;
  let N = document.querySelector("#numeroPeriodos").value;
  let resultado = document.querySelector("#resultado");

  let output = P * (1 + (i * N));
  F = output;
  resultado.textContent = output;
  console.log(output);
  console.log(P);
  console.log(N);
  console.log(F);
  console.log(i);
  console.log(tipoInteres);
}
