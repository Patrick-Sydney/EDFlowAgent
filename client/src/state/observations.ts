import { create } from "zustand";

export type ObsPoint = {
  t: string; rr?: number; spo2?: number; hr?: number; sbp?: number; temp?: number; ews?: number;
  source?: "triage" | "obs" | "device";
};

type ObsState = {
  byPatient: Record<string, ObsPoint[]>;
  addObs: (patientId: string, point: ObsPoint) => void;
  getLastVitals: (patientId: string) => ObsPoint | undefined;
};

export const useObsStore = create<ObsState>((set, get) => ({
  byPatient: {},
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