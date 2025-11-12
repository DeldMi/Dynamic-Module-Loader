// ==UserScript==
// @name         A3GS Tampermonkey Dynamic Module Loader
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Carrega módulos JS (local ou GitHub/raw), verifica atualizações automaticamente e reaplica regras/funções.
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @grant        GM_addStyle
// @grant        unsafeWindow
// @connect      raw.githubusercontent.com
// @connect      *
// ==/UserScript==

/*
  André — explico em seguida:
  - Configure REMOTE_MODULE_URL para apontar para o arquivo .js (raw) no GitHub ou outro host.
  - Você pode manter um "override local" (código armazenado via GM_setValue) quando quiser testar algo localmente.
  - O loader checa atualizações a cada 'updateIntervalMinutes'. Ao detectar mudança (hash diferente), reimporta o módulo e executa handler.
  - Segurança: executar código remoto tem riscos — só use fontes confiáveis.
*/

/* ========== CONFIGURAÇÃO ========== */
const REMOTE_MODULE_URL_KEY = 'a3gs.remoteModuleURL';        // chave persitente para a URL do módulo remoto
const LOCAL_OVERRIDE_KEY_PREFIX = 'a3gs.localOverride.';     // prefixo para override local (pode ter vários IDs)
const LAST_HASH_KEY_PREFIX = 'a3gs.lastHash.';               // prefixo para armazenar último hash
const UPDATE_INTERVAL_KEY = 'a3gs.updateIntervalMinutes';   // em minutos

// valores padrão — ajuste aqui se quiser
if (!GM_getValue(REMOTE_MODULE_URL_KEY)) {
  GM_setValue(REMOTE_MODULE_URL_KEY, 'https://raw.githubusercontent.com/DeldMi/Dynamic-Module-Loader/refs/heads/main/Tampermonkey/module.js');
}
if (!GM_getValue(UPDATE_INTERVAL_KEY)) {
  GM_setValue(UPDATE_INTERVAL_KEY, 5); // checar a cada 5 minutos por padrão
}

/* ========== UTILITÁRIOS ========== */

/**
 * Faz requisição CORS-friendly usando GM_xmlhttpRequest e retorna responseText.
 * @param {string} url
 * @returns {Promise<string>}
 */
function fetchText(url) {
  return new Promise((resolve, reject) => {
    GM_xmlhttpRequest({
      method: 'GET',
      url,
      responseType: 'text',
      onload: res => {
        if (res.status >= 200 && res.status < 400) resolve(res.responseText);
        else reject(new Error(`HTTP ${res.status} ao buscar ${url}`));
      },
      onerror: err => reject(err),
      ontimeout: () => reject(new Error('Timeout fetching ' + url)),
    });
  });
}

/**
 * Calcula SHA-256 hex de um texto (usando Web Crypto).
 * @param {string} text
 * @returns {Promise<string>} hex
 */
