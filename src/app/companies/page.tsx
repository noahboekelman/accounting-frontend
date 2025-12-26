"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import companyApi, { CompanyResponse } from "@/lib/companyApi";
import styles from "./Companies.module.css";

export default function CompaniesPage() {
  const router = useRouter();
  const { selectedCompany, selectCompany } = useAuth();
  const [companies, setCompanies] = useState<CompanyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMyCompanies();
  }, []);

  const loadMyCompanies = async () => {
    try {
      setLoading(true);

      // Fetch companies for current user - already includes user role
      const companies = await companyApi.getMyCompanies();
      setCompanies(companies);
    } catch (err) {
      setError("Failed to load companies");
      console.error("Error loading companies:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompany = (company: CompanyResponse) => {
    const companyInfo = {
      id: company.id,
      name: company.name,
      organization_number: company.organization_number,
      userRole: company.user_role,
    };
    selectCompany(companyInfo);
    router.push("/"); // Navigate to home/chat after selecting
  };

  const handleManageCompany = (companyId: string) => {
    // Placeholder for future company management functionality
    console.log("Manage company:", companyId);
    // This will navigate to a company management page in the future
    // router.push(`/companies/${companyId}/manage`);
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "OWNER":
        return styles.roleOwner;
      case "ADMIN":
        return styles.roleAdmin;
      case "MEMBER":
        return styles.roleMember;
      case "VIEWER":
        return styles.roleViewer;
      default:
        return styles.roleMember;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading companies...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Companies</h1>
        <div className={styles.headerActions}>
          <button
            className={styles.backButton}
            onClick={() => router.push("/")}
          >
            ← Back to Chat
          </button>
          <button
            className={styles.createButton}
            onClick={() => router.push("/create-company")}
          >
            Create New Company
          </button>
        </div>
      </div>

      {companies.length === 0 ? (
        <div className={styles.empty}>
          <p>You are not associated with any companies yet.</p>
          <button
            className={styles.createButton}
            onClick={() => router.push("/create-company")}
          >
            Create Your First Company
          </button>
        </div>
      ) : (
        <div className={styles.companiesList}>
          {companies.map((company) => {
            const isSelected = selectedCompany?.id === company.id;
            return (
              <div
                key={company.id}
                className={`${styles.companyCard} ${
                  isSelected ? styles.selectedCard : ""
                }`}
              >
                <div className={styles.companyHeader}>
                  <div className={styles.companyInfo}>
                    <div className={styles.companyNameRow}>
                      <h2>{company.name}</h2>
                      {isSelected && (
                        <span className={styles.selectedBadge}>Selected</span>
                      )}
                    </div>
                    {company.organization_number && (
                      <p className={styles.orgNumber}>
                        Org. Number: {company.organization_number}
                      </p>
                    )}
                    <span
                      className={`${styles.roleBadge} ${getRoleBadgeClass(
                        company.user_role
                      )}`}
                    >
                      Your role: {company.user_role}
                    </span>
                  </div>
                  <div className={styles.companyActions}>
                    {!isSelected && (
                      <button
                        className={styles.selectButton}
                        onClick={() => handleSelectCompany(company)}
                      >
                        Select & Chat
                      </button>
                    )}
                    {company.user_role === "OWNER" && (
                      <button
                        className={styles.manageButton}
                        onClick={() => handleManageCompany(company.id)}
                      >
                        Manage Company
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles.companyDetails}>
                  <p className={styles.createdDate}>
                    Created: {new Date(company.created_at).toLocaleDateString()}
                  </p>
                  <p className={styles.companyId}>Company ID: {company.id}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
