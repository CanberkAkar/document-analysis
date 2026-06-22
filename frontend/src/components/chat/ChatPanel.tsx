'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '@/hooks/useChat';
import MessageBubble from './MessageBubble';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export default function ChatPanel() {
  const { messages, isLoading, error, sendMessage, clearError } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check query parameters to pre-fill prompt
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const docName = urlParams.get('doc');
      if (docName) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setInput(`"${docName}" dokümanını analiz edip özetler misin?`);
        urlParams.delete('doc');
        const searchString = urlParams.toString();
        const cleanUrl = window.location.pathname + (searchString ? `?${searchString}` : '');
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }
  }, []);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    sendMessage(trimmed);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[var(--accent)]/20 to-[var(--accent-hover)]/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Hukuki Sorunuzu Sorun
            </h3>
            <p className="text-sm text-[var(--text-muted)] max-w-md">
              Yüklenmiş dokümanlarınız üzerinden AI destekli analiz ve yanıtlar alın.
              Kaynaklara atıfla birlikte detaylı cevaplar üretilir.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {isLoading && (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-[var(--bg-tertiary)] border border-[var(--border)]">
              <LoadingSpinner size="sm" />
              <span className="text-sm text-[var(--text-muted)]">Analiz ediliyor...</span>
            </div>
          </div>
        )}

        <Modal isOpen={!!error} onClose={clearError} title="Analiz Hatası" variant="danger">
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              {error}
            </p>
            <div className="flex justify-end gap-2">
              <Button size="sm" onClick={clearError}>
                Tamam
              </Button>
            </div>
          </div>
        </Modal>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-[var(--border)] bg-[var(--bg-primary)] p-4">
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hukuki sorunuzu yazın... (Enter ile gönderin, Shift+Enter yeni satır)"
            rows={1}
            className="w-full resize-none rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] pl-4 pr-14 py-3.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 focus:outline-none transition-all"
            style={{ minHeight: '52px', maxHeight: '160px' }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 bottom-2 p-2.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-white shadow-lg shadow-[var(--accent)]/25 hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-105"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
