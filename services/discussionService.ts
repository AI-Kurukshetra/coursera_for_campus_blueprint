import { createClient } from '@/lib/supabase/server';
import type { CourseDiscussionData, DiscussionPost, DiscussionThread } from '@/types/discussion';
import type { UserRole } from '@/types/user';

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  instructor_id: string | null;
  is_published: boolean;
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

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: UserRole | null;
};

const toAuthorName = (user: UserRow | undefined): string => {
  if (!user) {
    return 'Unknown user';
  }

  return user.full_name ?? user.email ?? 'Unknown user';
};

const toDiscussionPost = (
  row: DiscussionPostRow,
  userMap: Map<string, UserRow>,
): DiscussionPost => {
  const author = userMap.get(row.author_id);

  return {
    id: row.id,
    course_id: row.course_id,
    parent_id: row.parent_id,
    content: row.content,
    upvotes: Math.max(0, Math.floor(row.upvotes ?? 0)),
    is_instructor_answer: Boolean(row.is_instructor_answer),
    created_at: row.created_at,
    author: {
      id: row.author_id,
      name: toAuthorName(author),
      role: author?.role ?? null,
    },
  };
};

export const getCourseDiscussionData = async (
  slug: string,
  currentUserId: string,
): Promise<CourseDiscussionData | null> => {
  const supabase = createClient();

  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('id,slug,title,instructor_id,is_published')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (courseError || !courseData) {
    return null;
  }

  const course = courseData as CourseRow;

  const { data: postData, error: postError } = await supabase
    .from('discussion_posts')
    .select('id,course_id,author_id,parent_id,content,upvotes,is_instructor_answer,created_at')
    .eq('course_id', course.id)
    .order('created_at', { ascending: true });

  if (postError) {
    return null;
  }

  const rows = (postData ?? []) as DiscussionPostRow[];

  const authorIds = Array.from(new Set(rows.map((item) => item.author_id)));
  authorIds.push(currentUserId);

  const uniqueAuthorIds = Array.from(new Set(authorIds));

  const { data: userData } = uniqueAuthorIds.length
    ? await supabase
        .from('users')
        .select('id,full_name,email,role')
        .in('id', uniqueAuthorIds)
    : { data: [] as UserRow[] };

  const users = (userData ?? []) as UserRow[];
  const userMap = new Map<string, UserRow>(users.map((user) => [user.id, user]));

  const posts = rows.map((row) => toDiscussionPost(row, userMap));
  const topLevelPosts = posts.filter((post) => post.parent_id === null);

  const repliesByParentId = new Map<string, DiscussionPost[]>();

  for (const post of posts) {
    if (!post.parent_id) {
      continue;
    }

    const replies = repliesByParentId.get(post.parent_id) ?? [];
    replies.push(post);
    repliesByParentId.set(post.parent_id, replies);
  }

  const threads: DiscussionThread[] = topLevelPosts.map((post) => ({
    ...post,
    replies: repliesByParentId.get(post.id) ?? [],
  }));

  const viewer = userMap.get(currentUserId);

  return {
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
    },
    current_user: {
      id: currentUserId,
      role: viewer?.role ?? null,
    },
    can_mark_answers:
      (viewer?.role === 'instructor' || viewer?.role === 'admin') &&
      course.instructor_id === currentUserId,
    threads,
  };
};
