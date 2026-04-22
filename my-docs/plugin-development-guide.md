# opencode プラグイン開発ガイド

本書は、`opencode` リポジトリ実装（特に `packages/plugin` と `packages/opencode`）を基に、プラグイン開発者向けに整理した設計書です。

## 1. プラグイン開発言語の選択ガイド

### 結論（実装ベース）

- **実質的に第一選択は TypeScript / JavaScript**。
- ランタイムは **Bun** 前提（プラグイン入力で `Bun.$` を `$` として提供）。
- ローカルプラグイン（`file://`, 相対/絶対パス）では、ディレクトリ解決時に `index.ts`, `index.tsx`, `index.js`, `index.mjs`, `index.cjs` が探索対象。

### 対応状況

| 言語/形式 | 対応状況 | 推奨度 | 根拠 |
|---|---|---|---|
| TypeScript (`.ts`, `.tsx`) | ローカルプラグインで直接探索対象 | ◎ | `INDEX_FILES` に含まれる |
| JavaScript (`.js`, `.mjs`, `.cjs`) | ローカルプラグインで直接探索対象 | ◎ | `INDEX_FILES` に含まれる |
| npm パッケージ（server/tui export） | `package.json` の `exports["./server"]`, `exports["./tui"]` または `main`（server）で解決 | ◎ | `resolvePackageEntrypoint` 実装 |
| その他言語（Python/Rust等） | **直接実行の仕組みは未確認**。ただし tool 内で外部プロセス実行は可能 | △（要確認） | プラグイン本体は JS module import 前提 |

### エントリポイント規約

- v1 形式の推奨は **default export object**。
  - server 用: `{ id?: string, server: async (...) => hooks }`
  - tui 用: `{ id?: string, tui: async (...) => void }`
- server と tui の同時 export は禁止（読み込み時にエラー）。
- **path プラグインは `id` export 必須**。npm プラグインは未指定時に `package.json.name` へフォールバック。

## 3. プラグインの役割と責務

### opencode における位置づけ

プラグインは大きく 2 系統あります。

1. **Server プラグイン**
   - LLM 実行前後、ツール実行前後、permission 判定、system/messages 変換、provider/auth 追加などを担当。
2. **TUI プラグイン**
   - 画面拡張（slots/routes/dialog/UI）、コマンド追加、イベント購読、テーマ導入、有効/無効管理を担当。

### 担える機能範囲

- Server:
  - hook によるリクエスト/レスポンス変更（`chat.params`, `chat.headers`, `tool.definition` など）
  - 独自 tool 追加（`hooks.tool`）
  - provider 認証手段追加（`hooks.auth`）
  - provider モデル一覧の動的差し替え（`hooks.provider.models`）
  - 実行時イベント購読（`hooks.event`）
  - 実験機能の拡張（`experimental.*` hooks）
- TUI:
  - コマンド/ルート/スロットの登録
  - Event bus 受信
  - テーマ導入（`oc-themes`）
  - プラグイン管理 UI からの install/activate/deactivate/add

### 制約

- ロード順は決定的（deterministic）になるよう制御（順次適用）。
- `OPENCODE_PURE` 時は external plugins をスキップ。
- npm plugin には opencode バージョン互換チェック（`engines.opencode`）がかかる。
- file plugin は依存解決後に一度リトライ可能。

## 4. プラグインのライフサイクル

### Server プラグイン

1. **登録/発見**
   - config の `plugin` と `plugin_origins` を元に対象を決定。
   - built-in plugin も別途ロード。
2. **初期化**
   - `PluginInput`（`client`, `project`, `directory`, `worktree`, `experimental_workspace.register`, `serverUrl`, `$`）を渡して plugin 関数を実行。
   - 返却された `hooks` を state に保持。
3. **実行**
   - `plugin.trigger(name, input, output)` が順に hooks を呼ぶ（output はミュータブルに更新される設計）。
   - `event` hook は bus 全イベントを購読して逐次通知。
4. **破棄**
   - 明示的な `dispose` hook は server 側に実装なし（要確認）。

### TUI プラグイン

1. **登録/発見**
   - internal + external を解決し `PluginEntry` を生成。
   - plugin meta を touch して更新状態を判定。
2. **初期化（activate）**
   - `createPluginScope` で `AbortController` と dispose queue を生成。
   - `plugin(api, options, meta)` 実行。
3. **実行**
   - command/route/event/slot 等が有効化。
   - lifecycle `signal` と `onDispose` でリソース管理。
4. **破棄（deactivate/dispose）**
   - scope を abort し、登録済み dispose 関数を逆順実行（タイムアウト 5 秒）。

---

## 補足: workspace adaptor

server plugin は `experimental_workspace.register(type, adaptor)` で workspace adaptor を登録可能。

- `configure`, `create`, `remove`, `target` を実装。
- `target` は local/remote を返せる。

