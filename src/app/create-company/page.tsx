"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import companyApi, { CompanyCreateRequest } from "@/lib/companyApi";
import styles from "./CreateCompany.module.css";

interface CreateCompanyData {
  name: string;
  organization_number: string;
}

export default function CreateCompanyPage() {
  const [formData, setFormData] = useState<CreateCompanyData>({
    name: "",
    organization_number: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange =
    (field: keyof CreateCompanyData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!formData.name.trim()) {
      setError("Company name is required");
      setIsLoading(false);
      return;
    }

    try {
      const companyData: CompanyCreateRequest = {
        name: formData.name.trim(),
      };

      // Only include organization_number if provided
      if (formData.organization_number.trim()) {
        companyData.organization_number = formData.organization_number.trim();
      }

      await companyApi.createCompany(companyData);

      // Company created successfully, redirect to main app
      router.push("/?welcome=company-created");
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Skip company creation and go to main app
    router.push("/?welcome=company-skipped");
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.logoIcon}>💼</div>
          <h1 className={styles.title}>Create Your Company</h1>
          <p className={styles.subtitle}>
            Set up your company to start managing your accounting. You can
            always create or join a company later.
          </p>
        </div>

        <div className={styles.card}>
          <form onSubmit={handleSubmit} className={styles.form}>
            {error && (
              <div className={styles.error}>
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="name" className={styles.label}>
                Company Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={handleChange("name")}
                className={styles.input}
                placeholder="Enter your company name"
                required
                maxLength={255}
                disabled={isLoading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="organization_number" className={styles.label}>
                Organization Number{" "}
                <span className={styles.optional}>(optional)</span>
              </label>
              <input
                id="organization_number"
                type="text"
                value={formData.organization_number}
                onChange={handleChange("organization_number")}
                className={styles.input}
                placeholder="Enter organization number"
                maxLength={50}
                disabled={isLoading}
              />
            </div>

            <div className={styles.buttonGroup}>
              <button
                type="submit"
                className={styles.createButton}
                disabled={isLoading}
              >
                {isLoading ? "Creating Company..." : "Create Company"}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                className={styles.skipButton}
                disabled={isLoading}
              >
                Skip for Now
              </button>
            </div>
          </form>

          <div className={styles.info}>
            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>👥</span>
              <div>
                <h4>Team Collaboration</h4>
                <p>
                  Invite team members to collaborate on your company&apos;s
                  accounting
                </p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>🔗</span>
              <div>
                <h4>Integrations</h4>
                <p>
                  Connect your accounting software and sync financial data
                  automatically
                </p>
              </div>
            </div>

            <div className={styles.infoItem}>
              <span className={styles.infoIcon}>📊</span>
              <div>
                <h4>Analytics</h4>
                <p>
                  Get insights and reports on your company&apos;s financial
                  performance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
