'use client';

import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { timeAgo } from '@/lib/utils';

interface HistoryItem {
  question: string;
  answer: string;
  createdAt: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      try {
        // TODO: ragService.getHistory() bağlantısı
        await new Promise((r) => setTimeout(r, 500));
        setHistory([]);
      } catch {
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    }
    loadHistory();
  }, []);

  return (
    <div className="p-6 sm:p-8 space-y-6 animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Sorgu Geçmişi</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Önceki soru ve cevaplarınız</p>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner text="Geçmiş yükleniyor..." />
        </div>
      ) : history.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Henüz geçmiş yok</p>
          <p className="text-xs text-[var(--text-muted)]">Soru sordukça geçmişiniz burada görünecek.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((item, idx) => (
            <Card key={idx} hover className="cursor-pointer">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-1 truncate">
                    {item.question}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2">
                    {item.answer}
                  </p>
                </div>
                <span className="text-[11px] text-[var(--text-muted)] whitespace-nowrap flex-shrink-0">
                  {timeAgo(item.createdAt)}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
