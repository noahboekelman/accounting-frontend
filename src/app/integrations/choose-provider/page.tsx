"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import styles from "./page.module.css";

interface Provider {
  id: string;
  name: string;
  description: string;
  logo: string;
}

const providers: Provider[] = [
  {
    id: "fortnox",
    name: "Fortnox",
    description:
      "Connect your Fortnox accounting system to sync invoices, customers, and financial data",
    logo: "🏢",
  },
];

export default function ChooseProviderPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      window.open("/login", "_self");
    }
  }, [isAuthenticated, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  // Return null if redirecting
  if (!isAuthenticated) {
    return null;
  }

  const handleProviderSelect = async (providerId: string) => {
    if (!providers.find((p) => p.id === providerId)?.id) {
      setError("Provider not supported yet");
      return;
    }

    setLoading(providerId);
    setError(null);

    // Navigate directly to the fortnox/login endpoint
    // The server will handle the redirect to Fortnox auth page
    const backendUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    const frontendCallbackUrl = `${window.location.origin}/integrations/callback`;
    window.open(
      `${backendUrl}/fortnox/login?frontend_url=${encodeURIComponent(
        frontendCallbackUrl
      )}`,
      "_self"
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* Header */}
        <header className={styles.header}>
          <button
            onClick={() => window.open("/", "_self")}
            className={styles.backButton}
          >
            ← Back
          </button>
          <h1 className={styles.title}>Choose Integration Provider</h1>
        </header>

        {/* Error message */}
        {error && <div className={styles.errorMessage}>{error}</div>}

        {/* Description */}
        <p className={styles.description}>
          Select an accounting system to integrate with your account. This will
          allow you to sync your financial data automatically.
        </p>

        {/* Provider grid */}
        <div className={styles.providerGrid}>
          {providers.map((provider) => (
            <div
              key={provider.id}
              className={`${styles.providerCard} ${
                loading === provider.id ? styles.loading : ""
              }`}
              onClick={() => handleProviderSelect(provider.id)}
            >
              <div className={styles.providerIcon}>{provider.logo}</div>
              <h3 className={styles.providerName}>{provider.name}</h3>
              <p className={styles.providerDescription}>
                {provider.description}
              </p>

              {loading === provider.id && (
                <div className={styles.providerLoading}>
                  <div className={styles.spinner}></div>
                  <span>Connecting...</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Coming soon section */}
        <div className={styles.comingSoon}>
          <h3 className={styles.comingSoonTitle}>More providers coming soon</h3>
          <p className={styles.comingSoonText}>
            We&apos;re working on adding support for more accounting systems
            like QuickBooks, Xero, and Sage.
          </p>
        </div>
      </div>
    </div>
  );
}
