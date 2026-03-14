import { SkeletonBlock } from '@/components/ui';

export default function AdminLoading() {
  return (
    <main className="space-y-6">
      <SkeletonBlock className="h-20 w-1/2" />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock key={index} className="h-24 w-full" />
        ))}
      </section>
      <SkeletonBlock className="h-72 w-full" />
    </main>
  );
}
