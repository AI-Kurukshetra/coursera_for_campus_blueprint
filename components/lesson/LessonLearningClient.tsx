'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, MessageCircle, NotepadText } from 'lucide-react';
import LessonSidebar from '@/components/lesson/LessonSidebar';
import VideoPlayer from '@/components/video-player/VideoPlayer';
import { trackEvent } from '@/lib/analytics/trackEvent';
import type { LessonCourseMeta, LessonLearningItem } from '@/types/lesson';

type LessonLearningClientProps = {
  course: LessonCourseMeta;
  initialLessons: LessonLearningItem[];
  activeLessonId: string;
};

const formatDuration = (durationSeconds: number | null): string => {
  if (!durationSeconds || durationSeconds <= 0) {
    return 'Duration TBA';
  }

  const minutes = Math.ceil(durationSeconds / 60);
  return `${minutes} min`;
};

export default function LessonLearningClient({
  course,
  initialLessons,
  activeLessonId,
}: LessonLearningClientProps) {
  const [lessons, setLessons] = useState<LessonLearningItem[]>(initialLessons);
  const [activeTab, setActiveTab] = useState<'notes' | 'discussion' | 'resources'>('notes');
  const trackedLessonIdsRef = useRef<Set<string>>(new Set());

  const activeLesson = useMemo(
    () => lessons.find((lesson) => lesson.id === activeLessonId) ?? null,
    [activeLessonId, lessons],
  );

  useEffect(() => {
    if (!activeLesson) {
      return;
    }

    if (trackedLessonIdsRef.current.has(activeLesson.id)) {
      return;
    }

    trackedLessonIdsRef.current.add(activeLesson.id);

    void trackEvent('lesson_view', {
      course_id: course.id,
      lesson_id: activeLesson.id,
      course_slug: course.slug,
      lesson_order: activeLesson.order_index,
    });
  }, [activeLesson, course.id, course.slug]);

  if (!activeLesson) {
    return (
      <div className="rounded-xl border border-red-500/60 bg-red-500/10 p-4 text-red-300">
        Lesson not found.
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <section className="space-y-5">
        <div className="space-y-2 rounded-xl border border-brand-border/70 bg-[#121a31]/70 p-4 shadow-glass backdrop-blur-xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-accent">{course.title}</p>
          <h2 className="font-heading text-3xl text-white">{activeLesson.title}</h2>
          <p className="text-sm text-brand-muted">{formatDuration(activeLesson.duration_seconds)}</p>
          {activeLesson.description ? (
            <p className="text-sm text-brand-text">{activeLesson.description}</p>
          ) : null}
        </div>

        {activeLesson.video_url ? (
          <VideoPlayer
            lessonId={activeLesson.id}
            courseId={course.id}
            videoUrl={activeLesson.video_url}
            durationSeconds={activeLesson.duration_seconds}
            initialWatchedSeconds={activeLesson.watched_seconds}
            onProgressSaved={({ watchedSeconds, completed }) => {
              setLessons((previousLessons) =>
                previousLessons.map((lesson) =>
                  lesson.id === activeLesson.id
                    ? {
                        ...lesson,
                        watched_seconds: Math.max(lesson.watched_seconds, watchedSeconds),
                        completed,
                      }
                    : lesson,
                ),
              );
            }}
          />
        ) : (
          <div className="rounded-xl border border-dashed border-brand-border bg-[#121a31]/70 p-8 text-center text-brand-muted">
            Video is not available for this lesson yet.
          </div>
        )}

        <div className="rounded-xl border border-brand-border/70 bg-[#121a31]/70 p-4 shadow-glass backdrop-blur-xl">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {[
              { key: 'notes', label: 'Notes', icon: NotepadText },
              { key: 'discussion', label: 'Discussion', icon: MessageCircle },
              { key: 'resources', label: 'Resources', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as 'notes' | 'discussion' | 'resources')}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? 'bg-brand-primary text-white'
                      : 'bg-[#0f1734] text-brand-muted hover:text-brand-text'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {activeTab === 'notes' ? (
            <p className="text-sm text-brand-muted">Add your key notes and revision points for this lesson here.</p>
          ) : null}
          {activeTab === 'discussion' ? (
            <p className="text-sm text-brand-muted">Collaborate with peers and ask questions in the discussion thread.</p>
          ) : null}
          {activeTab === 'resources' ? (
            <p className="text-sm text-brand-muted">Supplementary reading material and downloadable resources will appear here.</p>
          ) : null}
        </div>
      </section>

      <LessonSidebar slug={course.slug} activeLessonId={activeLessonId} lessons={lessons} />
    </div>
  );
}
