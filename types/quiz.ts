export type QuizQuestionType = 'mcq' | 'true_false' | 'short_answer' | 'multi_select';

export type QuizQuestionOption = {
  id: string;
  text: string;
  is_correct: boolean;
};

export type QuizQuestion = {
  id: string;
  quiz_id: string;
  text: string;
  type: QuizQuestionType;
  options: QuizQuestionOption[];
  correct_answer: string | null;
  points: number;
  order_index: number;
};

export type QuizSummary = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  passing_score: number;
  attempts_allowed: number;
  time_limit_minutes: number | null;
  created_at: string;
};

export type InstructorQuizWithQuestions = {
  quiz: QuizSummary;
  questions: QuizQuestion[];
};

export type StudentQuizQuestionOption = {
  id: string;
  text: string;
};

export type StudentQuizQuestion = {
  id: string;
  text: string;
  type: QuizQuestionType;
  options: StudentQuizQuestionOption[];
  points: number;
  order_index: number;
};

export type StudentQuizData = {
  course_slug: string;
  course_title: string;
  quiz: QuizSummary;
  questions: StudentQuizQuestion[];
};

export type SubmissionAnswerValue = string | string[];

export type SubmissionAnswerMap = Record<string, SubmissionAnswerValue>;

export type QuizQuestionFeedback = {
  question_id: string;
  question_text: string;
  type: QuizQuestionType;
  is_correct: boolean | null;
  expected_answer: string | string[] | null;
  user_answer: string | string[] | null;
  message: string;
};

export type QuizEvaluationResult = {
  score_percentage: number;
  passed: boolean;
  total_questions: number;
  auto_graded_questions: number;
  correct_count: number;
  feedback: QuizQuestionFeedback[];
};

export type StudentQuizResultData = {
  course_slug: string;
  course_title: string;
  quiz: QuizSummary;
  submission_id: string;
  score_percentage: number;
  passed: boolean;
  submitted_at: string;
  feedback: QuizQuestionFeedback[];
};
