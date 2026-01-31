import apiClient from './index';
import type { SessionsQuery, SessionsResponse, SessionDetail } from '../types/session';

export const sessionsApi = {
  /**
   * 获取会话列表
   */
  getSessions: async (query: SessionsQuery): Promise<SessionsResponse> => {
    return apiClient.get<SessionsResponse, SessionsResponse>('/api/v2/sessions', { params: query });
  },

  /**
   * 获取会话详情
   */
  getSessionDetail: async (sessionId: string): Promise<SessionDetail> => {
    const detail = await apiClient.get<SessionDetail, SessionDetail>(`/api/v2/session/${sessionId}`);
    if (detail?.messages?.length) {
      detail.messages = detail.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
      }));
    }
    return detail;
  },

  /**
   * 删除会话
   */
  deleteSession: async (sessionId: string): Promise<void> => {
    return apiClient.delete(`/api/v2/session/${sessionId}`);
  },
};
