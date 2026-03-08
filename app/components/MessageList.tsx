import { useEffect, useRef } from "react";

type Message = {
  role: "user" | "ai";
  content: string;
};

export default function MessageList({
  messages,
  loading,
}: {
  messages: Message[];
  loading: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <div
      ref={containerRef}
      className="p-6 space-y-4 pb-32 overflow-y-auto"
      style={{ maxHeight: "calc(100vh - 80px)" }} // reserve space for footer
    >
      {messages.map((msg, i) => (
        <div
          key={i}
          className={`flex items-center ${
            msg.role === "user" ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span
            className={`material-symbols-outlined mr-2 ${
              msg.role === "user"
                ? "text-[#475569] bg-gray-300 rounded-md px-3 py-3 ml-2"
                : "text-white bg-[#2B8CEE] rounded-md px-3 py-3"
            }`}
          >
            {msg.role === "user" ? "person" : "smart_toy"}
          </span>
          {loading && i === messages.length - 1 ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          ) : (
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-white text-black border border-gray-200 shadow-sm"
              }`}
            >
              {msg.content}
            </div>
          )}
        </div>
      ))}
      <div ref={bottomRef}></div> {/* invisible div to scroll into view */}
    </div>
  );
}
