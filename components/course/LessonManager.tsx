'use client';

import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  useDraggable,
  useDroppable,
} from '@dnd-kit/core';
import Link from 'next/link';
import { CSSProperties, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { InstructorLesson } from '@/types/course';
import { default as VideoUpload } from '@/components/course/VideoUpload';

type LessonManagerProps = {
  courseId: string;
};

type CourseHeader = {
  id: string;
  title: string;
};

type LessonRecord = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  duration_seconds: number | null;
  video_url: string | null;
};

type NewLessonInsertRow = {
  id: string;
};

type CreateLessonForm = {
  title: string;
  description: string;
  durationSeconds: string;
};

const INITIAL_LESSON_FORM: CreateLessonForm = {
  title: '',
  description: '',
  durationSeconds: '',
};

const reorderLessons = (
  lessons: InstructorLesson[],
  activeId: string,
  overId: string,
): InstructorLesson[] => {
  const fromIndex = lessons.findIndex((lesson) => lesson.id === activeId);
  const toIndex = lessons.findIndex((lesson) => lesson.id === overId);

  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return lessons;
  }

  const nextLessons = [...lessons];
  const [movedLesson] = nextLessons.splice(fromIndex, 1);
  nextLessons.splice(toIndex, 0, movedLesson);

  return nextLessons.map((lesson, index) => ({
    ...lesson,
    order_index: index + 1,
  }));
};

type DraggableLessonCardProps = {
  lesson: InstructorLesson;
  onVideoUploaded: (videoUrl: string) => void;
};

function DraggableLessonCard({ lesson, onVideoUploaded }: DraggableLessonCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: lesson.id,
  });
  const { setNodeRef: setDroppableNodeRef, isOver } = useDroppable({
    id: lesson.id,
  });

  const setNodeRef = (node: HTMLElement | null) => {
    setDraggableNodeRef(node);
    setDroppableNodeRef(node);
  };

  const style: CSSProperties = {
    transform: transform
      ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
      : undefined,
    transition: isDragging ? undefined : 'transform 200ms ease',
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border px-4 py-3 ${
        isOver ? 'border-gray-900 bg-gray-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Lesson {lesson.order_index}
          </p>
          <h4 className="text-base font-semibold text-gray-900">{lesson.title}</h4>
          {lesson.description ? <p className="text-sm text-gray-600">{lesson.description}</p> : null}
          {lesson.duration_seconds ? (
            <p className="text-xs text-gray-500">Duration: {lesson.duration_seconds}s</p>
          ) : null}
        </div>

        <div className="flex flex-col items-end gap-2">
          <button
            type="button"
            {...listeners}
            {...attributes}
            className="cursor-grab rounded-md border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700 active:cursor-grabbing"
          >
            Drag
          </button>

          <VideoUpload
            courseId={lesson.course_id}
            lessonId={lesson.id}
            currentVideoUrl={lesson.video_url}
            onUploaded={onVideoUploaded}
          />
        </div>
      </div>
    </li>
  );
}

