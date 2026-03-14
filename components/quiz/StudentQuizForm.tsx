'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock3 } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/trackEvent';
import type { StudentQuizData, SubmissionAnswerMap } from '@/types/quiz';

type StudentQuizFormProps = {
  quizData: StudentQuizData;
};

type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  status: number;
};

const formatSeconds = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function StudentQuizForm({ quizData }: StudentQuizFormProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<SubmissionAnswerMap>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(
    quizData.quiz.time_limit_minutes ? quizData.quiz.time_limit_minutes * 60 : null,
  );

  const questions = quizData.questions;
  const questionCount = questions.length;
  const currentQuestion = questions[activeIndex];

  const answeredCount = useMemo(
    () =>
      questions.reduce((total, question) => {
        const value = answers[question.id];
        if (Array.isArray(value)) {
          return total + (value.length > 0 ? 1 : 0);
        }
        if (typeof value === 'string') {
          return total + (value.trim().length > 0 ? 1 : 0);
        }
        return total;
      }, 0),
    [answers, questions],
  );

  useEffect(() => {
    if (remainingSeconds === null) {
      return;
    }

    if (remainingSeconds <= 0 || isSubmitting) {
      return;
    }

    const timer = setTimeout(() => {
      setRemainingSeconds((prev) => (prev === null ? null : Math.max(0, prev - 1)));
    }, 1000);

    return () => clearTimeout(timer);
  }, [isSubmitting, remainingSeconds]);

  useEffect(() => {
    if (remainingSeconds === 0 && !isSubmitting) {
      void submitQuiz();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remainingSeconds]);

  const updateSingleAnswer = (questionId: string, value: string) => {
    setAnswers((previous) => ({
      ...previous,
      [questionId]: value,
    }));
  };

  const updateMultiSelectAnswer = (questionId: string, value: string, checked: boolean) => {
    setAnswers((previous) => {
      const current = previous[questionId];
      const currentValues =
        Array.isArray(current)
          ? current.filter((item) => typeof item === 'string')
          : typeof current === 'string'
            ? [current]
            : [];

      const nextValues = checked
        ? Array.from(new Set([...currentValues, value]))
        : currentValues.filter((item) => item !== value);

      return {
        ...previous,
        [questionId]: nextValues,
      };
    });
  };

  const submitQuiz = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      void trackEvent('quiz_attempt', {
        course_id: quizData.quiz.course_id,
        quiz_id: quizData.quiz.id,
        question_count: questionCount,
      });

      const response = await fetch(`/api/assessments/${quizData.quiz.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answers }),
      });

      const result = (await response.json()) as ApiResponse<{
        submission_id: string;
      }>;

      if (!response.ok || !result.data?.submission_id) {
        setError(result.error ?? 'Unable to submit quiz.');
        setIsSubmitting(false);
        return;
      }

      router.push(
        `/courses/${quizData.course_slug}/quizzes/${quizData.quiz.id}/results/${result.data.submission_id}`,
      );
    } catch {
      setError('Unexpected submission error.');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitQuiz();
  };

  const canGoBack = activeIndex > 0;
  const canGoNext = activeIndex < questionCount - 1;

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5">
      <section className="rounded-xl border border-brand-border/70 bg-[#121a31]/80 p-6 shadow-glass backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-3xl text-white">{quizData.quiz.title}</h2>
            <p className="mt-1 text-sm text-brand-muted">
              Question {activeIndex + 1} of {questionCount} • Answered {answeredCount}/{questionCount}
            </p>
          </div>

          {remainingSeconds !== null ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-accent/60 bg-brand-accent/15 px-3 py-1.5 text-xs font-semibold text-amber-200">
              <Clock3 className="h-4 w-4" />
              {formatSeconds(remainingSeconds)}
            </span>
          ) : null}
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#0f1734]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent"
            style={{ width: `${((activeIndex + 1) / Math.max(1, questionCount)) * 100}%` }}
          />
        </div>
      </section>

      <form onSubmit={handleSubmit} className="space-y-4">
        <section className="rounded-xl border border-brand-border/70 bg-[#121a31]/80 p-6 shadow-glass backdrop-blur-xl">
          <p className="text-xs uppercase tracking-wide text-brand-muted">
            {currentQuestion.type.replace('_', ' ')} • {currentQuestion.points} points
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">{currentQuestion.text}</h3>

          <div className="mt-5 space-y-3">
            {(currentQuestion.type === 'mcq' || currentQuestion.type === 'true_false')
              ? currentQuestion.options.map((option) => {
                  const selected = answers[currentQuestion.id] === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => updateSingleAnswer(currentQuestion.id, option.id)}
                      className={`w-full rounded-xl border p-4 text-left text-sm transition ${
                        selected
                          ? 'border-brand-primary bg-brand-primary/15 text-white'
                          : 'border-brand-border bg-[#0f1734] text-brand-text hover:border-brand-primary/45'
                      }`}
                    >
                      {option.text}
                    </button>
                  );
                })
              : null}

            {currentQuestion.type === 'multi_select'
              ? currentQuestion.options.map((option) => {
                  const selectedValues =
                    Array.isArray(answers[currentQuestion.id])
                      ? (answers[currentQuestion.id] as string[])
                      : [];
                  const selected = selectedValues.includes(option.id);

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() =>
                        updateMultiSelectAnswer(currentQuestion.id, option.id, !selected)
                      }
                      className={`w-full rounded-xl border p-4 text-left text-sm transition ${
                        selected
                          ? 'border-brand-primary bg-brand-primary/15 text-white'
                          : 'border-brand-border bg-[#0f1734] text-brand-text hover:border-brand-primary/45'
                      }`}
                    >
                      {option.text}
                    </button>
                  );
                })
              : null}

            {currentQuestion.type === 'short_answer' ? (
              <textarea
                rows={6}
                value={typeof answers[currentQuestion.id] === 'string' ? answers[currentQuestion.id] : ''}
                onChange={(event) => updateSingleAnswer(currentQuestion.id, event.target.value)}
                className="w-full rounded-xl border border-brand-border bg-[#0f1734] px-4 py-3 text-sm text-white outline-none placeholder:text-brand-muted focus:border-brand-primary"
                placeholder="Write your answer here"
              />
            ) : null}
          </div>
        </section>

        {error ? (
          <p className="rounded-lg border border-red-500/60 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setActiveIndex((index) => Math.max(0, index - 1))}
            disabled={!canGoBack || isSubmitting}
            className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-[#0f1734] px-4 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-primary/70 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {canGoNext ? (
              <button
                type="button"
                onClick={() => setActiveIndex((index) => Math.min(questionCount - 1, index + 1))}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg border border-brand-border bg-[#0f1734] px-4 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-primary/70"
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
