import { createClient } from '@/lib/supabase/server';
import type {
  InstructorQuizWithQuestions,
  QuizEvaluationResult,
  QuizQuestion,
  QuizQuestionFeedback,
  QuizQuestionOption,
  QuizQuestionType,
  QuizSummary,
  StudentQuizData,
  StudentQuizQuestion,
  StudentQuizQuestionOption,
  StudentQuizResultData,
  SubmissionAnswerMap,
  SubmissionAnswerValue,
} from '@/types/quiz';

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  instructor_id: string | null;
  is_published: boolean;
};

type QuizRow = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  passing_score: number | null;
  attempts_allowed: number | null;
  time_limit_minutes: number | null;
  created_at: string;
};

type QuestionRow = {
  id: string;
  quiz_id: string;
  text: string;
  type: QuizQuestionType;
  options: unknown;
  correct_answer: string | null;
  points: number | null;
  order_index: number | null;
};

type EnrollmentRow = {
  id: string;
};

type SubmissionRow = {
  id: string;
  answers: unknown;
  score: number | null;
  passed: boolean | null;
  submitted_at: string;
};

const toQuizSummary = (quiz: QuizRow): QuizSummary => ({
  id: quiz.id,
  course_id: quiz.course_id,
  title: quiz.title,
  description: quiz.description,
  passing_score: Number(quiz.passing_score ?? 70),
  attempts_allowed: Number(quiz.attempts_allowed ?? 3),
  time_limit_minutes: quiz.time_limit_minutes,
  created_at: quiz.created_at,
});

const parseQuestionOptions = (value: unknown): QuizQuestionOption[] => {
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

const toQuizQuestion = (question: QuestionRow): QuizQuestion => ({
  id: question.id,
  quiz_id: question.quiz_id,
  text: question.text,
  type: question.type,
  options: parseQuestionOptions(question.options),
  correct_answer: question.correct_answer,
  points: Number(question.points ?? 1),
  order_index: Number(question.order_index ?? 0),
});

const toStudentQuestionOptions = (options: QuizQuestionOption[]): StudentQuizQuestionOption[] =>
  options.map((option) => ({ id: option.id, text: option.text }));

const toStudentQuizQuestion = (question: QuizQuestion): StudentQuizQuestion => ({
  id: question.id,
  text: question.text,
  type: question.type,
  options: toStudentQuestionOptions(question.options),
  points: question.points,
  order_index: question.order_index,
});

const parseSubmissionAnswerMap = (value: unknown): SubmissionAnswerMap => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const answerMap = value as Record<string, unknown>;
  const sanitized: SubmissionAnswerMap = {};

  for (const [key, rawValue] of Object.entries(answerMap)) {
    if (!key) {
      continue;
    }

    if (typeof rawValue === 'string') {
      sanitized[key] = rawValue;
      continue;
    }

    if (Array.isArray(rawValue) && rawValue.every((item) => typeof item === 'string')) {
      sanitized[key] = rawValue;
    }
  }

  return sanitized;
};

const normalizeStringArray = (value: string[]): string[] =>
  Array.from(new Set(value.map((item) => item.trim()).filter((item) => item.length > 0))).sort(
    (left, right) => left.localeCompare(right),
  );

const getCorrectOptionIds = (options: QuizQuestionOption[]): string[] =>
  options.filter((option) => option.is_correct).map((option) => option.id);

const getCorrectOptionTexts = (options: QuizQuestionOption[]): string[] =>
  options.filter((option) => option.is_correct).map((option) => option.text);

const evaluateQuestion = (
  question: QuizQuestion,
  userAnswer: SubmissionAnswerValue | undefined,
): {
  feedback: QuizQuestionFeedback;
  autoGraded: boolean;
  pointsPossible: number;
  pointsEarned: number;
} => {
  const points = question.points > 0 ? question.points : 1;

  if (question.type === 'mcq' || question.type === 'true_false') {
    const correctOption = question.options.find((option) => option.is_correct) ?? null;
    const correctOptionId = correctOption?.id ?? null;
    const userAnswerValue = typeof userAnswer === 'string' ? userAnswer : null;
    const userOption = question.options.find((option) => option.id === userAnswerValue) ?? null;
    const isCorrect = Boolean(correctOptionId && userAnswerValue === correctOptionId);

    return {
      feedback: {
        question_id: question.id,
        question_text: question.text,
        type: question.type,
        is_correct: isCorrect,
        expected_answer: correctOption?.text ?? null,
        user_answer: userOption?.text ?? userAnswerValue,
        message: isCorrect ? 'Correct answer.' : 'Incorrect answer.',
      },
      autoGraded: true,
      pointsPossible: points,
      pointsEarned: isCorrect ? points : 0,
    };
  }

  if (question.type === 'multi_select') {
    const userAnswerIds = Array.isArray(userAnswer)
      ? normalizeStringArray(userAnswer)
      : typeof userAnswer === 'string'
        ? normalizeStringArray([userAnswer])
        : [];

    const userAnswerValues = userAnswerIds.map((id) => {
      const option = question.options.find((item) => item.id === id);
      return option?.text ?? id;
    });

    return {
      feedback: {
        question_id: question.id,
        question_text: question.text,
        type: question.type,
        is_correct: null,
        expected_answer: getCorrectOptionTexts(question.options),
        user_answer: userAnswerValues,
        message: 'Submitted. Multi-select grading is pending manual review.',
      },
      autoGraded: false,
      pointsPossible: 0,
      pointsEarned: 0,
    };
  }

  const shortAnswer = typeof userAnswer === 'string' ? userAnswer.trim() : '';

  return {
    feedback: {
      question_id: question.id,
      question_text: question.text,
      type: question.type,
      is_correct: null,
      expected_answer: question.correct_answer,
      user_answer: shortAnswer.length > 0 ? shortAnswer : null,
      message: 'Submitted. Short answer grading is pending manual review.',
    },
    autoGraded: false,
    pointsPossible: 0,
    pointsEarned: 0,
  };
};

