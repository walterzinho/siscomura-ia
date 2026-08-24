import { create } from 'zustand';

type ViewType =
  | { type: 'module'; moduleId: string }
  | { type: 'settings' }
  | { type: 'history' }
  | { type: 'prompts' }
  | { type: 'station' }
  | { type: 'home' };

interface AppState {
  currentView: ViewType;
  sidebarOpen: boolean;
  isGenerating: boolean;
  setView: (view: ViewType) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setGenerating: (generating: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: { type: 'home' },
  sidebarOpen: true,
  isGenerating: false,
  setView: (view) => set({ currentView: view }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setGenerating: (generating) => set({ isGenerating: generating }),
}));
