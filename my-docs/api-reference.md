# opencode プラグイン内部APIリファレンス

本ファイルは `@opencode-ai/plugin` の型定義と `opencode` 本体の呼び出しコードを基に記載。

## 2. 内部API リファレンス

## A. Server plugin エントリ

### Plugin

```ts
type Plugin = (input: PluginInput, options?: Record<string, unknown>) => Promise<Hooks>
```

### PluginModule（v1）

```ts
type PluginModule = {
  id?: string
  server: Plugin
  tui?: never
}
```

## B. PluginInput

```ts
type PluginInput = {
  client: ReturnType<typeof createOpencodeClient>
  project: Project
  directory: string
  worktree: string
  experimental_workspace: {
    register(type: string, adaptor: WorkspaceAdaptor): void
  }
  serverUrl: URL
  $: BunShell
}
```

### 主な用途

- `client`: opencode API 呼び出し
- `experimental_workspace.register`: workspace 拡張
- `$`: Bun shell 実行

## C. Hooks（Server）

### 実装されている hook 一覧（網羅）

1. `event(input: { event: Event })`
2. `config(input: Config)`
3. `tool: Record<string, ToolDefinition>`
4. `auth: AuthHook`
5. `provider: ProviderHook`
6. `chat.message(input, output)`
7. `chat.params(input, output)`
8. `chat.headers(input, output)`
9. `permission.ask(input, output)`
10. `command.execute.before(input, output)`
11. `tool.execute.before(input, output)`
12. `shell.env(input, output)`
13. `tool.execute.after(input, output)`
14. `experimental.chat.messages.transform(input, output)`
15. `experimental.chat.system.transform(input, output)`
16. `experimental.session.compacting(input, output)`
17. `experimental.compaction.autocontinue(input, output)`
18. `experimental.text.complete(input, output)`
19. `tool.definition(input, output)`

> 備考: `plugin.trigger(...)` は `(input, output)` 形式 hook を順次適用。`event`/`config`/`tool`/`auth`/`provider` は個別経路で利用。

## D. ToolDefinition API

```ts
tool({
  description: string,
  args: zod schema,
  async execute(args, context): Promise<string | {output: string; metadata?: object}>
})
```

### ToolContext

- `sessionID`, `messageID`, `agent`, `directory`, `worktree`, `abort`
- `metadata(...)`: 実行中メタ更新
- `ask(...)`: permission 質問

## E. AuthHook / ProviderHook

### AuthHook

- provider ごとの login method を追加
- method type: `oauth` / `api`
- prompt 定義（text/select + 条件）
- `loader` で認証済み情報を provider options に展開可能

### ProviderHook

```ts
type ProviderHook = {
  id: string
  models?: (provider, ctx:{auth?:Auth}) => Promise<Record<string, Model>>
}
```

- provider のモデル一覧を動的に上書きできる

## F. TUI plugin API

### TuiPlugin

```ts
type TuiPlugin = (api: TuiPluginApi, options: PluginOptions|undefined, meta: TuiPluginMeta) => Promise<void>
```

### 主要サブAPI

- `command.register/trigger/show`
- `route.register/navigate/current`
- `ui.Dialog*`, `ui.Slot`, `ui.Prompt`, `ui.toast`, `ui.dialog`
- `keybind.match/print/create`
- `state`, `kv`, `theme`, `client`, `event.on`
- `slots.register`
- `plugins.list/activate/deactivate/add/install`
- `lifecycle.signal`, `lifecycle.onDispose`

## G. 使用例（最小）

```ts
import { tool, type Plugin } from "@opencode-ai/plugin"

const plugin: Plugin = async () => ({
  tool: {
    hello: tool({
      description: "挨拶",
      args: { name: tool.schema.string() },
      async execute(args) {
        return `Hello ${args.name}`
      },
    }),
  },
})

export default { id: "example.hello", server: plugin }
```

