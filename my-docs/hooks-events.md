# フック・イベント一覧

## 5. フック・イベント一覧

## A. Server Hook 一覧（介入可能ポイント）

| Hook名 | トリガー条件 | input | output（変更可） | 主用途 |
|---|---|---|---|---|
| `chat.message` | ユーザー入力をメッセージ化する直前 | session/agent/model/messageID等 | `{ message, parts }` | ユーザーメッセージ加工 |
| `chat.params` | LLM 呼び出し直前 | session/agent/model/provider/message | temperature/topP/topK/maxOutputTokens/options | 生成パラメータ調整 |
| `chat.headers` | LLM 呼び出し直前 | 上に同じ | `{ headers }` | provider向けヘッダ追加 |
| `command.execute.before` | slash/command 実行前 | command/sessionID/arguments | `{ parts }` | コマンド展開結果の調整 |
| `tool.execute.before` | tool 実行直前（builtin/mcp/task含む） | tool/sessionID/callID | `{ args }` | 引数補正・監査 |
| `tool.execute.after` | tool 実行直後 | tool/sessionID/callID/args | `{title, output, metadata, ...}` | 出力整形・メタ付与 |
| `tool.definition` | モデルへ渡す tool 定義生成時 | `{ toolID }` | `{ description, parameters }` | tool schema/説明調整 |
| `shell.env` | shell 実行前（pty, shell tool等） | cwd/sessionID?/callID? | `{ env }` | 環境変数注入 |
| `permission.ask` | 許可確認処理時 | Permission | `{ status: ask/deny/allow }` | 自動許可/拒否 |
| `experimental.chat.messages.transform` | model messages 化直前（通常/compaction） | `{}` | `{ messages }` | メッセージ列再構成 |
| `experimental.chat.system.transform` | system prompt 生成時 | sessionID?/model | `{ system }` | system prompt 拡張 |
| `experimental.session.compacting` | compaction 開始時 | sessionID | `{ context, prompt? }` | compaction prompt 拡張/置換 |
| `experimental.compaction.autocontinue` | compaction成功後自動 continue 判定時 | session/agent/model/... | `{ enabled }` | 自動継続の抑制 |
| `experimental.text.complete` | テキスト補完ポイント | sessionID/messageID/partID | `{ text }` | 補完挙動拡張 |
| `config` | plugin 初期化後、現行 config 通知時 | Config | なし | 初期設定の反映 |
| `event` | bus の全イベント受信時 | `{ event }` | なし | 監視/通知/副作用 |
| `tool` | plugin 初期化時 | なし | custom tools 登録 | 独自ツール追加 |
| `auth` | providers/login 系機能で参照 | なし | auth method 定義 | provider認証追加 |
| `provider` | provider 状態構築時 | なし | model loader | モデル一覧の差し替え |

## B. TUI Event Bus（`api.event.on`）

TUI plugin は `event.on(type, handler)` で購読。
`type` は SDK v2 の `Event["type"]` に一致。

### 実装上確認できる Event type（47件）

- `command.executed`
- `file.edited`
- `file.watcher.updated`
- `global.disposed`
- `installation.update-available`
- `installation.updated`
- `lsp.client.diagnostics`
- `lsp.updated`
- `mcp.browser.open.failed`
- `mcp.tools.changed`
- `message.part.delta`
- `message.part.removed`
- `message.part.updated`
- `message.removed`
- `message.updated`
- `permission.asked`
- `permission.replied`
- `project.updated`
- `pty.created`
- `pty.deleted`
- `pty.exited`
- `pty.updated`
- `question.asked`
- `question.rejected`
- `question.replied`
- `server.connected`
- `server.instance.disposed`
- `session.compacted`
- `session.created`
- `session.deleted`
- `session.diff`
- `session.error`
- `session.idle`
- `session.status`
- `session.updated`
- `todo.updated`
- `tui.command.execute`
- `tui.prompt.append`
- `tui.session.select`
- `tui.toast.show`
- `vcs.branch.updated`
- `workspace.failed`
- `workspace.ready`
- `workspace.restore`
- `workspace.status`
- `worktree.failed`
- `worktree.ready`

## C. 要確認事項

- `experimental.*` hook は今後破壊的変更の可能性あり（命名から実験機能扱い）。
- `event` hook は bus 全量購読のため、将来 Event type が増減する可能性あり。

