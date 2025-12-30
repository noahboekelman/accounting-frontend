import httpClient from "./httpClient";

export type IntegrationProvider = "FORTNOX";

export interface CompanyIntegrationResponse {
  id: string;
  company_id: string;
  provider: IntegrationProvider;
  external_id?: string | null;
  external_company_name?: string | null;
  access_token?: string | null;
  refresh_token?: string | null;
  expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Provider {
  id: IntegrationProvider;
  name: string;
  description: string;
  logo: string;
}

export const availableProviders: Provider[] = [
  {
    id: "FORTNOX",
    name: "Fortnox",
    description:
      "Connect your Fortnox accounting system to sync invoices, customers, and financial data",
    logo: "🏢",
  },
];

class IntegrationApi {
  /**
   * Get integrations for a specific company
   */
  async getIntegrationsByCompany(
    companyId: string
  ): Promise<CompanyIntegrationResponse[]> {
    return httpClient.request<CompanyIntegrationResponse[]>(
      `/company-integrations/company/${companyId}`,
      {
        method: "GET",
      }
    );
  }
}

const integrationApi = new IntegrationApi();
export default integrationApi;
