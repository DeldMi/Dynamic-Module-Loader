// module.js
import * as utils from './utils.js';
import * as ui from './ui.js';
import * as rules from './rules.js';

// A função principal que o loader chama
export async function applyRules(windowContext, meta) {
  utils.log('Módulo principal carregado:', meta);

  // Aplica as regras definidas em rules.js
  await rules.applyRules(windowContext, meta);

  // Pode adicionar lógica extra aqui, se quiser
  utils.log('UI e regras aplicadas com sucesso!');
}

// Exportação padrão (opcional)
export default { applyRules, utils, ui, rules };
