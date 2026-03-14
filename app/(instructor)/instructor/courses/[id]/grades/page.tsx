import Link from 'next/link';
import { Download } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getInstructorGradebookData } from '@/services/gradeService';

export const dynamic = 'force-dynamic';

type InstructorGradebookPageProps = {
  params: {
    id: string;
  };
};

const formatScore = (score: number | null): string => {
  if (score === null) {
    return 'N/A';
  }

  return `${score.toFixed(2)}%`;
};

const scoreClass = (score: number | null): string => {
  if (score === null) {
    return 'text-brand-muted';
  }

  if (score >= 90) {
    return 'text-emerald-300';
  }

  if (score >= 70) {
    return 'text-blue-300';
  }

  if (score >= 60) {
    return 'text-amber-300';
  }

  return 'text-rose-300';
};

export default async function InstructorGradebookPage({
  params,
}: InstructorGradebookPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const gradebook = await getInstructorGradebookData(user.id, params.id);

  if (!gradebook) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-4xl text-white">Gradebook</h2>
          <p className="mt-2 text-brand-muted">Course: {gradebook.course_title}</p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href={`/api/grades/transcript/${user.id}`}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-[#121a31] px-4 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-primary/70"
          >
            <Download className="h-4 w-4" />
            Export PDF
          </a>
          <Link
            href="/instructor/courses"
            className="rounded-lg border border-brand-border bg-[#121a31] px-4 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-primary/70"
          >
            Back
          </Link>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-brand-border/70 bg-[#121a31]/80 shadow-glass">
        <div className="max-h-[520px] overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-[#101935] text-left text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Quiz Title</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Letter Grade</th>
              </tr>
            </thead>
            <tbody>
              {gradebook.rows.length > 0 ? (
                gradebook.rows.map((row) => (
                  <tr key={`${row.student_id}-${row.quiz_id}`} className="border-t border-brand-border/60">
                    <td className="px-4 py-3 text-brand-text">{row.student_name}</td>
                    <td className="px-4 py-3 text-brand-muted">{row.quiz_title}</td>
                    <td className={`px-4 py-3 font-semibold ${scoreClass(row.score)}`}>
                      {formatScore(row.score)}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${scoreClass(row.score)}`}>
                      {row.letter_grade ?? 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-brand-muted">
                    No gradebook rows yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-brand-border/70 bg-[#121a31]/80 shadow-glass">
        <div className="border-b border-brand-border/60 px-4 py-3">
          <h3 className="font-heading text-2xl text-white">Final Course Grades</h3>
          <p className="text-xs text-brand-muted">Average of all quiz scores in this course.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#101935] text-left text-xs uppercase tracking-wide text-brand-muted">
              <tr>
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Average Score</th>
                <th className="px-4 py-3">Letter Grade</th>
              </tr>
            </thead>
            <tbody>
              {gradebook.final_grades.length > 0 ? (
                gradebook.final_grades.map((item) => (
                  <tr key={item.student_id} className="border-t border-brand-border/60">
                    <td className="px-4 py-3 text-brand-text">{item.student_name}</td>
                    <td className={`px-4 py-3 font-semibold ${scoreClass(item.average_score)}`}>
                      {formatScore(item.average_score)}
                    </td>
                    <td className={`px-4 py-3 font-semibold ${scoreClass(item.average_score)}`}>
                      {item.letter_grade ?? 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-brand-muted">
                    No final grades available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
