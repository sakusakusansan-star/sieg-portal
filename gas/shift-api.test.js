// 実行: node gas/shift-api.test.js  （Node単体で動く。GASへ貼る前の確認用）
// 実シート「Siegシフト表」と同じ構造のモックで shift-api.gs を検証する
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const LABELS = ['取引先', 'キャリア／店舗', '開催場所', 'ホテル'];

function makeShiftSheet(name, a1, b1, days) {
  const cols = 2 + days;
  const g = [];
  const row = () => new Array(cols).fill('');
  const r0 = row(); r0[0] = a1; r0[1] = b1; g.push(r0);
  const r1 = row(); r1[1] = '曜日'; g.push(r1);
  const r2 = row(); r2[1] = '日付';
  for (let d = 1; d <= days; d++) r2[d + 1] = d;
  g.push(r2);
  ['福岡', '清田', '福山', '古川'].forEach(n => {
    const a = row(); a[0] = n; g.push(a);
    LABELS.forEach(l => { const x = row(); x[1] = l; g.push(x); });
  });
  return { name, grid: g };
}

function Sheet(def) {
  const g = def.grid;
  const cell = (r, c) => (g[r - 1] && g[r - 1][c - 1] !== undefined) ? g[r - 1][c - 1] : '';
  const block = (r, c, nr, nc) => {
    const rows = [];
    for (let i = 0; i < (nr || 1); i++) {
      const line = [];
      for (let j = 0; j < (nc || 1); j++) line.push(cell(r + i, c + j));
      rows.push(line);
    }
    return rows;
  };
  return {
    getName: () => def.name,
    getLastRow: () => g.length,
    getLastColumn: () => (g[0] ? g[0].length : 0),
    appendRow: (vals) => g.push(vals.slice()),
    _grid: g,
    _writes: 0,
    getRange(r, c, nr, nc) {
      const self = this;
      return {
        getValue: () => cell(r, c),
        getValues: () => block(r, c, nr, nc),
        getDisplayValues: () => block(r, c, nr, nc).map(l => l.map(v => String(v))),
        setValue: (v) => { self._writes++; g[r - 1][c - 1] = v; },
        setValues: (vals) => {
          self._writes++;
          for (let i = 0; i < vals.length; i++)
            for (let j = 0; j < vals[i].length; j++) g[r - 1 + i][c - 1 + j] = vals[i][j];
        }
      };
    }
  };
}

function setup(defs) {
  const sheets = defs.map(Sheet);
  const ss = {
    getSheets: () => sheets,
    getSheetByName: (n) => sheets.find(s => s.getName() === n) || null,
    getSpreadsheetTimeZone: () => 'Asia/Tokyo',
    insertSheet: (n) => { const s = Sheet({ name: n, grid: [] }); sheets.push(s); return s; }
  };
  const cache = {};
  global.SpreadsheetApp = { openById: () => ss, getActiveSpreadsheet: () => ss, flush: () => {} };
  global.LockService = { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) };
  global.CacheService = { getScriptCache: () => ({ get: (k) => cache[k] || null, put: (k, v) => { cache[k] = v; } }) };
  global.ContentService = {
    MimeType: { JSON: 'json' },
    createTextOutput: (t) => ({ text: t, setMimeType() { return this; } })
  };
  global.Utilities = { formatDate: () => '2026/10/11 9:00:00' };
  global.Logger = { log() {} };
  const code = fs.readFileSync(path.join(__dirname, 'shift-api.gs'), 'utf8');
  // 関数宣言をグローバルに出すため、間接 eval で読み込む
  (0, eval)(code);
  return { ss, sheets };
}

function post(body) {
  return JSON.parse(doPost({ postData: { contents: JSON.stringify(Object.assign({ token: TOKEN }, body)) } }).text);
}

let passed = 0;
function test(name, fn) { fn(); passed++; console.log('✓ ' + name); }

// ─────────────────────────────────────────────

test('同じ月に「（保存）」の控えと本番があれば、本番に書き込む', () => {
  const { sheets } = setup([
    makeShiftSheet('2026-11（保存）', '2026', '11月', 30),
    makeShiftSheet('シフト表　11月', '2026', '11月', 30),
    { name: '送信ログ', grid: [['日時', '操作', '名前']] }
  ]);
  const res = post({ name: '清田', year: 2026, month: 11, entries: [{ start: 3, end: 3, client: 'ダル', carrier: 'docomo', place: '下通', hotel: '' }] });
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.sheet, 'シフト表　11月');
  const months = listMonths().months;
  assert.strictEqual(months.length, 1, '同じ月が2回出ない');
  assert.strictEqual(months[0].sheet, 'シフト表　11月');
  // 控えには書かれていない
  assert.ok(sheets[0]._grid.every(r => r.indexOf('ダル') < 0));
});

