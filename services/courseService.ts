import { createClient } from '@/lib/supabase/server';
import type {
  CourseDetail,
  CourseDetailResult,
  CourseDifficulty,
  CourseListFilters,
  CourseListItem,
  LessonPreview,
} from '@/types/course';
import type { LessonCourseMeta, LessonLearningItem } from '@/types/lesson';

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  difficulty: CourseDifficulty | null;
  price: number | null;
  tags: string[] | null;
  instructor_id: string | null;
  duration_hours?: number | null;
  prerequisites?: string[] | null;
};

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type LessonRow = {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  duration_seconds: number | null;
};

type PublishedCourseMetaRow = {
  id: string;
  slug: string;
  title: string;
};

type LessonWithVideoRow = {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
  duration_seconds: number | null;
  video_url: string | null;
};

type LessonProgressRow = {
  lesson_id: string;
  watched_seconds: number | null;
  completed: boolean | null;
};

const COURSE_LIST_COLUMNS =
  'id,slug,title,description,thumbnail_url,difficulty,price,tags,instructor_id';

const COURSE_DETAIL_COLUMNS =
  'id,slug,title,description,thumbnail_url,difficulty,price,tags,instructor_id,duration_hours,prerequisites';

const normalizeSearch = (value: string): string =>
  value
    .trim()
    .replace(/[,%]/g, ' ')
    .replace(/\s+/g, ' ');

const normalizeTags = (tags: string[]): string[] =>
  Array.from(new Set(tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0)));

const getInstructorMap = async (instructorIds: string[]): Promise<Map<string, UserRow>> => {
  if (instructorIds.length === 0) {
    return new Map<string, UserRow>();
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('users')
    .select('id,full_name,email')
    .in('id', instructorIds);

  if (error || !data) {
    return new Map<string, UserRow>();
  }

  return new Map<string, UserRow>(
    (data as UserRow[]).map((instructor) => [instructor.id, instructor]),
  );
};

const buildCourseListItem = (
  course: CourseRow,
  instructorMap: Map<string, UserRow>,
): CourseListItem => {
  const instructor = course.instructor_id ? instructorMap.get(course.instructor_id) : undefined;

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    thumbnail_url: course.thumbnail_url,
    difficulty: course.difficulty,
    price: course.price,
    tags: course.tags ?? [],
    instructor_id: course.instructor_id,
    instructor_name: instructor?.full_name ?? null,
  };
};

export const getPublishedCourses = async (
  filters: CourseListFilters,
): Promise<CourseListItem[]> => {
  const supabase = createClient();
  const normalizedSearch = normalizeSearch(filters.search);
  const normalizedTags = normalizeTags(filters.tags);

  let query = supabase
    .from('courses')
    .select(COURSE_LIST_COLUMNS)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (normalizedSearch.length > 0) {
    query = query.or(`title.ilike.%${normalizedSearch}%,description.ilike.%${normalizedSearch}%`);
  }

  if (filters.difficulty) {
    query = query.eq('difficulty', filters.difficulty);
  }

  if (normalizedTags.length > 0) {
    query = query.overlaps('tags', normalizedTags);
  }

  const { data, error } = await query;

  if (error || !data) {
    return [];
  }

  const courses = data as CourseRow[];
  const instructorIds = Array.from(
    new Set(courses.map((course) => course.instructor_id).filter((id): id is string => Boolean(id))),
  );
  const instructorMap = await getInstructorMap(instructorIds);

  return courses.map((course) => buildCourseListItem(course, instructorMap));
};

export const getAvailableCourseTags = async (): Promise<string[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('courses')
    .select('tags')
    .eq('is_published', true);

  if (error || !data) {
    return [];
  }

  const tags = new Set<string>();

  for (const row of data as { tags: string[] | null }[]) {
    if (!row.tags) {
      continue;
    }

    for (const tag of row.tags) {
      const normalizedTag = tag.trim();
      if (normalizedTag.length > 0) {
        tags.add(normalizedTag);
      }
    }
  }

  return Array.from(tags).sort((left, right) => left.localeCompare(right));
};

