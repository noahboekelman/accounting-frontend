"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "./Chat.module.css";
import Message from "@components/Message";
import TodoDropdown from "@components/Todo/Todo";
import { callTriage } from "@lib/triageClient";
import type { Message as TriageMessage } from "@lib/triageClient";

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
}

export type Chunk = {
  type: string;
  content: string;
  metadata: ChunkMetadata;
}

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const todoRef = useRef<Array<TodoItem>>([]);
  const [todoOpen, setTodoOpen] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<number | null>(null);

  useEffect(() => {
    // initial welcome
    setMessages([
      {
        id: "m-welcome",
        author: "agent",
        text: "Hej! I'm Ekonomichefen (triage agent). Ask me to review invoices, run workflows or summarize tasks.",
        timestamp: new Date().toISOString(),
      },
    ]);
  }, []);

  useEffect(() => {
    // scroll to bottom whenever messages change
    scrollToBottom();
  }, [messages]);

  function scrollToBottom() {
    // prefer using the sentinel for smooth scrolling
    if (bottomRef.current) {
      try {
        bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        return;
      } catch (_) {
        // fallback
      }
    }
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }

  function appendAgentChunk(id: string, chunk: Chunk) {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text: m.text + chunk.content } : m))
    );
    // ensure we scroll to show the latest chunk; schedule to let DOM update
    setTimeout(() => scrollToBottom(), 0);
  }

  async function handleSend(text: string) {
    if (!text.trim()) return;
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      author: "user",
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((s) => [...s, userMsg]);
    setInput("");

    // scroll after new user message
    setTimeout(() => scrollToBottom(), 0);

    // add placeholder agent message to stream into
    const agentId = `a-${Date.now()}`;
    const agentMsg: ChatMessage = {
      id: agentId,
      author: "agent",
      text: "",
      timestamp: new Date().toISOString(),
    };
    setMessages((s) => [...s, agentMsg]);

    // scroll to show the agent placeholder
    setTimeout(() => scrollToBottom(), 0);

    // prepare messages in triage format
    const triageMessages: TriageMessage[] = messages
      .map((m) => ({
        role: m.author === "user" ? ("user" as const) : ("assistant" as const),
        content: m.text,
      }))
      .concat([{ role: "user", content: text.trim() }]);

    const onTodo = (data: string) => {
      try {
        // Piece
        data = data.replace("Updated todo list to ", "");
        const ev = JSON.parse(data);
        const tasks = ev.tasks.map((t: any) => ({
          id: Number(t.id),
          title: String(t.title ?? t.name ?? ""),
          done: !!t.done,
        }));
        todoRef.current = tasks;
        console.log("Updated todo state: ", tasks);
      } catch (err) {
        console.warn("Failed to parse todo_list event", err);
      }
    };

    const onCurrentTask = (data: string) => {
      let id: number = -1;
      let title: string = "";
      try {
        const ev = JSON.parse(data);
        if (ev && typeof ev.id !== "undefined") {
          id = Number(ev.id);
          title =
            todoRef.current.find((t) => Number(t.id) === Number(id))?.title ??
            "";
        }
      } catch (err) {
        console.warn("failed to parse current_task", err);
      }
      if (id === -1) return console.warn("invalid current_task id:", data);
      setCurrentTaskId(id);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === agentId
            ? {
                ...m,
                text: m.text + `\n\n[${id} - ${title}]\n\n`,
              }
            : m
        )
      );
    };

    const onTaskDone = (data: string) => {
      let id: number = -1;
      try {
        const ev = JSON.parse(data);
        if (ev && typeof ev.id !== "undefined") {
          id = Number(ev.id);
        }
      } catch (err) {
        console.warn("failed to parse task_done", err);
      }
      if (id === -1) return console.warn("invalid task_done id:", data);
      todoRef.current = todoRef.current.map((t) =>
        Number(t.id) === Number(id) ? { ...t, done: true } : t
      );
      setCurrentTaskId(null);
    };

    const onChunk = (data: Chunk) => {
      try {
        if (data) appendAgentChunk(agentId, data);
      } catch (err) {
        console.warn("Failed to parse assistant_chunk event", err);
      }
    };

    const result = await callTriage(
      triageMessages,
      onTodo,
      onChunk,
      onCurrentTask,
      onTaskDone
    );

    if (!result) {
      appendAgentChunk(agentId, { type: "error", content: "\n\n[Error receiving response]", metadata: { thread_id: "" } });
      return;
    }

    return;
  }

  function onSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    handleSend(input);
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>AI Accounting — Chat</div>
        <div>
          <TodoDropdown
            todo={todoRef.current}
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
      </div>

      <form className={styles.composer} onSubmit={onSubmit}>
        <input
          className={styles.input}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Message the triage agent..."
          aria-label="Message"
        />
        <button className={styles.send} type="submit">
          Send
        </button>
      </form>
    </div>
  );
}
