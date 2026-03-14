import { type NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { getInstructorQuizBuilderData } from '@/services/quizService';

type CreateQuizBody = {
  course_id?: unknown;
  title?: unknown;
  description?: unknown;
  passing_score?: unknown;
  attempts_allowed?: unknown;
  time_limit_minutes?: unknown;
};

const toPositiveInteger = (value: unknown, fallback: number): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  const parsed = Math.floor(value);

  if (parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const parseCreateQuizBody = (body: CreateQuizBody | null): {
  courseId: string;
  title: string;
  description: string | null;
  passingScore: number;
  attemptsAllowed: number;
  timeLimitMinutes: number | null;
} | null => {
  if (!body) {
    return null;
  }

  const courseId = typeof body.course_id === 'string' ? body.course_id.trim() : '';
  const title = typeof body.title === 'string' ? body.title.trim() : '';

  if (!courseId || !title) {
    return null;
  }

  const description =
    typeof body.description === 'string' && body.description.trim().length > 0
      ? body.description.trim()
      : null;

  const passingScore =
    typeof body.passing_score === 'number' && Number.isFinite(body.passing_score)
      ? Math.max(0, Math.min(100, Math.round(body.passing_score)))
      : 70;

  const attemptsAllowed = toPositiveInteger(body.attempts_allowed, 3);
  const timeLimitMinutes =
    typeof body.time_limit_minutes === 'number' && Number.isFinite(body.time_limit_minutes)
      ? Math.max(1, Math.floor(body.time_limit_minutes))
      : null;

  return {
    courseId,
    title,
    description,
    passingScore,
    attemptsAllowed,
    timeLimitMinutes,
  };
};

export async function GET(request: NextRequest) {
  try {
    const courseId = request.nextUrl.searchParams.get('course_id')?.trim() ?? '';

    if (!courseId) {
      return jsonResponse(400, null, 'course_id query parameter is required.');
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, null, 'Unauthorized');
    }

    const builderData = await getInstructorQuizBuilderData(user.id, courseId);

    if (!builderData) {
      return jsonResponse(404, null, 'Course not found or access denied.');
    }

    return jsonResponse(
      200,
      {
        course: builderData.course,
        quizzes: builderData.quizzes,
      },
      null,
    );
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: CreateQuizBody | null = null;

    try {
      body = (await request.json()) as CreateQuizBody;
    } catch {
      return jsonResponse(400, null, 'Invalid JSON payload.');
    }

    const parsed = parseCreateQuizBody(body);

    if (!parsed) {
      return jsonResponse(
        400,
        null,
        'Invalid payload. course_id and title are required.',
      );
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, null, 'Unauthorized');
    }

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id,instructor_id')
      .eq('id', parsed.courseId)
      .eq('instructor_id', user.id)
      .maybeSingle();

    if (courseError) {
      return jsonResponse(500, null, courseError.message);
    }

    if (!courseData) {
      return jsonResponse(404, null, 'Course not found or access denied.');
    }

    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .insert({
        course_id: parsed.courseId,
        title: parsed.title,
        description: parsed.description,
        passing_score: parsed.passingScore,
        attempts_allowed: parsed.attemptsAllowed,
        time_limit_minutes: parsed.timeLimitMinutes,
      })
      .select(
        'id,course_id,title,description,passing_score,attempts_allowed,time_limit_minutes,created_at',
      )
      .single();

    if (quizError || !quizData) {
      return jsonResponse(500, null, quizError?.message ?? 'Unable to create quiz.');
    }

    return jsonResponse(201, { quiz: quizData }, null);
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
