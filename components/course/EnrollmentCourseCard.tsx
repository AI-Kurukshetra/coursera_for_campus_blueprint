import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { StudentEnrollmentCard } from '@/types/enrollment';

type EnrollmentCourseCardProps = {
  enrollment: StudentEnrollmentCard;
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

export default function EnrollmentCourseCard({ enrollment }: EnrollmentCourseCardProps) {
  return (
    <article className="overflow-hidden rounded-xl border border-brand-border/70 bg-[#121a31]/80 shadow-glass">
      <Link href={`/courses/${enrollment.course_slug}`} className="block">
        {enrollment.course_thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={enrollment.course_thumbnail_url}
            alt={enrollment.course_title}
            className="h-36 w-full object-cover"
          />
        ) : (
          <div className="h-36 w-full bg-gradient-to-br from-[#274d9e] via-[#305ebf] to-[#86a1e8]" />
        )}
      </Link>

      <div className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-heading text-xl text-white">
            {enrollment.course_title}
          </h3>
          <span className="rounded-full bg-brand-accent px-2.5 py-1 text-xs font-semibold text-[#111827]">
            {formatPrice(enrollment.course_price)}
          </span>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-xs text-brand-muted">
            <span>Status: {enrollment.enrollment_status}</span>
            <span>{enrollment.completion_percentage}% complete</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#0f1734]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent"
              style={{ width: `${Math.min(100, Math.max(0, enrollment.completion_percentage))}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-brand-muted">
            {enrollment.completed_lessons}/{enrollment.total_lessons} lessons completed
          </p>
        </div>

        <Link
          href={`/courses/${enrollment.course_slug}`}
          className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-[#0f1734] px-3 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-primary/70 hover:text-white"
        >
          Continue learning
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
