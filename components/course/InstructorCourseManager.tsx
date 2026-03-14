'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { CourseDifficulty, InstructorCourse } from '@/types/course';

type CourseFormState = {
  title: string;
  description: string;
  difficulty: CourseDifficulty;
  thumbnailFile: File | null;
  existingThumbnailUrl: string | null;
};

type CourseRecord = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  difficulty: CourseDifficulty | null;
  thumbnail_url: string | null;
  is_published: boolean;
  created_at: string;
};

const INITIAL_FORM: CourseFormState = {
  title: '',
  description: '',
  difficulty: 'beginner',
  thumbnailFile: null,
  existingThumbnailUrl: null,
};

const sanitizeFileName = (fileName: string): string =>
  fileName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.-]/g, '');

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const makeCourseSlug = (title: string): string => {
  const baseSlug = slugify(title) || 'course';
  return `${baseSlug}-${Date.now().toString(36)}`;
};

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

export default function InstructorCourseManager() {
  const [courses, setCourses] = useState<InstructorCourse[]>([]);
  const [form, setForm] = useState<CourseFormState>(INITIAL_FORM);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isEditing = useMemo(() => Boolean(editingCourseId), [editingCourseId]);

  const loadCourses = async () => {
    setIsLoading(true);
    setError(null);

    const supabase = createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError(authError?.message ?? 'You must be logged in to manage courses.');
      setIsLoading(false);
      return;
    }

    const { data, error: queryError } = await supabase
      .from('courses')
      .select('id,slug,title,description,difficulty,thumbnail_url,is_published,created_at')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: false });

    if (queryError || !data) {
      setError(queryError?.message ?? 'Unable to fetch courses.');
      setIsLoading(false);
      return;
    }

    setCourses(data as CourseRecord[]);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadCourses();
  }, []);

  const uploadThumbnail = async (file: File, userId: string): Promise<string> => {
    const supabase = createClient();
    const safeName = sanitizeFileName(file.name);
    const filePath = `thumbnails/${userId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('course-materials')
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('course-materials').getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const title = form.title.trim();
    const description = form.description.trim();

    if (!title) {
      setError('Course title is required.');
      return;
    }

    if (description.length < 10) {
      setError('Description should be at least 10 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error(authError?.message ?? 'You must be logged in to manage courses.');
      }

      let thumbnailUrl = form.existingThumbnailUrl;

      if (form.thumbnailFile) {
        thumbnailUrl = await uploadThumbnail(form.thumbnailFile, user.id);
      }

      if (editingCourseId) {
        const { error: updateError } = await supabase
          .from('courses')
          .update({
            title,
            description,
            difficulty: form.difficulty,
            thumbnail_url: thumbnailUrl,
          })
          .eq('id', editingCourseId)
          .eq('instructor_id', user.id);

        if (updateError) {
          throw new Error(updateError.message);
        }

        setSuccess('Course updated successfully.');
      } else {
        const { error: insertError } = await supabase.from('courses').insert({
          title,
          description,
          difficulty: form.difficulty,
          thumbnail_url: thumbnailUrl,
          instructor_id: user.id,
          slug: makeCourseSlug(title),
          is_published: false,
        });

        if (insertError) {
          throw new Error(insertError.message);
        }

        setSuccess('Course created successfully.');
      }

      setForm(INITIAL_FORM);
      setEditingCourseId(null);
      await loadCourses();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : 'Course save failed.';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (course: InstructorCourse) => {
    setEditingCourseId(course.id);
    setForm({
      title: course.title,
      description: course.description ?? '',
      difficulty: course.difficulty ?? 'beginner',
      thumbnailFile: null,
      existingThumbnailUrl: course.thumbnail_url,
    });
    setError(null);
    setSuccess(null);
  };

  const handlePublishToggle = async (course: InstructorCourse) => {
    setError(null);
    setSuccess(null);

    const supabase = createClient();
    const { error: toggleError } = await supabase
      .from('courses')
      .update({ is_published: !course.is_published })
      .eq('id', course.id);

    if (toggleError) {
      setError(toggleError.message);
      return;
    }

    setCourses((previousCourses) =>
      previousCourses.map((item) =>
        item.id === course.id ? { ...item, is_published: !item.is_published } : item,
      ),
    );
  };

  const handleCancelEdit = () => {
    setEditingCourseId(null);
    setForm(INITIAL_FORM);
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900">
          {isEditing ? 'Edit Course' : 'Create Course'}
        </h3>

        <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={(event) =>
                setForm((previous) => ({ ...previous, description: event.target.value }))
              }
              rows={5}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
              required
            />
          </div>

          <div>
            <label htmlFor="difficulty" className="mb-1 block text-sm font-medium text-gray-700">
              Difficulty
            </label>
            <select
              id="difficulty"
              name="difficulty"
              value={form.difficulty}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  difficulty: event.target.value as CourseDifficulty,
                }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label htmlFor="thumbnail" className="mb-1 block text-sm font-medium text-gray-700">
              Thumbnail
            </label>
            <input
              id="thumbnail"
              name="thumbnail"
              type="file"
              accept="image/*"
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  thumbnailFile: event.target.files?.[0] ?? null,
                }))
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
            {form.existingThumbnailUrl ? (
              <a
                href={form.existingThumbnailUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-xs text-gray-600 underline"
              >
                View current thumbnail
              </a>
            ) : null}
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {success ? <p className="text-sm text-green-700">{success}</p> : null}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Update course' : 'Create course'}
            </button>
            {isEditing ? (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-gray-900">Your Courses</h3>

        {isLoading ? <p className="mt-4 text-sm text-gray-600">Loading courses...</p> : null}

        {!isLoading && courses.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">No courses yet. Create your first course.</p>
        ) : null}

        {!isLoading && courses.length > 0 ? (
          <div className="mt-4 space-y-3">
            {courses.map((course) => (
              <article
                key={course.id}
                className="rounded-lg border border-gray-200 px-4 py-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-gray-900">{course.title}</h4>
                    <p className="text-xs text-gray-500">Created: {formatDate(course.created_at)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        course.is_published
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {course.is_published ? 'Published' : 'Draft'}
                    </span>
                    <button
                      type="button"
                      onClick={() => void handlePublishToggle(course)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      {course.is_published ? 'Unpublish' : 'Publish'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(course)}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Edit
                    </button>
                    <Link
                      href={`/instructor/courses/${course.id}/lessons`}
                      className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
                    >
                      Manage lessons
                    </Link>
                    <Link
                      href={`/instructor/courses/${course.id}/quizzes`}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Manage quizzes
                    </Link>
                    <Link
                      href={`/instructor/courses/${course.id}/grades`}
                      className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      View grades
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </div>
  );
}
