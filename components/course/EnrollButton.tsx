'use client';

import { useState } from 'react';
import { trackEvent } from '@/lib/analytics/trackEvent';

type EnrollButtonProps = {
  courseId: string;
  price: number | null;
};

type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  status: number;
};

export default function EnrollButton({ courseId, price }: EnrollButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleEnroll = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const isFreeCourse = Number(price ?? 0) <= 0;
      const endpoint = isFreeCourse ? '/api/enrollments' : '/api/payments/create-intent';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ courseId }),
      });

      const result = (await response.json()) as ApiResponse<{
        already_enrolled?: boolean;
        paymentIntentId?: string;
      }>;

      if (!response.ok || result.error) {
        setError(result.error ?? 'Unable to complete enrollment action.');
        setIsLoading(false);
        return;
      }

      if (isFreeCourse) {
        setSuccess(
          result.data?.already_enrolled
            ? 'You are already enrolled in this course.'
            : 'Enrollment successful for this free course.',
        );
      } else {
        setSuccess(
          `Payment intent created (${result.data?.paymentIntentId ?? 'no-id'}). Complete payment with your Stripe client flow.`,
        );
      }

      void trackEvent('course_enroll', {
        course_id: courseId,
        is_free_course: isFreeCourse,
        already_enrolled: Boolean(result.data?.already_enrolled),
        payment_intent_id: result.data?.paymentIntentId ?? null,
      });
    } catch {
      setError('Unexpected enrollment error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleEnroll}
        disabled={isLoading}
        className="w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isLoading ? 'Processing...' : 'Enroll'}
      </button>

      {error ? (
        <p className="rounded-lg border border-red-500/60 bg-red-500/10 px-2.5 py-2 text-xs text-red-300">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-emerald-500/60 bg-emerald-500/10 px-2.5 py-2 text-xs text-emerald-200">
          {success}
        </p>
      ) : null}
    </div>
  );
}
