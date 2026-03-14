import { type NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import type { QuizQuestionOption, QuizQuestionType } from '@/types/quiz';

type CreateQuestionBody = {
  text?: unknown;
  type?: unknown;
  options?: unknown;
  correct_answer?: unknown;
  points?: unknown;
};

const QUESTION_TYPES: QuizQuestionType[] = ['mcq', 'true_false', 'short_answer', 'multi_select'];

const sanitizeOptions = (value: unknown): QuizQuestionOption[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((rawOption) => {
      if (!rawOption || typeof rawOption !== 'object') {
        return null;
      }

      const option = rawOption as { id?: unknown; text?: unknown; is_correct?: unknown };
      const id = typeof option.id === 'string' ? option.id.trim() : '';
      const text = typeof option.text === 'string' ? option.text.trim() : '';

      if (!id || !text) {
        return null;
      }

      return {
        id,
        text,
        is_correct: Boolean(option.is_correct),
      } satisfies QuizQuestionOption;
    })
    .filter((option): option is QuizQuestionOption => Boolean(option));
};

const validateQuestionPayload = (body: CreateQuestionBody | null): {
  text: string;
  type: QuizQuestionType;
  options: QuizQuestionOption[];
  correctAnswer: string | null;
  points: number;
} | null => {
  if (!body) {
    return null;
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const type = typeof body.type === 'string' ? body.type : '';

  if (!text || !QUESTION_TYPES.includes(type as QuizQuestionType)) {
    return null;
  }

  const questionType = type as QuizQuestionType;
  const options = sanitizeOptions(body.options);
  const correctAnswer =
    typeof body.correct_answer === 'string' && body.correct_answer.trim().length > 0
      ? body.correct_answer.trim()
      : null;

  const points =
    typeof body.points === 'number' && Number.isFinite(body.points) && body.points > 0
      ? Math.round(body.points)
      : 1;

  if (questionType === 'mcq') {
    const correctCount = options.filter((option) => option.is_correct).length;
    if (options.length < 2 || correctCount !== 1) {
      return null;
    }
  }

  if (questionType === 'true_false') {
    const correctCount = options.filter((option) => option.is_correct).length;
    const hasTrueFalseShape =
      options.length === 2 &&
      options.some((option) => option.text.toLowerCase() === 'true') &&
      options.some((option) => option.text.toLowerCase() === 'false');

    if (!hasTrueFalseShape || correctCount !== 1) {
      return null;
    }
  }

  if (questionType === 'multi_select') {
    const correctCount = options.filter((option) => option.is_correct).length;
    if (options.length < 2 || correctCount < 1) {
      return null;
    }
  }

  if (questionType === 'short_answer' && !correctAnswer) {
    return null;
  }

  return {
    text,
    type: questionType,
    options,
    correctAnswer,
    points,
  };
};

export async function POST(
  request: NextRequest,
  context: { params: { id: string } },
) {
  try {
    const quizId = context.params.id?.trim();

    if (!quizId) {
      return jsonResponse(400, null, 'Quiz id is required.');
    }

    let body: CreateQuestionBody | null = null;

    try {
      body = (await request.json()) as CreateQuestionBody;
    } catch {
      return jsonResponse(400, null, 'Invalid JSON payload.');
    }

    const parsed = validateQuestionPayload(body);

    if (!parsed) {
      return jsonResponse(400, null, 'Invalid question payload.');
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, null, 'Unauthorized');
    }

    const { data: quizData, error: quizError } = await supabase
      .from('quizzes')
      .select('id,course_id')
      .eq('id', quizId)
      .maybeSingle();

    if (quizError) {
      return jsonResponse(500, null, quizError.message);
    }

    if (!quizData) {
      return jsonResponse(404, null, 'Quiz not found.');
    }

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id,instructor_id')
      .eq('id', quizData.course_id)
      .eq('instructor_id', user.id)
      .maybeSingle();

    if (courseError) {
      return jsonResponse(500, null, courseError.message);
    }

    if (!courseData) {
      return jsonResponse(403, null, 'Access denied.');
    }

    const { data: questionCountData, error: questionCountError } = await supabase
      .from('questions')
      .select('id')
      .eq('quiz_id', quizId);

    if (questionCountError) {
      return jsonResponse(500, null, questionCountError.message);
    }

    const orderIndex = questionCountData.length + 1;

    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .insert({
        quiz_id: quizId,
        text: parsed.text,
        type: parsed.type,
        options: parsed.options,
        correct_answer: parsed.correctAnswer,
        points: parsed.points,
        order_index: orderIndex,
      })
      .select('id,quiz_id,text,type,options,correct_answer,points,order_index')
      .single();

    if (questionError || !questionData) {
      return jsonResponse(500, null, questionError?.message ?? 'Unable to create question.');
    }

    return jsonResponse(201, { question: questionData }, null);
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
