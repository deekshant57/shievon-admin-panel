import { useMutation, useQueryClient } from 'react-query';
import { API_ENDPOINTS } from '@/data/client/api-endpoints';
import { uploadClient, UploadOptions } from '@/data/client/upload';

export type UploadMutationInput = File[] | { files: File[]; folder?: string };

export const useUploadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (input: UploadMutationInput) => {
      if (Array.isArray(input)) {
        return uploadClient.upload(input);
      }
      return uploadClient.upload(input.files, { folder: input.folder });
    },
    {
      onSettled: () => {
        // Previously we invalidated SETTINGS on every upload:
        // queryClient.invalidateQueries(API_ENDPOINTS.SETTINGS);
        //
        // Uploads (e.g. product images) do not usually change global app settings,
        // and invalidating here caused a high volume of `/api/settings` refetches.
        // If a specific upload flow truly affects settings, explicitly invalidate
        // SETTINGS from that flow instead of doing it globally here.
      },
    }
  );
};

export const useDeleteAttachmentMutation = () => {
  return useMutation((attachmentId: string | number) =>
    uploadClient.delete(attachmentId)
  );
};
