'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  Award,
  BarChart3,
  ChartColumnBig,
  Check,
  CirclePlay,
  GraduationCap,
  MessageSquare,
  Rocket,
  Star,
  TrendingUp,
  Twitter,
  Linkedin,
  Youtube,
} from 'lucide-react';

type FeatureItem = {
  title: string;
  description: string;
  icon: LucideIcon;
};

type CourseItem = {
  title: string;
  instructor: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  price: string;
  gradient: string;
};

type Testimonial = {
  name: string;
  university: string;
  quote: string;
};

const features: FeatureItem[] = [
  {
    title: 'Video Learning',
    description: 'Immersive lecture streaming with chaptered playback and adaptive quality.',
    icon: CirclePlay,
  },
  {
    title: 'Smart Assessments',
    description: 'Auto-graded quizzes, assignments, and detailed performance analytics.',
    icon: ChartColumnBig,
  },
  {
    title: 'Live Certificates',
    description: 'Verified digital certificates issued instantly on course completion.',
    icon: Award,
  },
  {
    title: 'Progress Tracking',
    description: 'Real-time completion monitoring across lessons, modules, and programs.',
    icon: TrendingUp,
  },
  {
    title: 'Discussion Forums',
    description: 'Collaborative discussions with instructor moderation and best-answer marking.',
    icon: MessageSquare,
  },
  {
    title: 'Analytics Dashboard',
    description: 'University-grade data views for engagement, outcomes, and revenue.',
    icon: BarChart3,
  },
];

const courses: CourseItem[] = [
  {
    title: 'Modern Web Development',
    instructor: 'Dr. A. Mehta',
    duration: '12 weeks',
    difficulty: 'Intermediate',
    price: '₹1,499',
    gradient: 'from-blue-500/80 via-indigo-500/70 to-cyan-400/80',
  },
  {
    title: 'Data Science Foundations',
    instructor: 'Prof. R. Sharma',
    duration: '10 weeks',
    difficulty: 'Beginner',
    price: '₹1,299',
    gradient: 'from-slate-700/85 via-blue-700/80 to-blue-400/80',
  },
  {
    title: 'UI/UX Design Studio',
    instructor: 'Ms. N. Kapoor',
    duration: '8 weeks',
    difficulty: 'Advanced',
    price: '₹1,799',
    gradient: 'from-amber-400/85 via-orange-400/80 to-yellow-300/80',
  },
];

const testimonials: Testimonial[] = [
  {
    name: 'Ishita Rao',
    university: 'Delhi University',
    quote:
      'Campus LMS helped me complete job-ready coursework with clear milestones and top-tier mentorship.',
  },
  {
    name: 'Arjun Verma',
    university: 'IIT Bombay',
    quote:
      'The learning flow is polished and focused. I moved from beginner to building real projects in one semester.',
  },
  {
    name: 'Sara Thomas',
    university: 'Christ University',
    quote:
      'The certificate verification and instructor feedback loop made my portfolio stand out in interviews.',
  },
];

const universityLogos = [
  'Aster University',
  'Northbridge Institute',
  'Global Tech University',
  'Summit College',
  'Pioneer University',
  'Meridian School of Business',
];

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#courses', label: 'Courses' },
  { href: '#universities', label: 'Universities' },
  { href: '#pricing', label: 'Pricing' },
];

