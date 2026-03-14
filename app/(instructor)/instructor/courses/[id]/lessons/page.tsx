import { LessonManager } from '@/components/course';

export const dynamic = 'force-dynamic';

type LessonsPageProps = {
  params: {
    id: string;
  };
};

export default function LessonsPage({ params }: LessonsPageProps) {
  return <LessonManager courseId={params.id} />;
}
