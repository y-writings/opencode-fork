# AIモデル・プロバイダー別の挙動差異

## 6. プロバイダー別挙動差異（Anthropic / OpenAI / Google / xAI）

以下は `ProviderTransform` と `provider/provider.ts` の実装差分を中心に記載。

## 1) Anthropic

### 主な差異

- 空メッセージ/空 text part を除去（Anthropic 拒否対策）。
- `toolCallId` は英数/`_`/`-` のみへ scrub。
- assistant の `tool-call` と非tool content が混在する並びを再配置（`tool_use` / `tool_result` 制約回避）。
- キャッシュ指定は message/content に providerOptions 注入。
- reasoning variant は `thinking`/`effort` ベース。モデルにより adaptive (`low/medium/high/xhigh/max`)。

### plugin 開発への影響

- `chat.params` で provider options を追加する際、Anthropic の message 形式制約を壊さないこと。
- `experimental.chat.messages.transform` で content 並び替えを行う場合、tool call 順序を要注意。

## 2) OpenAI

### 主な差異

- provider custom loader は基本 `sdk.responses(modelID)` を使用。
- reasoning variant は `reasoningEffort`, `reasoningSummary`, `include` を使う。
- リリース日やモデルIDに応じ `minimal/none/xhigh` の可否が変動。
- `@ai-sdk/openai` 以外（互換 provider）では providerOptions key の remap が発生しうる。

### plugin 開発への影響

- `chat.headers` で独自ヘッダを追加しやすいが、Responses API 前提の挙動との差異に注意。
- `chat.params.output.options` に OpenAI 固有オプションを差し込む場合、対象 npm/provider key を確認。

## 3) Google（`@ai-sdk/google`, `@ai-sdk/google-vertex`）

### 主な差異

- reasoning は `thinkingConfig`（`includeThoughts`, `thinkingBudget`/`thinkingLevel`）中心。
- `gemini 2.5` 系は budget ベース、`3.1` 系は `low/medium/high` レベル対応。

### plugin 開発への影響

- `chat.params` で reasoning を一律 `reasoningEffort` として扱うと効かない可能性。
- モデルIDに応じて `thinkingBudget` と `thinkingLevel` を使い分ける必要。

## 4) xAI

### 主な差異

- provider custom loader は OpenAI と同様 `sdk.responses(modelID)` を使用。
- `@ai-sdk/xai` は reasoning effort を `low/medium/high` で展開。
- `grok-3-mini` は特別扱い（`reasoningEffort` または openrouter 経由では `reasoning.effort`）。

### plugin 開発への影響

- `chat.params` で effort を指定する場合、xAI 直結か openrouter 経由かで構造が異なる。

## 共通の注意点

1. **providerOptions key の remap**
   - 保存時 providerID と AI SDK 側 key が異なると変換される。
2. **入力モダリティ制約**
   - 非対応 modality（image/pdf/audio等）は text エラー化される。
3. **LiteLLM/Proxy 互換**
   - tool call 履歴があるのに tools 空だと拒否される経路があり、noop tool を注入する分岐あり。

## 要確認

- 各 provider の upstream API 変更により option 名や許容値が変化する可能性。
- `experimental` 系 hook と組み合わせた場合の provider 別副作用は追加検証が必要。

