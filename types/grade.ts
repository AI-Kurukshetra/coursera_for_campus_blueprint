export type LetterGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export type GradebookRow = {
  student_id: string;
  student_name: string;
  quiz_id: string;
  quiz_title: string;
  score: number | null;
  letter_grade: LetterGrade | null;
};

export type StudentFinalCourseGrade = {
  student_id: string;
  student_name: string;
  average_score: number | null;
  letter_grade: LetterGrade | null;
};

export type InstructorGradebookData = {
  course_id: string;
  course_title: string;
  rows: GradebookRow[];
  final_grades: StudentFinalCourseGrade[];
  quiz_count: number;
};

export type StudentCourseProgressGrade = {
  course_id: string;
  course_slug: string;
  course_title: string;
  enrollment_status: string;
  average_score: number | null;
  letter_grade: LetterGrade | null;
  quiz_count: number;
};

export type TranscriptCourseEntry = {
  course_title: string;
  average_score: number | null;
  letter_grade: LetterGrade | null;
};

export type StudentTranscriptData = {
  student_id: string;
  student_name: string;
  generated_at: string;
  courses: TranscriptCourseEntry[];
};
