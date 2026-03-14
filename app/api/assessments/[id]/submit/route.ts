import { type NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { notifyStudentGraded } from '@/services/notificationService';
import {
  canStudentSubmitQuiz,
  createSubmissionRecord,
  evaluateQuizSubmission,
  getQuizForSubmission,
  getQuizQuestionsForSubmission,
  getQuizSubmissionCount,
  validateSubmissionAnswerPayload,
} from '@/services/quizService';

type SubmitQuizBody = {
  answers?: unknown;
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

    let body: SubmitQuizBody | null = null;

    try {
      body = (await request.json()) as SubmitQuizBody;
    } catch {
      return jsonResponse(400, null, 'Invalid JSON payload.');
    }

    const answers = validateSubmissionAnswerPayload(body?.answers);

    if (answers === null) {
      return jsonResponse(400, null, 'Invalid answers payload.');
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, null, 'Unauthorized');
    }

    const submitPermission = await canStudentSubmitQuiz(user.id, quizId);

    if (!submitPermission.allowed) {
      return jsonResponse(403, null, 'You are not allowed to submit this quiz.');
    }

    const quiz = await getQuizForSubmission(quizId);

    if (!quiz) {
      return jsonResponse(404, null, 'Quiz not found.');
    }

    const currentAttemptCount = await getQuizSubmissionCount(quizId, user.id);

    if (currentAttemptCount >= quiz.attempts_allowed) {
      return jsonResponse(400, null, 'Maximum quiz attempts reached.');
    }

    const questions = await getQuizQuestionsForSubmission(quizId);

    if (questions.length === 0) {
      return jsonResponse(400, null, 'Quiz has no questions.');
    }

    const evaluation = evaluateQuizSubmission(questions, answers, quiz.passing_score);

    const { submissionId, error } = await createSubmissionRecord(
      quizId,
      user.id,
      answers,
      evaluation,
      currentAttemptCount + 1,
    );

    if (error || !submissionId) {
      return jsonResponse(500, null, error ?? 'Unable to store submission.');
    }

    try {
      await notifyStudentGraded(submissionId);
    } catch {
      // Notification failures should not block quiz submission.
    }

    return jsonResponse(
      200,
      {
        submission_id: submissionId,
        score_percentage: evaluation.score_percentage,
        passed: evaluation.passed,
        total_questions: evaluation.total_questions,
        auto_graded_questions: evaluation.auto_graded_questions,
        correct_count: evaluation.correct_count,
        feedback: evaluation.feedback,
        course_slug: submitPermission.courseSlug ?? null,
      },
      null,
    );
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
