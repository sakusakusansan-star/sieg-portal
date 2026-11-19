/* ═══════════════════════════════════════════════════════════
   シフト → Discord に貼る文（社員のシフト入力・鈴木さんのパートナー用シフト入力）
     12/1-3 下通
     12/5-6 イワサキエース(上熊本)
     12/18 店舗稼働(八代中央)
   ・同じ開催場所が続く日は「12/12-15」にまとめる（休みをはさんだら別の行）
   ・取引先の無い日（希望休など）は入れない
   ・場所のあとの（ ）は担当店舗。場所ごとに「店舗名を付ける／カッコなし／店舗稼働」を選び、この端末に覚えておく
   ・店舗名がまだ無い場所は「(　)」（埋め忘れに気づけるように）
   ・場所の書き方は、まず場所の一覧（みんなの状況の「場所」：店舗稼働・カッコなし・担当店舗）で決まる。一覧に無い場所は下の決まり
   ・店舗稼働の場所は「店舗稼働(健軍)」。全員共通で決まる（端末で選び直した場所はそちらが先）
       - 頭に SB・ソフトバンク・ドコモ などが付いた場所（「sb 玉名」「ソフトバンク松橋」→ 店舗稼働(玉名)・店舗稼働(松橋)）
       - 店舗の地名の一覧（SHOPS）に当てはまる場所（「健軍」→ 店舗稼働(健軍)）。ほかの言葉が付いた場所（DCM東バイパス）は当てはめない
   使い方：SiegShiftPost.open({ name: '福山', year: 2026, month: 12, days: { 1: { client, place }, … } })
             SiegShiftPost.text(…) は文だけ返す（テスト用）
   ═══════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  var KEY = 'siegShiftPostStores';          // { 開催場所: { m: 'store'|'none'|'shop', s: 店舗名 } }（前の形 { s, n } も読む）
  var NO_PAREN = ['下通', 'ゆめタウン大牟田'];  // 古川さんの投稿でカッコを付けていない場所（覚えていなければこれを初めの値に）
  // 店舗稼働の場所（稼働費の「稼働場所」シートにある店舗：SB健軍・SB松橋…・ドコモ近見）。増えたらここに足す
  var SHOPS = ['健軍', '松橋', '光の森', '大津', '麻生田', '八代', '八代中央', '玉名', '玉名中央', '熊本西', '東バイパス', '菊池', '上熊本', '上熊', '近見'];
  var SHOP_PREFIX = /^(?:ＳＢ|SB|ソフトバンク|ドコモ|docomo|ａｕ|au)[\s　・]*/i;
  var MODES = [['store', '店舗名を付ける'], ['none', 'カッコなし'], ['shop', '店舗稼働']];
  var STORE_WORK = '店舗稼働';

  function load() { try { return JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { return {}; } }
  function save(m) { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch (e) {} }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function norm(v) { return String(v == null ? '' : v).replace(/[\s　]+/g, ' ').trim(); }

  // 開催場所 → 表の名前と、初めの店舗名。「店舗稼働 八代中央」→ 店舗稼働 ／ 八代中央（「場所未定」などは店舗名にしない）
  function split(place) {
    var p = norm(place);
    if (p.indexOf(STORE_WORK) === 0) {
      var rest = norm(p.slice(STORE_WORK.length).replace(/^[（(]|[）)]$/g, ''));
      return { label: STORE_WORK, store: /未定|未確定/.test(rest) ? '' : rest };
    }
    // 場所の一覧（みんなの状況の「場所」）にあれば、そこで決めた書き方（店舗稼働・カッコなし・担当店舗）
    var mp = global.SiegRoster && global.SiegRoster.findPlace ? global.SiegRoster.findPlace(p) : null;
    if (mp) return { label: mp.name, store: mp.store || '', shop: !!mp.shop, noParen: !!mp.noParen, master: true };
    // 頭に会社名の付いた店舗（sb 玉名・ソフトバンク松橋）→ 地名だけにして、店舗稼働
    var area = p, hit = false;
    while (SHOP_PREFIX.test(area)) { var a2 = norm(area.replace(SHOP_PREFIX, '')); if (!a2 || a2 === area) break; area = a2; hit = true; }
    if (hit) return { label: area, store: '', shop: true };
    return { label: p, store: '', shop: SHOPS.indexOf(p) >= 0 };
  }
  // 場所ごとの設定（覚えている値 → なければ初めの値）
  function setting(place, mem) {
    var m = mem[place], sp = split(place);
    if (m) return { s: m.s || '', m: m.m || (m.n ? 'none' : 'store') };
    if (sp.label === STORE_WORK) return { s: sp.store, m: 'store' };
    if (sp.master) return { s: sp.store, m: sp.shop ? 'shop' : sp.noParen ? 'none' : 'store' };
    return { s: sp.store, m: sp.shop ? 'shop' : !sp.store && NO_PAREN.indexOf(sp.label) >= 0 ? 'none' : 'store' };
  }
  function shown(place, mem) {
    var sp = split(place), st = setting(place, mem);
    if (st.m === 'shop') return STORE_WORK + '(' + sp.label + ')';
    if (st.m === 'none') return sp.label;
    return sp.label + '(' + (st.s || '　') + ')';
  }

  // 日ごとのシフト → 続いた同じ場所のまとまり [{ from, to, place }]
  function runs(days) {
    var list = Object.keys(days || {}).map(Number).filter(function (d) {
      var e = days[d] || {};
      return d >= 1 && d <= 31 && norm(e.client) && norm(e.place || e.client);
    }).sort(function (a, b) { return a - b; });
    var out = [];
    list.forEach(function (d) {
      var place = norm(days[d].place || days[d].client), last = out[out.length - 1];
      if (last && last.place === place && last.to === d - 1) last.to = d;
      else out.push({ from: d, to: d, place: place });
    });
    return out;
  }
  function text(o, mem) {
    mem = mem || load();
    var out = [];
    runs(o.days).forEach(function (r) {   // 書き方が同じになる続いた日（「sb 玉名」と「玉名」など）もまとめる
      var t = shown(r.place, mem), last = out[out.length - 1];
      if (last && last.t === t && last.to === r.from - 1) last.to = r.to;
      else out.push({ from: r.from, to: r.to, t: t });
    });
    return out.map(function (r) { return o.month + '/' + r.from + (r.to > r.from ? '-' + r.to : '') + ' ' + r.t; }).join('\n');
  }

  var CSS =
    '.ssp-bg{position:fixed;inset:0;z-index:200;background:var(--sg-scrim,rgba(14,26,44,.45));display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .18s}' +
    '.ssp-bg.on{opacity:1}' +
    '.ssp{width:100%;max-width:560px;max-height:92vh;overflow:auto;box-sizing:border-box;padding:18px 16px calc(16px + env(safe-area-inset-bottom));' +
    'background:var(--sg-surface,#fff);color:var(--sg-ink,#0E1A2C);border-radius:20px 20px 0 0;font:500 14px/1.6 var(--sg-font,-apple-system,BlinkMacSystemFont,"Hiragino Sans","Noto Sans JP",sans-serif)}' +
    '@media (min-width:700px){.ssp-bg{align-items:center}.ssp{border-radius:20px}}' +
    '.ssp h2{margin:0 0 2px;font-size:17px;font-weight:900}.ssp .ssp-sub{margin:0 0 12px;color:var(--sg-mute,#5B6675);font-size:12.5px}' +
    '.ssp h3{margin:14px 0 6px;font-size:13px;font-weight:800;color:var(--sg-mute,#5B6675)}' +
    '.ssp-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 8px;align-items:center;padding:8px 0;border-top:1px solid var(--sg-hair,#E3E6EA)}' +
    '.ssp-row input[type=text]{grid-column:1 / -1}.ssp-row input[type=text][hidden]{display:none}' +
    '.ssp-row select{min-height:40px;padding:0 8px;border:1px solid var(--sg-hair,#E3E6EA);border-radius:10px;background:var(--sg-surface,#fff);color:inherit;font:700 14px/1 var(--sg-font,inherit)}' +
    '.ssp-row:first-of-type{border-top:0}.ssp-row b{font-weight:800;overflow-wrap:anywhere}' +
    '.ssp-row input[type=text]{width:100%;box-sizing:border-box;min-height:40px;padding:0 10px;border:1px solid var(--sg-hair,#E3E6EA);border-radius:10px;background:var(--sg-sunk,#F4F6F8);color:inherit;font:inherit;font-size:16px}' +

    '.ssp textarea{width:100%;box-sizing:border-box;min-height:180px;padding:10px 12px;border:1px solid var(--sg-hair,#E3E6EA);border-radius:12px;background:var(--sg-sunk,#F4F6F8);color:inherit;' +
    'font:600 15px/1.7 var(--sg-font,inherit);resize:vertical}' +
    '.ssp-btns{display:flex;gap:8px;margin-top:12px}.ssp-btns button{flex:1;min-height:48px;border:0;border-radius:12px;font:800 15px/1 var(--sg-font,inherit);cursor:pointer;background:var(--sg-sunk,#F4F6F8);color:var(--sg-ink,#0E1A2C)}' +
    '.ssp-btns .pri{background:var(--sg-primary,#0E1A2C);color:var(--sg-on-primary,#fff)}' +
    '.ssp-msg{min-height:20px;margin-top:8px;text-align:center;font-size:13px;font-weight:700;color:var(--sg-green,#1B6541)}' +
    '.ssp-empty{padding:14px 0;color:var(--sg-mute,#5B6675)}' +
    '@media (prefers-reduced-motion:reduce){.ssp-bg{transition:none}}';
  var cssReady = false;

  function copyText(t) {
    if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t);
    return new Promise(function (ok, ng) {
      var ta = document.createElement('textarea');
      ta.value = t; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var done = false; try { done = document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
      done ? ok() : ng(new Error('copy'));
    });
  }

  function open(o) {
    if (!cssReady) { var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st); cssReady = true; }
    var mem = load(), rs = runs(o.days), last = document.activeElement;
    var places = [];
    rs.forEach(function (r) { if (places.indexOf(r.place) < 0) places.push(r.place); });
    var bg = document.createElement('div'), box = document.createElement('div');
    bg.className = 'ssp-bg'; box.className = 'ssp';
    box.setAttribute('role', 'dialog'); box.setAttribute('aria-modal', 'true'); box.setAttribute('aria-labelledby', 'ssp-title');
    box.innerHTML = '<h2 id="ssp-title">Discord用の文（' + esc(o.month) + '月・' + esc(o.name) + '）</h2>'
      + '<p class="ssp-sub">登録済みのシフトから作りました。場所ごとの書き方（店舗名・カッコなし・店舗稼働）は、この端末に覚えておきます。</p>'
      + (rs.length ? '<h3>場所ごとの書き方</h3><div id="ssp-places">' + places.map(function (p, i) {
          var s = setting(p, mem);
          return '<div class="ssp-row" data-i="' + i + '"><b>' + esc(p) + '</b>'
            + '<select aria-label="' + esc(p) + 'の書き方">' + MODES.map(function (md) { return '<option value="' + md[0] + '"' + (md[0] === s.m ? ' selected' : '') + '>' + md[1] + '</option>'; }).join('') + '</select>'
            + '<input type="text" maxlength="20" placeholder="店舗名（例：八代中央）" aria-label="' + esc(p) + 'の店舗名" value="' + esc(s.s) + '"' + (s.m === 'store' ? '' : ' hidden') + '></div>';
        }).join('') + '</div>'
        + '<h3>文（直してからコピーもできます）</h3><textarea id="ssp-text" aria-label="Discord用の文" spellcheck="false"></textarea>'
        : '<div class="ssp-empty">この月は、まだ取引先の入ったシフトがありません。</div>')
      + '<div class="ssp-btns"><button type="button" data-x>閉じる</button>' + (rs.length ? '<button type="button" class="pri" data-copy>コピー</button>' : '') + '</div>'
      + '<div class="ssp-msg" role="status" id="ssp-msg"></div>';
    bg.appendChild(box);
    var ta = box.querySelector('#ssp-text'), edited = false;
    function redraw() { if (ta && !edited) ta.value = text(o, mem); }
    function read(row) {
      var p = places[Number(row.getAttribute('data-i'))], inp = row.querySelector('input[type=text]'), sel = row.querySelector('select');
      inp.hidden = sel.value !== 'store';
      mem[p] = { m: sel.value, s: norm(inp.value).replace(/^[（(]|[）)]$/g, '') };
      save(mem);
      edited = false;   // 店舗名を変えたら、文は作り直す
      redraw();
    }
    Array.prototype.forEach.call(box.querySelectorAll('.ssp-row'), function (row) {
      row.querySelector('input[type=text]').addEventListener('input', function () { read(row); });
      row.querySelector('select').addEventListener('change', function () { read(row); });
    });
    if (ta) ta.addEventListener('input', function () { edited = true; });
    redraw();
    function close() {
      document.removeEventListener('keydown', onKey, true);
      bg.classList.remove('on');
      setTimeout(function () { if (bg.parentNode) bg.parentNode.removeChild(bg); }, 180);
      try { if (last && last.focus) last.focus(); } catch (e) {}
    }
    function onKey(e) { if (e.key === 'Escape') { e.stopPropagation(); close(); } }
    bg.addEventListener('click', function (e) { if (e.target === bg) close(); });
    box.querySelector('[data-x]').onclick = close;
    var cp = box.querySelector('[data-copy]');
    if (cp) cp.onclick = function () {
      var msg = box.querySelector('#ssp-msg');
      copyText(ta.value).then(function () { msg.textContent = '✅ コピーしました。Discord に貼ってください'; },
        function () { ta.focus(); ta.select(); msg.textContent = 'コピーできませんでした。文を長押ししてコピーしてください'; });
    };
    document.addEventListener('keydown', onKey, true);
    document.body.appendChild(bg);
    void bg.offsetWidth; bg.classList.add('on');
    try { (cp || box.querySelector('[data-x]')).focus({ preventScroll: true }); } catch (e) {}
  }

  global.SiegShiftPost = { open: open, text: text, runs: runs };
})(this);
