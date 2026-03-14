import { createClient } from '@/lib/supabase/server';
import type {
  GradebookRow,
  InstructorGradebookData,
  LetterGrade,
  StudentCourseProgressGrade,
  StudentFinalCourseGrade,
  StudentTranscriptData,
} from '@/types/grade';

type CourseRow = {
  id: string;
  slug: string;
  title: string;
  instructor_id: string | null;
};

type QuizRow = {
  id: string;
  course_id: string;
  title: string;
};

type EnrollmentRow = {
  id: string;
  student_id: string;
  course_id: string;
  status: string;
};

type StudentRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type SubmissionRow = {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number | null;
  submitted_at: string;
};

type UserRoleRow = {
  id: string;
  role: string;
};

const roundToTwo = (value: number): number => Math.round(value * 100) / 100;

export const toLetterGrade = (score: number | null): LetterGrade | null => {
  if (score === null || !Number.isFinite(score)) {
    return null;
  }

  if (score >= 90) {
    return 'A';
  }

  if (score >= 80) {
    return 'B';
  }

  if (score >= 70) {
    return 'C';
  }

  if (score >= 60) {
    return 'D';
  }

  return 'F';
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

const buildStudentNameMap = (students: StudentRow[]): Map<string, string> =>
  new Map(
    students.map((student) => [
      student.id,
      student.full_name ?? student.email ?? 'Student',
    ]),
  );

export const getInstructorGradebookData = async (
  instructorId: string,
  courseId: string,
): Promise<InstructorGradebookData | null> => {
  const supabase = createClient();

  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('id,slug,title,instructor_id')
    .eq('id', courseId)
    .eq('instructor_id', instructorId)
    .maybeSingle();

  if (courseError || !courseData) {
    return null;
  }

  const course = courseData as CourseRow;

  const { data: quizData, error: quizError } = await supabase
    .from('quizzes')
    .select('id,course_id,title')
    .eq('course_id', courseId)
    .order('created_at', { ascending: true });

  if (quizError) {
    return null;
  }

  const quizzes = (quizData ?? []) as QuizRow[];

  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id,student_id,course_id,status')
    .eq('course_id', courseId)
    .order('enrolled_at', { ascending: true });

  if (enrollmentError) {
    return null;
  }

  const enrollments = (enrollmentData ?? []) as EnrollmentRow[];
  const studentIds = Array.from(new Set(enrollments.map((item) => item.student_id)));

  const { data: studentData } = studentIds.length
    ? await supabase
        .from('users')
        .select('id,full_name,email')
        .in('id', studentIds)
    : { data: [] as StudentRow[] };

  const studentNameMap = buildStudentNameMap((studentData ?? []) as StudentRow[]);

  const quizIds = quizzes.map((quiz) => quiz.id);
  const { data: submissionData } =
    quizIds.length > 0 && studentIds.length > 0
      ? await supabase
          .from('submissions')
          .select('id,quiz_id,student_id,score,submitted_at')
          .in('quiz_id', quizIds)
          .in('student_id', studentIds)
      : { data: [] as SubmissionRow[] };

  const latestScoreMap = getLatestSubmissionScoreMap((submissionData ?? []) as SubmissionRow[]);

  const rows: GradebookRow[] = [];

  for (const enrollment of enrollments) {
    const studentName = studentNameMap.get(enrollment.student_id) ?? 'Student';

    for (const quiz of quizzes) {
      const key = `${enrollment.student_id}::${quiz.id}`;
      const rawScore = latestScoreMap.has(key) ? latestScoreMap.get(key) ?? null : null;
      const normalizedScore = rawScore === null ? null : roundToTwo(Number(rawScore));

      rows.push({
        student_id: enrollment.student_id,
        student_name: studentName,
        quiz_id: quiz.id,
        quiz_title: quiz.title,
        score: normalizedScore,
        letter_grade: toLetterGrade(normalizedScore),
      });
    }
  }

  const finalGrades: StudentFinalCourseGrade[] = enrollments.map((enrollment) => {
    const studentName = studentNameMap.get(enrollment.student_id) ?? 'Student';
    const studentRows = rows.filter((row) => row.student_id === enrollment.student_id);

    if (quizzes.length === 0) {
      return {
        student_id: enrollment.student_id,
        student_name: studentName,
        average_score: null,
        letter_grade: null,
      };
    }

    const totalScore = studentRows.reduce(
      (total, row) => total + (row.score === null ? 0 : row.score),
      0,
    );
    const averageScore = roundToTwo(totalScore / quizzes.length);

    return {
      student_id: enrollment.student_id,
      student_name: studentName,
      average_score: averageScore,
      letter_grade: toLetterGrade(averageScore),
    };
  });

  return {
    course_id: course.id,
    course_title: course.title,
    rows,
    final_grades: finalGrades,
    quiz_count: quizzes.length,
  };
};

export const getStudentProgressGrades = async (
  studentId: string,
): Promise<StudentCourseProgressGrade[]> => {
  const supabase = createClient();

  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id,student_id,course_id,status')
    .eq('student_id', studentId)
    .order('enrolled_at', { ascending: false });

  if (enrollmentError || !enrollmentData) {
    return [];
  }

  const enrollments = enrollmentData as EnrollmentRow[];

  if (enrollments.length === 0) {
    return [];
  }

  const courseIds = Array.from(new Set(enrollments.map((item) => item.course_id)));

  const { data: courseData } = await supabase
    .from('courses')
    .select('id,slug,title,instructor_id')
    .in('id', courseIds);

  const courses = (courseData ?? []) as CourseRow[];
  const courseMap = new Map<string, CourseRow>(courses.map((course) => [course.id, course]));

  const { data: quizData } = await supabase
    .from('quizzes')
    .select('id,course_id,title')
    .in('course_id', courseIds);

  const quizzes = (quizData ?? []) as QuizRow[];
  const quizzesByCourse = new Map<string, QuizRow[]>();

  for (const quiz of quizzes) {
    const existing = quizzesByCourse.get(quiz.course_id) ?? [];
    existing.push(quiz);
    quizzesByCourse.set(quiz.course_id, existing);
  }

  const quizIds = quizzes.map((quiz) => quiz.id);

  const { data: submissionData } =
    quizIds.length > 0
      ? await supabase
          .from('submissions')
          .select('id,quiz_id,student_id,score,submitted_at')
          .eq('student_id', studentId)
          .in('quiz_id', quizIds)
      : { data: [] as SubmissionRow[] };

  const latestScoreMap = getLatestSubmissionScoreMap((submissionData ?? []) as SubmissionRow[]);

  const progressRows: Array<StudentCourseProgressGrade | null> = enrollments.map((enrollment) => {
      const course = courseMap.get(enrollment.course_id);

      if (!course) {
        return null;
      }

      const courseQuizzes = quizzesByCourse.get(course.id) ?? [];

      if (courseQuizzes.length === 0) {
        return {
          course_id: course.id,
          course_slug: course.slug,
          course_title: course.title,
          enrollment_status: enrollment.status,
          average_score: null,
          letter_grade: null,
          quiz_count: 0,
        };
      }

      const totalScore = courseQuizzes.reduce((total, quiz) => {
        const key = `${studentId}::${quiz.id}`;
        const score = latestScoreMap.get(key);
        return total + (score === null || score === undefined ? 0 : Number(score));
      }, 0);

      const averageScore = roundToTwo(totalScore / courseQuizzes.length);

      return {
        course_id: course.id,
        course_slug: course.slug,
        course_title: course.title,
        enrollment_status: enrollment.status,
        average_score: averageScore,
        letter_grade: toLetterGrade(averageScore),
        quiz_count: courseQuizzes.length,
      };
    });

  return progressRows.filter(
    (item): item is StudentCourseProgressGrade => item !== null,
  );
};

export const getStudentTranscriptData = async (
  studentId: string,
): Promise<StudentTranscriptData | null> => {
  const supabase = createClient();

  const { data: studentData, error: studentError } = await supabase
    .from('users')
    .select('id,full_name,email')
    .eq('id', studentId)
    .maybeSingle();

  if (studentError || !studentData) {
    return null;
  }

  const student = studentData as StudentRow;
  const courseProgress = await getStudentProgressGrades(studentId);

  return {
    student_id: studentId,
    student_name: student.full_name ?? student.email ?? 'Student',
    generated_at: new Date().toISOString(),
    courses: courseProgress.map((course) => ({
      course_title: course.course_title,
      average_score: course.average_score,
      letter_grade: course.letter_grade,
    })),
  };
};

export const getRequesterRole = async (userId: string): Promise<string | null> => {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('users')
    .select('id,role')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return (data as UserRoleRow).role;
};
