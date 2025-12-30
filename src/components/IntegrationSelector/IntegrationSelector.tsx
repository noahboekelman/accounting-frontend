import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import integrationApi, {
  CompanyIntegrationResponse,
  availableProviders,
} from "@/lib/integrationApi";
import styles from "./IntegrationSelector.module.css";

interface IntegrationSelectorProps {
  isOpen: boolean;
  onClose?: () => void;
  canClose?: boolean; // whether user can close without selecting
  onIntegrationSelected?: (integrationId: string) => void;
}

export default function IntegrationSelector({
  isOpen,
  onClose,
  canClose = false,
  onIntegrationSelected,
}: IntegrationSelectorProps) {
  const router = useRouter();
  const { selectedCompany } = useAuth();
  const [integrations, setIntegrations] = useState<
    CompanyIntegrationResponse[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && selectedCompany) {
      loadIntegrations();
    }
  }, [isOpen, selectedCompany]);

  const loadIntegrations = async () => {
    if (!selectedCompany) {
      setError("Please select a company first");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const integrations = await integrationApi.getIntegrationsByCompany(
        selectedCompany.id
      );
      setIntegrations(integrations);
    } catch (err) {
      console.error("Failed to load integrations:", err);
      setError("Failed to load integrations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectIntegration = (integration: CompanyIntegrationResponse) => {
    onIntegrationSelected?.(integration.id);
    onClose?.();
  };

  const handleAddNewIntegration = () => {
    router.push("/integrations/choose-provider");
  };

  const handleClose = () => {
    if (canClose) {
      onClose?.();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={handleClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Select Integration</h2>
          {canClose && (
            <button className={styles.closeButton} onClick={handleClose}>
              ×
            </button>
          )}
        </div>

        <div className={styles.content}>
          {!canClose && (
            <p className={styles.description}>
              Please choose which company integration you would like to use to proceed.
            </p>
          )}

          {!selectedCompany && (
            <div className={styles.warning}>
              <p>Please select a company first before setting up integrations.</p>
            </div>
          )}

          {loading && (
            <div className={styles.loading}>Loading integrations...</div>
          )}

          {error && (
            <div className={styles.error}>
              {error}
              <button className={styles.retryButton} onClick={loadIntegrations}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && selectedCompany && (
            <>
              {/* Existing Integrations */}
              {integrations.length > 0 ? (
                <div className={styles.section}>
                  <h3 className={styles.sectionTitle}>
                    Select an Integration
                  </h3>
                  <div className={styles.integrationList}>
                    {integrations.map((integration) => {
                      const provider = availableProviders.find(
                        (p) => p.id === integration.provider
                      );
                      return (
                        <button
                          key={integration.id}
                          className={styles.integrationItem}
                          onClick={() => handleSelectIntegration(integration)}
                        >
                          <div className={styles.integrationIcon}>
                            {provider?.logo || "🔗"}
                          </div>
                          <div className={styles.integrationInfo}>
                            <div className={styles.integrationName}>
                              {integration.external_company_name ||
                                provider?.name ||
                                integration.provider}
                            </div>
                            {integration.external_id && (
                              <div className={styles.integrationId}>
                                ID: {integration.external_id}
                              </div>
                            )}
                            <div className={styles.integrationProvider}>
                              {provider?.name || integration.provider}
                            </div>
                          </div>
                          <div className={styles.selectIcon}>→</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>No integrations found for this company.</p>
                  <p className={styles.emptyHint}>
                    Click the button below to add your first integration.
                  </p>
                </div>
              )}

              {/* Add New Integration Button */}
              <div className={styles.section}>
                <button
                  className={styles.addIntegrationButton}
                  onClick={handleAddNewIntegration}
                >
                  <span className={styles.addIcon}>+</span>
                  Add New Integration
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
