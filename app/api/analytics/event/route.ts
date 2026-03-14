import { type NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import type { AnalyticsEventType, AnalyticsMetadata } from '@/types/analytics';

type AnalyticsEventBody = {
  type?: unknown;
  metadata?: unknown;
};

const ALLOWED_EVENT_TYPES: AnalyticsEventType[] = [
  'lesson_view',
  'video_play',
  'quiz_attempt',
  'course_enroll',
];

const isEventType = (value: string): value is AnalyticsEventType =>
  ALLOWED_EVENT_TYPES.includes(value as AnalyticsEventType);

const sanitizeMetadata = (value: unknown): AnalyticsMetadata => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const result: AnalyticsMetadata = {};

  for (const [key, raw] of entries) {
    if (!key.trim()) {
      continue;
    }

    if (
      raw === null ||
      typeof raw === 'string' ||
      typeof raw === 'number' ||
      typeof raw === 'boolean'
    ) {
      result[key] = raw;
    }
  }

  return result;
};

export async function POST(request: NextRequest) {
  try {
    let body: AnalyticsEventBody | null = null;

    try {
      body = (await request.json()) as AnalyticsEventBody;
    } catch {
      return jsonResponse(400, null, 'Invalid JSON payload.');
    }

    const eventType = typeof body?.type === 'string' ? body.type.trim() : '';

    if (!isEventType(eventType)) {
      return jsonResponse(400, null, 'Invalid analytics event type.');
    }

    const metadata = sanitizeMetadata(body?.metadata);

    const courseId =
      typeof metadata.course_id === 'string' && metadata.course_id.trim().length > 0
        ? metadata.course_id.trim()
        : null;

    const lessonId =
      typeof metadata.lesson_id === 'string' && metadata.lesson_id.trim().length > 0
        ? metadata.lesson_id.trim()
        : null;

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, null, 'Unauthorized');
    }

    const { error: insertError } = await supabase.from('analytics_events').insert({
      user_id: user.id,
      event_type: eventType,
      course_id: courseId,
      lesson_id: lessonId,
      metadata,
    });

    if (insertError) {
      return jsonResponse(500, null, insertError.message);
    }

    return jsonResponse(201, { event_type: eventType }, null);
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
