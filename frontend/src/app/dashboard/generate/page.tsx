'use client';

import { useState } from 'react';
import { ragService } from '@/services/ragService';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const templates = [
  { id: 'ihtarname', name: 'İhtarname', icon: '⚖️' },
  { id: 'dilekce', name: 'Dava Dilekçesi', icon: '📝' },
  { id: 'sozlesme', name: 'Kira Sözleşmesi', icon: '🤝' },
  { id: 'genel', name: 'Genel Hukuki Metin', icon: '📁' },
];

export default function GeneratePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('ihtarname');
  const [sender, setSender] = useState<string>('');
  const [recipient, setRecipient] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [details, setDetails] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [draftResult, setDraftResult] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sender || !recipient || !subject || !details) {
      setError('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }

    setIsGenerating(true);
    setError('');
    setDraftResult('');
    setCopied(false);

    try {
      const response = await ragService.generateDraft(selectedTemplate, {
        Gönderen: sender,
        Alıcı: recipient,
        Konu: subject,
        Açıklamalar_Ve_Detaylar: details,
      });
      setDraftResult(response.draft);
    } catch (err) {
      console.error('Draft generation error', err);
      setError('Taslak oluşturulurken hata oluştu. Lütfen bilgilerinizi kontrol edip tekrar deneyin.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!draftResult) return;
    try {
      await navigator.clipboard.writeText(draftResult);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Kopyalama hatası', err);
    }
  };

  // Basit markdown-to-JSX biçimlendirici
  const renderFormattedDraft = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, index) => {
      if (line.startsWith('# ')) {
        return (
          <h1 key={index} className="text-xl font-bold text-[var(--text-primary)] text-center mt-6 mb-4 pb-2 border-b border-[var(--border)] uppercase">
            {line.substring(2)}
          </h1>
        );
      }
      if (line.startsWith('## ')) {
        return (
          <h2 key={index} className="text-md font-bold text-[var(--text-primary)] mt-5 mb-2 uppercase">
            {line.substring(3)}
          </h2>
        );
      }
      if (line.startsWith('### ')) {
        return (
          <h3 key={index} className="text-sm font-semibold text-[var(--text-primary)] mt-4 mb-1">
            {line.substring(4)}
          </h3>
        );
      }
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const content = line.trim().substring(2);
        return (
          <li key={index} className="ml-6 list-disc text-xs text-[var(--text-secondary)] mb-1 leading-relaxed">
            {formatBoldText(content)}
          </li>
        );
      }
      if (line.trim() === '') {
        return <div key={index} className="h-3" />;
      }
      return (
        <p key={index} className="text-xs text-[var(--text-secondary)] leading-relaxed mb-2 text-justify">
          {formatBoldText(line)}
        </p>
      );
    });
  };

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
    <div className="p-6 sm:p-8 space-y-8 max-w-5xl animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Hukuki Belge Taslağı Oluşturucu</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Hukuki şablonları kullanarak resmi formatta ihtarname, dilekçe ve sözleşmeleri AI yardımıyla saniyeler içinde oluşturun.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Sol Kolon - Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="!p-5 space-y-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Şablon Seçin</h2>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => {
                    setSelectedTemplate(tpl.id);
                    setDraftResult('');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                    selectedTemplate === tpl.id
                      ? 'border-[var(--accent)] bg-[var(--accent)]/5 text-[var(--accent)] font-semibold shadow-sm'
                      : 'border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                  }`}
                >
                  <span className="text-lg mb-1">{tpl.icon}</span>
                  <span className="text-xs">{tpl.name}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card className="!p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                  {selectedTemplate === 'sozlesme' ? 'Kiralayan (Ev Sahibi)' : 'Gönderen / Keşideci'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={sender}
                  onChange={(e) => setSender(e.target.value)}
                  placeholder="Ad Soyad veya Unvan"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                  {selectedTemplate === 'sozlesme' ? 'Kiracı' : 'Muhatap / Alıcı'} <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="Ad Soyad veya Unvan"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                  Belge Konusu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Örn: Kira alacağı ihtarı / Hasarlı teslim"
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[var(--text-muted)] mb-1">
                  Açıklamalar ve Olay Detayları <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Hukuki ihtarın veya belgenin içeriğinde bulunmasını istediğiniz tüm detayları, olayları ve şartları buraya girin."
                  className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] text-xs text-[var(--text-primary)] focus:ring-1 focus:ring-[var(--accent)] focus:outline-none transition-all resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[11px]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[var(--accent)]/15"
              >
                {isGenerating ? (
                  <>
                    <LoadingSpinner size="sm" className="!gap-0" />
                    Belge Oluşturuluyor...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Taslak Belge Oluştur
                  </>
                )}
              </button>
            </form>
          </Card>
        </div>

        {/* Sağ Kolon - Belge Önizleme */}
        <div className="lg:col-span-3">
          {isGenerating && (
            <Card className="!p-8 flex flex-col items-center justify-center min-h-[450px] h-full">
              <LoadingSpinner size="lg" text="Hukuki şablon yükleniyor ve metin biçimlendiriliyor..." />
            </Card>
          )}

          {!draftResult && !isGenerating && (
            <div className="border-2 border-dashed border-[var(--border)] rounded-2xl flex flex-col items-center justify-center text-center p-8 min-h-[450px] h-full bg-[var(--bg-secondary)]/30">
              <span className="text-3xl mb-3">📄</span>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Belge Önizleme Alanı</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-xs mt-1">
                Sol taraftaki bilgileri doldurup "Taslak Belge Oluştur" butonuna basarak yasal taslağınızı burada görüntüleyebilirsiniz.
              </p>
            </div>
          )}

          {draftResult && !isGenerating && (
            <Card className="!p-6 space-y-4 animate-slide-up h-full flex flex-col">
              <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
                <span className="text-xs font-semibold text-[var(--text-muted)]">Oluşturulan Taslak Belge</span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-tertiary)] hover:bg-[var(--bg-hover)] text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
                >
                  {copied ? (
                    <>
                      <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Kopyalandı
                    </>
                  ) : (
                    <>
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                      </svg>
                      Metni Kopyala
                    </>
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[500px] border border-[var(--border)] rounded-xl p-5 bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-serif">
                {renderFormattedDraft(draftResult)}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
