import { type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { jsonResponse } from '@/lib/api/response';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const handlePaymentIntentSucceeded = async (
  paymentIntent: Stripe.PaymentIntent,
): Promise<{ ok: boolean; error?: string }> => {
  const studentId = paymentIntent.metadata.student_id;
  const courseId = paymentIntent.metadata.course_id;

  if (!studentId || !courseId) {
    return { ok: false, error: 'Missing payment metadata for enrollment.' };
  }

  const supabase = createAdminClient();
  const { error: upsertError } = await supabase
    .from('enrollments')
    .upsert(
      {
        student_id: studentId,
        course_id: courseId,
        status: 'active',
      },
      { onConflict: 'student_id,course_id' },
    );

  if (upsertError) {
    return { ok: false, error: upsertError.message };
  }

  return { ok: true };
};

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeSecretKey || !stripeWebhookSecret) {
      return jsonResponse(500, null, 'Stripe webhook environment variables are missing.');
    }

    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return jsonResponse(400, null, 'Missing stripe-signature header.');
    }

    const payload = await request.text();
    const stripe = new Stripe(stripeSecretKey);

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(payload, signature, stripeWebhookSecret);
    } catch {
      return jsonResponse(400, null, 'Invalid webhook signature.');
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const result = await handlePaymentIntentSucceeded(paymentIntent);

      if (!result.ok) {
        return jsonResponse(500, null, result.error ?? 'Enrollment update failed.');
      }
    }

    return jsonResponse(200, { received: true, eventType: event.type }, null);
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
