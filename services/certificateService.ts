import { randomUUID } from 'crypto';
import { generateCertificatePdfBuffer } from '@/lib/certificates/CertificatePdf';
import { createAdminClient } from '@/lib/supabase/admin';
import type {
  CertificateGenerationResult,
  CertificateRecord,
  CertificateVerificationData,
} from '@/types/certificate';

type CourseRow = {
  id: string;
  title: string;
  instructor_id: string | null;
};

type UserRow = {
  id: string;
  full_name: string | null;
  email: string | null;
};

type LessonRow = {
  id: string;
};

type QuizRow = {
  id: string;
  passing_score: number | null;
};

type SubmissionRow = {
  quiz_id: string;
  score: number | null;
  passed: boolean | null;
};

type LessonProgressRow = {
  lesson_id: string;
  completed: boolean | null;
};

type CertificateRow = CertificateRecord;

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const getExistingCertificate = async (
  studentId: string,
  courseId: string,
): Promise<CertificateRecord | null> => {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('certificates')
    .select('id,student_id,course_id,issued_at,certificate_url,verification_code')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as CertificateRow;
};

const hasCompletedAllLessons = async (
  studentId: string,
  courseId: string,
): Promise<boolean> => {
  const supabase = createAdminClient();
  const { data: lessonData, error: lessonError } = await supabase
    .from('lessons')
    .select('id')
    .eq('course_id', courseId)
    .eq('is_published', true);

  if (lessonError) {
    return false;
  }

  const lessons = (lessonData ?? []) as LessonRow[];

  if (lessons.length === 0) {
    return true;
  }

  const lessonIds = lessons.map((lesson) => lesson.id);

  const { data: progressData, error: progressError } = await supabase
    .from('lesson_progress')
    .select('lesson_id,completed')
    .eq('student_id', studentId)
    .eq('completed', true)
    .in('lesson_id', lessonIds);

  if (progressError) {
    return false;
  }

  const completedRows = (progressData ?? []) as LessonProgressRow[];
  const completedIds = new Set(
    completedRows.filter((row) => Boolean(row.completed)).map((row) => row.lesson_id),
  );

  return lessonIds.every((lessonId) => completedIds.has(lessonId));
};

const hasPassedAllQuizzes = async (
  studentId: string,
  courseId: string,
): Promise<boolean> => {
  const supabase = createAdminClient();

  const { data: quizData, error: quizError } = await supabase
    .from('quizzes')
    .select('id,passing_score')
    .eq('course_id', courseId);

  if (quizError) {
    return false;
  }

  const quizzes = (quizData ?? []) as QuizRow[];

  if (quizzes.length === 0) {
    return true;
  }

  const quizIds = quizzes.map((quiz) => quiz.id);

  const { data: submissionData, error: submissionError } = await supabase
    .from('submissions')
    .select('quiz_id,score,passed')
    .eq('student_id', studentId)
    .in('quiz_id', quizIds);

  if (submissionError) {
    return false;
  }

  const submissions = (submissionData ?? []) as SubmissionRow[];

  return quizzes.every((quiz) => {
    const passingScore = Number(quiz.passing_score ?? 70);

    return submissions.some((submission) => {
      if (submission.quiz_id !== quiz.id) {
        return false;
      }

      if (submission.passed) {
        return true;
      }

      const score = Number(submission.score ?? 0);
      return Number.isFinite(score) && score >= passingScore;
    });
  });
};

const isStudentEligibleForCertificate = async (
  studentId: string,
  courseId: string,
): Promise<{ eligible: boolean; reason: string | null }> => {
  const supabase = createAdminClient();

  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (enrollmentError || !enrollmentData) {
    return { eligible: false, reason: 'Student is not enrolled in this course.' };
  }

  const completedAllLessons = await hasCompletedAllLessons(studentId, courseId);

  if (!completedAllLessons) {
    return { eligible: false, reason: 'Not all lessons are completed yet.' };
  }

  const passedAllQuizzes = await hasPassedAllQuizzes(studentId, courseId);

  if (!passedAllQuizzes) {
    return { eligible: false, reason: 'Not all quizzes are passed yet.' };
  }

  return { eligible: true, reason: null };
};

