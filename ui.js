// ui.js
import { log, injectCSS } from './utils.js';

// Cria um botão fixo na tela
export function createFloatingButton(label = '⚙️', onClick = null) {
  injectCSS(`
    #a3gs-float-btn {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #0078ff;
      color: #fff;
      border-radius: 50%;
      font-size: 22px;
      width: 50px;
      height: 50px;
      text-align: center;
      line-height: 50px;
      cursor: pointer;
      z-index: 99999;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
    }
    #a3gs-float-btn:hover { background: #0059b2; }
  `);

  const btn = document.createElement('div');
  btn.id = 'a3gs-float-btn';
  btn.textContent = label;
  btn.title = 'Abrir painel A3GS';
  btn.onclick = onClick || (() => alert('Painel A3GS aberto!'));
  document.body.appendChild(btn);

  log('Botão flutuante criado.');
}

// Exportação padrão
export default { createFloatingButton };
