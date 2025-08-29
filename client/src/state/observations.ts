import { useCallback } from "react";
import { create } from "zustand";

export type ObsPoint = {
  t: string; rr?: number; spo2?: number; hr?: number; sbp?: number; temp?: number; ews?: number;
  source?: "triage" | "obs" | "device";
};

type ObsState = {
  byPatient: Record<string, ObsPoint[]>;
  setPoints: (patientId: string, points: ObsPoint[]) => void;
  addObs: (patientId: string, point: ObsPoint) => void;
  getLastVitals: (patientId: string) => ObsPoint | undefined;
};

export const useObsStore = create<ObsState>((set, get) => ({
  byPatient: {},
  setPoints: (patientId, points) => set((s) => ({ 
    byPatient: { ...s.byPatient, [patientId]: [...points].sort((a,b)=>Date.parse(a.t)-Date.parse(b.t)) } 
  })),
  addObs: (patientId, point) =>
    set((s) => {
      const list = [...(s.byPatient[patientId] || []), point]
        .sort((a, b) => Date.parse(a.t) - Date.parse(b.t));
      return { byPatient: { ...s.byPatient, [patientId]: list } };
    }),
  getLastVitals: (patientId) => {
    const list = get().byPatient[patientId] || [];
    return list[list.length - 1];
  },
}));

// Hooks that SUBSCRIBE to the specific patient's slice (so UI re-renders)
export function usePatientObsList(patientId: string): ObsPoint[] {
  // selector captures patientId; useCallback keeps stable between renders
  const selector = useCallback((s: ObsState) => s.byPatient[patientId] || [], [patientId]);
  return useObsStore(selector);
}

export function usePatientLastVitals(patientId: string): ObsPoint | undefined {
  const list = usePatientObsList(patientId);
  return list.length ? list[list.length - 1] : undefined;
}