import { type NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';

type ProgressRequestBody = {
  lesson_id?: unknown;
  watched_seconds?: unknown;
};

type LessonInfoRow = {
  id: string;
  course_id: string;
  duration_seconds: number | null;
};

type LessonProgressInfoRow = {
  watched_seconds: number | null;
  completed: boolean | null;
};

const parseRequestBody = async (
  request: NextRequest,
): Promise<ProgressRequestBody | null> => {
  try {
    const json = (await request.json()) as ProgressRequestBody;
    return json;
  } catch {
    return null;
  }
};

const getValidatedPayload = (body: ProgressRequestBody | null): {
  lessonId: string;
  watchedSeconds: number;
} | null => {
  if (!body) {
    return null;
  }

  const lessonId = typeof body.lesson_id === 'string' ? body.lesson_id.trim() : '';
  const watchedRaw = typeof body.watched_seconds === 'number' ? body.watched_seconds : NaN;

  if (!lessonId || !Number.isFinite(watchedRaw)) {
    return null;
  }

  const watchedSeconds = Math.max(0, Math.floor(watchedRaw));

  return { lessonId, watchedSeconds };
};

export async function PATCH(request: NextRequest) {
  try {
    const payload = getValidatedPayload(await parseRequestBody(request));

    if (!payload) {
      return jsonResponse(400, null, 'Invalid payload. lesson_id and watched_seconds are required.');
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, null, 'Unauthorized');
    }

    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select('id,course_id,duration_seconds')
      .eq('id', payload.lessonId)
      .eq('is_published', true)
      .maybeSingle();

    if (lessonError) {
      return jsonResponse(500, null, lessonError.message);
    }

    if (!lessonData) {
      return jsonResponse(404, null, 'Lesson not found.');
    }

    const lesson = lessonData as LessonInfoRow;

    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', lesson.course_id)
      .maybeSingle();

    if (enrollmentError) {
      return jsonResponse(500, null, enrollmentError.message);
    }

    if (!enrollmentData) {
      return jsonResponse(403, null, 'You are not enrolled in this course.');
    }

    const existingProgressResponse = await supabase
      .from('lesson_progress')
      .select('watched_seconds,completed')
      .eq('student_id', user.id)
      .eq('lesson_id', payload.lessonId)
      .maybeSingle();

    if (existingProgressResponse.error) {
      return jsonResponse(500, null, existingProgressResponse.error.message);
    }

    const existingProgress =
      (existingProgressResponse.data as LessonProgressInfoRow | null) ?? null;

    const previousWatchedSeconds = Math.max(0, Math.floor(existingProgress?.watched_seconds ?? 0));
    const watchedSeconds = Math.max(previousWatchedSeconds, payload.watchedSeconds);

    const durationSeconds = lesson.duration_seconds ?? 0;
    const completionThreshold = durationSeconds > 0 ? 0.9 * durationSeconds : Number.POSITIVE_INFINITY;
    const completed =
      watchedSeconds >= completionThreshold || Boolean(existingProgress?.completed);

    const { data: progressData, error: progressError } = await supabase
      .from('lesson_progress')
      .upsert(
        {
          student_id: user.id,
          lesson_id: payload.lessonId,
          watched_seconds: watchedSeconds,
          completed,
          last_watched_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,lesson_id' },
      )
      .select('watched_seconds,completed')
      .single();

    if (progressError || !progressData) {
      return jsonResponse(500, null, progressError?.message ?? 'Unable to update progress.');
    }

    try {
      const origin = request.nextUrl.origin;
      const cookieHeader = request.headers.get('cookie');

      await fetch(`${origin}/api/certificates/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
        body: JSON.stringify({ course_id: lesson.course_id }),
        cache: 'no-store',
      });
    } catch {
      // Certificate generation is a non-blocking side effect of progress tracking.
    }

    return jsonResponse(
      200,
      {
        lesson_id: payload.lessonId,
        watched_seconds: progressData.watched_seconds,
        completed: Boolean(progressData.completed),
      },
      null,
    );
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
