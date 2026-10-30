# 【指示】日報のGASを貼り替えて再デプロイする（獲得報告・戦闘力に対応）

あなたはブラウザを操作できるエージェントです。Googleアカウントにログインした状態で、
以下の **パートO** を実行してください。
**「絶対に守ること」を必ず先に読んでから着手してください。**

これまで（パートA〜N）と同じ手順です。今回は、日報のGASに「獲得報告」と「戦闘力」のための機能を足します。

---

## 絶対に守ること

1. **「新しいデプロイ」を作らないこと。** 「デプロイを管理」→ 既存デプロイの鉛筆 →
   バージョン「新バージョン」→「デプロイ」で更新し、デプロイIDが変わっていないことを確かめる。
2. **貼り替えるのは `コード.gs`（日報のコードが入っているファイル）1つだけ。** ほかのファイル・トリガーには触らない。
3. **スクリプト プロパティには触らないこと**（`DISCORD_WEBHOOK` も、あれば `DISCORD_GAIN_WEBHOOK` も。値を読んだり報告に書いたりもしない）。
4. **貼り替える前に、今のバージョン番号を控えること**（戻すときに使う）。
5. **フォームから送信しないこと。** 日報・獲得報告の送信、戦闘力のキャラ選びはしない（Discord に通知が飛びます）。
   GASエディタで関数を実行することもしない（`setup` は見出しを上書きするので特に実行しない）。
6. 想定と違うことがあれば、勝手に判断せず止まって報告すること。

---

## コピーの仕方

1. 下に書いた URL（raw.githubusercontent.com）を開く。コードだけが表示される
2. **Ctrl+A → Ctrl+C**
3. Apps Script で対象のファイルを開き、**Ctrl+A → Ctrl+V**
4. 確かめる
   - 最後の行番号が、下に書いた行数と同じ（最後に空行が1行増えるのは問題なし）
   - 1行目と最後の行が、下に書いたものと同じ
5. 保存（Ctrl+S）。赤いエラーが出たら止まって報告

---

## パートO. 日報 — `コード.gs`

**デプロイID：** `AKfycbwEclDIdJiNgdXOmveRvT-BJOVWc6FwyrpxWNrqHs1DB9xgx9Ijuix0qqQ5KyG-XlkF7w`
（前回のパートBと同じプロジェクト）

**記録先スプレッドシート：**
<https://docs.google.com/spreadsheets/d/1ffkmHDt_sz1ZQ3ZB_fXIaJeFhuW0wSI7bqwMpC9Z33g/edit>

**新しいコード（685行。1行目は `// ═══════════════════════════════════════════`、最後の行は `}`）：**
<https://raw.githubusercontent.com/sakusakusansan-star/nippou-form/937eb18c13d6472cc67d4011bb6a1ad9bf49c92d/nippou-gas.gs>

1. プロジェクトを開く（記録先スプレッドシートの「拡張機能」→「Apps Script」、
   またはパートBで使ったプロジェクト）。デプロイIDが一致することを確認し、今のバージョン番号を控える
2. 貼り替える前に、今のコードの次の2行の値を控える
   ```
   var SHEET_ID = '……';
   var TEAMS_WEBHOOK_URL = '……';
   ```
3. `コード.gs` を新しいコードに貼り替える
4. 手順2で控えた値が新しいコードと違う場合は、控えた値に書き直す
   （新しいコードでは `SHEET_ID = '1ffkmHDt_sz1ZQ3ZB_fXIaJeFhuW0wSI7bqwMpC9Z33g'`、`TEAMS_WEBHOOK_URL = ''`）。
   書き直したかどうかを報告に含める
5. 保存。Ctrl+F で `CODE_VERSION = '2026-10-31'` が **1件**、`function buildGain_` が **1件** 見つかることを確かめる
6. 「デプロイを管理」→ 鉛筆 → 新バージョン → デプロイ
   - 権限の承認を求められたら、内容を報告したうえで「許可」して構いません
7. 確認：デプロイURLを開き、`"version":"2026-10-31"` と `"gain":true` が出ること
   ```
   https://script.google.com/macros/s/AKfycbwEclDIdJiNgdXOmveRvT-BJOVWc6FwyrpxWNrqHs1DB9xgx9Ijuix0qqQ5KyG-XlkF7w/exec
   ```
8. 確認：次のURLを開き、`"ok":true` と `"rows":[` と `"fighters":` が出ること
   ```
   https://script.google.com/macros/s/AKfycbwEclDIdJiNgdXOmveRvT-BJOVWc6FwyrpxWNrqHs1DB9xgx9Ijuix0qqQ5KyG-XlkF7w/exec?action=gainStats
   ```
9. 確認：記録先スプレッドシートに、シート「**獲得**」と「**ファイター**」ができていること（手順8で自動で作られます）
   - 「獲得」の1行目：`送信日時 / 獲得日 / 名前 / キャリア / 商品 / 件数 / メモ / 送信ID / DiscordメッセージID`
   - 「ファイター」の1行目：`名前 / キャラ / 更新日時`
   - 「日報」シートには触らない
10. 確認（見るだけ）：<https://sakusakusansan-star.github.io/sieg-portal/power.html> を開き、
    「読み込めませんでした」「準備中」ではなく、ファイターの画面が出ること

---

## 最後の報告

```
■ パートO 日報
  デプロイID一致：……／v__ → v__
  SHEET_ID・TEAMS_WEBHOOK_URL を書き直したか：……
  行数・1行目・最後の行・CODE_VERSION・buildGain_ の確認：……
  /exec の表示（version・gain）：……
  ?action=gainStats が ok:true か：……
  「獲得」「ファイター」シートができたか・1行目：……
  戦闘力の画面が出たか：……
  承認画面が出たか：……
■ エラーや想定外のこと（全文）
```
