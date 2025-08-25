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

  setEncounters: (encounters) => {
    const list = Array.isArray(encounters) ? encounters : Object.values(encounters ?? {});
    const norm = list.map((e: any) => ({ ...e, lane: e.lane ?? e.state ?? "waiting" }));
    set({ 
      encounters: norm,
      lastUpdate: new Date() 
    });
  },

  addEncounter: (encounter) => set((state) => {
    const enc = { ...encounter, lane: encounter.lane ?? encounter.state ?? "waiting" };
    const current = Array.isArray(state.encounters) ? state.encounters : Object.values(state.encounters ?? {});
    return {
      encounters: [enc, ...current],
      lastUpdate: new Date()
    };
  }),

  updateEncounter: (updatedEncounter) => set((state) => {
    const enc = { ...updatedEncounter, lane: updatedEncounter.lane ?? updatedEncounter.state ?? "waiting" };
    const current = Array.isArray(state.encounters) ? state.encounters : Object.values(state.encounters ?? {});
    return {
      encounters: current.map((encounter: any) => 
        encounter.id === enc.id ? enc : encounter
      ),
      lastUpdate: new Date()
    };
  }),

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
    const raw = (get() as any).encounters;
    const asArray = Array.isArray(raw) ? raw : Object.values(raw ?? {});
    const normed = asArray.map((e: any) => ({
      ...e,
      lane: e?.lane ?? e?.state ?? "waiting",
    }));
    return normed
      .filter((enc: any) => enc.lane === lane)
      .sort((a: any, b: any) =>
        new Date(a.arrivalTime ?? a.createdAt ?? 0).getTime() -
        new Date(b.arrivalTime ?? b.createdAt ?? 0).getTime()
      );
  },

  getStats: () => {
    const raw = (get() as any).encounters;
    const asArray = Array.isArray(raw) ? raw : Object.values(raw ?? {});
    const encounters = asArray.map((e: any) => ({
      ...e,
      lane: e?.lane ?? e?.state ?? "waiting",
    }));
    
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

    encounters.forEach((encounter: any) => {
      if (encounter.lane in stats) {
        stats[encounter.lane as keyof typeof stats]++;
      }
    });

    return stats;
  }
}));
