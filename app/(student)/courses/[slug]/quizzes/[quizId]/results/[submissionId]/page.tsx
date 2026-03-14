import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getStudentQuizResultData } from '@/services/quizService';

export const dynamic = 'force-dynamic';

type QuizResultPageProps = {
  params: {
    slug: string;
    quizId: string;
    submissionId: string;
  };
};

const formatAnswer = (value: string | string[] | null): string => {
  if (value === null) {
    return 'N/A';
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'None';
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : 'N/A';
};

export default async function QuizResultPage({ params }: QuizResultPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const resultData = await getStudentQuizResultData(
    user.id,
    params.slug,
    params.quizId,
    params.submissionId,
  );

  if (!resultData) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/courses/${params.slug}/quizzes/${params.quizId}`}
          className="text-sm font-medium text-gray-700 underline"
        >
          Retake / view quiz
        </Link>
        <Link href="/dashboard" className="text-sm font-medium text-gray-700 underline">
          Back to dashboard
        </Link>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-3xl font-semibold text-gray-900">{resultData.quiz.title} Results</h2>
        <p className="mt-2 text-gray-600">Course: {resultData.course_title}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-700">
            Score: {resultData.score_percentage}%
          </span>
          <span
            className={`rounded-full px-3 py-1 text-sm font-semibold ${
              resultData.passed ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {resultData.passed ? 'Passed' : 'Failed'}
          </span>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xl font-semibold text-gray-900">Per-question feedback</h3>

        {resultData.feedback.map((item, index) => (
          <article key={item.question_id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-gray-900">
              {index + 1}. {item.question_text}
            </p>
            <p className="mt-1 text-xs text-gray-500">Type: {item.type}</p>

            <div className="mt-3 space-y-1 text-sm text-gray-700">
              <p>
                <span className="font-medium">Your answer:</span> {formatAnswer(item.user_answer)}
              </p>
              <p>
                <span className="font-medium">Expected:</span> {formatAnswer(item.expected_answer)}
              </p>
              <p>
                <span className="font-medium">Feedback:</span> {item.message}
              </p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
