import 'server-only';

import { createAdminClient } from '@/lib/supabase/admin';
import type {
  AdminReportsData,
  InstructorAnalyticsData,
  InstructorCoursePerformancePoint,
  InstructorLessonViewPoint,
  MonthlyRevenuePoint,
  TopCourseEnrollmentPoint,
  WeeklyEnrollmentPoint,
} from '@/types/analytics';

type CourseRow = {
  id: string;
  title: string;
};

type EnrollmentRow = {
  id: string;
  student_id: string;
  course_id: string;
  status: string;
  enrolled_at: string;
};

type LessonRow = {
  id: string;
  course_id: string;
  title: string;
};

type LessonProgressRow = {
  lesson_id: string;
  student_id: string;
  completed: boolean | null;
};

type QuizRow = {
  id: string;
  course_id: string;
};

type SubmissionRow = {
  quiz_id: string;
  student_id: string;
  score: number | null;
  submitted_at: string;
};

type AnalyticsEventRow = {
  event_type: string;
  course_id: string | null;
  lesson_id: string | null;
  created_at: string;
};

type PaymentRow = {
  amount: number | null;
  status: string;
  created_at: string;
};

const roundToTwo = (value: number): number => Math.round(value * 100) / 100;

const getWeekStartIsoDate = (value: string): string => {
  const date = new Date(value);
  const day = date.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
};

const getMonthLabel = (value: string): string => {
  const date = new Date(value);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });
};

const getMonthKey = (value: string): string => {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

const getLatestSubmissionScoreMap = (
  submissions: SubmissionRow[],
): Map<string, number | null> => {
  const latestMap = new Map<string, SubmissionRow>();

  for (const submission of submissions) {
    const key = `${submission.student_id}::${submission.quiz_id}`;
    const existing = latestMap.get(key);

    if (!existing) {
      latestMap.set(key, submission);
      continue;
    }

    if (new Date(submission.submitted_at).getTime() > new Date(existing.submitted_at).getTime()) {
      latestMap.set(key, submission);
    }
  }

  return new Map<string, number | null>(
    Array.from(latestMap.entries()).map(([key, submission]) => [key, submission.score]),
  );
};

export const getInstructorAnalyticsData = async (
  instructorId: string,
): Promise<InstructorAnalyticsData> => {
  const supabase = createAdminClient();

  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('id,title')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false });

  if (courseError || !courseData) {
    return {
      course_performance: [],
      lesson_views: [],
    };
  }

  const courses = courseData as CourseRow[];
  const courseIds = courses.map((course) => course.id);

  if (courseIds.length === 0) {
    return {
      course_performance: [],
      lesson_views: [],
    };
  }

  const [enrollmentResult, lessonResult, quizResult, eventResult] = await Promise.all([
    supabase
      .from('enrollments')
      .select('id,student_id,course_id,status,enrolled_at')
      .in('course_id', courseIds),
    supabase
      .from('lessons')
      .select('id,course_id,title')
      .in('course_id', courseIds)
      .eq('is_published', true),
    supabase
      .from('quizzes')
      .select('id,course_id')
      .in('course_id', courseIds),
    supabase
      .from('analytics_events')
      .select('event_type,course_id,lesson_id,created_at')
      .eq('event_type', 'lesson_view')
      .in('course_id', courseIds),
  ]);

  const enrollments = (enrollmentResult.data ?? []) as EnrollmentRow[];
  const lessons = (lessonResult.data ?? []) as LessonRow[];
  const quizzes = (quizResult.data ?? []) as QuizRow[];
  const lessonViewEvents = (eventResult.data ?? []) as AnalyticsEventRow[];

  const quizIds = quizzes.map((quiz) => quiz.id);
  const { data: submissionData } =
    quizIds.length > 0
      ? await supabase
          .from('submissions')
          .select('quiz_id,student_id,score,submitted_at')
          .in('quiz_id', quizIds)
      : { data: [] as SubmissionRow[] };

  const submissions = (submissionData ?? []) as SubmissionRow[];

  const lessonIds = lessons.map((lesson) => lesson.id);
  const enrollmentStudentIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.student_id)));

  const { data: lessonProgressData } =
    lessonIds.length > 0 && enrollmentStudentIds.length > 0
      ? await supabase
          .from('lesson_progress')
          .select('lesson_id,student_id,completed')
          .in('lesson_id', lessonIds)
          .in('student_id', enrollmentStudentIds)
          .eq('completed', true)
      : { data: [] as LessonProgressRow[] };

  const lessonProgressRows = (lessonProgressData ?? []) as LessonProgressRow[];

  const lessonsByCourse = new Map<string, LessonRow[]>();
  for (const lesson of lessons) {
    const courseLessons = lessonsByCourse.get(lesson.course_id) ?? [];
    courseLessons.push(lesson);
    lessonsByCourse.set(lesson.course_id, courseLessons);
  }

  const enrollmentsByCourse = new Map<string, EnrollmentRow[]>();
  for (const enrollment of enrollments) {
    const courseEnrollments = enrollmentsByCourse.get(enrollment.course_id) ?? [];
    courseEnrollments.push(enrollment);
    enrollmentsByCourse.set(enrollment.course_id, courseEnrollments);
  }

  const quizzesByCourse = new Map<string, QuizRow[]>();
  for (const quiz of quizzes) {
    const courseQuizzes = quizzesByCourse.get(quiz.course_id) ?? [];
    courseQuizzes.push(quiz);
    quizzesByCourse.set(quiz.course_id, courseQuizzes);
  }

  const latestScoreMap = getLatestSubmissionScoreMap(submissions);

  const completedLessonSet = new Set<string>();
  for (const progress of lessonProgressRows) {
    if (progress.completed) {
      completedLessonSet.add(`${progress.student_id}::${progress.lesson_id}`);
    }
  }

  const coursePerformance: InstructorCoursePerformancePoint[] = courses.map((course) => {
    const courseEnrollments = enrollmentsByCourse.get(course.id) ?? [];
    const courseLessons = lessonsByCourse.get(course.id) ?? [];
    const courseQuizzes = quizzesByCourse.get(course.id) ?? [];

    let completionRate = 0;

    if (courseEnrollments.length > 0 && courseLessons.length > 0) {
      const completedStudents = courseEnrollments.filter((enrollment) =>
        courseLessons.every((lesson) => completedLessonSet.has(`${enrollment.student_id}::${lesson.id}`)),
      ).length;

      completionRate = roundToTwo((completedStudents / courseEnrollments.length) * 100);
    }

    let averageQuizScore = 0;

    if (courseQuizzes.length > 0 && courseEnrollments.length > 0) {
      const scoreValues: number[] = [];

      for (const enrollment of courseEnrollments) {
        for (const quiz of courseQuizzes) {
          const key = `${enrollment.student_id}::${quiz.id}`;
          const score = latestScoreMap.get(key);

          if (typeof score === 'number' && Number.isFinite(score)) {
            scoreValues.push(score);
          }
        }
      }

      if (scoreValues.length > 0) {
        const total = scoreValues.reduce((sum, value) => sum + value, 0);
        averageQuizScore = roundToTwo(total / scoreValues.length);
      }
    }

    return {
      course_id: course.id,
      course_title: course.title,
      completion_rate: completionRate,
      average_quiz_score: averageQuizScore,
    };
  });

  const lessonMap = new Map<string, LessonRow>(lessons.map((lesson) => [lesson.id, lesson]));

  const lessonViewCountMap = new Map<string, number>();
  for (const event of lessonViewEvents) {
    if (!event.lesson_id) {
      continue;
    }

    lessonViewCountMap.set(event.lesson_id, (lessonViewCountMap.get(event.lesson_id) ?? 0) + 1);
  }

  const lessonViews: InstructorLessonViewPoint[] = Array.from(lessonViewCountMap.entries())
    .map(([lessonId, count]) => {
      const lesson = lessonMap.get(lessonId);

      if (!lesson) {
        return null;
      }

      const course = courses.find((row) => row.id === lesson.course_id);

      return {
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        course_title: course?.title ?? 'Course',
        lesson_view_count: count,
      };
    })
    .filter((item): item is InstructorLessonViewPoint => Boolean(item))
    .sort((left, right) => right.lesson_view_count - left.lesson_view_count)
    .slice(0, 20);

  return {
    course_performance: coursePerformance,
    lesson_views: lessonViews,
  };
};

