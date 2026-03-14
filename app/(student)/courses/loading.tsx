import { SkeletonBlock } from '@/components/ui';

export default function CoursesLoading() {
  return (
    <main className="space-y-6">
      <SkeletonBlock className="h-40 w-full" />
      <SkeletonBlock className="h-24 w-full" />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-brand-border/70 bg-[#121a31]/70 p-4">
            <SkeletonBlock className="h-36 w-full" />
            <SkeletonBlock className="h-5 w-2/3" />
            <SkeletonBlock className="h-4 w-1/2" />
            <SkeletonBlock className="h-4 w-full" />
          </div>
        ))}
      </section>
    </main>
  );
}
