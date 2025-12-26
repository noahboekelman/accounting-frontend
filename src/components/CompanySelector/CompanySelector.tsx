import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import companyApi, { CompanyResponse } from "@/lib/companyApi";
import styles from "./CompanySelector.module.css";

interface CompanySelectorProps {
  isOpen: boolean;
  onClose?: () => void;
  canClose?: boolean; // whether user can close without selecting
}

export default function CompanySelector({ isOpen, onClose, canClose = false }: CompanySelectorProps) {
  const { selectCompany } = useAuth();
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen]);

  const loadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch companies for current user - already includes user role
      const companies = await companyApi.getMyCompanies();
      setCompanies(companies);
    } catch (err) {
      console.error("Failed to load companies:", err);
      setError("Failed to load companies. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = (company: CompanyResponse) => {
    selectCompany({
      id: company.id,
      name: company.name,
      organization_number: company.organization_number,
      userRole: company.user_role,
    });
    onClose?.();
    window.location.reload();
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
          <h2>Select a Company</h2>
          {canClose && (
            <button className={styles.closeButton} onClick={handleClose}>
              ×
            </button>
          )}
        </div>

        <div className={styles.content}>
          {!canClose && (
            <p className={styles.description}>
              Please select a company to continue using the chat.
            </p>
          )}

          {loading && (
            <div className={styles.loading}>Loading companies...</div>
          )}

          {error && (
            <div className={styles.error}>
              {error}
              <button 
                className={styles.retryButton} 
                onClick={loadCompanies}
              >
                Retry
              </button>
            </div>
          )}

          {!loading && !error && companies.length === 0 && (
            <div className={styles.empty}>
              <p>No companies found.</p>
              <p>
                <a href="/create-company" className={styles.createLink}>
                  Create a new company
                </a>
              </p>
            </div>
          )}

          {!loading && !error && companies.length > 0 && (
            <div className={styles.companyList}>
              {companies.map((company) => (
                <button
                  key={company.id}
                  className={styles.companyItem}
                  onClick={() => handleSelectCompany(company)}
                >
                  <div className={styles.companyInfo}>
                    <div className={styles.companyName}>{company.name}</div>
                    {company.organization_number && (
                      <div className={styles.companyNumber}>
                        Org. Nr: {company.organization_number}
                      </div>
                    )}
                    <div className={styles.companyRole}>Role: {company.user_role}</div>
                  </div>
                  <div className={styles.selectIcon}>→</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}