# 【指示】シフト送信API・掲示板のGASを貼り替えて再デプロイする（合言葉をなくす）

あなたはブラウザを操作できるエージェントです。Googleアカウントにログインした状態で、
以下の **パートN-1・N-2** を実行してください。
**「絶対に守ること」を必ず先に読んでから着手してください。**

これまで（パートA〜M）と同じ手順です。今回は、送信のときに確かめていた「合言葉」を使わないようにする修正です。

---

## 絶対に守ること

1. **「新しいデプロイ」を作らないこと。** 「デプロイを管理」→ 既存デプロイの鉛筆 →
   バージョン「新バージョン」→「デプロイ」で更新し、デプロイIDが変わっていないことを確かめる。
2. **貼り替えるのは各パートで指定した1ファイルだけ。** ほかのファイル・トリガー・スクリプト プロパティには触らない。
   - 掲示板は `NoticeDiscord.gs` / `NoticeWatch.gs` / `NoticeDiag.gs` に触らない
3. **貼り替える前に、今のバージョン番号を控えること**（戻すときに使う）。
4. **フォームから送信しないこと。** シフトの送信・取り消し、掲示板の投稿・編集・削除はしない
   （掲示板は投稿すると Discord に通知が飛びます）。関数の実行もしないこと。
5. 想定と違うことがあれば、勝手に判断せず止まって報告すること。

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

## パートN-1. シフト送信API（Sieg社員用）— `コード.gs`

独立したスクリプトです。プロジェクト名は「**Sieg シフト送信API**」のはずです
（<https://script.google.com/home> の「マイプロジェクト」から開く）。

**デプロイID：** `AKfycbz_aHJ4v0Q-s5_m_i7G7gomrJeicz_iRWPF1qcafrG16gQtTV8VA7dU2ViTNgcbtTgYTg`

**新しいコード（451行。1行目は `/**`、最後の行は `}`）：**
<https://raw.githubusercontent.com/sakusakusansan-star/sieg-portal/4383ae6cbc4b9859ca6079a5a8424657e7c2b82a/gas/shift-api.gs>

1. デプロイIDが一致することを確認し、今のバージョン番号を控える
2. `コード.gs` を新しいコードに貼り替えて保存
   - Ctrl+F で `CODE_VERSION = '2026-10-20'` が **1件**、`var TOKEN = '';` が **1件** 見つかることも確かめる
3. 「デプロイを管理」→ 鉛筆 → 新バージョン → デプロイ
   - 権限の承認を求められたら、内容を報告したうえで「許可」して構いません
4. 確認：次のURLを開き、`"version":"2026-10-20"` が出ること
   ```
   https://script.google.com/macros/s/AKfycbz_aHJ4v0Q-s5_m_i7G7gomrJeicz_iRWPF1qcafrG16gQtTV8VA7dU2ViTNgcbtTgYTg/exec?action=ping
   ```
5. 確認：次のURL（合言葉なしで読む）を開き、`"ok":true` が出ること。中身（シフトの内容）は報告に書かなくてよい
   ```
   https://script.google.com/macros/s/AKfycbz_aHJ4v0Q-s5_m_i7G7gomrJeicz_iRWPF1qcafrG16gQtTV8VA7dU2ViTNgcbtTgYTg/exec?action=months
   ```

---

## パートN-2. 掲示板（お知らせ）— `コード.gs`

**デプロイID：** `AKfycbxA1xDkeYuLRSo39iZju6-RUirpwAQbou_WjYe2G0t7KAQJAEADPgl8-56FW9jWzSvT`
（前回のパートFと同じプロジェクト）

**新しいコード（212行。1行目は `// ═══════════════════════════════════════════`、最後の行は `}`）：**
<https://raw.githubusercontent.com/sakusakusansan-star/notice-form/4bdbd45e43a8762b18c6d3d70e33384b1f7eaba1/gas/Code.gs>

1. デプロイIDが一致することを確認し、今のバージョン番号を控える（前回の報告では v10）
2. `コード.gs` を新しいコードに貼り替えて保存（ほかのファイルには触らない）
   - Ctrl+F で `CODE_VERSION = '2026-10-20'` が **1件**、`var NOTICE_TOKEN = '';` が **1件** 見つかることも確かめる
3. 「デプロイを管理」→ 鉛筆 → 新バージョン → デプロイ
4. 確認：デプロイURL（末尾 `/exec`）を開き、`"version":"2026-10-20"` と `"items"` が出ること
   ```
   https://script.google.com/macros/s/AKfycbxA1xDkeYuLRSo39iZju6-RUirpwAQbou_WjYe2G0t7KAQJAEADPgl8-56FW9jWzSvT/exec
   ```
5. 確認（見るだけ）：<https://sakusakusansan-star.github.io/sieg-portal/> の「お知らせ」タブに一覧が出ること

---

## 最後の報告

```
■ パートN-1 シフト送信API
  デプロイID一致：……／v__ → v__
  行数・1行目・最後の行・CODE_VERSION・TOKEN の確認：……
  ?action=ping の表示（version）：……／?action=months が ok:true か：……
  承認画面が出たか：……
■ パートN-2 掲示板
  デプロイID一致：……／v__ → v__
  行数・1行目・最後の行・CODE_VERSION・NOTICE_TOKEN の確認：……
  /exec の表示（version・items）：……／ポータルのお知らせ一覧：……
■ エラーや想定外のこと（全文）
```