async function sha256Hex(text) {
  const enc = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest('SHA-256', enc);
  const arr = Array.from(new Uint8Array(hash));
  return arr.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Importa dinamicamente código JS (texto) usando Blob + import() para preservar módulos ES.
 * @param {string} codeText
 * @param {string} label - rótulo para debugging
 * @returns {Promise<Module>} módulo importado
 */
async function importFromString(codeText, label = 'module') {
  const blob = new Blob([codeText], { type: 'text/javascript' });
  const blobUrl = URL.createObjectURL(blob);
  try {
    const mod = await import(blobUrl + `?t=${Date.now()}`); // cache buster
    return mod;
  } finally {
    // Revoke depois de importar (não antes)
    URL.revokeObjectURL(blobUrl);
  }
}

/* ========== LÓGICA DE CARREGAMENTO E ATUALIZAÇÃO ========== */

/**
 * Obtém o código fonte a usar: primeiro verifica override local (salvo), senão busca a URL remota.
 * @param {string} moduleId - identificador curto para armazenar hash/override
 * @param {string} remoteUrl
 * @returns {Promise<{source:'local'|'remote', text:string, url?:string}>}
 */
async function getSourceCode(moduleId, remoteUrl) {
  const localKey = LOCAL_OVERRIDE_KEY_PREFIX + moduleId;
  const local = GM_getValue(localKey, null);
  if (local && local.trim().length > 0) {
    return { source: 'local', text: local };
  }
  // remoto
  const text = await fetchText(remoteUrl);
  return { source: 'remote', text, url: remoteUrl };
}

/**
 * Carrega/atualiza um módulo identificado por 'moduleId' e chama onUpdate(modImport, meta).
 * @param {string} moduleId
 * @param {string} remoteUrl
 * @param {(mod: any, meta: object) => void} onUpdate - executado quando o módulo é carregado/atualizado
 */
async function loadAndWatchModule(moduleId, remoteUrl, onUpdate) {
  try {
    const src = await getSourceCode(moduleId, remoteUrl);
    const hash = await sha256Hex(src.text);

    const lastHashKey = LAST_HASH_KEY_PREFIX + moduleId;
    const lastHash = GM_getValue(lastHashKey, null);

    const meta = { moduleId, source: src.source, url: src.url || null, hash };

    if (lastHash === hash) {
      // sem mudança — ainda assim podemos optar por (re)importar na primeira vez
      console.log(`[A3GS] ${moduleId} sem mudança (hash=${hash}).`);
      // se nunca foi importado (lastHash definido mas sem módulo carregado?), forçamos import
      // para simplicidade, aqui importamos sempre ao iniciar pela primeira vez:
      // Se quiser evitar import repetido, podemos trackear um 'loaded' runtime.
      if (!window.__a3gs_loaded_modules) window.__a3gs_loaded_modules = {};
      if (!window.__a3gs_loaded_modules[moduleId]) {
        const mod = await importFromString(src.text, moduleId);
        window.__a3gs_loaded_modules[moduleId] = mod;
        onUpdate(mod, meta);
      }
      return meta;
    }

    // houve mudança (ou primeiro carregamento)
    console.log(`[A3GS] Atualização detectada para ${moduleId}. Novo hash: ${hash}`);
    const mod = await importFromString(src.text, moduleId);

    // salvar hash e marcar como carregado
    GM_setValue(lastHashKey, hash);
    if (!window.__a3gs_loaded_modules) window.__a3gs_loaded_modules = {};
    window.__a3gs_loaded_modules[moduleId] = mod;

    // notificação opcional
    try {
      GM_notification({
        title: 'A3GS: Módulo atualizado',
        text: `${moduleId} (${src.source}) atualizado.`,
        timeout: 4000
      });
    } catch (e) {
      /* ignore notificações em ambientes sem suporte */
    }

    onUpdate(mod, meta);
    return meta;
  } catch (err) {
    console.error('[A3GS] Erro ao carregar módulo:', err);
    throw err;
  }
}

/* ========== HANDLER: O QUE FAZER QUANDO O MÓDULO CHEGAR/ATUALIZAR ========== */

/**
 * Exemplo de onUpdate: aqui você aplica regras, registra callbacks, inicializa comportamentos etc.
 * O módulo remoto pode exportar funções/objetos. Exemplo de contrato:
 * export function applyRules(window, {moduleId, url}) { ... }
 * export default { ... }
 */
async function defaultOnUpdate(mod, meta) {
  console.log('[A3GS] onUpdate invoked for', meta, mod);

  // exemplo: se o módulo exportar 'applyRules', chamamos com o contexto global
  try {
    if (typeof mod.applyRules === 'function') {
      // Passamos window/unsafeWindow e meta para o módulo aplicar o que precisa no DOM.
      await mod.applyRules(unsafeWindow || window, meta);
    } else if (mod.default && typeof mod.default.apply === 'function') {
      // outra convenção possível
      await mod.default.apply(unsafeWindow || window, meta);
    } else {
      console.warn('[A3GS] Módulo não exporta applyRules nem default.apply — verifique o contrato do módulo.');
    }
  } catch (err) {
    console.error('[A3GS] Erro dentro do módulo ao aplicar regras:', err);
  }
}

/* ========== FLUXO PRINCIPAL ========== */

(async function main() {
  'use strict';

  const moduleId = 'main'; // chave para armazenar hash/override (pode criar múltiplos loaders se quiser)
  let remoteUrl = GM_getValue(REMOTE_MODULE_URL_KEY);
  const updateIntervalMinutes = () => GM_getValue(UPDATE_INTERVAL_KEY, 5);

  // Função que tenta carregar e aplicar (com tratamento silencioso)
  async function tryLoad() {
    try {
      await loadAndWatchModule(moduleId, remoteUrl, defaultOnUpdate);
    } catch (err) {
      console.error('[A3GS] tryLoad erro:', err);
    }
  }

  // Carregamento inicial
  await tryLoad();

  // Cron de checagem automática (intervalo configurável)
  // Observe: setInterval não persiste entre abas/reloads, mas roda enquanto a página estiver aberta.
  setInterval(async () => {
    const newRemote = GM_getValue(REMOTE_MODULE_URL_KEY);
    if (newRemote !== remoteUrl) {
      // se a URL remota mudou via menu, nós atualizamos a referência
      console.info('[A3GS] Remote URL atualizada via configuração:', newRemote);
      remoteUrl = newRemote;
    }
    await tryLoad();
  }, Math.max(1, updateIntervalMinutes()) * 60 * 1000); // minutos -> ms

  /* ========== MENU DE CONTROLE (Tampermonkey) ========== */

  // Forçar atualização agora
  GM_registerMenuCommand('A3GS: Forçar atualização', async () => {
    console.info('[A3GS] Forçando atualização manualmente...');
    // Apagar último hash para forçar recarregar
    GM_setValue(LAST_HASH_KEY_PREFIX + moduleId, null);
    await tryLoad();
  });

  // Editar URL remota (prompt)
  GM_registerMenuCommand('A3GS: Configurar URL remota', async () => {
    const cur = GM_getValue(REMOTE_MODULE_URL_KEY);
    const v = prompt('Informe a URL raw do módulo JS (GitHub/raw ou similar):', cur);
    if (v && v.trim()) {
      GM_setValue(REMOTE_MODULE_URL_KEY, v.trim());
      remoteUrl = v.trim();
      alert('URL salva. Forçando atualização agora...');
      GM_setValue(LAST_HASH_KEY_PREFIX + moduleId, null);
      await tryLoad();
    }
  });

  // Editar override local — cola o código que irá substituir a fonte remota
  GM_registerMenuCommand('A3GS: Editar override local (colar código)', async () => {
    const localKey = LOCAL_OVERRIDE_KEY_PREFIX + moduleId;
    const cur = GM_getValue(localKey, '');
    const v = prompt('Cole aqui o código JS que irá sobrescrever o módulo remoto.\nDeixe vazio para remover o override.', cur);
    if (v === null) return; // cancel
    if (v.trim().length === 0) {
      GM_setValue(localKey, '');
      alert('Override local removido.');
    } else {
      GM_setValue(localKey, v);
      alert('Override local salvo. Forçando atualização agora...');
      GM_setValue(LAST_HASH_KEY_PREFIX + moduleId, null);
      await tryLoad();
    }
  });

  // Limpar cache/ultimo hash
  GM_registerMenuCommand('A3GS: Limpar último hash/cache', () => {
    GM_setValue(LAST_HASH_KEY_PREFIX + moduleId, null);
    alert('Último hash limpo. Próximo check forçará reimport.');
  });

  // Ver informações de debug
  GM_registerMenuCommand('A3GS: Info (URL/interval/hash)', () => {
    const info = {
      remoteUrl: GM_getValue(REMOTE_MODULE_URL_KEY),
      updateIntervalMinutes: GM_getValue(UPDATE_INTERVAL_KEY),
      lastHash: GM_getValue(LAST_HASH_KEY_PREFIX + moduleId),
      hasLocalOverride: !!GM_getValue(LOCAL_OVERRIDE_KEY_PREFIX + moduleId, '')
    };
    alert('A3GS Info:\n' + JSON.stringify(info, null, 2));
  });

  // Ajustar intervalo (em minutos)
  GM_registerMenuCommand('A3GS: Definir intervalo de checagem (min)', async () => {
    const cur = GM_getValue(UPDATE_INTERVAL_KEY, 5);
    const v = prompt('Intervalo de checagem em minutos (inteiro):', String(cur));
    if (v === null) return;
    const n = parseInt(v, 10);
    if (isNaN(n) || n < 1) return alert('Valor inválido.');
    GM_setValue(UPDATE_INTERVAL_KEY, n);
    alert('Intervalo atualizado. Recarregue a página para aplicar imediatamente o novo timer.');
  });

  /* Fim do main */
})();

/* ========== INSTRUÇÕES DE CONTRATO (RECOMENDADO) ==========
Sugestão de como o módulo remoto deve ser estruturado (exemplo):
---------------------------------------------------------------
export async function applyRules(windowContext, meta) {
  // windowContext => unsafeWindow ou window
  // meta => { moduleId, source, url, hash }
  // A função aplica regras (inserir botões, alterar CSS, registrar listeners, etc).
}

export function helper() {
  // utilitários exportáveis
}

export default {
  applyRules,
  helper
};
---------------------------------------------------------------
Dessa forma o loader chama applyRules quando atualizar.
===========================================================
*/

/* NOTAS FINAIS:
 - Se preferir que o script faça reload completo da página ao detectar nova versão, substitua a chamada onUpdate por: location.reload()
 - Para múltiplos módulos, crie mais 'moduleId's e repita a chamada loadAndWatchModule para cada um.
 - Execução remota de código exige confiança na fonte. Use HTTPS e repositórios privados quando necessário.
*/
