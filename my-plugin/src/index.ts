import type { TuiPlugin, TuiCommand } from "@opencode-ai/plugin/tui"

const COMMAND_VALUE = "my-plugin.copy-last-assistant-and-open-editor"

export const CopyAndOpenEditorPlugin: TuiPlugin = async (api) => {
  const command: TuiCommand = {
    title: "Copy last assistant message and open editor",
    description: "Runs built-ins: copy last assistant message, then open editor",
    value: COMMAND_VALUE,
    category: "Session",
    onSelect: () => {
      api.command.trigger("messages.copy")
      setTimeout(() => {
        api.command.trigger("prompt.editor")
      }, 10)
    },
  }

  api.command.register(() => [command])
}

export default {
  id: "copy-and-open-editor",
  tui: CopyAndOpenEditorPlugin,
}
