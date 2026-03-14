# PRD — Campus Learning Management Platform
# Coursera for Campus Clone

> **Target**: Codex CLI Automation
> **Stack**: Next.js · Supabase · Vercel
> **Generated**: March 2026
> **Scope**: Full Platform (MVP + Extended)

---

## 1. Project Overview

A full-featured Campus Learning Management & Degree Platform modeled after Coursera for Campus. Universities can onboard students, instructors, and admins, deliver video-based courses, run assessments, issue certificates, and track learning analytics — all within a white-label Next.js application backed by Supabase.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Backend | Supabase (Postgres + Auth + Storage + Realtime) |
| Deployment | Vercel |
| Automation | Codex CLI |
| Payments | Stripe |
| Email | Resend / Supabase Edge Functions |
| Video Storage | Supabase Storage (videos bucket) |
| File Storage | Supabase Storage (course-materials, certificates, avatars, assignments) |

---

## 3. Roles & Permissions

| Role | Description |
|---|---|
| `student` | Enroll, watch lessons, submit quizzes, earn certificates |
| `instructor` | Create courses, upload content, grade, manage discussions |
| `admin` | Manage university, programs, users, reports |
| `university_manager` | Configure institution settings, manage instructors |

---

## 4. Environment Variables

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

---

## 5. Project Structure

```
/app
  /api
    /auth
    /users
    /courses
    /programs
    /lessons
    /enrollments
    /assessments
    /grades
    /payments
    /discussions
    /analytics
    /notifications
    /certificates
    /support
    /calendar

  /(auth)
    /login
    /signup
    /forgot-password

  /(student)
    /dashboard
    /courses
    /progress
    /certificates
    /calendar

  /(instructor)
    /dashboard
    /courses
    /lessons
    /quizzes
    /analytics

  /(admin)
    /dashboard
    /universities
    /programs
    /reports

/components
  /course
  /lesson
  /video-player
  /quiz
  /discussion
  /certificate
  /analytics
  /calendar
  /support
  /ui

/lib
  /supabase
  /auth
  /middleware
  /analytics
  /utils

/services
  courseService.ts
  enrollmentService.ts
  quizService.ts
  paymentService.ts
  certificateService.ts
  analyticsService.ts
  notificationService.ts
  supportService.ts

/database
  schema.sql
  migrations/

/types
  user.ts
  university.ts
  program.ts
  course.ts
  lesson.ts
  quiz.ts
  grade.ts
  certificate.ts

/public
  /certificates
  /assets

/styles
```

---

## 6. Database Schema

### users
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
email text UNIQUE NOT NULL
full_name text
avatar_url text
role text CHECK (role IN ('student','instructor','admin','university_manager'))
university_id uuid REFERENCES universities(id)
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```

### universities
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
name text NOT NULL
slug text UNIQUE NOT NULL
logo_url text
website text
settings jsonb
created_at timestamptz DEFAULT now()
```

### programs
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
university_id uuid REFERENCES universities(id)
title text NOT NULL
description text
degree_type text  -- 'bachelor', 'master', 'certificate', 'diploma'
duration_months int
thumbnail_url text
is_published boolean DEFAULT false
created_at timestamptz DEFAULT now()
```

### courses
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
program_id uuid REFERENCES programs(id)
instructor_id uuid REFERENCES users(id)
title text NOT NULL
slug text UNIQUE NOT NULL
description text
thumbnail_url text
difficulty text CHECK (difficulty IN ('beginner','intermediate','advanced'))
duration_hours numeric
price numeric DEFAULT 0
is_published boolean DEFAULT false
prerequisites text[]
tags text[]
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```

### lessons
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
course_id uuid REFERENCES courses(id)
title text NOT NULL
description text
video_url text
materials_url text[]
order_index int NOT NULL
duration_seconds int
is_published boolean DEFAULT false
created_at timestamptz DEFAULT now()
```

### enrollments
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
student_id uuid REFERENCES users(id)
course_id uuid REFERENCES courses(id)
enrolled_at timestamptz DEFAULT now()
completed_at timestamptz
status text CHECK (status IN ('active','completed','dropped','paused'))
UNIQUE(student_id, course_id)
```

