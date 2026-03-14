import { type NextRequest } from 'next/server';
import Stripe from 'stripe';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';

type CreateIntentBody = {
  courseId?: string;
};

type CoursePaymentRow = {
  id: string;
  title: string;
  price: number | null;
  is_published: boolean;
};

const parseRequestBody = async (request: NextRequest): Promise<CreateIntentBody | null> => {
  try {
    const json = (await request.json()) as CreateIntentBody;
    return json;
  } catch {
    return null;
  }
};

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return jsonResponse(500, null, 'STRIPE_SECRET_KEY is not configured.');
    }

    const body = await parseRequestBody(request);

    if (!body?.courseId || typeof body.courseId !== 'string') {
      return jsonResponse(400, null, 'Invalid payload. courseId is required.');
    }

    const courseId = body.courseId.trim();

    if (courseId.length === 0) {
      return jsonResponse(400, null, 'Invalid payload. courseId is required.');
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
      .select('id,title,price,is_published')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError) {
      return jsonResponse(500, null, courseError.message);
    }

    if (!courseData) {
      return jsonResponse(404, null, 'Course not found.');
    }

    const course = courseData as CoursePaymentRow;

    if (!course.is_published) {
      return jsonResponse(400, null, 'Course is not published for enrollment.');
    }

    const numericPrice = Number(course.price ?? 0);

    if (!Number.isFinite(numericPrice)) {
      return jsonResponse(500, null, 'Invalid course price.');
    }

    if (numericPrice <= 0) {
      return jsonResponse(400, null, 'Course is free. Use /api/enrollments instead.');
    }

    const { data: existingEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('student_id', user.id)
      .eq('course_id', course.id)
      .maybeSingle();

    if (existingEnrollment) {
      return jsonResponse(409, null, 'User is already enrolled in this course.');
    }

    const amountInCents = Math.round(numericPrice * 100);

    if (amountInCents <= 0) {
      return jsonResponse(500, null, 'Invalid payment amount.');
    }

    const stripe = new Stripe(stripeSecretKey);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        student_id: user.id,
        course_id: course.id,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return jsonResponse(
      200,
      {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: amountInCents,
        currency: 'usd',
      },
      null,
    );
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
