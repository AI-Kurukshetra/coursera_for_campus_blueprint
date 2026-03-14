import { notFound, redirect } from 'next/navigation';
import { QuizBuilder } from '@/components/quiz';
import { createClient } from '@/lib/supabase/server';
import { getInstructorQuizBuilderData } from '@/services/quizService';

export const dynamic = 'force-dynamic';

type InstructorQuizBuilderPageProps = {
  params: {
    id: string;
  };
};

export default async function InstructorQuizBuilderPage({
  params,
}: InstructorQuizBuilderPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const builderData = await getInstructorQuizBuilderData(user.id, params.id);

  if (!builderData) {
    notFound();
  }

  return (
    <main className="space-y-5">
      <div>
        <h2 className="text-3xl font-semibold text-gray-900">Quiz Builder</h2>
        <p className="mt-2 text-gray-600">Create assessments and manage question sets.</p>
      </div>

      <QuizBuilder
        courseId={builderData.course.id}
        courseTitle={builderData.course.title}
        initialQuizzes={builderData.quizzes}
      />
    </main>
  );
}
