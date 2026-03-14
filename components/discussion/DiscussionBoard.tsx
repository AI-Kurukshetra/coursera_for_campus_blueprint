'use client';

import { FormEvent, useMemo, useState } from 'react';
import type { ApiResponse } from '@/lib/api/response';
import type { CourseDiscussionData, DiscussionPost, DiscussionThread } from '@/types/discussion';

type DiscussionBoardProps = {
  initialData: CourseDiscussionData;
};

type CreateDiscussionPayload = {
  course_id: string;
  content: string;
  parent_id?: string;
};

type UpvoteResponseData = {
  id: string;
  parent_id: string | null;
  upvotes: number;
};

type DeleteResponseData = {
  id: string;
  parent_id: string | null;
};

type MarkAnswerResponseData = {
  id: string;
  parent_id: string | null;
  is_instructor_answer: boolean;
};

const formatDateTime = (isoDate: string): string =>
  new Date(isoDate).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

const appendPost = (
  threads: DiscussionThread[],
  post: DiscussionPost,
): DiscussionThread[] => {
  if (post.parent_id === null) {
    return [...threads, { ...post, replies: [] }];
  }

  return threads.map((thread) =>
    thread.id === post.parent_id
      ? { ...thread, replies: [...thread.replies, post] }
      : thread,
  );
};

const updateUpvotes = (
  threads: DiscussionThread[],
  postId: string,
  upvotes: number,
): DiscussionThread[] =>
  threads.map((thread) => {
    if (thread.id === postId) {
      return { ...thread, upvotes };
    }

    return {
      ...thread,
      replies: thread.replies.map((reply) =>
        reply.id === postId ? { ...reply, upvotes } : reply,
      ),
    };
  });

const removePost = (
  threads: DiscussionThread[],
  postId: string,
  parentId: string | null,
): DiscussionThread[] => {
  if (parentId === null) {
    return threads.filter((thread) => thread.id !== postId);
  }

  return threads.map((thread) =>
    thread.id === parentId
      ? { ...thread, replies: thread.replies.filter((reply) => reply.id !== postId) }
      : thread,
  );
};

const markReplyAsAnswer = (
  threads: DiscussionThread[],
  replyId: string,
  parentId: string,
): DiscussionThread[] =>
  threads.map((thread) => {
    if (thread.id !== parentId) {
      return thread;
    }

    return {
      ...thread,
      replies: thread.replies.map((reply) => ({
        ...reply,
        is_instructor_answer: reply.id === replyId,
      })),
    };
  });

