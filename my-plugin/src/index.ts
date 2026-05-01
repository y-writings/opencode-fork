import path from "node:path"
import type { TuiPlugin, TuiCommand } from "@opencode-ai/plugin/tui"

type WorkflowConfig = {
  workflows: {
    title: string
    value?: string
    description?: string
    category?: string
    trigger?: string
    commands: string[]
  }[]
}

const DEFAULT_CONFIG: WorkflowConfig = {
  workflows: [
    {
      title: "Copy last assistant message and open editor",
      value: "workflow.copy-last-and-open-editor",
      description: "Runs built-ins: copy last assistant message, then open editor",
      category: "Session",
      trigger: "ctrl+x y",
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
  const configPath = path.join(path.dirname(meta.target), "workflows.json")
  const loaded = await Bun.file(configPath)
    .json()
    .catch(() => undefined)
  if (!loaded || typeof loaded !== "object") return DEFAULT_CONFIG
  if (!("workflows" in loaded) || !Array.isArray(loaded.workflows)) return DEFAULT_CONFIG
  const workflows = loaded.workflows.filter(
    (item): item is WorkflowConfig["workflows"][number] =>
      !!item &&
      typeof item === "object" &&
      "title" in item &&
      typeof item.title === "string" &&
      "commands" in item &&
      Array.isArray(item.commands) &&
      item.commands.every((command) => typeof command === "string"),
  )
  if (!workflows.length) return DEFAULT_CONFIG
  return { workflows }
}

export const WorkflowPlugin: TuiPlugin = async (api, _options, meta) => {
  const config = await loadConfig(meta)
  const commands: TuiCommand[] = config.workflows.map((workflow, index) => ({
    title: workflow.title,
    description: workflow.description,
    category: workflow.category ?? "Workflow",
    value: workflow.value ?? `workflow.${index + 1}`,
    keybind: workflow.trigger,
    onSelect: () => runSequence(api, workflow.commands),
  }))

  api.command.register(() => commands)
}

export default {
  id: "workflow-plugin",
  tui: WorkflowPlugin,
}
