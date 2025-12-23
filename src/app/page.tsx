"use client";

import { useAuth } from "@/lib/auth/AuthContext";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Chat from "@/components/Chat";
import PublicChat from "@/components/PublicChat";
import styles from "./page.module.css";

export default function Home() {
  const { isAuthenticated, isLoading, logout } = useAuth();
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

  // Show authenticated app for logged-in users
  return (
    <div className={styles.appContainer}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>💼</span>
            <span className={styles.logoText}>Accounting</span>
          </div>
          <div className={styles.headerActions}>
            <button
              onClick={() => window.open("/companies", "_self")}
              className={styles.companiesButton}
            >
              Companies
            </button>
            <button
              onClick={() =>
                window.open("/integrations/choose-provider", "_self")
              }
              className={styles.addIntegrationButton}
            >
              Add Integration
            </button>
            <button onClick={logout} className={styles.logoutButton}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

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

      <main className={styles.mainContent}>
        <Chat />
      </main>
    </div>
  );
}