export const getAdminReportsData = async (): Promise<AdminReportsData> => {
  const supabase = createAdminClient();

  const [enrollmentResult, paymentResult, courseResult] = await Promise.all([
    supabase.from('enrollments').select('id,student_id,course_id,status,enrolled_at'),
    supabase.from('payments').select('amount,status,created_at').eq('status', 'paid'),
    supabase.from('courses').select('id,title'),
  ]);

  const enrollments = (enrollmentResult.data ?? []) as EnrollmentRow[];
  const payments = (paymentResult.data ?? []) as PaymentRow[];
  const courses = (courseResult.data ?? []) as CourseRow[];

  const weeklyMap = new Map<string, number>();
  for (const enrollment of enrollments) {
    const weekStart = getWeekStartIsoDate(enrollment.enrolled_at);
    weeklyMap.set(weekStart, (weeklyMap.get(weekStart) ?? 0) + 1);
  }

  const weeklyEnrollments: WeeklyEnrollmentPoint[] = Array.from(weeklyMap.entries())
    .map(([week_start, count]) => ({
      week_start,
      enrollments: count,
    }))
    .sort((left, right) => left.week_start.localeCompare(right.week_start))
    .slice(-12);

  const monthlyRevenueMap = new Map<string, number>();
  for (const payment of payments) {
    const monthKey = getMonthKey(payment.created_at);
    const amount = Number(payment.amount ?? 0);

    if (!Number.isFinite(amount)) {
      continue;
    }

    monthlyRevenueMap.set(monthKey, (monthlyRevenueMap.get(monthKey) ?? 0) + amount);
  }

  const monthlyRevenue: MonthlyRevenuePoint[] = Array.from(monthlyRevenueMap.entries())
    .sort((left, right) => left[0].localeCompare(right[0]))
    .slice(-12)
    .map(([monthKey, amount]) => ({
      month: getMonthLabel(`${monthKey}-01T00:00:00.000Z`),
      revenue: roundToTwo(amount),
    }));

  const enrollmentCountByCourse = new Map<string, number>();
  for (const enrollment of enrollments) {
    enrollmentCountByCourse.set(
      enrollment.course_id,
      (enrollmentCountByCourse.get(enrollment.course_id) ?? 0) + 1,
    );
  }

  const courseMap = new Map<string, CourseRow>(courses.map((course) => [course.id, course]));

  const topCourses: TopCourseEnrollmentPoint[] = Array.from(enrollmentCountByCourse.entries())
    .map(([courseId, count]) => ({
      course_id: courseId,
      course_title: courseMap.get(courseId)?.title ?? 'Course',
      enrollments: count,
    }))
    .sort((left, right) => right.enrollments - left.enrollments)
    .slice(0, 5);

  return {
    weekly_enrollments: weeklyEnrollments,
    monthly_revenue: monthlyRevenue,
    top_courses: topCourses,
  };
};
