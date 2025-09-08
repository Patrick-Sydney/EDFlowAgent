import { create } from "zustand";

export type Observation = {
  t: string; rr?: number; hr?: number; sbp?: number; spo2?: number; temp?: number;
  loc?: "A"|"V"|"P"|"U";
  o2?: { device?: string; lpm?: number; onOxygen?: boolean };
  source: "obs" | "device";
  ews: number;
  algoId: string; // "adult-simple-v1" etc.
};

// Legacy type for backward compatibility
export type ObsPoint = {
  t: string;
  rr?: number; spo2?: number; hr?: number; sbp?: number; temp?: number; ews?: number;
  source?: "triage" | "obs" | "device";
};

type VitalsState = {
  byId: Record<string, Observation[]>;
  append: (patientId: string, obs: Observation) => void;
  last: (patientId: string) => Observation | undefined;
  lastEws: (patientId: string) => number | undefined;
  previousEWS: (patientId: string) => number | undefined;
  hydrate?: (seed: Record<string, Observation[]>) => void;
  // Legacy compatibility methods
  add: (patientId: string, obs: ObsPoint) => void;
  list: (patientId: string) => Observation[];
};

function createVitalsStore() {
  return create<VitalsState>((set, get) => ({
    byId: {},
    append: (patientId, obs) =>
      set((s) => ({
        byId: {
          ...s.byId,
          [patientId]: [ ...(s.byId[patientId] ?? []), obs ],
        },
      })),
    last: (patientId) => {
      const arr = get().byId[patientId] ?? [];
      return arr[arr.length - 1];
    },
    lastEws: (patientId) => get().last(patientId)?.ews,
    previousEWS: (patientId) => {
      const arr = get().byId[patientId] ?? [];
      const ewsPoints = arr.filter(p => typeof p.ews === 'number');
      if (ewsPoints.length < 2) return undefined;
      return ewsPoints[ewsPoints.length - 2]?.ews;
    },
    hydrate: (seed) => set({ byId: { ...seed } }),
    // Legacy compatibility methods
    add: (patientId, obs) => {
      const fullObs: Observation = {
        ...obs,
        ews: obs.ews ?? 0,
        algoId: "adult-simple-v1",
        source: obs.source === "triage" ? "obs" : (obs.source ?? "obs")
      } as Observation;
      get().append(patientId, fullObs);
    },
    list: (patientId) => get().byId[patientId] ?? [],
  }));
}

// ✅ Singleton across duplicate module loads / HMR
const g = globalThis as any;
export const useVitalsStore =
  g.__ED_VITALS_STORE__ || (g.__ED_VITALS_STORE__ = createVitalsStore());

// DEV sentinel: warn if someone somehow created a second instance
if (import.meta?.env?.DEV) {
  if (!g.__ED_VITALS_STORE_MARK__) {
    g.__ED_VITALS_STORE_MARK__ = useVitalsStore;
    console.log("[vitalsStore] singleton created", useVitalsStore);
  } else if (g.__ED_VITALS_STORE_MARK__ !== useVitalsStore) {
    console.warn("[vitalsStore] duplicate instance detected — check import paths");
  }
}

// Legacy singleton export for backward compatibility
export const vitalsStore = {
  add: (patientId: string, obs: ObsPoint) => useVitalsStore.getState().add(patientId, obs),
  last: (patientId: string) => useVitalsStore.getState().last(patientId),
  list: (patientId: string) => useVitalsStore.getState().list(patientId),
  previousEWS: (patientId: string) => useVitalsStore.getState().previousEWS(patientId),
  subscribe: (fn: () => void) => useVitalsStore.subscribe(fn),
};

// Legacy hook exports for backward compatibility
export function useVitalsList(patientId: string | number) {
  const id = String(patientId ?? "");
  return useVitalsStore((s) => s.byId[id] ?? []);
}

export function useVitalsLast(patientId: string | number) {
  const id = String(patientId ?? "");
  return useVitalsStore((s) => s.last(id));
}

export function useVitalsPreviousEWS(patientId: string | number) {
  const id = String(patientId ?? "");
  return useVitalsStore((s) => s.previousEWS(id));
}