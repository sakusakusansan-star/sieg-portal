# 【指示】GASの貼り替え・再デプロイと、GASコードの回収

あなたはブラウザを操作できるエージェントです。Googleアカウントにログインした状態で、
以下の **パートA〜D** を順番に実行してください。
**「絶対に守ること」を必ず先に読んでから着手してください。**

---

## 絶対に守ること

1. **「新しいデプロイ」を作らないこと。**
   各Webアプリのデプロイ URL は、公開中のフォームに書き込まれています。URLが変わるとフォームが止まります。
   - 必ず「**デプロイ**」→「**デプロイを管理**」→ 既存デプロイの **鉛筆（編集）** →
     バージョン「**新バージョン**」→「**デプロイ**」の手順で更新すること
   - 更新後に表示される URL が、この指示書に書いた URL と **一致すること** を必ず確かめること

2. **貼り替える前に、既存のコードを全文コピーして保管すること。**
   全文は最後の報告に含めてください（何かあったときに元へ戻すため）。

3. **パートDは「見るだけ」。** コードの変更・保存・デプロイは一切しないこと。

4. **次の操作はしないこと。** データが消えたり、Discordに投稿されたりします。
   - スプレッドシートのメニュー「月を更新」「初期設定」、関数 `updateMonth` / `initialSetup` / `setup` /
     `resetMonthWeb` / `checkDiscord` の実行
   - フォームからの送信（日報・シフト・経費・掲示板・交通費）
   - 共有設定、スクリプト プロパティ、トリガーの変更

5. **想定と違うときは止まって報告すること。**
   プロジェクトが見つからない、URLが一致しない、エラーが出た、などの場合は、
   勝手に判断して進めず、画面の内容（エラーは全文）を報告してください。

---

## 共通の手順：新しいコードの貼り付け方

新しいコードは GitHub に置いてあります。下の各パートにあるURLをブラウザで開くと、
コードだけが表示されます。

1. 新しいタブでコードのURLを開く
2. ページ上で **Ctrl+A → Ctrl+C**（Macは ⌘A → ⌘C）で全文コピー
3. Apps Script エディタで対象のファイルを開き、**Ctrl+A で全選択 → Ctrl+V で貼り付け**
4. 貼り付け後に次を確かめる
   - **1行目**と**最後の行**が、コードのページと同じであること
   - エディタの検索（Ctrl+F）で `CODE_VERSION = '2026-10-11'` が **1件** 見つかること
5. 保存（Ctrl+S、またはフロッピーのアイコン）
6. 保存時に赤いエラー表示が出たら止まって報告する

プロジェクトにファイルが複数ある場合は、**指示されたファイルだけ**を貼り替えてください。
ほかのファイルに同じ名前の関数（`doGet` / `doPost` など）があったら、止まって報告してください。

---

## 共通の手順：プロジェクトの見つけ方

- **スプレッドシートに紐づいたスクリプト**：そのスプレッドシートを開き、メニュー「拡張機能」→「Apps Script」
- **独立したスクリプト**：<https://script.google.com/home> の「マイプロジェクト」から開く

どちらの場合も、開いたら「デプロイ」→「デプロイを管理」で **デプロイID**
（URLの `/s/` と `/exec` のあいだの文字列）を見て、この指示書のURLと一致するプロジェクトかを確かめてください。
一致しなければ別のプロジェクトです。

---

## パートA. 交通費計算（2つのスプレッドシートに同じコード）

**同じコードを2つのスプレッドシートに貼ります。** どちらもスプレッドシートに紐づいたスクリプトです。

| | スプレッドシート名 | デプロイURL |
|---|---|---|
| A-1 | 稼働費計算_GAS版（福山・古川・清田） | `https://script.google.com/macros/s/AKfycbxp1cYnzgOMh4_ud5cEPJ7_b6qNFIm0YKt-sjFtBwXfeEHy_hMiZD0q2bPh-3vVOO15fA/exec` |
| A-2 | 山口_稼働費計算_GAS版（山口） | `https://script.google.com/macros/s/AKfycbwwALmDLzKteasiO0AMqAyRWsfb3p_AqgjkLZo-IBSctLDseudhes9hxJer7aGsdDkj/exec` |

スプレッドシートはGoogleドライブで名前を検索して開いてください。

**新しいコード：**
<https://raw.githubusercontent.com/sakusakusansan-star/commute-form/bfd6db1eaf57d9b19fcbca9743fda22c731ae04e/apps-script/commute-expense-sheet.gs>
（約1185行。1行目は `// ====…`、最後の関数は `exportCommuteSheetAsPdf`）

