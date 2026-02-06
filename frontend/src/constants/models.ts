import type { ModelProvider } from '../types/config';

export interface ProviderOption {
  value: ModelProvider;
  label: string;
  baseUrl: string;
}

export interface ModelOption {
  value: string;
  label: string;
}

export const MODEL_PROVIDERS: ProviderOption[] = [
  {
    value: 'claude',
    label: 'Claude (Anthropic)',
    baseUrl: 'https://api.anthropic.com'
  },
  {
    value: 'openai',
    label: 'OpenAI',
    baseUrl: 'https://api.openai.com'
  },
  {
    value: 'zhipu',
    label: '智谱AI',
    baseUrl: 'https://open.bigmodel.cn/api/paas/v4'
  },
  {
    value: 'qwen',
    label: '通义千问',
    baseUrl: 'https://dashscope.aliyuncs.com/api'
  },
  {
    value: 'custom',
    label: '自定义',
    baseUrl: ''
  },
];

export const MODELS: Record<ModelProvider, ModelOption[]> = {
  claude: [
    { value: 'claude-3-opus', label: 'Claude 3 Opus' },
    { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
    { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
  ],
  openai: [
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
  zhipu: [
    { value: 'GLM-4.7', label: 'GLM-4.7' },
    { value: 'glm-4-plus', label: 'GLM-4 Plus' },
    { value: 'glm-4', label: 'GLM-4' },
    { value: 'glm-4-flash', label: 'GLM-4 Flash' },
  ],
  qwen: [
    { value: 'qwen-max', label: 'Qwen Max' },
    { value: 'qwen-plus', label: 'Qwen Plus' },
    { value: 'qwen-turbo', label: 'Qwen Turbo' },
  ],
  custom: [],
};

export const getProviderBaseUrl = (provider: ModelProvider): string => {
  return MODEL_PROVIDERS.find(p => p.value === provider)?.baseUrl || '';
};

export const getProviderLabel = (provider: ModelProvider): string => {
  return MODEL_PROVIDERS.find(p => p.value === provider)?.label || '';
};

export const getModelsForProvider = (provider: ModelProvider): ModelOption[] => {
  return MODELS[provider] || [];
};
