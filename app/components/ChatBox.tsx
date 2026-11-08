"use client";

import { useRef, useState, useEffect } from "react";
import { uploadAndProcessPDF, askQuestion, getMessages } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import MessageList from "./MessageList";
import { Message, ChatBoxProps } from "@/lib/types";

export default function ChatBox({ initialChatId }: ChatBoxProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [webSearchActive, setWebSearchActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(
    initialChatId ?? null,
  );
  const [historyLoading, setHistoryLoading] = useState(Boolean(initialChatId));

  const fileInputRef = useRef<HTMLInputElement>(null);
  const aiMessageAddedRef = useRef(false);

  // Load conversation history when opening a chat
  useEffect(() => {
    if (!initialChatId) return;

    let cancelled = false;

    const loadChatMessages = async () => {
      try {
        const fetchedMessages = await getMessages(initialChatId);

        if (cancelled) return;

        const formattedMessages: Message[] = fetchedMessages.map((msg) => ({
          role: msg.role === "user" ? "user" : "ai",
          content: msg.content,
          id: msg.id,
          created_at: msg.created_at,
        }));

        setMessages(formattedMessages);
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load messages:", error);

        setMessages([
          {
            role: "ai",
            content: "Failed to load chat history. Please try again.",
          },
        ]);
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    };

    loadChatMessages();

    return () => {
      cancelled = true;
    };
  }, [initialChatId]);

  // Send a message and stream the AI response
  const handleSend = async () => {
    const question = inputText.trim();

    if (!question || loading || uploading || historyLoading) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);

    setInputText("");
    setLoading(true);
    aiMessageAddedRef.current = false;

    let aiText = "";
    let chatId = currentChatId ?? initialChatId ?? null;

    const isNewChat = !chatId;

    try {
      const stream = await askQuestion(question, webSearchActive, chatId);

      if (!stream) {
        throw new Error("No stream received");
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        let chunk = decoder.decode(value, { stream: true });

        if (!chatId && chunk.startsWith("CHAT_ID:")) {
          const lines = chunk.split("\n");

          chatId = lines[0].replace("CHAT_ID:", "").trim();

          setCurrentChatId(chatId);

          chunk = lines.slice(1).join("\n");
        } else if (chunk.startsWith("CHAT_ID:")) {
          chunk = chunk.split("\n").slice(1).join("\n");
        }

        if (!chunk) continue;

        aiText += chunk;

        if (!aiMessageAddedRef.current) {
          aiMessageAddedRef.current = true;

          setMessages((prev) => [...prev, { role: "ai", content: aiText }]);
        } else {
          setMessages((prev) => {
            const updated = [...prev];

            updated[updated.length - 1] = {
              role: "ai",
              content: aiText,
            };

            return updated;
          });
        }
      }

      // Flush any remaining decoded characters
      const remaining = decoder.decode();

      if (remaining) {
        aiText += remaining;

        setMessages((prev) => {
          const updated = [...prev];

          if (aiMessageAddedRef.current) {
            updated[updated.length - 1] = {
              role: "ai",
              content: aiText,
            };
          } else {
            aiMessageAddedRef.current = true;
            updated.push({ role: "ai", content: aiText });
          }

          return updated;
        });
      }

      // Navigate only after streaming finishes
      if (isNewChat && chatId) {
        router.replace(`/chats/${chatId}`);
      }
    } catch (error) {
      console.error("Error:", error);

      if (!aiMessageAddedRef.current) {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: "Sorry, something went wrong.",
          },
        ]);
      } else {
        setMessages((prev) => {
          const updated = [...prev];

          updated[updated.length - 1] = {
            role: "ai",
            content: aiText || "Sorry, something went wrong.",
          };

          return updated;
        });
      }

      toast.error("Failed to get AI response.");
    } finally {
      setLoading(false);

      // Refresh sidebar
      window.dispatchEvent(new CustomEvent("new-chat-created"));
    }
  };

  // Toggle web search
  const handleWebSearch = () => {
    setWebSearchActive((prev) => !prev);
  };

  // Open file picker
  const handleButtonClick = () => {
    if (!loading && !uploading && !historyLoading) {
      fileInputRef.current?.click();
    }
  };

  // Handle Enter key
  const enterKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  // Upload and process PDF
  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file || uploading || loading || historyLoading) return;

    setUploading(true);

    // Reuse the current chat or create a new one
    const activeChatId = currentChatId ?? initialChatId ?? null;

    const uploadPromise = uploadAndProcessPDF(
      file,
      activeChatId ?? undefined,
    ).then((result) => {
      if (!result || result.status !== "success" || !result.chat_id) {
        throw new Error("PDF processing failed");
      }

      return result;
    });

    toast.promise(uploadPromise, {
      loading: `Processing ${file.name}...`,
      success: `${file.name} added to your brain!`,
      error: `Failed to process ${file.name}.`,
    });

    try {
      const success = await uploadPromise;
      const chatId = success.chat_id;

      setCurrentChatId(chatId);

      // Navigate only if a new conversation was created
      if (chatId !== activeChatId) {
        router.push(`/chats/${chatId}`);
      }

      // Refresh sidebar
      window.dispatchEvent(new CustomEvent("new-chat-created"));
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setUploading(false);

      // Allow selecting the same file again
      input.value = "";
    }
  };

  return (
    <div className="flex flex-col bg-gray-200 min-h-[calc(100vh-65px)]">
      <div className="flex-1 max-w-7xl mx-auto pt-6 w-full">
        <MessageList
          messages={messages}
          loading={loading}
          historyLoading={historyLoading}
        />
      </div>

      <footer className="sticky bottom-6 bg-white p-3 border-t border-gray-300 max-w-2xl rounded-lg mx-auto w-full">
        <div className="flex items-center">
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={loading || uploading || historyLoading}
          />

          <button
            onClick={handleButtonClick}
            disabled={loading || uploading || historyLoading}
            className="text-gray-500 hover:text-gray-700 cursor-pointer mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">attach_file</span>
          </button>

          <button
            onClick={handleWebSearch}
            disabled={loading || uploading || historyLoading}
            className={`cursor-pointer mt-2 ml-2 disabled:opacity-50 ${
              webSearchActive
                ? "text-blue-500"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="material-symbols-outlined">travel_explore</span>
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={enterKeyPress}
            maxLength={250}
            placeholder="Upload your PDF and ask questions about it..."
            className="flex-1 rounded-l-md focus:outline-none ml-4"
            disabled={uploading || historyLoading}
          />

          <button
            onClick={handleSend}
            disabled={
              loading || uploading || historyLoading || !inputText.trim()
            }
            className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
