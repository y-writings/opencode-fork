import path from "node:path"
import type { TuiPlugin, TuiCommand } from "@opencode-ai/plugin/tui"

type KeyflowConfig = {
  flows: {
    title: string
    value?: string
    description?: string
    category?: string
    keybind?: string
    commands: string[]
  }[]
}

const DEFAULT_CONFIG: KeyflowConfig = {
  flows: [
    {
      title: "Copy last assistant message and open editor",
      value: "keyflow.copy-last-and-open-editor",
      description: "Runs built-ins: copy last assistant message, then open editor",
      category: "Session",
      keybind: "ctrl+x y",
      commands: ["messages.copy", "prompt.editor"],
    },
  ],
}

function runSequence(api: Parameters<TuiPlugin>[0], commands: string[]) {
  commands.forEach((command, index) => {
    setTimeout(() => {
      api.command.trigger(command)
    }, index * 25)
  })
}

async function loadConfig(meta: Parameters<TuiPlugin>[2]) {
  const configPath = path.join(path.dirname(meta.target), "keyflow.json")
  const loaded = await Bun.file(configPath)
    .json()
    .catch(() => undefined)
  if (!loaded || typeof loaded !== "object") return DEFAULT_CONFIG
  if (!("flows" in loaded) || !Array.isArray(loaded.flows)) return DEFAULT_CONFIG
  const flows = loaded.flows.filter(
    (item): item is KeyflowConfig["flows"][number] =>
      !!item &&
      typeof item === "object" &&
      "title" in item &&
      typeof item.title === "string" &&
      "commands" in item &&
      Array.isArray(item.commands) &&
      item.commands.every((command) => typeof command === "string"),
  )
  if (!flows.length) return DEFAULT_CONFIG
  return { flows }
}

export const KeyflowPlugin: TuiPlugin = async (api, _options, meta) => {
  const config = await loadConfig(meta)
  const commands: TuiCommand[] = config.flows.map((flow, index) => ({
    title: flow.title,
    description: flow.description,
    category: flow.category ?? "Keyflow",
    value: flow.value ?? `keyflow.${index + 1}`,
    keybind: flow.keybind,
    onSelect: () => runSequence(api, flow.commands),
  }))

  api.command.register(() => commands)
}

export default {
  id: "keyflow",
  tui: KeyflowPlugin,
}
