import { ChatInterface } from '@/modules/chat/components/ChatInterface';

// LOHIA SPEED MODE: Force dynamic rendering to prevent hydration mismatches during rapid UI iteration
export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <main>
      <ChatInterface />
    </main>
  );
}