A-1、A-2 それぞれで次を行います。

1. スプレッドシートを開き「拡張機能」→「Apps Script」
2. 「デプロイを管理」でデプロイIDが上の表と一致することを確認
3. コードが書かれたファイル（通常は `コード.gs`）の **既存コードを全文コピーして保管**
4. 「共通の手順」で新しいコードに貼り替えて保存
   - A-2 は以前「山口さん専用」に書き換えたコードが入っています。それを**丸ごと**新しいコードに置き換えて構いません
     （新しいコードは、そのブックにシートがあるスタッフだけを自動で出します）
5. 「デプロイを管理」→ 鉛筆 → 新バージョン → デプロイ
   - 権限の承認を求められたら、内容を報告したうえで「許可」して構いません
6. 確認：デプロイURLをブラウザで直接開き、次のように表示されることを確かめる
   - `"status":"ready"` と `"version":"2026-10-11"` が含まれる
   - `"staff"` が、A-1 では `["福山康平","古川泰成","清田和男"]`、A-2 では `["山口真人"]`
   - 違う表示（ログイン画面、`Script function not found` など）なら止まって報告
7. 確認（見るだけ）：次のフォームを開き、上部に **「2026年10月」のように年と月が出る** ことを確かめる。
   **送信はしないこと。**
   - A-1：<https://sakusakusansan-star.github.io/commute-form/?staff=古川>
   - A-2：<https://sakusakusansan-star.github.io/commute-form/?staff=山口>

---

## パートB. 日報

**デプロイURL：**
`https://script.google.com/macros/s/AKfycbwEclDIdJiNgdXOmveRvT-BJOVWc6FwyrpxWNrqHs1DB9xgx9Ijuix0qqQ5KyG-XlkF7w/exec`

**記録先スプレッドシート：**
<https://docs.google.com/spreadsheets/d/1ffkmHDt_sz1ZQ3ZB_fXIaJeFhuW0wSI7bqwMpC9Z33g/edit>

**新しいコード：**
<https://raw.githubusercontent.com/sakusakusansan-star/nippou-form/7dcb6a0a405577a0f162edca1de88a87c9261baa/nippou-gas.gs>
（約439行。最後の関数は `buildReport_`）

1. プロジェクトを探す。まず上の記録先スプレッドシートの「拡張機能」→「Apps Script」を見て、
   デプロイIDが一致しなければ <https://script.google.com/home> から探す
2. **既存コードを全文コピーして保管**
3. 既存コードの先頭近くにある次の2行の値を控える
   ```
   var SHEET_ID = '……';
   var TEAMS_WEBHOOK_URL = '……';
   ```
4. 「共通の手順」で新しいコードに貼り替える
5. **手順3で控えた値が新しいコードと違う場合は、控えた値に書き直す**
   （新しいコードでは `SHEET_ID = '1ffkmHDt_sz1ZQ3ZB_fXIaJeFhuW0wSI7bqwMpC9Z33g'`、`TEAMS_WEBHOOK_URL = ''`）
   書き直したかどうかを報告に含める
6. 保存 →「デプロイを管理」→ 鉛筆 → 新バージョン → デプロイ
7. 確認：デプロイURLをブラウザで直接開き、`"status":"ready"` と `"version":"2026-10-11"` が出ることを確かめる
8. 記録先スプレッドシートの「日報」シートを開き、**N1セルが空なら** `送信ID` と入力する。
   N1に何か入っていたら書き換えずに、その内容を報告する
   - `setup` 関数は **実行しないこと**（見出しを上書きするため）
9. スクリプト プロパティの `DISCORD_WEBHOOK` は **触らないこと**（コードを貼り替えても消えません）

---

## パートC. シフト送信API（Sieg社員用）

独立したスクリプトです。プロジェクト名は「**Sieg シフト送信API**」のはずです。

**デプロイURL：**
`https://script.google.com/macros/s/AKfycbz_aHJ4v0Q-s5_m_i7G7gomrJeicz_iRWPF1qcafrG16gQtTV8VA7dU2ViTNgcbtTgYTg/exec`

**新しいコード：**
<https://raw.githubusercontent.com/sakusakusansan-star/sieg-portal/d22657ed86ae94ed86316787ff76ac05238caede/gas/shift-api.gs>
（約451行。最後の関数は `testFindRows`）

