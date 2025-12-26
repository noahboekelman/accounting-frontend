export interface ChatMessageData {
  id: string;
  name: string | null;
  type: "human" | "ai" | "tool";
  content: string;
  tool_calls?: any[];
  usage_metadata?: Record<string, any>;
  additional_kwargs?: Record<string, any>;
  response_metadata?: Record<string, any>;
  status?: string;
  artifact?: any;
  tool_call_id?: string;
  invalid_tool_calls?: any[];
}

export interface ChatMessageResponse {
  id: number;
  session_id: string;
  message: {
    data: ChatMessageData;
    type: string;
  };
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
