/* Sieg 業務ポータル — Service Worker
 *
 * 方針:
 *  - ページ本体（index.html）はネットワーク優先。連絡先やお知らせが古いまま
 *    表示されるのを防ぎ、オフライン時だけキャッシュにフォールバックする。
 *  - アイコン等の静的ファイルとGoogle Fontsはキャッシュ優先（裏で更新）。
 *  - お知らせAPI（GAS）は一切キャッシュせず、常にネットワークへ通す。
 */

var VERSION = 'v4'; // アイコン差し替え・資料追加など、配布物を入れ替えたら上げる
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
  './icons/apple-touch-icon.png',
  // 資料置き場（現場では圏外のこともあるので必ず持たせる）
  './docs/',
  './docs/index.html',
  './docs/mnp-yoyaku.html',
  './docs/hikari-kaiyaku.html',
  './docs/docs.css'
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
// ポータルと資料ページで複数あるため、必ずリクエストごとに保存する
// （ここを固定キーにすると、資料を開いた後にトップがその資料に化ける）
function networkFirst(req) {
  return fetch(req)
    .then(function(res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(SHELL_CACHE).then(function(c) { c.put(req, copy); });
      }
      return res;
    })
    .catch(function() {
      return caches.match(req, { ignoreSearch: true }).then(function(hit) {
        if (hit) return hit;
        // そのページを持っていなければポータルのトップを返す
        return caches.match(SHELL, { ignoreSearch: true }).then(function(top) {
          return top || Response.error();
        });
      });
    });
}

// 静的ファイル：キャッシュ優先 → 裏でネットワーク更新
function cacheFirst(req, cacheName) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(req).then(function(hit) {
      if (hit) {
        fetch(req).then(function(res) {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        }).catch(function() {});
        return hit;
      }
      return fetch(req).then(function(res) {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(function() {
        // 事前キャッシュ側（docs.cssなど）にあれば、そちらから返す
        return caches.match(req, { ignoreSearch: true });
      });
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
