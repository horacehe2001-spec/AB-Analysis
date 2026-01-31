import apiClient from './index';
import type { UploadResponse } from '../types/api';
import type { Industry } from '../types/session';

export const uploadApi = {
  /**
   * 上传数据文件
   */
  uploadFile: async (file: File, industry?: Industry): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (industry) {
      formData.append('industry', industry);
    }

    return apiClient.post<UploadResponse, UploadResponse>('/api/v2/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};
