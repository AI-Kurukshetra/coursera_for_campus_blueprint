-- Enable RLS for all public tables and keep authenticated access open.

alter table public.users enable row level security;
alter table public.universities enable row level security;
alter table public.programs enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.enrollments enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.submissions enable row level security;
alter table public.grades enable row level security;
alter table public.transcripts enable row level security;
alter table public.certificates enable row level security;
alter table public.payments enable row level security;
alter table public.discussion_posts enable row level security;
alter table public.notifications enable row level security;
alter table public.support_tickets enable row level security;
alter table public.analytics_events enable row level security;
alter table public.calendar_events enable row level security;

drop policy if exists users_authenticated_all on public.users;
create policy users_authenticated_all on public.users for all to authenticated using (true) with check (true);

drop policy if exists universities_authenticated_all on public.universities;
create policy universities_authenticated_all on public.universities for all to authenticated using (true) with check (true);

drop policy if exists programs_authenticated_all on public.programs;
create policy programs_authenticated_all on public.programs for all to authenticated using (true) with check (true);

drop policy if exists courses_authenticated_all on public.courses;
create policy courses_authenticated_all on public.courses for all to authenticated using (true) with check (true);

drop policy if exists lessons_authenticated_all on public.lessons;
create policy lessons_authenticated_all on public.lessons for all to authenticated using (true) with check (true);

drop policy if exists enrollments_authenticated_all on public.enrollments;
create policy enrollments_authenticated_all on public.enrollments for all to authenticated using (true) with check (true);

drop policy if exists lesson_progress_authenticated_all on public.lesson_progress;
create policy lesson_progress_authenticated_all on public.lesson_progress for all to authenticated using (true) with check (true);

drop policy if exists quizzes_authenticated_all on public.quizzes;
create policy quizzes_authenticated_all on public.quizzes for all to authenticated using (true) with check (true);

drop policy if exists questions_authenticated_all on public.questions;
create policy questions_authenticated_all on public.questions for all to authenticated using (true) with check (true);

drop policy if exists submissions_authenticated_all on public.submissions;
create policy submissions_authenticated_all on public.submissions for all to authenticated using (true) with check (true);

drop policy if exists grades_authenticated_all on public.grades;
create policy grades_authenticated_all on public.grades for all to authenticated using (true) with check (true);

drop policy if exists transcripts_authenticated_all on public.transcripts;
create policy transcripts_authenticated_all on public.transcripts for all to authenticated using (true) with check (true);

drop policy if exists certificates_authenticated_all on public.certificates;
create policy certificates_authenticated_all on public.certificates for all to authenticated using (true) with check (true);

drop policy if exists payments_authenticated_all on public.payments;
create policy payments_authenticated_all on public.payments for all to authenticated using (true) with check (true);

drop policy if exists discussion_posts_authenticated_all on public.discussion_posts;
create policy discussion_posts_authenticated_all on public.discussion_posts for all to authenticated using (true) with check (true);

drop policy if exists notifications_authenticated_all on public.notifications;
create policy notifications_authenticated_all on public.notifications for all to authenticated using (true) with check (true);

drop policy if exists support_tickets_authenticated_all on public.support_tickets;
create policy support_tickets_authenticated_all on public.support_tickets for all to authenticated using (true) with check (true);

drop policy if exists analytics_events_authenticated_all on public.analytics_events;
create policy analytics_events_authenticated_all on public.analytics_events for all to authenticated using (true) with check (true);

drop policy if exists calendar_events_authenticated_all on public.calendar_events;
create policy calendar_events_authenticated_all on public.calendar_events for all to authenticated using (true) with check (true);

drop policy if exists certificates_anon_read on public.certificates;
create policy certificates_anon_read on public.certificates for select to anon using (true);
