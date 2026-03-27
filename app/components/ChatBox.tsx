"use client";
import { useRef, useState } from "react";
import { uploadAndProcessPDF, askQuestion } from "../lib/api";
import MessageList from "./MessageList";

type Message = {
  role: "user" | "ai";
  content: string;
};

export default function ChatBox() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [webSearchActive, setWebSearchActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      content: "Hello! Upload a PDF and I can help you analyze it.",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = { role: "user", content: inputText };
    const aiPlaceholder: Message = { role: "ai", content: "..." };

    setMessages((prev) => [...prev, userMessage, aiPlaceholder]);
    setInputText("");
    setLoading(true);

    let aiText = "";
    try {
      const stream = await askQuestion(inputText, webSearchActive);

      if (!stream) throw new Error("No stream");

      const reader = stream.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        if (chunk) aiText += chunk;

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "ai",
            content: aiText,
          };
          return updated;
        });
        await new Promise((resolve) => setTimeout(resolve, 50)); // Throttle UI updates
      }
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "ai",
          content: aiText || "Sorry, something went wrong.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };
  const handleWebSearch = (event: React.MouseEvent<HTMLButtonElement>) => {
    setWebSearchActive((prev) => !prev);
  };
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const enterKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);

    setMessages((prev) => [
      ...prev,
      { role: "ai", content: `Processing ${file.name}...` },
    ]);

    setLoading(true);

    try {
      const success = await uploadAndProcessPDF(file);

      if (success) {
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: "Brain updated! What's your first question?" },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: "Sorry, there was an error processing the PDF.",
          },
        ]);
      }
    } catch (error) {
      console.error("Upload failed", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: "Sorry, there was an error processing the PDF.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="bg-gray-200 min-h-screen">
      <div className="max-w-7xl mx-auto pt-6">
        <MessageList messages={messages} loading={loading} />
      </div>
      <footer className="fixed bottom-0 bg-white p-3 border-t border-gray-300 max-w-2xl rounded-lg mx-auto left-0 right-0 mb-10">
        <div className="flex items-center">
          <input
            type="file"
            accept=".pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            onClick={handleButtonClick}
            className="text-gray-500 hover:text-gray-700 cursor-pointer mt-2"
          >
            <span className="material-symbols-outlined">attach_file</span>
          </button>
          <button
            onClick={handleWebSearch}
            className={`cursor-pointer mt-2 ml-2 ${
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
          />
          <button
            onClick={handleSend}
            className="bg-blue-500 text-white p-2 rounded-md hover:bg-blue-600 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)] cursor-pointer"
          >
            <span className="material-symbols-outlined">send</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
