import { truncate } from '@/lib/utils';
import type { Citation } from '@/types';

interface CitationCardProps {
  citation: Citation;
  index: number;
}

export default function CitationCard({ citation, index }: CitationCardProps) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-[var(--accent)]/30 transition-colors group">
      {/* Index badge */}
      <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold flex items-center justify-center mt-0.5">
        {index}
      </span>

      <div className="flex-1 min-w-0">
        {/* Source info */}
        <div className="flex items-center gap-2 mb-1">
          <svg className="w-3.5 h-3.5 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs font-medium text-[var(--text-secondary)] truncate">
            {citation.source}
          </span>
          {citation.page && (
            <span className="text-[10px] text-[var(--text-muted)] bg-[var(--bg-tertiary)] px-1.5 py-0.5 rounded">
              s. {citation.page}
            </span>
          )}
        </div>

        {/* Preview text */}
        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
          {truncate(citation.preview, 120)}
        </p>
      </div>
    </div>
  );
}
