// module.js
// Núcleo do sistema dinâmico — responsável por carregar, atualizar e executar os módulos remotos (utils, ui, rules).
// Requer permissões GM_* no Tampermonkey.
// Autor: André Felipe
// Data: 2025-11-12

(async function() {
  'use strict';

  const REPO_BASE = 'https://raw.githubusercontent.com/DeldMi/Dynamic-Module-Loader/main/';
  const MODULES = ['utils.js', 'ui.js', 'rules.js'];
  const CACHE = {};

  // Utilitário: busca módulo remoto e retorna o código
  async function fetchModule(name) {
    const url = REPO_BASE + name;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Falha ao carregar ${name}: ${res.status}`);
    return await res.text();
  }

  // Função principal de inicialização
  async function init() {
    console.log('[DynamicLoader] Iniciando carregamento de módulos...');
    for (const name of MODULES) {
      const code = await fetchModule(name);
      CACHE[name] = code;
      try {
        eval(code); // executa o módulo
        console.log(`[DynamicLoader] ${name} carregado com sucesso.`);
      } catch (e) {
        console.error(`[DynamicLoader] Erro ao executar ${name}:`, e);
      }
    }
    if (typeof applyRules === 'function') applyRules();
  }

  // Atualização periódica (a cada 10 minutos)
  setInterval(init, 10 * 60 * 1000);
  await init();

})();