export interface ChatMessageResponse {
  id: number;
  session_id: string;
  message: Record<string, any>;
  created_at: string;
}

export interface ChatSessionResponse {
  user_id: string;
  company_id: string;
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionListResponse {
  sessions: ChatSessionResponse[];
  total: number;
}

export interface ChatSessionMessagesResponse {
  session_id: string;
  user_id: string;
  company_id: string;
  messages: ChatMessageResponse[];
  total_messages: number;
}
