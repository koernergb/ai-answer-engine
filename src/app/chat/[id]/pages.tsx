import { ChatInterface } from '@/components/ChatInterface';
import { fetchConversation } from '@/lib/api';

export default async function SharedChatPage({ params }: { params: { id: string } }) {
  const conversation = await fetchConversation(params.id);
  
  return (
    <ChatInterface 
      initialMessages={conversation.messages} 
      conversationId={params.id}
    />
  );
}