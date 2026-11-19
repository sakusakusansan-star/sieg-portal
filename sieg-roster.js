/* ═══════════════════════════════════════════════════════════════
   sieg-roster.js — Sieg 業務ツールの名簿

   ★ 人の追加・直す・外すは、みんなの状況（team.html）の「メンバー」でする。
     名簿は日報のスプレッドシートの「名簿」シートにあり、各画面はそれを読む
     （この端末に残しておき、すぐ開く。裏で10分に1回まで読み直す）。
     下の PEOPLE と TOOLS は、名簿シートを一度も読めていない端末が使う、前の名簿。

   ポータルと各ツール（日報・シフト入力・掲示板・交通費など）は、
   すべて https://sakusakusansan-star.github.io/ から配信されているので、
   このファイルを /sieg-portal/sieg-roster.js として読み込んで同じ名簿を使う。
     <script src="/sieg-portal/sieg-roster.js"></script>

   ※ Google 側（GAS・スプレッドシート）も名簿シートを読む（2分ごと）。シフト表の行・稼働費や経費精算の
     シートは、その人がはじめて使うときに自動で作る。社員の稼働費の自宅だけは、本人が稼働費の画面で登録する。
     名簿シートが読めないときは、各 GAS に書いた前の一覧（ALL_STAFF・ALLOW_STAFF・STAFF_HOME・PARTNERS・STAFF_SHEETS）で動く。
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  // group … staff（Sieg社員）／ partner（パートナー様）
  // full  … フルネーム（交通費計算のシート名に使う。使わない人は書かなくてよい）
  // carrier … 獲得報告を開いたときに最初から選んでおくキャリア（docomo / Softbank / au）。
  //           書かない人は、前回選んだキャリアで開く
  var PEOPLE = [
    { name: '福山', group: 'staff',   full: '福山康平', carrier: 'Softbank' },
    { name: '古川', group: 'staff',   full: '古川泰成', carrier: 'Softbank' },
    { name: '清田', group: 'staff',   full: '清田和男', carrier: 'docomo' },
    { name: '福岡', group: 'staff',                     carrier: 'docomo' },
    { name: '山口', group: 'partner', full: '山口真人', carrier: 'au' },
    { name: '鈴木', group: 'partner',                   carrier: 'docomo' },
    { name: '毛利', group: 'partner',                   carrier: 'Softbank' },
    { name: '山内', group: 'partner' }
  ];

  // ツールごとに使う人。'staff'・'partner'・'everyone' か、名前の並び。
  // ポータルのホームには、選んだ人が使うツールだけが並ぶ。
  var TOOLS = {
    nippou:       'partner',                        // 日報
    shiftStaff:   'staff',                          // シフト入力（Sieg社員）
    shiftPartner: 'partner',                        // シフト入力（パートナー様）
    commute:      ['福山', '古川', '清田', '山口', '鈴木', '毛利', '山内'],  // 交通費計算（パートナー様は partner.html へ）
    keihi:        ['福山', '古川', '清田'],          // 経費精算
    notice:       'staff',                          // 掲示板への投稿
    gain:         'everyone',                       // 獲得報告
    power:        'everyone',                       // 戦闘力（ランキングに出る人）
    team:         ['福岡', '福山']                  // みんなの状況（全員の獲得・日報・稼働費）
  };

  // ─── 名簿シート（日報の GAS の ?action=roster）───
  var ROSTER_API = 'https://script.google.com/macros/s/AKfycbwEclDIdJiNgdXOmveRvT-BJOVWc6FwyrpxWNrqHs1DB9xgx9Ijuix0qqQ5KyG-XlkF7w/exec';
  var CACHE_KEY = 'siegRosterV1', REFRESH_MS = 10 * 60 * 1000;
  var ALL = PEOPLE.slice(), fromSheet = false;   // ALL は外した人も入れた全員（記録の名前を引くとき用）
  function lsGet(k) { try { return global.localStorage ? global.localStorage.getItem(k) : null; } catch (e) { return null; } }
  function lsSet(k, v) { try { global.localStorage.setItem(k, v); } catch (e) {} }
  function valid(list) {
    return Object.prototype.toString.call(list) === '[object Array]' && list.length > 0 &&
      list.every(function (p) { return p && typeof p.name === 'string' && p.name; });
  }
  // 名簿シートの形 → この画面で使う形（PEOPLE と、人ごとに決まるツール）
  function useSheet(list) {
    ALL = list.map(function (p) {
      return { name: p.name, group: p.group === 'partner' ? 'partner' : 'staff', full: p.full || '', carrier: p.carrier || '',
        tools: (p.tools || []).slice(), hidden: p.hidden || '' };
    });
    PEOPLE = ALL.filter(function (p) { return !p.hidden; });
    ['commute', 'keihi', 'team'].forEach(function (t) {
      TOOLS[t] = PEOPLE.filter(function (p) { return p.tools.indexOf(t) >= 0; }).map(function (p) { return p.name; });
    });
    fromSheet = true;
  }
  // ─── 取引先・場所の一覧（日報の GAS が名簿と一緒に返す。古い GAS・はじめての端末は下の初めの一覧） ───
  var DEFAULT_CLIENTS = [
    { name: '南国殖産', carrier: 'docomo', place: '近見', color: '#2E7D32' }, { name: 'ハイコム', carrier: 'SoftBank', place: '', color: '#E65100' },
    { name: 'サンコミ', carrier: 'au', place: '', color: '#6A1B9A' }, { name: 'ダル', carrier: 'docomo', place: '', color: '#00838F' },
    { name: 'NOON', carrier: '', place: '', color: '#AD1457' }, { name: '九情', carrier: 'au', place: '', color: '#1565C0' }];
  var DEFAULT_PLACES = [{ name: '下通', noParen: true }, { name: 'ゆめタウン大牟田', noParen: true }].concat(
    ['健軍', '松橋', '光の森', '大津', '麻生田', '八代', '八代中央', '玉名', '玉名中央', '熊本西', '東バイパス', '菊池', '上熊本', '近見']
      .map(function (n) { return { name: n, shop: true, alias: n === '上熊本' ? ['上熊'] : [] }; }));
  var CLIENTS = DEFAULT_CLIENTS, PLACES = DEFAULT_PLACES;
  function validList(l) { return Object.prototype.toString.call(l) === '[object Array]' && l.every(function (x) { return x && typeof x.name === 'string' && x.name; }); }
  function useMaster(c, pl) {
    if (validList(c) && c.length) CLIENTS = c;
    if (validList(pl)) PLACES = pl;
  }
  // 場所の名前をくらべる形（空白・全角英数・頭の会社名をのぞく）。「sb 玉名」「SB玉名」「玉名」は同じ（日報の GAS と同じ決まり）
  var PREFIX = /^(?:ＳＢ|SB|ソフトバンク|ドコモ|docomo|ａｕ|au)[\s　・･]*/i;
  function placeKey(v) {
    var t = String(v == null ? '' : v).replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); }).replace(/[\s　]+/g, '');
    for (var i = 0; i < 3 && PREFIX.test(t); i++) { var t2 = t.replace(PREFIX, ''); if (!t2 || t2 === t) break; t = t2; }
    return t.toLowerCase();
  }
  function findPlace(text) {
    var k = placeKey(text);
    if (!k) return null;
    for (var i = 0; i < PLACES.length; i++) {
      var p = PLACES[i];
      if (p.hidden) continue;
      if (placeKey(p.name) === k || (p.alias || []).some(function (a) { return placeKey(a) === k; })) return p;
    }
    return null;
  }

  var cached = null;
  try { cached = JSON.parse(lsGet(CACHE_KEY) || 'null'); } catch (e) { cached = null; }
  if (cached && valid(cached.people)) useSheet(cached.people);
  if (cached) useMaster(cached.clients, cached.places);
  var firstTime = !fromSheet;
  function sig(list) {
    return JSON.stringify((list || []).map(function (p) { return [p.name, p.group, p.full || '', p.carrier || '', (p.tools || []).join(), p.hidden || '']; }));
  }
  // 新しい名簿を端末に残す（みんなの状況で直したときも使う）。いま使っている名簿と、名前の顔ぶれが違えば true
  // extra に取引先・場所（clients・places）があれば一緒に残す
  function save(list, extra) {
    if (!valid(list)) return false;
    var before = PEOPLE.map(function (p) { return p.name; }).join();
    cached = { t: Date.now(), people: list,
      clients: extra && validList(extra.clients) ? extra.clients : (cached && cached.clients) || null,
      places: extra && validList(extra.places) ? extra.places : (cached && cached.places) || null };
    useMaster(cached.clients, cached.places);
    lsSet(CACHE_KEY, JSON.stringify(cached));
    return before !== list.filter(function (p) { return !p.hidden; }).map(function (p) { return p.name; }).join();
  }
  var pending = null;
  // 名簿シートを読み直す。force でなければ、前に読んでから10分たっていないときは読まない
  function refresh(force) {
    if (pending) return pending;
    if (!global.fetch) return Promise.resolve(null);
    if (!force && cached && cached.t && Date.now() - cached.t < REFRESH_MS) return Promise.resolve(null);
    // 読めなかったとき（古い GAS・電波）も、10分は試さない
    var tried = Number(lsGet('siegRosterTry') || 0);
    if (!force && Date.now() - tried < REFRESH_MS) return Promise.resolve(null);
    lsSet('siegRosterTry', String(Date.now()));
    var ctl = global.AbortController ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 15000) : null;
    var before = sig(cached && cached.people);
    pending = fetch(ROSTER_API + '?action=roster', { redirect: 'follow', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (!j || !j.ok || !valid(j.people)) return null;   // 古い GAS（名簿に未対応）は、いまの名簿のまま
        var namesChanged = save(j.people, j);
        return { people: j.people, changed: sig(j.people) !== before, namesChanged: namesChanged };
      })
      .catch(function () { return null; })
      .then(function (r) { if (timer) clearTimeout(timer); pending = null; return r; });
    return pending;
  }
  // 名簿シートをまだ一度も読めていない端末で、人の顔ぶれが違ったら、1回だけ開き直す
  // （新しく入った人が、はじめて開いたときに自分の名前を選べるように）。ほかは次に開いたときから
  refresh(false).then(function (r) {
    if (!r || !r.namesChanged || !firstTime || !global.location || !global.sessionStorage) return;
    try {
      if (global.sessionStorage.getItem('siegRosterReloaded')) return;
      global.sessionStorage.setItem('siegRosterReloaded', '1');
    } catch (e) { return; }
    global.location.reload();
  });

  function names(group) {
    return PEOPLE.filter(function (p) { return !group || p.group === group; })
      .map(function (p) { return p.name; });
  }
  function find(name) {
    for (var i = 0; i < ALL.length; i++) if (ALL[i].name === name) return ALL[i];
    return null;
  }

  // パートナー様の交通費（commute-form/partner.html）の GAS。
  // 「パートナー_交通費（12月〜）」スプレッドシートの Apps Script をウェブアプリにした /exec の URL。
  // 空のあいだは、パートナー様の画面は「準備中」になり、山口さんは前の画面のまま。
  var COMMUTE_PARTNER_API = 'https://script.google.com/macros/s/AKfycbwKGhybd3Y-8VYGh3OwgqNqIIpzOqMUBWZH03sEzEjLM46HbThs198G0A6UGjo8jg_cRg/exec';

  // パートナー様のシフト（shift-form と同じ GAS）。ホームのぼのぼのが「きょうシフトの日か」を見るのに使う
  var SHIFT_PARTNER_API = 'https://script.google.com/macros/s/AKfycbwx4-wjr4Qmx6zeXDXZhht-65W7veveJvaXXmC9V5MQLipOLxLoWfz-XEUBau8NZ58h/exec';

  global.SiegRoster = {
    commutePartnerApi: COMMUTE_PARTNER_API,
    shiftPartnerApi: SHIFT_PARTNER_API,
    /** 名簿シートを読んで使っているか（false なら、このファイルに書いた前の名簿） */
    fromSheet: fromSheet,
    /** 外した人も入れた全員（みんなの状況の「メンバー」用） */
    all: function () { return ALL.map(function (p) { return { name: p.name, group: p.group, full: p.full || '', carrier: p.carrier || '', tools: (p.tools || []).slice(), hidden: p.hidden || '' }; }); },
    /** 名簿シートを読み直す（force で10分待たずに）。{ people, changed, namesChanged } か null */
    refresh: refresh,
    /** みんなの状況で直したあと、返ってきた名簿を端末に残す。顔ぶれが変わったら true */
    save: save,
    staff: names('staff'),
    partners: names('partner'),
    everyone: names(),
    isPartner: function (name) { var p = find(name); return !!p && p.group === 'partner'; },
    fullName: function (name) { var p = find(name); return (p && p.full) || ''; },
    /** 獲得報告を開いたときのキャリア（決めていなければ ''） */
    carrier: function (name) { var p = find(name); return (p && p.carrier) || ''; },
    /** 取引先の一覧（外したものをのぞく）。{ name, carrier, place, color } */
    clients: function () { return CLIENTS.filter(function (c) { return !c.hidden; }).map(function (c) { return { name: c.name, carrier: c.carrier || '', place: c.place || '', color: c.color || '' }; }); },
    /** 外したものも入れた取引先・場所（みんなの状況で直す用） */
    allClients: function () { return CLIENTS.map(function (c) { return JSON.parse(JSON.stringify(c)); }); },
    allPlaces: function () { return PLACES.map(function (p) { return JSON.parse(JSON.stringify(p)); }); },
    /** 場所の一覧（外したものをのぞく）。{ name, alias, address, shop, store, noParen } */
    places: function () { return PLACES.filter(function (p) { return !p.hidden; }).map(function (p) { return JSON.parse(JSON.stringify(p)); }); },
    /** シフトの開催場所の書き方から、一覧の場所を探す（「sb 玉名」→ 玉名）。見つからなければ null */
    findPlace: function (text) { var p = findPlace(text); return p ? JSON.parse(JSON.stringify(p)) : null; },
    placeKey: placeKey,
    /** 取引先の色（一覧に無ければ ''） */
    clientColor: function (name) { for (var i = 0; i < CLIENTS.length; i++) if (CLIENTS[i].name === name) return CLIENTS[i].color || ''; return ''; },
    /** そのツールを使う人の名前（並びは PEOPLE の順） */
    forTool: function (id) {
      var t = TOOLS[id];
      if (t === 'staff') return names('staff');
      if (t === 'partner') return names('partner');
      if (Object.prototype.toString.call(t) === '[object Array]') {
        return names().filter(function (n) { return t.indexOf(n) >= 0; });
      }
      return names();
    }
  };
})(this);