export const evaluateQuizSubmission = (
  questions: QuizQuestion[],
  answers: SubmissionAnswerMap,
  passingScore: number,
): QuizEvaluationResult => {
  let pointsPossible = 0;
  let pointsEarned = 0;
  let autoGradedQuestions = 0;
  let correctCount = 0;

  const feedback: QuizQuestionFeedback[] = questions.map((question) => {
    const evaluation = evaluateQuestion(question, answers[question.id]);

    if (evaluation.autoGraded) {
      autoGradedQuestions += 1;
      pointsPossible += evaluation.pointsPossible;
      pointsEarned += evaluation.pointsEarned;

      if (evaluation.feedback.is_correct) {
        correctCount += 1;
      }
    }

    return evaluation.feedback;
  });

  const scorePercentage =
    pointsPossible > 0 ? Math.round((pointsEarned / pointsPossible) * 100) : 0;

  return {
    score_percentage: scorePercentage,
    passed: scorePercentage >= passingScore,
    total_questions: questions.length,
    auto_graded_questions: autoGradedQuestions,
    correct_count: correctCount,
    feedback,
  };
};

const getQuizQuestions = async (quizId: string): Promise<QuizQuestion[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('questions')
    .select('id,quiz_id,text,type,options,correct_answer,points,order_index')
    .eq('quiz_id', quizId)
    .order('order_index', { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as QuestionRow[]).map((row) => toQuizQuestion(row));
};

export const getInstructorQuizBuilderData = async (
  instructorId: string,
  courseId: string,
): Promise<{
  course: CourseRow;
  quizzes: InstructorQuizWithQuestions[];
} | null> => {
  const supabase = createClient();

  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('id,slug,title,instructor_id,is_published')
    .eq('id', courseId)
    .eq('instructor_id', instructorId)
    .maybeSingle();

  if (courseError || !courseData) {
    return null;
  }

  const course = courseData as CourseRow;

  const { data: quizData, error: quizError } = await supabase
    .from('quizzes')
    .select('id,course_id,title,description,passing_score,attempts_allowed,time_limit_minutes,created_at')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  if (quizError || !quizData) {
    return { course, quizzes: [] };
  }

  const quizzes = quizData as QuizRow[];
  const questionsByQuiz = new Map<string, QuizQuestion[]>();

  for (const quiz of quizzes) {
    const questions = await getQuizQuestions(quiz.id);
    questionsByQuiz.set(quiz.id, questions);
  }

  return {
    course,
    quizzes: quizzes.map((quiz) => ({
      quiz: toQuizSummary(quiz),
      questions: questionsByQuiz.get(quiz.id) ?? [],
    })),
  };
};

export const getStudentQuizData = async (
  studentId: string,
  slug: string,
  quizId: string,
): Promise<StudentQuizData | null> => {
  const supabase = createClient();

  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('id,slug,title,instructor_id,is_published')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (courseError || !courseData) {
    return null;
  }

  const course = courseData as CourseRow;

  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', studentId)
    .eq('course_id', course.id)
    .maybeSingle();

  if (enrollmentError || !enrollmentData) {
    return null;
  }

  const { data: quizData, error: quizError } = await supabase
    .from('quizzes')
    .select('id,course_id,title,description,passing_score,attempts_allowed,time_limit_minutes,created_at')
    .eq('id', quizId)
    .eq('course_id', course.id)
    .maybeSingle();

  if (quizError || !quizData) {
    return null;
  }

  const quiz = toQuizSummary(quizData as QuizRow);
  const questions = await getQuizQuestions(quiz.id);

  return {
    course_slug: course.slug,
    course_title: course.title,
    quiz,
    questions: questions.map((question) => toStudentQuizQuestion(question)),
  };
};

export const getQuizSubmissionCount = async (
  quizId: string,
  studentId: string,
): Promise<number> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('submissions')
    .select('id')
    .eq('quiz_id', quizId)
    .eq('student_id', studentId);

  if (error || !data) {
    return 0;
  }

  return data.length;
};

