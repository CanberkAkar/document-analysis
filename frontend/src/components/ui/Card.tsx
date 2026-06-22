import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export default function Card({ children, className, hover = false, glow = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 transition-all duration-300',
        hover && 'hover:border-[var(--border-hover)] hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5',
        glow && 'hover:shadow-[var(--accent)]/10 hover:border-[var(--accent)]/30',
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Card sub-components ─────────────────────────────────────
export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-lg font-semibold text-[var(--text-primary)]', className)}>
      {children}
    </h3>
  );
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-sm text-[var(--text-muted)]', className)}>
      {children}
    </p>
  );
}
