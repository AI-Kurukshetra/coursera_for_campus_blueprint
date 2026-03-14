import { SkeletonBlock } from '@/components/ui';

export default function StudentLoading() {
  return (
    <main className="space-y-6">
      <SkeletonBlock className="h-32 w-full" />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-28 w-full" />
        ))}
      </section>
      <SkeletonBlock className="h-64 w-full" />
    </main>
  );
}
