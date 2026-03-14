import Link from 'next/link';
import { BookCheck, CheckCircle2, Clock3, MessageCircle, Star, UserRound } from 'lucide-react';
import { notFound } from 'next/navigation';
import { EnrollButton } from '@/components/course';
import { GlassCard } from '@/components/ui';
import { getPublishedCourseBySlug } from '@/services/courseService';

export const dynamic = 'force-dynamic';

type CourseDetailPageProps = {
  params: {
    slug: string;
  };
};

const formatPrice = (price: number | null): string => {
  if (price === null || price === 0) {
    return 'Free';
  }

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
};

const formatDuration = (durationSeconds: number | null): string => {
  if (!durationSeconds || durationSeconds <= 0) {
    return 'Duration TBA';
  }

  const minutes = Math.ceil(durationSeconds / 60);
  return `${minutes} min`;
};

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const result = await getPublishedCourseBySlug(params.slug);

  if (!result) {
    notFound();
  }

  const { course, lessons } = result;

  return (
    <main className="space-y-6">
      <Link href="/courses" className="inline-flex items-center gap-2 text-sm text-brand-muted transition hover:text-white">
        ← Back to catalog
      </Link>

      <section className="relative overflow-hidden rounded-xl border border-brand-border/70 shadow-layered">
        {course.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.thumbnail_url} alt={course.title} className="h-72 w-full object-cover" />
        ) : (
          <div className="h-72 w-full bg-gradient-to-br from-[#233f83] via-[#325fbb] to-[#88a7ea]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#05081688] to-[#05081633]" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-brand-accent">Course Detail</p>
          <h2 className="mt-2 font-heading text-4xl text-white">{course.title}</h2>
          <p className="mt-2 max-w-3xl text-sm text-blue-100/90">
            {course.description ?? 'Course details will be updated soon.'}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-blue-100">
            <span className="rounded-full bg-white/10 px-2.5 py-1">{course.difficulty ?? 'General'}</span>
            <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-300 text-amber-300" /> 4.8 rating</span>
            <span>{lessons.length} lessons</span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-border/70 bg-[#121a31]/70 p-2 shadow-glass backdrop-blur-xl">
            {['Overview', 'Curriculum', 'Discussions', 'Reviews'].map((tab, index) => (
              <button
                key={tab}
                type="button"
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  index === 0
                    ? 'bg-brand-primary text-white'
                    : 'text-brand-muted hover:bg-[#0f1734] hover:text-brand-text'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <GlassCard>
            <h3 className="font-heading text-2xl text-white">Lesson Curriculum</h3>

            {lessons.length > 0 ? (
              <ul className="mt-4 space-y-3">
                {lessons.map((lesson, index) => (
                  <li key={lesson.id} className="rounded-lg border border-brand-border/60 bg-[#0f1734] p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-brand-muted">Lesson {index + 1}</p>
                        <Link
                          href={`/courses/${course.slug}/lessons/${lesson.id}`}
                          className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:text-brand-accent"
                        >
                          <BookCheck className="h-4 w-4 text-brand-primary" />
                          {lesson.title}
                        </Link>
                        {lesson.description ? (
                          <p className="mt-1 text-xs text-brand-muted">{lesson.description}</p>
                        ) : null}
                      </div>
                      <div className="text-right text-xs text-brand-muted">
                        <p className="inline-flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" /> {formatDuration(lesson.duration_seconds)}</p>
                        <p className="mt-2 inline-flex items-center gap-1 text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" /> Preview available</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-brand-muted">No published lessons yet.</p>
            )}
          </GlassCard>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24 xl:self-start">
          <GlassCard>
            <p className="text-xs uppercase tracking-wide text-brand-muted">Enrollment</p>
            <p className="mt-1 text-3xl font-bold text-white">{formatPrice(course.price)}</p>
            <div className="mt-4">
              <EnrollButton courseId={course.id} price={course.price} />
            </div>
            <Link
              href={`/courses/${course.slug}/discuss`}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-brand-text transition hover:text-brand-accent"
            >
              <MessageCircle className="h-4 w-4" />
              Join Discussions
            </Link>
          </GlassCard>

          <GlassCard>
            <p className="text-xs uppercase tracking-wide text-brand-muted">Instructor</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary">
                <UserRound className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{course.instructor_name ?? 'TBA'}</p>
                <p className="text-xs text-brand-muted">{course.instructor_email ?? 'No public email'}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-brand-muted">
              {course.instructor_bio ?? `${course.instructor_name ?? 'Instructor'} has not added a public bio yet.`}
            </p>
          </GlassCard>
        </aside>
      </div>
    </main>
  );
}
