'use client';

import { useState } from 'react';
import FileUploader from '@/components/documents/FileUploader';
import DocumentList from '@/components/documents/DocumentList';

export default function UploadPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-3xl animate-slide-up">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Doküman Yükle</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          PDF dokümanlarınızı yükleyerek AI analiz sistemine indeksleyin
        </p>
      </div>

      {/* Upload */}
      <FileUploader onUploadSuccess={handleUploadSuccess} />

      {/* Document List */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Yüklenen Dokümanlar</h2>
        <DocumentList refreshKey={refreshKey} />
      </div>
    </div>
  );
}
