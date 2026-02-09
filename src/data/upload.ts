import { useMutation, useQueryClient } from 'react-query';
import { API_ENDPOINTS } from '@/data/client/api-endpoints';
import { uploadClient } from '@/data/client/upload';

export const useUploadMutation = () => {
  const queryClient = useQueryClient();

  return useMutation(
    (input: any) => {
      return uploadClient.upload(input);
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
