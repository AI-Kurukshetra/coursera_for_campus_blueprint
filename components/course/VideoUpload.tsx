'use client';

import { ChangeEvent, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type VideoUploadProps = {
  courseId: string;
  lessonId: string;
  currentVideoUrl: string | null;
  onUploaded: (videoUrl: string) => void;
};

const sanitizeFileName = (fileName: string): string =>
  fileName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9.-]/g, '');

export default function VideoUpload({
  courseId,
  lessonId,
  currentVideoUrl,
  onUploaded,
}: VideoUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError(null);
    setIsUploading(true);

    const supabase = createClient();
    const safeName = sanitizeFileName(file.name);
    const filePath = `courses/${courseId}/lessons/${lessonId}/${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from('videos')
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      setError(uploadError.message);
      setIsUploading(false);
      event.target.value = '';
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('videos').getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from('lessons')
      .update({ video_url: publicUrl })
      .eq('id', lessonId)
      .eq('course_id', courseId);

    if (updateError) {
      setError(updateError.message);
      setIsUploading(false);
      event.target.value = '';
      return;
    }

    onUploaded(publicUrl);
    setIsUploading(false);
    event.target.value = '';
  };

  return (
    <div className="space-y-2">
      <label className="inline-flex cursor-pointer items-center rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">
        {isUploading ? 'Uploading video...' : 'Upload video'}
        <input
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleUpload}
          disabled={isUploading}
        />
      </label>

      {currentVideoUrl ? (
        <a
          href={currentVideoUrl}
          target="_blank"
          rel="noreferrer"
          className="block text-xs text-gray-600 underline"
        >
          View uploaded video
        </a>
      ) : null}

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
