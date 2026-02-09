import { UploadIcon } from '@/components/icons/upload-icon';
import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Attachment } from '@/types';
import { CloseIcon } from '@/components/icons/close-icon';
import Loader from '@/components/ui/loader/loader';
import { useTranslation } from 'next-i18next';
import { useUploadMutation } from '@/data/upload';
import Image from 'next/image';
import { zipPlaceholder } from '@/utils/placeholders';
import { ACCEPTED_FILE_TYPES } from '@/utils/constants';
import classNames from 'classnames';
// import { processFileWithName } from '../product/form-utils';
import cn from 'classnames';

const getPreviewImage = (value: any) => {
  let images: any[] = [];
  if (value) {
    images = Array.isArray(value) ? value : [{ ...value }];
  }
  return images;
};
export default function Uploader({
  onChange,
  value,
  multiple,
  acceptFile,
  helperText,
  maxSize,
  maxFiles,
  disabled,
}: any) {
  const { t } = useTranslation();
  const [files, setFiles] = useState<Attachment[]>(getPreviewImage(value));
  const { mutate: upload, isLoading: loading } = useUploadMutation();
  const [error, setError] = useState<string | null>(null);

  // Sync internal state when value changes (e.g. form reset on edit product so image/gallery pre-populate)
  useEffect(() => {
    setFiles(getPreviewImage(value));
  }, [value]);

  const { getRootProps, getInputProps } = useDropzone({
    ...(!acceptFile
      ? {
          accept: {
            'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
          },
        }
      : { ...ACCEPTED_FILE_TYPES }),
    multiple,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length) {
        upload(
          acceptedFiles, // it will be an array of uploaded attachments
          {
            onSuccess: (data: any) => {
              // Ensure data is an array
              if (!data) {
                console.error('Upload response is undefined or null', {
                  acceptedFiles: acceptedFiles.length,
                  multiple,
                });
                return;
              }

              // Normalize data to array if it's not already
              const dataArray = Array.isArray(data) ? data : [data];
              
              // Validate that we have attachment data
              if (dataArray.length === 0) {
                console.error('Upload response is empty array', { data });
                return;
              }

              // Process Digital File Name section
              dataArray.forEach((file: any, idx: number) => {
                if (file?.original) {
                  const splitArray = file.original.split('/');
                  const fileSplitName =
                    splitArray[splitArray.length - 1]?.split('.');
                  const fileType = fileSplitName?.pop(); // it will pop the last item from the fileSplitName arr which is the file ext
                  const filename = fileSplitName?.join('.'); // it will join the array with dot, which restore the original filename
                  if (filename && fileType) {
                    dataArray[idx] = {
                      ...file,
                      file_name: `${filename}.${fileType}`,
                    };
                  }
                }
              });


              let mergedData;
              if (multiple) {
                mergedData = files.concat(dataArray);
                setFiles(files.concat(dataArray));
              } else {
                // For single file upload, use the first item or the single item
                mergedData = dataArray[0] || dataArray;
                setFiles(dataArray);
              }
              if (onChange) {
                onChange(mergedData);
              }
            },
            onError: (error: any) => {
              console.error('Upload error:', error);
              setError(
                error?.response?.data?.message ||
                  error?.message ||
                  t('error-upload-failed')
              );
            },
          },
        );
      }
    },
    // maxFiles: 2,
    maxSize: maxSize,
    onDropRejected: (fileRejections) => {
      fileRejections.forEach((file) => {
        file?.errors?.forEach((error) => {
          if (error?.code === 'file-too-large') {
            setError(t('error-file-too-large'));
          } else if (error?.code === 'file-invalid-type') {
            setError(t('error-invalid-file-type'));
          }
        });
      });
    },
  });

  const handleDelete = (image: string) => {
    const images = files.filter((file) => file.thumbnail !== image);
    setFiles(images);
    if (onChange) {
      onChange(images);
    }
  };
  const thumbs = files?.map((file: any, idx) => {
    const imgTypes = [
      'tif',
      'tiff',
      'bmp',
      'jpg',
      'jpeg',
      'webp',
      'gif',
      'png',
      'eps',
      'raw',
    ];
    // let filename, fileType, isImage;
    if (file && file.id) {
      // const processedFile = processFileWithName(file);
      const splitArray = file?.file_name
        ? file?.file_name.split('.')
        : file?.thumbnail?.split('.');
      const fileType = splitArray?.pop(); // it will pop the last item from the fileSplitName arr which is the file ext
      const filename = splitArray?.join('.'); // it will join the array with dot, which restore the original filename
      const isImage = file?.thumbnail && imgTypes.includes(fileType?.toLowerCase()); // check if the original filename has the img ext

      // Old Code *******

      // const splitArray = file?.original?.split('/');
      // let fileSplitName = splitArray[splitArray?.length - 1]?.split('.'); // it will create an array of words of filename
      // const fileType = fileSplitName.pop(); // it will pop the last item from the fileSplitName arr which is the file ext
      // const filename = fileSplitName.join('.'); // it will join the array with dot, which restore the original filename
      // const isImage = file?.thumbnail && imgTypes.includes(fileType); // check if the original filename has the img ext

      return (
        <div
          className={cn(
            'relative mt-2 inline-flex flex-col overflow-hidden rounded me-2',
            isImage ? 'border border-border-200' : '',
            disabled ? 'cursor-not-allowed border-[#D4D8DD] bg-[#EEF1F4]' : '',
          )}
          key={idx}
        >
          {/* {file?.thumbnail && isImage ? ( */}
          {isImage ? (
            <figure className="relative flex items-center justify-center h-16 w-28 aspect-square overflow-hidden bg-gray-100">
              {/* Use thumbnail first, fallback to original */}
              {file.thumbnail ? (
                <img
                  src={file.thumbnail}
                  alt={filename || 'Uploaded image'}
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const currentSrc = e.currentTarget.src;
                    // Try original image as fallback
                    if (file.original && currentSrc !== file.original && !currentSrc.includes(file.original)) {
                      e.currentTarget.src = file.original;
                    }
                  }}
                />
              ) : file.original ? (
                <img
                  src={file.original}
                  alt={filename || 'Uploaded image'}
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="flex items-center justify-center h-full w-full text-xs text-gray-400">
                  No image
                </div>
              )}
            </figure>
          ) : (
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center min-w-0 overflow-hidden h-14 w-14">
                <Image
                  src={zipPlaceholder}
                  width={56}
                  height={56}
                  alt="upload placeholder"
                />
              </div>
              <p className="flex items-baseline p-1 text-xs cursor-default text-body">
                <span
                  className="inline-block max-w-[64px] overflow-hidden overflow-ellipsis whitespace-nowrap"
                  title={`${filename}.${fileType}`}
                >
                  {filename}
                </span>
                .{fileType}
              </p>
            </div>
          )}
          {/* {multiple ? (
          ) : null} */}
          {!disabled ? (
            <button
              className="absolute flex items-center justify-center w-4 h-4 text-xs bg-red-600 rounded-full shadow-xl outline-none top-1 text-light end-1"
              onClick={() => handleDelete(file.thumbnail)}
            >
              <CloseIcon width={10} height={10} />
            </button>
          ) : (
            ''
          )}
        </div>
      );
    }
  });

  useEffect(
    () => () => {
      // Reset error after upload new file
      setError(null);

      // Make sure to revoke the data uris to avoid memory leaks
      files.forEach((file: any) => URL.revokeObjectURL(file.thumbnail));
    },
    [files],
  );

  return (
    <section className="upload">
      <div
        {...getRootProps({
          className: classNames(
            'border-dashed border-2 border-border-base h-36 rounded flex flex-col justify-center items-center cursor-pointer focus:border-accent-400 focus:outline-none relative',
            disabled
              ? 'pointer-events-none select-none opacity-80 bg-[#EEF1F4]'
              : 'cursor-pointer',
          ),
        })}
      >
        {!disabled ? <input {...getInputProps()} /> : ''}
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
              <span className="text-xs text-body">{t('text-img-format')}</span>
            </>
          )}
        </p>
        {error && (
          <p className="mt-4 text-sm text-center text-red-600">{error}</p>
        )}
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
