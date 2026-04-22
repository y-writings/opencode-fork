# 開発者向け補足情報

## 7. 開発者向け補足情報

## ローカル開発セットアップ（実装ベース）

1. `opencode` 本体は plugin runtime で `@opencode-ai/plugin` を依存追加する設計（設定ロード時に依存導入処理）。
2. plugin の検出対象:
   - `.opencode/plugin/*.ts|js`
   - `.opencode/plugins/*.ts|js`
3. npm plugin は `resolvePluginTarget` で導入・解決。

## デバッグ方法

### Server plugin

- plugin ロード失敗時は `plugin` logger から stage 別に出力。
  - install / compatibility / entry / load
- plugin 起因の重大失敗は `Session.Event.Error` へ publish される経路あり。

### TUI plugin

- runtime 側 logger: `tui.plugin`
- activate/deactivate 失敗、dispose timeout（5秒）をコンソール+ログに出力。
- `plugins.list()` で enabled/active 状態を確認可能。

## テスト方法

- plugin 関連テストは `packages/opencode/test/plugin/*` に集約。
- 例:
  - `trigger.test.ts`（hook chain）
  - `loader-shared.test.ts`（entrypoint/id/compat）
  - `install*.test.ts`（manifest/config patch）
  - `workspace-adaptor.test.ts`（workspace 拡張）

## よくあるハマりポイントと対処

1. **path plugin に `id` が無い**
   - 症状: load 失敗
   - 対処: default export object に `id` を追加

2. **`server` と `tui` を同時 export**
   - 症状: readV1Plugin でエラー
   - 対処: 1モジュール1種別に分割

3. **package.json の export 設定不足**
   - 症状: `does not expose a server/tui entrypoint`
   - 対処: `exports["./server"]` / `exports["./tui"]` を明示

4. **互換バージョン不一致**
   - 症状: `Plugin requires opencode ...`
   - 対処: `engines.opencode` を実行バージョンへ合わせる

5. **OPENCODE_PURE 有効化**
   - 症状: external plugin が一切読み込まれない
   - 対処: pure mode を解除して再実行

## 主要参照ファイル

- `packages/plugin/src/index.ts`（Server Hook 型定義）
- `packages/plugin/src/tui.ts`（TUI API 型定義）
- `packages/plugin/src/tool.ts`（tool helper）
- `packages/opencode/src/plugin/index.ts`（server plugin runtime）
- `packages/opencode/src/plugin/loader.ts`（解決/ロードパイプライン）
- `packages/opencode/src/plugin/shared.ts`（entrypoint/id/compat）
- `packages/opencode/src/plugin/install.ts`（plugin install + config patch）
- `packages/opencode/src/cli/cmd/tui/plugin/runtime.ts`（tui plugin runtime）
- `packages/opencode/src/provider/provider.ts`（auth/provider hook 適用）
- `packages/opencode/src/provider/transform.ts`（provider別変換差異）
- `packages/opencode/src/session/prompt.ts`（主要 trigger 呼び出し）
- `packages/opencode/src/session/llm.ts`（chat.params/chat.headers）
- `packages/opencode/src/session/compaction.ts`（compaction hooks）
- `packages/sdk/js/src/v2/gen/types.gen.ts`（TUI event type の定義）

