import { Chunk } from "@/components/ChatInterface/ChatInterface";
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
  onNewSession: (newSessionId: string) => void,
  sessionId?: string,
  companyIntegrationId?: string | null
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

  // Add company integration ID if provided
  if (companyIntegrationId) {
    queryParams.append("company_integration_id", companyIntegrationId);
  }

  // Use session ID if provided, otherwise fall back to thread_id from session storage
  if (sessionId) {
    queryParams.append("thread_id", sessionId);
  }

  const urlWithParams = `${url}?${queryParams.toString()}`;

  const es = new EventSource(urlWithParams, {
    withCredentials: true,
  });

  let threadId: string = "";

  const onAssistantChunk = (e: MessageEvent) => {
    try {
      const type = e.type;
      const data = JSON.parse(e.data);

      if (data.metadata && data.metadata.thread_id) {
        if (!threadId) {
          threadId = data.metadata.thread_id;
        }
      }

      onChunk(data);
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

  es.addEventListener("done", () => {
    console.log("SSE stream done");
    if (!sessionId && threadId) {
      console.log("New session created with ID:", threadId);
      setTimeout(() => {
        onNewSession(threadId);
      }, 2500);
    }
    try {
      es.close();
    } catch {}
  });

  const cancel = () => {
    try {
      es.close();
    } catch {}
  };

  return { cancel };
}

export type { Message };
