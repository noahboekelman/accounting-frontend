"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import ChatInterface from "@/components/ChatInterface";
import PublicChat from "@/components/PublicChat";
import styles from "./page.module.css";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const [welcomeMessage, setWelcomeMessage] = useState<string>("");

  useEffect(() => {
    const welcome = searchParams.get("welcome");
    if (welcome === "company-created") {
      setWelcomeMessage("Welcome! Your company has been created successfully.");
    } else if (welcome === "company-skipped") {
      setWelcomeMessage(
        "Welcome! You can create or join a company anytime from the integrations menu."
      );
    }

    // Clear the welcome message after 5 seconds
    if (welcome) {
      const timer = setTimeout(() => setWelcomeMessage(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  // Show public chat for logged-out users
  if (!isAuthenticated) {
    return <PublicChat />;
  }

  // Show authenticated chat interface for logged-in users
  return (
    <>
      {welcomeMessage && (
        <div className={styles.welcomeMessage}>
          <span>🎉</span>
          <span>{welcomeMessage}</span>
          <button
            onClick={() => setWelcomeMessage("")}
            className={styles.closeWelcome}
          >
            ×
          </button>
        </div>
      )}
      <ChatInterface />
    </>
  );
}
