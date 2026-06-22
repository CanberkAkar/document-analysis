'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn, timeAgo } from '@/lib/utils';
import { ragService } from '@/services/ragService';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import type { DocumentMeta } from '@/types';

interface DocumentListProps {
  refreshKey?: number;
}

export default function DocumentList({ refreshKey = 0 }: DocumentListProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await ragService.deleteDocument(deletingId);
      setDocuments((prev) => prev.filter((d) => d.id !== deletingId));
      setDeletingId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Doküman silinemedi.';
      setError(message);
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    async function fetchDocuments() {
      try {
        const docs = await ragService.getDocuments();
        setDocuments(docs);
      } catch {
        // API endpoint may not exist yet — show empty state
        setDocuments([]);
        setError(null);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDocuments();
  }, [refreshKey]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner text="Dokümanlar yükleniyor..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">Henüz doküman yok</p>
        <p className="text-xs text-[var(--text-muted)]">PDF dokümanlarınızı yükleyerek başlayın.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-all gap-4 group"
        >
          <div className="flex items-center gap-3 w-full sm:w-auto min-w-0">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/15 transition-colors">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{doc.filename}</p>
              <p className="text-xs text-[var(--text-muted)]">
                {doc.chunksProcessed} parça • {timeAgo(doc.uploadedAt)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
            {doc.status === 'ready' && (
              <button
                onClick={() => router.push(`/dashboard/ask?doc=${encodeURIComponent(doc.filename)}`)}
                className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-colors flex items-center gap-1.5 text-xs font-semibold"
                title="Dokümanı Analiz Et (Soru Sor)"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Analiz Et
              </button>
            )}

            {doc.status !== 'error' && (
              <button
                onClick={() => window.open(`http://localhost:3000/rag/documents/${doc.id}/preview`, '_blank')}
                className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 transition-colors flex items-center gap-1 text-xs font-semibold"
                title="Dokümanı Önizle"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Önizle
              </button>
            )}

            <span
              className={cn(
                'text-[11px] font-medium px-2.5 py-1 rounded-full',
                doc.status === 'ready' && 'bg-emerald-500/10 text-emerald-400',
                doc.status === 'processing' && 'bg-amber-500/10 text-amber-400',
                doc.status === 'error' && 'bg-red-500/10 text-red-400'
              )}
            >
              {doc.status === 'ready' && '✓ Hazır'}
              {doc.status === 'processing' && '⏳ İşleniyor'}
              {doc.status === 'error' && '✕ Hata'}
            </span>

            <button
              onClick={() => handleDelete(doc.id)}
              className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors ml-1"
              title="Dokümanı Kaldır"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        title="Dokümanı Sil"
        variant="danger"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Bu dokümanı silmek istediğinize emin misiniz? Bu işlem geri alınamaz ve dokümana ait tüm analiz verileri silinecektir.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeletingId(null)}
              disabled={isDeleting}
            >
              İptal
            </Button>
            <Button
              variant="danger"
              isLoading={isDeleting}
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700 text-white animate-pulse-subtle"
            >
              Evet, Sil
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
