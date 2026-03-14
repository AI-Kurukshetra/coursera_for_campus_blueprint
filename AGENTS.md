# AGENTS.md
# Codex CLI — System Instructions for Campus LMS

> This file is read automatically by Codex CLI before every run.
> Do not delete or rename this file.

---

## Project

**Name**: Campus Learning Management Platform (Coursera for Campus)
**Repo**: https://github.com/AI-Kurukshetra/coursera_for_campus_blueprint
**Stack**: Next.js 14 (App Router) · Supabase · Vercel · Stripe · Tailwind CSS · TypeScript

---

## Reference Files

Before writing any code, always read:

- `prd.md` — Full product requirements, schema, API specs, per-phase Codex prompts
- `structure.md` — Canonical folder and file structure
- `tasks.md` — Phase-by-phase task list
- `agents.md` — Agent responsibilities

---

## Rules

### General
- Always use **TypeScript** — no `.js` files in `/app`, `/components`, `/lib`, `/services`
- Always use **Tailwind CSS** for styling — no inline styles, no CSS modules
- Always use **App Router** patterns (not Pages Router)
- Never use `any` type — define proper types in `/types/`
- All server actions and API routes must validate input

### Supabase
- Use `/lib/supabase/server.ts` (SSR client) in Server Components and API routes
- Use `/lib/supabase/client.ts` (browser client) in Client Components only
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client
- Always apply RLS — never use service role key in client-side code
- Run migrations in `/database/migrations/` — never edit `schema.sql` directly

### Authentication
- Auth is handled via Supabase Auth (email + password)
- User role is stored in `public.users.role` — always check role from DB, not JWT claims
- Protect routes in `middleware.ts` using Supabase session
- Roles: `student` | `instructor` | `admin` | `university_manager`

### API Routes
- All API routes live in `/app/api/`
- Return consistent JSON: `{ data, error, status }`
- Always handle errors with try/catch and return appropriate HTTP status codes
- Authenticated routes must verify session at the top of the handler

### Components
- Shared UI components go in `/components/ui/`
- Feature components go in `/components/[feature]/` (e.g., `/components/course/CourseCard.tsx`)
- Always export as named exports from feature folders, default export from the component file

### File Uploads
- Videos → Supabase Storage bucket: `videos`
- Course materials → `course-materials`
- Certificates → `certificates`
- Avatars → `avatars`
- Assignments → `assignments`

### Payments
- Use Stripe for paid course enrollment
- Payment intent created at `/api/payments/create-intent`
- Enrollment confirmed only via Stripe webhook at `/api/payments/webhook`
- Never trust client-side payment confirmation

---

## Phase Execution Order

Run phases in this order for a clean build:

```
Phase 1  → Setup & Config
Phase 2  → Authentication
Phase 3  → Course Catalog
Phase 4  → Instructor CMS
Phase 5  → Enrollment System
Phase 6  → Video Learning
Phase 7  → Assessment System
Phase 8  → Gradebook
Phase 9  → Discussions
Phase 10 → Notifications
Phase 11 → Calendar
Phase 12 → Certificates
Phase 13 → Student Support
Phase 14 → Analytics
Phase 15 → Deployment & RLS
```

For **MVP/Hackathon** — run only: Phase 1, 2, 3, 4, 5, 6, 7, 12

---

## Codex Run Commands (Copy-Paste Ready)

