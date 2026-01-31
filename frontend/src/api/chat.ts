import apiClient from './index';
import type { ChatRequest, ChatResponse } from '../types/api';

export const chatApi = {
  /**
   * 发送对话消息
   */
  sendMessage: async (data: ChatRequest): Promise<ChatResponse> => {
    return apiClient.post<ChatResponse, ChatResponse>('/api/v2/chat', data);
  },
};
