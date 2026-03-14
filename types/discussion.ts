import type { UserRole } from '@/types/user';

export type DiscussionAuthor = {
  id: string;
  name: string;
  role: UserRole | null;
};

export type DiscussionPost = {
  id: string;
  course_id: string;
  parent_id: string | null;
  content: string;
  upvotes: number;
  is_instructor_answer: boolean;
  created_at: string;
  author: DiscussionAuthor;
};

export type DiscussionThread = DiscussionPost & {
  replies: DiscussionPost[];
};

export type CourseDiscussionData = {
  course: {
    id: string;
    slug: string;
    title: string;
  };
  current_user: {
    id: string;
    role: UserRole | null;
  };
  can_mark_answers: boolean;
  threads: DiscussionThread[];
};
