import { redirect } from 'next/navigation';
import { CertificateGallery } from '@/components/certificate/CertificateGallery';
import { EmptyState } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';

type CertificateRow = {
  id: string;
  course_id: string;
  issued_at: string;
  certificate_url: string | null;
  verification_code: string;
};

type CourseRow = {
  id: string;
  title: string;
};

export const dynamic = 'force-dynamic';

export default async function StudentCertificatesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: certificatesData } = await supabase
    .from('certificates')
    .select('id,course_id,issued_at,certificate_url,verification_code')
    .eq('student_id', user.id)
    .order('issued_at', { ascending: false });

  const certificates = (certificatesData ?? []) as CertificateRow[];
  const courseIds = certificates.map((item) => item.course_id);

  const { data: courseData } = courseIds.length
    ? await supabase.from('courses').select('id,title').in('id', courseIds)
    : { data: [] as CourseRow[] };

  const courseMap = new Map((courseData ?? []).map((course) => [course.id, course.title]));

  const items = certificates.map((certificate) => ({
    id: certificate.id,
    course_title: courseMap.get(certificate.course_id) ?? 'Course',
    issued_at: certificate.issued_at,
    certificate_url: certificate.certificate_url,
    verification_code: certificate.verification_code,
  }));

  return (
    <main className="space-y-6">
      <div>
        <h1 className="font-heading text-4xl text-white">My Certificates</h1>
        <p className="mt-2 text-sm text-brand-muted">
          Your earned credentials, ready to verify and share.
        </p>
      </div>

      {items.length > 0 ? (
        <CertificateGallery certificates={items} />
      ) : (
        <EmptyState
          title="No certificates yet"
          description="Complete lessons and pass quizzes to unlock your first certificate."
        />
      )}
    </main>
  );
}
