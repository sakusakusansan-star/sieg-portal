# 【指示】経費精算・掲示板のGASを貼り替えて再デプロイする

あなたはブラウザを操作できるエージェントです。Googleアカウントにログインした状態で、
以下の **パートE・F** を実行してください。**「絶対に守ること」を必ず先に読んでから着手してください。**

前回（パートA〜C）と同じ手順です。今回はそれぞれ **`コード.gs` の1ファイルだけ** を貼り替えます。

---

## 絶対に守ること

1. **「新しいデプロイ」を作らないこと。** 「デプロイを管理」→ 既存デプロイの鉛筆 →
   バージョン「新バージョン」→「デプロイ」で更新し、URL（デプロイID）が変わっていないことを確かめる。
2. **貼り替えるのは `コード.gs` だけ。** 次のファイル・設定には触らないこと。
   - 経費精算：`analyzeReceipts.gs`、スクリプト プロパティ（`GEMINI_API_KEY` など）
   - 掲示板：`NoticeDiscord.gs` / `NoticeWatch.gs` / `NoticeDbg.gs`、スクリプト プロパティ、トリガー
3. **貼り替える前に、今のバージョン番号を控えること**（戻すときに使う）。
   既存コードの全文を報告する必要はありません（プロジェクト履歴から戻せるため）。
4. **フォームから送信しないこと。** 経費の登録・削除・月の切り替え・PDF保存、掲示板の投稿・編集・削除はしない。
   掲示板は投稿するとDiscordに通知が飛びます。関数の実行もしないこと。
5. **パートFは条件を満たしたときだけ行う**（下に書いた確認をしてから）。満たしていなければパートFは行わずに報告する。
6. 想定と違うことがあれば、勝手に判断せず止まって報告すること。

---

## 貼り付け方（前回と同じ）

1. 新しいタブで「新しいコード」のURLを開き、**Ctrl+A → Ctrl+C**
2. Apps Script で `コード.gs` を開き、**Ctrl+A → Ctrl+V**
3. 確かめる
   - 最後の行番号が、下に書いた行数と同じ（最後に空行が1行増えるのは問題なし）
   - 1行目と最後の行がコードのページと同じ
   - Ctrl+F で `CODE_VERSION = '2026-10-12'` が **1件** 見つかる
4. 保存（Ctrl+S）。赤いエラーが出たら止まって報告

---

## パートE. 経費精算

**デプロイID：** `AKfycbzyXEYU_0VhvEpnmZx3JWaxXRdOEP-Lam9R9Fxwv4nVRr6ExzQrBmdO-rgUlwGkcgzU`

**新しいコード（414行。1行目は `/**`、最後の行は `}`）：**
<https://raw.githubusercontent.com/sakusakusansan-star/keihi23/93e0ea0f946b05f187607da4b57ee9f4ba2bf5ee/gas/Code.gs>

1. 前回と同じプロジェクト（経費精算のスプレッドシートに紐づいたもの）を開き、デプロイIDが一致することを確認
2. 「デプロイを管理」で今のバージョン番号を控える（前回の報告では v5）
3. `コード.gs` を新しいコードに貼り替えて保存
4. 「デプロイを管理」→ 鉛筆 → 新バージョン → デプロイ
   - 権限の承認を求められたら、内容を報告したうえで「許可」して構いません
5. 確認：次のURLをブラウザで開き、`"status":"ready"`、`"version":"2026-10-12"`、
   `"staff":["福山","古川","清田"]` が出ることを確かめる
   ```
   https://script.google.com/macros/s/AKfycbzyXEYU_0VhvEpnmZx3JWaxXRdOEP-Lam9R9Fxwv4nVRr6ExzQrBmdO-rgUlwGkcgzU/exec
   ```
6. 確認（見るだけ）：<https://sakusakusansan-star.github.io/keihi23/?staff=清田> を開き、
   上部に「2026年10月」のような年月が出て、「履歴」タブに今月の一覧が出ることを確かめる。**送信・削除はしないこと。**

---

## パートF. 掲示板（お知らせ）

**条件：掲示板の新しい画面が公開されていること。**
新しいGASは投稿に「合言葉」を求めます。古い画面のまま新しいGASにすると、投稿できなくなります。

**確認方法：** <https://sakusakusansan-star.github.io/notice-form/> を開き、ページのソースを表示
（URLの先頭に `view-source:` を付けて開く）して、Ctrl+F で `sieg-notice-2026` を検索する。

- **見つかった** → パートFを進める
- **見つからない** → パートFは行わず、「掲示板の画面がまだ公開されていない」と報告する

**デプロイID：** `AKfycbxA1xDkeYuLRSo39iZju6-RUirpwAQbou_WjYe2G0t7KAQJAEADPgl8-56FW9jWzSvT`

**新しいコード（192行。1行目は `// ═══…`、最後の行は `}`）：**
<https://raw.githubusercontent.com/sakusakusansan-star/notice-form/53508c6aeb638ab22239915dbf15b59b2b7a610b/gas/Code.gs>

1. 前回と同じプロジェクトを開き、デプロイIDが一致することを確認
2. 「デプロイを管理」で今のバージョン番号を控える（前回の報告では v8）
3. `コード.gs` を新しいコードに貼り替えて保存（**ほかの3ファイルには触らない**）
4. 「デプロイを管理」→ 鉛筆 → 新バージョン → デプロイ
5. 確認：デプロイURLをブラウザで開き、`"ok":true` と `"version":"2026-10-12"` が出ることを確かめる
   ```
   https://script.google.com/macros/s/AKfycbxA1xDkeYuLRSo39iZju6-RUirpwAQbou_WjYe2G0t7KAQJAEADPgl8-56FW9jWzSvT/exec
   ```
6. 確認（見るだけ）：
   - <https://sakusakusansan-star.github.io/notice-form/> を開き、下の「投稿済み一覧」が出ること
   - <https://sakusakusansan-star.github.io/sieg-portal/> を開き、「お知らせ」タブに一覧が出ること
   - **投稿・編集・削除はしないこと**

---

## 最後の報告

```
■ パートE 経費精算
  デプロイID一致：……／貼り替え前のバージョン：v__ → 新しいバージョン：v__
  行数・1行目・最後の行・CODE_VERSION の確認：……
  /exec の表示：……
  フォーム（?staff=清田）の年月表示と履歴：……
  承認画面が出たか：……
■ パートF 掲示板
  画面の公開確認（sieg-notice-2026 が見つかったか）：……
  （進めた場合）デプロイID一致：……／v__ → v__／/exec の表示：……
  notice-form の一覧・ポータルのお知らせ表示：……
■ エラーや想定外のこと（全文）
```
