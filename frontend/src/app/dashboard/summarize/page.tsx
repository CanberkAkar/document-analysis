'use client';

import { useState, useEffect } from 'react';
import { ragService } from '@/services/ragService';
import type { DocumentMeta } from '@/types';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

export default function SummarizePage() {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [isLoadingDocs, setIsLoadingDocs] = useState<boolean>(true);
  const [isSummarizing, setIsSummarizing] = useState<boolean>(false);
  const [summaryResult, setSummaryResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    async function fetchDocs() {
      try {
        const docs = await ragService.getDocuments();
        // Sadece hazır (ready) olan dökümanları özetleyebiliriz
        const readyDocs = docs.filter((doc) => doc.status === 'ready');
        setDocuments(readyDocs);
        if (readyDocs.length > 0) {
          setSelectedDocId(readyDocs[0].id);
        }
      } catch (err) {
        console.error('Dökümanlar yüklenemedi', err);
        setError('Doküman listesi yüklenirken hata oluştu.');
      } finally {
        setIsLoadingDocs(false);
      }
    }
    fetchDocs();
  }, []);

  const handleSummarize = async () => {
    if (!selectedDocId) return;
    setIsSummarizing(true);
    setError('');
    setSummaryResult('');
    setCopied(false);

    try {
      const response = await ragService.summarizeDocument(selectedDocId);
      setSummaryResult(response.summary);
    } catch (err) {
      console.error('Özetleme hatası', err);
      setError('Doküman analiz edilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleCopy = async () => {
    if (!summaryResult) return;
    try {
      await navigator.clipboard.writeText(summaryResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Kopyalama hatası', err);
    }
  };

  // Basit markdown-to-JSX biçimlendirici
  const renderFormattedSummary = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => {
      // Başlıklar: #, ##, ###
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-xl font-bold text-[var(--text-primary)] mt-6 mb-3 border-b border-[var(--border)] pb-2">
            {line.substring(2)}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-lg font-bold text-[var(--accent)] mt-5 mb-2">
            {line.substring(3)}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-md font-semibold text-[var(--text-primary)] mt-4 mb-2">
            {line.substring(4)}
          </h3>
        );
      }
      // Liste Elemanları: * veya -
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const content = line.trim().substring(2);
        return (
          <li key={index} className="ml-4 list-disc text-sm text-[var(--text-secondary)] mb-1">
            {formatBoldText(content)}
          </li>
        );
      }
      // Boş Satır
      if (line.trim() === '') {
        return <div key={index} className="h-2" />;
      }
      // Normal Paragraf
      return (
        <p key={index} className="text-sm text-[var(--text-secondary)] leading-relaxed mb-2">
          {formatBoldText(line)}
        </p>
      );
    });
  };

  // Bold metin biçimlendirici (**kalın**)
  const formatBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={i} className="font-semibold text-[var(--text-primary)]">
            {part.substring(2, part.length - 2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-4xl animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Doküman Analizi ve Özetleme</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Hukuki dokümanlarınızı yapay zeka ile analiz edin; yönetici özetlerini, riskleri ve süreleri saniyeler içinde raporlayın.
        </p>
      </div>

      <Card className="!p-6 space-y-6">
        {isLoadingDocs ? (
          <div className="py-8 flex justify-center">
            <LoadingSpinner size="md" text="Dokümanlar yükleniyor..." />
          </div>
        ) : documents.length === 0 ? (
          <div className="py-6 text-center space-y-4">
            <p className="text-sm text-[var(--text-muted)]">Analiz edilebilecek "Hazır" durumda doküman bulunamadı.</p>
            <Link
              href="/dashboard/upload"
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] shadow-md shadow-[var(--accent)]/20 hover:opacity-90 transition-opacity"
            >
              Doküman Yükle
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="doc-select" className="block text-xs font-semibold text-[var(--text-muted)] mb-2">
                Analiz Edilecek Dokümanı Seçin
              </label>
              <select
                id="doc-select"
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-sm text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none transition-all"
              >
                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.filename}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleSummarize}
              disabled={isSummarizing || !selectedDocId}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[var(--accent)]/15"
            >
              {isSummarizing ? (
                <>
                  <LoadingSpinner size="sm" className="!gap-0" />
                  Rapor Hazırlanıyor...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Dokümanı Özetle ve Analiz Et
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs">
            {error}
          </div>
        )}
      </Card>

      {/* Rapor Sonucu */}
      {isSummarizing && (
        <Card className="!p-8 flex flex-col items-center justify-center min-h-[300px]">
          <LoadingSpinner size="lg" text="Doküman metni okunuyor ve hukuki analiz yapılıyor. Lütfen bekleyin..." />
        </Card>
      )}

      {summaryResult && !isSummarizing && (
        <Card className="!p-6 space-y-4 animate-slide-up relative">
          <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
            <h2 className="text-md font-semibold text-[var(--text-primary)]">Hukuki Analiz Raporu</h2>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Kopyalandı
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Panoya Kopyala
                </>
              )}
            </button>
          </div>

          <div className="prose prose-invert max-w-none text-[var(--text-secondary)]">
            {renderFormattedSummary(summaryResult)}
          </div>
        </Card>
      )}
    </div>
  );
}
