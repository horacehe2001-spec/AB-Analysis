import type { Message } from './chat';

export type Industry =
  | 'ecommerce'
  | 'finance'
  | 'healthcare'
  | 'education'
  | 'manufacturing'
  | 'internet'
  | 'hr'
  | 'marketing'
  | 'other';

export interface Session {
  session_id: string;
  created_at: string;
  updated_at: string;
  file_name: string;
  industry?: Industry;
  first_query: string;
  methods_used: string[];
  message_count: number;
}

export interface SessionDetail extends Session {
  messages: Message[];
  data_summary: DataSummary;
  report_conclusion?: string | null;
}

export interface ColumnStats {
  mean: number;
  std: number;
  min: number;
  max: number;
}

export interface DataSummary {
  rows: number;
  columns: number;
  column_names: string[];
  column_types: Record<string, string>;
  column_stats?: Record<string, ColumnStats>;
}

export interface SessionsQuery {
  page?: number;
  size?: number;
  keyword?: string;
  industry?: Industry;
  method?: string;
  start_date?: string;
  end_date?: string;
}

export interface SessionsResponse {
  total: number;
  page: number;
  items: Session[];
}
