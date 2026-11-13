/* Sieg 業務ポータル — Service Worker
 *
 * 方針:
 *  - ページ本体（index.html）はネットワーク優先。連絡先やお知らせが古いまま
 *    表示されるのを防ぎ、オフライン時だけキャッシュにフォールバックする。
 *  - アイコン等の静的ファイルとGoogle Fontsはキャッシュ優先（裏で更新）。
 *  - 画像とフォントは版の付かないキャッシュに入れる（ポータルを更新しても捨てない。
 *    以前は更新のたびに消えて、キャラ画像やフォントを毎回読み直させていた）。
 *  - お知らせAPI（GAS）は一切キャッシュせず、常にネットワークへ通す。
 */

var VERSION = 'v69'; // アイコン差し替え・資料追加など、配布物を入れ替えたら上げる
var SHELL_CACHE = 'sieg-shell-' + VERSION;
var ASSET_CACHE = 'sieg-asset-' + VERSION;
// 画像・フォント：版を付けない＝更新しても残す。中身が変わったら裏で入れ替わり、消えたファイルはキャッシュからも消える
var IMG_CACHE = 'sieg-img';
var FONT_CACHE = 'sieg-font';
var CURRENT = [SHELL_CACHE, ASSET_CACHE, IMG_CACHE, FONT_CACHE];
var IMG_REFRESH_MS = 60 * 60 * 1000;   // 画像は1時間たったら裏で新しい版を確かめる

var SHELL = './index.html';
var PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './shift.html',
  './gain.html',
  './power.html',
  './team.html',
  './chat.html',
  './wrapped.html',
  './gas-client.js',
  './sieg-nav.js',
  './sieg-theme.css',
  './sieg-buddy.js',
  './sieg-roster.js',
  './sieg-products.js',
  './buddy/body.png',
  './buddy/hold.png',
  './buddy/leg-l.png',
  './buddy/leg-r.png',
  './buddy/tail.png',
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
// ブラウザ自身のキャッシュ（GitHub Pages は10分）を使わず、毎回サーバーに新しい版があるか確かめる。
// これをしないと、更新してから最大10分は古い画面が出る。
function networkFirst(req) {
  return fetch(new Request(req.url, { cache: 'no-cache', credentials: 'same-origin' }))
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

// キャッシュに入れてからの時間（読めないときは「古い」とみなす）
function ageOf(res) {
  var d = res && res.headers && res.headers.get('date');
  var t = d ? Date.parse(d) : NaN;
  return isNaN(t) ? Infinity : Date.now() - t;
}

// 静的ファイル：キャッシュ優先 → 裏でネットワーク更新
//   refreshAfter … キャッシュがこれより古いときだけ裏で取り直す（0＝毎回、Infinity＝取り直さない）
function cacheFirst(req, cacheName, refreshAfter) {
  return caches.open(cacheName).then(function(cache) {
    return cache.match(req).then(function(hit) {
      if (hit) {
        if (ageOf(hit) > (refreshAfter || 0)) {
          fetch(req).then(function(res) {
            if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
            else if (res && res.status === 404) cache.delete(req);   // サーバーから消えたファイル（差し替えで消した画像など）
          }).catch(function() {});
        }
        return hit;
      }
      // 画像は、事前キャッシュ（アイコン・ぼのぼの）にあればそれを使う（取りに行かない）。
      // JS・CSS は今まで通りネットワークから（版を上げ忘れても、新しい中身が届くように）
      return (cacheName === IMG_CACHE ? caches.match(req) : Promise.resolve(null)).then(function(pre) {
        if (pre) return pre;
        return fetch(req).then(function(res) {
          if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
          return res;
        }).catch(function() {
          // 事前キャッシュ側（docs.cssなど）にあれば、そちらから返す
          return caches.match(req, { ignoreSearch: true });
        });
      });
    });
  });
}
function isImage(url) { return /\.(png|webp|jpe?g|gif|svg|ico)$/i.test(url.pathname); }

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
    // フォントのファイル（fonts.gstatic.com）は中身が変わらないので取り直さない。指定のCSSだけ裏で確かめる
    e.respondWith(cacheFirst(req, FONT_CACHE, url.hostname === 'fonts.gstatic.com' ? Infinity : 0));
    return;
  }

  if (url.origin === self.location.origin) {
    if (isImage(url)) { e.respondWith(cacheFirst(req, IMG_CACHE, IMG_REFRESH_MS)); return; }
    e.respondWith(cacheFirst(req, ASSET_CACHE, 0));
  }
});
