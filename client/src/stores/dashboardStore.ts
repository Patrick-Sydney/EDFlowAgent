import { create } from 'zustand';
import { type Encounter, type Lane } from '@shared/schema';

interface DashboardState {
  encounters: Encounter[];
  isConnected: boolean;
  lastUpdate: Date | null;
  
  // Actions
  setEncounters: (encounters: Encounter[]) => void;
  addEncounter: (encounter: Encounter) => void;
  updateEncounter: (encounter: Encounter) => void;
  setConnectionStatus: (connected: boolean) => void;
  
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
