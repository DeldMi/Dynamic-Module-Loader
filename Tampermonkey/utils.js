// utils.js
// Funções utilitárias para logging, download e manipulação de mídia.

function log(msg) {
  console.log(`[DynamicLoader] ${msg}`);
}

// Faz download de um arquivo a partir de uma URL
function downloadFile(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Gera thumbnail de vídeo (ou retorna imagem padrão)
function getThumbnail(url) {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = url;
    video.crossOrigin = 'anonymous';
    video.addEventListener('loadeddata', () => {
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 90;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 160, 90);
      resolve(canvas.toDataURL('image/png'));
    });
    video.addEventListener('error', () => {
      resolve('https://via.placeholder.com/160x90.png?text=Sem+Thumbnail');
    });
  });
}