### lesson_progress
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
student_id uuid REFERENCES users(id)
lesson_id uuid REFERENCES lessons(id)
watched_seconds int DEFAULT 0
completed boolean DEFAULT false
last_watched_at timestamptz
UNIQUE(student_id, lesson_id)
```

### quizzes
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
lesson_id uuid REFERENCES lessons(id)
course_id uuid REFERENCES courses(id)
title text NOT NULL
description text
passing_score numeric DEFAULT 70
time_limit_minutes int
attempts_allowed int DEFAULT 3
created_at timestamptz DEFAULT now()
```

### questions
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
quiz_id uuid REFERENCES quizzes(id)
text text NOT NULL
type text CHECK (type IN ('mcq','true_false','short_answer','multi_select'))
options jsonb  -- array of {id, text, is_correct}
correct_answer text
points numeric DEFAULT 1
order_index int
```

### submissions
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
quiz_id uuid REFERENCES quizzes(id)
student_id uuid REFERENCES users(id)
answers jsonb NOT NULL
score numeric
passed boolean
attempt_number int DEFAULT 1
submitted_at timestamptz DEFAULT now()
graded_at timestamptz
```

### grades
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
student_id uuid REFERENCES users(id)
course_id uuid REFERENCES courses(id)
quiz_id uuid REFERENCES quizzes(id)
score numeric
letter_grade text
feedback text
graded_by uuid REFERENCES users(id)
created_at timestamptz DEFAULT now()
```

### transcripts
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
student_id uuid REFERENCES users(id)
university_id uuid REFERENCES universities(id)
generated_at timestamptz DEFAULT now()
data jsonb  -- snapshot of all grades/courses
file_url text
```

### certificates
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
student_id uuid REFERENCES users(id)
course_id uuid REFERENCES courses(id)
issued_at timestamptz DEFAULT now()
certificate_url text
verification_code text UNIQUE DEFAULT gen_random_uuid()::text
```

### payments
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
student_id uuid REFERENCES users(id)
course_id uuid REFERENCES courses(id)
amount numeric NOT NULL
currency text DEFAULT 'usd'
status text CHECK (status IN ('pending','paid','failed','refunded'))
stripe_payment_intent_id text
created_at timestamptz DEFAULT now()
```

### discussion_posts
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
course_id uuid REFERENCES courses(id)
lesson_id uuid REFERENCES lessons(id)
author_id uuid REFERENCES users(id)
parent_id uuid REFERENCES discussion_posts(id)
content text NOT NULL
upvotes int DEFAULT 0
is_instructor_answer boolean DEFAULT false
created_at timestamptz DEFAULT now()
updated_at timestamptz DEFAULT now()
```

### notifications
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id uuid REFERENCES users(id)
type text NOT NULL  -- 'new_lesson', 'assignment_due', 'certificate_issued', 'reply'
title text
body text
is_read boolean DEFAULT false
metadata jsonb
created_at timestamptz DEFAULT now()
```

### support_tickets
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id uuid REFERENCES users(id)
subject text NOT NULL
description text
status text CHECK (status IN ('open','in_progress','resolved','closed')) DEFAULT 'open'
priority text CHECK (priority IN ('low','medium','high')) DEFAULT 'medium'
created_at timestamptz DEFAULT now()
resolved_at timestamptz
```

### analytics_events
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id uuid REFERENCES users(id)
event_type text NOT NULL  -- 'lesson_view', 'quiz_attempt', 'course_enroll', 'video_play'
course_id uuid REFERENCES courses(id)
lesson_id uuid REFERENCES lessons(id)
metadata jsonb
created_at timestamptz DEFAULT now()
```

