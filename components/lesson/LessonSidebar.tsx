import Link from 'next/link';
import { CheckCircle2, Lock } from 'lucide-react';
import type { LessonLearningItem } from '@/types/lesson';

type LessonSidebarProps = {
  slug: string;
  activeLessonId: string;
  lessons: LessonLearningItem[];
};

const formatDuration = (durationSeconds: number | null): string => {
  if (!durationSeconds || durationSeconds <= 0) {
    return 'TBA';
  }

  const minutes = Math.ceil(durationSeconds / 60);
  return `${minutes} min`;
};

export default function LessonSidebar({ slug, activeLessonId, lessons }: LessonSidebarProps) {
  return (
    <aside className="rounded-xl border border-brand-border/70 bg-[#121a31]/80 p-4 shadow-glass backdrop-blur-xl">
      <h3 className="font-heading text-2xl text-white">Course Lessons</h3>

      <ul className="mt-4 space-y-2">
        {lessons.map((lesson) => {
          const isActive = lesson.id === activeLessonId;

          return (
            <li key={lesson.id}>
              <Link
                href={`/courses/${slug}/lessons/${lesson.id}`}
                className={`block rounded-lg border px-3 py-2 transition ${
                  isActive
                    ? 'border-brand-primary bg-brand-primary/15'
                    : 'border-brand-border bg-[#0f1734] hover:border-brand-primary/45'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">
                      Lesson {lesson.order_index}
                    </p>
                    <p className="text-sm font-medium text-white">{lesson.title}</p>
                    <p className="text-xs text-brand-muted">{formatDuration(lesson.duration_seconds)}</p>
                  </div>
                  <div className="mt-1 shrink-0">
                    {lesson.completed ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                        <CheckCircle2 className="h-4 w-4" />
                      </span>
                    ) : (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1a2446] text-brand-muted">
                        <Lock className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
