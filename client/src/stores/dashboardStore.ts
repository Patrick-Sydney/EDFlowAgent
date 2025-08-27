import { create } from 'zustand';
import { type Encounter, type Lane } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { onNewObservation } from '@/utils/monitoring';

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
  
  // Shared preset for RoomManagementDrawer filters
  spaceFilterPreset: any;
  setSpaceFilterPreset: (preset: any) => void;
  clearSpaceFilterPreset: () => void;
  
  // Actions
  setEncounters: (encounters: Encounter[]) => void;
  addEncounter: (encounter: Encounter) => void;
  updateEncounter: (encounter: Encounter) => void;
  addObservation: (patientId: string, obs: any) => void;
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
  roleView: "charge",
  
  // Triage widget UI state
  triageOpen: false,
  triageEncounter: null,
  
  // Reception drawer state  
  registerOpen: false,
  
  // Room management state
  spaces: [],
  roomOpen: false,
  roomEncounter: null,
  
  // Shared preset for RoomManagementDrawer filters
  spaceFilterPreset: null,

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

  // Intelligent observation management with monitoring system
  addObservation: (patientId, obs) => set((state) => {
    const current = Array.isArray(state.encounters) ? state.encounters : Object.values(state.encounters ?? {}) as Encounter[];
    const patientIndex = current.findIndex(p => p.id === patientId);
    if (patientIndex === -1) return state;

    const patient = current[patientIndex];
    
    // Create mock observations array from triage vitals + new observation
    const observations = [
      ...(patient.triageHr ? [{ id: `hr-${patient.id}`, type: "HR" as const, value: patient.triageHr.toString(), unit: "bpm", takenAt: patient.arrivalTime, recordedBy: "Triage" }] : []),
      ...(patient.triageRr ? [{ id: `rr-${patient.id}`, type: "RR" as const, value: patient.triageRr.toString(), unit: "/min", takenAt: patient.arrivalTime, recordedBy: "Triage" }] : []),
      ...(patient.triageSpo2 ? [{ id: `spo2-${patient.id}`, type: "SpO2" as const, value: patient.triageSpo2.toString(), unit: "%", takenAt: patient.arrivalTime, recordedBy: "Triage" }] : []),
      obs
    ];
    
    // Convert Encounter to PatientLite format for monitoring system
    const patientLite = {
      id: patient.id,
      ats: patient.ats as any,
      observations,
      tasks: [],
      flags: { 
        suspectedSepsis: patient.isolationRequired === "true" 
      }
    };

    try {
      // Use monitoring system to calculate EWS and update tasks
      const { ews, cadenceMinutes } = onNewObservation(patientLite);
      
      // Store the monitoring result in a way that doesn't break the Encounter type
      const updatedPatient = {
        ...patient,
        // Use custom properties that won't conflict with schema
        _monitoringEws: { score: ews.score, riskLevel: ews.band as any, calculatedAt: new Date().toISOString() },
        _monitoringCadence: cadenceMinutes,
        _lastObservation: obs
      };

      return {
        encounters: current.map((encounter, i) => 
          i === patientIndex ? updatedPatient as any : encounter
        ),
        lastUpdate: new Date()
      };
    } catch (error) {
      console.error('Monitoring system error:', error);
      return state; // Return unchanged state if monitoring fails
    }
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

  // Reception methods
  saveDemographics: async (payload: { id: string; name: string; nhi: string; sex: string; age: string }) => {
    try {
      const response = await fetch("/api/encounters/demographics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      
      if (result?.ok) {
        // Update will come via SSE, but we can optimistically update
        set(state => ({
          encounters: state.encounters.map(e =>
            e.id === payload.id 
              ? { ...e, name: payload.name, nhi: payload.nhi, sex: payload.sex, age: Number(payload.age) || null }
              : e
          )
        }));
      }
      
      return result;
    } catch (error) {
      console.error("Error saving demographics:", error);
      return { ok: false, error: "Failed to save demographics" };
    }
  },

  reprintWristband: async (id: string) => {
    // Demo implementation - in real system would call printer API
    return { ok: true, data: { id, type: "wristband" } };
  },

  reprintLabels: async (id: string) => {
    // Demo implementation - in real system would call printer API  
    return { ok: true, data: { id, type: "labels" } };
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

  closeRoom: () => set({ roomOpen: false, roomEncounter: null }),
  
  // Space filter preset actions
  setSpaceFilterPreset: (preset) => set({ spaceFilterPreset: preset }),
  clearSpaceFilterPreset: () => set({ spaceFilterPreset: null }),
}));
