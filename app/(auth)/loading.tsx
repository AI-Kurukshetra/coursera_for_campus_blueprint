import { SkeletonBlock } from '@/components/ui';

export default function AuthLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-brand-bg p-6">
      <div className="w-full max-w-xl rounded-3xl border border-brand-border bg-[#121a31]/70 p-8">
        <SkeletonBlock className="h-6 w-1/3" />
        <SkeletonBlock className="mt-3 h-10 w-2/3" />
        <div className="mt-8 space-y-3">
          <SkeletonBlock className="h-11 w-full" />
          <SkeletonBlock className="h-11 w-full" />
          <SkeletonBlock className="h-11 w-full" />
        </div>
      </div>
    </main>
  );
}
