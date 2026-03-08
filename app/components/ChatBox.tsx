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

    try {
      const answer = await askQuestion(inputText);

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "ai", content: answer };
        return updated;
      });
    } catch (error) {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "ai",
          content: "Sorry, there was an error getting the answer.",
        };
        return updated;
      });
    } finally {
      setLoading(false);
    }
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
    <div className="bg-gray-200 h-screen">
      <MessageList messages={messages} loading={loading} />
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
