import { type NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types/user';

type RouteContext = {
  params: {
    id: string;
  };
};

type UserRoleRow = {
  id: string;
  role: UserRole | null;
};

type DiscussionPostRow = {
  id: string;
  course_id: string;
  parent_id: string | null;
  is_instructor_answer: boolean | null;
};

type CourseInstructorRow = {
  id: string;
  instructor_id: string | null;
};

export async function PATCH(_request: NextRequest, context: RouteContext) {
  try {
    const postId = context.params.id?.trim();

    if (!postId) {
      return jsonResponse(400, null, 'Discussion post id is required.');
    }

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return jsonResponse(401, null, 'Unauthorized');
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id,role')
      .eq('id', user.id)
      .maybeSingle();

    if (userError || !userData) {
      return jsonResponse(403, null, 'User profile not found.');
    }

    const profile = userData as UserRoleRow;

    if (profile.role !== 'instructor') {
      return jsonResponse(403, null, 'Only instructors can mark an answer.');
    }

    const { data: postData, error: postError } = await supabase
      .from('discussion_posts')
      .select('id,course_id,parent_id,is_instructor_answer')
      .eq('id', postId)
      .maybeSingle();

    if (postError) {
      return jsonResponse(500, null, postError.message);
    }

    if (!postData) {
      return jsonResponse(404, null, 'Discussion reply not found.');
    }

    const post = postData as DiscussionPostRow;

    if (post.parent_id === null) {
      return jsonResponse(400, null, 'Only replies can be marked as an answer.');
    }

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id,instructor_id')
      .eq('id', post.course_id)
      .maybeSingle();

    if (courseError) {
      return jsonResponse(500, null, courseError.message);
    }

    if (!courseData) {
      return jsonResponse(404, null, 'Course not found.');
    }

    const course = courseData as CourseInstructorRow;

    if (course.instructor_id !== user.id) {
      return jsonResponse(403, null, 'Only this course instructor can mark an answer.');
    }

    const { error: clearError } = await supabase
      .from('discussion_posts')
      .update({ is_instructor_answer: false })
      .eq('course_id', post.course_id)
      .eq('parent_id', post.parent_id);

    if (clearError) {
      return jsonResponse(500, null, clearError.message);
    }

    const { data: updatedData, error: updateError } = await supabase
      .from('discussion_posts')
      .update({ is_instructor_answer: true })
      .eq('id', post.id)
      .select('id,parent_id,is_instructor_answer')
      .single();

    if (updateError || !updatedData) {
      return jsonResponse(500, null, updateError?.message ?? 'Unable to mark answer.');
    }

    const updated = updatedData as {
      id: string;
      parent_id: string | null;
      is_instructor_answer: boolean | null;
    };

    return jsonResponse(
      200,
      {
        id: updated.id,
        parent_id: updated.parent_id,
        is_instructor_answer: Boolean(updated.is_instructor_answer),
      },
      null,
    );
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
