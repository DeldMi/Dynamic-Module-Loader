// rules.js
// Varre a página, localiza links de vídeos e gera os cards correspondentes.

async function applyRules() {
  log('Analisando página em busca de vídeos...');

  const links = Array.from(document.querySelectorAll('a[href]'))
    .map(a => a.href)
    .filter(h => /\.(mp4|m3u8|mov|avi|webm|mp3)$/i.test(h));

  log(`Encontrados ${links.length} links de mídia.`);

  for (const link of links) {
    await createVideoCard(link);
  }
}