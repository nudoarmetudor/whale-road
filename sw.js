// Whale Road service worker: precaches the game so it plays offline, then serves
// cache-first with a background refresh. Bump VERSION whenever files change.
const VERSION = 'wr-v1';
// Every file the game loads (regenerate when modules are added; missing ones are skipped).
const FILES = [
  './', './index.html', './manifest.webmanifest', './icon.svg', './css/main.css', './js/art/mapart.js',
  './js/art/paint.js', './js/art/portraits.js', './js/art/scenes.js', './js/art/ships.js',
  './js/audio/instruments.js', './js/audio/music.js', './js/audio/sfx.js', './js/combat/battle.js',
  './js/combat/defaults.js', './js/combat/enemies.js', './js/combat/engine.js', './js/combat/render.js',
  './js/data/blessings.js', './js/data/coast.js', './js/data/goods.js', './js/data/heroes.js',
  './js/data/items.js', './js/data/lore.js', './js/data/ports.js', './js/data/quests/items.js',
  './js/data/quests/lines.js', './js/data/quests/saga_bjarki.js', './js/data/quests/saga_grima.js',
  './js/data/quests/saga_hrafn.js', './js/data/quests/saga_ketill.js', './js/data/quests/saga_saeunn.js',
  './js/data/quests/saga_ylva.js', './js/data/quests/sagas.js', './js/data/quests/side.js',
  './js/data/ranks.js', './js/data/recipes.js', './js/data/routes.js', './js/data/ships.js', './js/main.js',
  './js/sim/altar.js', './js/sim/bank.js', './js/sim/charms.js', './js/sim/clock.js', './js/sim/economy.js',
  './js/sim/ext.js', './js/sim/feats.js', './js/sim/fleet.js', './js/sim/geo.js', './js/sim/guild.js',
  './js/sim/index.js', './js/sim/quests.js', './js/sim/rank.js', './js/sim/time.js', './js/sim/voyage.js',
  './js/state.js', './js/ui/adapters.js', './js/ui/buildings.js', './js/ui/ctx.js', './js/ui/dialogue.js',
  './js/ui/dom.js', './js/ui/icons.js', './js/ui/info.js', './js/ui/map.js', './js/ui/market.js',
  './js/ui/options.js', './js/ui/port.js', './js/ui/sheets.js', './js/ui/shipyard.js', './js/ui/stubs.js',
  './js/ui/title.js',
];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    // One by one, so a file another module has not written yet does not break install.
    await Promise.all(FILES.map(f => cache.add(new Request(f, {cache: 'reload'})).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const fonts = /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!sameOrigin && !fonts) return;
  e.respondWith((async () => {
    const cache = await caches.open(VERSION);
    const hit = await cache.match(req, {ignoreSearch: sameOrigin});
    const fresh = fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    if (hit) { e.waitUntil(fresh); return hit; }
    const res = await fresh;
    if (res) return res;
    if (req.mode === 'navigate') return (await cache.match('./index.html')) || Response.error();
    return Response.error();
  })());
});
