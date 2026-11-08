import { useEffect, useRef } from "react";
import { MessageListProps } from "@/lib/types";

export default function MessageList({
  messages,
  loading,
  historyLoading,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  // const containerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages.length);

  useEffect(() => {
    const isNewMessage = messages.length > prevMessagesLength.current;
    prevMessagesLength.current = messages.length;

    if (isNewMessage || loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages, loading]);

  if (messages.length === 0 && !loading && !historyLoading) {
    return (
      <div className="flex items-center justify-center h-full min-h-100">
        <div className="text-center text-gray-500">
          <span className="material-symbols-outlined text-6xl mb-4">chat</span>
          <p>No messages yet</p>
          <p className="text-sm mt-2">
            Upload a PDF and start asking questions!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {historyLoading && (
        <div className="fixed inset-0 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          <span className="mt-3 text-sm text-gray-500">Loading…</span>
        </div>
      )}

      <div className="p-6 space-y-4 pb-6">
        {messages.map((msg, i) => (
          <div
            key={msg.id || i}
            className={`flex items-start ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            <span
              className={`material-symbols-outlined mr-2 shrink-0 ${
                msg.role === "user"
                  ? "text-[#475569] bg-gray-300 rounded-md px-3 py-3 ml-2"
                  : "text-white bg-[#2B8CEE] rounded-md px-3 py-3"
              }`}
            >
              {msg.role === "user" ? "person" : "smart_toy"}
            </span>

            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-black border border-gray-200 shadow-sm"
              }`}
            >
              <div className="whitespace-pre-wrap wrap-break-words">
                {msg.content}
              </div>
              {msg.created_at && (
                <div
                  className={`text-xs mt-2 ${
                    msg.role === "user" ? "text-blue-100" : "text-gray-400"
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading &&
          !historyLoading &&
          messages[messages.length - 1]?.role !== "ai" && (
            <div className="flex items-start flex-row">
              <span className="material-symbols-outlined mr-2 shrink-0 text-white bg-[#2B8CEE] rounded-md px-3 py-3">
                smart_toy
              </span>
              <div className="bg-white text-black border border-gray-200 shadow-sm p-3 rounded-lg flex items-center">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              </div>
            </div>
          )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}
