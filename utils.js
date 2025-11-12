// ontém utilitários (por exemplo, log(), injectCSS());

// utils.js

// Exemplo de log formatado
export function log(...args) {
  console.log('[A3GS-UTILS]', ...args);
}

// Adiciona CSS dinamicamente na página
export function injectCSS(css) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);
}

// Espera o elemento aparecer no DOM (útil em SPAs)
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

// Exportação padrão opcional
export default { log, injectCSS, waitFor };