export default function LessonManager({ courseId }: LessonManagerProps) {
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [lessons, setLessons] = useState<InstructorLesson[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateLessonForm>(INITIAL_LESSON_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const lessonCount = useMemo(() => lessons.length, [lessons]);

  const loadLessons = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError(authError?.message ?? 'You must be logged in to manage lessons.');
      setIsLoading(false);
      return;
    }

    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('id,title')
      .eq('id', courseId)
      .eq('instructor_id', user.id)
      .maybeSingle();

    if (courseError || !courseData) {
      setError(courseError?.message ?? 'Course not found or access denied.');
      setIsLoading(false);
      return;
    }

    setCourseTitle((courseData as CourseHeader).title);

    const { data: lessonData, error: lessonError } = await supabase
      .from('lessons')
      .select('id,course_id,title,description,order_index,duration_seconds,video_url')
      .eq('course_id', courseId)
      .order('order_index', { ascending: true });

    if (lessonError || !lessonData) {
      setError(lessonError?.message ?? 'Unable to load lessons.');
      setIsLoading(false);
      return;
    }

    setLessons(lessonData as LessonRecord[]);
    setIsLoading(false);
  }, [courseId]);

  useEffect(() => {
    void loadLessons();
  }, [loadLessons]);

  const persistOrder = async (orderedLessons: InstructorLesson[]) => {
    setIsSavingOrder(true);
    setError(null);

    const supabase = createClient();
    const updateResults = await Promise.all(
      orderedLessons.map((lesson) =>
        supabase
          .from('lessons')
          .update({ order_index: lesson.order_index })
          .eq('id', lesson.id)
          .eq('course_id', courseId),
      ),
    );

    const failedUpdate = updateResults.find((result) => result.error);

    if (failedUpdate?.error) {
      setError(failedUpdate.error.message);
      await loadLessons();
    }

    setIsSavingOrder(false);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveLessonId(String(event.active.id));
    setSuccess(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = String(event.active.id);
    const overId = event.over ? String(event.over.id) : null;

    setActiveLessonId(null);

    if (!overId || activeId === overId) {
      return;
    }

    const reordered = reorderLessons(lessons, activeId, overId);
    setLessons(reordered);
    void persistOrder(reordered);
  };

  const handleCreateLesson = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const title = form.title.trim();
    const description = form.description.trim();

    if (!title) {
      setError('Lesson title is required.');
      return;
    }

    const durationSeconds = form.durationSeconds.trim()
      ? Number(form.durationSeconds)
      : null;

    if (durationSeconds !== null && (!Number.isInteger(durationSeconds) || durationSeconds < 0)) {
      setError('Duration must be a non-negative integer.');
      return;
    }

    setIsCreatingLesson(true);

    const supabase = createClient();
    const nextOrder = lessons.length > 0 ? Math.max(...lessons.map((item) => item.order_index)) + 1 : 1;

    const { data: newLessonData, error: insertError } = await supabase
      .from('lessons')
      .insert({
        course_id: courseId,
        title,
        description: description.length > 0 ? description : null,
        order_index: nextOrder,
        duration_seconds: durationSeconds,
        is_published: true,
      })
      .select('id')
      .single();

    if (insertError) {
      setError(insertError.message);
      setIsCreatingLesson(false);
      return;
    }

    const newLesson = newLessonData as NewLessonInsertRow;

    try {
      await fetch('/api/notifications/triggers/lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lesson_id: newLesson.id }),
      });
    } catch {
      // Lesson creation should not fail if notification trigger fails.
    }

    setForm(INITIAL_LESSON_FORM);
    setSuccess('Lesson created successfully.');
    setIsCreatingLesson(false);
    await loadLessons();
  };

  const handleVideoUploaded = (lessonId: string, videoUrl: string) => {
    setLessons((previousLessons) =>
      previousLessons.map((lesson) =>
        lesson.id === lessonId ? { ...lesson, video_url: videoUrl } : lesson,
      ),
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Lesson Manager</h2>
          <p className="text-sm text-gray-600">
            Course: <span className="font-medium text-gray-800">{courseTitle || 'Loading...'}</span>
          </p>
        </div>
        <Link href="/instructor/courses" className="text-sm font-medium text-gray-700 underline">
          Back to courses
        </Link>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">Create Lesson</h3>

        <form onSubmit={handleCreateLesson} className="mt-4 grid gap-4">
          <div>
            <label htmlFor="lessonTitle" className="mb-1 block text-sm font-medium text-gray-700">
              Lesson title
            </label>
            <input
              id="lessonTitle"
              name="lessonTitle"
              type="text"
              value={form.title}
              onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
              required
            />
          </div>

          <div>
            <label
              htmlFor="lessonDescription"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Lesson description
            </label>
            <textarea
              id="lessonDescription"
              name="lessonDescription"
              rows={3}
              value={form.description}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, description: event.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label
              htmlFor="durationSeconds"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Duration (seconds)
            </label>
            <input
              id="durationSeconds"
              name="durationSeconds"
              type="number"
              min={0}
              step={1}
              value={form.durationSeconds}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, durationSeconds: event.target.value }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
            />
          </div>

          <button
            type="submit"
            disabled={isCreatingLesson}
            className="w-fit rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isCreatingLesson ? 'Creating lesson...' : 'Add lesson'}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Lessons ({lessonCount})</h3>
          {isSavingOrder ? <p className="text-xs text-gray-500">Saving order...</p> : null}
        </div>

        {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}
        {success ? <p className="mb-3 text-sm text-green-700">{success}</p> : null}

        {isLoading ? <p className="text-sm text-gray-600">Loading lessons...</p> : null}

        {!isLoading && lessons.length === 0 ? (
          <p className="text-sm text-gray-600">No lessons added yet.</p>
        ) : null}

        {!isLoading && lessons.length > 0 ? (
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <ul className="space-y-3">
              {lessons.map((lesson) => (
                <DraggableLessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onVideoUploaded={(videoUrl) => handleVideoUploaded(lesson.id, videoUrl)}
                />
              ))}
            </ul>
          </DndContext>
        ) : null}

        {activeLessonId ? (
          <p className="mt-3 text-xs text-gray-500">Reordering lesson: {activeLessonId}</p>
        ) : null}
      </section>
    </div>
  );
}
