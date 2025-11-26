import { on } from "events";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

/**
 * Very small SSE client tailored to your /stream GET that emits 'assistant_chunk' events.
 * Signature kept compatible with existing callers (messages param is ignored for this GET-based stream).
 */
export async function callTriage(
  _messages: Message[],
  // callbacks
  onTodo: (data: string) => void,
  onChunk: (data: string) => void,
  onCurrentTask: (data: string) => void,
  onTaskDone: (data: string) => void
) {
  if (typeof window === "undefined" || typeof EventSource === "undefined") {
    console.warn("SSE not available in this environment");
    return { cancel: () => {} };
  }

  const url = `${API_BASE}/stream`;
  const es = new EventSource(url);

  const onAssistantChunk = (e: MessageEvent) => {
    try {
      const type = e.type;
      const data = e.data;
      if (type === "done") {
        try {
          es.close();
        } catch {}
      } else {
        onChunk(data);
      }
    } catch (err) {
      console.warn("Failed to parse assistant_chunk event", err);
      try {
        es.close();
      } catch {}
    }
  };

  es.addEventListener("assistant_chunk", onAssistantChunk);

  es.addEventListener("error", (ev) => {
    try {
      es.close();
    } catch {}
  });

  es.addEventListener("todo_list", (e) => onTodo(e.data));

  es.addEventListener("current_task", (e) => onCurrentTask(e.data));

  es.addEventListener("task_done", (e) => onTaskDone(e.data));

  const cancel = () => {
    try {
      es.close();
    } catch {}
  };

  return { cancel };
}

export type { Message };
