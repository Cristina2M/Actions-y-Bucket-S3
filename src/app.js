// src/app.js

/**
 * Incrementa el valor dado en 1.
 * @param {number} n
 * @returns {number}
 */
function incrementar(n) {
  return n + 1;
}

// Solo accedemos al DOM si existe (para que Jest no falle)
n=0;
if (typeof document !== 'undefined') {
  document.getElementById('btn')?.addEventListener('click', () => {
    const el = document.getElementById('title');
    el.textContent = `Contador: ${incrementar(n)}`;
  });
}

// Exportar función para las pruebas
if (typeof module !== 'undefined') {
  module.exports = { incrementar };
}
