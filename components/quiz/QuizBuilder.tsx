'use client';

import { FormEvent, useMemo, useState } from 'react';
import type {
  InstructorQuizWithQuestions,
  QuizQuestionOption,
  QuizQuestionType,
  QuizSummary,
} from '@/types/quiz';

type QuizBuilderProps = {
  courseId: string;
  courseTitle: string;
  initialQuizzes: InstructorQuizWithQuestions[];
};

type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  status: number;
};

type CreateQuizFormState = {
  title: string;
  description: string;
  passingScore: string;
  attemptsAllowed: string;
  timeLimitMinutes: string;
};

type OptionDraft = {
  id: string;
  text: string;
  is_correct: boolean;
};

type QuestionFormState = {
  text: string;
  type: QuizQuestionType;
  points: string;
  correctAnswer: string;
  trueFalseCorrect: 'true' | 'false';
  options: OptionDraft[];
};

const createOptionDraft = (): OptionDraft => ({
  id: Math.random().toString(36).slice(2, 10),
  text: '',
  is_correct: false,
});

const createInitialQuestionForm = (): QuestionFormState => ({
  text: '',
  type: 'mcq',
  points: '1',
  correctAnswer: '',
  trueFalseCorrect: 'true',
  options: [createOptionDraft(), createOptionDraft()],
});

const createQuestionFormMap = (
  quizzes: InstructorQuizWithQuestions[],
): Record<string, QuestionFormState> =>
  Object.fromEntries(quizzes.map((quiz) => [quiz.quiz.id, createInitialQuestionForm()]));

const describeOptions = (options: QuizQuestionOption[]): string => {
  if (options.length === 0) {
    return 'No options';
  }

  return options
    .map((option) => `${option.text}${option.is_correct ? ' (correct)' : ''}`)
    .join(', ');
};

