export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type CourseListItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  difficulty: CourseDifficulty | null;
  price: number | null;
  tags: string[];
  instructor_id: string | null;
  instructor_name: string | null;
};

export type CourseDetail = CourseListItem & {
  duration_hours: number | null;
  prerequisites: string[];
  instructor_email: string | null;
  instructor_bio: string | null;
};

export type LessonPreview = {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  duration_seconds: number | null;
};

export type CourseListFilters = {
  search: string;
  difficulty: CourseDifficulty | '';
  tags: string[];
};

export type CourseDetailResult = {
  course: CourseDetail;
  lessons: LessonPreview[];
};

export type InstructorCourse = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: CourseDifficulty | null;
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
};

export type InstructorLesson = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  duration_seconds: number | null;
  video_url: string | null;
};
