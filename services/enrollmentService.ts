import { createClient } from '@/lib/supabase/server';
import type { CourseDifficulty } from '@/types/course';
import type { StudentEnrollmentCard } from '@/types/enrollment';

type EnrollmentRow = {
  id: string;
  course_id: string;
  status: string;
};

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  difficulty: CourseDifficulty | null;
  price: number | null;
};

type LessonRow = {
  id: string;
  course_id: string;
};

type LessonProgressRow = {
  lesson_id: string;
};

const clampPercentage = (value: number): number => {
  if (value < 0) {
    return 0;
  }

  if (value > 100) {
    return 100;
  }

  return value;
};

export const getStudentEnrollmentCards = async (
  studentId: string,
): Promise<StudentEnrollmentCard[]> => {
  const supabase = createClient();

  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id,course_id,status')
    .eq('student_id', studentId)
    .order('enrolled_at', { ascending: false });

  if (enrollmentError || !enrollmentData) {
    return [];
  }

  const enrollments = enrollmentData as EnrollmentRow[];

  if (enrollments.length === 0) {
    return [];
  }

  const courseIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.course_id)));

  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('id,slug,title,thumbnail_url,difficulty,price')
    .in('id', courseIds);

  if (courseError || !courseData) {
    return [];
  }

  const courses = courseData as CourseRow[];
  const courseMap = new Map<string, CourseRow>(courses.map((course) => [course.id, course]));

  const { data: lessonData } = await supabase
    .from('lessons')
    .select('id,course_id')
    .in('course_id', courseIds)
    .eq('is_published', true);

  const lessons = (lessonData ?? []) as LessonRow[];
  const courseLessonIdsMap = new Map<string, string[]>();

  for (const lesson of lessons) {
    const existingLessonIds = courseLessonIdsMap.get(lesson.course_id) ?? [];
    existingLessonIds.push(lesson.id);
    courseLessonIdsMap.set(lesson.course_id, existingLessonIds);
  }

  const lessonIds = lessons.map((lesson) => lesson.id);
  let completedLessonSet = new Set<string>();

  if (lessonIds.length > 0) {
    const { data: progressData } = await supabase
      .from('lesson_progress')
      .select('lesson_id')
      .eq('student_id', studentId)
      .eq('completed', true)
      .in('lesson_id', lessonIds);

    const completedProgressRows = (progressData ?? []) as LessonProgressRow[];
    completedLessonSet = new Set<string>(
      completedProgressRows.map((progress) => progress.lesson_id),
    );
  }

  return enrollments
    .map((enrollment) => {
      const course = courseMap.get(enrollment.course_id);

      if (!course) {
        return null;
      }

      const lessonIdsForCourse = courseLessonIdsMap.get(course.id) ?? [];
      const totalLessons = lessonIdsForCourse.length;
      const completedLessons = lessonIdsForCourse.filter((lessonId) =>
        completedLessonSet.has(lessonId),
      ).length;

      const completionPercentage =
        totalLessons > 0
          ? clampPercentage(Math.round((completedLessons / totalLessons) * 100))
          : 0;

      return {
        enrollment_id: enrollment.id,
        course_id: course.id,
        course_slug: course.slug,
        course_title: course.title,
        course_thumbnail_url: course.thumbnail_url,
        course_difficulty: course.difficulty,
        course_price: course.price,
        enrollment_status: enrollment.status,
        completion_percentage: completionPercentage,
        completed_lessons: completedLessons,
        total_lessons: totalLessons,
      } satisfies StudentEnrollmentCard;
    })
    .filter((value): value is StudentEnrollmentCard => Boolean(value));
};
