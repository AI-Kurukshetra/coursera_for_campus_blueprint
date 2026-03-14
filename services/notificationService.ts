import 'server-only';

import { Resend } from 'resend';
import { createAdminClient } from '@/lib/supabase/admin';
import type { NotificationMetadata, NotificationType } from '@/types/notification';

type NewNotificationInput = {
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  metadata?: NotificationMetadata;
};

type LessonRow = {
  id: string;
  course_id: string;
  title: string;
  order_index: number | null;
};

type CourseRow = {
  id: string;
  title: string;
};

type EnrollmentRow = {
  student_id: string;
};

type SubmissionRow = {
  id: string;
  quiz_id: string;
  student_id: string;
  score: number | null;
  passed: boolean | null;
};

type QuizRow = {
  id: string;
  course_id: string;
  title: string;
};

type CertificateRow = {
  id: string;
  student_id: string;
  course_id: string;
  certificate_url: string | null;
  verification_code: string;
  issued_at: string;
};

type UserRow = {
  id: string;
  email: string | null;
  full_name: string | null;
};

type DiscussionPostRow = {
  id: string;
  course_id: string;
  author_id: string;
  parent_id: string | null;
};

const getNotificationBody = (score: number | null, passed: boolean | null): string => {
  const normalizedScore = score === null || !Number.isFinite(score) ? null : Number(score);

  if (normalizedScore === null) {
    return passed ? 'Your submission was graded and marked as passed.' : 'Your submission was graded.';
  }

  return passed
    ? `Your submission score is ${normalizedScore.toFixed(2)}%. You passed.`
    : `Your submission score is ${normalizedScore.toFixed(2)}%.`;
};

const insertNotifications = async (rows: NewNotificationInput[]): Promise<number> => {
  if (rows.length === 0) {
    return 0;
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from('notifications').insert(
    rows.map((row) => ({
      user_id: row.user_id,
      type: row.type,
      title: row.title,
      body: row.body,
      metadata: row.metadata ?? null,
      is_read: false,
    })),
  );

  if (error) {
    return 0;
  }

  return rows.length;
};

const sendCertificateIssuedEmail = async (
  recipientEmail: string,
  studentName: string,
  courseTitle: string,
  verificationCode: string,
  certificateUrl: string | null,
): Promise<boolean> => {
  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    return false;
  }

  const resend = new Resend(resendApiKey);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || 'http://localhost:3000';
  const verificationUrl = `${appUrl.replace(/\/$/, '')}/verify/${verificationCode}`;

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL?.trim() || 'Campus LMS <onboarding@resend.dev>',
      to: recipientEmail,
      subject: `Certificate Issued: ${courseTitle}`,
      html: `
        <p>Hello ${studentName},</p>
        <p>Your certificate for <strong>${courseTitle}</strong> has been issued.</p>
        <p><a href="${verificationUrl}">Verify your certificate</a></p>
        ${certificateUrl ? `<p><a href="${certificateUrl}">Download certificate PDF</a></p>` : ''}
      `,
    });

    return true;
  } catch {
    return false;
  }
};

export const notifyEnrolledStudents = async (lessonId: string): Promise<number> => {
  const supabase = createAdminClient();

  const { data: lessonData, error: lessonError } = await supabase
    .from('lessons')
    .select('id,course_id,title,order_index')
    .eq('id', lessonId)
    .maybeSingle();

  if (lessonError || !lessonData) {
    return 0;
  }

  const lesson = lessonData as LessonRow;

  const { data: courseData, error: courseError } = await supabase
    .from('courses')
    .select('id,title')
    .eq('id', lesson.course_id)
    .maybeSingle();

  if (courseError || !courseData) {
    return 0;
  }

  const course = courseData as CourseRow;

  const { data: enrollmentData, error: enrollmentError } = await supabase
    .from('enrollments')
    .select('student_id')
    .eq('course_id', lesson.course_id)
    .in('status', ['active', 'completed']);

  if (enrollmentError || !enrollmentData) {
    return 0;
  }

  const enrolledStudents = enrollmentData as EnrollmentRow[];
  const studentIds = Array.from(new Set(enrolledStudents.map((item) => item.student_id)));

  const lessonLabel = lesson.order_index ? `Lesson ${lesson.order_index}: ${lesson.title}` : lesson.title;

  return insertNotifications(
    studentIds.map((studentId) => ({
      user_id: studentId,
      type: 'new_lesson',
      title: `New lesson published in ${course.title}`,
      body: `${lessonLabel} is now available.`,
      metadata: {
        lesson_id: lesson.id,
        course_id: course.id,
      },
    })),
  );
};

