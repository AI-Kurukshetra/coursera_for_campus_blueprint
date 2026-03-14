import { type NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';

type EnrollmentRequestBody = {
  courseId?: string;
};

type CoursePricingRow = {
  id: string;
  price: number | null;
  is_published: boolean;
};

type EnrollmentRow = {
  id: string;
  student_id: string;
  course_id: string;
  status: string;
};

const parseRequestBody = async (
  request: NextRequest,
): Promise<EnrollmentRequestBody | null> => {
  try {
    const json = (await request.json()) as EnrollmentRequestBody;
    return json;
  } catch {
    return null;
  }
};

export async function POST(request: NextRequest) {
  try {
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
      .select('id,price,is_published')
      .eq('id', courseId)
      .maybeSingle();

    if (courseError) {
      return jsonResponse(500, null, courseError.message);
    }

    if (!courseData) {
      return jsonResponse(404, null, 'Course not found.');
    }

    const course = courseData as CoursePricingRow;

    if (!course.is_published) {
      return jsonResponse(400, null, 'Course is not published for enrollment.');
    }

    const numericPrice = Number(course.price ?? 0);

    if (!Number.isFinite(numericPrice)) {
      return jsonResponse(500, null, 'Invalid course price.');
    }

    if (numericPrice > 0) {
      return jsonResponse(
        400,
        null,
        'Paid course. Create payment intent at /api/payments/create-intent first.',
      );
    }

    const { data: existingEnrollmentData, error: existingEnrollmentError } = await supabase
      .from('enrollments')
      .select('id,student_id,course_id,status')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .maybeSingle();

    if (existingEnrollmentError) {
      return jsonResponse(500, null, existingEnrollmentError.message);
    }

    if (existingEnrollmentData) {
      return jsonResponse(
        200,
        { enrollment: existingEnrollmentData as EnrollmentRow, already_enrolled: true },
        null,
      );
    }

    const { data: enrollmentData, error: enrollmentError } = await supabase
      .from('enrollments')
      .insert({
        student_id: user.id,
        course_id: courseId,
        status: 'active',
      })
      .select('id,student_id,course_id,status')
      .single();

    if (enrollmentError) {
      return jsonResponse(500, null, enrollmentError.message);
    }

    return jsonResponse(
      201,
      { enrollment: enrollmentData as EnrollmentRow, already_enrolled: false },
      null,
    );
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
