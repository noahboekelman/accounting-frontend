'use client';

import { useAuth } from "@/lib/auth/AuthContext";
import { useRouter } from "next/navigation";
import Chat from "@/components/Chat";
import styles from "./page.module.css";

export default function Home() {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>✨ Modern Accounting</div>
            <h1 className={styles.heroTitle}>
              Manage Your Finances with
              <span className={styles.gradient}> Intelligence</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Streamline your accounting workflow with our powerful, AI-assisted platform.
              Get insights, automate tasks, and stay organized.
            </p>
            <div className={styles.buttonGroup}>
              <button 
                onClick={() => router.push('/login')}
                className={styles.primaryButton}
              >
                Sign In
              </button>
              <button 
                onClick={() => router.push('/register')}
                className={styles.secondaryButton}
              >
                Get Started
              </button>
            </div>
          </div>
          
          <div className={styles.features}>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>📊</div>
              <h3 className={styles.featureTitle}>Smart Analytics</h3>
              <p className={styles.featureText}>
                Get real-time insights into your financial data
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🤖</div>
              <h3 className={styles.featureTitle}>AI Assistant</h3>
              <p className={styles.featureText}>
                Chat with your data and get instant answers
              </p>
            </div>
            <div className={styles.featureCard}>
              <div className={styles.featureIcon}>🔒</div>
              <h3 className={styles.featureTitle}>Secure & Reliable</h3>
              <p className={styles.featureText}>
                Enterprise-grade security for your peace of mind
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

