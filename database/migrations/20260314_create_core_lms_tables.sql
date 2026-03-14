-- Core LMS schema for Campus Learning Management Platform

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists universities_set_updated_at on public.universities;
create trigger universities_set_updated_at
before update on public.universities
for each row execute function public.set_updated_at();

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  university_id uuid references public.universities(id) on delete cascade,
  title text not null,
  degree_type text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists programs_set_updated_at on public.programs;
create trigger programs_set_updated_at
before update on public.programs
for each row execute function public.set_updated_at();

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid references public.users(id) on delete set null,
  slug text not null unique,
  title text not null,
  description text,
  difficulty text check (difficulty in ('beginner', 'intermediate', 'advanced')),
  thumbnail_url text,
  price numeric(10,2) not null default 0 check (price >= 0),
  tags text[] not null default '{}',
  duration_hours numeric(6,2),
  prerequisites text[] not null default '{}',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists courses_instructor_id_idx on public.courses(instructor_id);
create index if not exists courses_is_published_idx on public.courses(is_published);

drop trigger if exists courses_set_updated_at on public.courses;
create trigger courses_set_updated_at
before update on public.courses
for each row execute function public.set_updated_at();

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null default 1,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  video_url text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lessons_course_order_idx on public.lessons(course_id, order_index);
create index if not exists lessons_course_published_idx on public.lessons(course_id, is_published);

drop trigger if exists lessons_set_updated_at on public.lessons;
create trigger lessons_set_updated_at
before update on public.lessons
for each row execute function public.set_updated_at();

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'completed', 'dropped', 'cancelled')),
  enrolled_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, course_id)
);

create index if not exists enrollments_student_idx on public.enrollments(student_id);
create index if not exists enrollments_course_idx on public.enrollments(course_id);

drop trigger if exists enrollments_set_updated_at on public.enrollments;
create trigger enrollments_set_updated_at
before update on public.enrollments
for each row execute function public.set_updated_at();

create table if not exists public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  watched_seconds integer not null default 0 check (watched_seconds >= 0),
  completed boolean not null default false,
  last_watched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, lesson_id)
);

create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  title text not null,
  description text,
  passing_score integer not null default 70 check (passing_score >= 0 and passing_score <= 100),
  attempts_allowed integer not null default 3 check (attempts_allowed > 0),
  time_limit_minutes integer check (time_limit_minutes is null or time_limit_minutes > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  text text not null,
  type text not null check (type in ('mcq', 'true_false', 'short_answer', 'multi_select')),
  options jsonb not null default '[]'::jsonb,
  correct_answer text,
  points integer not null default 1 check (points > 0),
  order_index integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  student_id uuid not null references public.users(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  score numeric(5,2) check (score is null or (score >= 0 and score <= 100)),
  passed boolean not null default false,
  attempt_number integer not null default 1 check (attempt_number > 0),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  quiz_id uuid references public.quizzes(id) on delete set null,
  score numeric(5,2) check (score is null or (score >= 0 and score <= 100)),
  feedback text,
  graded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.transcripts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  issued_at timestamptz not null default now(),
  certificate_url text,
  verification_code text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, course_id)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  stripe_payment_intent_id text unique,
  amount numeric(10,2) not null default 0,
  currency text not null default 'usd',
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded', 'canceled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discussion_posts (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete set null,
  author_id uuid not null references public.users(id) on delete cascade,
  parent_id uuid references public.discussion_posts(id) on delete cascade,
  content text not null,
  upvotes integer not null default 0,
  is_instructor_answer boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type text not null check (type in ('new_lesson', 'quiz_graded', 'certificate_issued', 'reply')),
  title text not null,
  body text,
  is_read boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  subject text not null,
  description text,
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'closed')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  event_type text not null check (event_type in ('lesson_view', 'video_play', 'quiz_attempt', 'course_enroll')),
  course_id uuid references public.courses(id) on delete set null,
  lesson_id uuid references public.lessons(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  event_type text not null default 'reminder',
  title text not null,
  description text,
  due_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_role text;
  normalized_full_name text;
begin
  normalized_role := coalesce(new.raw_user_meta_data ->> 'role', 'student');

  if normalized_role not in ('student', 'instructor', 'admin', 'university_manager') then
    normalized_role := 'student';
  end if;

  normalized_full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');

  insert into public.users (id, email, full_name, role)
  values (new.id, new.email, normalized_full_name, normalized_role)
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.users.full_name),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

alter table public.users enable row level security;

drop policy if exists users_select_authenticated on public.users;
create policy users_select_authenticated
on public.users
for select
to authenticated
using (true);

drop policy if exists users_insert_authenticated on public.users;
create policy users_insert_authenticated
on public.users
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists users_update_authenticated on public.users;
create policy users_update_authenticated
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);
