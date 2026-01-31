import { create } from 'zustand';
import type { Session, SessionsQuery, DataSummary, Industry } from '../types/session';
import { sessionsApi } from '../api/sessions';

interface SessionStore {
  sessions: Session[];
  total: number;
  currentPage: number;
  isLoading: boolean;
  error: string | null;

  // Current data context
  currentFile: string | null;
  dataSummary: DataSummary | null;
  industry: Industry | null;

  // Actions
  fetchSessions: (query: SessionsQuery) => Promise<void>;
  setCurrentFile: (fileName: string | null, summary: DataSummary | null) => void;
  setIndustry: (industry: Industry | null) => void;
  clearCurrent: () => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessions: [],
  total: 0,
  currentPage: 1,
  isLoading: false,
  error: null,
  currentFile: null,
  dataSummary: null,
  industry: null,

  fetchSessions: async (query) => {
    set({ isLoading: true, error: null });
    try {
      const response = await sessionsApi.getSessions(query);
      set({
        sessions: response.items,
        total: response.total,
        currentPage: query.page || 1,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '获取历史记录失败';
      set({ error: errorMessage });
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentFile: (fileName, summary) => set({ currentFile: fileName, dataSummary: summary }),

  setIndustry: (industry) => set({ industry }),

  clearCurrent: () => set({ currentFile: null, dataSummary: null, industry: null }),
}));
