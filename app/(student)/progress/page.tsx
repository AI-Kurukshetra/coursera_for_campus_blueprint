import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getStudentProgressGrades } from '@/services/gradeService';

export const dynamic = 'force-dynamic';

const formatScore = (score: number | null): string => {
  if (score === null) {
    return 'N/A';
  }

  return `${score.toFixed(2)}%`;
};

export default async function StudentProgressPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const progressGrades = await getStudentProgressGrades(user.id);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-3xl font-semibold text-gray-900">Student Progress</h2>
          <p className="mt-2 text-gray-600">Course-wise grades and completion performance.</p>
        </div>

        <a
          href={`/api/grades/transcript/${user.id}`}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
        >
          Download transcript PDF
        </a>
      </div>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-600">
              <tr>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Quiz Count</th>
                <th className="px-4 py-3">Average Score</th>
                <th className="px-4 py-3">Letter Grade</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {progressGrades.length > 0 ? (
                progressGrades.map((item) => (
                  <tr key={item.course_id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-900">{item.course_title}</td>
                    <td className="px-4 py-3 text-gray-700">{item.enrollment_status}</td>
                    <td className="px-4 py-3 text-gray-700">{item.quiz_count}</td>
                    <td className="px-4 py-3 text-gray-700">{formatScore(item.average_score)}</td>
                    <td className="px-4 py-3 text-gray-700">{item.letter_grade ?? 'N/A'}</td>
                    <td className="px-4 py-3">
                      <Link href={`/courses/${item.course_slug}`} className="text-gray-700 underline">
                        View course
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-600">
                    No enrolled course grades found.
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