const stats = [
  { value: '50K+', label: 'Students' },
  { value: '200+', label: 'Courses' },
  { value: '30+', label: 'Universities' },
  { value: '95%', label: 'Completion Rate' },
];

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <main className="scroll-smooth bg-slate-50 text-slate-900">
      <nav
        className={`sticky top-0 z-50 border-b transition-all duration-200 ${
          scrolled
            ? 'border-slate-200/80 bg-white/85 shadow-layered backdrop-blur-xl'
            : 'border-transparent bg-white/60 backdrop-blur-md'
        }`}
      >
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-layered">
              <GraduationCap className="h-5 w-5" />
            </span>
            <div>
              <p className="font-heading text-xl text-slate-900">Campus LMS</p>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Coursera for Campus</p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-700 transition hover:text-blue-600"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/login"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Get Started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative isolate overflow-hidden bg-[#0A0F1E] text-slate-100">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.12)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />
        <div className="pointer-events-none absolute -left-10 top-14 h-72 w-72 rounded-full bg-blue-500/35 blur-3xl animate-mesh" />
        <div className="pointer-events-none absolute right-0 top-0 h-80 w-80 rounded-full bg-amber-400/25 blur-3xl animate-mesh" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/30 blur-3xl animate-mesh" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8 lg:py-24">
          <Reveal>
            <p className="mb-5 inline-flex rounded-full border border-blue-300/25 bg-blue-500/10 px-4 py-2 text-xs uppercase tracking-[0.25em] text-blue-200">
              Premium University Learning Platform
            </p>
            <h1 className="font-heading text-4xl leading-tight text-white sm:text-5xl lg:text-6xl">
              The Future of University Learning
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Build flexible online degrees, professional certificates, and industry-ready courses with a platform designed for
              modern campuses.
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/courses"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-amber-300"
              >
                Explore Courses
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/60 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-blue-300/60"
              >
                For Universities
              </Link>
            </div>
          </Reveal>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {stats.map((item, index) => (
              <Reveal
                key={item.label}
                className={`rounded-xl border border-white/20 bg-white/10 p-5 shadow-glass backdrop-blur-xl animate-float ${
                  index % 2 === 0 ? '[animation-delay:0ms]' : '[animation-delay:220ms]'
                }`}
              >
                <p className="font-heading text-4xl text-white">{item.value}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-300">{item.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Platform Features</p>
          <h2 className="mt-3 font-heading text-4xl text-slate-900">Everything You Need to Learn</h2>
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <Reveal key={feature.title} className={index % 2 === 0 ? 'delay-75' : 'delay-150'}>
                <article className="group h-full rounded-xl border border-slate-200/90 bg-white/70 p-6 shadow-layered backdrop-blur-md transition duration-200 hover:-translate-y-1.5 hover:border-blue-200 hover:shadow-glass">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-5 font-heading text-2xl text-slate-900">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{feature.description}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section className="bg-gradient-to-b from-slate-50 to-blue-50/70 py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-600">How It Works</p>
            <h2 className="mt-3 font-heading text-4xl text-slate-900">From Enrollment to Certification</h2>
          </Reveal>

          <div className="relative mt-14 grid gap-8 md:grid-cols-3">
            <div className="pointer-events-none absolute left-1/2 top-12 hidden h-0.5 w-[64%] -translate-x-1/2 bg-gradient-to-r from-blue-300 via-amber-300 to-blue-300 md:block" />
            {[
              { num: '01', title: 'Sign Up & Choose Your Course', text: 'Create your account, explore programs, and start your first learning path.' },
              { num: '02', title: 'Learn at Your Own Pace', text: 'Watch lessons, complete assignments, and stay on track with clear milestones.' },
              { num: '03', title: 'Earn Your Certificate', text: 'Pass assessments, complete course requirements, and receive verifiable credentials.' },
            ].map((step) => (
              <Reveal key={step.num}>
                <article className="relative rounded-xl border border-slate-200 bg-white p-6 shadow-layered">
                  <p className="font-heading text-5xl text-blue-600/25">{step.num}</p>
                  <h3 className="mt-3 font-heading text-2xl text-slate-900">{step.title}</h3>
                  <p className="mt-3 text-sm text-slate-600">{step.text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="courses" className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Course Catalog</p>
            <h2 className="mt-3 font-heading text-4xl text-slate-900">Popular Courses</h2>
          </div>
          <Link
            href="/courses"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
          >
            View All Courses
          </Link>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Reveal key={course.title}>
              <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-layered">
                <div className={`h-44 bg-gradient-to-br ${course.gradient}`} />
                <div className="space-y-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-heading text-2xl text-slate-900">{course.title}</h3>
                    <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">{course.price}</span>
                  </div>
                  <p className="text-sm text-slate-600">Instructor: {course.instructor}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{course.duration}</span>
                    <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">{course.difficulty}</span>
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="universities" className="bg-[#0A0F1E] py-20 text-white">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-300">University Network</p>
            <h2 className="mt-3 font-heading text-4xl">Trusted by Leading Universities</h2>
          </Reveal>

          <div className="mt-12 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/50 p-4">
            <div className="flex w-max items-center gap-4 animate-marquee">
              {[...universityLogos, ...universityLogos].map((name, index) => (
                <div
                  key={`${name}-${index}`}
                  className="min-w-[220px] rounded-xl border border-slate-700 bg-slate-800/65 px-5 py-5 text-center text-sm font-medium tracking-wide text-slate-400 grayscale transition duration-200 hover:border-blue-400/60 hover:text-blue-200 hover:grayscale-0"
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Student Stories</p>
          <h2 className="mt-3 font-heading text-4xl text-slate-900">What Learners Say</h2>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((item, index) => (
            <Reveal key={item.name}>
              <article
                className={`rounded-xl border border-slate-200 bg-white p-6 shadow-layered ${
                  index === 1 ? 'md:-translate-y-5' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 font-semibold text-white">
                    {item.name
                      .split(' ')
                      .map((part) => part[0])
                      .join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.university}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-amber-500">
                  {Array.from({ length: 5 }).map((_, starIndex) => (
                    <Star key={`${item.name}-${starIndex}`} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-600">“{item.quote}”</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="pricing" className="bg-gradient-to-b from-white to-blue-50/60 py-20">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-600">Pricing</p>
            <h2 className="mt-3 font-heading text-4xl text-slate-900">Plans for Every Learner</h2>
          </Reveal>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                name: 'Student',
                price: 'Free',
                highlight: false,
                points: ['Access free courses', 'Community forums', 'Basic progress tracking'],
              },
              {
                name: 'Pro',
                price: '₹999/mo',
                highlight: true,
                points: ['Premium catalog access', 'Certificates', 'Advanced assessments'],
              },
              {
                name: 'Institution',
                price: 'Custom',
                highlight: false,
                points: ['Campus-wide onboarding', 'Analytics suite', 'Dedicated support'],
              },
            ].map((plan) => (
              <Reveal key={plan.name}>
                <article
                  className={`h-full rounded-xl border bg-white p-6 shadow-layered ${
                    plan.highlight ? 'border-amber-400 ring-2 ring-amber-300/50' : 'border-slate-200'
                  }`}
                >
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">{plan.name}</p>
                  <p className="mt-3 font-heading text-4xl text-slate-900">{plan.price}</p>
                  <ul className="mt-6 space-y-3">
                    {plan.points.map((point) => (
                      <li key={point} className="flex items-center gap-2 text-sm text-slate-600">
                        <Check className="h-4 w-4 text-blue-600" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className={`mt-8 w-full rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      plan.highlight
                        ? 'bg-amber-400 text-slate-900 hover:bg-amber-300'
                        : 'border border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700'
                    }`}
                  >
                    Choose Plan
                  </button>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#0A0F1E] py-20">
        <div className="pointer-events-none absolute left-0 top-0 h-48 w-48 rounded-full bg-blue-500/30 blur-3xl animate-mesh" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-52 w-52 rounded-full bg-amber-400/25 blur-3xl animate-mesh" />
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-5 px-4 text-center sm:px-6">
          <Reveal className="w-full">
            <h2 className="font-heading text-4xl text-white sm:text-5xl">Ready to Transform Your Learning?</h2>
            <p className="mt-4 text-slate-300">Join thousands of students and universities building the next generation of education.</p>
          </Reveal>
          <Reveal className="w-full max-w-xl">
            <form className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                placeholder="Enter your email"
                className="h-12 flex-1 rounded-lg border border-slate-700 bg-slate-900/80 px-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-blue-400"
              />
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Get Started
                <Rocket className="h-4 w-4" />
              </button>
            </form>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-16">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.25fr_1fr_1fr_1fr_1fr] lg:px-8">
          <div>
            <p className="font-heading text-2xl text-slate-900">Campus LMS</p>
            <p className="mt-3 text-sm text-slate-600">Empowering universities to deliver world-class digital learning experiences.</p>
            <div className="mt-5 flex items-center gap-2 text-slate-500">
              <a href="#" className="rounded-lg border border-slate-200 p-2 transition hover:text-blue-600" aria-label="Twitter">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="rounded-lg border border-slate-200 p-2 transition hover:text-blue-600" aria-label="LinkedIn">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="rounded-lg border border-slate-200 p-2 transition hover:text-blue-600" aria-label="YouTube">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Platform</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li><a href="#features" className="hover:text-blue-600">Features</a></li>
              <li><a href="#courses" className="hover:text-blue-600">Courses</a></li>
              <li><a href="#pricing" className="hover:text-blue-600">Pricing</a></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">For Students</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li><a href="#" className="hover:text-blue-600">Learning Paths</a></li>
              <li><a href="#" className="hover:text-blue-600">Certificates</a></li>
              <li><a href="#" className="hover:text-blue-600">Career Support</a></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">For Universities</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li><a href="#" className="hover:text-blue-600">Institution Suite</a></li>
              <li><a href="#" className="hover:text-blue-600">Analytics</a></li>
              <li><a href="#" className="hover:text-blue-600">Integrations</a></li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Company</p>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li><a href="#" className="hover:text-blue-600">About</a></li>
              <li><a href="#" className="hover:text-blue-600">Blog</a></li>
              <li><a href="#" className="hover:text-blue-600">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="mx-auto mt-10 w-full max-w-7xl border-t border-slate-200 px-4 pt-6 text-xs text-slate-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Campus LMS. All rights reserved.
        </div>
      </footer>

    </main>
  );
}
