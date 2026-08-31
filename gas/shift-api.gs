/**
 * Sieg シフト送信API（Google Apps Script）
 *
 * シフト表のスプレッドシートに紐づけて使う。
 * shift.html から送られた内容を
 *   1) その月のシフト表（スタッフの行 × 日付の列）に書き込み
 *   2) 送信ログのシートに1行ずつ残す
 * という2つの仕事をする。
 *
 * 設置のしかたは gas/README.md を参照。
 */

// ═══ 設定 ═══

// 書き込み先のシフト表のスプレッドシートID。
// （URLの /d/ と /edit のあいだの長い文字列）
// スプレッドシートに紐づいたスクリプトとして使う場合は空でよい。
// 独立したスクリプトとして作る場合は、必ずここにIDを入れる。
var SHEET_ID = '1wRBlTC_U2Mek5xj1YDFUEuAdRRlcVGZGIy_3WmmJLsQ';

// 合言葉。shift.html の SHIFT_TOKEN と同じ文字列にする。
// 空のままでも動くが、URLを知っている人は誰でも送信できる状態になる。
var TOKEN = 'sieg-shift-2026';

// 送信ログのシート名。空にすると「日時／操作／名前…」の見出しから自動で探し、
// 見つからなければ「送信ログ」を新しく作る。
var LOG_SHEET_NAME = '';

// このスタッフ以外は書き込ませない。空配列 [] にすると全員を許可。
var ALLOW_STAFF = ['福岡', '清田', '福山', '古川'];

// シフト表の各スタッフの見出し（B列）と、送るデータの対応
var LABEL_KEYS = ['client', 'carrier', 'place', 'hotel'];

// ═══ 入口 ═══

function doGet(e) {
  try {
    var p = (e && e.parameter) || {};

    // 疎通確認だけは合言葉なしで通す（中身は何も返さない）
    if (p.action === 'ping') return json({ ok: true, message: 'shift-api is alive' });

    // シフトの中身は、合言葉が合っているときだけ返す
    if (TOKEN && String(p.token || '') !== TOKEN) {
      return json({ ok: false, error: '合言葉が違います' });
    }

    if (p.action === 'months') return json(listMonths());
    if (p.action === 'list') {
      return json(listShift(String(p.name || ''), Number(p.year), Number(p.month)));
    }
    return json({ ok: false, error: 'action が指定されていません' });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    if (TOKEN && String(body.token || '') !== TOKEN) {
      return json({ ok: false, error: '合言葉が違います' });
    }
    var action = body.action === 'delete' ? 'delete' : 'submit';
    var name = String(body.name || '').trim();
    var year = Number(body.year);
    var month = Number(body.month);
    var entries = body.entries || [];

    if (!name) return json({ ok: false, error: '名前がありません' });
    if (ALLOW_STAFF.length && ALLOW_STAFF.indexOf(name) < 0) {
      return json({ ok: false, error: name + ' さんはこのフォームの対象外です' });
    }
    if (!year || !month) return json({ ok: false, error: '年月がありません' });
    if (!entries.length) return json({ ok: false, error: '日にちが選ばれていません' });

    lock.waitLock(20000);
    return json(writeShift(action, name, year, month, entries));

  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  } finally {
    try { lock.releaseLock(); } catch (ignore) {}
  }
}

// ═══ 書き込み ═══

function writeShift(action, name, year, month, entries) {
  var ss = book();
  var sheet = findMonthSheet(ss, year, month);
  if (!sheet) return { ok: false, error: year + '年' + month + '月のシフト表が見つかりません' };

  var header = findDayHeader(sheet);
  if (!header) return { ok: false, error: sheet.getName() + ' に「日付」の行が見つかりません' };

  var rows = findStaffRows(sheet, name, header.row);
  if (!rows) return { ok: false, error: sheet.getName() + ' に「' + name + '」の行が見つかりません' };

  var del = (action === 'delete');
  var written = 0;
  var skipped = [];
  var logError = '';

  entries.forEach(function(entry) {
    var start = Number(entry.start);
    var end = Number(entry.end);
    if (!start) return;
    if (!end || end < start) end = start;

    for (var day = start; day <= end; day++) {
      var col = header.days[day];
      if (!col) { skipped.push(day); continue; }
      LABEL_KEYS.forEach(function(key) {
        var row = rows[key];
        if (!row) return;
        sheet.getRange(row, col).setValue(del ? '' : String(entry[key] || ''));
      });
      written++;
    }

    // ログはあくまで控え。ここで失敗してもシフト表への書き込みは生かす。
    try {
      appendLog(ss, {
        action: del ? '削除' : '送信',
        name: name, year: year, month: month,
        start: start, end: end,
        client: del ? '' : entry.client,
        carrier: del ? '' : entry.carrier,
        place: del ? '' : entry.place,
        hotel: del ? '' : entry.hotel
      });
    } catch (err) {
      logError = String(err && err.message || err);
    }
  });

  SpreadsheetApp.flush();

  return {
    ok: true,
    sheet: sheet.getName(),
    days: written,
    skipped: skipped,
    logError: logError
  };
}

