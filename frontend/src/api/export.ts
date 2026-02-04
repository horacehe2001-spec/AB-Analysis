import apiClient from './index';
import type { ExportRequest, ExportResponse } from '../types/api';

export interface ConclusionRequest {
  session_id?: string;
  analyses: {
    x_variable?: string;
    y_variable?: string;
    method: string;
    method_name: string;
    p_value: number | null;
    significant: boolean;
    effect_size: Record<string, unknown>;
    interpretation: string;
    suggestions: string[];
  }[];
  data_summary?: Record<string, unknown> | null;
}

export interface ConclusionResponse {
  conclusion: string;
}

export const exportApi = {
  /**
   * 导出分析报告
   */
  exportReport: async (data: ExportRequest): Promise<ExportResponse> => {
    return apiClient.post<ExportResponse, ExportResponse>('/api/v2/export', data);
  },

  /**
   * 下载报告文件
   */
  downloadReport: (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * 生成报告结论（调用大模型）
   */
  generateConclusion: async (data: ConclusionRequest): Promise<ConclusionResponse> => {
    return apiClient.post<ConclusionResponse, ConclusionResponse>('/api/v2/report/conclusion', data, {
      timeout: 300000,
    });
  },
};