export const getQuizForSubmission = async (quizId: string): Promise<QuizSummary | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('quizzes')
    .select('id,course_id,title,description,passing_score,attempts_allowed,time_limit_minutes,created_at')
    .eq('id', quizId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return toQuizSummary(data as QuizRow);
};

export const getQuizQuestionsForSubmission = async (
  quizId: string,
): Promise<QuizQuestion[]> => getQuizQuestions(quizId);

export const canStudentSubmitQuiz = async (
  studentId: string,
  quizId: string,
): Promise<{ allowed: boolean; courseSlug?: string }> => {
  const supabase = createClient();

  const { data: quizData, error: quizError } = await supabase
    .from('quizzes')
    .select('id,course_id,title,description,passing_score,attempts_allowed,time_limit_minutes,created_at')
    .eq('id', quizId)
    .maybeSingle();

  if (quizError || !quizData) {
    return { allowed: false };
  }

  const quiz = quizData as QuizRow;

  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('id,slug,title,instructor_id,is_published')
    .eq('id', quiz.course_id)
    .eq('is_published', true)
    .maybeSingle();

  if (courseError || !courseData) {
    return { allowed: false };
  }

  const course = courseData as CourseRow;

  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', studentId)
    .eq('course_id', course.id)
    .maybeSingle();

  if (enrollmentError || !enrollmentData) {
    return { allowed: false };
  }

  return { allowed: true, courseSlug: course.slug };
};

export const createSubmissionRecord = async (
  quizId: string,
  studentId: string,
  answers: SubmissionAnswerMap,
  evaluation: QuizEvaluationResult,
  attemptNumber: number,
): Promise<{ submissionId: string | null; error: string | null }> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      quiz_id: quizId,
      student_id: studentId,
      answers,
      score: evaluation.score_percentage,
      passed: evaluation.passed,
      attempt_number: attemptNumber,
      graded_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) {
    return {
      submissionId: null,
      error: error?.message ?? 'Unable to create submission.',
    };
  }

  return {
    submissionId: (data as { id: string }).id,
    error: null,
  };
};

export const getStudentQuizResultData = async (
  studentId: string,
  slug: string,
  quizId: string,
  submissionId: string,
): Promise<StudentQuizResultData | null> => {
  const supabase = createClient();

  const quizData = await getStudentQuizData(studentId, slug, quizId);

  if (!quizData) {
    return null;
  }

  const { data: submissionData, error: submissionError } = await supabase
    .from('submissions')
    .select('id,answers,score,passed,submitted_at')
    .eq('id', submissionId)
    .eq('quiz_id', quizId)
    .eq('student_id', studentId)
    .maybeSingle();

  if (submissionError || !submissionData) {
    return null;
  }

  const submission = submissionData as SubmissionRow;
  const fullQuestions = await getQuizQuestionsForSubmission(quizId);
  const answers = parseSubmissionAnswerMap(submission.answers);
  const evaluation = evaluateQuizSubmission(fullQuestions, answers, quizData.quiz.passing_score);

  return {
    course_slug: quizData.course_slug,
    course_title: quizData.course_title,
    quiz: quizData.quiz,
    submission_id: submission.id,
    score_percentage: Math.round(Number(submission.score ?? evaluation.score_percentage)),
    passed: Boolean(submission.passed ?? evaluation.passed),
    submitted_at: submission.submitted_at,
    feedback: evaluation.feedback,
  };
};

export const validateSubmissionAnswerPayload = (
  rawAnswers: unknown,
): SubmissionAnswerMap | null => {
  const answerMap = parseSubmissionAnswerMap(rawAnswers);

  if (Object.keys(answerMap).length === 0) {
    return {};
  }

  return answerMap;
};

export const getQuizQuestionCount = async (quizId: string): Promise<number> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('questions')
    .select('id')
    .eq('quiz_id', quizId);

  if (error || !data) {
    return 0;
  }

  return data.length;
};

export const getCourseEnrollment = async (
  studentId: string,
  courseId: string,
): Promise<EnrollmentRow | null> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as EnrollmentRow;
};

export const getQuestionCorrectAnswerText = (question: QuizQuestion): string | string[] | null => {
  if (question.type === 'short_answer') {
    return question.correct_answer;
  }

  const correctTexts = getCorrectOptionTexts(question.options);

  if (question.type === 'multi_select') {
    return correctTexts;
  }

  return correctTexts[0] ?? null;
};
