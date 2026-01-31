import type { AnalysisResult, ChartConfig } from './chat';
import type { Industry, DataSummary } from './session';

// Chat API
export interface ChatRequest {
  session_id?: string;
  message: string;
  file?: string; // base64
  industry?: Industry;
}

export interface ChatResponse {
  session_id: string;
  reply: string;
  analysis?: AnalysisResult;
  suggestions: string[];
  visualizations: ChartConfig[];
}

// Upload API
export interface UploadResponse {
  session_id: string;
  file_name: string;
  data_summary: DataSummary;
}

// Export API
export interface ExportRequest {
  session_id: string;
  format: 'md' | 'docx';
  include_charts: boolean;
}

export interface ExportResponse {
  download_url: string;
  file_name: string;
}

// Model Config Test
export interface TestConnectionRequest {
  provider: string;
  api_key: string;
  base_url?: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
}
