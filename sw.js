/* Caixa — service worker
 * Guarda a interface para o app abrir sem internet.
 * Os dados ficam em localStorage; nada de rede é cacheado aqui.
 *
 * AO ATUALIZAR O APP: mude o número da VERSAO abaixo. É isso que faz
 * o celular baixar a versão nova em vez de servir a antiga do cache.
 */
const VERSAO = 'caixa-v12';
const CASCA = ['./', './index.html', './manifest.json', './icone-192.png', './icone-512.png'];

self.addEventListener('install', ev => {
  ev.waitUntil(
    caches.open(VERSAO)
      .then(c => c.addAll(CASCA))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', ev => {
  ev.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n !== VERSAO).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', ev => {
  const req = ev.request;
  if (req.method !== 'GET') return;                      // gravações nunca passam pelo cache
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;       // chamadas ao Apps Script vão direto à rede

  // rede primeiro, cache como rede de segurança
  ev.respondWith(
    fetch(req)
      .then(resp => {
        const copia = resp.clone();
        caches.open(VERSAO).then(c => c.put(req, copia)).catch(() => {});
        return resp;
      })
      .catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
  );
});
