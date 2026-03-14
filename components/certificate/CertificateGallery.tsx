'use client';

import { useState } from 'react';
import { Download, Share2, X } from 'lucide-react';

type CertificateItem = {
  id: string;
  course_title: string;
  issued_at: string;
  certificate_url: string | null;
  verification_code: string;
};

type CertificateGalleryProps = {
  certificates: CertificateItem[];
};

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function CertificateGallery({ certificates }: CertificateGalleryProps) {
  const [selected, setSelected] = useState<CertificateItem | null>(null);
  const [copied, setCopied] = useState(false);

  const handleShare = async (certificate: CertificateItem) => {
    const verificationUrl = `${window.location.origin}/verify/${certificate.verification_code}`;

    try {
      await navigator.clipboard.writeText(verificationUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {certificates.map((certificate) => (
          <button
            key={certificate.id}
            type="button"
            onClick={() => setSelected(certificate)}
            className="rounded-xl border border-brand-border/70 bg-[#121a31]/80 p-5 text-left shadow-glass transition hover:-translate-y-1 hover:border-brand-accent/70"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="rounded-full bg-brand-accent/20 px-2.5 py-1 text-xs font-semibold text-amber-200">
                Gold Badge
              </span>
              <span className="text-xs text-brand-muted">{formatDate(certificate.issued_at)}</span>
            </div>
            <h3 className="mt-3 font-heading text-2xl text-white">{certificate.course_title}</h3>
            <p className="mt-2 text-xs text-brand-muted">Code: {certificate.verification_code}</p>
          </button>
        ))}
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-2xl rounded-3xl border border-brand-border bg-[#101935] p-6 shadow-layered">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-brand-accent">Certificate</p>
                <h3 className="mt-1 font-heading text-3xl text-white">{selected.course_title}</h3>
                <p className="mt-1 text-sm text-brand-muted">Issued on {formatDate(selected.issued_at)}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg border border-brand-border p-2 text-brand-muted transition hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="rounded-xl border border-brand-border bg-[#121a31] p-5">
              <p className="font-heading text-3xl text-white">Campus LMS</p>
              <p className="mt-2 text-sm text-brand-muted">Verification Code: {selected.verification_code}</p>
              <p className="mt-4 text-sm text-brand-text">
                This certifies successful completion of <strong>{selected.course_title}</strong>.
              </p>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <a
                href={selected.certificate_url ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
              <button
                type="button"
                onClick={() => void handleShare(selected)}
                className="inline-flex items-center gap-2 rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text transition hover:border-brand-accent/70"
              >
                <Share2 className="h-4 w-4" />
                {copied ? 'Copied!' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