### calendar_events
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
user_id uuid REFERENCES users(id)
course_id uuid REFERENCES courses(id)
title text NOT NULL
description text
event_type text CHECK (event_type IN ('assignment','exam','lesson','reminder'))
due_at timestamptz
created_at timestamptz DEFAULT now()
```

### proctoring_sessions
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
student_id uuid REFERENCES users(id)
quiz_id uuid REFERENCES quizzes(id)
started_at timestamptz DEFAULT now()
ended_at timestamptz
flags jsonb  -- suspicious activity log
status text CHECK (status IN ('active','completed','flagged'))
```

---

## 7. Supabase Storage Buckets

| Bucket | Purpose |
|---|---|
| `videos` | Course lesson video files |
| `course-materials` | PDFs, slides, resources |
| `assignments` | Student assignment uploads |
| `certificates` | Generated certificate PDFs/images |
| `avatars` | User profile pictures |

---

## 8. API Endpoint Groups

### /api/auth
- `POST /api/auth/signup` — register with role
- `POST /api/auth/login` — email/password login
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `GET /api/auth/me` — current user profile

### /api/users
- `GET /api/users/:id`
- `PATCH /api/users/:id`
- `GET /api/users` (admin only)

### /api/courses
- `GET /api/courses` — catalog with filters (search, difficulty, program, tags)
- `POST /api/courses` (instructor/admin)
- `GET /api/courses/:slug`
- `PATCH /api/courses/:id`
- `DELETE /api/courses/:id`

### /api/programs
- `GET /api/programs`
- `POST /api/programs` (admin)
- `GET /api/programs/:id`
- `PATCH /api/programs/:id`

### /api/lessons
- `GET /api/lessons?course_id=`
- `POST /api/lessons` (instructor)
- `PATCH /api/lessons/:id`
- `DELETE /api/lessons/:id`
- `PATCH /api/lessons/reorder` — update order_index

### /api/enrollments
- `POST /api/enrollments` — enroll in course
- `GET /api/enrollments?student_id=` — student enrollments
- `PATCH /api/enrollments/:id` — update status
- `GET /api/enrollments/progress/:course_id` — lesson progress

### /api/assessments
- `GET /api/assessments?course_id=`
- `POST /api/assessments` — create quiz (instructor)
- `POST /api/assessments/:id/submit` — submit answers
- `GET /api/assessments/:id/results` — student results

### /api/grades
- `GET /api/grades?student_id=&course_id=`
- `POST /api/grades` — manual grade (instructor)
- `GET /api/grades/transcript/:student_id`

### /api/payments
- `POST /api/payments/create-intent` — Stripe payment intent
- `POST /api/payments/webhook` — Stripe webhook
- `GET /api/payments?student_id=`

### /api/discussions
- `GET /api/discussions?course_id=&lesson_id=`
- `POST /api/discussions` — create post/reply
- `PATCH /api/discussions/:id` — edit post
- `POST /api/discussions/:id/upvote`
- `PATCH /api/discussions/:id/mark-answer` (instructor)

### /api/analytics
- `POST /api/analytics/event` — track event
- `GET /api/analytics/course/:id` — course engagement stats
- `GET /api/analytics/admin` — platform-wide report

### /api/certificates
- `POST /api/certificates/generate` — trigger on course completion
- `GET /api/certificates/:verification_code` — public verification
- `GET /api/certificates?student_id=`

### /api/notifications
- `GET /api/notifications` — user notifications
- `PATCH /api/notifications/:id/read`
- `PATCH /api/notifications/read-all`

### /api/support
- `POST /api/support/tickets`
- `GET /api/support/tickets?user_id=`
- `PATCH /api/support/tickets/:id`

### /api/calendar
- `GET /api/calendar?user_id=`
- `POST /api/calendar`
- `DELETE /api/calendar/:id`

---

## 9. Feature Specifications

---

### Phase 1 — Setup

**Tasks:**
1. Initialize Next.js 14 project with App Router and TypeScript
2. Setup Supabase project (cloud)
3. Configure Supabase Auth (email/password + magic link)
4. Setup `.env.local` with all required environment variables
5. Initialize Supabase client in `/lib/supabase/`
6. Configure Vercel project and link repo
7. Setup ESLint, Prettier, Tailwind CSS

