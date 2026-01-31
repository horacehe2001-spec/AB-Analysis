export type ModelProvider = 'claude' | 'openai' | 'zhipu' | 'qwen' | 'custom';

export interface ModelConfig {
  provider: ModelProvider;
  api_key: string;
  base_url?: string;
  model: string;
  temperature: number;
  max_tokens: number;
  top_p: number;
}

export interface PromptTemplates {
  intent: string;
  planning: string;
  interpret: string;
}

export interface ConfigState {
  modelConfig: ModelConfig;
  promptTemplates: PromptTemplates;
}
