import { generateTranscriptPdfBuffer } from '@/lib/grades/TranscriptPdf';
import { createClient } from '@/lib/supabase/server';
import { getRequesterRole, getStudentTranscriptData } from '@/services/gradeService';

export const runtime = 'nodejs';

const CAN_READ_ANY_TRANSCRIPT_ROLES = new Set([
  'admin',
  'instructor',
  'university_manager',
]);

export async function GET(
  _request: Request,
  context: { params: { studentId: string } },
) {
  try {
    const studentId = context.params.studentId?.trim();

    if (!studentId) {
      return new Response('studentId is required.', { status: 400 });
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const requesterRole = await getRequesterRole(user.id);

    if (user.id !== studentId && !CAN_READ_ANY_TRANSCRIPT_ROLES.has(requesterRole ?? '')) {
      return new Response('Forbidden', { status: 403 });
    }

    const transcript = await getStudentTranscriptData(studentId);

    if (!transcript) {
      return new Response('Transcript data not found.', { status: 404 });
    }

    const pdfBuffer = await generateTranscriptPdfBuffer(transcript);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="transcript-${studentId}.pdf"`,
      },
    });
  } catch {
    return new Response('Unexpected server error.', { status: 500 });
  }
}