**Codex Prompt:**
```
Initialize a Next.js 14 TypeScript project with App Router, Tailwind CSS, and ESLint.
Install: @supabase/supabase-js @supabase/ssr stripe resend
Create /lib/supabase/client.ts and /lib/supabase/server.ts
Create /lib/middleware.ts for Supabase session refresh
Add all env variables to .env.local.example
```

---

### Phase 2 — Authentication

**Tasks:**
- User signup with role selection (student/instructor)
- User login (email + password)
- Role-based middleware protection
- Session management via Supabase SSR

**Pages:**
- `/(auth)/login` — Login form
- `/(auth)/signup` — Signup form with role picker
- `/(auth)/forgot-password` — Password reset

**Middleware:**
- Protect `/(student)`, `/(instructor)`, `/(admin)` routes
- Redirect unauthenticated users to `/login`
- Role-check: redirect wrong role to correct dashboard

**Codex Prompt:**
```
Create authentication pages at app/(auth)/login, signup, forgot-password.
Implement Supabase email/password auth with role stored in users table.
Create middleware.ts that protects routes by role.
Roles: student, instructor, admin, university_manager.
On signup: insert row into users table with role and email.
```

---

### Phase 3 — Course Catalog

**Tasks:**
- Course listing page with card grid
- Filter by: difficulty, program, tags, duration
- Full-text search (Supabase `ilike` or `pg_search`)
- Program grouping / browse by program
- Individual course detail page

**Pages:**
- `/(student)/courses` — catalog with filters
- `/(student)/courses/[slug]` — course detail + enroll CTA

**Components:**
- `CourseCard` — thumbnail, title, instructor, rating, price
- `CourseFilters` — sidebar with difficulty/tag/duration filters
- `CourseSearch` — debounced search input

**Codex Prompt:**
```
Create course catalog at app/(student)/courses/page.tsx.
Fetch courses from Supabase with filters: search (ilike title/description), difficulty, tags.
Create CourseCard component with thumbnail, title, instructor name, price, difficulty badge.
Create course detail page at app/(student)/courses/[slug]/page.tsx.
Show course info, lesson list, instructor bio, and Enroll button.
```

---

### Phase 4 — Instructor CMS

**Tasks:**
- Instructor dashboard: list of their courses
- Create/edit course form (title, description, difficulty, thumbnail upload)
- Lesson management: create, edit, reorder lessons
- Video upload to Supabase Storage `videos` bucket
- Materials upload to `course-materials` bucket
- Publish/unpublish course toggle

**Pages:**
- `/(instructor)/dashboard`
- `/(instructor)/courses` — list
- `/(instructor)/courses/new` — create course
- `/(instructor)/courses/[id]/edit` — edit course
- `/(instructor)/courses/[id]/lessons` — manage lessons

**Codex Prompt:**
```
Create instructor CMS at app/(instructor).
Course form with: title, description, difficulty select, thumbnail upload to Supabase Storage.
Lesson list with drag-and-drop reorder (use @dnd-kit/core).
Video upload component: upload to 'videos' bucket, store url in lessons.video_url.
Publish toggle that sets courses.is_published = true/false.
```

---

### Phase 5 — Enrollment System

**Tasks:**
- Enroll in free course (direct)
- Enroll in paid course (via Stripe payment)
- Student dashboard showing enrolled courses + progress
- Enrollment status management

**Pages:**
- `/(student)/dashboard` — enrolled courses with progress bars

**Flow:**
1. Student clicks Enroll on course detail page
2. If `price = 0`: insert into `enrollments` directly
3. If `price > 0`: create Stripe payment intent → redirect to checkout → webhook confirms → insert into `enrollments`

**Codex Prompt:**
```
Create enrollment API at /api/enrollments.
POST creates enrollment record after checking payment status.
Create Stripe payment intent API at /api/payments/create-intent.
Create Stripe webhook handler at /api/payments/webhook that inserts enrollment on payment success.
Student dashboard at app/(student)/dashboard shows enrolled courses with completion percentage.
```

---

### Phase 6 — Video Learning

