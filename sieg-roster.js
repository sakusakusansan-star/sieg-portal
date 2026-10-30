/* ═══════════════════════════════════════════════════════════════
   sieg-roster.js — Sieg 業務ツールの名簿（ここ1か所だけ直せばよい）

   ポータルと各ツール（日報・シフト入力・掲示板・交通費など）は、
   すべて https://sakusakusansan-star.github.io/ から配信されているので、
   このファイルを /sieg-portal/sieg-roster.js として読み込んで同じ名簿を使う。
     <script src="/sieg-portal/sieg-roster.js"></script>

   人が増えた・辞めたときは、下の PEOPLE と TOOLS を直す。
   ※ 画面に出す名前はここで全部そろうが、Google 側（GAS・スプレッドシート）は
     別に持っているので、そちらも直すこと。
       ・シフト入力（Sieg社員）  … sieg-portal/gas/shift-api.gs の ALLOW_STAFF と、シフト表の行
       ・シフト入力（パートナー様）… シフト表の行
       ・交通費計算              … 稼働費の GAS の STAFF_HOME（フルネーム）と、人ごとのシート
       ・経費精算                … 経費精算のスプレッドシート
   ═══════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  // group … staff（Sieg社員）／ partner（パートナー様）
  // full  … フルネーム（交通費計算のシート名に使う。使わない人は書かなくてよい）
  var PEOPLE = [
    { name: '福山', group: 'staff',   full: '福山康平' },
    { name: '古川', group: 'staff',   full: '古川泰成' },
    { name: '清田', group: 'staff',   full: '清田和男' },
    { name: '福岡', group: 'staff' },
    { name: '山口', group: 'partner', full: '山口真人' },
    { name: '鈴木', group: 'partner' },
    { name: '毛利', group: 'partner' },
    { name: '山内', group: 'partner' }
  ];

  // ツールごとに使う人。'staff'・'partner'・'everyone' か、名前の並び。
  // ポータルのホームには、選んだ人が使うツールだけが並ぶ。
  var TOOLS = {
    nippou:       'partner',                        // 日報
    shiftStaff:   'staff',                          // シフト入力（Sieg社員）
    shiftPartner: 'partner',                        // シフト入力（パートナー様）
    commute:      ['福山', '古川', '清田', '山口'],  // 交通費計算
    keihi:        ['福山', '古川', '清田'],          // 経費精算
    notice:       'staff',                          // 掲示板への投稿
    gain:         'everyone',                       // 獲得報告
    power:        'everyone'                        // 戦闘力（ランキングに出る人）
  };

  function names(group) {
    return PEOPLE.filter(function (p) { return !group || p.group === group; })
      .map(function (p) { return p.name; });
  }
  function find(name) {
    for (var i = 0; i < PEOPLE.length; i++) if (PEOPLE[i].name === name) return PEOPLE[i];
    return null;
  }

  global.SiegRoster = {
    staff: names('staff'),
    partners: names('partner'),
    everyone: names(),
    isPartner: function (name) { var p = find(name); return !!p && p.group === 'partner'; },
    fullName: function (name) { var p = find(name); return (p && p.full) || ''; },
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
