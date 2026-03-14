import { type NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/api/response';
import { createClient } from '@/lib/supabase/server';

type RouteContext = {
  params: {
    id: string;
  };
};

type DiscussionPostOwnershipRow = {
  id: string;
  author_id: string;
  parent_id: string | null;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
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
      .select('id,author_id,parent_id')
      .eq('id', postId)
      .maybeSingle();

    if (postError) {
      return jsonResponse(500, null, postError.message);
    }

    if (!postData) {
      return jsonResponse(404, null, 'Discussion post not found.');
    }

    const post = postData as DiscussionPostOwnershipRow;

    if (post.author_id !== user.id) {
      return jsonResponse(403, null, 'You can only delete your own posts.');
    }

    if (post.parent_id === null) {
      const { data: replyData, error: replyError } = await supabase
        .from('discussion_posts')
        .select('id')
        .eq('parent_id', post.id)
        .limit(1);

      if (replyError) {
        return jsonResponse(500, null, replyError.message);
      }

      if ((replyData ?? []).length > 0) {
        return jsonResponse(409, null, 'Cannot delete a thread that already has replies.');
      }
    }

    const { error: deleteError } = await supabase
      .from('discussion_posts')
      .delete()
      .eq('id', post.id)
      .eq('author_id', user.id);

    if (deleteError) {
      return jsonResponse(500, null, deleteError.message);
    }

    return jsonResponse(
      200,
      {
        id: post.id,
        parent_id: post.parent_id,
      },
      null,
    );
  } catch {
    return jsonResponse(500, null, 'Unexpected server error.');
  }
}
