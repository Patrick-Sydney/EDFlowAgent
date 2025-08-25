import { create } from 'zustand';
import { type Encounter, type Lane } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface DashboardState {
  encounters: Encounter[];
  isConnected: boolean;
  lastUpdate: Date | null;
  demoMode: boolean;
  
  // Actions
  setEncounters: (encounters: Encounter[]) => void;
  addEncounter: (encounter: Encounter) => void;
  updateEncounter: (encounter: Encounter) => void;
  setConnectionStatus: (connected: boolean) => void;
  setDemoMode: (demoMode: boolean) => void;
  resetDemo: () => Promise<void>;
  
  // Selectors
  getEncountersByLane: (lane: Lane) => Encounter[];
  getStats: () => {
    waiting: number;
    triage: number;
    roomed: number; 
    diagnostics: number;
    review: number;
    ready: number;
    discharged: number;
    total: number;
  };
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  encounters: [],
  isConnected: false,
  lastUpdate: null,
  demoMode: false,

  setEncounters: (encounters) => set({ 
    encounters,
    lastUpdate: new Date() 
  }),

  addEncounter: (encounter) => set((state) => ({ 
    encounters: [...state.encounters, encounter],
    lastUpdate: new Date()
  })),

  updateEncounter: (updatedEncounter) => set((state) => ({
    encounters: state.encounters.map(encounter => 
      encounter.id === updatedEncounter.id ? updatedEncounter : encounter
    ),
    lastUpdate: new Date()
  })),

  setConnectionStatus: (connected) => set({ isConnected: connected }),

  setDemoMode: (demoMode) => set({ demoMode }),

  resetDemo: async () => {
    try {
      const response = await apiRequest('POST', '/api/demo/reset');
      if (response) {
        // The SSE will trigger a reload, but we can also manually refresh
        const encounters = await apiRequest('GET', '/api/encounters') as Encounter[];
        set({ encounters, lastUpdate: new Date() });
      }
    } catch (error) {
      console.error('Failed to reset demo:', error);
    }
  },

  getEncountersByLane: (lane) => {
    const { encounters } = get();
    return encounters
      .filter(encounter => encounter.lane === lane)
      .sort((a, b) => new Date(a.arrivalTime).getTime() - new Date(b.arrivalTime).getTime());
  },

  getStats: () => {
    const { encounters } = get();
    const stats = {
      waiting: 0,
      triage: 0, 
      roomed: 0,
      diagnostics: 0,
      review: 0,
      ready: 0,
      discharged: 0,
      total: encounters.length
    };

    encounters.forEach(encounter => {
      if (encounter.lane in stats) {
        stats[encounter.lane as keyof typeof stats]++;
      }
    });

    return stats;
  }
}));