// ═══ 読み出し ═══

/**
 * 入力できる月の一覧。
 * 「日付」の行があるシート＝シフト表 だけを拾うので、
 * シフト表を1枚作れば、その月がそのままスマホ側の選択肢に出る。
 */
function listMonths() {
  var months = [];
  book().getSheets().forEach(function(sheet) {
    var ym = sheetYearMonth(sheet);
    if (!ym) return;
    if (!findDayHeader(sheet)) return;   // 集計レポートなどはここで外れる
    months.push({ year: ym.year, month: ym.month, sheet: sheet.getName() });
  });
  months.sort(function(a, b) { return (a.year - b.year) || (a.month - b.month); });
  return { ok: true, months: months };
}

/** シートが何年何月のものかを、A1・B1とシート名から読み取る */
function sheetYearMonth(sheet) {
  var year = 0, month = 0;

  if (sheet.getLastRow() >= 1 && sheet.getLastColumn() >= 2) {
    var head = sheet.getRange(1, 1, 1, 2).getValues()[0];
    var y = parseInt(norm(head[0]), 10);
    var m = norm(head[1]).match(/^(\d{1,2})月$/);
    if (y >= 2000 && y < 2100 && m) { year = y; month = Number(m[1]); }
  }

  if (!month) {
    var name = norm(sheet.getName());
    var hit = name.match(/(\d{1,2})月/);
    if (!hit) return null;
    month = Number(hit[1]);
    var yearHit = name.match(/(20\d{2})/);
    year = yearHit ? Number(yearHit[1]) : new Date().getFullYear();
  }

  if (month < 1 || month > 12) return null;
  return { year: year, month: month };
}

function listShift(name, year, month) {
  if (!name) return { ok: false, error: '名前がありません' };
  if (!year || !month) return { ok: false, error: '年月がありません' };

  var ss = book();
  var sheet = findMonthSheet(ss, year, month);
  if (!sheet) return { ok: false, error: year + '年' + month + '月のシフト表がまだありません' };

  var header = findDayHeader(sheet);
  if (!header) return { ok: false, error: '「日付」の行が見つかりません' };

  var rows = findStaffRows(sheet, name, header.row);
  if (!rows) return { ok: false, error: '「' + name + '」の行が見つかりません' };

  var days = {};
  Object.keys(header.days).forEach(function(day) {
    var col = header.days[day];
    var out = {};
    var any = false;
    LABEL_KEYS.forEach(function(key) {
      var row = rows[key];
      var v = row ? String(sheet.getRange(row, col).getValue()).trim() : '';
      out[key] = v;
      if (v) any = true;
    });
    if (any) days[day] = out;
  });

  return { ok: true, sheet: sheet.getName(), days: days };
}

// ═══ シート探し ═══

/**
 * 年・月からシフト表のシートを探す。
 * 集計レポートのシートも名前が似ているので、
 * 「日付」の行がある＝実際のシフト表であることまで確かめてから返す。
 */
function findMonthSheet(ss, year, month) {
  var y = String(year);
  var m = String(month) + '月';

  var candidates = ss.getSheets().filter(function(sh) {
    var n = norm(sh.getName());
    if (n.indexOf(y) >= 0 && n.indexOf(m) >= 0) return true;   // 例）2026年9月 シフト表
    if (n === m) return true;                                   // 例）9月
    if (sh.getLastRow() >= 1 && sh.getLastColumn() >= 2) {      // 例）A1に年・B1に「9月」
      var head = sh.getRange(1, 1, 1, 2).getValues()[0];
      if (norm(head[0]) === y && norm(head[1]) === m) return true;
    }
    return false;
  });

  // 「日付」の行を持つものだけがシフト表。集計レポートはここで外れる。
  for (var i = 0; i < candidates.length; i++) {
    if (findDayHeader(candidates[i])) return candidates[i];
  }
  return null;
}