```bash
# Phase 1 — Setup
codex "Initialize Next.js 14 TypeScript project with App Router, Tailwind CSS, ESLint. Install @supabase/supabase-js @supabase/ssr stripe resend @react-pdf/renderer. Create /lib/supabase/client.ts and /lib/supabase/server.ts. Create middleware.ts for Supabase session refresh. See prd.md Phase 1."

# Phase 2 — Authentication
codex "Implement authentication: signup, login, forgot-password pages at app/(auth). Supabase email+password auth. Store role in users table. Middleware protecting /(student), /(instructor), /(admin) by role. See prd.md Phase 2."

# Phase 3 — Course Catalog
codex "Build course catalog at app/(student)/courses with CourseCard, CourseFilters, CourseSearch components. Supabase query with ilike search, difficulty and tag filters. Course detail page at app/(student)/courses/[slug]. See prd.md Phase 3."

# Phase 4 — Instructor CMS
codex "Build instructor CMS at app/(instructor)/courses. Course create/edit form with thumbnail upload to Supabase Storage. Lesson manager with drag-and-drop reorder using @dnd-kit/core. Video upload to 'videos' bucket. Publish toggle. See prd.md Phase 4."

# Phase 5 — Enrollment System
codex "Build enrollment system. POST /api/enrollments for free courses. Stripe payment intent at /api/payments/create-intent. Webhook at /api/payments/webhook confirms paid enrollment. Student dashboard at app/(student)/dashboard shows enrolled courses with progress. See prd.md Phase 5."

# Phase 6 — Video Learning
codex "Build video lesson page at app/(student)/courses/[slug]/lessons/[lessonId]. HTML5 VideoPlayer component with play/pause, seek, speed selector (0.75x-2x). Track progress every 10s via PATCH /api/enrollments/progress. Mark complete at 90% watched. Lesson sidebar with completion icons. See prd.md Phase 6."

# Phase 7 — Assessment System
codex "Build quiz system. Instructor quiz builder at app/(instructor)/courses/[id]/quizzes with MCQ, true/false, short_answer, multi_select question types. Student quiz page at app/(student)/courses/[slug]/quizzes/[quizId]. Auto-grade MCQ/TF. Results page with score and feedback. See prd.md Phase 7."

# Phase 8 — Gradebook
codex "Build gradebook at app/(instructor)/courses/[id]/grades showing students x quiz scores table. Student progress page at app/(student)/progress. Final grade calculation as average. Transcript PDF generation using @react-pdf/renderer. See prd.md Phase 8."

# Phase 9 — Discussions
codex "Build discussion board at app/(student)/courses/[slug]/discuss. Threaded posts with 1-level replies. Upvote button. Instructor mark-as-answer. Delete own post. See prd.md Phase 9."

# Phase 10 — Notifications
codex "Build notification system. notifications table with RLS. NotificationBell with unread badge in nav. NotificationDrawer slide-in panel. Triggers: lesson published, quiz graded, certificate issued, discussion reply. Email via Resend for certificates and reminders. See prd.md Phase 10."

# Phase 11 — Calendar
codex "Build calendar at app/(student)/calendar using @fullcalendar/react. Fetch calendar_events from Supabase. Auto-populate quiz due dates. Add personal reminders via modal. Color code by event_type. See prd.md Phase 11."

# Phase 12 — Certificates
codex "Build certificate system. After lesson_progress update check if all lessons watched + all quizzes passed. If yes: generate certificate PDF using @react-pdf/renderer (A4 landscape, student name, course, date, QR code). Upload to 'certificates' bucket. Public verification page at app/verify/[code]. See prd.md Phase 12."

# Phase 13 — Support
codex "Build support system. Ticket form at app/(student)/support. Admin ticket dashboard at app/(admin)/support with status filter. PATCH /api/support/tickets/:id for status update. FAQ page with accordion at app/faq. See prd.md Phase 13."

# Phase 14 — Analytics
codex "Build analytics. trackEvent() client function posting to /api/analytics/event. Instructor analytics at app/(instructor)/analytics with recharts: completion rate, avg score, lesson views. Admin reports at app/(admin)/reports: weekly enrollments, monthly revenue, top courses. See prd.md Phase 14."

# Phase 15 — RLS + Deployment
codex "Write Supabase RLS policies for all tables: users, courses, enrollments, lessons, quizzes, submissions, grades, discussion_posts, notifications, support_tickets, certificates, payments, analytics_events, calendar_events. Write storage bucket policies. See prd.md Phase 15."
```

---

## Database Tables Reference

| Table | Key Columns |
|---|---|
| users | id, email, role, university_id |
| universities | id, name, slug |
| programs | id, university_id, title, degree_type |
| courses | id, instructor_id, slug, difficulty, price, is_published |
| lessons | id, course_id, video_url, order_index, duration_seconds |
| enrollments | id, student_id, course_id, status |
| lesson_progress | id, student_id, lesson_id, watched_seconds, completed |
| quizzes | id, course_id, lesson_id, passing_score |
| questions | id, quiz_id, type, options (jsonb) |
| submissions | id, quiz_id, student_id, answers (jsonb), score, passed |
| grades | id, student_id, course_id, score |
| certificates | id, student_id, course_id, verification_code |
| payments | id, student_id, course_id, stripe_payment_intent_id |
| discussion_posts | id, course_id, author_id, parent_id, upvotes |
| notifications | id, user_id, type, is_read |
| support_tickets | id, user_id, status, priority |
| analytics_events | id, user_id, event_type, course_id |
| calendar_events | id, user_id, event_type, due_at |

---

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```