"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import httpClient from "@/lib/httpClient";
import userApi, { UserCreateRequest } from "@/lib/userApi";
import { LoginRequest } from "@/lib/types/auth";

interface CompanyInfo {
  id: string;
  name: string;
  organization_number?: string;
  userRole: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedCompany: CompanyInfo | null;
  selectedIntegrationExternalId: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: UserCreateRequest) => Promise<void>;
  logout: () => Promise<void>;
  selectCompany: (company: CompanyInfo) => void;
  clearSelectedCompany: () => void;
  selectIntegration: (externalId: string) => void;
  clearSelectedIntegration: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage for instant UI (verified by API call)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("auth_state") === "authenticated";
    }
    return false;
  });

  const [selectedCompany, setSelectedCompany] = useState<CompanyInfo | null>(
    () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("selected_company");
        return saved ? JSON.parse(saved) : null;
      }
      return null;
    }
  );

  const [selectedIntegrationExternalId, setSelectedIntegrationExternalId] =
    useState<string | null>(() => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("selected_integration_id");
        return saved || null;
      }
      return null;
    });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication status by making a request to a protected endpoint
    // or a dedicated /auth/me endpoint if available
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      // Try to make a request - if cookies are valid, it will succeed
      // skipAuthRedirect prevents automatic redirect to login on failure
      await httpClient.get("/auth/me", {
        skipAuth: false,
        skipAuthRedirect: true,
      });
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_state", "authenticated");
      }
    } catch (error) {
      setIsAuthenticated(false);
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_state");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginRequest) => {
    try {
      // The response will set HTTP-only cookies automatically
      await httpClient.post("/auth/login", credentials, { skipAuth: true });
      setIsAuthenticated(true);
      if (typeof window !== "undefined") {
        localStorage.setItem("auth_state", "authenticated");
      }
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const register = async (userData: UserCreateRequest) => {
    try {
      await userApi.createUser(userData);

      // Auto-login after successful registration
      await login({ username: userData.username, password: userData.password });
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  };

  const selectCompany = (company: CompanyInfo) => {
    setSelectedCompany(company);
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_company", JSON.stringify(company));
    }
  };

  const clearSelectedCompany = () => {
    setSelectedCompany(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("selected_company");
    }
  };

  const selectIntegration = (externalId: string) => {
    setSelectedIntegrationExternalId(externalId);
    if (typeof window !== "undefined") {
      localStorage.setItem("selected_integration_id", externalId);
    }
  };

  const clearSelectedIntegration = () => {
    setSelectedIntegrationExternalId(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("selected_integration_id");
    }
  };

  const logout = async () => {
    try {
      // Call both logout endpoints to clear access and refresh tokens on server
      await Promise.all([
        httpClient.delete("/auth/logout", { skipAuth: false }),
        httpClient.delete("/auth/logout-refresh", { skipAuth: false }),
      ]);
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setIsAuthenticated(false);
      clearSelectedCompany();
      clearSelectedIntegration();
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth_state");
        window.location.href = "/";
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        selectedCompany,
        selectedIntegrationExternalId,
        login,
        register,
        logout,
        selectCompany,
        clearSelectedCompany,
        selectIntegration,
        clearSelectedIntegration,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
