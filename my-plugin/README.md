# opencode-plugin-copy-and-open-editor

OpenCode TUI plugin that adds a command to:

1. Copy the last assistant message (`messages.copy`)
2. Open editor (`prompt.editor`)

## Why this layout

This directory is intentionally self-contained so it can be moved to a separate repository without changes.

- independent `package.json`
- independent `tsconfig.json`
- source code under `src/`

## Usage (local)

Place this directory wherever you manage plugins, then load it from `tui.json`:

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["./my-plugin"]
}
```

## Triggering

Open command palette and run:

- `Copy last assistant message and open editor`

If needed, you can add a custom keybind by creating a separate plugin-level key handler.
