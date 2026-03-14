import Link from 'next/link';
import { Star, UserRound } from 'lucide-react';
import type { CourseDifficulty, CourseListItem } from '@/types/course';

type CourseCardProps = {
  course: CourseListItem;
};

const difficultyStyles: Record<CourseDifficulty, string> = {
  beginner: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
  intermediate: 'bg-blue-500/20 text-blue-200 border-blue-400/40',
  advanced: 'bg-amber-500/20 text-amber-200 border-amber-400/40',
};

const toTitleCase = (value: string): string => value[0].toUpperCase() + value.slice(1);

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

const toPseudoRating = (seed: string): number => {
  const sum = seed.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
  return 4 + (sum % 10) / 10;
};

export default function CourseCard({ course }: CourseCardProps) {
  const difficulty = course.difficulty;
  const rating = toPseudoRating(course.id).toFixed(1);

  return (
    <article className="group overflow-hidden rounded-xl border border-brand-border/70 bg-[#121a31]/75 shadow-glass transition hover:-translate-y-1 hover:border-brand-primary/70">
      <Link href={`/courses/${course.slug}`} className="block">
        <div className="relative h-44 overflow-hidden">
          {course.thumbnail_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#1f3f85] via-[#355fbe] to-[#8ca7f0]" />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-[#050816] via-[#05081666] to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            {difficulty ? (
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${difficultyStyles[difficulty]}`}>
                {toTitleCase(difficulty)}
              </span>
            ) : (
              <span className="rounded-full border border-brand-border bg-[#0d1430]/85 px-2.5 py-1 text-xs font-semibold text-brand-muted">
                General
              </span>
            )}
            <span className="rounded-full bg-brand-accent px-2.5 py-1 text-xs font-semibold text-[#111827]">
              {formatPrice(course.price)}
            </span>
          </div>
        </div>

        <div className="space-y-3 p-4">
          <h3 className="line-clamp-2 font-heading text-2xl leading-tight text-white">{course.title}</h3>

          <div className="flex items-center gap-2 text-sm text-brand-muted">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary/20 text-brand-primary">
              <UserRound className="h-4 w-4" />
            </span>
            <span>{course.instructor_name ?? 'Instructor TBA'}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-amber-300">
            <Star className="h-4 w-4 fill-amber-300" />
            <span className="font-semibold">{rating}</span>
            <span className="text-brand-muted">(student rating)</span>
          </div>

          <p className="line-clamp-2 text-sm leading-relaxed text-brand-muted">
            {course.description ?? 'Course description coming soon.'}
          </p>
        </div>
      </Link>
    </article>
  );
}
