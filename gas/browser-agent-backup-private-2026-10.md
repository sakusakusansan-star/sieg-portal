# 【指示】非公開リポジトリを作り、GASのコードを保存する

あなたはブラウザを操作できるエージェントです。GitHub（`sakusakusansan-star`）と
Googleアカウントにログインした状態で、以下の **パートG〜J** を順番に実行してください。
**「絶対に守ること」を必ず先に読んでから着手してください。**

前回は公開リポジトリへの保存だったため止まりました。今回は **非公開（Private）** の
リポジトリを新しく作り、そこへ保存します。

---

## 絶対に守ること

1. **リポジトリは必ず「Private（非公開）」で作ること。** 作成後に、リポジトリ名の横に
   「Private」と表示されていることを確かめる。「Public」になっていたら、何も保存せずに止まって報告する。
2. **パートG〜Iでは Apps Script 側は見るだけ。** コードの編集・保存・デプロイ・関数の実行は一切しないこと。
   （パートJだけは掲示板の `コード.gs` を貼り替えて再デプロイする。**必ずパートIのあと**に行うこと）
3. **貼り付けたものが元と同じか必ず確かめる**（下の「確認」）。
4. 想定と違うことがあれば、勝手に判断せず止まって報告すること。

---

## パートG. 非公開リポジトリを作る

1. <https://github.com/new> を開く
2. 次のように設定する
   - Owner：`sakusakusansan-star`
   - Repository name：`sieg-gas-backup`
   - Description：`Sieg 業務ツールの Google Apps Script のコード控え（非公開）`
   - **Private** を選ぶ
   - 「Add a README file」に **チェックを入れる**（`main` ブランチが作られるようにするため）
3. 「Create repository」を押す
4. 開いたページで、リポジトリ名の横に **「Private」** と出ていることを確かめる

---

## パートH. Claude からこのリポジトリを読めるようにする

1. <https://github.com/settings/installations> を開く
2. 一覧の **Claude** の「Configure」を押す
3. 「Repository access」を見る
   - **「All repositories」** になっている → 何もしない
   - **「Only select repositories」** になっている → 「Select repositories」から
     `sieg-gas-backup` を追加し、「Save」を押す
4. どちらだったかを報告する

（Claude の一覧が見当たらない場合は、そのことを報告して先へ進んでください）

---

## パートI. GASのコードを保存する（10ファイル）

プロジェクトは前回と同じです。開いたら「デプロイを管理」でデプロイIDが一致することを確かめてください。
（「移動経費かんたん計算」は同名のものが2つあります。**デプロイIDが一致する方**を使うこと）

| Apps Script のファイル | デプロイID | `sieg-gas-backup` に作るファイル |
|---|---|---|
| 経費精算 `コード.gs` | `AKfycbzyXEYU_0Vhv…gzU` | `keihi/Code.gs` |
| 経費精算 `analyzeReceipts.gs` | （同上） | `keihi/analyzeReceipts.gs` |
| 掲示板 `コード.gs` | `AKfycbxA1xDkeYuLR…zvT` | `notice/Code.gs` |
| 掲示板 `NoticeDiscord.gs` | （同上） | `notice/NoticeDiscord.gs` |
| 掲示板 `NoticeWatch.gs` | （同上） | `notice/NoticeWatch.gs` |
| 掲示板 `NoticeDbg.gs` | （同上） | `notice/NoticeDbg.gs` |
| 移動費計算 `コード.gs` | `AKfycbx7OrhZUR7VM…jqA` | `idohi/Code.gs` |
| 移動費計算 `index.html` | （同上） | `idohi/index.html` |
| シフト入力（パートナー様）`コード.gs` | `AKfycbwx4-wjr4Qmx…58h` | `shift-form/Code.gs` |
| シフト入力（パートナー様）`Form.html` | （同上） | `shift-form/Form.html` |

（デプロイIDは前回の指示書と同じです。先頭と末尾だけ書いています）

### 秘密の文字列について

非公開リポジトリなので、前回見つかった次の2件はそのまま保存してよい
（どちらも説明や比較用の文字列で、本物のキーやURLではないことを確認済み）。

- `analyzeReceipts.gs` 18行目の `AIza`（APIキーの取り方を説明するコメント）
- `NoticeDbg.gs` 32・35行目の `discord.com/api/webhooks`（URLの形式を確かめる比較用の文字列）

