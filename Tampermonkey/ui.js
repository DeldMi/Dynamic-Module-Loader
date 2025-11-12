// ui.js
// Cria interface gráfica com cards para cada link de vídeo encontrado.

async function createVideoCard(url) {
  const container = document.getElementById('dynamicLoader-container') || createContainer();
  const card = document.createElement('div');
  card.className = 'dynamic-card';

  const thumb = await getThumbnail(url);

  card.innerHTML = `
    <div class="card-header">
      <img src="${thumb}" alt="thumb" class="thumb"/>
      <span class="video-url">${url}</span>
      <button class="close-btn">×</button>
    </div>
    <div class="card-actions">
      <button class="btn-download" data-type="mp4">Baixar MP4</button>
      <button class="btn-download" data-type="mp3">Baixar MP3</button>
      <button class="btn-download" data-type="m3u8">Baixar M3U8</button>
    </div>
  `;

  card.querySelector('.close-btn').onclick = () => card.remove();
  card.querySelectorAll('.btn-download').forEach(btn => {
    btn.onclick = () => downloadFile(url, `midia.${btn.dataset.type}`);
  });

  container.appendChild(card);
}

function createContainer() {
  const div = document.createElement('div');
  div.id = 'dynamicLoader-container';
  div.style.position = 'fixed';
  div.style.top = '10px';
  div.style.right = '10px';
  div.style.zIndex = 99999;
  div.style.width = '350px';
  div.style.maxHeight = '90vh';
  div.style.overflowY = 'auto';
  div.style.background = '#fff';
  div.style.padding = '10px';
  div.style.border = '1px solid #ccc';
  div.style.borderRadius = '10px';
  document.body.appendChild(div);
  return div;
}