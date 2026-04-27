import { mkdir } from "node:fs/promises"
import { homedir } from "node:os"
import path from "node:path"
import { Database } from "bun:sqlite"

import type { Event, Part, UserMessage } from "@opencode-ai/sdk"
import type { Plugin } from "./index.js"

type AssistantRecord = {
  id: string
  sessionID: string
  parentID: string
  agent: string
  time: {
    created: number
    completed?: number
  }
}

function toAssistantRecord(event: Event): AssistantRecord | undefined {
  if (event.type !== "message.updated") return
  if (event.properties.info.role !== "assistant") return
  if (!("agent" in event.properties.info)) return
  const info = event.properties.info
  if (typeof info.agent !== "string") return
  return {
    id: info.id,
    sessionID: info.sessionID,
    parentID: info.parentID,
    agent: info.agent,
    time: info.time,
  }
}

function inferAgentKind(user: UserMessage | undefined, assistant: AssistantRecord) {
  if (!user) return "unknown"
  if (user.agent === assistant.agent) return "parent"
  return "subagent"
}

function textFromParts(parts: Map<string, Part>) {
  return [...parts.values()]
    .filter((part): part is Part & { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("\n")
}

export const SqliteSessionHistoryPlugin: Plugin = async (input) => {
  const dbPath = path.join(homedir(), ".opencode", "prompt-history-poc.sqlite")
  await mkdir(path.dirname(dbPath), { recursive: true })
  const db = new Database(dbPath, { create: true })
  db.exec(`
    CREATE TABLE IF NOT EXISTS prompt_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      project_directory TEXT NOT NULL,
      user_message_id TEXT NOT NULL,
      user_agent TEXT NOT NULL,
      prompt_text TEXT NOT NULL,
      created_at_ms INTEGER NOT NULL,
      created_at_iso TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS assistant_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      project_id TEXT NOT NULL,
      project_directory TEXT NOT NULL,
      assistant_message_id TEXT NOT NULL UNIQUE,
      parent_message_id TEXT NOT NULL,
      assistant_agent TEXT NOT NULL,
      agent_kind TEXT NOT NULL,
      result_text TEXT NOT NULL,
      created_at_ms INTEGER NOT NULL,
      completed_at_ms INTEGER,
      completed_at_iso TEXT
    );
  `)

  const insertPrompt = db.prepare(
    `INSERT INTO prompt_events (
      session_id,
      project_id,
      project_directory,
      user_message_id,
      user_agent,
      prompt_text,
      created_at_ms,
      created_at_iso
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )
  const insertAssistant = db.prepare(
    `INSERT INTO assistant_results (
      session_id,
      project_id,
      project_directory,
      assistant_message_id,
      parent_message_id,
      assistant_agent,
      agent_kind,
      result_text,
      created_at_ms,
      completed_at_ms,
      completed_at_iso
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(assistant_message_id) DO UPDATE SET
      session_id = excluded.session_id,
      project_id = excluded.project_id,
      project_directory = excluded.project_directory,
      parent_message_id = excluded.parent_message_id,
      assistant_agent = excluded.assistant_agent,
      agent_kind = excluded.agent_kind,
      result_text = excluded.result_text,
      created_at_ms = excluded.created_at_ms,
      completed_at_ms = excluded.completed_at_ms,
      completed_at_iso = excluded.completed_at_iso`
  )

  const userByMessageID = new Map<string, UserMessage>()
  const assistantByMessageID = new Map<string, AssistantRecord>()
  const partsByAssistantMessageID = new Map<string, Map<string, Part>>()

  const saveAssistantIfCompleted = (assistant: AssistantRecord) => {
    if (!assistant.time.completed) return
    const user = userByMessageID.get(assistant.parentID)
    insertAssistant.run(
      assistant.sessionID,
      input.project.id,
      input.directory,
      assistant.id,
      assistant.parentID,
      assistant.agent,
      inferAgentKind(user, assistant),
      textFromParts(partsByAssistantMessageID.get(assistant.id) ?? new Map()),
      assistant.time.created,
      assistant.time.completed,
      new Date(assistant.time.completed).toISOString(),
    )
  }

  return {
    "chat.message": async (_hookInput, output) => {
      userByMessageID.set(output.message.id, output.message)
      insertPrompt.run(
        output.message.sessionID,
        input.project.id,
        input.directory,
        output.message.id,
        output.message.agent,
        output.parts
          .filter((part): part is Part & { type: "text"; text: string } => part.type === "text")
          .map((part) => part.text)
          .join("\n"),
        output.message.time.created,
        new Date(output.message.time.created).toISOString(),
      )
    },
    event: async ({ event }: { event: Event }) => {
      const assistant = toAssistantRecord(event)
      if (assistant) {
        assistantByMessageID.set(assistant.id, assistant)
        saveAssistantIfCompleted(assistant)
        return
      }

      if (event.type === "message.updated" && event.properties.info.role === "user") {
        userByMessageID.set(event.properties.info.id, event.properties.info)
        return
      }

      if (event.type === "message.part.updated") {
        const bucket = partsByAssistantMessageID.get(event.properties.part.messageID) ?? new Map<string, Part>()
        bucket.set(event.properties.part.id, event.properties.part)
        partsByAssistantMessageID.set(event.properties.part.messageID, bucket)
        const linkedAssistant = assistantByMessageID.get(event.properties.part.messageID)
        if (!linkedAssistant) return
        saveAssistantIfCompleted(linkedAssistant)
        return
      }

      if (event.type !== "session.idle") return
      for (const linkedAssistant of assistantByMessageID.values()) {
        if (linkedAssistant.sessionID !== event.properties.sessionID) continue
        saveAssistantIfCompleted(linkedAssistant)
      }
    },
  }
}

export default SqliteSessionHistoryPlugin