export default function DiscussionBoard({ initialData }: DiscussionBoardProps) {
  const [threads, setThreads] = useState<DiscussionThread[]>(initialData.threads);
  const [newPostContent, setNewPostContent] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [openReplyForms, setOpenReplyForms] = useState<Record<string, boolean>>({});
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [actionPostId, setActionPostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const threadCount = useMemo(() => threads.length, [threads.length]);

  const submitPost = async (payload: CreateDiscussionPayload): Promise<void> => {
    const response = await fetch('/api/discussions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as ApiResponse<{ post: DiscussionPost }>;

    if (!response.ok || !result.data?.post) {
      throw new Error(result.error ?? 'Unable to create post.');
    }

    const createdPost = result.data.post;
    setThreads((previousThreads) => appendPost(previousThreads, createdPost));
  };

  const handleCreateTopLevelPost = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const content = newPostContent.trim();

    if (content.length === 0) {
      setError('Post content is required.');
      return;
    }

    setIsCreatingPost(true);

    try {
      await submitPost({
        course_id: initialData.course.id,
        content,
      });
      setNewPostContent('');
    } catch (postError) {
      const message = postError instanceof Error ? postError.message : 'Unable to create post.';
      setError(message);
    } finally {
      setIsCreatingPost(false);
    }
  };

  const handleCreateReply = async (threadId: string) => {
    setError(null);
    const content = (replyDrafts[threadId] ?? '').trim();

    if (content.length === 0) {
      setError('Reply content is required.');
      return;
    }

    setActionPostId(threadId);

    try {
      await submitPost({
        course_id: initialData.course.id,
        parent_id: threadId,
        content,
      });

      setReplyDrafts((previous) => ({
        ...previous,
        [threadId]: '',
      }));
      setOpenReplyForms((previous) => ({
        ...previous,
        [threadId]: false,
      }));
    } catch (replyError) {
      const message = replyError instanceof Error ? replyError.message : 'Unable to create reply.';
      setError(message);
    } finally {
      setActionPostId(null);
    }
  };

  const handleUpvote = async (postId: string) => {
    setError(null);
    setActionPostId(postId);

    try {
      const response = await fetch(`/api/discussions/${postId}/upvote`, {
        method: 'POST',
      });

      const result = (await response.json()) as ApiResponse<UpvoteResponseData>;

      if (!response.ok || !result.data) {
        throw new Error(result.error ?? 'Unable to upvote post.');
      }

      setThreads((previousThreads) =>
        updateUpvotes(previousThreads, result.data!.id, result.data!.upvotes),
      );
    } catch (upvoteError) {
      const message = upvoteError instanceof Error ? upvoteError.message : 'Unable to upvote post.';
      setError(message);
    } finally {
      setActionPostId(null);
    }
  };

  const handleDelete = async (postId: string) => {
    setError(null);
    setActionPostId(postId);

    try {
      const response = await fetch(`/api/discussions/${postId}`, {
        method: 'DELETE',
      });

      const result = (await response.json()) as ApiResponse<DeleteResponseData>;

      if (!response.ok || !result.data) {
        throw new Error(result.error ?? 'Unable to delete post.');
      }

      setThreads((previousThreads) =>
        removePost(previousThreads, result.data!.id, result.data!.parent_id),
      );
    } catch (deleteError) {
      const message = deleteError instanceof Error ? deleteError.message : 'Unable to delete post.';
      setError(message);
    } finally {
      setActionPostId(null);
    }
  };

  const handleMarkAnswer = async (replyId: string, parentId: string) => {
    setError(null);
    setActionPostId(replyId);

    try {
      const response = await fetch(`/api/discussions/${replyId}/mark-answer`, {
        method: 'PATCH',
      });

      const result = (await response.json()) as ApiResponse<MarkAnswerResponseData>;

      if (!response.ok || !result.data || result.data.parent_id !== parentId) {
        throw new Error(result.error ?? 'Unable to mark answer.');
      }

      setThreads((previousThreads) =>
        markReplyAsAnswer(previousThreads, result.data!.id, parentId),
      );
    } catch (markError) {
      const message = markError instanceof Error ? markError.message : 'Unable to mark answer.';
      setError(message);
    } finally {
      setActionPostId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-gray-900">Discussion Board</h2>
          <p className="text-sm text-gray-600">Threads: {threadCount}</p>
        </div>

        <form onSubmit={handleCreateTopLevelPost} className="space-y-3">
          <textarea
            value={newPostContent}
            onChange={(event) => setNewPostContent(event.target.value)}
            rows={4}
            placeholder="Start a discussion for this course"
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
          />
          <button
            type="submit"
            disabled={isCreatingPost}
            className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isCreatingPost ? 'Posting...' : 'Post discussion'}
          </button>
        </form>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </section>

      <section className="space-y-4">
        {threads.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-600 shadow-sm">
            No discussions yet. Be the first to start one.
          </div>
        ) : null}

        {threads.map((thread) => (
          <article key={thread.id} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900">{thread.author.name}</p>
                <p className="text-xs text-gray-500">{formatDateTime(thread.created_at)}</p>
              </div>
              <p className="text-sm leading-6 text-gray-800">{thread.content}</p>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
              <button
                type="button"
                onClick={() => void handleUpvote(thread.id)}
                disabled={actionPostId === thread.id}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-70"
              >
                Upvote ({thread.upvotes})
              </button>
              <button
                type="button"
                onClick={() =>
                  setOpenReplyForms((previous) => ({
                    ...previous,
                    [thread.id]: !previous[thread.id],
                  }))
                }
                className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-100"
              >
                Reply
              </button>
              {thread.author.id === initialData.current_user.id ? (
                <button
                  type="button"
                  onClick={() => void handleDelete(thread.id)}
                  disabled={actionPostId === thread.id}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  Delete
                </button>
              ) : null}
            </div>

            {openReplyForms[thread.id] ? (
              <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
                <textarea
                  rows={3}
                  value={replyDrafts[thread.id] ?? ''}
                  onChange={(event) =>
                    setReplyDrafts((previous) => ({
                      ...previous,
                      [thread.id]: event.target.value,
                    }))
                  }
                  placeholder="Write your reply"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCreateReply(thread.id)}
                    disabled={actionPostId === thread.id}
                    className="rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {actionPostId === thread.id ? 'Replying...' : 'Post reply'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setOpenReplyForms((previous) => ({
                        ...previous,
                        [thread.id]: false,
                      }))
                    }
                    className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {thread.replies.length > 0 ? (
              <div className="mt-5 space-y-3 border-l-2 border-gray-200 pl-4">
                {thread.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className={`rounded-md border p-3 ${
                      reply.is_instructor_answer
                        ? 'border-emerald-300 bg-emerald-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-900">{reply.author.name}</p>
                      <p className="text-xs text-gray-500">{formatDateTime(reply.created_at)}</p>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-gray-800">{reply.content}</p>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void handleUpvote(reply.id)}
                        disabled={actionPostId === reply.id}
                        className="rounded-md border border-gray-300 px-2.5 py-1 text-xs text-gray-700 hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        Upvote ({reply.upvotes})
                      </button>

                      {initialData.can_mark_answers ? (
                        <button
                          type="button"
                          onClick={() => void handleMarkAnswer(reply.id, thread.id)}
                          disabled={actionPostId === reply.id || reply.is_instructor_answer}
                          className="rounded-md border border-emerald-300 px-2.5 py-1 text-xs text-emerald-700 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {reply.is_instructor_answer ? 'Marked as answer' : 'Mark as Answer'}
                        </button>
                      ) : null}

                      {reply.author.id === initialData.current_user.id ? (
                        <button
                          type="button"
                          onClick={() => void handleDelete(reply.id)}
                          disabled={actionPostId === reply.id}
                          className="rounded-md border border-red-300 px-2.5 py-1 text-xs text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </div>
  );
}
