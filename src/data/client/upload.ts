import { HttpClient } from './http-client';
import { API_ENDPOINTS } from './api-endpoints';
import { Attachment } from '@/types';
import axios from 'axios';
import Cookies from 'js-cookie';
import { AUTH_CRED } from '@/utils/constants';

export const uploadClient = {
  upload: async (variables: any) => {
    let formData = new FormData();
    variables.forEach((attachment: any) => {
      formData.append('attachment[]', attachment);
    });
    const options = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    try {
      // Make direct axios call to inspect full response structure
      // This bypasses HttpClient to see the raw response
      const baseURL = process.env.NEXT_PUBLIC_REST_API_ENDPOINT || 'http://localhost:9000/api';

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
        `${baseURL}/${API_ENDPOINTS.ATTACHMENTS}`,
        formData,
        {
          ...options,
          headers: {
            ...options.headers,
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
};
