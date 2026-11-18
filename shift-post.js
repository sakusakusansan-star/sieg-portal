/* ═══════════════════════════════════════════════════════════
   シフト → Discord に貼る文（社員のシフト入力・鈴木さんのパートナー用シフト入力）
     12/1-3 下通
     12/5-6 イワサキエース(上熊本)
     12/18 店舗稼働(八代中央)
   ・同じ開催場所が続く日は「12/12-15」にまとめる（休みをはさんだら別の行）
   ・取引先の無い日（希望休など）は入れない
   ・場所のあとの（ ）は担当店舗。場所ごとに入れた店舗名・「カッコなし」はこの端末に覚えておく
   ・店舗名がまだ無い場所は「(　)」（埋め忘れに気づけるように）
   使い方：SiegShiftPost.open({ name: '福山', year: 2026, month: 12, days: { 1: { client, place }, … } })
             SiegShiftPost.text(…) は文だけ返す（テスト用）
   ═══════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';
  var KEY = 'siegShiftPostStores';          // { 開催場所: { s: 店舗名, n: true=カッコなし } }
  var NO_PAREN = ['下通', 'ゆめタウン大牟田'];  // 古川さんの投稿でカッコを付けていない場所（覚えていなければこれを初めの値に）
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
    return { label: p, store: '' };
  }
  // 場所ごとの設定（覚えている値 → なければ初めの値）
  function setting(place, mem) {
    var m = mem[place], sp = split(place);
    if (m) return { s: m.s || '', n: !!m.n };
    return { s: sp.store, n: !sp.store && NO_PAREN.indexOf(sp.label) >= 0 };
  }
  function shown(place, mem) {
    var sp = split(place), st = setting(place, mem);
    if (st.n) return sp.label;
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
    return runs(o.days).map(function (r) {
      return o.month + '/' + r.from + (r.to > r.from ? '-' + r.to : '') + ' ' + shown(r.place, mem);
    }).join('\n');
  }

  var CSS =
    '.ssp-bg{position:fixed;inset:0;z-index:200;background:var(--sg-scrim,rgba(14,26,44,.45));display:flex;align-items:flex-end;justify-content:center;opacity:0;transition:opacity .18s}' +
    '.ssp-bg.on{opacity:1}' +
    '.ssp{width:100%;max-width:560px;max-height:92vh;overflow:auto;box-sizing:border-box;padding:18px 16px calc(16px + env(safe-area-inset-bottom));' +
    'background:var(--sg-surface,#fff);color:var(--sg-ink,#0E1A2C);border-radius:20px 20px 0 0;font:500 14px/1.6 var(--sg-font,-apple-system,BlinkMacSystemFont,"Hiragino Sans","Noto Sans JP",sans-serif)}' +
    '@media (min-width:700px){.ssp-bg{align-items:center}.ssp{border-radius:20px}}' +
    '.ssp h2{margin:0 0 2px;font-size:17px;font-weight:900}.ssp .ssp-sub{margin:0 0 12px;color:var(--sg-mute,#5B6675);font-size:12.5px}' +
    '.ssp h3{margin:14px 0 6px;font-size:13px;font-weight:800;color:var(--sg-mute,#5B6675)}' +
    '.ssp-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr) auto;gap:8px;align-items:center;padding:6px 0;border-top:1px solid var(--sg-hair,#E3E6EA)}' +
    '.ssp-row:first-of-type{border-top:0}.ssp-row b{font-weight:800;overflow-wrap:anywhere}' +
    '.ssp-row input[type=text]{width:100%;box-sizing:border-box;min-height:40px;padding:0 10px;border:1px solid var(--sg-hair,#E3E6EA);border-radius:10px;background:var(--sg-sunk,#F4F6F8);color:inherit;font:inherit;font-size:16px}' +
    '.ssp-row input[type=text]:disabled{opacity:.45}' +
    '.ssp-row label{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;color:var(--sg-mute,#5B6675);white-space:nowrap}' +
    '.ssp-row input[type=checkbox]{width:18px;height:18px;accent-color:var(--sg-primary,#0E1A2C)}' +
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
      + '<p class="ssp-sub">登録済みのシフトから作りました。場所のあとの（ ）に入れる店舗名は、この端末に覚えておきます。</p>'
      + (rs.length ? '<h3>店舗名</h3><div id="ssp-places">' + places.map(function (p, i) {
          var s = setting(p, mem);
          return '<div class="ssp-row" data-i="' + i + '"><b>' + esc(split(p).label === p ? p : p) + '</b>'
            + '<input type="text" maxlength="20" placeholder="例：八代中央" aria-label="' + esc(p) + 'の店舗名" value="' + esc(s.s) + '"' + (s.n ? ' disabled' : '') + '>'
            + '<label><input type="checkbox"' + (s.n ? ' checked' : '') + '>カッコなし</label></div>';
        }).join('') + '</div>'
        + '<h3>文（直してからコピーもできます）</h3><textarea id="ssp-text" aria-label="Discord用の文" spellcheck="false"></textarea>'
        : '<div class="ssp-empty">この月は、まだ取引先の入ったシフトがありません。</div>')
      + '<div class="ssp-btns"><button type="button" data-x>閉じる</button>' + (rs.length ? '<button type="button" class="pri" data-copy>コピー</button>' : '') + '</div>'
      + '<div class="ssp-msg" role="status" id="ssp-msg"></div>';
    bg.appendChild(box);
    var ta = box.querySelector('#ssp-text'), edited = false;
    function redraw() { if (ta && !edited) ta.value = text(o, mem); }
    function read(row) {
      var p = places[Number(row.getAttribute('data-i'))], inp = row.querySelector('input[type=text]'), cb = row.querySelector('input[type=checkbox]');
      inp.disabled = cb.checked;
      mem[p] = { s: norm(inp.value).replace(/^[（(]|[）)]$/g, ''), n: cb.checked };
      save(mem);
      edited = false;   // 店舗名を変えたら、文は作り直す
      redraw();
    }
    Array.prototype.forEach.call(box.querySelectorAll('.ssp-row'), function (row) {
      row.querySelector('input[type=text]').addEventListener('input', function () { read(row); });
      row.querySelector('input[type=checkbox]').addEventListener('change', function () { read(row); });
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
