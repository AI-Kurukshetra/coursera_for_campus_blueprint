import Link from 'next/link';
import { getCertificateVerificationDataByCode } from '@/services/certificateService';

export const dynamic = 'force-dynamic';

type VerifyCertificatePageProps = {
  params: {
    code: string;
  };
};

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

export default async function VerifyCertificatePage({ params }: VerifyCertificatePageProps) {
  const certificate = await getCertificateVerificationDataByCode(params.code);

  if (!certificate) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6">
          <h1 className="text-2xl font-semibold text-rose-700">Certificate Not Found</h1>
          <p className="mt-2 text-rose-700">
            No certificate exists for verification code: {params.code}
          </p>
          <Link href="/" className="mt-4 inline-block text-sm font-medium text-rose-700 underline">
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-3xl px-6 py-12">
      <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Verified Certificate</p>
        <h1 className="mt-2 text-3xl font-semibold text-emerald-800">Certificate is valid</h1>
        <p className="mt-2 text-emerald-700">Verification code: {certificate.verification_code}</p>
      </section>

      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900">Certificate Details</h2>

        <dl className="mt-4 space-y-3 text-sm text-gray-700">
          <div>
            <dt className="font-medium text-gray-900">Student</dt>
            <dd>{certificate.student_name}</dd>
          </div>

          <div>
            <dt className="font-medium text-gray-900">Course</dt>
            <dd>{certificate.course_title}</dd>
          </div>

          <div>
            <dt className="font-medium text-gray-900">Instructor</dt>
            <dd>{certificate.instructor_name}</dd>
          </div>

          <div>
            <dt className="font-medium text-gray-900">Completion Date</dt>
            <dd>{formatDate(certificate.issued_at)}</dd>
          </div>
        </dl>

        {certificate.certificate_url ? (
          <a
            href={certificate.certificate_url}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            View certificate PDF
          </a>
        ) : null}
      </section>
    </main>
  );
}
