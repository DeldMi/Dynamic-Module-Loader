// utils.js
// ============================
// Utilitários base para o sistema dinâmico A3GS
// ============================

/**
 * Exibe logs padronizados no console.
 */
export function log(...args) {
  console.log('%c[A3GS-UTILS]', 'color: #0078ff; font-weight: bold;', ...args);
}

/**
 * Adiciona CSS personalizado na página.
 */
export function injectCSS(cssText) {
  const style = document.createElement('style');
  style.textContent = cssText;
  document.head.appendChild(style);
  log('CSS injetado com sucesso.');
}

/**
 * Aguarda um seletor aparecer no DOM.
 */
export function waitFor(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) return resolve(el);

    const obs = new MutationObserver(() => {
      const el = document.querySelector(selector);
      if (el) {
        obs.disconnect();
        resolve(el);
      }
    });

    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => {
      obs.disconnect();
      reject(new Error('Elemento não encontrado: ' + selector));
    }, timeout);
  });
}

export default { log, injectCSS, waitFor };
