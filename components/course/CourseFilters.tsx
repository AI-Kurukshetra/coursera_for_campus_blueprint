import type { CourseDifficulty } from '@/types/course';

type CourseFiltersProps = {
  search: string;
  difficulty: CourseDifficulty | '';
  selectedTags: string[];
  availableTags: string[];
};

const difficultyOptions: Array<{ label: string; value: CourseDifficulty | '' }> = [
  { label: 'All', value: '' },
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'advanced' },
];

export default function CourseFilters({
  search,
  difficulty,
  selectedTags,
  availableTags,
}: CourseFiltersProps) {
  return (
    <form method="get" action="/courses" className="space-y-4">
      <div className="rounded-xl border border-brand-border/70 bg-[#121a31]/70 p-3 shadow-glass backdrop-blur-xl">
        <input
          id="search"
          name="search"
          type="text"
          defaultValue={search}
          placeholder="Search courses, skills, or instructor..."
          className="h-12 w-full rounded-lg border border-brand-border bg-[#0f1734] px-4 text-sm text-white outline-none placeholder:text-brand-muted focus:border-brand-primary"
        />
      </div>

      <div className="rounded-xl border border-brand-border/70 bg-[#121a31]/70 p-4 shadow-glass backdrop-blur-xl">
        <div className="flex flex-wrap gap-2">
          {difficultyOptions.map((option) => {
            const active = difficulty === option.value;

            return (
              <button
                key={option.label}
                type="submit"
                name="difficulty"
                value={option.value}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  active
                    ? 'border-brand-primary bg-brand-primary/20 text-white'
                    : 'border-brand-border bg-[#0f1734] text-brand-muted hover:border-brand-primary/50 hover:text-brand-text'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {availableTags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {availableTags.slice(0, 10).map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <label
                  key={tag}
                  className={`inline-flex cursor-pointer items-center rounded-full border px-3 py-1.5 text-xs transition ${
                    isSelected
                      ? 'border-brand-accent bg-brand-accent/20 text-amber-200'
                      : 'border-brand-border bg-[#0f1734] text-brand-muted hover:border-brand-accent/50 hover:text-brand-text'
                  }`}
                >
                  <input
                    type="checkbox"
                    name="tags"
                    value={tag}
                    defaultChecked={isSelected}
                    className="sr-only"
                  />
                  {tag}
                </label>
              );
            })}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="submit"
            className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.99]"
          >
            Apply Filters
          </button>
          <a
            href="/courses"
            className="rounded-lg border border-brand-border bg-[#0f1734] px-4 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-primary/70"
          >
            Reset
          </a>
        </div>
      </div>
    </form>
  );
}
