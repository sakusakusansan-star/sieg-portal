/* Sieg 資料置き場 — 共通の動き
   ・最終更新から日がたった資料に「確認が必要かも」を出す（.updated の「最終更新 yyyy-mm-dd」を読む）
   ・料金改定のカード：改定日までの残り日数、1つだけ開く、読み上げに開閉を伝える
   ・予約番号の早見表：いま受付時間内か（.c-hours の「9:00〜20:00」を読む）
   ・資料一覧：各資料の最終更新と、近い料金改定（資料のページを読んで出す。ページが正本） */
(function (global) {
  'use strict';
  var STALE_DAYS = 60;   // これより古い資料は「確認が必要かも」

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  // 日本時間のきょう（yyyy-mm-dd）と、いまの分（0:00 からの分）
  function jstNow(now) {
    var d = new Date((now || new Date()).getTime() + 9 * 3600 * 1000);
    return { ymd: d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()), min: d.getUTCHours() * 60 + d.getUTCMinutes() };
  }
  function dayNum(ymd) { var p = String(ymd).split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000; }
  function daysBetween(a, b) { return Math.round(dayNum(b) - dayNum(a)); }
  function md(ymd) { var p = ymd.split('-'); return (+p[1]) + '/' + (+p[2]); }
  function updatedOf(text) { var m = String(text || '').match(/(\d{4})-(\d{2})-(\d{2})/); return m ? m[0] : ''; }

  // 最終更新 → { ymd, days, stale }
  function freshness(updated, today) {
    if (!updated) return null;
    var days = daysBetween(updated, today);
    return { ymd: updated, days: days, stale: days > STALE_DAYS };
  }

  // 「9:00〜20:00」→ { from, to }（分）。時刻でない書き方は null
  function parseHours(text) {
    var m = String(text || '').replace(/[０-９：]/g, function (c) { return c === '：' ? ':' : String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
      .match(/(\d{1,2}):(\d{2})\s*[〜~\-–ー]\s*(\d{1,2}):(\d{2})/);
    if (!m) return null;
    return { from: +m[1] * 60 + +m[2], to: +m[3] * 60 + +m[4], fromText: +m[1] + ':' + m[2], toText: +m[3] + ':' + m[4] };
  }
  // いまの分 → { open, label }
  function openState(h, min) {
    if (!h) return null;
    if (min >= h.from && min < h.to) {
      var left = h.to - min;
      return { open: true, soon: left <= 30, label: left <= 30 ? 'あと' + left + '分で受付終了' : '受付中（' + h.toText + 'まで）' };
    }
    return { open: false, label: min < h.from ? '受付前（' + h.fromText + 'から）' : '受付終了（あす ' + h.fromText + 'から）' };
  }

  // 改定日 → { left, label, state: 'soon'|'later'|'past' }
  function countdown(date, today) {
    var left = daysBetween(today, date);
    if (left > 0) return { left: left, state: left <= 31 ? 'soon' : 'later', label: 'あと' + left + '日' };
    if (left === 0) return { left: 0, state: 'soon', label: 'きょうから' };
    return { left: left, state: 'past', label: '実施済み' };
  }

  // キャンペーンの受付 → { state: 'before'|'on'|'soon'|'off', label }（終了日がなければ「受付中」のまま）
  function campaign(start, end, today) {
    if (start && daysBetween(today, start) > 0) return { state: 'before', label: md(start) + 'から（あと' + daysBetween(today, start) + '日）' };
    if (end) {
      var left = daysBetween(today, end);
      if (left < 0) return { state: 'off', label: '受付終了' };
      if (left <= 14) return { state: 'soon', label: left === 0 ? 'きょうで受付終了' : 'あと' + left + '日で受付終了', left: left };
      return { state: 'on', label: '受付中（' + md(end) + 'まで）' };
    }
    return { state: 'on', label: '受付中' + (start ? '（' + md(start) + '〜）' : '') };
  }

  // ─── ページの中で使う ───
  function paintUpdated(doc, today) {
    var el = doc.querySelector('.updated');
    if (!el) return;
    var f = freshness(updatedOf(el.textContent), today);
    if (!f || !f.stale) return;
    var w = doc.createElement('div');
    w.className = 'stale-note';
    w.setAttribute('role', 'note');
    w.textContent = '最終更新から' + f.days + '日たっています。金額や受付時間が変わっていないか、公式サイトで確かめてから案内してください。';
    el.parentNode.insertBefore(w, el.nextSibling);
  }

  function initNews(doc, today) {
    var cards = Array.prototype.slice.call(doc.querySelectorAll('.news-card'));
    if (!cards.length) return;
    cards.forEach(function (card, i) {
      var btn = card.querySelector('.news-summary'), detail = card.querySelector('.news-detail');
      if (!btn || !detail) return;
      detail.id = detail.id || 'news-detail-' + (i + 1);
      btn.setAttribute('aria-controls', detail.id);
      btn.setAttribute('aria-expanded', 'false');
      var date = card.getAttribute('data-date');
      if (date) {
        var c = countdown(date, today), badge = doc.createElement('span');
        badge.className = 'news-left ' + c.state;
        badge.textContent = c.label;
        var d = btn.querySelector('.news-date');
        if (d) d.parentNode.insertBefore(badge, d.nextSibling);
        if (c.state === 'past') card.classList.add('past');
      }
      btn.addEventListener('click', function () {
        var open = !card.classList.contains('open');
        cards.forEach(function (o) {   // 開くのは1つだけ
          if (o !== card && o.classList.contains('open')) { o.classList.remove('open'); var b = o.querySelector('.news-summary'); if (b) b.setAttribute('aria-expanded', 'false'); }
        });
        card.classList.toggle('open', open);
        btn.setAttribute('aria-expanded', String(open));
        if (open && card.getBoundingClientRect().top < 0) card.scrollIntoView({ block: 'start' });
      });
    });
    // 実施済みのカードは下へ
    var list = cards[0].parentNode, foot = list.querySelector('.foot');
    cards.filter(function (c) { return c.classList.contains('past'); }).forEach(function (c) { list.insertBefore(c, foot); });
  }

  function initCampaigns(doc, today) {
    var list = Array.prototype.slice.call(doc.querySelectorAll('.camp[data-start]'));
    if (!list.length) return;
    var after = list[list.length - 1];   // 終わったものは、キャンペーンの並びの最後へ
    list.forEach(function (c) {
      var st = campaign(c.getAttribute('data-start'), c.getAttribute('data-end'), today), b = doc.createElement('span');
      b.className = 'camp-state ' + st.state; b.textContent = st.label;
      (c.querySelector('.camp-top') || c).appendChild(b);
      if (st.state === 'off') c.classList.add('ended');
    });
    list.filter(function (c) { return c.classList.contains('ended'); }).forEach(function (c) {
      if (c !== after) { after.parentNode.insertBefore(c, after.nextSibling); after = c; }
    });
  }

  function paintHours(doc, now) {
    var heads = doc.querySelectorAll('.carrier .c-head');
    if (!heads.length) return;
    var min = jstNow(now).min;
    Array.prototype.forEach.call(heads, function (head) {
      var st = openState(parseHours((head.querySelector('.c-hours') || {}).textContent), min);
      var el = head.parentNode.querySelector('.c-open');
      if (!st) { if (el) el.remove(); return; }
      if (!el) { el = doc.createElement('div'); el.className = 'c-open'; head.parentNode.insertBefore(el, head.nextSibling); }
      el.className = 'c-open ' + (st.open ? (st.soon ? 'soon' : 'on') : 'off');
      el.textContent = st.label;
    });
  }

  // ─── 資料一覧 ───
  function initIndex(doc, today) {
    var cards = doc.querySelectorAll('.doc-card[href]');
    if (!cards.length || !global.fetch || !global.DOMParser) return;
    Array.prototype.forEach.call(cards, function (card) {
      fetch(card.getAttribute('href')).then(function (r) { return r.ok ? r.text() : ''; }).then(function (html) {
        if (!html) return;
        var page = new DOMParser().parseFromString(html, 'text/html');
        var meta = card.querySelector('.doc-meta');
        if (!meta) { meta = doc.createElement('div'); meta.className = 'doc-meta'; card.querySelector('.doc-desc').parentNode.appendChild(meta); }
        var parts = [];
        // 近い料金改定（これからのものだけ。いちばん近い日）
        var next = null;
        Array.prototype.forEach.call(page.querySelectorAll('.news-card[data-date]'), function (n) {
          var c = countdown(n.getAttribute('data-date'), today);
          if (c.state === 'past') return;
          if (!next || c.left < next.c.left) next = { c: c, date: n.getAttribute('data-date'), what: n.getAttribute('data-short') || '' };
        });
        var camps = Array.prototype.map.call(page.querySelectorAll('.camp[data-start]'), function (n) { return campaign(n.getAttribute('data-start'), n.getAttribute('data-end'), today); });
        var ending = camps.filter(function (c) { return c.state === 'soon'; }).sort(function (a, b) { return a.left - b.left; })[0];
        var onCount = camps.filter(function (c) { return c.state === 'on' || c.state === 'soon'; }).length;
        if (ending) parts.push('<span class="m-next soon">' + ending.label + 'のキャンペーンあり</span>');
        else if (onCount) parts.push('<span class="m-next later">受付中のキャンペーン ' + onCount + '件</span>');
        if (next) parts.push('<span class="m-next ' + next.c.state + '">' + md(next.date) + (next.what ? ' ' + esc(next.what) : '') + ' ' + next.c.label + '</span>');
        var f = freshness(updatedOf((page.querySelector('.updated') || {}).textContent), today);
        if (f) parts.push('<span class="m-upd' + (f.stale ? ' stale' : '') + '">' + (f.stale ? '確認が必要かも・' : '') + '最終更新 ' + md(f.ymd) + '</span>');
        meta.innerHTML = parts.join('');
      }).catch(function () {});
    });
  }
  function esc(v) { return String(v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  global.SiegDocs = { campaign: campaign, freshness: freshness, parseHours: parseHours, openState: openState, countdown: countdown, jstNow: jstNow, STALE_DAYS: STALE_DAYS };

  if (global.document) {
    var doc = global.document, today = jstNow().ymd;
    var run = function () {
      paintUpdated(doc, today);
      initNews(doc, today);
      initCampaigns(doc, today);
      paintHours(doc);
      if (doc.querySelector('.carrier .c-hours')) setInterval(function () { paintHours(doc); }, 60000);
      initIndex(doc, today);
    };
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', run); else run();
  }
})(this);