**Tasks:**
- Video player with custom controls (play/pause, seek, speed: 0.75x, 1x, 1.25x, 1.5x, 2x)
- Auto-track watch progress (update `lesson_progress.watched_seconds` every 10s)
- Mark lesson complete when 90% watched
- Lesson navigation sidebar (previous / next)
- Captions support (if .vtt file exists)

**Pages:**
- `/(student)/courses/[slug]/lessons/[lessonId]`

**Components:**
- `VideoPlayer` — wraps `<video>` with custom controls
- `LessonSidebar` — ordered lesson list with completion icons
- `ProgressBar` — shows watched percentage

**Codex Prompt:**
```
Create video lesson page at app/(student)/courses/[slug]/lessons/[lessonId]/page.tsx.
Build VideoPlayer component using HTML5 video element with: play/pause, seek bar, volume, playback speed selector.
Every 10 seconds, PATCH /api/enrollments/progress with watched_seconds.
Mark lesson complete when watched_seconds >= 0.9 * lesson.duration_seconds.
Show lesson sidebar with all lessons in course, completed ones marked with checkmark.
```

---

### Phase 7 — Assessment System

**Tasks:**
- Quiz creation (instructor): add questions of type MCQ, True/False, Short Answer, Multi-select
- Quiz attempt page (student): timed or untimed
- Auto-grading for MCQ/True-False
- Manual grading UI for short answer
- Show results with score, pass/fail, correct answers

**Pages:**
- `/(instructor)/courses/[id]/quizzes` — manage quizzes
- `/(student)/courses/[slug]/quizzes/[quizId]` — take quiz

**Codex Prompt:**
```
Create quiz builder at app/(instructor)/courses/[id]/quizzes.
Question types: mcq (single correct), true_false, short_answer, multi_select.
Store questions in questions table with options as jsonb array: [{id, text, is_correct}].
Quiz attempt page: render questions, collect answers, submit to /api/assessments/[id]/submit.
Auto-grade MCQ/TF immediately. Short answer saved as pending.
Show results page with score, pass/fail badge, per-question feedback.
```

---

### Phase 8 — Gradebook

**Tasks:**
- Instructor gradebook: table of students × quiz scores
- Student grade view: all course grades
- Calculate final course grade (average of all quiz scores)
- Transcript generation: PDF snapshot of all grades

**Pages:**
- `/(instructor)/courses/[id]/grades` — gradebook table
- `/(student)/progress` — my grades across all courses

**Codex Prompt:**
```
Create gradebook at app/(instructor)/courses/[id]/grades.
Fetch all enrollments + submissions for the course, render as table: student name | quiz | score | letter grade.
Calculate course final grade as average score across all quizzes.
Student progress page at app/(student)/progress shows all enrolled courses with grades.
Transcript generation: GET /api/grades/transcript/:student_id returns JSON, render as downloadable PDF using @react-pdf/renderer.
```

---

### Phase 9 — Discussions

**Tasks:**
- Threaded forum per course/lesson
- Reply to posts (nested comments, 1 level deep)
- Upvote posts
- Instructor can mark a reply as "Best Answer"
- Moderation: delete posts (instructor/admin)

**Pages:**
- `/(student)/courses/[slug]/discuss` — course discussion board

**Codex Prompt:**
```
Create discussion board at app/(student)/courses/[slug]/discuss.
Fetch posts where parent_id IS NULL for top-level posts. Fetch replies where parent_id = post.id.
Reply form opens inline below each post.
Upvote button: POST /api/discussions/:id/upvote increments upvotes.
Instructor sees "Mark as Answer" button; clicking sets is_instructor_answer = true and highlights the reply.
```

---

### Phase 10 — Notifications

**Tasks:**
- In-app notification bell with unread count
- Notification types: new lesson published, quiz due, certificate issued, discussion reply
- Mark as read / mark all as read
- Email notifications via Resend on key events

**Components:**
- `NotificationBell` — icon in nav, badge with unread count
- `NotificationDrawer` — slide-in panel with notification list

