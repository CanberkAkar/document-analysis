'use client';

import { useState, useRef, useCallback } from 'react';
import { cn, formatFileSize } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { ragService } from '@/services/ragService';

interface FileUploaderProps {
  onUploadSuccess?: () => void;
}

export default function FileUploader({ onUploadSuccess }: FileUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      setUploadResult(null);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadResult(null);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setUploadResult(null);

    try {
      const result = await ragService.uploadDocument(selectedFile);
      setUploadResult({ success: true, message: result.message });
      setSelectedFile(null);
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Yükleme başarısız.';
      setUploadResult({ success: false, message });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          'relative flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-300',
          isDragOver
            ? 'border-[var(--accent)] bg-[var(--accent)]/5 scale-[1.01]'
            : 'border-[var(--border)] bg-[var(--bg-secondary)] hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)]'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300',
          isDragOver
            ? 'bg-[var(--accent)]/20 scale-110'
            : 'bg-[var(--bg-tertiary)]'
        )}>
          <svg className={cn('w-7 h-7 transition-colors', isDragOver ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>

        <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
          {isDragOver ? 'Dosyayı bırakın' : 'PDF dosyanızı sürükleyip bırakın'}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          veya <span className="text-[var(--accent)] font-medium">göz atarak seçin</span>
        </p>
        <p className="text-[11px] text-[var(--text-muted)] mt-2">Desteklenen format: PDF</p>
      </div>

      {/* Selected file info */}
      {selectedFile && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">{selectedFile.name}</p>
              <p className="text-xs text-[var(--text-muted)]">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
              İptal
            </Button>
            <Button size="sm" isLoading={isUploading} onClick={handleUpload}>
              Yükle & İndeksle
            </Button>
          </div>
        </div>
      )}

      {/* Upload result */}
      {uploadResult && uploadResult.success && (
        <div className="px-4 py-3 rounded-xl text-sm bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
          {uploadResult.message}
        </div>
      )}

      <Modal isOpen={!!(uploadResult && !uploadResult.success)} onClose={() => setUploadResult(null)} title="Yükleme Hatası" variant="danger">
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-secondary)]">
            {uploadResult?.message || 'Dosya yüklenirken bilinmeyen bir hata oluştu.'}
          </p>
          <div className="flex justify-end gap-2">
            <Button size="sm" onClick={() => setUploadResult(null)}>
              Tamam
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
