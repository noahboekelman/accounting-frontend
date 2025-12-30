"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import chatSessionApi from "@/lib/chatSessionApi";
import type { ChatSessionResponse } from "@/lib/types/chatSession";
import styles from "./Chats.module.css";

interface ChatsProps {
  selectedSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
}

export default function Chats({ selectedSessionId, onSelectSession, onNewChat }: ChatsProps) {
  const { selectedCompany, selectedCompanyIntegrationId } = useAuth();
  const [sessions, setSessions] = useState<ChatSessionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedCompany) {
      loadSessions();
    }
  }, [selectedCompany]);

  const loadSessions = async () => {
    if (!selectedCompany || !selectedCompanyIntegrationId) return;

    try {
      setLoading(true);
      setError(null);
      const response = await chatSessionApi.getSessions(selectedCompanyIntegrationId);
      setSessions(response.sessions);
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
      setError("Failed to load chats");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const handleDeleteSession = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm("Are you sure you want to delete this chat session?")) {
      return;
    }

    try {
      await chatSessionApi.deleteSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      
      if (selectedSessionId === sessionId) {
        onNewChat();
      }
    } catch (err) {
      console.error("Failed to delete chat session:", err);
      setError("Failed to delete chat");
    }
  };

  if (!selectedCompany) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <p>Select a company to view chats</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Chats</h2>
        <button className={styles.newChatButton} onClick={onNewChat} title="New chat">
          +
        </button>
      </div>

      {loading && sessions.length === 0 && (
        <div className={styles.loading}>Loading chats...</div>
      )}

      {error && (
        <div className={styles.error}>
          {error}
          <button className={styles.retryButton} onClick={loadSessions}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className={styles.emptyState}>
          <p>No chats yet</p>
          <button className={styles.startChatButton} onClick={onNewChat}>
            Start a new chat
          </button>
        </div>
      )}

      {sessions.length > 0 && (
        <div className={styles.sessionList}>
          {sessions.map((session) => (
            <div
              key={session.id}
              className={`${styles.sessionItem} ${
                selectedSessionId === session.id ? styles.selected : ""
              }`}
            >
              <button
                className={styles.sessionButton}
                onClick={() => onSelectSession(session.id)}
              >
                <div className={styles.sessionInfo}>
                  <div className={styles.sessionTitle}>
                    Chat Session
                  </div>
                  <div className={styles.sessionDate}>
                    {formatDate(session.updated_at)}
                  </div>
                </div>
              </button>
              <button
                className={styles.deleteButton}
                onClick={(e) => handleDeleteSession(session.id, e)}
                title="Delete chat"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
