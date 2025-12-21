'use client';

import { useAuth } from "@/lib/auth/AuthContext";
import Chat from "@/components/Chat";
import PublicChat from "@/components/PublicChat";
import styles from "./page.module.css";

export default function Home() {
  const { isAuthenticated, isLoading, logout } = useAuth();

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
          <button onClick={logout} className={styles.logoutButton}>
            Sign Out
          </button>
        </div>
      </header>
      <main className={styles.mainContent}>
        <Chat />
      </main>
    </div>
  );
}

