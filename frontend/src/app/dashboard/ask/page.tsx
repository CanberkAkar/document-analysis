import ChatPanel from '@/components/chat/ChatPanel';

export default function AskPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h1 className="text-lg font-semibold text-[var(--text-primary)]">Soru-Cevap</h1>
        <p className="text-xs text-[var(--text-muted)]">Hukuki dokümanlarınız üzerinden AI destekli analiz</p>
      </div>

      {/* Chat */}
      <div className="flex-1 overflow-hidden">
        <ChatPanel />
      </div>
    </div>
  );
}
