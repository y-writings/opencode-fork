# SQLite Session History Plugin (PoC)

この PoC plugin は、ユーザープロンプトと LLM の最終出力を SQLite に時系列で保存します。

## 目的

- ユーザが入力したプロンプトを保存する
- ユーザの入力に対する LLM の最終出力を保存する
  - 親エージェントの最終出力
  - サブエージェントの最終出力
- 同一セッション判別のため `session_id` を保存する
- どのプロジェクトの会話か判別するため `project_id` と `project_directory` を保存する
- 時系列追跡のためミリ秒時刻と ISO 時刻を保存する

## 実装ファイル

- `packages/plugin/src/example-sqlite-session-history.ts`

## 保存先

- SQLite ファイル: `~/.opencode/prompt-history-poc.sqlite`（グローバル）

## テーブル

### `prompt_events`

- `session_id`
- `project_id`
- `project_directory`
- `user_message_id`
- `user_agent`
- `prompt_text`
- `created_at_ms`
- `created_at_iso`

### `assistant_results`

- `session_id`
- `project_id`
- `project_directory`
- `assistant_message_id` (UNIQUE)
- `parent_message_id`
- `assistant_agent`
- `agent_kind` (`parent` / `subagent` / `unknown`)
- `result_text`
- `created_at_ms`
- `completed_at_ms`
- `completed_at_iso`

## どのイベント後に保存するか（処理時系列）

1. `chat.message` hook 後
   - ユーザメッセージ受信時に `prompt_events` へ INSERT。
   - ここで prompt を保存。

2. `event: message.updated` 後（assistant）
   - assistant メッセージのメタ情報をメモリに保持。
   - `completed` があれば保存処理を試行。

3. `event: message.part.updated` 後
   - streaming 中の `text` part を message 単位で蓄積。
   - 既に completed 済み assistant なら保存処理を再試行。
   - `assistant_message_id` の競合時は UPSERT（UPDATE）するため、先に保存された部分テキストが最終テキストで上書きされる。

4. `event: session.idle` 後
   - 当該 `session_id` の assistant メッセージを最終 flush。
   - 取りこぼしを防ぐ。

## 親エージェント/サブエージェント判定

- `assistant.parentID` で紐づく user message を参照。
- `assistant.agent === user.agent` の場合は `parent`。
- それ以外は `subagent`。
- 親 user message が見つからない場合は `unknown`。

## 使い方（例）

`opencode.json` で plugin を読み込みます（ローカル plugin の例）。

```json
{
  "plugin": [
    "./packages/plugin/src/example-sqlite-session-history.ts"
  ]
}
```

PoC のため、まずは最小構成で INSERT と時系列保存に特化しています。
