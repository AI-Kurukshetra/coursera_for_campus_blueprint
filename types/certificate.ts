export type CertificateRecord = {
  id: string;
  student_id: string;
  course_id: string;
  issued_at: string;
  certificate_url: string | null;
  verification_code: string;
};

export type CertificateGenerationResult = {
  generated: boolean;
  already_exists: boolean;
  eligible: boolean;
  certificate: CertificateRecord | null;
  reason: string | null;
};

export type CertificateVerificationData = {
  verification_code: string;
  issued_at: string;
  certificate_url: string | null;
  student_name: string;
  course_title: string;
  instructor_name: string;
};
