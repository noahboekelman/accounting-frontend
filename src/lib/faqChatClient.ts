/**
 * FAQ chat SSE client for public inquiries and frequently asked questions.
 * No authentication required - used for logged-out users.
 */

import { Chunk } from "@/components/ChatInterface/ChatInterface";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function streamFaqChat(
  message: string,
  onChunk: (data: Chunk) => void,
  onNewSession: (newSessionId: string) => void,
  sessionId?: string,
  onError?: (error: Error) => void
) {
  if (typeof window === "undefined" || typeof EventSource === "undefined") {
    console.warn("SSE not available in this environment");
    return { cancel: () => {} };
  }

  const url = `${API_BASE_URL}/stream-faq-chat`;
  const queryParams = new URLSearchParams();
  queryParams.append("message", message);
  if (sessionId) {
    queryParams.append("thread_id", sessionId);
  }
  
  const urlWithParams = `${url}?${queryParams.toString()}`;
  
  const es = new EventSource(urlWithParams);

  let threadId: string = "";

  const onAssistantChunk = (e: MessageEvent) => {
    try {
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

  const onDone = () => {
    console.log("SSE stream done");
    if (!sessionId && threadId) {
      console.log("New FAQ session created with ID:", threadId);
      setTimeout(() => {
        onNewSession(threadId);
      }, 2500);
    }
    try {
      es.close();
    } catch {}
  };

  const handleError = (ev: Event) => {
    console.error("SSE connection error", ev);
    if (onError) {
      onError(new Error('Connection to chat server failed'));
    }
    try {
      es.close();
    } catch {}
  };

  es.addEventListener("assistant_chunk", onAssistantChunk);
  es.addEventListener("done", onDone);
  es.addEventListener("error", handleError);

  const cancel = () => {
    try {
      es.close();
    } catch {}
  };

  return { cancel };
}
