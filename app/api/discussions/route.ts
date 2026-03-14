import { type NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import { notifyPostAuthorReply } from '@/services/notificationService';
import type { DiscussionPost } from '@/types/discussion';
import type { UserRole } from '@/types/user';

type CreateDiscussionRequestBody = {
  course_id?: unknown;
  parent_id?: unknown;
  content?: unknown;
};

type CourseRow = {
  id: string;
  instructor_id: string | null;
  is_published: boolean;
};

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole | null;
};

type DiscussionPostRow = {
  id: string;
  course_id: string;
  author_id: string;
  parent_id: string | null;
  content: string;
  upvotes: number | null;
  is_instructor_answer: boolean | null;
  created_at: string;
};

type ParsedPayload = {
  courseId: string;
  parentId: string | null;
  content: string;
};

const parseRequestBody = async (
  request: NextRequest,
): Promise<CreateDiscussionRequestBody | null> => {
  try {
    const json = (await request.json()) as CreateDiscussionRequestBody;
    return json;
  } catch {
    return null;
  }
};

const getValidatedPayload = (body: CreateDiscussionRequestBody | null): ParsedPayload | null => {
  if (!body) {
    return null;
  }

  const courseId = typeof body.course_id === 'string' ? body.course_id.trim() : '';
  const content = typeof body.content === 'string' ? body.content.trim() : '';

  let parentId: string | null = null;

  if (typeof body.parent_id === 'string') {
    parentId = body.parent_id.trim() || null;
  }

  if (!courseId || !content || content.length > 5000) {
    return null;
  }

  return {
    courseId,
    parentId,
    content,
  };
};

const toAuthorName = (profile: UserRow | null): string =>
  profile?.full_name ?? profile?.email ?? 'Unknown user';

const toDiscussionPost = (post: DiscussionPostRow, profile: UserRow | null): DiscussionPost => ({
  id: post.id,
  course_id: post.course_id,
  parent_id: post.parent_id,
  content: post.content,
  upvotes: Math.max(0, Math.floor(post.upvotes ?? 0)),
  is_instructor_answer: Boolean(post.is_instructor_answer),
  created_at: post.created_at,
  author: {
    id: post.author_id,
    name: toAuthorName(profile),
    role: profile?.role ?? null,
  },
});

export async function POST(request: NextRequest) {
  try {
    const payload = getValidatedPayload(await parseRequestBody(request));

    if (!payload) {
      return jsonResponse(400, null, 'Invalid payload. course_id and content are required.');
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, null, 'Unauthorized');
    }

    const { data: userProfileData, error: userProfileError } = await supabase
      .from('users')
      .select('id,full_name,email,role')
      .eq('id', user.id)
      .maybeSingle();

    if (userProfileError || !userProfileData) {
      return jsonResponse(403, null, 'User profile not found.');
    }

    const userProfile = userProfileData as UserRow;

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id,instructor_id,is_published')
      .eq('id', payload.courseId)
      .maybeSingle();

    if (courseError) {
      return jsonResponse(500, null, courseError.message);
    }

    if (!courseData) {
      return jsonResponse(404, null, 'Course not found.');
    }

    const course = courseData as CourseRow;

    const canBypassEnrollmentCheck =
      course.instructor_id === user.id ||
      userProfile.role === 'admin' ||
      userProfile.role === 'university_manager';

    if (!course.is_published && !canBypassEnrollmentCheck) {
      return jsonResponse(403, null, 'This course is not open for discussion yet.');
    }

    if (userProfile.role === 'student' && !canBypassEnrollmentCheck) {
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', payload.courseId)
        .maybeSingle();

      if (enrollmentError) {
        return jsonResponse(500, null, enrollmentError.message);
      }

      if (!enrollmentData) {
        return jsonResponse(403, null, 'You must be enrolled in this course to post.');
      }
    }

    if (payload.parentId) {
      const { data: parentData, error: parentError } = await supabase
        .from('discussion_posts')
        .select('id,course_id,parent_id')
        .eq('id', payload.parentId)
        .eq('course_id', payload.courseId)
        .maybeSingle();

      if (parentError) {
        return jsonResponse(500, null, parentError.message);
      }

      if (!parentData) {
        return jsonResponse(404, null, 'Parent post not found.');
      }

      const parentPost = parentData as { id: string; course_id: string; parent_id: string | null };

      if (parentPost.parent_id !== null) {
        return jsonResponse(400, null, 'Only one level of replies is supported.');
      }
    }

    const { data: insertedPostData, error: insertError } = await supabase
      .from('discussion_posts')
      .insert({
        course_id: payload.courseId,
        author_id: user.id,
        parent_id: payload.parentId,
        content: payload.content,
      })
      .select('id,course_id,author_id,parent_id,content,upvotes,is_instructor_answer,created_at')
      .single();

    if (insertError || !insertedPostData) {
      return jsonResponse(500, null, insertError?.message ?? 'Unable to create discussion post.');
    }

    const insertedPost = insertedPostData as DiscussionPostRow;

    if (insertedPost.parent_id) {
      try {
        await notifyPostAuthorReply(insertedPost.id);
      } catch {
        // Notification failures should not block reply creation.
      }
    }

    return jsonResponse(
      201,
      {
        post: toDiscussionPost(insertedPost, userProfile),
      },
      null,
    );
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