**それ以外に** `discord.com/api/webhooks/` の後ろに数字や英字が続く本物のURL、`AIza` で始まる本物のキー、
`sk-` で始まるキーが見つかったら、そのファイルは保存せず、ファイル名と行番号だけ報告すること。

### 1ファイルの保存手順

1. Apps Script で対象のファイルを開き、**最後の行の行番号**、**1行目**、**最後の行** を控える
2. エディタの中をクリック → **Ctrl+A → Ctrl+C**
3. GitHub で次のURLを開く（`<ファイル名>` を表のとおりに置き換える）
   ```
   https://github.com/sakusakusansan-star/sieg-gas-backup/new/main?filename=<ファイル名>
   ```
   例：`https://github.com/sakusakusansan-star/sieg-gas-backup/new/main?filename=keihi/Code.gs`
4. ファイル名の欄が表のとおりになっていることを確かめる
5. 本文の欄をクリック → **Ctrl+V**
6. **確認**（合わなければ貼り直す。2回続けて合わなければ止まって報告）
   - 最後の行番号が手順1と同じ（最後に空行が1行増えるのは問題なし）
   - 1行目と最後の行が手順1と同じ
   - 関係のない文章が紛れ込んでいない
7. 「Commit changes...」→ メッセージ `GASのコードを保存（<ファイル名>）` →
   「Commit directly to the `main` branch」→「Commit changes」

---

## パートJ. 掲示板のGASを貼り替える（時刻表示の修正）

お知らせの「時間・場所」が `Sat Dec 30 1899 21:30:00 GMT+0900` と出る不具合の修正です。
**パートIで掲示板の4ファイルを保存し終えてから** 行うこと。

**デプロイID：** `AKfycbxA1xDkeYuLRSo39iZju6-RUirpwAQbou_WjYe2G0t7KAQJAEADPgl8-56FW9jWzSvT`

**新しいコード（214行。1行目は `// ═══…`、最後の行は `}`）：**
<https://raw.githubusercontent.com/sakusakusansan-star/notice-form/348574ae1e0cf1b571e5b0d1a8c8e07b7cfa1f62/gas/Code.gs>

1. 掲示板のプロジェクトで「デプロイを管理」を開き、今のバージョン番号を控える（前回の報告では v9）
2. 新しいコードのURLを開いて **Ctrl+A → Ctrl+C**、Apps Script の `コード.gs` で **Ctrl+A → Ctrl+V**
   - **貼り替えるのは `コード.gs` だけ。** ほかの3ファイル・トリガー・プロパティには触らない
3. 確かめる：最後の行番号が 214（末尾の空行で 215 は可）／1行目と最後の行がコードのページと同じ／
   Ctrl+F で `CODE_VERSION = '2026-10-12b'` が1件
4. 保存 →「デプロイを管理」→ 鉛筆 → 新バージョン → デプロイ（「新しいデプロイ」は作らない）
5. 確認：デプロイURLを開き、`"version":"2026-10-12b"` が出ること、
   「全体オンライン会議」の `time` が `21:30` のような形になっていることを確かめる
   ```
   https://script.google.com/macros/s/AKfycbxA1xDkeYuLRSo39iZju6-RUirpwAQbou_WjYe2G0t7KAQJAEADPgl8-56FW9jWzSvT/exec
   ```
6. 確認（見るだけ）：<https://sakusakusansan-star.github.io/sieg-portal/> の「お知らせ」タブで、
   時刻が `21:30` のように出ていること。**投稿・編集・削除はしないこと**

---

## 最後の報告

```
■ パートG リポジトリ作成：済／「Private」表示：あり・なし／URL：……
■ パートH Claude のアクセス：All repositories だった ／ select に追加した ／ 見当たらない
■ パートI 保存したファイル
  keihi/Code.gs            ：保存（済/飛ばした）／行数 Apps Script=___ GitHub=___
  keihi/analyzeReceipts.gs ：（同上）
  notice/Code.gs / notice/NoticeDiscord.gs / notice/NoticeWatch.gs / notice/NoticeDbg.gs ：（同上）
  idohi/Code.gs / idohi/index.html ：（同上）
  shift-form/Code.gs / shift-form/Form.html ：（同上）
■ 秘密の文字列が見つかったファイル（上の2件以外。ファイル名と行番号だけ）
■ パートJ 掲示板：v__ → v__／行数・CODE_VERSION の確認：……／/exec の time 表示：……／ポータルの表示：……
■ エラーや想定外のこと（全文）
```
