"use client";

import Snowfall from "react-snowfall";
import { useAuth } from "@/lib/auth/AuthContext";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import ChatInterface from "@/components/ChatInterface";
import PublicChat from "@/components/PublicChat";
import { CompanySelector, IntegrationSelector } from "@/components";
import styles from "./page.module.css";

function HomeContent() {
  const { isAuthenticated, isLoading, selectedCompany, selectedCompanyIntegrationId, selectIntegration } = useAuth();
  const searchParams = useSearchParams();
  const [welcomeMessage, setWelcomeMessage] = useState<string>("");
  const [showCompanySelector, setShowCompanySelector] = useState(false);
  const [showIntegrationSelector, setShowIntegrationSelector] = useState(false);

  useEffect(() => {
    // Check if authenticated user needs to select company or integration
    if (!isLoading && isAuthenticated) {
      if (!selectedCompany) {
        setShowCompanySelector(true);
      } else if (!selectedCompanyIntegrationId) {
        setShowIntegrationSelector(true);
      }
    }
  }, [isLoading, isAuthenticated, selectedCompany, selectedCompanyIntegrationId]);

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

  const handleIntegrationSelected = (
    integrationId: string
  ) => {
    selectIntegration(integrationId);
    setShowIntegrationSelector(false);
  };

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
    <Snowfall
    snowflakeCount={50}
    />
      <CompanySelector
        isOpen={showCompanySelector}
        onClose={() => setShowCompanySelector(false)}
        canClose={false}
      />
      <IntegrationSelector
        isOpen={showIntegrationSelector}
        onClose={() => setShowIntegrationSelector(false)}
        canClose={false}
        onIntegrationSelected={handleIntegrationSelected}
      />

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

export default function Home() {
  return (
    <Suspense fallback={
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
