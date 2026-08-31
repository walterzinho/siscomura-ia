import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ViewType =
  | { type: 'module'; moduleId: string }
  | { type: 'settings' }
  | { type: 'history' }
  | { type: 'prompts' }
  | { type: 'station' }
  | { type: 'versions' }
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

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentView: { type: 'home' },
      sidebarOpen: true,
      isGenerating: false,
      setView: (view) => set({ currentView: view }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setGenerating: (generating) => set({ isGenerating: generating }),
    }),
    {
      name: 'siscomura-ui',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined') return localStorage;
        // SSR fallback: no-op storage
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        // Only persist UI preferences, not transient state
        currentView: state.currentView,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);
