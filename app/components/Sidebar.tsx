"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getChats, deleteChat } from "../lib/api";
import ConfirmModal from "../components/ConfirmModel";
import { useRouter, usePathname } from "next/navigation";

type Chat = {
  id: string;
  title: string;
};

export default function Sidebar({ isOpen }: { isOpen: boolean }) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  const [chatToDelete, setChatToDelete] = useState<string | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const currentChatId = pathname.startsWith("/chats/")
    ? pathname.split("/")[2]
    : null;

  useEffect(() => {
    getChats()
      .then(setChats)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async () => {
    if (!chatToDelete) return;

    await deleteChat(chatToDelete);

    // If deleting the currently open chat, navigate home
    if (currentChatId === chatToDelete) {
      router.push("/");
    }

    setChats((prev) => prev.filter((chat) => chat.id !== chatToDelete));
    setChatToDelete(null);
  };

  return (
    <>
      <aside
        className={`
          fixed h-screen w-64 bg-white border-r p-4 z-40
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <p className="font-bold mb-4">Chats</p>

        {loading ? (
          <p className="text-sm text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-1">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className="flex items-center justify-between p-2 rounded hover:bg-gray-100"
              >
                <Link
                  href={`/chats/${chat.id}`}
                  className="flex-1 truncate text-sm"
                >
                  {chat.title}
                </Link>

                <button
                  onClick={() => setChatToDelete(chat.id)}
                  className="text-red-500 ml-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    delete_outline
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </aside>

      <ConfirmModal
        isOpen={!!chatToDelete}
        title="Delete Chat"
        message="This action cannot be undone."
        onCancel={() => setChatToDelete(null)}
        onConfirm={handleDelete}
      />
    </>
  );
}
