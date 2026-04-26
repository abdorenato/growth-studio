export type ChatChannel = "web" | "whatsapp_twilio" | "whatsapp_cloud" | "telegram";

export type ChatRole = "user" | "assistant" | "system";

export type ChatSession = {
  id: string;
  channel: ChatChannel;
  channel_user_id: string;
  user_id?: string | null;
  display_name?: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
  last_active_at?: string;
};

export type ChatMessage = {
  id?: string;
  session_id: string;
  role: ChatRole;
  content: string;
  created_at?: string;
};