export const notifyStudentGraded = async (submissionId: string): Promise<boolean> => {
  const supabase = createAdminClient();

  const { data: submissionData, error: submissionError } = await supabase
    .from('submissions')
    .select('id,quiz_id,student_id,score,passed')
    .eq('id', submissionId)
    .maybeSingle();

  if (submissionError || !submissionData) {
    return false;
  }

  const submission = submissionData as SubmissionRow;

  const { data: quizData, error: quizError } = await supabase
    .from('quizzes')
    .select('id,course_id,title')
    .eq('id', submission.quiz_id)
    .maybeSingle();

  if (quizError || !quizData) {
    return false;
  }

  const quiz = quizData as QuizRow;

  const inserted = await insertNotifications([
    {
      user_id: submission.student_id,
      type: 'quiz_graded',
      title: `Quiz graded: ${quiz.title}`,
      body: getNotificationBody(submission.score, submission.passed),
      metadata: {
        submission_id: submission.id,
        quiz_id: submission.quiz_id,
        course_id: quiz.course_id,
      },
    },
  ]);

  return inserted > 0;
};

export const notifyStudentCertificate = async (certificateId: string): Promise<{ notified: boolean; email_sent: boolean }> => {
  const supabase = createAdminClient();

  const { data: certificateData, error: certificateError } = await supabase
    .from('certificates')
    .select('id,student_id,course_id,certificate_url,verification_code,issued_at')
    .eq('id', certificateId)
    .maybeSingle();

  if (certificateError || !certificateData) {
    return { notified: false, email_sent: false };
  }

  const certificate = certificateData as CertificateRow;

  const { data: courseData } = await supabase
    .from('courses')
    .select('id,title')
    .eq('id', certificate.course_id)
    .maybeSingle();

  const { data: userData } = await supabase
    .from('users')
    .select('id,email,full_name')
    .eq('id', certificate.student_id)
    .maybeSingle();

  if (!courseData || !userData) {
    return { notified: false, email_sent: false };
  }

  const course = courseData as CourseRow;
  const student = userData as UserRow;

  const inserted = await insertNotifications([
    {
      user_id: certificate.student_id,
      type: 'certificate_issued',
      title: `Certificate issued: ${course.title}`,
      body: 'Your course completion certificate is now available.',
      metadata: {
        certificate_id: certificate.id,
        course_id: certificate.course_id,
        verification_code: certificate.verification_code,
      },
    },
  ]);

  const emailSent = student.email
    ? await sendCertificateIssuedEmail(
        student.email,
        student.full_name ?? student.email,
        course.title,
        certificate.verification_code,
        certificate.certificate_url,
      )
    : false;

  return {
    notified: inserted > 0,
    email_sent: emailSent,
  };
};

export const notifyPostAuthorReply = async (postId: string): Promise<boolean> => {
  const supabase = createAdminClient();

  const { data: replyData, error: replyError } = await supabase
    .from('discussion_posts')
    .select('id,course_id,author_id,parent_id')
    .eq('id', postId)
    .maybeSingle();

  if (replyError || !replyData) {
    return false;
  }

  const reply = replyData as DiscussionPostRow;

  if (!reply.parent_id) {
    return false;
  }

  const { data: parentData, error: parentError } = await supabase
    .from('discussion_posts')
    .select('id,author_id')
    .eq('id', reply.parent_id)
    .maybeSingle();

  if (parentError || !parentData) {
    return false;
  }

  const parentAuthorId = (parentData as { id: string; author_id: string }).author_id;

  if (parentAuthorId === reply.author_id) {
    return false;
  }

  const { data: replierData } = await supabase
    .from('users')
    .select('id,full_name,email')
    .eq('id', reply.author_id)
    .maybeSingle();

  const { data: courseData } = await supabase
    .from('courses')
    .select('id,title')
    .eq('id', reply.course_id)
    .maybeSingle();

  const replier = (replierData as UserRow | null) ?? null;
  const course = (courseData as CourseRow | null) ?? null;

  const replierName = replier?.full_name ?? replier?.email ?? 'A classmate';

  const inserted = await insertNotifications([
    {
      user_id: parentAuthorId,
      type: 'reply',
      title: 'New reply to your post',
      body: `${replierName} replied${course ? ` in ${course.title}` : ''}.`,
      metadata: {
        post_id: reply.parent_id,
        reply_id: reply.id,
        course_id: reply.course_id,
      },
    },
  ]);

  return inserted > 0;
};