const buildCourseDetail = (
  course: CourseRow,
  instructor: UserRow | null,
): CourseDetail => {
  const listItem: CourseListItem = {
    id: course.id,
    slug: course.slug,
    title: course.title,
    description: course.description,
    thumbnail_url: course.thumbnail_url,
    difficulty: course.difficulty,
    price: course.price,
    tags: course.tags ?? [],
    instructor_id: course.instructor_id,
    instructor_name: instructor?.full_name ?? null,
  };

  return {
    ...listItem,
    duration_hours: course.duration_hours ?? null,
    prerequisites: course.prerequisites ?? [],
    instructor_email: instructor?.email ?? null,
    instructor_bio: null,
  };
};

const fetchPublishedLessons = async (courseId: string): Promise<LessonPreview[]> => {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('lessons')
    .select('id,title,description,order_index,duration_seconds')
    .eq('course_id', courseId)
    .eq('is_published', true)
    .order('order_index', { ascending: true });

  if (error || !data) {
    return [];
  }

  return (data as LessonRow[]).map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    order_index: lesson.order_index,
    duration_seconds: lesson.duration_seconds,
  }));
};

export const getPublishedCourseBySlug = async (
  slug: string,
): Promise<CourseDetailResult | null> => {
  const supabase = createClient();
  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select(COURSE_DETAIL_COLUMNS)
    .eq('is_published', true)
    .eq('slug', slug)
    .maybeSingle();

  if (courseError || !courseData) {
    return null;
  }

  const course = courseData as CourseRow;

  let instructor: UserRow | null = null;

  if (course.instructor_id) {
    const { data: instructorData } = await supabase
      .from('users')
      .select('id,full_name,email')
      .eq('id', course.instructor_id)
      .maybeSingle();

    instructor = (instructorData as UserRow | null) ?? null;
  }

  const lessons = await fetchPublishedLessons(course.id);

  return {
    course: buildCourseDetail(course, instructor),
    lessons,
  };
};

export const getLessonLearningData = async (
  studentId: string,
  slug: string,
  lessonId: string,
): Promise<{
  course: LessonCourseMeta;
  lessons: LessonLearningItem[];
  activeLessonId: string;
} | null> => {
  const supabase = createClient();

  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('id,slug,title')
    .eq('is_published', true)
    .eq('slug', slug)
    .maybeSingle();

  if (courseError || !courseData) {
    return null;
  }

  const course = courseData as PublishedCourseMetaRow;

  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', studentId)
    .eq('course_id', course.id)
    .maybeSingle();

  if (enrollmentError || !enrollmentData) {
    return null;
  }

  const { data: lessonData, error: lessonError } = await supabase
    .from('lessons')
    .select('id,title,description,order_index,duration_seconds,video_url')
    .eq('course_id', course.id)
    .eq('is_published', true)
    .order('order_index', { ascending: true });

  if (lessonError || !lessonData) {
    return null;
  }

  const lessons = lessonData as LessonWithVideoRow[];

  if (lessons.length === 0) {
    return null;
  }

  const activeLessonExists = lessons.some((lesson) => lesson.id === lessonId);

  if (!activeLessonExists) {
    return null;
  }

  const lessonIds = lessons.map((lesson) => lesson.id);
  const { data: progressData } = await supabase
    .from('lesson_progress')
    .select('lesson_id,watched_seconds,completed')
    .eq('student_id', studentId)
    .in('lesson_id', lessonIds);

  const progressRows = (progressData ?? []) as LessonProgressRow[];
  const progressMap = new Map<string, LessonProgressRow>(
    progressRows.map((row) => [row.lesson_id, row]),
  );

  const lessonLearningItems: LessonLearningItem[] = lessons.map((lesson) => {
    const progress = progressMap.get(lesson.id);

    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      order_index: lesson.order_index,
      duration_seconds: lesson.duration_seconds,
      video_url: lesson.video_url,
      watched_seconds: Math.max(0, Math.floor(progress?.watched_seconds ?? 0)),
      completed: Boolean(progress?.completed),
    };
  });

  return {
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
    },
    lessons: lessonLearningItems,
    activeLessonId: lessonId,
  };
};