test('控えしか無い月は控えを使う', () => {
  setup([makeShiftSheet('2026-07（保存）', '2026', '7月', 31)]);
  assert.strictEqual(findMonthSheet(SpreadsheetApp.openById(), 2026, 7).getName(), '2026-07（保存）');
});

test('シート名だけで判別するとき「1月」が「11月」に当たらない', () => {
  setup([
    makeShiftSheet('2027年11月', '', '', 30),
    makeShiftSheet('2027年1月', '', '', 31)
  ]);
  assert.strictEqual(findMonthSheet(SpreadsheetApp.openById(), 2027, 1).getName(), '2027年1月');
  assert.strictEqual(findMonthSheet(SpreadsheetApp.openById(), 2027, 11).getName(), '2027年11月');
});

test('B1 が数字の 9 でも月として読める', () => {
  setup([makeShiftSheet('シフト表', '2026', 9, 30)]);
  assert.deepStrictEqual(listMonths().months.map(m => m.month), [9]);
});

test('飛び飛びの日も正しいセルに書き、書き込み回数はかたまり単位', () => {
  const { sheets } = setup([makeShiftSheet('シフト表　10月', '2026', '10月', 31)]);
  const sh = sheets[0];
  const res = post({
    name: '福山', year: 2026, month: 10,
    entries: [
      { start: 5, end: 9, client: '南国殖産', carrier: 'docomo', place: '近見', hotel: '' },
      { start: 20, end: 20, client: 'ハイコム', carrier: 'SoftBank', place: '健軍', hotel: 'ホテルA' }
    ]
  });
  assert.strictEqual(res.ok, true);
  assert.strictEqual(res.days, 6);
  // 2エントリ × 4行 = 8回（以前は 6日 × 4行 = 24回）
  assert.strictEqual(sh._writes, 8);

  const list = listShift('福山', 2026, 10);
  assert.deepStrictEqual(Object.keys(list.days).map(Number), [5, 6, 7, 8, 9, 20]);
  assert.deepStrictEqual(list.days[7], { client: '南国殖産', carrier: 'docomo', place: '近見', hotel: '' });
  assert.deepStrictEqual(list.days[20], { client: 'ハイコム', carrier: 'SoftBank', place: '健軍', hotel: 'ホテルA' });
  // 隣の日や他のスタッフには書いていない
  assert.strictEqual(list.days[4], undefined);
  assert.deepStrictEqual(listShift('古川', 2026, 10).days, {});
});

test('取り消しでその日のセルが空になる', () => {
  setup([makeShiftSheet('シフト表　10月', '2026', '10月', 31)]);
  post({ name: '古川', year: 2026, month: 10, entries: [{ start: 1, end: 3, client: 'ダル', carrier: 'docomo', place: '下通', hotel: '' }] });
  const res = post({ action: 'delete', name: '古川', year: 2026, month: 10, entries: [{ start: 2, end: 2 }] });
  assert.strictEqual(res.ok, true);
  assert.deepStrictEqual(Object.keys(listShift('古川', 2026, 10).days).map(Number), [1, 3]);
});

test('同じ送信IDが2回来ても、送信ログは1行だけ', () => {
  const { ss } = setup([
    makeShiftSheet('シフト表　10月', '2026', '10月', 31),
    { name: '送信ログ', grid: [['日時', '操作', '名前', '年', '月', '開始日', '終了日', '取引先', 'キャリア', '開催場所', 'ホテル']] }
  ]);
  const body = { requestId: 'abc-123', name: '清田', year: 2026, month: 10, entries: [{ start: 8, end: 8, client: 'サンコミ', carrier: 'au', place: '下通', hotel: '' }] };
  const first = post(body);
  const second = post(body);
  assert.strictEqual(first.ok, true);
  assert.deepStrictEqual(second, first);
  assert.strictEqual(ss.getSheetByName('送信ログ').getLastRow(), 2);
});

test('合言葉なしで読み書きできる（合言葉は使わない）', () => {
  setup([makeShiftSheet('シフト表　10月', '2026', '10月', 31)]);
  const res = JSON.parse(doPost({ postData: { contents: JSON.stringify({ name: '清田', year: 2026, month: 10, entries: [{ start: 1, client: 'ダル', carrier: 'docomo', place: '下通' }] }) } }).text);
  assert.strictEqual(res.ok, true, JSON.stringify(res));
  const got = JSON.parse(doGet({ parameter: { action: 'list', name: '清田', year: '2026', month: '10' } }).text);
  assert.strictEqual(got.ok, true, JSON.stringify(got));
  assert.strictEqual(got.days['1'].client, 'ダル');
});

console.log('\n' + passed + '件すべて成功');
