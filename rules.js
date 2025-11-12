
// contém funções applyRules() que alteram o DOM;
// rules.js
import { log, waitFor, injectCSS } from './utils.js';
import { createFloatingButton } from './ui.js';

// Função principal chamada pelo loader
export async function applyRules(windowContext, meta) {
  log('Aplicando regras do módulo...', meta);

  // Exemplo: aguarda um elemento e muda o fundo
  const el = await waitFor('body');
  el.style.background = '#f0f7ff';

  // Injeta CSS personalizado
  injectCSS(`h1, h2 { color: #0059b2 !important; }`);

  // Cria botão de exemplo
  createFloatingButton('⚙️', () => {
    alert('Script A3GS ativo! Fonte: ' + (meta.url || meta.source));
  });

  log('Regras aplicadas com sucesso.');
}

export default { applyRules };
