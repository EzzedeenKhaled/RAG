import ChatBox from "@/components/ChatBox";

interface ChatPageProps {
  params: Promise<{
    chatId: string;
  }>;
}

export default async function ChatPage({ params }: ChatPageProps) {
  const { chatId } = await params;

  return <ChatBox key={chatId} initialChatId={chatId} />;
}
