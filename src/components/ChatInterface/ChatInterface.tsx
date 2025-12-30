"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import Sidebar from "@components/Sidebar";
import WelcomeView from "@components/WelcomeView";
import Message from "@components/Message";
import TodoDropdown from "@components/Todo/Todo";
import CompanySelector from "@components/CompanySelector";
import chatSessionApi from "@/lib/chatSessionApi";
import { callTriage } from "@lib/triageClient";
import type { Message as TriageMessage } from "@lib/triageClient";
import styles from "./ChatInterface.module.css";

export type ChatMessage = {
  id: string;
  author: "user" | "agent";
  text: string;
  timestamp: string;
};

export type TodoItem = {
  id: string;
  title: string;
  done?: boolean;
};

export type ChunkMetadata = {
  thread_id: string;
};

export type Chunk = {
  type: string;
  content: string;
  metadata: ChunkMetadata;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [todos, setTodos] = useState<Array<TodoItem>>([]);
  const [todoOpen, setTodoOpen] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { selectedCompany, selectedCompanyIntegrationId } = useAuth();
  const isAutoScrollingRef = useRef(true);
  const [sidebarRefreshTrigger, setSidebarRefreshTrigger] = useState(0);

  function scrollToBottom() {
    if (bottomRef.current) {
      try {
        bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        return;
      } catch {
        // fallback
      }
    }
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }

  function scrollToBottomImmediate() {
    if (bottomRef.current) {
      try {
        bottomRef.current.scrollIntoView({ behavior: "instant", block: "end" });
        return;
      } catch {
        // fallback
      }
    }
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }

  function appendAgentChunk(id: string, chunk: Chunk) {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, text: m.text + chunk.content } : m
      )
    );
    if (isAutoScrollingRef.current) {
      requestAnimationFrame(() => scrollToBottomImmediate());
    }
  }

  const handleSelectSession = useCallback(async (sessionId: string) => {
    if (sessionId === currentSessionId) return;
    setCurrentSessionId(sessionId);
    try {
      const sessionData = await chatSessionApi.getSessionWithMessages(
        sessionId
      );

      const loadedMessages: ChatMessage[] = sessionData.messages
        .filter((msg) => {
          const messageType = msg.message?.data?.type || msg.message?.type;
          return (
            (messageType === "human" || messageType === "ai") &&
            msg.message?.data?.content
          );
        })
        .map((msg) => {
          const messageData = msg.message.data;
          return {
            id: `msg-${msg.id}`,
            author: messageData.type === "human" ? "user" : "agent",
            text: messageData.content,
            timestamp: msg.created_at,
          };
        });

      setMessages(loadedMessages);
    } catch (err) {
      console.error("Failed to load session messages:", err);
    }
  }, []);

  const handleNewChat = useCallback(() => {
    setCurrentSessionId(null);
    setMessages([]);
  }, []);

  useEffect(() => {
    if (!selectedCompany) {
      setShowCompanySelector(true);
    }
  }, [selectedCompany]);

  useEffect(() => {
    // Clear messages and start new chat when company or integration changes
    setCurrentSessionId(null);
    setMessages([]);
  }, [selectedCompany?.id, selectedCompanyIntegrationId]);

  useEffect(() => {
    if (isAutoScrollingRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  useEffect(() => {
    const messagesContainer = listRef.current;
    if (!messagesContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainer;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      isAutoScrollingRef.current = isAtBottom;
    };

    messagesContainer.addEventListener("scroll", handleScroll);
    return () => messagesContainer.removeEventListener("scroll", handleScroll);
  }, []);

  async function handleSend(text: string) {
    if (!text.trim() || !selectedCompany) return;

    isAutoScrollingRef.current = true;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      author: "user",
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((s) => [...s, userMsg]);
    setInput("");

    requestAnimationFrame(() => scrollToBottom());

    const agentId = `a-${Date.now()}`;
    const agentMsg: ChatMessage = {
      id: agentId,
      author: "agent",
      text: "",
      timestamp: new Date().toISOString(),
    };
    setMessages((s) => [...s, agentMsg]);

    requestAnimationFrame(() => scrollToBottom());

    const triageMessages: TriageMessage[] = messages
      .map((m) => ({
        role: m.author === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }))
      .concat([{ role: "user", content: text.trim() }]);

    const onTodo = (data: string) => {
      try {
        data = data.replace("Updated todo list to ", "");
        const ev = JSON.parse(data);
        const normalizedContent = ev?.content.replace(/'/g, '"');
        const content = JSON.parse(normalizedContent);
        const tasks = content.map(
          (
            t: {
              title?: string;
              content?: string;
              name?: string;
              status?: string;
              done?: boolean;
            },
            index: number
          ) => ({
            id: String(index + 1),
            title: String(t.title ?? t.content ?? t.name ?? ""),
            done: t.status === "completed" || t.status === "done" || !!t.done,
          })
        );
        setTodos(tasks);
      } catch (err) {
        console.warn("Failed to parse todo_list event", err);
      }
    };

    const onChunk = (data: Chunk) => {
      try {
        if (data) {
          appendAgentChunk(agentId, data);
          // Capture session ID immediately from the first chunk if this is a new conversation
          if (data.metadata?.thread_id && !currentSessionId) {
            setCurrentSessionId(data.metadata.thread_id);
          }
        }
      } catch (err) {
        console.warn("Failed to parse assistant_chunk event", err);
      }
    };

    const onNewSession = (newSessionId: string) => {
      // This is called after stream ends to refresh the sidebar
      setSidebarRefreshTrigger((prev) => prev + 1);
    };

    const result = await callTriage(
      selectedCompany.id,
      triageMessages,
      onTodo,
      onChunk,
      onNewSession,
      currentSessionId || undefined,
      selectedCompanyIntegrationId
    );

    if (!result) {
      appendAgentChunk(agentId, {
        type: "error",
        content: "\n\n[Error receiving response]",
        metadata: { thread_id: "" },
      });
    }
  }

  function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    handleSend(input);
  }

  const hasActiveChat = currentSessionId !== null || messages.length > 0;

  return (
    <div className={styles.layout}>
      <Sidebar
        selectedSessionId={currentSessionId || undefined}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        refreshTrigger={sidebarRefreshTrigger}
      />

      <div className={styles.mainArea}>
        {!selectedCompany ? (
          <div className={styles.noCompanyMessage}>
            <div className={styles.noCompanyIcon}>🏢</div>
            <h3>Select a Company to Start</h3>
            <p>
              Please select a company to begin using the AI accounting
              assistant.
            </p>
            <button
              className={styles.selectCompanyBtn}
              onClick={() => setShowCompanySelector(true)}
            >
              Select Company
            </button>
          </div>
        ) : !hasActiveChat ? (
          <WelcomeView
            onSendMessage={handleSend}
            companyName={selectedCompany.name}
          />
        ) : (
          <div className={styles.chatContainer}>
            <header className={styles.header}>
              <div className={styles.headerLeft}>
                {selectedCompany && (
                  <div className={styles.companyInfo}>
                    <span className={styles.companyName}>
                      {selectedCompany.name}
                    </span>
                    <button
                      className={styles.changeCompanyBtn}
                      onClick={() => setShowCompanySelector(true)}
                      title="Change company"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>
              <div>
                <TodoDropdown
                  todo={todos}
                  currentStepId={currentTaskId}
                  open={todoOpen}
                  setOpen={setTodoOpen}
                />
              </div>
            </header>

            <div
              className={styles.messages}
              ref={listRef}
              role="log"
              aria-live="polite"
            >
              {messages.map((m) => (
                <Message key={m.id} message={m} />
              ))}
              <div ref={bottomRef} style={{ height: "1px" }} />
            </div>

            <form className={styles.composer} onSubmit={onSubmit}>
              <input
                className={styles.input}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message the triage agent..."
                aria-label="Message"
              />
              <button
                className={styles.send}
                type="submit"
                disabled={!input.trim()}
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>

      <CompanySelector
        isOpen={showCompanySelector}
        onClose={() => setShowCompanySelector(false)}
        canClose={!!selectedCompany}
      />
    </div>
  );
}
