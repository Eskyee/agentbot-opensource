import { create } from 'zustand';

interface DashboardState {
  selectedAgentId: string | null;
  setSelectedAgentId: (id: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedAgentId: null,
  setSelectedAgentId: (id) => set({ selectedAgentId: id }),
}));