/** 「日付」の行を探し、日にち → 列番号 の対応表を作る */
function findDayHeader(sheet) {
  var lastRow = Math.min(15, sheet.getLastRow());
  var lastCol = sheet.getLastColumn();
  if (lastRow < 1 || lastCol < 2) return null;

  var values = sheet.getRange(1, 1, lastRow, lastCol).getValues();
  for (var r = 0; r < lastRow; r++) {
    for (var c = 0; c < Math.min(3, lastCol); c++) {
      if (norm(values[r][c]) !== '日付') continue;
      var days = {};
      for (var cc = c + 1; cc < lastCol; cc++) {
        var raw = values[r][cc];
        var n = (raw instanceof Date) ? raw.getDate() : parseInt(String(raw).trim(), 10);
        if (n >= 1 && n <= 31 && !days[n]) days[n] = cc + 1;
      }
      if (Object.keys(days).length) return { row: r + 1, days: days };
    }
  }
  return null;
}

/**
 * A列からスタッフ名の行を探し、その下の
 * 取引先／キャリア／開催場所／ホテル が何行目かを返す。
 * 行の位置を決め打ちしないので、行が増減しても動く。
 */
function findStaffRows(sheet, name, fromRow) {
  var lastRow = sheet.getLastRow();
  if (lastRow < fromRow) return null;
  var values = sheet.getRange(1, 1, lastRow, 2).getValues();

  for (var r = fromRow; r < lastRow; r++) {   // fromRow は「日付」行なので、その次から
    if (norm(values[r][0]) !== name) continue;

    var rows = {};
    for (var k = r + 1; k < Math.min(r + 9, lastRow); k++) {
      if (norm(values[k][0]) !== '') break;   // 次のスタッフの見出しに当たったら終わり
      var key = labelKey(values[k][1]);
      if (key && !rows[key]) rows[key] = k + 1;
    }
    if (rows.client || rows.carrier || rows.place) return rows;
  }
  return null;
}

/** B列の見出しを、送るデータのキーに読み替える */
function labelKey(label) {
  var s = norm(label);
  if (s.indexOf('取引先') === 0) return 'client';
  if (s.indexOf('キャリア') === 0) return 'carrier';
  if (s.indexOf('開催場所') === 0) return 'place';
  if (s.indexOf('ホテル') === 0) return 'hotel';
  return '';
}

function norm(v) {
  return String(v == null ? '' : v).replace(/[\s　]/g, '');
}

// ═══ 送信ログ ═══

var LOG_HEADER = ['日時', '操作', '名前', '年', '月', '開始日', '終了日', '取引先', 'キャリア', '開催場所', 'ホテル'];

function appendLog(ss, r) {
  var sheet = findLogSheet(ss);
  if (!sheet) return;
  var stamp = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), 'yyyy/MM/dd H:mm:ss');
  sheet.appendRow([
    stamp, r.action, r.name, r.year, r.month, r.start, r.end,
    r.client || '', r.carrier || '', r.place || '', r.hotel || ''
  ]);
}

function findLogSheet(ss) {
  if (LOG_SHEET_NAME) {
    var named = ss.getSheetByName(LOG_SHEET_NAME);
    if (named) return named;
  }
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    var sh = sheets[i];
    if (sh.getLastRow() < 1 || sh.getLastColumn() < 3) continue;
    var head = sh.getRange(1, 1, 1, 3).getValues()[0];
    if (norm(head[0]) === '日時' && norm(head[1]) === '操作' && norm(head[2]) === '名前') return sh;
  }
  var created = ss.insertSheet(LOG_SHEET_NAME || '送信ログ');
  created.appendRow(LOG_HEADER);
  return created;
}

// ═══ 共通 ═══

/**
 * 書き込み先のスプレッドシート。
 * SHEET_ID があればそれを開き、無ければ紐づいているシートを使う。
 */
function book() {
  return SHEET_ID
    ? SpreadsheetApp.openById(SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * スクリプトエディタから直接実行して、シートを正しく読めているか確認する。
 * 実行ログに、見つかったシート名と行番号が出る。
 */
function testFindRows() {
  var ss = book();
  var now = new Date();
  var year = now.getFullYear();
  var month = now.getMonth() + 1;
  var sheet = findMonthSheet(ss, year, month);
  Logger.log('シフト表: %s', sheet ? sheet.getName() : '見つかりません');
  if (!sheet) return;
  var header = findDayHeader(sheet);
  Logger.log('日付の行: %s / 日数: %s', header ? header.row : '?', header ? Object.keys(header.days).length : 0);
  if (!header) return;
  ALLOW_STAFF.forEach(function(name) {
    Logger.log('%s: %s', name, JSON.stringify(findStaffRows(sheet, name, header.row)));
  });
  Logger.log('送信ログ: %s', findLogSheet(ss).getName());
  Logger.log('入力できる月: %s', JSON.stringify(listMonths().months));
}
