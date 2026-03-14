import type { CourseDifficulty } from '@/types/course';

export type StudentEnrollmentCard = {
  enrollment_id: string;
  course_id: string;
  course_slug: string;
  course_title: string;
  course_thumbnail_url: string | null;
  course_difficulty: CourseDifficulty | null;
  course_price: number | null;
  enrollment_status: string;
  completion_percentage: number;
  completed_lessons: number;
  total_lessons: number;
};
