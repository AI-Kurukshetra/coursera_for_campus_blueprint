import { CourseCard, CourseFilters } from '@/components/course';
import { EmptyState } from '@/components/ui';
import { getAvailableCourseTags, getPublishedCourses } from '@/services/courseService';
import type { CourseDifficulty } from '@/types/course';

export const dynamic = 'force-dynamic';

type CoursesPageProps = {
  searchParams?: {
    search?: string;
    difficulty?: string;
    tags?: string | string[];
  };
};

const parseDifficulty = (value?: string): CourseDifficulty | '' => {
  if (value === 'beginner' || value === 'intermediate' || value === 'advanced') {
    return value;
  }

  return '';
};

const parseTags = (value?: string | string[]): string[] => {
  if (!value) {
    return [];
  }

  const rawTags = Array.isArray(value) ? value : value.split(',');

  return Array.from(
    new Set(rawTags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)),
  );
};

export default async function CoursesPage({ searchParams }: CoursesPageProps) {
  const search = searchParams?.search?.trim() ?? '';
  const difficulty = parseDifficulty(searchParams?.difficulty);
  const selectedTags = parseTags(searchParams?.tags);

  const [courses, availableTags] = await Promise.all([
    getPublishedCourses({ search, difficulty, tags: selectedTags }),
    getAvailableCourseTags(),
  ]);

  return (
    <main className="space-y-6">
      <section className="rounded-xl border border-brand-border/70 bg-gradient-to-r from-[#182550] via-[#1f336f] to-[#284997] p-6 shadow-layered">
        <p className="text-xs uppercase tracking-[0.2em] text-brand-accent">Discover</p>
        <h2 className="mt-2 font-heading text-4xl text-white">Course Catalog</h2>
        <p className="mt-2 max-w-2xl text-sm text-blue-100/90">
          Explore skill-building programs, semester-ready modules, and instructor-led pathways.
        </p>
      </section>

      <CourseFilters
        search={search}
        difficulty={difficulty}
        selectedTags={selectedTags}
        availableTags={availableTags}
      />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-brand-muted">{courses.length} course(s) found</p>
        </div>

        {courses.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No courses found"
            description="Try adjusting your filters or search query to discover more courses."
          />
        )}
      </section>
    </main>
  );
}
