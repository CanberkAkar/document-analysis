import { cn } from '@/lib/utils';
import { timeAgo } from '@/lib/utils';
import CitationCard from './CitationCard';
import type { ChatMessage } from '@/types';

interface MessageBubbleProps {
  message: ChatMessage;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold',
          isUser
            ? 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
            : 'bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-white'
        )}
      >
        {isUser ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        )}
      </div>

      {/* Message content */}
      <div className={cn('max-w-[85%] md:max-w-[75%] space-y-2', isUser && 'text-right')}>
        <div
          className={cn(
            'px-4 py-3 rounded-2xl text-sm leading-relaxed',
            isUser
              ? 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-white rounded-br-md'
              : 'bg-[var(--bg-tertiary)] border border-[var(--border)] text-[var(--text-primary)] rounded-bl-md'
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {/* Citations */}
        {message.citations && message.citations.length > 0 && (
          <div className="space-y-2 mt-2">
            <p className="text-xs text-[var(--text-muted)] font-medium px-1">📚 Atıflar:</p>
            {message.citations.map((citation, idx) => (
              <CitationCard key={idx} citation={citation} index={idx + 1} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <p className={cn('text-[11px] text-[var(--text-muted)] px-1', isUser && 'text-right')}>
          {timeAgo(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
