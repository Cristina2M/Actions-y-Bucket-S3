// Función simple que usaremos en tests y documentaremos
/**
 * Incrementa el valor dado en 1.
 * @param {number} n
 * @returns {number}
 */
function incrementar(n) {
  return n + 1;
}

document.getElementById('btn').addEventListener('click', () => {
  const el = document.getElementById('title');
  el.textContent = `Contador: ${incrementar(0)}`;
});

// export para tests (CommonJS/ES compatible)
if (typeof module !== 'undefined') module.exports = { incrementar };