export default function QuizBuilder({ courseId, courseTitle, initialQuizzes }: QuizBuilderProps) {
  const [quizzes, setQuizzes] = useState<InstructorQuizWithQuestions[]>(initialQuizzes);
  const [questionForms, setQuestionForms] = useState<Record<string, QuestionFormState>>(
    createQuestionFormMap(initialQuizzes),
  );
  const [createForm, setCreateForm] = useState<CreateQuizFormState>({
    title: '',
    description: '',
    passingScore: '70',
    attemptsAllowed: '3',
    timeLimitMinutes: '',
  });
  const [isCreatingQuiz, setIsCreatingQuiz] = useState(false);
  const [savingQuestionForQuizId, setSavingQuestionForQuizId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const quizCount = useMemo(() => quizzes.length, [quizzes]);

  const refreshQuizData = async () => {
    const response = await fetch(`/api/assessments?course_id=${encodeURIComponent(courseId)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const result = (await response.json()) as ApiResponse<{
      quizzes: InstructorQuizWithQuestions[];
    }>;

    if (!response.ok || !result.data) {
      throw new Error(result.error ?? 'Unable to refresh quizzes.');
    }

    const nextQuizzes = result.data.quizzes;
    setQuizzes(nextQuizzes);

    setQuestionForms((previousForms) => {
      const nextForms: Record<string, QuestionFormState> = {};

      for (const quiz of nextQuizzes) {
        nextForms[quiz.quiz.id] = previousForms[quiz.quiz.id] ?? createInitialQuestionForm();
      }

      return nextForms;
    });
  };

  const handleCreateQuiz = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const title = createForm.title.trim();

    if (!title) {
      setError('Quiz title is required.');
      return;
    }

    setIsCreatingQuiz(true);

    try {
      const payload = {
        course_id: courseId,
        title,
        description: createForm.description.trim() || null,
        passing_score: Number(createForm.passingScore || '70'),
        attempts_allowed: Number(createForm.attemptsAllowed || '3'),
        time_limit_minutes: createForm.timeLimitMinutes.trim()
          ? Number(createForm.timeLimitMinutes)
          : null,
      };

      const response = await fetch('/api/assessments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as ApiResponse<{ quiz: QuizSummary }>;

      if (!response.ok || !result.data) {
        throw new Error(result.error ?? 'Unable to create quiz.');
      }

      setCreateForm({
        title: '',
        description: '',
        passingScore: '70',
        attemptsAllowed: '3',
        timeLimitMinutes: '',
      });

      await refreshQuizData();
      setSuccess('Quiz created successfully.');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create quiz.');
    } finally {
      setIsCreatingQuiz(false);
    }
  };

  const updateQuestionForm = (
    quizId: string,
    updater: (previous: QuestionFormState) => QuestionFormState,
  ) => {
    setQuestionForms((previousForms) => ({
      ...previousForms,
      [quizId]: updater(previousForms[quizId] ?? createInitialQuestionForm()),
    }));
  };

  const buildQuestionPayload = (form: QuestionFormState) => {
    const text = form.text.trim();

    if (!text) {
      throw new Error('Question text is required.');
    }

    const points = Math.max(1, Number(form.points || '1'));

    if (form.type === 'short_answer') {
      const correctAnswer = form.correctAnswer.trim();

      if (!correctAnswer) {
        throw new Error('Correct answer is required for short answer questions.');
      }

      return {
        text,
        type: form.type,
        points,
        correct_answer: correctAnswer,
        options: [],
      };
    }

    if (form.type === 'true_false') {
      const options: QuizQuestionOption[] = [
        { id: 'true', text: 'True', is_correct: form.trueFalseCorrect === 'true' },
        { id: 'false', text: 'False', is_correct: form.trueFalseCorrect === 'false' },
      ];

      return {
        text,
        type: form.type,
        points,
        correct_answer: null,
        options,
      };
    }

    const options = form.options
      .map((option) => ({
        id: option.id,
        text: option.text.trim(),
        is_correct: option.is_correct,
      }))
      .filter((option) => option.text.length > 0);

    if (options.length < 2) {
      throw new Error('At least 2 options are required.');
    }

    const correctCount = options.filter((option) => option.is_correct).length;

    if (form.type === 'mcq' && correctCount !== 1) {
      throw new Error('MCQ requires exactly one correct option.');
    }

    if (form.type === 'multi_select' && correctCount < 1) {
      throw new Error('Multi-select requires at least one correct option.');
    }

    return {
      text,
      type: form.type,
      points,
      correct_answer: null,
      options,
    };
  };

  const handleAddQuestion = async (quizId: string) => {
    setError(null);
    setSuccess(null);

    const form = questionForms[quizId] ?? createInitialQuestionForm();

    setSavingQuestionForQuizId(quizId);

    try {
      const payload = buildQuestionPayload(form);

      const response = await fetch(`/api/assessments/${quizId}/questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as ApiResponse<{ question: unknown }>;

      if (!response.ok || !result.data) {
        throw new Error(result.error ?? 'Unable to add question.');
      }

      updateQuestionForm(quizId, () => createInitialQuestionForm());
      await refreshQuizData();
      setSuccess('Question added successfully.');
    } catch (questionError) {
      setError(questionError instanceof Error ? questionError.message : 'Unable to add question.');
    } finally {
      setSavingQuestionForQuizId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900">Create Quiz</h3>
        <p className="mt-1 text-sm text-gray-600">Course: {courseTitle}</p>

        <form onSubmit={handleCreateQuiz} className="mt-5 grid gap-4">
          <div>
            <label htmlFor="quizTitle" className="mb-1 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="quizTitle"
              type="text"
              value={createForm.title}
              onChange={(event) =>
                setCreateForm((previous) => ({ ...previous, title: event.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              required
            />
          </div>

          <div>
            <label
              htmlFor="quizDescription"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="quizDescription"
              rows={3}
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((previous) => ({ ...previous, description: event.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label
                htmlFor="passingScore"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Passing score (%)
              </label>
              <input
                id="passingScore"
                type="number"
                min={0}
                max={100}
                value={createForm.passingScore}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, passingScore: event.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="attemptsAllowed"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Attempts
              </label>
              <input
                id="attemptsAllowed"
                type="number"
                min={1}
                value={createForm.attemptsAllowed}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, attemptsAllowed: event.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>

            <div>
              <label
                htmlFor="timeLimitMinutes"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Time limit (min)
              </label>
              <input
                id="timeLimitMinutes"
                type="number"
                min={1}
                value={createForm.timeLimitMinutes}
                onChange={(event) =>
                  setCreateForm((previous) => ({ ...previous, timeLimitMinutes: event.target.value }))
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isCreatingQuiz}
            className="w-fit rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isCreatingQuiz ? 'Creating...' : 'Create quiz'}
          </button>
        </form>
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {success ? <p className="text-sm text-green-700">{success}</p> : null}

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900">Quizzes ({quizCount})</h3>

        {quizzes.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">No quizzes yet.</p>
        ) : (
          <div className="mt-4 space-y-6">
            {quizzes.map((quizItem) => {
              const form = questionForms[quizItem.quiz.id] ?? createInitialQuestionForm();

              return (
                <article key={quizItem.quiz.id} className="rounded-lg border border-gray-200 p-4">
                  <div className="mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">{quizItem.quiz.title}</h4>
                    <p className="text-sm text-gray-600">{quizItem.quiz.description ?? 'No description'}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      Passing: {quizItem.quiz.passing_score}% | Attempts: {quizItem.quiz.attempts_allowed}
                    </p>
                  </div>

                  <div className="mb-4 space-y-2">
                    <h5 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Questions ({quizItem.questions.length})
                    </h5>
                    {quizItem.questions.length === 0 ? (
                      <p className="text-sm text-gray-600">No questions added yet.</p>
                    ) : (
                      <ul className="space-y-2">
                        {quizItem.questions.map((question) => (
                          <li key={question.id} className="rounded-md border border-gray-200 p-3">
                            <p className="text-sm font-medium text-gray-900">
                              {question.order_index}. {question.text}
                            </p>
                            <p className="mt-1 text-xs text-gray-600">
                              Type: {question.type} | Points: {question.points}
                            </p>
                            <p className="mt-1 text-xs text-gray-600">
                              {question.type === 'short_answer'
                                ? `Expected answer: ${question.correct_answer ?? 'N/A'}`
                                : describeOptions(question.options)}
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div className="space-y-3 rounded-md border border-dashed border-gray-300 p-3">
                    <h5 className="text-sm font-semibold text-gray-800">Add Question</h5>

                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">Question text</label>
                      <input
                        type="text"
                        value={form.text}
                        onChange={(event) =>
                          updateQuestionForm(quizItem.quiz.id, (previous) => ({
                            ...previous,
                            text: event.target.value,
                          }))
                        }
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Type</label>
                        <select
                          value={form.type}
                          onChange={(event) => {
                            const nextType = event.target.value as QuizQuestionType;

                            updateQuestionForm(quizItem.quiz.id, (previous) => ({
                              ...previous,
                              type: nextType,
                              options:
                                nextType === 'mcq' || nextType === 'multi_select'
                                  ? previous.options.length >= 2
                                    ? previous.options
                                    : [createOptionDraft(), createOptionDraft()]
                                  : previous.options,
                            }));
                          }}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="mcq">MCQ</option>
                          <option value="true_false">True / False</option>
                          <option value="short_answer">Short Answer</option>
                          <option value="multi_select">Multi Select</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">Points</label>
                        <input
                          type="number"
                          min={1}
                          value={form.points}
                          onChange={(event) =>
                            updateQuestionForm(quizItem.quiz.id, (previous) => ({
                              ...previous,
                              points: event.target.value,
                            }))
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>

                    {form.type === 'short_answer' ? (
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Correct answer
                        </label>
                        <input
                          type="text"
                          value={form.correctAnswer}
                          onChange={(event) =>
                            updateQuestionForm(quizItem.quiz.id, (previous) => ({
                              ...previous,
                              correctAnswer: event.target.value,
                            }))
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        />
                      </div>
                    ) : null}

                    {form.type === 'true_false' ? (
                      <div>
                        <label className="mb-1 block text-xs font-medium text-gray-700">
                          Correct option
                        </label>
                        <select
                          value={form.trueFalseCorrect}
                          onChange={(event) =>
                            updateQuestionForm(quizItem.quiz.id, (previous) => ({
                              ...previous,
                              trueFalseCorrect: event.target.value as 'true' | 'false',
                            }))
                          }
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                        >
                          <option value="true">True</option>
                          <option value="false">False</option>
                        </select>
                      </div>
                    ) : null}

                    {(form.type === 'mcq' || form.type === 'multi_select') ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-gray-700">Options</p>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuestionForm(quizItem.quiz.id, (previous) => ({
                                ...previous,
                                options: [...previous.options, createOptionDraft()],
                              }))
                            }
                            className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700"
                          >
                            Add option
                          </button>
                        </div>

                        {form.options.map((option, optionIndex) => (
                          <div key={option.id} className="flex items-center gap-2">
                            {form.type === 'mcq' ? (
                              <input
                                type="radio"
                                checked={option.is_correct}
                                onChange={() =>
                                  updateQuestionForm(quizItem.quiz.id, (previous) => ({
                                    ...previous,
                                    options: previous.options.map((item) => ({
                                      ...item,
                                      is_correct: item.id === option.id,
                                    })),
                                  }))
                                }
                              />
                            ) : (
                              <input
                                type="checkbox"
                                checked={option.is_correct}
                                onChange={(event) =>
                                  updateQuestionForm(quizItem.quiz.id, (previous) => ({
                                    ...previous,
                                    options: previous.options.map((item) =>
                                      item.id === option.id
                                        ? { ...item, is_correct: event.target.checked }
                                        : item,
                                    ),
                                  }))
                                }
                              />
                            )}

                            <input
                              type="text"
                              value={option.text}
                              onChange={(event) =>
                                updateQuestionForm(quizItem.quiz.id, (previous) => ({
                                  ...previous,
                                  options: previous.options.map((item) =>
                                    item.id === option.id
                                      ? { ...item, text: event.target.value }
                                      : item,
                                  ),
                                }))
                              }
                              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                              placeholder={`Option ${optionIndex + 1}`}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                updateQuestionForm(quizItem.quiz.id, (previous) => ({
                                  ...previous,
                                  options:
                                    previous.options.length > 2
                                      ? previous.options.filter((item) => item.id !== option.id)
                                      : previous.options,
                                }))
                              }
                              className="rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => void handleAddQuestion(quizItem.quiz.id)}
                      disabled={savingQuestionForQuizId === quizItem.quiz.id}
                      className="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {savingQuestionForQuizId === quizItem.quiz.id
                        ? 'Adding...'
                        : 'Add question'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
