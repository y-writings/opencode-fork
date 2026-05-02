# opencode-keyflow

OpenCode TUI plugin that runs keybind-driven built-in command sequences.

## What it does

- reads `keyflow.json`
- registers each keyflow as a TUI command
- assigns a trigger key (`keybind`)
- executes listed built-in commands in order

## Configuration

Create `keyflow.json` next to the plugin entry file.

```json
{
  "flows": [
    {
      "title": "Copy last assistant message and open editor",
      "value": "keyflow.copy-last-and-open-editor",
      "keybind": "ctrl+x y",
      "commands": ["messages.copy", "prompt.editor"]
    }
  ]
}
```

### Fields

- `title`: shown in command palette
- `value`: command ID (optional)
- `description`: palette description (optional)
- `category`: palette category (optional)
- `keybind`: trigger key string (optional)
- `commands`: built-in command IDs to run in sequence


## Config file discovery

`keyflow.json` is resolved from the plugin directory, whether you load the plugin by directory path (for example `./my-plugin`) or by explicit entry file path (for example `./my-plugin/src/index.ts`).

## Usage

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["./my-plugin"]
}
```

Then run from command palette.
