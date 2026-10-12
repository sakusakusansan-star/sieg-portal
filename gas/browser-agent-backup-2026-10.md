# 【指示】GASのコードをGitHubに保存する（見るだけ・GASは変更しない）

あなたはブラウザを操作できるエージェントです。Googleアカウントと GitHub
（`sakusakusansan-star`）にログインした状態で、以下を実行してください。
**「絶対に守ること」を必ず先に読んでから着手してください。**

前回 Googleドキュメントに保存してもらったコードは、改行が消えたり途中で切れたり
していて、元に戻すのに使えませんでした。今回は **Apps Script の画面からコピーして、
GitHub の画面にそのまま貼り付けて** 保存します。

---

## 絶対に守ること

1. **Apps Script 側は見るだけ。** コードの編集・保存・デプロイ・関数の実行は一切しないこと。
2. **保存先は GitHub の `claude/wonderful-sagan-hp41el` ブランチだけ。**
   `main` ブランチには保存しないこと。
3. **秘密が入っていたら保存しないこと。** GitHub のこのリポジトリは公開されています。
   貼り付ける前に、Apps Script の画面で次の文字列を検索（Ctrl+F）し、
   **1件でも見つかったらそのファイルは保存せず、ファイル名と行番号だけ報告する**こと。
   - `discord.com/api/webhooks`
   - `AIza`
   - `hooks.slack.com`
   - `webhook.office.com`
   - `sk-`
   - `password`
4. **貼り付けたものが元と同じか必ず確かめる。** 前回、作業中にクリップボードの中身が
   別の文字に入れ替わったことがありました。保存前に下の「確認」を必ず行うこと。
5. 想定と違うことがあれば、勝手に判断せず止まって報告すること。

---

## 対象（4つのプロジェクト、計10ファイル）

プロジェクトは前回と同じです。開いたら「デプロイを管理」でデプロイIDが一致することを確かめてください。
（「移動経費かんたん計算」は同名のものが2つあります。**デプロイIDが一致する方**を使うこと）

| | 用途 | デプロイID（URLの `/s/` と `/exec` のあいだ） | 保存先リポジトリ |
|---|---|---|---|
| D-1 | 経費精算 | `AKfycbzyXEYU_0VhvEpnmZx3JWaxXRdOEP-Lam9R9Fxwv4nVRr6ExzQrBmdO-rgUlwGkcgzU` | `keihi23` |
| D-2 | 掲示板（お知らせ） | `AKfycbxA1xDkeYuLRSo39iZju6-RUirpwAQbou_WjYe2G0t7KAQJAEADPgl8-56FW9jWzSvT` | `notice-form` |
| D-3 | 移動費計算 | `AKfycbx7OrhZUR7VM2onLziSwo4gqZbk_f2eT4fQBXQKpMyvopzytcuCniiDWE5eDOEUlUJqjA` | `idohi-calc` |
| D-4 | シフト入力（パートナー様） | `AKfycbwx4-wjr4Qmx6zeXDXZhht-65W7veveJvaXXmC9V5MQLipOLxLoWfz-XEUBau8NZ58h` | `shift-form` |

保存するファイルと、GitHub上でのファイル名：

| Apps Script のファイル | GitHub に作るファイル |
|---|---|
| D-1 `コード.gs` | `keihi23` の `gas/Code.gs` |
| D-1 `analyzeReceipts.gs` | `keihi23` の `gas/analyzeReceipts.gs` |
| D-2 `コード.gs` | `notice-form` の `gas/Code.gs` |
| D-2 `NoticeDiscord.gs` | `notice-form` の `gas/NoticeDiscord.gs` |
| D-2 `NoticeWatch.gs` | `notice-form` の `gas/NoticeWatch.gs` |
| D-2 `NoticeDbg.gs` | `notice-form` の `gas/NoticeDbg.gs` |
| D-3 `コード.gs` | `idohi-calc` の `gas/Code.gs` |
| D-3 `index.html` | `idohi-calc` の `gas/index.html` |
| D-4 `コード.gs` | `shift-form` の `gas/Code.gs` |
| D-4 `Form.html` | `shift-form` の `gas/Form.html` |

（Apps Script 上のファイル名が少し違う場合は、近いものを選んで報告に書くこと）

---

## 1ファイルの保存手順

1. **Apps Script** で対象のファイルを開く
2. 「絶対に守ること」3. の文字列を検索する。見つかったらこのファイルは飛ばして報告
3. エディタの **最後の行の行番号** を控える（例：333）。あわせて **1行目** と **最後の行** の中身も控える
4. エディタの中をクリック → **Ctrl+A → Ctrl+C**（Macは ⌘A → ⌘C）
5. **GitHub** で次のURLを開く（`<リポジトリ>` と `<ファイル名>` を上の表のとおりに置き換える）
   ```
   https://github.com/sakusakusansan-star/<リポジトリ>/new/claude/wonderful-sagan-hp41el?filename=<ファイル名>
   ```
   例：`https://github.com/sakusakusansan-star/keihi23/new/claude/wonderful-sagan-hp41el?filename=gas/Code.gs`
6. ファイル名の欄が `gas/Code.gs` などになっていることを確かめる
7. 本文の欄をクリック → **Ctrl+V** で貼り付ける
8. **確認**（どれか1つでも合わなければ、貼り直す。2回続けて合わなければ止まって報告）
   - GitHub の編集画面の **最後の行番号** が、手順3で控えた行番号と同じ
     （最後に空行が1行増えるのは問題なし）
   - **1行目** と **最後の行** が、手順3で控えたものと同じ
   - 関係のない文章（メールの文面、URLだけの行など）が紛れ込んでいない
9. 「**Commit changes...**」を押す
   - コミットメッセージ：`GASのコードを保存（<ファイル名>）`
   - 「**Commit directly to the `claude/wonderful-sagan-hp41el` branch**」を選ぶ
     （「Create a new branch」は選ばない）
   - 「Commit changes」を押す
10. 保存後に開いたページのURLを控える

同じファイルがすでに存在すると言われた場合は、上書きせずに止まって報告してください。

---

## 最後の報告

```
■ D-1 経費精算
  gas/Code.gs            ：保存（済/飛ばした）／行数 Apps Script=___ GitHub=___／URL：……
  gas/analyzeReceipts.gs ：（同上）
■ D-2 掲示板
  gas/Code.gs / gas/NoticeDiscord.gs / gas/NoticeWatch.gs / gas/NoticeDbg.gs ：（同上）
■ D-3 移動費計算
  gas/Code.gs / gas/index.html ：（同上）
■ D-4 シフト入力（パートナー様）
  gas/Code.gs / gas/Form.html ：（同上）
■ 秘密の文字列が見つかったファイル（ファイル名と行番号だけ。中身は書かない）
■ エラーや想定外のこと（全文）
```
