import { ReactNode } from 'react';

type GlassCardProps = {
  children: ReactNode;
  className?: string;
};

export function GlassCard({ children, className = '' }: GlassCardProps) {
  return (
    <div
      className={`rounded-xl border border-brand-border/70 bg-[#121a31]/70 p-5 shadow-glass backdrop-blur-xl ${className}`}
    >
      {children}
    </div>
  );
}
