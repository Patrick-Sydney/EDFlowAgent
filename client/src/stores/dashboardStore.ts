import { create } from 'zustand';
import { type Encounter, type Lane } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface DashboardState {
  encounters: Encounter[];
  isConnected: boolean;
  lastUpdate: Date | null;
  demoMode: boolean;
  user: { name: string; role: string };
  roleView: string;
  
  // Triage widget UI state
  triageOpen: boolean;
  triageEncounter: Encounter | null;
  
  // Actions
  setEncounters: (encounters: Encounter[]) => void;
  addEncounter: (encounter: Encounter) => void;
  updateEncounter: (encounter: Encounter) => void;
  setConnectionStatus: (connected: boolean) => void;
  setDemoMode: (demoMode: boolean) => void;
  setRoleView: (roleView: string) => void;
  resetDemo: () => Promise<void>;
  registerPatient: (payload: any) => Promise<void>;
  
  // Triage actions
  openTriage: (encounter: Encounter) => void;
  closeTriage: () => void;
  saveTriage: (payload: any) => Promise<any>;
  
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
  // Actor used for audit trails. No UI picker now.
  user: { name: "Demo User", role: "demo" },
  roleView: "full",
  
  // Triage widget UI state
  triageOpen: false,
  triageEncounter: null,

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

  // When roleView changes, map the actor role to match (helps audit look sane)
  setRoleView: (roleView) => {
    const view = roleView || "full";
    set((state) => ({
      roleView: view,
      user: { ...state.user, role: view === "full" ? "charge" : view } // default to 'charge' for full view
    }));
  },

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

  registerPatient: async (payload) => {
    try {
      const response = await apiRequest('POST', '/api/register', payload);
      if (response) {
        // Patient will be added via SSE, but we could also add it directly
        console.log('Patient registered:', response.encounter?.id);
      }
    } catch (error) {
      console.error('Failed to register patient:', error);
      throw error;
    }
  },

  // Triage actions
  openTriage: (encounter) => set({ triageOpen: true, triageEncounter: encounter }),
  
  closeTriage: () => set({ triageOpen: false, triageEncounter: null }),
  
  saveTriage: async (payload) => {
    try {
      const { user } = get();
      const response = await apiRequest('POST', '/api/triage/save', {
        ...payload,
        actorName: user.name,
        actorRole: user.role
      });
      // No need to set state here; SSE update will refresh encounter
      return response;
    } catch (error) {
      console.error('Failed to save triage:', error);
      throw error;
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
