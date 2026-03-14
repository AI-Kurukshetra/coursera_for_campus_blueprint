import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { DiscussionBoard } from '@/components/discussion';
import { createClient } from '@/lib/supabase/server';
import { getCourseDiscussionData } from '@/services/discussionService';

export const dynamic = 'force-dynamic';

type CourseDiscussionPageProps = {
  params: {
    slug: string;
  };
};

export default async function CourseDiscussionPage({ params }: CourseDiscussionPageProps) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const discussionData = await getCourseDiscussionData(params.slug, user.id);

  if (!discussionData) {
    notFound();
  }

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <Link href={`/courses/${discussionData.course.slug}`} className="text-sm font-medium text-gray-700 underline">
          Back to course
        </Link>
        <h1 className="text-3xl font-semibold text-gray-900">{discussionData.course.title}</h1>
        <p className="text-sm text-gray-600">Discuss lessons, ask questions, and collaborate with peers.</p>
      </div>

      <DiscussionBoard initialData={discussionData} />
    </main>
  );
}
