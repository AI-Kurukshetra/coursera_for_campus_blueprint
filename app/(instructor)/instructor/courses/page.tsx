import { InstructorCourseManager } from '@/components/course';

export const dynamic = 'force-dynamic';

export default function InstructorCoursesPage() {
  return (
    <main className="space-y-4">
      <div>
        <h2 className="text-3xl font-semibold text-gray-900">Instructor Course CMS</h2>
        <p className="mt-2 text-gray-600">
          Create and manage your courses, thumbnails, publishing state, and lesson content.
        </p>
      </div>

      <InstructorCourseManager />
    </main>
  );
}
