import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  text?: string;
}

export default function LoadingSpinner({ size = 'md', className, text }: LoadingSpinnerProps) {
  const sizes: Record<string, string> = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="relative">
        <div
          className={cn(
            'rounded-full border-2 border-[var(--border)] border-t-[var(--accent)] animate-spin',
            sizes[size]
          )}
        />
        {size === 'lg' && (
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-b-[var(--accent)]/30 animate-spin-reverse" />
        )}
      </div>
      {text && (
        <p className="text-sm text-[var(--text-muted)] animate-pulse">{text}</p>
      )}
    </div>
  );
}