**Codex Prompt:**
```
Create notifications table in Supabase with RLS: users can only read their own notifications.
NotificationBell component in layout: fetch unread count, show badge.
NotificationDrawer: list of notifications, click marks as read.
Notification triggers (Supabase Edge Functions or API routes):
  - On lesson published: notify enrolled students
  - On quiz submission graded: notify student
  - On certificate issued: notify student
  - On discussion reply: notify post author
Email via Resend for certificate_issued and assignment_due.
```

---

### Phase 11 — Calendar

**Tasks:**
- Personal academic calendar per student
- Show assignment deadlines, exam dates, lesson release dates
- Add/remove personal reminders
- Monthly/weekly view

**Pages:**
- `/(student)/calendar`

**Codex Prompt:**
```
Create calendar page at app/(student)/calendar using react-big-calendar or @fullcalendar/react.
Fetch calendar_events for current user from Supabase.
Auto-populate events from: quiz due dates, enrollment deadlines.
Allow student to add personal reminders via a form modal.
Color code by event_type: assignment=red, exam=orange, lesson=blue, reminder=green.
```

---

### Phase 12 — Certificates

**Tasks:**
- Detect 100% course completion (all lessons watched + all quizzes passed)
- Auto-generate certificate with: student name, course title, instructor name, date, unique verification code
- Certificate rendered as PDF (A4 landscape)
- Public verification page: `/verify/[code]`

**Pages:**
- `/(student)/certificates` — my certificates
- `/verify/[code]` — public certificate verification

**Codex Prompt:**
```
After each lesson_progress update, check if student has completed all lessons AND passed all quizzes.
If yes: POST /api/certificates/generate — create certificate record, generate PDF using @react-pdf/renderer, upload to 'certificates' bucket.
Certificate PDF design: university logo, student full name, course title, completion date, QR code linking to /verify/[code].
Verification page at app/verify/[code]: fetch certificate by verification_code, show public details (name, course, date, valid badge).
```

---

### Phase 13 — Student Support

**Tasks:**
- Help desk: create support ticket
- Ticket list with status (open, in_progress, resolved)
- Admin support panel: view and update all tickets
- FAQ section (static MDX or CMS-backed)

**Pages:**
- `/(student)/support` — submit ticket + my tickets
- `/(admin)/support` — all tickets dashboard

**Codex Prompt:**
```
Create support ticket form at app/(student)/support.
POST /api/support/tickets creates ticket with subject, description, priority.
Admin panel at app/(admin)/support: table of all tickets filterable by status.
PATCH /api/support/tickets/:id allows admin to update status.
FAQ section: create /app/faq as static page with accordion using a JSON data file.
```

---

### Phase 14 — Analytics

**Tasks:**
- Track events: `lesson_view`, `video_play`, `quiz_attempt`, `course_enroll`, `certificate_issued`
- Instructor analytics: completion rate, avg score, top lessons, student engagement
- Admin analytics: platform-wide enrollment trends, revenue, active users

**Pages:**
- `/(instructor)/analytics`
- `/(admin)/reports`

**Codex Prompt:**
```
Create analytics event tracking: POST /api/analytics/event inserts into analytics_events.
Call trackEvent() from client on: lesson page load, video play, quiz submit, enroll.
Instructor analytics page: Supabase queries for course completion rate, avg quiz score, lesson view counts. Display with recharts BarChart/LineChart.
Admin reports page: total enrollments by week, revenue by month, top courses. Use recharts.
```

---

### Phase 15 — Deployment

**Tasks:**
- Deploy to Vercel (production)
- Setup production Supabase project
- Configure all storage bucket policies (public read for certificates, authenticated write for videos)
- Setup Supabase RLS policies on all tables
- Environment variable configuration in Vercel dashboard
- Performance testing (Lighthouse)

**Codex Prompt:**
```
Write Supabase RLS policies for all tables:
  - users: can read/update own row
  - courses: public read if is_published, instructor CRUD own courses
  - enrollments: student CRUD own, instructor read
  - discussions: authenticated read, insert; author delete own
  - notifications: user read/update own
  - support_tickets: user CRUD own, admin all
Write storage bucket policies:
  - videos: authenticated read, instructor write
  - certificates: public read, service_role write
  - avatars: public read, owner write
Create vercel.json with rewrite rules if needed.
```

