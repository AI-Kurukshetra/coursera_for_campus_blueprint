export type LessonLearningItem = {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  duration_seconds: number | null;
  video_url: string | null;
  watched_seconds: number;
  completed: boolean;
};

export type LessonCourseMeta = {
  id: string;
  slug: string;
  title: string;
};
