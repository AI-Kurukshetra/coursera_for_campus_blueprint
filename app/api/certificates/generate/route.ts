import { type NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { generateCourseCertificate } from '@/services/certificateService';
import { notifyStudentCertificate } from '@/services/notificationService';

export const runtime = 'nodejs';

type GenerateCertificateBody = {
  course_id?: unknown;
};

const parseRequestBody = async (
  request: NextRequest,
): Promise<GenerateCertificateBody | null> => {
  try {
    const json = (await request.json()) as GenerateCertificateBody;
    return json;
  } catch {
    return null;
  }
};

const getValidatedCourseId = (body: GenerateCertificateBody | null): string | null => {
  if (!body) {
    return null;
  }

  const courseId = typeof body.course_id === 'string' ? body.course_id.trim() : '';

  return courseId.length > 0 ? courseId : null;
};

export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody(request);
    const courseId = getValidatedCourseId(body);

    if (!courseId) {
      return jsonResponse(400, null, 'Invalid payload. course_id is required.');
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, null, 'Unauthorized');
    }

    const result = await generateCourseCertificate(user.id, courseId);

    if (result.generated && result.certificate?.id) {
      try {
        await notifyStudentCertificate(result.certificate.id);
      } catch {
        // Notification/email failures should not block certificate generation.
      }
    }

    return jsonResponse(200, result, null);
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
