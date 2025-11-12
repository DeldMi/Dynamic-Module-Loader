// module.js
// ============================
// Módulo principal do Dynamic Loader A3GS
// ============================

import * as utils from './utils.js';
import * as ui from './ui.js';
import * as rules from './rules.js';

/**
 * Função principal chamada pelo loader Tampermonkey.
 */
export async function applyRules(windowContext, meta) {
  utils.log('Módulo principal carregado com sucesso.', meta);

  // Aplica as regras definidas
  await rules.applyRules(windowContext, meta);

  // Mensagem de status
  utils.log('UI e regras aplicadas. Sistema operacional.');
}

/**
 * Exportação padrão
 */
export default { applyRules, utils, ui, rules };
