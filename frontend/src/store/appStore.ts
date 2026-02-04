import { create } from 'zustand';

export type ModuleType = 'hypothesis' | 'capability' | 'spc';

interface AppStore {
  activeModule: ModuleType;
  setActiveModule: (module: ModuleType) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  activeModule: 'hypothesis',
  setActiveModule: (module) => set({ activeModule: module }),
}));
