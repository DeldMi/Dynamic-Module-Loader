// rules.js
// ============================
// Regras e automações principais
// ============================

import { log, waitFor, injectCSS } from './utils.js';
import { createFloatingButton } from './ui.js';

/**
 * Função principal de aplicação de regras.
 */
export async function applyRules(windowContext, meta) {
  log('Aplicando regras do módulo...', meta);

  // Aguarda o carregamento do corpo da página
  const el = await waitFor('body');
  el.style.background = '#f8fbff';

  // Injeta um CSS de personalização global
  injectCSS(`
    h1, h2, h3 {
      color: #004f9f !important;
      font-family: 'Segoe UI', sans-serif;
    }
    a:hover {
      text-decoration: underline;
      color: #0078ff !important;
    }
  `);

  // Cria o botão flutuante
  createFloatingButton('⚙️', () => {
    alert('Script A3GS ativo! Origem: ' + (meta?.url || 'Local'));
  });

  log('Regras aplicadas com sucesso.');
}

export default { applyRules };
