export interface Message {
  id?: string;
  chat_id?: string;
  role?: "user" | "ai";
  content?: string;
  created_at?: string;
}

export interface MessageListProps {
  messages: Message[];
  loading: boolean;
  historyLoading: boolean;
}

export interface ChatBoxProps {
  initialChatId?: string;
}

export type Chat = {
  id: string;
  title: string;
  created_at?: string;
};

export type UploadResponse = {
  status: "success";
  chunks_processed: number;
  chat_id: string;
};
