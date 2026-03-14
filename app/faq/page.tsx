import faqItems from '@/data/faq.json';

type FaqItem = {
  id: string;
  question: string;
  answer: string;
};

export const metadata = {
  title: 'FAQ | Campus LMS',
};

export default function FaqPage() {
  const items = faqItems as FaqItem[];

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Frequently Asked Questions</h1>
        <p className="mt-2 text-sm text-gray-600">
          Common questions about enrollment, learning, grades, certificates, and support.
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item) => (
          <details key={item.id} className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <summary className="cursor-pointer list-none pr-8 text-base font-medium text-gray-900">
              {item.question}
              <span className="float-right text-gray-500 group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 text-sm leading-6 text-gray-700">{item.answer}</p>
          </details>
        ))}
      </div>
    </main>
  );
}
