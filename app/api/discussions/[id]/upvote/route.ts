import { type NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';

type RouteContext = {
  params: {
    id: string;
  };
};

type DiscussionPostUpvoteRow = {
  id: string;
  parent_id: string | null;
  upvotes: number | null;
};

export async function POST(_request: NextRequest, context: RouteContext) {
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

    const { data: postData, error: postError } = await supabase
      .from('discussion_posts')
      .select('id,parent_id,upvotes')
      .eq('id', postId)
      .maybeSingle();

    if (postError) {
      return jsonResponse(500, null, postError.message);
    }

    if (!postData) {
      return jsonResponse(404, null, 'Discussion post not found.');
    }

    const post = postData as DiscussionPostUpvoteRow;
    const currentUpvotes = Math.max(0, Math.floor(post.upvotes ?? 0));
    const nextUpvotes = currentUpvotes + 1;

    const { data: updatedData, error: updateError } = await supabase
      .from('discussion_posts')
      .update({ upvotes: nextUpvotes })
      .eq('id', postId)
      .select('id,parent_id,upvotes')
      .single();

    if (updateError || !updatedData) {
      return jsonResponse(500, null, updateError?.message ?? 'Unable to upvote discussion post.');
    }

    const updatedPost = updatedData as DiscussionPostUpvoteRow;

    return jsonResponse(
      200,
      {
        id: updatedPost.id,
        parent_id: updatedPost.parent_id,
        upvotes: Math.max(0, Math.floor(updatedPost.upvotes ?? 0)),
      },
      null,
    );
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
