// ui.js
// ============================
// Interface visual (UI) do sistema A3GS
// ============================

import { log, injectCSS } from './utils.js';

/**
 * Cria um botão flutuante fixo no canto da tela.
 */
export function createFloatingButton(label = '⚙️', onClick = null) {
  injectCSS(`
    #a3gs-float-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, #0078ff, #004f9f);
      color: #fff;
      border-radius: 50%;
      font-size: 22px;
      width: 55px;
      height: 55px;
      text-align: center;
      line-height: 55px;
      cursor: pointer;
      z-index: 99999;
      box-shadow: 0 4px 10px rgba(0,0,0,0.25);
      transition: all 0.3s ease-in-out;
    }
    #a3gs-float-btn:hover {
      transform: scale(1.1);
      background: linear-gradient(135deg, #005fcf, #003c8f);
    }
  `);

  const btn = document.createElement('div');
  btn.id = 'a3gs-float-btn';
  btn.textContent = label;
  btn.title = 'Abrir painel A3GS';
  btn.onclick = onClick || (() => alert('Painel A3GS ativado.'));
  document.body.appendChild(btn);

  log('Botão flutuante criado com sucesso.');
}

export default { createFloatingButton };
