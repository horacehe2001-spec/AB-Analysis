import apiClient from './index';
import type { ModelConfig, PromptTemplates } from '../types/config';
import type { TestConnectionRequest, TestConnectionResponse } from '../types/api';

export const configApi = {
  /**
   * 获取模型配置
   */
  getModelConfig: async (): Promise<ModelConfig> => {
    return apiClient.get<ModelConfig, ModelConfig>('/api/v2/config/model');
  },

  /**
   * 保存模型配置
   */
  saveModelConfig: async (config: ModelConfig): Promise<void> => {
    return apiClient.put<void, void>('/api/v2/config/model', config);
  },

  /**
   * 测试API连接
   */
  testConnection: async (data: TestConnectionRequest): Promise<TestConnectionResponse> => {
    return apiClient.post<TestConnectionResponse, TestConnectionResponse>('/api/v2/config/model/test', data);
  },

  /**
   * 获取Prompt模板
   */
  getPromptTemplates: async (): Promise<PromptTemplates> => {
    return apiClient.get<PromptTemplates, PromptTemplates>('/api/v2/config/prompts');
  },

  /**
   * 保存Prompt模板
   */
  savePromptTemplates: async (templates: PromptTemplates): Promise<void> => {
    return apiClient.put<void, void>('/api/v2/config/prompts', templates);
  },
};
