import { Inbox } from 'lucide-react';

type EmptyStateProps = {
  title: string;
  description: string;
  className?: string;
};

export function EmptyState({ title, description, className = '' }: EmptyStateProps) {
  return (
    <div className={`rounded-xl border border-dashed border-brand-border bg-[#121a31]/50 p-8 text-center ${className}`}>
      <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="font-heading text-xl text-white">{title}</h3>
      <p className="mt-2 text-sm text-brand-muted">{description}</p>
    </div>
  );
}
