"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import chatSessionApi from "@/lib/chatSessionApi";
import type { ChatSessionResponse } from "@/lib/types/chatSession";
import { CompanySelector, IntegrationSelector } from "@/components";
import styles from "./Sidebar.module.css";

interface SidebarProps {
  selectedSessionId?: string;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  refreshTrigger?: number;
}

export default function Sidebar({ selectedSessionId, onSelectSession, onNewChat, refreshTrigger }: SidebarProps) {
  const router = useRouter();
  const { selectedCompany, selectedCompanyIntegrationId, logout, selectIntegration } = useAuth();
  const [sessions, setSessions] = useState<ChatSessionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [showIntegrationSelector, setShowIntegrationSelector] = useState(false);

  useEffect(() => {
    if (selectedCompany) {
      loadSessions();
    }
  }, [selectedCompany]);

  useEffect(() => {
    if (selectedCompany && refreshTrigger && refreshTrigger > 0) {
      console.log("Refreshing sessions in Sidebar");
      loadSessions();
    }
  }, [refreshTrigger]);

  const loadSessions = async () => {
    if (!selectedCompany) return;

    try {
      setLoading(true);
      setError(null);
      const response = await chatSessionApi.getSessions(selectedCompany.id);
      setSessions(response.sessions);
    } catch (err) {
      console.error("Failed to load chat sessions:", err);
      setError("Failed to load chats");
    } finally {
      setLoading(false);
    }
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

  const handleIntegrationSelected = (
    integrationId: string
  ) => {
    selectIntegration(integrationId);
    setShowIntegrationSelector(false);
  };

  return (
    <div className={styles.sidebar}>
      <CompanySelector
        isOpen={showCompanySelector}
        onClose={() => setShowCompanySelector(false)}
        canClose={true}
      />
      <IntegrationSelector
        isOpen={showIntegrationSelector}
        onClose={() => setShowIntegrationSelector(false)}
        canClose={true}
        onIntegrationSelected={handleIntegrationSelected}
      />

      {/* Top Navigation Section */}
      <div className={styles.navSection}>
        <button className={styles.newChatButton} onClick={onNewChat}>
          <span className={styles.plusIcon}>+</span>
          New chat
        </button>
        
        <nav className={styles.navLinks}>
          <button 
            className={styles.navLink}
            onClick={() => setShowCompanySelector(true)}
            title="Switch Company"
          >
            <span className={styles.navIcon}>🏢</span>
            {selectedCompany ? selectedCompany.name : "Select Company"}
          </button>
          <button 
            className={styles.navLink}
            onClick={() => setShowIntegrationSelector(true)}
            title="Manage Integrations"
          >
            <span className={styles.navIcon}>🔗</span>
            {selectedCompanyIntegrationId ? "Integration" : "Add Integration"}
          </button>
          <button 
            className={styles.navLink}
            onClick={logout}
            title="Sign Out"
          >
            <span className={styles.navIcon}>🚪</span>
            Sign Out
          </button>
        </nav>
      </div>

      {/* Chats Section */}
      <div className={styles.chatsSection}>
        <div className={styles.chatsSectionHeader}>
          <span className={styles.chatsSectionTitle}>Chats</span>
        </div>

        {selectedCompany ? (
          <>
            {loading && sessions.length === 0 && (
              <div className={styles.loading}>Loading...</div>
            )}

            {error && (
              <div className={styles.error}>
                {error}
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

            {!loading && !error && sessions.length === 0 && (
              <div className={styles.emptyState}>
                <p>No chats yet</p>
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <p>Select a company to view chats</p>
          </div>
        )}
      </div>
    </div>
  );
}
