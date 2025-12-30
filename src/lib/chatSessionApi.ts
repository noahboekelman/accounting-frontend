import httpClient from "./httpClient";
import type {
  ChatSessionListResponse,
  ChatSessionMessagesResponse,
} from "./types/chatSession";

class ChatSessionApi {
  /**
   * Get all chat sessions for the current user and specified company integration
   * 
   * @param companyIntegrationId - Company integration ID to filter sessions
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 100, max: 100)
   */
  async getSessions(
    companyIntegrationId: string,
    page: number = 1,
    limit: number = 100
  ): Promise<ChatSessionListResponse> {
    const params = new URLSearchParams({
      company_integration_id: companyIntegrationId,
      page: page.toString(),
      limit: limit.toString(),
    });

    return httpClient.request<ChatSessionListResponse>(
      `/chat-sessions/?${params.toString()}`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Get a chat session with all its messages
   * 
   * @param sessionId - Session ID
   */
  async getSessionWithMessages(
    sessionId: string
  ): Promise<ChatSessionMessagesResponse> {
    return httpClient.request<ChatSessionMessagesResponse>(
      `/chat-sessions/${sessionId}/messages`,
      {
        method: "GET",
      }
    );
  }

  /**
   * Delete a chat session
   * 
   * @param sessionId - Session ID to delete
   */
  async deleteSession(sessionId: string): Promise<void> {
    return httpClient.request<void>(
      `/chat-sessions/${sessionId}`,
      {
        method: "DELETE",
      }
    );
  }
}

export const chatSessionApi = new ChatSessionApi();
export default chatSessionApi;
