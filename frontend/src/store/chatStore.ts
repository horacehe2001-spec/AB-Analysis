import { create } from 'zustand';
import type { Message, MultiAnalysisResult } from '../types/chat';
import { chatApi } from '../api/chat';
import type { ChatRequest } from '../types/api';

interface ChatStore {
  sessionId: string | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  multiAnalysisResults: MultiAnalysisResult[];
  conclusion: string | null;
  isConclusionLoading: boolean;

  // Actions
  setSessionId: (id: string | null) => void;
  addMessage: (message: Message) => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  setError: (error: string | null) => void;
  addMultiAnalysisResult: (result: MultiAnalysisResult) => void;
  clearMultiAnalysisResults: () => void;
  setConclusion: (conclusion: string | null) => void;
  setConclusionLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  sessionId: null,
  messages: [],
  isLoading: false,
  error: null,
  multiAnalysisResults: [],
  conclusion: null,
  isConclusionLoading: false,

  setSessionId: (id) => set({ sessionId: id }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  sendMessage: async (content) => {
    const state = get();

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    set({ isLoading: true, error: null });
    get().addMessage(userMessage);

    try {
      const request: ChatRequest = {
        session_id: state.sessionId || undefined,
        message: content,
      };

      const response = await chatApi.sendMessage(request);

      // Update session ID if new
      if (!state.sessionId && response.session_id) {
        set({ sessionId: response.session_id });
      }

      // Add AI message
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
        analysis: response.analysis,
      };

      get().addMessage(aiMessage);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发送消息失败';
      set({ error: errorMessage });

      // Add error as AI message so user can see it
      const errorReply: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `分析出错: ${errorMessage}`,
        timestamp: new Date(),
      };
      get().addMessage(errorReply);
    } finally {
      set({ isLoading: false });
    }
  },

  clearMessages: () => set({ messages: [], sessionId: null, error: null, multiAnalysisResults: [], conclusion: null, isConclusionLoading: false }),

  setError: (error) => set({ error }),

  addMultiAnalysisResult: (result) =>
    set((state) => ({
      multiAnalysisResults: [...state.multiAnalysisResults, result],
    })),

  clearMultiAnalysisResults: () => set({ multiAnalysisResults: [] }),

  setConclusion: (conclusion) => set({ conclusion }),
  setConclusionLoading: (loading) => set({ isConclusionLoading: loading }),
}));
