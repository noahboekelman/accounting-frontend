"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import httpClient from "@/lib/httpClient";
import styles from "./page.module.css";

type CallbackStatus = "processing" | "success" | "error";

export default function IntegrationCallbackPage() {
  const [status, setStatus] = useState<CallbackStatus>("processing");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isLoading && !isAuthenticated) {
      window.open("/login", "_self");
      return;
    }

    const handleCallback = async () => {
      const auth = searchParams.get("auth");
      const error = searchParams.get("error");

      if (error || auth === "error") {
        setStatus("error");
        setErrorMessage(error || "Integration failed. Please try again.");
        return;
      }

      if (auth === "success") {
        // Integration was successful - backend has processed the tokens
        setStatus("success");

        // Redirect to main page after showing success
        setTimeout(() => {
          window.open("/", "_self");
        }, 3000);
        return;
      }

      // If no auth parameter, show error
      setStatus("error");
      setErrorMessage(
        "Invalid callback parameters. Please try the integration again."
      );
    };

    if (!isLoading && isAuthenticated) {
      handleCallback();
    }
  }, [searchParams, isAuthenticated, isLoading]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.spinner}></div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {status === "processing" && (
          <div className={styles.statusCard}>
            <div className={styles.spinner}></div>
            <h2 className={styles.title}>Setting up your integration...</h2>
            <p className={styles.description}>
              Please wait while we connect to your Fortnox account and configure
              the integration.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className={styles.statusCard}>
            <div className={styles.successIcon}>✅</div>
            <h2 className={styles.title}>Integration successful!</h2>
            <p className={styles.description}>
              Your Fortnox account has been successfully connected. You can now
              sync your accounting data automatically.
            </p>
            <div className={styles.redirectMessage}>
              Redirecting you back to the dashboard...
            </div>
          </div>
        )}

        {status === "error" && (
          <div className={styles.statusCard}>
            <div className={styles.errorIcon}>❌</div>
            <h2 className={styles.title}>Integration failed</h2>
            <p className={styles.description}>
              {errorMessage ||
                "There was an error connecting your account. Please try again."}
            </p>
            <div className={styles.buttonGroup}>
              <button
                onClick={() =>
                  window.open("/integrations/choose-provider", "_self")
                }
                className={styles.retryButton}
              >
                Try Again
              </button>
              <button
                onClick={() => window.open("/", "_self")}
                className={styles.homeButton}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
