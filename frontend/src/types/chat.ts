export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  analysis?: AnalysisResult;
}

export interface AnalysisResult {
  method: string;
  method_name: string;
  p_value: number;
  effect_size: EffectSize;
  significant: boolean;
  interpretation: string;
  suggestions: string[];
  visualizations: ChartConfig[];
}

export interface EffectSize {
  type: 'cohens_d' | 'r_squared' | 'eta_squared' | 'cramers_v';
  value: number;
  level: 'small' | 'medium' | 'large';
}

export interface ChartConfig {
  type: 'scatter' | 'box' | 'bar' | 'distribution' | 'residual' | 'control_chart';
  title: string;
  data: any;
  xLabel?: string;
  yLabel?: string;
}

export interface MultiAnalysisResult {
  xVariable: string;
  yVariable: string;
  analysis: AnalysisResult;
}

export interface ChatState {
  sessionId: string | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}
