import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { StudentQuizForm } from '@/components/quiz';
import { createClient } from '@/lib/supabase/server';
import { getStudentQuizData } from '@/services/quizService';

export const dynamic = 'force-dynamic';

type StudentQuizPageProps = {
  params: {
    slug: string;
    quizId: string;
  };
};

export default async function StudentQuizPage({ params }: StudentQuizPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const quizData = await getStudentQuizData(user.id, params.slug, params.quizId);

  if (!quizData) {
    notFound();
  }

  return (
    <main className="space-y-5">
      <Link
        href={`/courses/${params.slug}`}
        className="inline-block text-sm font-medium text-brand-muted transition hover:text-white"
      >
        ← Back to course
      </Link>

      <StudentQuizForm quizData={quizData} />
    </main>
  );
}