---

## 10. MVP Scope (Hackathon)

Build only the following phases for MVP:

| Phase | Feature |
|---|---|
| Phase 2 | Auth (signup, login, roles) |
| Phase 3 | Course Catalog (listing + detail) |
| Phase 4 | Instructor CMS (create course + lessons) |
| Phase 5 | Enrollment (free courses only) |
| Phase 6 | Video Lessons (player + progress tracking) |
| Phase 7 | Quiz (MCQ only, auto-graded) |
| Phase 12 | Certificate (auto-generate on completion) |

---

## 11. Advanced / Differentiating Features (Post-MVP)

| Feature | Priority | Notes |
|---|---|---|
| AI Course Recommendations | High | Use Claude API to suggest next courses based on completed courses + scores |
| Adaptive Learning Engine | High | Adjust quiz difficulty based on past performance |
| Gamification (Badges, Streaks, Leaderboard) | Medium | badges table, streak tracking on login |
| Proctoring System | Medium | Webcam + tab-switch detection during quiz |
| Live Virtual Classroom | Medium | Integrate Daily.co or Whereby |
| Plagiarism Detection | Medium | Compare short_answer submissions |
| Multi-Language Support | Low | i18n with next-intl |
| Blockchain Credential Verification | Low | On-chain certificate hash via Polygon |
| Predictive Analytics (At-risk Detection) | High | Flag students with low engagement + scores |
| Mobile App | High | React Native with Expo |

---

## 12. Key Metrics to Track

- Course completion rate
- Student engagement time per session
- Assessment scores and pass rates
- Enrollment and dropout rates
- Certificate issuance count
- Platform uptime (target: 99.9%)
- Support ticket resolution time
- Revenue per course / per student
- NPS score
- Mobile vs desktop usage ratio

---

## 13. Codex Automation Instructions

### How to use this PRD with Codex CLI

```bash
# Run each phase prompt in sequence
codex "Phase 1: Initialize Next.js 14 project with Supabase, Tailwind, TypeScript. See prd.md Phase 1."
codex "Phase 2: Implement authentication. See prd.md Phase 2."
codex "Phase 3: Build course catalog. See prd.md Phase 3."
# ...continue per phase
```

### Tips for Codex
- Always pass the relevant schema section when creating API routes
- Reference component names defined in this PRD for consistency
- Use the environment variable names exactly as defined in Section 4
- RLS policies must be applied before going to production (Section 15)

---

## 14. Agent Responsibilities (Codex Multi-Agent Reference)

| Agent | Primary Files |
|---|---|
| Architecture Agent | `prd.md`, `structure.md` |
| Auth Agent | `/app/(auth)`, `/lib/auth`, `middleware.ts` |
| Database Agent | `/database/schema.sql`, `/database/migrations/` |
| Course Catalog Agent | `/app/(student)/courses`, `/services/courseService.ts` |
| Instructor CMS Agent | `/app/(instructor)/courses`, video upload |
| Video Learning Agent | `VideoPlayer` component, `/api/enrollments/progress` |
| Assessment Agent | `/app/../quizzes`, `/services/quizService.ts` |
| Gradebook Agent | `/services/gradeService.ts`, transcript PDF |
| Enrollment & Payment Agent | `/api/payments`, Stripe webhook |
| Discussion Agent | `/api/discussions`, `DiscussionBoard` component |
| Notification Agent | `/api/notifications`, Resend integration |
| Calendar Agent | `/app/(student)/calendar` |
| Certification Agent | `/api/certificates/generate`, PDF renderer |
| Support Agent | `/app/(student)/support`, `/app/(admin)/support` |
| Analytics Agent | `/api/analytics`, recharts dashboards |
| Deployment Agent | RLS policies, Vercel config, storage policies |

---

*This PRD is the single source of truth for Codex CLI automation. Each phase is self-contained and can be executed independently.*