import { Message, UploadResponse } from "./types";

const API_URL = "http://localhost:8002";

export async function uploadAndProcessPDF(
  file: File,
  chatId?: string,
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append("file", file);

  if (chatId) {
    formData.append("chat_id", chatId);
  }

  const response = await fetch(`${API_URL}/upload`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "PDF upload failed");
  }

  return data as UploadResponse;
}

export async function askQuestion(
  question: string,
  webSearch: boolean,
  chatId: string | null = null,
) {
  try {
    const response = await fetch(`${API_URL}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        web_search: webSearch,
        chat_id: chatId,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to ask question");
    }

    return response.body;
  } catch (error) {
    console.error("Error asking question:", error);
    throw error;
  }
}

// export async function createChat(
//   title: string,
// ): Promise<{ id: string; title: string }> {
//   const res = await fetch(`${API_URL}/chats`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ title }),
//   });
//   if (!res.ok) throw new Error("Failed to create chat");
//   return res.json();
// }

export async function getChats(): Promise<
  { id: string; title: string; created_at: string }[]
> {
  const res = await fetch(`${API_URL}/chats`);
  if (!res.ok) throw new Error("Failed to fetch chats");
  return res.json();
}

export async function getMessages(chatId: string): Promise<Message[]> {
  const response = await fetch(`${API_URL}/chats/${chatId}/messages`);
  if (!response.ok) throw new Error("Failed to fetch messages");
  return response.json();
}

export async function deleteChat(chatId: string) {
  const response = await fetch(`${API_URL}/chats/${chatId}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Failed to delete chat");
}
