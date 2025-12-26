import { Chunk } from "@/components/Chat/Chat";
import {
  getThreadIdFromSessionStorage,
  setThreadIdToSessionStorage,
} from "@/lib/utils";
import httpClient from "@/lib/httpClient";

type Message = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Very small SSE client tailored to your /stream GET that emits 'assistant_chunk' events.
 * Signature kept compatible with existing callers (messages param is ignored for this GET-based stream).
 *
 * Note: EventSource doesn't support custom headers or error handling for auth.
 * We verify/refresh auth before opening the connection to ensure valid cookies.
 */
export async function callTriage(
  companyId: string,
  messages: Message[],
  // callbacks
  onTodo: (data: string) => void,
  onChunk: (data: Chunk) => void,
  onCurrentTask: (data: string) => void,
  onTaskDone: (data: string) => void,
  sessionId?: string
) {
  if (typeof window === "undefined" || typeof EventSource === "undefined") {
    console.warn("SSE not available in this environment");
    return { cancel: () => {} };
  }

  // Verify authentication and refresh token if needed before opening SSE connection
  // This ensures we have valid cookies for the EventSource request
  try {
    await httpClient.get("/auth/me");
  } catch (error) {
    console.error("Authentication check failed before SSE connection:", error);
    throw new Error("Authentication required for streaming");
  }

  // Build URL using the same base as httpClient
  const baseURL =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
  const url = `${baseURL}/stream-llm-response`;

  // Send query param
  const queryParams = new URLSearchParams();
  queryParams.append("query", messages[messages.length - 1].content);
  queryParams.append("company_id", companyId);
  
  // Use session ID if provided, otherwise fall back to thread_id from session storage
  if (sessionId) {
    queryParams.append("thread_id", sessionId);
  } else {
    const threadId = getThreadIdFromSessionStorage();
    if (threadId) {
      queryParams.append("thread_id", threadId);
    }
  }
  
  const urlWithParams = `${url}?${queryParams.toString()}`;

  const es = new EventSource(urlWithParams, {
    withCredentials: true,
  });

  const onAssistantChunk = (e: MessageEvent) => {
    try {
      const type = e.type;
      const data = JSON.parse(e.data);
      if (data.metadata && data.metadata.thread_id) {
        setThreadIdToSessionStorage(data.metadata.thread_id);
      }
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