1. <https://script.google.com/home> から開き、デプロイIDが一致することを確認
2. **既存コードを全文コピーして保管**
3. 既存コードの設定部分の値を控える：`SHEET_ID`、`TOKEN`、`LOG_SHEET_NAME`、`ALLOW_STAFF`
4. 「共通の手順」で新しいコードに貼り替える
5. **手順3で控えた値が新しいコードと違う場合は、控えた値に書き直す**。書き直したかどうかを報告に含める
6. 保存
7. エディタ上部の関数選択で `testFindRows` を選んで「実行」し、**実行ログの全文** を控える
   （シートを読むだけの関数です。書き込みはしません）
   - ログに「見つかりません」が出たら、デプロイせずに止まって報告
8. 「デプロイを管理」→ 鉛筆 → 新バージョン → デプロイ
9. 確認：次のURLを開き、`"ok":true` と `"version":"2026-10-11"` が出ることを確かめる
   ```
   https://script.google.com/macros/s/AKfycbz_aHJ4v0Q-s5_m_i7G7gomrJeicz_iRWPF1qcafrG16gQtTV8VA7dU2ViTNgcbtTgYTg/exec?action=ping
   ```
10. 確認（見るだけ）：<https://sakusakusansan-star.github.io/sieg-portal/shift.html?staff=清田> を開き、
    月のボタンと「登録済み」の一覧が出ることを確かめる。**送信はしないこと。**

---

## パートD. GASコードの回収（見るだけ・変更禁止）

次の4つのWebアプリは、GitHubにコードが残っていません。**コードを全文コピーして報告してください。**
編集・保存・デプロイは一切しないでください。

| | 用途 | デプロイURL | 探す場所のヒント |
|---|---|---|---|
| D-1 | 経費精算 | `https://script.google.com/macros/s/AKfycbzyXEYU_0VhvEpnmZx3JWaxXRdOEP-Lam9R9Fxwv4nVRr6ExzQrBmdO-rgUlwGkcgzU/exec` | 経費精算のスプレッドシートの「拡張機能」→「Apps Script」、または script.google.com |
| D-2 | 掲示板（お知らせ） | `https://script.google.com/macros/s/AKfycbxA1xDkeYuLRSo39iZju6-RUirpwAQbou_WjYe2G0t7KAQJAEADPgl8-56FW9jWzSvT/exec` | script.google.com、またはお知らせを記録しているスプレッドシート |
| D-3 | 移動費計算 | `https://script.google.com/macros/s/AKfycbx7OrhZUR7VM2onLziSwo4gqZbk_f2eT4fQBXQKpMyvopzytcuCniiDWE5eDOEUlUJqjA/exec` | script.google.com、または移動費を記録しているスプレッドシート |
| D-4 | シフト入力（パートナー様） | `https://script.google.com/macros/s/AKfycbwx4-wjr4Qmx6zeXDXZhht-65W7veveJvaXXmC9V5MQLipOLxLoWfz-XEUBau8NZ58h/exec` | シフト表 <https://docs.google.com/spreadsheets/d/1wRBlTC_U2Mek5xj1YDFUEuAdRRlcVGZGIy_3WmmJLsQ/edit> の「拡張機能」→「Apps Script」 |

それぞれ次を報告してください。

1. プロジェクト名と、紐づいているスプレッドシート名（独立したスクリプトならその旨）
2. デプロイIDが上の表と一致したか
3. **全ファイルのコード全文**（ファイルごとに、ファイル名を見出しにしてコードブロックで）
4. 「プロジェクトの設定」→「スクリプト プロパティ」の **名前だけ**
   （**値は絶対に報告しないこと**。APIキーなどの秘密が入っています）
5. 「トリガー」画面に登録されているトリガーの一覧（関数名・種類）

見つからないものがあれば、探した場所を書いて「見つからない」と報告してください。

---

## 最後の報告

次の形でまとめて報告してください。

```
■ パートA 交通費計算
  A-1：デプロイID一致（はい/いいえ）／貼り替え（済/未）／/exec の表示：……／フォームの年月表示：……
  A-2：（同上）
  承認画面が出たか：……
■ パートB 日報
  デプロイID一致：……／SHEET_ID・TEAMS_WEBHOOK_URL を書き直したか：……
  /exec の表示：……／N1セル：……
■ パートC シフト送信API
  デプロイID一致：……／設定値を書き直したか：……
  testFindRows の実行ログ全文：……
  ?action=ping の表示：……／shift.html の表示：……
■ パートD 回収したコード
  D-1〜D-4 それぞれ：プロジェクト名、紐づくシート、デプロイID一致、コード全文、プロパティ名、トリガー
■ 貼り替え前に保管した既存コード（A-1、A-2、B、C の全文）
■ エラーや想定外のこと（全文）
```
