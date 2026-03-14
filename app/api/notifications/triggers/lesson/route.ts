import { type NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { notifyEnrolledStudents } from '@/services/notificationService';
import type { UserRole } from '@/types/user';

type TriggerLessonBody = {
  lesson_id?: unknown;
};

type UserProfileRow = {
  id: string;
  role: UserRole | null;
};

type LessonOwnerRow = {
  id: string;
  course_id: string;
};

type CourseOwnerRow = {
  id: string;
  instructor_id: string | null;
};

const parseRequestBody = async (request: NextRequest): Promise<TriggerLessonBody | null> => {
  try {
    return (await request.json()) as TriggerLessonBody;
  } catch {
    return null;
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request);
    const lessonId = typeof body?.lesson_id === 'string' ? body.lesson_id.trim() : '';

    if (!lessonId) {
      return jsonResponse(400, null, 'lesson_id is required.');
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, null, 'Unauthorized');
    }

    const { data: profileData } = await supabase
      .from('users')
      .select('id,role')
      .eq('id', user.id)
      .maybeSingle();

    const profile = (profileData as UserProfileRow | null) ?? null;

    if (!profile || (profile.role !== 'instructor' && profile.role !== 'admin')) {
      return jsonResponse(403, null, 'Only instructors or admins can trigger lesson notifications.');
    }

    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select('id,course_id')
      .eq('id', lessonId)
      .maybeSingle();

    if (lessonError || !lessonData) {
      return jsonResponse(404, null, 'Lesson not found.');
    }

    const lesson = lessonData as LessonOwnerRow;

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id,instructor_id')
      .eq('id', lesson.course_id)
      .maybeSingle();

    if (courseError || !courseData) {
      return jsonResponse(404, null, 'Course not found for lesson.');
    }

    const course = courseData as CourseOwnerRow;

    if (profile.role === 'instructor' && course.instructor_id !== user.id) {
      return jsonResponse(403, null, 'Only the owning instructor can trigger this notification.');
    }

    const createdCount = await notifyEnrolledStudents(lessonId);

    return jsonResponse(
      200,
      {
        created_count: createdCount,
      },
      null,
    );
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
