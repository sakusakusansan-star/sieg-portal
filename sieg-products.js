/* ═══════════════════════════════════════════════════════════════
   sieg-products.js — 獲得報告の商品表（ここ1か所だけ直せばよい）

   獲得報告フォーム（sieg-portal/gain.html）、日報の獲得欄（nippou-form）、
   戦闘力（sieg-portal/power.html）が同じ表を使う。
     <script src="/sieg-portal/sieg-products.js"></script>

   ・商品を増やす／名前を変える … CARRIERS の items を直す
     （名前を変えると、変える前に送った分は戦闘力に数えられなくなる。
       古い名前の行を消さずに残し、hidden: true を付けると、入力には出さずに数え続けられる）
   ・区分や点数を変える        … cat と pt を直す。過去の分もさかのぼって計算し直される
     （Google 側は「キャリア・商品名・件数」だけを記録していて、点数は持っていない）

   区分（cat）
     MNP   … MNP（日報の「MNP目標」もこの区分の合計で進む）
             ※ MNP の商品を増やしたら、日報の GAS（nippou-form/nippou-gas.gs）の MNP_LABELS も直す
     固定  … 光・Air・HOME5G など
     端末  … ハイエンド・pixel
     カード… クレジットカード
     新規  … 新規
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  // 日報・獲得報告の送り先（日報の GAS。獲得報告もここに記録する）
  var API = 'https://script.google.com/macros/s/AKfycbwEclDIdJiNgdXOmveRvT-BJOVWc6FwyrpxWNrqHs1DB9xgx9Ijuix0qqQ5KyG-XlkF7w/exec';

  // id は日報のキャリア欄と同じ書き方（docomo / Softbank / au）
  var CARRIERS = [
    { id: 'docomo', label: 'ドコモ', items: [
      { label: 'MNP',              cat: 'MNP',  pt: 200 },
      { label: 'ドコモ光',         cat: '固定', pt: 100 },
      { label: 'HOME5G',           cat: '固定', pt: 100 },
      { label: 'ハイエンド',       cat: '端末', pt: 50 },
      { label: 'Dカードプラチナ',  cat: 'カード', pt: 100 },
      { label: 'Dカードゴールド',  cat: 'カード', pt: 80 },
      { label: 'DカードゴールドU', cat: 'カード', pt: 80 },
      { label: '新規',             cat: '新規', pt: 30 }
    ] },
    { id: 'Softbank', label: 'SB', items: [
      { label: 'SMNP',             cat: 'MNP',  pt: 200 },
      { label: 'YMNP',             cat: 'MNP',  pt: 100 },
      { label: '光新規',           cat: '固定', pt: 100 },
      { label: 'Air新規',          cat: '固定', pt: 100 },
      { label: 'Air機変',          cat: '固定', pt: 100 },
      { label: '速度変更',         cat: '固定', pt: 100 },
      { label: 'pixel',            cat: '端末', pt: 50 },
      { label: 'Pカードゴールド',  cat: 'カード', pt: 80 },
      { label: 'Pカード',          cat: 'カード', pt: 40 }
    ] },
    { id: 'au', label: 'au', items: [
      { label: 'auMNP',            cat: 'MNP',  pt: 200 },
      { label: 'UQMNP',            cat: 'MNP',  pt: 100 },
      { label: '光新規',           cat: '固定', pt: 100 },
      { label: 'auカードゴールド', cat: 'カード', pt: 80 },
      { label: 'auカード',         cat: 'カード', pt: 40 }
    ] }
  ];

  var CATS = ['MNP', '固定', '端末', 'カード', '新規'];

  function carrier(id) {
    for (var i = 0; i < CARRIERS.length; i++) if (CARRIERS[i].id === id) return CARRIERS[i];
    return null;
  }
  function find(carrierId, label) {
    var c = carrier(carrierId);
    if (!c) return null;
    for (var i = 0; i < c.items.length; i++) if (c.items[i].label === label) return c.items[i];
    return null;
  }

  global.SiegProducts = {
    API: API,
    CATS: CATS,
    carriers: CARRIERS.map(function (c) { return { id: c.id, label: c.label }; }),
    carrierLabel: function (id) { var c = carrier(id); return c ? c.label : String(id || ''); },
    /** 入力に出す商品（hidden を除く）。[{label, cat, pt}] */
    items: function (carrierId) {
      var c = carrier(carrierId);
      return c ? c.items.filter(function (x) { return !x.hidden; }) : [];
    },
    find: find,
    /** 件数の並び [{carrier, label, count}] → { power, cats: {MNP: 件数, …}, total } */
    score: function (rows) {
      var out = { power: 0, total: 0, cats: {} };
      CATS.forEach(function (k) { out.cats[k] = 0; });
      (rows || []).forEach(function (r) {
        var n = Number(r.count) || 0, it = find(r.carrier, r.label);
        if (!n || !it) return;
        out.power += it.pt * n;
        out.cats[it.cat] += n;
        out.total += n;
      });
      return out;
    }
  };
})(this);
