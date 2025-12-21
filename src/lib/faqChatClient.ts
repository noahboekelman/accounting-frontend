/**
 * FAQ chat SSE client for public inquiries and frequently asked questions.
 * No authentication required - used for logged-out users.
 */

export interface FaqChatChunk {
  content: string;
  metadata?: {
    conversation_id?: string;
  };
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function streamFaqChat(
  message: string,
  conversationId: string | null,
  onChunk: (data: FaqChatChunk) => void,
  onError?: (error: Error) => void
) {
  if (typeof window === "undefined" || typeof EventSource === "undefined") {
    console.warn("SSE not available in this environment");
    return { cancel: () => {} };
  }

  const url = `${API_BASE_URL}/stream-faq-chat`;
  const queryParams = new URLSearchParams();
  queryParams.append("message", message);
  if (conversationId) {
    queryParams.append("conversation_id", conversationId);
  }
  
  const urlWithParams = `${url}?${queryParams.toString()}`;
  
  const es = new EventSource(urlWithParams);

  const onMessage = (e: MessageEvent) => {
    try {
      const data = JSON.parse(e.data);
      onChunk(data);
    } catch (err) {
      console.warn("Failed to parse message event", err);
      try {
        es.close();
      } catch {}
    }
  };

  const onDone = () => {
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

  es.addEventListener("message", onMessage);
  es.addEventListener("done", onDone);
  es.addEventListener("error", handleError);

  const cancel = () => {
    try {
      es.close();
    } catch {}
  };

  return { cancel };
}
