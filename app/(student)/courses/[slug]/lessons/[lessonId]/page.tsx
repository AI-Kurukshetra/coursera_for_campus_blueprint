import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import LessonLearningClient from '@/components/lesson/LessonLearningClient';
import { createClient } from '@/lib/supabase/server';
import { getLessonLearningData } from '@/services/courseService';

export const dynamic = 'force-dynamic';

type LessonPageProps = {
  params: {
    slug: string;
    lessonId: string;
  };
};

export default async function LessonPage({ params }: LessonPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const learningData = await getLessonLearningData(user.id, params.slug, params.lessonId);

  if (!learningData) {
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

      <LessonLearningClient
        course={learningData.course}
        initialLessons={learningData.lessons}
        activeLessonId={learningData.activeLessonId}
      />
    </main>
  );
}
