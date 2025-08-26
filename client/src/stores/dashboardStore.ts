import { create } from 'zustand';
import { type Encounter, type Lane } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface TreatmentSpace {
  id: string;
  zone: string;
  type: string;
  monitored: boolean;
  oxygen: boolean;
  negativePressure: boolean;
  status: string;
  cleanEta: number | null;
  assignedEncounterId: string | null;
  notes: string | null;
}

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
  
  // Reception drawer state
  registerOpen: boolean;
  
  // Room management state
  spaces: TreatmentSpace[];
  roomOpen: boolean;
  roomEncounter: Encounter | null;
  
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
  
  // Registration actions
  openRegister: () => void;
  closeRegister: () => void;
  
  // Room management actions
  loadSpaces: () => Promise<any>;
  assignSpace: (encounterId: string, spaceId: string, reason?: string) => Promise<any>;
  reassignSpace: (encounterId: string, toSpaceId: string, reason: string) => Promise<any>;
  releaseSpace: (encounterId: string, makeCleaning?: boolean) => Promise<any>;
  markSpaceClean: (spaceId: string) => Promise<any>;
  markSpaceReady: (spaceId: string) => Promise<any>;
  openRoom: (encounter: Encounter) => void;
  closeRoom: () => void;
  
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
  
  // Reception drawer state  
  registerOpen: false,
  
  // Room management state
  spaces: [],
  roomOpen: false,
  roomEncounter: null,

  setEncounters: (encounters) => {
    const list = Array.isArray(encounters) ? encounters : Object.values(encounters ?? {});
    const norm = list.map((e: any) => ({ ...e, lane: e.lane ?? e.state ?? "waiting" })) as Encounter[];
    set({ 
      encounters: norm,
      lastUpdate: new Date() 
    });
  },

  addEncounter: (encounter) => set((state) => {
    const enc = { ...encounter, lane: encounter.lane ?? (encounter as any).state ?? "waiting" } as Encounter;
    const current = Array.isArray(state.encounters) ? state.encounters : Object.values(state.encounters ?? {}) as Encounter[];
    return {
      encounters: [enc, ...current],
      lastUpdate: new Date()
    };
  }),

  updateEncounter: (updatedEncounter) => set((state) => {
    const enc = { ...updatedEncounter, lane: updatedEncounter.lane ?? (updatedEncounter as any).state ?? "waiting" } as Encounter;
    const current = Array.isArray(state.encounters) ? state.encounters : Object.values(state.encounters ?? {}) as Encounter[];
    return {
      encounters: current.map((encounter) => 
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
  
  // Registration actions
  openRegister: () => set({ registerOpen: true }),
  closeRegister: () => set({ registerOpen: false }),
  
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
  },

  // Room management actions
  loadSpaces: async () => {
    try {
      const response = await fetch('/api/spaces');
      const result = await response.json();
      if (result?.ok) {
        set({ spaces: result.data });
      }
      return result;
    } catch (error) {
      console.error('Failed to load spaces:', error);
      return { ok: false, error: 'Failed to load spaces' };
    }
  },

  assignSpace: async (encounterId: string, spaceId: string, reason?: string) => {
    try {
      const { user } = get();
      const response = await apiRequest('POST', '/api/spaces/assign', {
        encounterId,
        spaceId,
        reason,
        actorName: user.name,
        actorRole: user.role
      });
      // Refresh spaces after assignment
      get().loadSpaces();
      return response;
    } catch (error) {
      console.error('Failed to assign space:', error);
      throw error;
    }
  },

  reassignSpace: async (encounterId: string, toSpaceId: string, reason: string) => {
    try {
      const { user } = get();
      const response = await apiRequest('POST', '/api/spaces/reassign', {
        encounterId,
        toSpaceId,
        reason,
        actorName: user.name,
        actorRole: user.role
      });
      // Refresh spaces after reassignment
      get().loadSpaces();
      return response;
    } catch (error) {
      console.error('Failed to reassign space:', error);
      throw error;
    }
  },

  releaseSpace: async (encounterId: string, makeCleaning: boolean = true) => {
    try {
      const { user } = get();
      const response = await apiRequest('POST', '/api/spaces/release', {
        encounterId,
        makeCleaning,
        actorName: user.name,
        actorRole: user.role
      });
      // Refresh spaces after release
      get().loadSpaces();
      return response;
    } catch (error) {
      console.error('Failed to release space:', error);
      throw error;
    }
  },

  markSpaceClean: async (spaceId: string) => {
    try {
      const response = await apiRequest('POST', '/api/spaces/clean/request', { spaceId });
      // Refresh spaces after marking clean
      get().loadSpaces();
      return response;
    } catch (error) {
      console.error('Failed to mark space clean:', error);
      throw error;
    }
  },

  markSpaceReady: async (spaceId: string) => {
    try {
      const response = await apiRequest('POST', '/api/spaces/clean/ready', { spaceId });
      // Refresh spaces after marking ready
      get().loadSpaces();
      return response;
    } catch (error) {
      console.error('Failed to mark space ready:', error);
      throw error;
    }
  },

  openRoom: (encounter: Encounter) => {
    set({ roomOpen: true, roomEncounter: encounter });
    get().loadSpaces();
  },

  closeRoom: () => set({ roomOpen: false, roomEncounter: null })
}));
