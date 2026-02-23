import { HttpClient } from './http-client';
import { API_ENDPOINTS } from './api-endpoints';
import { Attachment, VideoUploadItem, VideoUploadResponse } from '@/types';
import axios from 'axios';
import Cookies from 'js-cookie';
import { AUTH_CRED } from '@/utils/constants';

export type UploadOptions = {
  /** e.g. 'banners' for POST /attachments?folder=banners (banner/slider images) */
  folder?: string
}

export const uploadClient = {
  upload: async (variables: any, options?: UploadOptions) => {
    const files = Array.isArray(variables) ? variables : (variables?.files ?? variables);
    let formData = new FormData();
    files.forEach((attachment: any) => {
      formData.append('attachment[]', attachment);
    });
    const headers = {
      'Content-Type': 'multipart/form-data',
    };
    try {
      const baseURL = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://localhost:9000/api';
      const url = options?.folder
        ? `${baseURL}/${API_ENDPOINTS.ATTACHMENTS}?folder=${encodeURIComponent(options.folder)}`
        : `${baseURL}/${API_ENDPOINTS.ATTACHMENTS}`;

      const authCred = Cookies.get(AUTH_CRED);
      let token = '';
      if (authCred) {
        try {
          const parsed = JSON.parse(authCred) as { token?: string };
          token = parsed?.token ?? '';
        } catch {
          token = '';
        }
      }

      const axiosResponse = await axios.post(
        url,
        formData,
        {
          headers: {
            ...headers,
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Extract attachment data from response
      // Backend returns: {code: 200, status: true, message: '...', data: [{id, original, thumbnail, file_name}]}
      let attachmentData = axiosResponse.data?.data;
      
      // If data is empty array, check if attachments are in a different field
      if (Array.isArray(attachmentData) && attachmentData.length === 0) {
        // Check if data is directly in response (not wrapped)
        if (Array.isArray(axiosResponse.data) && axiosResponse.data.length > 0) {
          attachmentData = axiosResponse.data;
        }
        // Check if there's an attachments field
        else if (axiosResponse.data?.attachments && Array.isArray(axiosResponse.data.attachments)) {
          attachmentData = axiosResponse.data.attachments;
        }
        // Check if response has a different structure
        else if (axiosResponse.data && !axiosResponse.data.data) {
          // Maybe the response itself is the attachment array
          attachmentData = Array.isArray(axiosResponse.data) ? axiosResponse.data : [axiosResponse.data];
        }
      }
      
      // Ensure we always return an array
      if (!attachmentData || (Array.isArray(attachmentData) && attachmentData.length === 0)) {
        console.warn('No attachment data found in upload response');
        return [];
      }
      
      // Normalize to array if single object is returned
      return Array.isArray(attachmentData) ? attachmentData : [attachmentData];
    } catch (error: any) {
      console.error('❌ Upload client error:', error);
      console.error('Error response:', error?.response?.data);
      throw error;
    }
  },

  /**
   * Delete an attachment from the backend (and S3).
   * URL: DELETE {baseURL}/attachments/{id}
   */
  delete: async (id: string | number): Promise<void> => {
    const baseURL = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://localhost:9000/api';
    const url = `${baseURL}/${API_ENDPOINTS.ATTACHMENTS}/${id}`;

    const authCred = Cookies.get(AUTH_CRED);
    let token = '';
    if (authCred) {
      try {
        const parsed = JSON.parse(authCred) as { token?: string };
        token = parsed?.token ?? '';
      } catch {
        token = '';
      }
    }

    await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },

  /**
   * Upload video(s) for Type (S3 uploads/videos/). Field: video[] (multipart).
   * Allowed: mp4, webm, mov. Max 100MB per file, 10 files per request.
   * Returns { data: [{ id, url }, ...] }; use url in Type create/update video array.
   */
  uploadVideos: async (files: File[]): Promise<VideoUploadItem[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('video[]', file);
    });
    const baseURL = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://localhost:9000/api';
    const url = `${baseURL}/${API_ENDPOINTS.ATTACHMENTS_VIDEOS}`;

    const authCred = Cookies.get(AUTH_CRED);
    let token = '';
    if (authCred) {
      try {
        const parsed = JSON.parse(authCred) as { token?: string };
        token = parsed?.token ?? '';
      } catch {
        token = '';
      }
    }

    const res = await axios.post<VideoUploadResponse>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = res.data?.data;
    return Array.isArray(data) ? data : [];
  },

  /**
   * Delete a video from S3. id = numeric ID from upload response (data[].id).
   */
  deleteVideo: async (id: number): Promise<void> => {
    const baseURL = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://localhost:9000/api';
    const url = `${baseURL}/${API_ENDPOINTS.ATTACHMENTS_VIDEOS}/${id}`;

    const authCred = Cookies.get(AUTH_CRED);
    let token = '';
    if (authCred) {
      try {
        const parsed = JSON.parse(authCred) as { token?: string };
        token = parsed?.token ?? '';
      } catch {
        token = '';
      }
    }

    await axios.delete(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
};
