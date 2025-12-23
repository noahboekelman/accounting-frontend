"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import httpClient from "@/lib/httpClient";
import styles from "./Companies.module.css";

interface CompanyResponse {
  id: string;
  name: string;
  organization_number?: string;
  created_at: string;
  updated_at: string;
}

interface CompanyUserResponse {
  id: string;
  company_id: string;
  user_id: string;
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
  created_at: string;
}

interface CompanyWithRole extends CompanyResponse {
  userRole: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
}

export default function CompaniesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<CompanyWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMyCompanies();
  }, []);

  const loadMyCompanies = async () => {
    try {
      setLoading(true);

      // Fetch companies for current user
      const myCompanies = await httpClient.request<CompanyResponse[]>(
        "/companies/my-companies",
        {
          method: "GET",
        }
      );

      // Get current user info to determine user ID
      const currentUser = await httpClient.request<{ id: string }>("/auth/me", {
        method: "GET",
      });

      // For each company, get the user's role
      const companiesWithRoles = await Promise.all(
        myCompanies.map(async (company) => {
          try {
            // Get user-company relationships for this user
            const userCompanies = await httpClient.request<
              CompanyUserResponse[]
            >(`/company-users/user/${currentUser.id}`, { method: "GET" });

            // Find the role for this specific company
            const userCompany = userCompanies.find(
              (uc) => uc.company_id === company.id
            );
            const userRole = userCompany?.role || "VIEWER";

            return {
              ...company,
              userRole,
            };
          } catch (error) {
            console.error(
              `Error getting role for company ${company.id}:`,
              error
            );
            return {
              ...company,
              userRole: "VIEWER" as const,
            };
          }
        })
      );

      setCompanies(companiesWithRoles);
    } catch (err) {
      setError("Failed to load companies");
      console.error("Error loading companies:", err);
    } finally {
      setLoading(false);
    }
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
        <button
          className={styles.createButton}
          onClick={() => router.push("/create-company")}
        >
          Create New Company
        </button>
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
          {companies.map((company) => (
            <div key={company.id} className={styles.companyCard}>
              <div className={styles.companyHeader}>
                <div className={styles.companyInfo}>
                  <h2>{company.name}</h2>
                  {company.organization_number && (
                    <p className={styles.orgNumber}>
                      Org. Number: {company.organization_number}
                    </p>
                  )}
                  <span
                    className={`${styles.roleBadge} ${getRoleBadgeClass(
                      company.userRole
                    )}`}
                  >
                    Your role: {company.userRole}
                  </span>
                </div>
                <div className={styles.companyActions}>
                  {company.userRole === "OWNER" && (
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
          ))}
        </div>
      )}
    </div>
  );
}
