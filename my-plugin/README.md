# opencode-workflow-plugin

OpenCode TUI plugin that runs configurable built-in command sequences.

## What it does

- reads `workflows.json`
- registers each workflow as a TUI command
- optionally assigns a trigger key (`trigger`)
- executes listed built-in commands in order

## Configuration

Create `workflows.json` next to the plugin entry file.

```json
{
  "workflows": [
    {
      "title": "Copy last assistant message and open editor",
      "value": "workflow.copy-last-and-open-editor",
      "trigger": "ctrl+x y",
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
- `trigger`: keybind string (optional)
- `commands`: built-in command IDs to run in sequence

## Usage

```json
{
  "$schema": "https://opencode.ai/tui.json",
  "plugin": ["./my-plugin"]
}
```

Then run from command palette.
