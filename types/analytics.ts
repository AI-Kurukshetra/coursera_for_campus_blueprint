export type AnalyticsEventType =
  | 'lesson_view'
  | 'video_play'
  | 'quiz_attempt'
  | 'course_enroll';

export type AnalyticsMetadataValue = string | number | boolean | null;

export type AnalyticsMetadata = Record<string, AnalyticsMetadataValue>;

export type InstructorCoursePerformancePoint = {
  course_id: string;
  course_title: string;
  completion_rate: number;
  average_quiz_score: number;
};

export type InstructorLessonViewPoint = {
  lesson_id: string;
  lesson_title: string;
  course_title: string;
  lesson_view_count: number;
};

export type InstructorAnalyticsData = {
  course_performance: InstructorCoursePerformancePoint[];
  lesson_views: InstructorLessonViewPoint[];
};

export type WeeklyEnrollmentPoint = {
  week_start: string;
  enrollments: number;
};

export type MonthlyRevenuePoint = {
  month: string;
  revenue: number;
};

export type TopCourseEnrollmentPoint = {
  course_id: string;
  course_title: string;
  enrollments: number;
};

export type AdminReportsData = {
  weekly_enrollments: WeeklyEnrollmentPoint[];
  monthly_revenue: MonthlyRevenuePoint[];
  top_courses: TopCourseEnrollmentPoint[];
};
