import { UploadIcon } from '@/components/icons/upload-icon';
import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloseIcon } from '@/components/icons/close-icon';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { uploadClient } from '@/data/client/upload';
import classNames from 'classnames';
import cn from 'classnames';

const VIDEO_ACCEPT = {
  'video/mp4': ['.mp4'],
  'video/webm': ['.webm'],
  'video/quicktime': ['.mov'],
};
const MAX_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_FILES = 10;

export type VideoFormItem = { url: string; id?: number };

const getPreviewVideos = (
  value: VideoFormItem[] | undefined | null
): VideoFormItem[] => {
  if (!value) return [];
  return Array.isArray(value) ? value : [];
};

type VideoUploaderProps = {
  value: VideoFormItem[]
  onChange: (v: VideoFormItem[]) => void
  helperText?: string
  disabled?: boolean
}

export default function VideoUploader({
  onChange,
  value,
  helperText,
  disabled,
}: VideoUploaderProps) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<VideoFormItem[]>(getPreviewVideos(value));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFiles(getPreviewVideos(value));
  }, [value]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: VIDEO_ACCEPT,
    multiple: true,
    maxSize: MAX_SIZE,
    maxFiles: MAX_FILES,
    disabled,
    onDrop: async (acceptedFiles) => {
      if (!acceptedFiles.length) return;
      setError(null);
      setLoading(true);
      try {
        const items = await uploadClient.uploadVideos(acceptedFiles);
        const newItems: VideoFormItem[] = items.map((item) => ({
          url: item.url,
          id: item.id,
        }));
        const merged = files.concat(newItems);
        setFiles(merged);
        onChange(merged);
      } catch (err: any) {
        setError(
          err?.response?.data?.message ||
            err?.message ||
            t('error-upload-failed') ||
            'Upload failed'
        );
      } finally {
        setLoading(false);
      }
    },
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((rejection) => {
        rejection.errors?.forEach((e) => {
          if (e.code === 'file-too-large') {
            setError(
              t('error-file-too-large') || 'File is too large (max 100MB)'
            );
          } else if (e.code === 'file-invalid-type') {
            setError(
              t('error-invalid-file-type') ||
                'Invalid file type (mp4, webm, mov only)'
            );
          }
        });
      });
    },
  });

  const handleDelete = (item: VideoFormItem) => {
    const updateUI = () => {
      setError(null);
      const next = files.filter((f) => f.url !== item.url);
      setFiles(next);
      onChange(next);
    };
    if (item.id != null) {
      uploadClient
        .deleteVideo(item.id)
        .then(updateUI)
        .catch(() => updateUI());
    } else {
      updateUI();
    }
  };

  const thumbs = files.map((file, idx) => (
    <div
      className={cn(
        'relative mt-2 inline-flex flex-col overflow-hidden rounded me-2 border border-border-200',
        disabled ? 'cursor-not-allowed border-[#D4D8DD] bg-[#EEF1F4]' : ''
      )}
      key={file.url + String(idx)}
    >
      <figure className="relative flex items-center justify-center h-16 w-28 overflow-hidden bg-gray-100">
        <video
          src={file.url}
          className="h-full w-full object-contain"
          muted
          playsInline
          preload="metadata"
        />
      </figure>
      {!disabled ? (
        <button
          type="button"
          className="absolute flex items-center justify-center w-4 h-4 text-xs bg-red-600 rounded-full shadow-xl outline-none top-1 text-light end-1"
          onClick={() => handleDelete(file)}
        >
          <CloseIcon width={10} height={10} />
        </button>
      ) : null}
    </div>
  ));

  return (
    <section className="upload">
      <div
        {...getRootProps({
          className: classNames(
            'border-dashed border-2 border-border-base h-36 rounded flex flex-col justify-center items-center cursor-pointer focus:border-accent-400 focus:outline-none relative',
            disabled
              ? 'pointer-events-none select-none opacity-80 bg-[#EEF1F4]'
              : 'cursor-pointer'
          ),
        })}
      >
        {!disabled ? <input {...getInputProps()} /> : null}
        <UploadIcon className="text-muted-light" />
        <p className="mt-4 text-sm text-center text-body">
          {helperText ? (
            <span className="font-semibold text-gray-500">{helperText}</span>
          ) : (
            <>
              <span className="font-semibold text-accent">
                {t('text-upload-highlight')}
              </span>{' '}
              {t('text-upload-message')} <br />
              <span className="text-xs text-body">
                mp4, webm, mov. Max 100MB per file.
              </span>
            </>
          )}
        </p>
        {error ? (
          <p className="mt-4 text-sm text-center text-red-600">{error}</p>
        ) : null}
      </div>

      {(!!thumbs.length || loading) && (
        <aside className="flex flex-wrap mt-2">
          {!!thumbs.length && thumbs}
          {loading && (
            <div className="flex items-center h-16 mt-2 ms-2">
              <Loader simple={true} className="w-6 h-6" />
            </div>
          )}
        </aside>
      )}
    </section>
  );
}
