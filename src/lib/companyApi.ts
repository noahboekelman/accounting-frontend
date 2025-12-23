import httpClient from "./httpClient";

export interface CompanyCreateRequest {
  name: string;
  organization_number?: string;
}

export interface CompanyResponse {
  id: string;
  name: string;
  organization_number?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  detail: Array<{
    loc: string[];
    msg: string;
    type: string;
  }>;
}

class CompanyApi {
  /**
   * Create a new company
   */
  async createCompany(
    companyData: CompanyCreateRequest
  ): Promise<CompanyResponse> {
    try {
      const response = await httpClient.request<CompanyResponse>(
        "/companies/",
        {
          method: "POST",
          body: JSON.stringify(companyData),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      return response;
    } catch (error: unknown) {
      // Re-throw with better error handling
      if (error && typeof error === "object" && "response" in error) {
        const apiError = error as {
          response: { status: number; json: () => Promise<ApiError> };
        };
        if (apiError.response?.status === 422) {
          const errorData: ApiError = await apiError.response.json();
          const firstError = errorData.detail?.[0];
          if (firstError) {
            const fieldName = firstError.loc[firstError.loc.length - 1];
            throw new Error(`${fieldName}: ${firstError.msg}`);
          }
        } else if (apiError.response?.status === 400) {
          throw new Error("Company with this name already exists");
        }
      }
      throw new Error("Failed to create company. Please try again.");
    }
  }

  /**
   * Get company by ID
   */
  async getCompany(companyId: string): Promise<CompanyResponse> {
    return httpClient.request<CompanyResponse>(`/companies/${companyId}`, {
      method: "GET",
    });
  }

  /**
   * Update company
   */
  async updateCompany(
    companyId: string,
    companyData: Partial<CompanyCreateRequest>
  ): Promise<CompanyResponse> {
    return httpClient.request<CompanyResponse>(`/companies/${companyId}`, {
      method: "PUT",
      body: JSON.stringify(companyData),
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Delete company
   */
  async deleteCompany(companyId: string): Promise<void> {
    return httpClient.request<void>(`/companies/${companyId}`, {
      method: "DELETE",
    });
  }
}

export const companyApi = new CompanyApi();
export default companyApi;
