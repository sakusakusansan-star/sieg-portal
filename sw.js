/* Sieg 業務ポータル — Service Worker
 *
 * 方針:
 *  - ページ本体（index.html）はネットワーク優先。連絡先やお知らせが古いまま
 *    表示されるのを防ぎ、オフライン時だけキャッシュにフォールバックする。
 *  - アイコン等の静的ファイルとGoogle Fontsはキャッシュ優先（裏で更新）。
 *  - お知らせAPI（GAS）は一切キャッシュせず、常にネットワークへ通す。
 */

var VERSION = 'v2'; // アイコン差し替え時など、配布物を入れ替えたら上げる
var SHELL_CACHE = 'sieg-shell-' + VERSION;
var ASSET_CACHE = 'sieg-asset-' + VERSION;
var FONT_CACHE = 'sieg-font-' + VERSION;
var CURRENT = [SHELL_CACHE, ASSET_CACHE, FONT_CACHE];

var SHELL = './index.html';
var PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then(function(c) { return c.addAll(PRECACHE); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys()
      .then(function(keys) {
        return Promise.all(keys.map(function(k) {
          if (CURRENT.indexOf(k) === -1) return caches.delete(k);
        }));
      })
      .then(function() { return self.clients.claim(); })
  );
});

function isFontHost(url) {
  return url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
}

// ページ本体：ネットワーク優先 → 失敗したらキャッシュ
function networkFirst(req) {
  return fetch(req)
    .then(function(res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(SHELL_CACHE).then(function(c) { c.put(SHELL, copy); });
      }
      return res;
    })
    .catch(function() {
      return caches.match(SHELL, { ignoreSearch: true }).then(function(hit) {
        return hit || Response.error();
      });
    });
}

// 静的ファイル：キャッシュ優先 → 裏でネットワーク更新
function cacheFirst(req, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(req).then(function(hit) {
      var net = fetch(req).then(function(res) {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(function() { return hit; });
      return hit || net;
    });
  });
}

self.addEventListener('fetch', function(e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url;
  try { url = new URL(req.url); } catch (err) { return; }

  // お知らせAPI（GAS）などの外部APIは触らない
  if (url.hostname === 'script.google.com') return;

  if (req.mode === 'navigate') {
    e.respondWith(networkFirst(req));
    return;
  }

  if (isFontHost(url)) {
    e.respondWith(cacheFirst(req, FONT_CACHE));
    return;
  }

  if (url.origin === self.location.origin) {
    e.respondWith(cacheFirst(req, ASSET_CACHE));
  }
});