const getCertificateGenerationContext = async (
  studentId: string,
  courseId: string,
): Promise<{
  student: UserRow;
  course: CourseRow;
  instructor: UserRow | null;
} | null> => {
  const supabase = createAdminClient();

  const { data: studentData, error: studentError } = await supabase
    .from('users')
    .select('id,full_name,email')
    .eq('id', studentId)
    .maybeSingle();

  if (studentError || !studentData) {
    return null;
  }

  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('id,title,instructor_id')
    .eq('id', courseId)
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

  return {
    student: studentData as UserRow,
    course,
    instructor,
  };
};

export const generateCourseCertificate = async (
  studentId: string,
  courseId: string,
): Promise<CertificateGenerationResult> => {
  const existing = await getExistingCertificate(studentId, courseId);

  if (existing) {
    return {
      generated: false,
      already_exists: true,
      eligible: true,
      certificate: existing,
      reason: 'Certificate already exists.',
    };
  }

  const eligibility = await isStudentEligibleForCertificate(studentId, courseId);

  if (!eligibility.eligible) {
    return {
      generated: false,
      already_exists: false,
      eligible: false,
      certificate: null,
      reason: eligibility.reason,
    };
  }

  const context = await getCertificateGenerationContext(studentId, courseId);

  if (!context) {
    return {
      generated: false,
      already_exists: false,
      eligible: false,
      certificate: null,
      reason: 'Unable to gather certificate context.',
    };
  }

  const issuedAt = new Date().toISOString();
  const verificationCode = randomUUID();

  const studentName = context.student.full_name ?? context.student.email ?? 'Student';
  const instructorName =
    context.instructor?.full_name ?? context.instructor?.email ?? 'Instructor';

  const pdfBuffer = await generateCertificatePdfBuffer({
    studentName,
    courseTitle: context.course.title,
    instructorName,
    completionDate: formatDate(issuedAt),
    verificationCode,
  });

  const supabase = createAdminClient();
  const storagePath = `${studentId}/${courseId}/${verificationCode}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from('certificates')
    .upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (uploadError) {
    return {
      generated: false,
      already_exists: false,
      eligible: true,
      certificate: null,
      reason: uploadError.message,
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('certificates').getPublicUrl(storagePath);

  const { data: certificateData, error: certificateError } = await supabase
    .from('certificates')
    .insert({
      student_id: studentId,
      course_id: courseId,
      issued_at: issuedAt,
      certificate_url: publicUrl,
      verification_code: verificationCode,
    })
    .select('id,student_id,course_id,issued_at,certificate_url,verification_code')
    .single();

  if (certificateError || !certificateData) {
    return {
      generated: false,
      already_exists: false,
      eligible: true,
      certificate: null,
      reason: certificateError?.message ?? 'Unable to store certificate record.',
    };
  }

  return {
    generated: true,
    already_exists: false,
    eligible: true,
    certificate: certificateData as CertificateRow,
    reason: null,
  };
};

export const getCertificateVerificationDataByCode = async (
  verificationCode: string,
): Promise<CertificateVerificationData | null> => {
  const code = verificationCode.trim();

  if (!code) {
    return null;
  }

  const supabase = createAdminClient();
  const { data: certificateData, error: certificateError } = await supabase
    .from('certificates')
    .select('id,student_id,course_id,issued_at,certificate_url,verification_code')
    .eq('verification_code', code)
    .maybeSingle();

  if (certificateError || !certificateData) {
    return null;
  }

  const certificate = certificateData as CertificateRow;

  const { data: studentData } = await supabase
    .from('users')
    .select('id,full_name,email')
    .eq('id', certificate.student_id)
    .maybeSingle();

  const { data: courseData } = await supabase
    .from('courses')
    .select('id,title,instructor_id')
    .eq('id', certificate.course_id)
    .maybeSingle();

  if (!studentData || !courseData) {
    return null;
  }

  const course = courseData as CourseRow;

  let instructorName = 'Instructor';

  if (course.instructor_id) {
    const { data: instructorData } = await supabase
      .from('users')
      .select('id,full_name,email')
      .eq('id', course.instructor_id)
      .maybeSingle();

    if (instructorData) {
      const instructor = instructorData as UserRow;
      instructorName = instructor.full_name ?? instructor.email ?? instructorName;
    }
  }

  const student = studentData as UserRow;

  return {
    verification_code: certificate.verification_code,
    issued_at: certificate.issued_at,
    certificate_url: certificate.certificate_url,
    student_name: student.full_name ?? student.email ?? 'Student',
    course_title: course.title,
    instructor_name: instructorName,
  };
};
