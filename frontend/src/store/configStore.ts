import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModelConfig, ModelProvider, PromptTemplates } from '../types/config';
import type { TestConnectionResponse } from '../types/api';
import { configApi } from '../api/config';

interface ConfigStore {
  modelConfig: ModelConfig;
  promptTemplates: PromptTemplates;
  isLoading: boolean;
  error: string | null;

  // Actions
  setProvider: (provider: ModelProvider) => void;
  setApiKey: (apiKey: string) => void;
  setBaseUrl: (baseUrl: string) => void;
  setModel: (model: string) => void;
  setTemperature: (temperature: number) => void;
  setMaxTokens: (maxTokens: number) => void;
  setTopP: (topP: number) => void;
  saveConfig: () => Promise<void>;
  loadConfig: () => Promise<void>;
  testConnection: () => Promise<TestConnectionResponse>;
  setPromptTemplate: (key: keyof PromptTemplates, value: string) => void;
  loadPrompts: () => Promise<void>;
  savePrompts: () => Promise<void>;
  resetToDefault: () => void;
}

const DEFAULT_CONFIG: ModelConfig = {
  provider: 'zhipu',
  api_key: '',
  base_url: 'https://open.bigmodel.cn/api/paas/v4',
  model: 'GLM-4.7',
  temperature: 0.7,
  max_tokens: 4096,
  top_p: 1.0,
};

const DEFAULT_PROMPTS: PromptTemplates = {
  intent: '你是一个统计分析助手。根据用户问题，提取自变量(X)、因变量(Y)、任务类型与特殊要求，并以 JSON 输出。',
  planning: '根据 intent 与 data_summary 输出分析计划 JSON（method 与 params）。',
  interpret: '根据 analysis_result 输出业务化解释、建议与图表选择。',
};

export const useConfigStore = create<ConfigStore>()(
  persist(
    (set, get) => ({
      modelConfig: DEFAULT_CONFIG,
      promptTemplates: DEFAULT_PROMPTS,
      isLoading: false,
      error: null,

      setProvider: (provider) =>
        set((state) => ({
          modelConfig: { ...state.modelConfig, provider },
        })),

      setApiKey: (api_key) =>
        set((state) => ({
          modelConfig: { ...state.modelConfig, api_key },
        })),

      setBaseUrl: (base_url) =>
        set((state) => ({
          modelConfig: { ...state.modelConfig, base_url },
        })),

      setModel: (model) =>
        set((state) => ({
          modelConfig: { ...state.modelConfig, model },
        })),

      setTemperature: (temperature) =>
        set((state) => ({
          modelConfig: { ...state.modelConfig, temperature },
        })),

      setMaxTokens: (max_tokens) =>
        set((state) => ({
          modelConfig: { ...state.modelConfig, max_tokens },
        })),

      setTopP: (top_p) =>
        set((state) => ({
          modelConfig: { ...state.modelConfig, top_p },
        })),

      saveConfig: async () => {
        set({ isLoading: true, error: null });
        try {
          await configApi.saveModelConfig(get().modelConfig);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '保存配置失败';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      loadConfig: async () => {
        set({ isLoading: true, error: null });
        try {
          const config = await configApi.getModelConfig();
          set({ modelConfig: config });
        } catch (error) {
          // Use default config if loading fails
          console.warn('Failed to load config, using defaults');
        } finally {
          set({ isLoading: false });
        }
      },

      testConnection: async () => {
        const { modelConfig } = get();
        set({ isLoading: true, error: null });
        try {
          const response = await configApi.testConnection({
            provider: modelConfig.provider,
            api_key: modelConfig.api_key,
            base_url: modelConfig.base_url,
          });
          return response;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '连接测试失败';
          set({ error: errorMessage });
          return { success: false, message: errorMessage };
        } finally {
          set({ isLoading: false });
        }
      },

      setPromptTemplate: (key, value) =>
        set((state) => ({
          promptTemplates: { ...state.promptTemplates, [key]: value },
        })),

      loadPrompts: async () => {
        set({ isLoading: true, error: null });
        try {
          const templates = await configApi.getPromptTemplates();
          set({ promptTemplates: templates });
        } catch {
          // keep defaults/local values
        } finally {
          set({ isLoading: false });
        }
      },

      savePrompts: async () => {
        set({ isLoading: true, error: null });
        try {
          await configApi.savePromptTemplates(get().promptTemplates);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '保存 Prompt 模板失败';
          set({ error: errorMessage });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      resetToDefault: () =>
        set({
          modelConfig: DEFAULT_CONFIG,
          promptTemplates: DEFAULT_PROMPTS,
        }),
    }),
    {
      name: 'hypothesis-testing-config',
      partialize: (state) => ({
        modelConfig: state.modelConfig,
        promptTemplates: state.promptTemplates,
      }),
    }
  )
);
